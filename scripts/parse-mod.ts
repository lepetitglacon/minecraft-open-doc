#!/usr/bin/env npx ts-node

import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface BlockModel {
  parent?: string;
  textures?: Record<string, string>;
}

interface BlockState {
  variants?: Record<string, { model: string } | Array<{ model: string }>>;
  multipart?: Array<{ apply: { model: string } | Array<{ model: string }> }>;
}

interface BlockDefinition {
  id: string;
  displayName: string;
  shape: string;
  textures: Record<string, string>;
  transparent?: boolean;
  renderType?: string;
}

interface ModDefinition {
  namespace: string;
  name: string;
  version: string;
  textureBasePath: string;
  blocks: BlockDefinition[];
}

const TEMP_DIR = '/tmp/mod-parser';
const PROJECT_ROOT = path.resolve(__dirname, '..');

function toDisplayName(id: string): string {
  return id
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function downloadFile(url: string, dest: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, (response) => {
      if (response.statusCode === 302 || response.statusCode === 301) {
        const redirectUrl = response.headers.location;
        if (redirectUrl) {
          file.close();
          downloadFile(redirectUrl, dest).then(resolve).catch(reject);
          return;
        }
      }
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(dest, () => {});
      reject(err);
    });
  });
}

async function cloneRepo(repoUrl: string): Promise<string> {
  const repoName = repoUrl.split('/').pop()?.replace('.git', '') || 'mod';
  const clonePath = path.join(TEMP_DIR, repoName);

  if (fs.existsSync(clonePath)) {
    console.log(`Repository already exists at ${clonePath}, using existing...`);
    return clonePath;
  }

  console.log(`Cloning ${repoUrl}...`);
  fs.mkdirSync(TEMP_DIR, { recursive: true });

  try {
    execSync(`git clone --depth 1 ${repoUrl} ${clonePath}`, {
      stdio: 'inherit',
      timeout: 120000
    });
  } catch (error) {
    throw new Error(`Failed to clone repository: ${error}`);
  }

  return clonePath;
}

function findAssetsDir(repoPath: string): string | null {
  // Common locations for assets in mod repos
  const possiblePaths = [
    'src/main/resources/assets',
    'src/generated/resources/assets',
    'resources/assets',
    'assets',
    'common/src/main/resources/assets',
    'forge/src/main/resources/assets',
    'fabric/src/main/resources/assets',
  ];

  for (const p of possiblePaths) {
    const fullPath = path.join(repoPath, p);
    if (fs.existsSync(fullPath)) {
      return fullPath;
    }
  }

  // Try to find assets directory recursively
  function findDir(dir: string, target: string, depth: number = 0): string | null {
    if (depth > 5) return null;

    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isDirectory()) {
          if (entry.name === target) {
            return path.join(dir, entry.name);
          }
          if (!entry.name.startsWith('.') && entry.name !== 'node_modules') {
            const found = findDir(path.join(dir, entry.name), target, depth + 1);
            if (found) return found;
          }
        }
      }
    } catch {
      // Ignore permission errors
    }
    return null;
  }

  return findDir(repoPath, 'assets');
}

function getNamespaces(assetsDir: string): string[] {
  return fs.readdirSync(assetsDir, { withFileTypes: true })
    .filter(entry => entry.isDirectory() && !entry.name.startsWith('.'))
    .map(entry => entry.name);
}

function parseBlockState(content: string): BlockState {
  return JSON.parse(content);
}

function parseBlockModel(content: string): BlockModel {
  return JSON.parse(content);
}

function resolveTexture(
  texturePath: string,
  modelTextures: Record<string, string>,
  allModels: Map<string, BlockModel>
): string {
  // Handle texture variables like #all, #top, etc.
  if (texturePath.startsWith('#')) {
    const varName = texturePath.slice(1);
    const resolved = modelTextures[varName];
    if (resolved) {
      return resolveTexture(resolved, modelTextures, allModels);
    }
    return texturePath;
  }

  // Handle namespace:path format
  if (texturePath.includes(':')) {
    const [ns, p] = texturePath.split(':');
    return `${p.replace('block/', '')}.png`;
  }

  // Handle block/texture_name format
  if (texturePath.includes('/')) {
    return `${texturePath.split('/').pop()}.png`;
  }

  return `${texturePath}.png`;
}

