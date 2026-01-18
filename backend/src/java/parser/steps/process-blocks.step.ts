import { Model } from 'mongoose';
import { ParseStep } from './parse-step';
import { Block } from '../../../schemas/block.schema';
import { ExtractedBlockstate } from '../jar-extractor.service';

export interface ProcessBlocksInput {
  blockstates: ExtractedBlockstate[];
  translations: Record<string, string>;
  modId: string;
  modVersion: string;
  minecraftVersion: string;
}

export interface ProcessBlocksOutput {
  blocksCreated: number;
  blocksUpdated: number;
}

export class ProcessBlocksStep extends ParseStep<
  ProcessBlocksInput,
  ProcessBlocksOutput
> {
  readonly name = 'process-blocks';

  constructor(private readonly blockModel: Model<Block>) {
    super();
  }

  async execute(input: ProcessBlocksInput): Promise<ProcessBlocksOutput> {
    const { blockstates, translations, modId, modVersion, minecraftVersion } =
      input;

    this.progress(0, blockstates.length);

    let blocksCreated = 0;
    let blocksUpdated = 0;

    for (let i = 0; i < blockstates.length; i++) {
      const bs = blockstates[i];
      const registryName = `${modId}:${bs.blockId}`;
      const displayName = translations[bs.blockId] || bs.blockId;
      const models = this.extractModelReferences(bs.blockstate);
      const type = models.length > 0 ? models[0] : undefined;

      const result = await this.blockModel.updateOne(
        {
          registryName,
          'mod.modVersion': modVersion,
          'mod.minecraftVersion': minecraftVersion,
        },
        {
          $set: {
            registryName,
            namespace: modId,
            blockId: bs.blockId,
            displayName,
            mod: { modId, modVersion, minecraftVersion },
            blockstate: bs.blockstate,
            models,
            type,
          },
        },
        { upsert: true },
      );

      if (result.upsertedCount > 0) blocksCreated++;
      else if (result.modifiedCount > 0) blocksUpdated++;

      if ((i + 1) % 50 === 0 || i === blockstates.length - 1) {
        this.progress(i + 1, blockstates.length);
      }
    }

    this.complete(`${blocksCreated} created, ${blocksUpdated} updated`);

    return { blocksCreated, blocksUpdated };
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
