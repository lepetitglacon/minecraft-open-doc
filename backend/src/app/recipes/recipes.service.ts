import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Recipe, RecipeDocument } from '../../schemas/recipe.schema';

@Injectable()
export class RecipesService {
  constructor(@InjectModel(Recipe.name) private recipeModel: Model<Recipe>) {}

  async findByResult(
    namespace: string,
    blockId: string,
    minecraftVersion?: string,
  ): Promise<RecipeDocument[]> {
    const resultItem = `${namespace}:${blockId}`;
    const query: Record<string, unknown> = {
      'result.item': resultItem,
    };
    if (minecraftVersion) {
      query['mod.minecraftVersion'] = minecraftVersion;
    }
    return this.recipeModel.find(query).exec();
  }

  async findByNamespace(
    namespace: string,
    minecraftVersion?: string,
  ): Promise<RecipeDocument[]> {
    const query: Record<string, unknown> = { namespace };
    if (minecraftVersion) {
      query['mod.minecraftVersion'] = minecraftVersion;
    }
    return this.recipeModel.find(query).limit(100).exec();
  }

  async getStats(): Promise<{
    total: number;
    byType: { type: string; count: number }[];
    byNamespace: { namespace: string; count: number }[];
  }> {
    const [total, byType, byNamespace] = await Promise.all([
      this.recipeModel.countDocuments().exec(),
      this.recipeModel.aggregate([
        { $group: { _id: '$type', count: { $sum: 1 } } },
        { $project: { type: '$_id', count: 1, _id: 0 } },
        { $sort: { count: -1 } },
      ]),
      this.recipeModel.aggregate([
        { $group: { _id: '$namespace', count: { $sum: 1 } } },
        { $project: { namespace: '$_id', count: 1, _id: 0 } },
        { $sort: { count: -1 } },
      ]),
    ]);

    return { total, byType, byNamespace };
  }
}
