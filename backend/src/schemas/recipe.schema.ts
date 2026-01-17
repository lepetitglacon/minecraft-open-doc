import { Prop, Schema, SchemaFactory, raw } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type RecipeDocument = HydratedDocument<Recipe>;

@Schema({ timestamps: true })
export class Recipe {
  @Prop({ required: true, index: true })
  recipeId: string; // mekanism:storage_blocks/block_steel

  @Prop({ required: true })
  namespace: string; // mekanism

  @Prop({ required: true })
  type: string; // minecraft:crafting_shaped, minecraft:smelting, etc.

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

  @Prop({ type: [String] })
  pattern?: string[]; // Pour shaped crafting

  @Prop({ type: Object })
  key?: Record<string, { item?: string; tag?: string }>; // Pour shaped crafting

  @Prop({ type: Array })
  ingredients?: Array<{ item?: string; tag?: string } | Array<{ item?: string; tag?: string }>>; // Pour shapeless

  @Prop({ type: Object, required: true })
  result: {
    item: string;
    count?: number;
  };

  @Prop()
  experience?: number; // Pour smelting

  @Prop()
  cookingTime?: number; // Pour smelting
}

export const RecipeSchema = SchemaFactory.createForClass(Recipe);

// Index pour rechercher les recettes par résultat
RecipeSchema.index({ 'result.item': 1 });
RecipeSchema.index({ recipeId: 1, 'mod.modVersion': 1, 'mod.minecraftVersion': 1 }, { unique: true });
