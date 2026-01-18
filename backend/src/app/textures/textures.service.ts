import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Texture, TextureDocument } from '../../schemas/texture.schema';
import { GifGeneratorService } from '../../java/parser/gif-generator.service';

@Injectable()
export class TexturesService {
  private readonly logger = new Logger(TexturesService.name);

  constructor(
    @InjectModel(Texture.name) private textureModel: Model<Texture>,
    private readonly gifGenerator: GifGeneratorService,
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

  async regenerateGifs(namespace?: string): Promise<{
    processed: number;
    generated: number;
    failed: number;
  }> {
    const query: Record<string, unknown> = { animated: true };
    if (namespace) {
      query.namespace = namespace;
    }

    const animatedTextures = await this.textureModel.find(query).exec();
    this.logger.log(
      `Found ${animatedTextures.length} animated textures to process`,
    );

    let generated = 0;
    let failed = 0;

    for (const texture of animatedTextures) {
      try {
        const gifResult = await this.gifGenerator.generateGif(texture.base64, {
          animation: texture.mcmeta?.animation,
        });

        if (gifResult) {
          await this.textureModel.updateOne(
            { _id: texture._id },
            {
              $set: {
                animatedGif: gifResult.gif,
                frameWidth: gifResult.frameWidth,
                frameHeight: gifResult.frameHeight,
                frameCount: gifResult.frameCount,
              },
            },
          );
          generated++;
          this.logger.debug(`Generated GIF for ${texture.texturePath}`);
        } else {
          failed++;
        }
      } catch (error) {
        this.logger.error(
          `Failed to generate GIF for ${texture.texturePath}: ${error.message}`,
        );
        failed++;
      }
    }

    this.logger.log(
      `GIF regeneration complete: ${generated} generated, ${failed} failed`,
    );

    return {
      processed: animatedTextures.length,
      generated,
      failed,
    };
  }
}
