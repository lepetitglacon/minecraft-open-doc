import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TexturesController } from './textures.controller';
import { TexturesService } from './textures.service';
import { Texture, TextureSchema } from '../schemas/texture.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Texture.name, schema: TextureSchema }]),
  ],
  controllers: [TexturesController],
  providers: [TexturesService],
  exports: [TexturesService],
})
export class TexturesModule {}
