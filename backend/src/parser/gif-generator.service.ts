import { Injectable, Logger } from '@nestjs/common';
import sharp from 'sharp';
import GifEncoder from 'gif-encoder-2';

export interface McmetaAnimation {
  frametime?: number;
  frames?: (number | { index: number; time?: number })[];
  interpolate?: boolean;
}

export interface GifGenerationResult {
  gif: string; // base64 data URL
  frameWidth: number;
  frameHeight: number;
  frameCount: number;
}

@Injectable()
export class GifGeneratorService {
  private readonly logger = new Logger(GifGeneratorService.name);

  // Minecraft ticks to milliseconds (20 ticks = 1 second)
  private readonly TICK_MS = 50;

  /**
   * Génère un GIF animé à partir d'une spritesheet verticale et ses métadonnées mcmeta
   */
  async generateGif(
    pngBase64: string,
    mcmeta: { animation?: McmetaAnimation },
  ): Promise<GifGenerationResult | null> {
    try {
      // Décoder le base64 PNG
      const pngBuffer = Buffer.from(
        pngBase64.replace(/^data:image\/png;base64,/, ''),
        'base64',
      );

      // Obtenir les dimensions de l'image
      const metadata = await sharp(pngBuffer).metadata();
      if (!metadata.width || !metadata.height) {
        throw new Error('Unable to read image dimensions');
      }

      const { width, height } = metadata;

      // Pour Minecraft, les spritesheets sont verticales
      // La largeur = taille d'une frame, hauteur = multiple de la largeur
      const frameWidth = width;
      const frameHeight = width; // Les frames sont carrées
      const totalFrames = Math.floor(height / frameWidth);

      if (totalFrames <= 1) {
        // Pas une animation, une seule frame
        return null;
      }

      this.logger.debug(
        `Generating GIF: ${frameWidth}x${frameHeight}, ${totalFrames} frames`,
      );

      const animation = mcmeta?.animation || {};
      const frametime = animation.frametime || 1; // Default: 1 tick per frame

      // Construire la liste des frames avec leurs durées
      const frameSequence = this.buildFrameSequence(
        animation,
        totalFrames,
        frametime,
      );

      // Créer l'encodeur GIF
      const encoder = new GifEncoder(frameWidth, frameHeight, 'neuquant');
      encoder.setDelay(frametime * this.TICK_MS);
      encoder.setRepeat(0); // Loop infini
      encoder.setQuality(10); // Qualité (1-30, plus bas = meilleur)

      const chunks: Buffer[] = [];
      encoder.on('data', (chunk: Buffer) => chunks.push(chunk));

      encoder.start();

      // Extraire et ajouter chaque frame
      for (const frame of frameSequence) {
        const frameBuffer = await sharp(pngBuffer)
          .extract({
            left: 0,
            top: frame.index * frameHeight,
            width: frameWidth,
            height: frameHeight,
          })
          .ensureAlpha()
          .raw()
          .toBuffer();

        // Définir le délai pour cette frame spécifique
        encoder.setDelay(frame.time * this.TICK_MS);
        encoder.addFrame(frameBuffer);
      }

      encoder.finish();

      // Convertir en base64
      const gifBuffer = Buffer.concat(chunks);
      const gifBase64 = `data:image/gif;base64,${gifBuffer.toString('base64')}`;

      return {
        gif: gifBase64,
        frameWidth,
        frameHeight,
        frameCount: totalFrames,
      };
    } catch (error) {
      this.logger.error(`Failed to generate GIF: ${error.message}`);
      return null;
    }
  }

  /**
   * Construit la séquence de frames avec leurs durées
   */
  private buildFrameSequence(
    animation: McmetaAnimation,
    totalFrames: number,
    defaultFrametime: number,
  ): { index: number; time: number }[] {
    const frames = animation.frames;

    if (!frames || frames.length === 0) {
      // Pas de frames spécifiées: utiliser toutes les frames dans l'ordre
      return Array.from({ length: totalFrames }, (_, i) => ({
        index: i,
        time: defaultFrametime,
      }));
    }

    // Parser les frames spécifiées
    return frames.map((frame) => {
      if (typeof frame === 'number') {
        return { index: frame, time: defaultFrametime };
      }
      return {
        index: frame.index,
        time: frame.time ?? defaultFrametime,
      };
    });
  }

  /**
   * Vérifie si une texture est animée
   */
  isAnimated(
    pngBase64: string,
    mcmeta?: { animation?: McmetaAnimation },
  ): boolean {
    // Si mcmeta existe avec animation, c'est animé
    return !!mcmeta?.animation;
  }
}
