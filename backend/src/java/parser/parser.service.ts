import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as crypto from 'crypto';
import * as fs from 'fs';
import { JarExtractorService } from './jar-extractor.service';
import { GifGeneratorService } from './gif-generator.service';
import { IconRendererService } from './icon-renderer.service';
import { Block } from '../../schemas/block.schema';
import { Mod, ModDocument } from '../../schemas/mod.schema';
import { Texture } from '../../schemas/texture.schema';
import { BlockModel } from '../../schemas/block-model.schema';
import {
  StepCallback,
  ExtractJarStep,
  SaveModStep,
  ProcessBlocksStep,
  ProcessTexturesStep,
  ProcessModelsStep,
  GenerateIconsStep,
} from './steps';

export interface ParseResult {
  mod: ModDocument;
  blocksCreated: number;
  blocksUpdated: number;
  texturesCreated: number;
  modelsCreated: number;
  iconsGenerated: number;
}

export interface StepInfo {
  name: string;
  label: string;
}

// Re-export types for controller
export type { StepCallback, StepEvent } from './steps';
export { ParseStep } from './steps';

@Injectable()
export class ParserService {
  private readonly logger = new Logger(ParserService.name);

  constructor(
    private readonly jarExtractor: JarExtractorService,
    private readonly gifGenerator: GifGeneratorService,
    private readonly iconRenderer: IconRendererService,
    @InjectModel(Mod.name) private modModel: Model<Mod>,
    @InjectModel(Block.name) private blockModel: Model<Block>,
    @InjectModel(Texture.name) private textureModel: Model<Texture>,
    @InjectModel(BlockModel.name) private blockModelModel: Model<BlockModel>,
  ) {}

  getSteps(): StepInfo[] {
    return [
      { name: 'hash', label: 'Calculating hash' },
      { name: 'extract', label: 'Extracting JAR' },
      { name: 'save-mod', label: 'Saving mod info' },
      { name: 'process-blocks', label: 'Processing blocks' },
      { name: 'process-textures', label: 'Processing textures' },
      { name: 'process-models', label: 'Processing models' },
      { name: 'generate-icons', label: 'Generating 3D icons' },
    ];
  }

  /**
   * Parse un JAR avec progression via callback
   */
  async parseJar(jarPath: string, onStep?: StepCallback): Promise<ParseResult> {
    // Create steps
    const extractStep = new ExtractJarStep(this.jarExtractor);
    const saveModStep = new SaveModStep(this.modModel);
    const processBlocksStep = new ProcessBlocksStep(this.blockModel);
    const processTexturesStep = new ProcessTexturesStep(this.textureModel, this.gifGenerator);
    const processModelsStep = new ProcessModelsStep(this.blockModelModel);
    const generateIconsStep = new GenerateIconsStep(this.blockModel, this.iconRenderer);

    // Set callbacks
    if (onStep) {
      extractStep.setCallback(onStep);
      saveModStep.setCallback(onStep);
      processBlocksStep.setCallback(onStep);
      processTexturesStep.setCallback(onStep);
      processModelsStep.setCallback(onStep);
      generateIconsStep.setCallback(onStep);
    }

    // Step 1: Calculate hash
    if (onStep) onStep({ name: 'hash', status: 'running', message: 'Calculating JAR hash...' });
    const jarHash = await this.calculateHash(jarPath);
    if (onStep) onStep({ name: 'hash', status: 'completed' });

    // Step 2: Extract JAR
    const extracted = await extractStep.execute({ jarPath });
    const { metadata, blockstates, translations, textures, models } = extracted;

    // Step 3: Save mod
    const mod = await saveModStep.execute({ metadata, jarHash });

    // Step 4: Process blocks
    const { blocksCreated, blocksUpdated } = await processBlocksStep.execute({
      blockstates,
      translations,
      modId: metadata.modId,
      modVersion: metadata.modVersion,
      minecraftVersion: metadata.minecraftVersion,
    });

    // Step 5: Process textures
    const { texturesCreated, texturesBase64Map } = await processTexturesStep.execute({
      textures,
      modId: metadata.modId,
      modVersion: metadata.modVersion,
      minecraftVersion: metadata.minecraftVersion,
    });

    // Step 6: Process models
    const { modelsCreated, modelTexturesMap } = await processModelsStep.execute({
      models,
      modId: metadata.modId,
      modVersion: metadata.modVersion,
      minecraftVersion: metadata.minecraftVersion,
    });

    // Step 7: Generate icons
    const { iconsGenerated } = await generateIconsStep.execute({
      blockstates,
      modelTexturesMap,
      texturesBase64Map,
      modId: metadata.modId,
      modVersion: metadata.modVersion,
      minecraftVersion: metadata.minecraftVersion,
    });

    // Step 8: Complete
    if (onStep) {
      onStep({ name: 'complete', status: 'completed', message: 'Parsing completed successfully' });
    }

    return {
      mod,
      blocksCreated,
      blocksUpdated,
      texturesCreated,
      modelsCreated,
      iconsGenerated,
    };
  }

  async parseDirectory(dirPath: string, onStep?: StepCallback): Promise<ParseResult[]> {
    const files = fs.readdirSync(dirPath);
    const jarFiles = files.filter((f) => f.endsWith('.jar'));

    this.logger.log(`Found ${jarFiles.length} JAR files in ${dirPath}`);

    const results: ParseResult[] = [];

    for (const jarFile of jarFiles) {
      const jarPath = `${dirPath}/${jarFile}`;
      try {
        const result = await this.parseJar(jarPath, onStep);
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
}
