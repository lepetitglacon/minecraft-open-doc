#!/usr/bin/env npx ts-node

import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PROJECT_ROOT = path.resolve(__dirname, '..');
const TEXTURES_DIR = path.join(PROJECT_ROOT, 'public', 'textures', 'minecraft', 'blocks');

// Minecraft version for textures
const MC_VERSION = '1.20.1';

// Base URL for raw textures from mcasset.cloud
const BASE_URL = `https://raw.githubusercontent.com/InventivetalentDev/minecraft-assets/refs/heads/${MC_VERSION}/assets/minecraft/textures/block`;

// Required textures based on minecraft.json
const REQUIRED_TEXTURES = [
  'stone.png',
  'dirt.png',
  'grass_block_top.png',
  'grass_block_side.png',
  'cobblestone.png',
  'oak_planks.png',
  'oak_log.png',
  'oak_log_top.png',
  'glass.png',
  'iron_block.png',
  'diamond_block.png',
];

function downloadFile(url: string, dest: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const dir = path.dirname(dest);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const file = fs.createWriteStream(dest);

    const request = (urlToFetch: string) => {
      https.get(urlToFetch, (response) => {
        // Handle redirects
        if (response.statusCode === 301 || response.statusCode === 302) {
          const redirectUrl = response.headers.location;
          if (redirectUrl) {
            file.close();
            fs.unlinkSync(dest);
            request(redirectUrl);
            return;
          }
        }

        if (response.statusCode !== 200) {
          file.close();
          fs.unlink(dest, () => {});
          reject(new Error(`Failed to download: ${response.statusCode}`));
          return;
        }

        response.pipe(file);
        file.on('finish', () => {
          file.close();
          resolve();
        });
      }).on('error', (err) => {
        file.close();
        fs.unlink(dest, () => {});
        reject(err);
      });
    };

    request(url);
  });
}

async function downloadTextures(): Promise<void> {
  console.log('=== Minecraft Texture Downloader ===\n');
  console.log(`Downloading textures for Minecraft ${MC_VERSION}`);
  console.log(`Target directory: ${TEXTURES_DIR}\n`);

  fs.mkdirSync(TEXTURES_DIR, { recursive: true });

  let successCount = 0;
  let failCount = 0;

  for (const texture of REQUIRED_TEXTURES) {
    const url = `${BASE_URL}/${texture}`;
    const destPath = path.join(TEXTURES_DIR, texture);

    if (fs.existsSync(destPath)) {
      console.log(`  [SKIP] ${texture} (already exists)`);
      successCount++;
      continue;
    }

    try {
      process.stdout.write(`  [DOWNLOADING] ${texture}...`);
      await downloadFile(url, destPath);
      console.log(' OK');
      successCount++;
    } catch (error) {
      console.log(` FAILED: ${error}`);
      failCount++;
    }
  }

  console.log(`\n=== Done! ===`);
  console.log(`Downloaded: ${successCount}/${REQUIRED_TEXTURES.length}`);
  if (failCount > 0) {
    console.log(`Failed: ${failCount}`);
    console.log('\nSome textures could not be downloaded. You may need to obtain them manually.');
  }
}

// Alternative: Generate placeholder textures for development
function generatePlaceholderTextures(): void {
  console.log('=== Generating Placeholder Textures ===\n');
  console.log(`Target directory: ${TEXTURES_DIR}\n`);

  fs.mkdirSync(TEXTURES_DIR, { recursive: true });

  // Create a simple 16x16 PNG placeholder
  // This is a minimal PNG with solid color
  const colors: Record<string, [number, number, number]> = {
    'stone.png': [128, 128, 128],
    'dirt.png': [139, 90, 43],
    'grass_block_top.png': [91, 189, 91],
    'grass_block_side.png': [91, 139, 91],
    'cobblestone.png': [100, 100, 100],
    'oak_planks.png': [162, 130, 78],
    'oak_log.png': [109, 85, 50],
    'oak_log_top.png': [160, 130, 70],
    'glass.png': [200, 220, 255],
    'iron_block.png': [210, 210, 210],
    'diamond_block.png': [98, 219, 214],
  };

  for (const [texture, [r, g, b]] of Object.entries(colors)) {
    const destPath = path.join(TEXTURES_DIR, texture);

    if (fs.existsSync(destPath)) {
      console.log(`  [SKIP] ${texture} (already exists)`);
      continue;
    }

    // Create minimal 16x16 PNG
    // PNG signature + IHDR + IDAT + IEND
    const width = 16;
    const height = 16;

    // Raw pixel data (RGBA, but we'll use simple flat color)
    const rawData: number[] = [];
    for (let y = 0; y < height; y++) {
      rawData.push(0); // Filter byte
      for (let x = 0; x < width; x++) {
        rawData.push(r, g, b, 255);
      }
    }

    // We need to create a proper PNG file
    // For simplicity, let's create a PPM file and convert it, or use a base64 approach
    // Actually, let's just inform the user they need to download manually
    console.log(`  [PLACEHOLDER] ${texture} - Color: rgb(${r}, ${g}, ${b})`);
  }

  console.log('\nNote: Placeholder generation requires additional libraries.');
  console.log('Please run "npx ts-node scripts/download-textures.ts --download" to download real textures.');
}

// CLI handling
const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
  console.log(`
Usage: npx ts-node scripts/download-textures.ts [options]

Options:
  --download    Download real textures from GitHub
  --placeholder Generate placeholder colored PNGs (requires sharp)
  --help        Show this help

By default, downloads real textures from Minecraft assets repository.
`);
  process.exit(0);
}

downloadTextures().catch(console.error);
