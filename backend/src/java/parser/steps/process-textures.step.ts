import { Model } from 'mongoose';
import { ParseStep } from './parse-step';
import { Texture } from '../../../schemas/texture.schema';
import { ExtractedTexture } from '../jar-extractor.service';
import { GifGeneratorService } from '../gif-generator.service';

export interface ProcessTexturesInput {
  textures: ExtractedTexture[];
  modId: string;
  modVersion: string;
  minecraftVersion: string;
}

export interface ProcessTexturesOutput {
  texturesCreated: number;
  gifsGenerated: number;
  texturesBase64Map: Map<string, string>;
}

export class ProcessTexturesStep extends ParseStep<
  ProcessTexturesInput,
  ProcessTexturesOutput
> {
  readonly name = 'process-textures';

  constructor(
    private readonly textureModel: Model<Texture>,
    private readonly gifGenerator: GifGeneratorService,
  ) {
    super();
  }

  async execute(input: ProcessTexturesInput): Promise<ProcessTexturesOutput> {
    const { textures, modId, modVersion, minecraftVersion } = input;

    this.progress(0, textures.length);

    let texturesCreated = 0;
    let gifsGenerated = 0;
    const texturesBase64Map = new Map<string, string>();

    for (let i = 0; i < textures.length; i++) {
      const tex = textures[i];
      texturesBase64Map.set(tex.texturePath, tex.base64);

      let animatedGif: string | undefined;
      let frameWidth: number | undefined;
      let frameHeight: number | undefined;
      let frameCount: number | undefined;

      if (tex.mcmeta?.animation) {
        const gifResult = await this.gifGenerator.generateGif(
          tex.base64,
          tex.mcmeta as {
            animation?: {
              frametime?: number;
              frames?: (number | { index: number; time?: number })[];
              interpolate?: boolean;
            };
          },
        );
        if (gifResult) {
          animatedGif = gifResult.gif;
          frameWidth = gifResult.frameWidth;
          frameHeight = gifResult.frameHeight;
          frameCount = gifResult.frameCount;
          gifsGenerated++;
        }
      }

      const result = await this.textureModel.updateOne(
        {
          texturePath: tex.texturePath,
          'mod.modVersion': modVersion,
          'mod.minecraftVersion': minecraftVersion,
        },
        {
          $set: {
            texturePath: tex.texturePath,
            namespace: modId,
            filename: tex.filename,
            mod: { modId, modVersion, minecraftVersion },
            base64: tex.base64,
            width: tex.width,
            height: tex.height,
            animated: !!tex.mcmeta?.animation,
            mcmeta: tex.mcmeta,
            animatedGif,
            frameWidth,
            frameHeight,
            frameCount,
          },
        },
        { upsert: true },
      );

      if (result.upsertedCount > 0) texturesCreated++;

      if ((i + 1) % 20 === 0 || i === textures.length - 1) {
        this.progress(i + 1, textures.length);
      }
    }

    this.complete(`${texturesCreated} textures, ${gifsGenerated} GIFs`);

    return { texturesCreated, gifsGenerated, texturesBase64Map };
  }
}
