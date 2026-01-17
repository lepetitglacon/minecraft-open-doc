import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Texture, TextureDocument } from '../schemas/texture.schema';

@Injectable()
export class TexturesService {
  constructor(
    @InjectModel(Texture.name) private textureModel: Model<Texture>,
  ) {}

  async findByPath(
    texturePath: string,
    minecraftVersion?: string,
  ): Promise<TextureDocument | null> {
    const query: Record<string, unknown> = { texturePath };
    if (minecraftVersion) {
      query['mod.minecraftVersion'] = minecraftVersion;
    }
    return this.textureModel.findOne(query).exec();
  }

  async findByNamespace(
    namespace: string,
    minecraftVersion?: string,
  ): Promise<TextureDocument[]> {
    const query: Record<string, unknown> = { namespace };
    if (minecraftVersion) {
      query['mod.minecraftVersion'] = minecraftVersion;
    }
    return this.textureModel.find(query).exec();
  }

  async findMultiple(
    texturePaths: string[],
    minecraftVersion?: string,
  ): Promise<TextureDocument[]> {
    const query: Record<string, unknown> = {
      texturePath: { $in: texturePaths },
    };
    if (minecraftVersion) {
      query['mod.minecraftVersion'] = minecraftVersion;
    }
    return this.textureModel.find(query).exec();
  }

  async getStats(): Promise<{
    total: number;
    animated: number;
    byNamespace: { namespace: string; count: number }[];
  }> {
    const [total, animated, byNamespace] = await Promise.all([
      this.textureModel.countDocuments().exec(),
      this.textureModel.countDocuments({ animated: true }).exec(),
      this.textureModel.aggregate([
        { $group: { _id: '$namespace', count: { $sum: 1 } } },
        { $project: { namespace: '$_id', count: 1, _id: 0 } },
        { $sort: { count: -1 } },
      ]),
    ]);

    return { total, animated, byNamespace };
  }
}
