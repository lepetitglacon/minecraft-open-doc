import { Injectable, Logger } from '@nestjs/common';
import AdmZip from 'adm-zip';
import * as toml from '@iarna/toml';
import * as path from 'path';

export interface ModMetadata {
  modId: string;
  modVersion: string;
  minecraftVersion: string;
  displayName: string;
  description?: string;
  authors?: string[];
  logoFile?: string;
  logoBase64?: string;
  websiteUrl?: string;
}

export interface ExtractedBlockstate {
  blockId: string;
  blockstate: Record<string, unknown>;
}

export interface ExtractedTexture {
  texturePath: string; // mekanism:block/block_steel
  filename: string; // block_steel.png
  base64: string;
  mcmeta?: Record<string, unknown>;
  width?: number;
  height?: number;
}

export interface ExtractedModel {
  modelPath: string; // mekanism:block/storage/steel
  parent?: string;
  textures?: Record<string, string>;
  elements?: unknown[];
  display?: Record<string, unknown>;
  ambientOcclusion?: boolean;
}

export interface ExtractedData {
  metadata: ModMetadata;
  blockstates: ExtractedBlockstate[];
  translations: Record<string, string>;
  textures: ExtractedTexture[];
  models: ExtractedModel[];
}

@Injectable()
export class JarExtractorService {
  private readonly logger = new Logger(JarExtractorService.name);

  async extract(jarPath: string): Promise<ExtractedData> {
    this.logger.log(`Extracting JAR: ${jarPath}`);

    const zip = new AdmZip(jarPath);
    const entries = zip.getEntries();

    // 1. Extract mod metadata
    const metadata = this.extractMetadata(zip, entries);
    this.logger.log(`Found mod: ${metadata.modId} v${metadata.modVersion}`);

    // 2. Extract blockstates
    const blockstates = this.extractBlockstates(zip, entries, metadata.modId);
    this.logger.log(`Found ${blockstates.length} blockstates`);

    // 3. Extract translations
    const translations = this.extractTranslations(zip, entries, metadata.modId);
    this.logger.log(
      `Found ${Object.keys(translations).length} block translations`,
    );

    // 4. Extract textures
    const textures = this.extractTextures(zip, entries, metadata.modId);
    this.logger.log(`Found ${textures.length} textures`);

    // 5. Extract models
    const models = this.extractModels(zip, entries, metadata.modId);
    this.logger.log(`Found ${models.length} models`);

    return { metadata, blockstates, translations, textures, models };
  }

  private extractMetadata(
    zip: AdmZip,
    entries: AdmZip.IZipEntry[],
  ): ModMetadata {
    let metadata: ModMetadata;

    // Try NeoForge/Forge format first (mods.toml)
    const modsTomlEntry =
      entries.find((e) => e.entryName === 'META-INF/neoforge.mods.toml') ||
      entries.find((e) => e.entryName === 'META-INF/mods.toml');

    if (modsTomlEntry) {
      metadata = this.parseModsToml(zip.readAsText(modsTomlEntry));
    } else {
      // Fallback to legacy format (mcmod.info)
      const mcmodEntry = entries.find((e) => e.entryName === 'mcmod.info');
      if (mcmodEntry) {
        metadata = this.parseMcmodInfo(zip.readAsText(mcmodEntry));
      } else {
        throw new Error('No mod metadata found (mods.toml or mcmod.info)');
      }
    }

    // Extract logo as base64 if specified
    if (metadata.logoFile) {
      const logoEntry = this.findLogoFile(entries, metadata.logoFile, metadata.modId);

      if (logoEntry) {
        try {
          const buffer = zip.readFile(logoEntry);
          if (buffer) {
            const ext = logoEntry.entryName.split('.').pop()?.toLowerCase() || 'png';
            const mimeType = ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : 'image/png';
            metadata.logoBase64 = `data:${mimeType};base64,${buffer.toString('base64')}`;
            this.logger.log(`Extracted logo for ${metadata.modId} from ${logoEntry.entryName} (${Math.round(metadata.logoBase64.length / 1024)}KB)`);
          }
        } catch (error) {
          this.logger.warn(`Failed to extract logo: ${metadata.logoFile}`);
        }
      } else {
        this.logger.warn(`Logo file specified but not found in JAR: ${metadata.logoFile}`);
      }
    }

    return metadata;
  }