function getModelTextures(
  modelPath: string,
  modelsDir: string,
  cache: Map<string, Record<string, string>> = new Map()
): Record<string, string> {
  if (cache.has(modelPath)) {
    return cache.get(modelPath)!;
  }

  let actualPath = modelPath;
  if (modelPath.includes(':')) {
    actualPath = modelPath.split(':')[1];
  }
  actualPath = actualPath.replace('block/', '');

  const modelFile = path.join(modelsDir, 'block', `${actualPath}.json`);

  if (!fs.existsSync(modelFile)) {
    cache.set(modelPath, {});
    return {};
  }

  try {
    const model = parseBlockModel(fs.readFileSync(modelFile, 'utf-8'));
    let textures: Record<string, string> = {};

    // Get parent textures first
    if (model.parent) {
      let parentPath = model.parent;
      // Handle minecraft:block/cube_all etc.
      if (parentPath.startsWith('minecraft:')) {
        // Skip minecraft parent models, we'll use defaults
      } else {
        const parentTextures = getModelTextures(parentPath, modelsDir, cache);
        textures = { ...parentTextures };
      }
    }

    // Override with this model's textures
    if (model.textures) {
      textures = { ...textures, ...model.textures };
    }

    cache.set(modelPath, textures);
    return textures;
  } catch (error) {
    cache.set(modelPath, {});
    return {};
  }
}

function determineShape(modelPath: string, modelTextures: Record<string, string>): string {
  const lowerPath = modelPath.toLowerCase();

  if (lowerPath.includes('slab')) {
    if (lowerPath.includes('top')) return 'slab_top';
    return 'slab_bottom';
  }
  if (lowerPath.includes('stairs')) return 'stairs';

  return 'full_cube';
}

function isTransparent(blockId: string, modelTextures: Record<string, string>): boolean {
  const transparentKeywords = ['glass', 'leaves', 'ice', 'water', 'portal'];
  return transparentKeywords.some(kw => blockId.includes(kw));
}

