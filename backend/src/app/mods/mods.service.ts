import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Mod, ModDocument } from '../../schemas/mod.schema';

export interface ModFilter {
  search?: string;
  minecraftVersion?: string;
}

export interface PaginationOptions {
  page?: number;
  limit?: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

@Injectable()
export class ModsService {
  constructor(@InjectModel(Mod.name) private modModel: Model<Mod>) {}

  async findAll(
    filter: ModFilter = {},
    pagination: PaginationOptions = {},
  ): Promise<PaginatedResult<ModDocument>> {
    const { page = 1, limit = 50 } = pagination;
    const skip = (page - 1) * limit;

    const query: Record<string, unknown> = {};

    if (filter.search) {
      // Recherche sur modId, displayName et description
      query.$or = [
        { modId: { $regex: filter.search, $options: 'i' } },
        { displayName: { $regex: filter.search, $options: 'i' } },
        { description: { $regex: filter.search, $options: 'i' } },
      ];
    }

    if (filter.minecraftVersion) {
      query.minecraftVersion = filter.minecraftVersion;
    }

    const [data, total] = await Promise.all([
      this.modModel
        .find(query)
        .sort({ displayName: 1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.modModel.countDocuments(query).exec(),
    ]);

    return {
      data,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    };
  }

  async findByModId(
    modId: string,
    minecraftVersion?: string,
  ): Promise<ModDocument | null> {
    const query: Record<string, unknown> = { modId };
    if (minecraftVersion) {
      query.minecraftVersion = minecraftVersion;
    }
    return this.modModel.findOne(query).exec();
  }

  async getMinecraftVersions(): Promise<string[]> {
    return this.modModel.distinct('minecraftVersion').exec();
  }

  async getStats(): Promise<{
    totalMods: number;
    minecraftVersions: string[];
    byMinecraftVersion: { version: string; count: number }[];
  }> {
    const [totalMods, minecraftVersions, byMinecraftVersion] = await Promise.all([
      this.modModel.countDocuments().exec(),
      this.modModel.distinct('minecraftVersion').exec(),
      this.modModel.aggregate([
        { $group: { _id: '$minecraftVersion', count: { $sum: 1 } } },
        { $project: { version: '$_id', count: 1, _id: 0 } },
        { $sort: { version: -1 } },
      ]),
    ]);

    return {
      totalMods,
      minecraftVersions,
      byMinecraftVersion,
    };
  }
}
