import { Model } from 'mongoose';
import { ParseStep } from './parse-step';
import { Mod, ModDocument } from '../../../schemas/mod.schema';
import { ModMetadata } from '../jar-extractor.service';

export interface SaveModInput {
  metadata: ModMetadata;
  jarHash: string;
}

export class SaveModStep extends ParseStep<SaveModInput, ModDocument> {
  readonly name = 'save-mod';

  constructor(private readonly modModel: Model<Mod>) {
    super();
  }

  async execute(input: SaveModInput): Promise<ModDocument> {
    const { metadata, jarHash } = input;

    this.start(`Saving mod ${metadata.modId}...`);

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

    this.complete(`Mod saved: ${mod.modId} v${mod.modVersion}`);

    return mod;
  }
}
