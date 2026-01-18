import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  ModExample,
  ModExampleDocument,
} from '../../schemas/mod-example.schema';

@Injectable()
export class ExamplesService {
  constructor(
    @InjectModel(ModExample.name) private exampleModel: Model<ModExample>,
  ) {}

  async findAll(namespace: string): Promise<ModExampleDocument[]> {
    return this.exampleModel.find({ namespace }).sort({ createdAt: -1 }).exec();
  }

  async create(example: ModExample): Promise<ModExampleDocument> {
    const createdExample = new this.exampleModel(example);
    return createdExample.save();
  }

  async delete(id: string): Promise<ModExampleDocument | null> {
    return this.exampleModel.findByIdAndDelete(id).exec();
  }
}
