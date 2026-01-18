import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ModExampleDocument = HydratedDocument<ModExample>;

@Schema()
export class SceneBlock {
  @Prop({ required: true })
  x: number;

  @Prop({ required: true })
  y: number;

  @Prop({ required: true })
  z: number;

  @Prop({ required: true })
  blockId: string; // "mekanism:steel_casing"

  @Prop({ type: Object })
  properties?: Record<string, any>; // Pour le facing, etc.
}

@Schema({ timestamps: true })
export class ModExample {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  namespace: string; // "mekanism"

  @Prop()
  description?: string;

  @Prop({ type: [SchemaFactory.createForClass(SceneBlock)], default: [] })
  blocks: SceneBlock[];

  @Prop()
  thumbnailBase64?: string; // Capture d'écran de la scène
}

export const ModExampleSchema = SchemaFactory.createForClass(ModExample);
