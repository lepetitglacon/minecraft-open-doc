import { Prop, Schema, SchemaFactory, raw } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';

export type BlockDocument = HydratedDocument<Block>;

@Schema({ timestamps: true })
export class Block {
  @Prop({ required: true, index: true })
  registryName: string; // mekanism:block_steel

  @Prop({ required: true, index: true })
  namespace: string; // mekanism

  @Prop({ required: true })
  blockId: string; // block_steel

  @Prop()
  displayName?: string; // Steel Block

  @Prop(
    raw({
      modId: { type: String, required: true },
      modVersion: { type: String, required: true },
      minecraftVersion: { type: String, required: true },
    }),
  )
  mod: {
    modId: string;
    modVersion: string;
    minecraftVersion: string;
  };

  @Prop({ type: MongooseSchema.Types.Mixed })
  blockstate: Record<string, unknown>; // Raw blockstate JSON

  @Prop([String])
  models?: string[]; // Referenced model paths

  @Prop([String])
  textures?: string[]; // Referenced texture paths

  @Prop({ index: true })
  type?: string; // Primary model path (e.g. mekanism:block/bin)

  @Prop()
  icon?: string; // Pre-rendered 2D icon (base64 PNG)

  @Prop()
  icon3d?: string; // Pre-rendered 3D icon (base64 PNG)
}

export const BlockSchema = SchemaFactory.createForClass(Block);

// Index unique: un bloc par mod/version
BlockSchema.index(
  { registryName: 1, 'mod.modVersion': 1, 'mod.minecraftVersion': 1 },
  { unique: true },
);

// Index full-text pour recherche
BlockSchema.index({ displayName: 'text', registryName: 'text' });
