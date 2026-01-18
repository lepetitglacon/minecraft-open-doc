import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ParserService } from './parser.service';
import { ParserController } from './parser.controller';
import { JarExtractorService } from './jar-extractor.service';
import { GifGeneratorService } from './gif-generator.service';
import { IconRendererService } from './icon-renderer.service';
import { Mod, ModSchema } from '../../schemas/mod.schema';
import { Block, BlockSchema } from '../../schemas/block.schema';
import { Texture, TextureSchema } from '../../schemas/texture.schema';
import { BlockModel, BlockModelSchema } from '../../schemas/block-model.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Mod.name, schema: ModSchema },
      { name: Block.name, schema: BlockSchema },
      { name: Texture.name, schema: TextureSchema },
      { name: BlockModel.name, schema: BlockModelSchema },
    ]),
  ],
  controllers: [ParserController],
  providers: [ParserService, JarExtractorService, GifGeneratorService, IconRendererService],
  exports: [ParserService, GifGeneratorService, IconRendererService],
})
export class ParserModule {}
