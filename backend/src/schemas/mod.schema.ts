import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ModDocument = HydratedDocument<Mod>;

@Schema({ timestamps: true })
export class Mod {
  @Prop({ required: true })
  modId: string;

  @Prop({ required: true })
  modVersion: string;

  @Prop({ required: true })
  minecraftVersion: string;

  @Prop({ required: true })
  displayName: string;

  @Prop()
  description?: string;

  @Prop([String])
  authors?: string[];

  @Prop()
  logoFile?: string; // Chemin du logo dans le JAR

  @Prop()
  logoBase64?: string; // Logo en base64

  @Prop()
  websiteUrl?: string;

  @Prop()
  jarHash?: string;

  @Prop()
  parsedAt?: Date;
}

export const ModSchema = SchemaFactory.createForClass(Mod);

// Index unique sur modId + modVersion + minecraftVersion
ModSchema.index(
  { modId: 1, modVersion: 1, minecraftVersion: 1 },
  { unique: true },
);
