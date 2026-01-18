import { Injectable, Logger } from '@nestjs/common';
import { createCanvas, loadImage, CanvasRenderingContext2D } from '@napi-rs/canvas';

const ICON_SIZE = 64;
const TEXTURE_SIZE = 16; // Taille standard des textures Minecraft

interface TextureMapping {
  [key: string]: string;
}

interface TexturesBase64 {
  [path: string]: string;
}

interface RGB {
  r: number;
  g: number;
  b: number;
  a: number;
}

@Injectable()
export class IconRendererService {
  private readonly logger = new Logger(IconRendererService.name);

  /**
   * Génère une icône 3D isométrique pour un bloc
   * Utilise un rendu isométrique fidèle au style Minecraft
   */
  async renderBlockIcon(
    textures: TextureMapping,
    texturesBase64: TexturesBase64,
  ): Promise<string | null> {
    try {
      // Trouver les textures pour chaque face
      const topTexture =
        this.getTextureBase64('up', textures, texturesBase64) ||
        this.getTextureBase64('top', textures, texturesBase64);
      const leftTexture =
        this.getTextureBase64('west', textures, texturesBase64) ||
        this.getTextureBase64('side', textures, texturesBase64) ||
        this.getTextureBase64('north', textures, texturesBase64);
      const rightTexture =
        this.getTextureBase64('south', textures, texturesBase64) ||
        this.getTextureBase64('east', textures, texturesBase64) ||
        this.getTextureBase64('side', textures, texturesBase64);

      // Fallback: utiliser 'all' ou la première texture disponible
      const fallback =
        this.getTextureBase64('all', textures, texturesBase64) ||
        Object.values(texturesBase64)[0];

      const top = topTexture || fallback;
      const left = leftTexture || fallback;
      const right = rightTexture || fallback;

      if (!top && !left && !right) {
        return null;
      }

            return await this.renderIsometricCube(top, left, right);

          } catch (error: unknown) {

            const message = error instanceof Error ? error.message : String(error);

            this.logger.error(`Failed to render icon: ${message}`);

            return null;

          }

        }

      

        /**

         * Génère une icône 2D simple pour un bloc

         * Utilise la texture 'front' si disponible, sinon l'unique texture s'il n'y en a qu'une

         */

        async renderSimpleIcon(

          textures: TextureMapping,

          texturesBase64: TexturesBase64,

        ): Promise<string | null> {

          try {

            // 1. Chercher la texture 'front'

            const front = this.getTextureBase64('front', textures, texturesBase64);

            if (front) {

              return Promise.resolve(front);

            }

      

            // 2. Si pas de 'front', et qu'il n'y a qu'une seule texture, l'utiliser

            const texturePaths = Object.keys(texturesBase64);

            if (texturePaths.length === 1) {

              return Promise.resolve(texturesBase64[texturePaths[0]]);

            }

      

            // 3. Fallback sur 'all' ou 'top' ou la première trouvée

            const fallback = this.getTextureBase64('all', textures, texturesBase64)

              || this.getTextureBase64('top', textures, texturesBase64)

              || this.getTextureBase64('up', textures, texturesBase64)

              || texturesBase64[texturePaths[0]];

      

            return Promise.resolve(fallback || null);

          } catch (error: unknown) {

            const message = error instanceof Error ? error.message : String(error);

            this.logger.error(`Failed to render simple icon: ${message}`);

            return null;

          }

        }

  private getTextureBase64(
    face: string,
    textures: TextureMapping,
    texturesBase64: TexturesBase64,
  ): string | null {
    const texPath = textures[face];
    if (texPath && texturesBase64[texPath]) {
      return texturesBase64[texPath];
    }
    return null;
  }

  /**
   * Extrait les pixels d'une image en tableau RGBA
   */
  private async getPixelData(
    base64: string,
  ): Promise<Uint8ClampedArray | null> {
    try {
      const img = await loadImage(base64);
      const canvas = createCanvas(TEXTURE_SIZE, TEXTURE_SIZE);
      const ctx = canvas.getContext('2d');

      // Désactiver l'antialiasing pour garder les pixels nets
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(img, 0, 0, TEXTURE_SIZE, TEXTURE_SIZE);

      const imageData = ctx.getImageData(0, 0, TEXTURE_SIZE, TEXTURE_SIZE);
      return imageData.data;
    } catch (error: unknown) {
      return null;
    }
  }

  /**
   * Récupère un pixel de la texture
   */
  private getPixel(data: Uint8ClampedArray, x: number, y: number): RGB {
    const idx = (y * TEXTURE_SIZE + x) * 4;
    return {
      r: data[idx],
      g: data[idx + 1],
      b: data[idx + 2],
      a: data[idx + 3],
    };
  }

