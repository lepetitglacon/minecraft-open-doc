import { Model } from 'mongoose';
import { ParseStep } from './parse-step';
import { BlockModel } from '../../../schemas/block-model.schema';
import { ExtractedModel } from '../jar-extractor.service';

export interface ProcessModelsInput {
  models: ExtractedModel[];
  modId: string;
  modVersion: string;
  minecraftVersion: string;
}

export interface ProcessModelsOutput {
  modelsCreated: number;
  modelTexturesMap: Map<string, Record<string, string>>;
}

export class ProcessModelsStep extends ParseStep<
  ProcessModelsInput,
  ProcessModelsOutput
> {
  readonly name = 'process-models';

  constructor(private readonly blockModelModel: Model<BlockModel>) {
    super();
  }

  async execute(input: ProcessModelsInput): Promise<ProcessModelsOutput> {
    const { models, modId, modVersion, minecraftVersion } = input;

    this.progress(0, models.length);

    let modelsCreated = 0;
    const modelTexturesMap = new Map<string, Record<string, string>>();

    for (let i = 0; i < models.length; i++) {
      const model = models[i];

      const resolvedTextures = model.textures
        ? Object.values(model.textures).filter(
            (t) => typeof t === 'string' && !t.startsWith('#'),
          )
        : [];

      if (model.textures) {
        modelTexturesMap.set(model.modelPath, model.textures);
      }

      const result = await this.blockModelModel.updateOne(
        {
          modelPath: model.modelPath,
          'mod.modVersion': modVersion,
          'mod.minecraftVersion': minecraftVersion,
        },
        {
          $set: {
            modelPath: model.modelPath,
            namespace: modId,
            mod: { modId, modVersion, minecraftVersion },
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

      if ((i + 1) % 50 === 0 || i === models.length - 1) {
        this.progress(i + 1, models.length);
      }
    }

    this.complete(`${modelsCreated} models created`);

    return { modelsCreated, modelTexturesMap };
  }
}