  private findLogoFile(
    entries: AdmZip.IZipEntry[],
    logoPath: string,
    modId: string,
  ): AdmZip.IZipEntry | undefined {
    const cleanPath = logoPath.trim().replace(/\\/g, '/').replace(/^(\.\/|\/)+/, '');

    // 1. Try exact path
    let entry = entries.find((e) => e.entryName === cleanPath);
    if (entry) return entry;

    // 2. Try in assets root (common mistake: "logo.png" -> "assets/modid/logo.png")
    entry = entries.find((e) => e.entryName === `assets/${modId}/${cleanPath}`);
    if (entry) return entry;

    // 3. Try resource location style (if it has :)
    if (cleanPath.includes(':')) {
      const [ns, p] = cleanPath.split(':');
      entry = entries.find((e) => e.entryName === `assets/${ns}/${p}`);
      if (entry) return entry;
    }

    // 4. Search by filename in mod assets (fallback)
    const filename = cleanPath.split('/').pop();
    if (filename) {
      // Look for any file ending with this name inside assets/modId/
      // Sort by length to find the shortest path (likely the most direct one)
      const candidates = entries
        .filter(
          (e) =>
            e.entryName.includes(`assets/${modId}/`) &&
            e.entryName.endsWith(filename),
        )
        .sort((a, b) => a.entryName.length - b.entryName.length);

      if (candidates.length > 0) return candidates[0];
    }

    return undefined;
  }

  private parseModsToml(content: string): ModMetadata {
    const parsed = toml.parse(content) as Record<string, unknown>;

    // Get first mod entry
    const mods = parsed.mods as Array<Record<string, unknown>>;
    if (!mods || mods.length === 0) {
      throw new Error('No mods defined in mods.toml');
    }

    const mod = mods[0];

    // Extract minecraft version from dependencies
    let minecraftVersion = 'unknown';
    const dependencies = parsed.dependencies as Record<
      string,
      Array<Record<string, unknown>>
    >;
    if (dependencies) {
      const modDeps = dependencies[mod.modId as string] || [];
      const mcDep = modDeps.find((d) => d.modId === 'minecraft');
      if (mcDep && mcDep.versionRange) {
        // Parse version range like "[1.21.1]" or "[1.20,1.21)"
        const match = (mcDep.versionRange as string).match(/[\d.]+/);
        if (match) {
          minecraftVersion = match[0];
        }
      }
    }

    // Parse authors (can be string or array)
    let authors: string[] | undefined;
    if (mod.authors) {
      if (typeof mod.authors === 'string') {
        authors = mod.authors.split(',').map((a) => a.trim());
      } else if (Array.isArray(mod.authors)) {
        authors = mod.authors as string[];
      }
    }

    return {
      modId: mod.modId as string,
      modVersion: mod.version as string,
      minecraftVersion,
      displayName: (mod.displayName as string) || (mod.modId as string),
      description: mod.description as string | undefined,
      authors,
      logoFile: mod.logoFile as string | undefined,
      websiteUrl: mod.displayURL as string | undefined,
    };
  }

  private parseMcmodInfo(content: string): ModMetadata {
    const parsed = JSON.parse(content);
    const mod = Array.isArray(parsed) ? parsed[0] : parsed;

    return {
      modId: mod.modid || mod.modId,
      modVersion: mod.version || 'unknown',
      minecraftVersion: mod.mcversion || 'unknown',
      displayName: mod.name || mod.modid,
      description: mod.description,
      authors: mod.authorList || mod.authors,
      logoFile: mod.logoFile,
      websiteUrl: mod.url,
    };
  }

