import { Prop, Schema, SchemaFactory, raw } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type TextureDocument = HydratedDocument<Texture>;

@Schema({ timestamps: true })
export class Texture {
  @Prop({ required: true, index: true })
  texturePath: string; // mekanism:block/block_steel

  @Prop({ required: true })
  namespace: string; // mekanism

  @Prop({ required: true })
  filename: string; // block_steel.png

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

  @Prop({ required: true })
  base64: string; // data:image/png;base64,...

  @Prop()
  width?: number;

  @Prop()
  height?: number;

  @Prop({ default: false })
  animated: boolean;

  @Prop({ type: Object })
  mcmeta?: {
    animation?: {
      frametime?: number;
      frames?: number[];
      interpolate?: boolean;
    };
  };
}

export const TextureSchema = SchemaFactory.createForClass(Texture);

// Index unique: une texture par mod/version
TextureSchema.index(
  { texturePath: 1, 'mod.modVersion': 1, 'mod.minecraftVersion': 1 },
  { unique: true },
);