  /**
   * Dessine un cube isométrique pixel par pixel
   */
  private async renderIsometricCube(
    topBase64: string | null,
    leftBase64: string | null,
    rightBase64: string | null,
  ): Promise<string> {
    const canvas = createCanvas(ICON_SIZE, ICON_SIZE);
    const ctx = canvas.getContext('2d');

    // Charger les données des textures
    const [topData, leftData, rightData] = await Promise.all([
      topBase64 ? this.getPixelData(topBase64) : null,
      leftBase64 ? this.getPixelData(leftBase64) : null,
      rightBase64 ? this.getPixelData(rightBase64) : null,
    ]);

    // Paramètres du cube isométrique
    // Chaque pixel de texture = 2 pixels sur le rendu
    const scale = 2;
    const texSize = TEXTURE_SIZE;

    // Point central du cube (centre de la face du dessus)
    const cx = ICON_SIZE / 2;
    const cy = 16; // Décalé vers le haut pour laisser de la place

    // Dessiner la face gauche (west)
    if (leftData) {
      for (let u = 0; u < texSize; u++) {
        for (let v = 0; v < texSize; v++) {
          const pixel = this.getPixel(leftData, u, v);
          if (pixel.a === 0) continue;

          // Projection isométrique pour la face gauche
          // u va de gauche à droite sur la texture (correspond à la profondeur)
          // v va de haut en bas sur la texture (correspond à la hauteur)
          const screenX = cx - (texSize - u) * scale + (u * scale) / 2;
          const screenY = cy + (u * scale) / 2 + v * scale;

          // Assombrir la face gauche (environ 60% de luminosité)
          const brightness = 0.6;
          ctx.fillStyle = `rgba(${Math.floor(pixel.r * brightness)}, ${Math.floor(pixel.g * brightness)}, ${Math.floor(pixel.b * brightness)}, ${pixel.a / 255})`;

          // Dessiner le pixel comme un parallélogramme
          this.drawIsometricPixelLeft(ctx, screenX, screenY, scale);
        }
      }
    }

    // Dessiner la face droite (south)
    if (rightData) {
      for (let u = 0; u < texSize; u++) {
        for (let v = 0; v < texSize; v++) {
          const pixel = this.getPixel(rightData, u, v);
          if (pixel.a === 0) continue;

          // Projection isométrique pour la face droite
          const screenX = cx + u * scale;
          const screenY =
            cy + (texSize * scale) / 2 + (u * scale) / 2 + v * scale;

          // Assombrir légèrement la face droite (environ 80% de luminosité)
          const brightness = 0.8;
          ctx.fillStyle = `rgba(${Math.floor(pixel.r * brightness)}, ${Math.floor(pixel.g * brightness)}, ${Math.floor(pixel.b * brightness)}, ${pixel.a / 255})`;

          this.drawIsometricPixelRight(ctx, screenX, screenY, scale);
        }
      }
    }

    // Dessiner la face du dessus (top) - la plus brillante
    if (topData) {
      for (let u = 0; u < texSize; u++) {
        for (let v = 0; v < texSize; v++) {
          const pixel = this.getPixel(topData, u, v);
          if (pixel.a === 0) continue;

          // Projection isométrique pour la face du dessus
          // Le losange est formé par la transformation isométrique
          const screenX = cx + (u - v) * scale;
          const screenY = cy + ((u + v) * scale) / 2;

          ctx.fillStyle = `rgba(${pixel.r}, ${pixel.g}, ${pixel.b}, ${pixel.a / 255})`;

          this.drawIsometricPixelTop(ctx, screenX, screenY, scale);
        }
      }
    }

    return canvas.toDataURL('image/png');
  }

  /**
   * Dessine un pixel isométrique pour la face du dessus (losange)
   */
  private drawIsometricPixelTop(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number): void {
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + scale, y + scale / 2);
    ctx.lineTo(x, y + scale);
    ctx.lineTo(x - scale, y + scale / 2);
    ctx.closePath();
    ctx.fill();
  }

  /**
   * Dessine un pixel isométrique pour la face gauche (parallélogramme)
   */
  private drawIsometricPixelLeft(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number): void {
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + scale, y + scale / 2);
    ctx.lineTo(x + scale, y + scale + scale / 2);
    ctx.lineTo(x, y + scale);
    ctx.closePath();
    ctx.fill();
  }

  /**
   * Dessine un pixel isométrique pour la face droite (parallélogramme)
   */
  private drawIsometricPixelRight(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number): void {
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + scale, y - scale / 2);
    ctx.lineTo(x + scale, y + scale - scale / 2);
    ctx.lineTo(x, y + scale);
    ctx.closePath();
    ctx.fill();
  }
}