  private extractBlockstates(
    zip: AdmZip,
    entries: AdmZip.IZipEntry[],
    modId: string,
  ): ExtractedBlockstate[] {
    const blockstatesPath = `assets/${modId}/blockstates/`;
    const blockstates: ExtractedBlockstate[] = [];

    for (const entry of entries) {
      if (
        entry.entryName.startsWith(blockstatesPath) &&
        entry.entryName.endsWith('.json')
      ) {
        try {
          const content = zip.readAsText(entry);
          const blockstate = JSON.parse(content);
          const blockId = path.basename(entry.entryName, '.json');

          blockstates.push({ blockId, blockstate });
        } catch (error) {
          this.logger.warn(`Failed to parse blockstate: ${entry.entryName}`);
        }
      }
    }

    return blockstates;
  }

  private extractTranslations(
    zip: AdmZip,
    entries: AdmZip.IZipEntry[],
    modId: string,
  ): Record<string, string> {
    const langPath = `assets/${modId}/lang/en_us.json`;
    const langEntry = entries.find((e) => e.entryName === langPath);

    if (!langEntry) {
      this.logger.warn(`No English translations found at ${langPath}`);
      return {};
    }

    try {
      const content = zip.readAsText(langEntry);
      const allTranslations = JSON.parse(content) as Record<string, string>;

      // Filter only block translations
      const blockPrefix = `block.${modId}.`;
      const blockTranslations: Record<string, string> = {};

      for (const [key, value] of Object.entries(allTranslations)) {
        if (key.startsWith(blockPrefix)) {
          // Extract block ID from key: "block.mekanism.steel_block" -> "steel_block"
          const blockId = key.substring(blockPrefix.length);
          blockTranslations[blockId] = value;
        }
      }

      return blockTranslations;
    } catch (error) {
      this.logger.warn(`Failed to parse translations: ${error}`);
      return {};
    }
  }

  private extractTextures(
    zip: AdmZip,
    entries: AdmZip.IZipEntry[],
    modId: string,
  ): ExtractedTexture[] {
    const texturesPath = `assets/${modId}/textures/`;
    const textures: ExtractedTexture[] = [];

    for (const entry of entries) {
      if (
        entry.entryName.startsWith(texturesPath) &&
        entry.entryName.endsWith('.png')
      ) {
        try {
          const buffer = zip.readFile(entry);
          if (!buffer) continue;

          const base64 = `data:image/png;base64,${buffer.toString('base64')}`;

          // Get relative path: assets/mekanism/textures/block/steel.png -> block/steel
          const relativePath = entry.entryName
            .substring(texturesPath.length)
            .replace('.png', '');

          const texturePath = `${modId}:${relativePath}`;
          const filename = path.basename(entry.entryName);

          // Check for mcmeta (animation data)
          const mcmetaEntry = entries.find(
            (e) => e.entryName === `${entry.entryName}.mcmeta`,
          );
          let mcmeta: Record<string, unknown> | undefined;
          if (mcmetaEntry) {
            try {
              mcmeta = JSON.parse(zip.readAsText(mcmetaEntry));
            } catch {
              // Ignore mcmeta parse errors
            }
          }

          textures.push({
            texturePath,
            filename,
            base64,
            mcmeta,
          });
        } catch (error) {
          this.logger.warn(`Failed to extract texture: ${entry.entryName}`);
        }
      }
    }

    return textures;
  }

  private extractModels(
    zip: AdmZip,
    entries: AdmZip.IZipEntry[],
    modId: string,
  ): ExtractedModel[] {
    const modelsPath = `assets/${modId}/models/`;
    const models: ExtractedModel[] = [];

    for (const entry of entries) {
      if (
        entry.entryName.startsWith(modelsPath) &&
        entry.entryName.endsWith('.json')
      ) {
        try {
          const content = zip.readAsText(entry);
          const modelData = JSON.parse(content);

          // Get relative path: assets/mekanism/models/block/steel.json -> block/steel
          const relativePath = entry.entryName
            .substring(modelsPath.length)
            .replace('.json', '');

          const modelPath = `${modId}:${relativePath}`;

          models.push({
            modelPath,
            parent: modelData.parent,
            textures: modelData.textures,
            elements: modelData.elements,
            display: modelData.display,
            ambientOcclusion: modelData.ambientocclusion ?? true,
          });
        } catch (error) {
          this.logger.warn(`Failed to parse model: ${entry.entryName}`);
        }
      }
    }

    return models;
  }
}
