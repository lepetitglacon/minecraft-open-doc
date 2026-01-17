import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BlocksController } from './blocks.controller';
import { BlocksService } from './blocks.service';
import { Block, BlockSchema } from '../schemas/block.schema';
import { TexturesModule } from '../textures/textures.module';
import { ModelsModule } from '../models/models.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Block.name, schema: BlockSchema }]),
    TexturesModule,
    ModelsModule,
  ],
  controllers: [BlocksController],
  providers: [BlocksService],
  exports: [BlocksService],
})
export class BlocksModule {}
