import { Model } from 'mongoose';
import { ParseStep } from './parse-step';
import { Block } from '../../../schemas/block.schema';
import { ExtractedBlockstate } from '../jar-extractor.service';
import { IconRendererService } from '../icon-renderer.service';

export interface GenerateIconsInput {
  blockstates: ExtractedBlockstate[];
  modelTexturesMap: Map<string, Record<string, string>>;
  texturesBase64Map: Map<string, string>;
  modId: string;
  modVersion: string;
  minecraftVersion: string;
}

export interface GenerateIconsOutput {
  iconsGenerated: number;
}

export class GenerateIconsStep extends ParseStep<
  GenerateIconsInput,
  GenerateIconsOutput
> {
  readonly name = 'generate-icons';

  constructor(
    private readonly blockModel: Model<Block>,
    private readonly iconRenderer: IconRendererService,
  ) {
    super();
  }

  async execute(input: GenerateIconsInput): Promise<GenerateIconsOutput> {
    const {
      blockstates,
      modelTexturesMap,
      texturesBase64Map,
      modId,
      modVersion,
      minecraftVersion,
    } = input;

    this.progress(0, blockstates.length);

    let iconsGenerated = 0;

    for (let i = 0; i < blockstates.length; i++) {
      const bs = blockstates[i];
      const registryName = `${modId}:${bs.blockId}`;
      const blockModels = this.extractModelReferences(bs.blockstate);

      if (blockModels.length > 0) {
        const firstModelPath = blockModels[0];
        const modelTextures = modelTexturesMap.get(firstModelPath);

        if (modelTextures) {
          const texturesResolved: Record<string, string> = {};
          const texturesBase64: Record<string, string> = {};

          for (const [key, value] of Object.entries(modelTextures)) {
            if (typeof value === 'string' && !value.startsWith('#')) {
              texturesResolved[key] = value;
              const base64 = texturesBase64Map.get(value);
              if (base64) {
                texturesBase64[value] = base64;
              }
            }
          }

          if (Object.keys(texturesBase64).length > 0) {
            const [icon, icon3d] = await Promise.all([
              this.iconRenderer.renderSimpleIcon(
                texturesResolved,
                texturesBase64,
              ),
              this.iconRenderer.renderBlockIcon(
                texturesResolved,
                texturesBase64,
              ),
            ]);

            if (icon || icon3d) {
              await this.blockModel.updateOne(
                {
                  registryName,
                  'mod.modVersion': modVersion,
                  'mod.minecraftVersion': minecraftVersion,
                },
                { $set: { icon, icon3d } },
              );
              iconsGenerated++;
            }
          }
        }
      }

      if ((i + 1) % 20 === 0 || i === blockstates.length - 1) {
        this.progress(i + 1, blockstates.length);
      }
    }

    this.complete(`${iconsGenerated} icons generated`);

    return { iconsGenerated };
  }

  private extractModelReferences(
    blockstate: Record<string, unknown>,
  ): string[] {
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