async function parseModFromRepo(
  repoUrl: string,
  options: { namespace?: string; modName?: string; version?: string } = {}
): Promise<void> {
  console.log('\n=== Minecraft Mod Parser ===\n');

  // Clone repository
  const repoPath = await cloneRepo(repoUrl);

  // Find assets directory
  const assetsDir = findAssetsDir(repoPath);
  if (!assetsDir) {
    throw new Error('Could not find assets directory in repository');
  }
  console.log(`Found assets directory: ${assetsDir}`);

  // Get namespaces
  const namespaces = getNamespaces(assetsDir);
  console.log(`Found namespaces: ${namespaces.join(', ')}`);

  for (const namespace of namespaces) {
    if (namespace === 'minecraft') continue; // Skip vanilla minecraft

    const nsPath = path.join(assetsDir, namespace);
    const blockstatesDir = path.join(nsPath, 'blockstates');
    const modelsDir = path.join(nsPath, 'models');
    const texturesDir = path.join(nsPath, 'textures', 'block');

    if (!fs.existsSync(blockstatesDir)) {
      console.log(`No blockstates found for ${namespace}, skipping...`);
      continue;
    }

    console.log(`\nProcessing namespace: ${namespace}`);

    const blocks: BlockDefinition[] = [];
    const textureCache = new Map<string, Record<string, string>>();
    const usedTextures = new Set<string>();

    // Parse all blockstates
    const blockstateFiles = fs.readdirSync(blockstatesDir)
      .filter(f => f.endsWith('.json'));

    console.log(`Found ${blockstateFiles.length} blockstate files`);

    for (const bsFile of blockstateFiles) {
      const blockId = bsFile.replace('.json', '');
      const bsPath = path.join(blockstatesDir, bsFile);

      try {
        const blockstate = parseBlockState(fs.readFileSync(bsPath, 'utf-8'));

        // Get model path from blockstate
        let modelPath: string | null = null;

        if (blockstate.variants) {
          // Get the default variant or first variant
          const defaultVariant = blockstate.variants[''] || blockstate.variants['normal'] || Object.values(blockstate.variants)[0];
          if (defaultVariant) {
            const variant = Array.isArray(defaultVariant) ? defaultVariant[0] : defaultVariant;
            modelPath = variant.model;
          }
        } else if (blockstate.multipart) {
          // Get first multipart apply
          const firstPart = blockstate.multipart[0];
          if (firstPart?.apply) {
            const apply = Array.isArray(firstPart.apply) ? firstPart.apply[0] : firstPart.apply;
            modelPath = apply.model;
          }
        }

        if (!modelPath) {
          console.log(`  Skipping ${blockId}: no model found`);
          continue;
        }

        // Get textures from model
        const modelTextures = getModelTextures(modelPath, modelsDir, textureCache);

        if (Object.keys(modelTextures).length === 0) {
          console.log(`  Skipping ${blockId}: no textures found`);
          continue;
        }

        // Build texture mapping for our format
        const textures: Record<string, string> = {};

        // Map common texture keys
        const textureMapping: Record<string, string[]> = {
          'all': ['all', 'texture', 'particle'],
          'top': ['top', 'up', 'end'],
          'bottom': ['bottom', 'down', 'end'],
          'sides': ['side', 'sides', 'north', 'south', 'east', 'west'],
          'north': ['north', 'front'],
          'south': ['south', 'back'],
          'east': ['east', 'right'],
          'west': ['west', 'left'],
        };

        for (const [ourKey, possibleKeys] of Object.entries(textureMapping)) {
          for (const key of possibleKeys) {
            if (modelTextures[key]) {
              const resolvedTexture = resolveTexture(modelTextures[key], modelTextures, new Map());
              textures[ourKey] = resolvedTexture;
              usedTextures.add(resolvedTexture);
              break;
            }
          }
        }

        // If no textures mapped, try to use particle or first texture
        if (Object.keys(textures).length === 0) {
          const firstTexture = Object.values(modelTextures)[0];
          if (firstTexture) {
            const resolved = resolveTexture(firstTexture, modelTextures, new Map());
            textures['all'] = resolved;
            usedTextures.add(resolved);
          }
        }

        if (Object.keys(textures).length === 0) {
          console.log(`  Skipping ${blockId}: could not resolve textures`);
          continue;
        }

        const block: BlockDefinition = {
          id: `${namespace}:${blockId}`,
          displayName: toDisplayName(blockId),
          shape: determineShape(modelPath, modelTextures),
          textures,
        };

        if (isTransparent(blockId, modelTextures)) {
          block.transparent = true;
          block.renderType = 'cutout';
        }

        blocks.push(block);
        console.log(`  Added: ${block.id}`);

      } catch (error) {
        console.log(`  Error parsing ${blockId}: ${error}`);
      }
    }

    if (blocks.length === 0) {
      console.log(`No blocks found for ${namespace}`);
      continue;
    }

    // Create mod definition
    const modDef: ModDefinition = {
      namespace,
      name: options.modName || toDisplayName(namespace),
      version: options.version || '1.0.0',
      textureBasePath: `/textures/${namespace}/blocks/`,
      blocks,
    };

    // Write mod definition
    const outputDir = path.join(PROJECT_ROOT, 'public', 'data', 'mods');
    fs.mkdirSync(outputDir, { recursive: true });
    const outputFile = path.join(outputDir, `${namespace}.json`);
    fs.writeFileSync(outputFile, JSON.stringify(modDef, null, 2));
    console.log(`\nWrote mod definition: ${outputFile}`);

    // Copy textures
    const textureOutputDir = path.join(PROJECT_ROOT, 'public', 'textures', namespace, 'blocks');
    fs.mkdirSync(textureOutputDir, { recursive: true });

    let copiedCount = 0;
    if (fs.existsSync(texturesDir)) {
      for (const texture of usedTextures) {
        const textureName = texture.replace('.png', '');
        const sourcePath = path.join(texturesDir, `${textureName}.png`);
        const destPath = path.join(textureOutputDir, texture);

        if (fs.existsSync(sourcePath)) {
          fs.copyFileSync(sourcePath, destPath);
          copiedCount++;
        } else {
          console.log(`  Texture not found: ${sourcePath}`);
        }
      }
    }
    console.log(`Copied ${copiedCount}/${usedTextures.size} textures to ${textureOutputDir}`);
  }

  console.log('\n=== Done! ===\n');
}

// CLI handling
const args = process.argv.slice(2);

if (args.length === 0) {
  console.log(`
Usage: npx ts-node scripts/parse-mod.ts <github-repo-url> [options]

Options:
  --name <name>      Mod display name
  --version <ver>    Mod version

Examples:
  npx ts-node scripts/parse-mod.ts https://github.com/AppliedEnergistics/Applied-Energistics-2
  npx ts-node scripts/parse-mod.ts https://github.com/mekanism/Mekanism --name "Mekanism"

The script will:
1. Clone the repository
2. Find and parse all blockstates
3. Extract block definitions and textures
4. Generate a mod JSON file in public/data/mods/
5. Copy textures to public/textures/<namespace>/blocks/
`);
  process.exit(0);
}

const repoUrl = args[0];
const options: { namespace?: string; modName?: string; version?: string } = {};

for (let i = 1; i < args.length; i++) {
  if (args[i] === '--name' && args[i + 1]) {
    options.modName = args[i + 1];
    i++;
  } else if (args[i] === '--version' && args[i + 1]) {
    options.version = args[i + 1];
    i++;
  }
}

parseModFromRepo(repoUrl, options).catch(console.error);
