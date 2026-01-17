import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TexturesController } from './textures.controller';
import { TexturesService } from './textures.service';
import { Texture, TextureSchema } from '../schemas/texture.schema';
import { ParserModule } from '../parser/parser.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Texture.name, schema: TextureSchema }]),
    ParserModule,
  ],
  controllers: [TexturesController],
  providers: [TexturesService],
  exports: [TexturesService],
})
export class TexturesModule {}
