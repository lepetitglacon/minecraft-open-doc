import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ModelsController } from './models.controller';
import { ModelsService } from './models.service';
import { BlockModel, BlockModelSchema } from '../../schemas/block-model.schema';
import { TexturesModule } from '../textures/textures.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: BlockModel.name, schema: BlockModelSchema },
    ]),
    TexturesModule,
  ],
  controllers: [ModelsController],
  providers: [ModelsService],
  exports: [ModelsService],
})
export class ModelsModule {}
