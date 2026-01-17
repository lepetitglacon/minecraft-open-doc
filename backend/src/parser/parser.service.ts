import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as crypto from 'crypto';
import * as fs from 'fs';
import { JarExtractorService } from './jar-extractor.service';
import { GifGeneratorService } from './gif-generator.service';
import { Block, BlockDocument } from '../schemas/block.schema';
import { Mod, ModDocument } from '../schemas/mod.schema';
import { Texture } from '../schemas/texture.schema';
import { BlockModel } from '../schemas/block-model.schema';

export interface ParseResult {
  mod: ModDocument;
  blocksCreated: number;
  blocksUpdated: number;
  texturesCreated: number;
  modelsCreated: number;
}

@Injectable()
export class ParserService {
  private readonly logger = new Logger(ParserService.name);

  constructor(
    private readonly jarExtractor: JarExtractorService,
    private readonly gifGenerator: GifGeneratorService,
    @InjectModel(Mod.name) private modModel: Model<Mod>,
    @InjectModel(Block.name) private blockModel: Model<Block>,
    @InjectModel(Texture.name) private textureModel: Model<Texture>,
    @InjectModel(BlockModel.name) private blockModelModel: Model<BlockModel>,
  ) {}

  async parseJar(jarPath: string): Promise<ParseResult> {
    this.logger.log(`Starting parse of: ${jarPath}`);

    // Calculate JAR hash
    const jarHash = await this.calculateHash(jarPath);

    // Extract data from JAR
    const extracted = await this.jarExtractor.extract(jarPath);
    const { metadata, blockstates, translations, textures, models } = extracted;

    // Upsert mod document
    const mod = await this.modModel.findOneAndUpdate(
      {
        modId: metadata.modId,
        modVersion: metadata.modVersion,
        minecraftVersion: metadata.minecraftVersion,
      },
      {
        ...metadata,
        jarHash,
        parsedAt: new Date(),
      },
      { upsert: true, new: true },
    );

    this.logger.log(`Mod saved: ${mod.modId} v${mod.modVersion}`);

    // Process blocks
    let blocksCreated = 0;
    let blocksUpdated = 0;

    for (const bs of blockstates) {
      const registryName = `${metadata.modId}:${bs.blockId}`;
      const displayName = translations[bs.blockId] || bs.blockId;

      // Extract model references from blockstate
      const models = this.extractModelReferences(bs.blockstate);

      const result = await this.blockModel.updateOne(
        {
          registryName,
          'mod.modVersion': metadata.modVersion,
          'mod.minecraftVersion': metadata.minecraftVersion,
        },
        {
          $set: {
            registryName,
            namespace: metadata.modId,
            blockId: bs.blockId,
            displayName,
            mod: {
              modId: metadata.modId,
              modVersion: metadata.modVersion,
              minecraftVersion: metadata.minecraftVersion,
            },
            blockstate: bs.blockstate,
            models,
          },
        },
        { upsert: true },
      );

      if (result.upsertedCount > 0) {
        blocksCreated++;
      } else if (result.modifiedCount > 0) {
        blocksUpdated++;
      }
    }

    this.logger.log(
      `Blocks processed: ${blocksCreated} created, ${blocksUpdated} updated`,
    );

    // Process textures
    let texturesCreated = 0;
    let gifsGenerated = 0;
    for (const tex of textures) {
      // Générer le GIF si la texture est animée
      let animatedGif: string | undefined;
      let frameWidth: number | undefined;
      let frameHeight: number | undefined;
      let frameCount: number | undefined;

      if (tex.mcmeta?.animation) {
        const gifResult = await this.gifGenerator.generateGif(
          tex.base64,
          tex.mcmeta as { animation?: { frametime?: number; frames?: (number | { index: number; time?: number })[]; interpolate?: boolean } },
        );
        if (gifResult) {
          animatedGif = gifResult.gif;
          frameWidth = gifResult.frameWidth;
          frameHeight = gifResult.frameHeight;
          frameCount = gifResult.frameCount;
          gifsGenerated++;
        }
      }

      const result = await this.textureModel.updateOne(
        {
          texturePath: tex.texturePath,
          'mod.modVersion': metadata.modVersion,
          'mod.minecraftVersion': metadata.minecraftVersion,
        },
        {
          $set: {
            texturePath: tex.texturePath,
            namespace: metadata.modId,
            filename: tex.filename,
            mod: {
              modId: metadata.modId,
              modVersion: metadata.modVersion,
              minecraftVersion: metadata.minecraftVersion,
            },
            base64: tex.base64,
            width: tex.width,
            height: tex.height,
            animated: !!tex.mcmeta?.animation,
            mcmeta: tex.mcmeta,
            animatedGif,
            frameWidth,
            frameHeight,
            frameCount,
          },
        },
        { upsert: true },
      );
      if (result.upsertedCount > 0) texturesCreated++;
    }
    this.logger.log(`Textures processed: ${texturesCreated} created, ${gifsGenerated} GIFs generated`);

    // Process models
    let modelsCreated = 0;
    for (const model of models) {
      // Extract texture references from model
      const resolvedTextures = model.textures
        ? Object.values(model.textures).filter(
            (t) => typeof t === 'string' && !t.startsWith('#'),
          )
        : [];

      const result = await this.blockModelModel.updateOne(
        {
          modelPath: model.modelPath,
          'mod.modVersion': metadata.modVersion,
          'mod.minecraftVersion': metadata.minecraftVersion,
        },
        {
          $set: {
            modelPath: model.modelPath,
            namespace: metadata.modId,
            mod: {
              modId: metadata.modId,
              modVersion: metadata.modVersion,
              minecraftVersion: metadata.minecraftVersion,
            },
            parent: model.parent,
            textures: model.textures || {},
            elements: model.elements || [],
            display: model.display,
            ambientOcclusion: model.ambientOcclusion ?? true,
            resolvedTextures,
          },
        },
        { upsert: true },
      );
      if (result.upsertedCount > 0) modelsCreated++;
    }
    this.logger.log(`Models processed: ${modelsCreated} created`);

    return { mod, blocksCreated, blocksUpdated, texturesCreated, modelsCreated };
  }

  async parseDirectory(dirPath: string): Promise<ParseResult[]> {
    const files = fs.readdirSync(dirPath);
    const jarFiles = files.filter((f) => f.endsWith('.jar'));

    this.logger.log(`Found ${jarFiles.length} JAR files in ${dirPath}`);

    const results: ParseResult[] = [];

    for (const jarFile of jarFiles) {
      const jarPath = `${dirPath}/${jarFile}`;
      try {
        const result = await this.parseJar(jarPath);
        results.push(result);
      } catch (error) {
        this.logger.error(`Failed to parse ${jarFile}: ${error.message}`);
      }
    }

    return results;
  }

  private async calculateHash(filePath: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const hash = crypto.createHash('sha256');
      const stream = fs.createReadStream(filePath);

      stream.on('data', (data) => hash.update(data));
      stream.on('end', () => resolve(hash.digest('hex')));
      stream.on('error', reject);
    });
  }

  private extractModelReferences(blockstate: Record<string, unknown>): string[] {
    const models = new Set<string>();

    const extractFromObject = (obj: unknown) => {
      if (!obj || typeof obj !== 'object') return;

      if (Array.isArray(obj)) {
        obj.forEach(extractFromObject);
        return;
      }

      const record = obj as Record<string, unknown>;

      if (typeof record.model === 'string') {
        models.add(record.model);
      }

      Object.values(record).forEach(extractFromObject);
    };

    extractFromObject(blockstate);
    return Array.from(models);
  }
}
