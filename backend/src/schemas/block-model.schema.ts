import { Prop, Schema, SchemaFactory, raw } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';

export type BlockModelDocument = HydratedDocument<BlockModel>;

// Format Three.js friendly pour un élément (cube)
export interface ModelElement {
  from: [number, number, number]; // [x, y, z] en unités 0-16
  to: [number, number, number];
  rotation?: {
    origin: [number, number, number];
    axis: 'x' | 'y' | 'z';
    angle: number; // -45, -22.5, 0, 22.5, 45
    rescale?: boolean;
  };
  faces: {
    [face: string]: {
      // north, south, east, west, up, down
      uv?: [number, number, number, number]; // [u1, v1, u2, v2] 0-16
      texture: string; // #all, #side, etc. ou chemin résolu
      cullface?: string;
      rotation?: number; // 0, 90, 180, 270
      tintindex?: number;
    };
  };
}

@Schema({ timestamps: true })
export class BlockModel {
  @Prop({ required: true, index: true })
  modelPath: string; // mekanism:block/storage/steel

  @Prop({ required: true })
  namespace: string; // mekanism

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

  @Prop()
  parent?: string; // block/cube_all

  @Prop({ type: MongooseSchema.Types.Mixed })
  textures: Record<string, string>; // { "all": "mekanism:block/block_steel" }

  @Prop({ type: [MongooseSchema.Types.Mixed] })
  elements: ModelElement[]; // Cubes 3D

  @Prop({ type: MongooseSchema.Types.Mixed })
  display?: Record<string, unknown>; // Display transforms

  @Prop({ default: false })
  ambientOcclusion: boolean;

  // Textures résolues (chemins complets vers les textures)
  @Prop([String])
  resolvedTextures: string[];

  // PRE-RESOLVED DATA (computed at parse time)
  // Elements avec les textures complètement résolues (pas de variables #)
  @Prop({ type: [MongooseSchema.Types.Mixed] })
  resolvedElements?: ModelElement[];

  // Mapping complet des textures (face -> texturePath, sans variables #)
  @Prop({ type: MongooseSchema.Types.Mixed })
  resolvedTextureMap?: Record<string, string>;
}

export const BlockModelSchema = SchemaFactory.createForClass(BlockModel);

// Index unique
BlockModelSchema.index(
  { modelPath: 1, 'mod.modVersion': 1, 'mod.minecraftVersion': 1 },
  { unique: true },
);
