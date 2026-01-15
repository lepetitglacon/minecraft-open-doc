import * as THREE from 'three';

export class TextureManager {
  private textureCache: Map<string, THREE.Texture> = new Map();
  private loadingPromises: Map<string, Promise<THREE.Texture>> = new Map();
  private loader: THREE.TextureLoader;
  private missingTexture: THREE.Texture | null = null;

  constructor() {
    this.loader = new THREE.TextureLoader();
  }

  private createMissingTexture(): THREE.Texture {
    if (this.missingTexture) {
      return this.missingTexture;
    }

    const canvas = document.createElement('canvas');
    canvas.width = 16;
    canvas.height = 16;
    const ctx = canvas.getContext('2d')!;

    // Create magenta/black checkerboard pattern
    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 16; x++) {
        const isMagenta = (Math.floor(x / 8) + Math.floor(y / 8)) % 2 === 0;
        ctx.fillStyle = isMagenta ? '#ff00ff' : '#000000';
        ctx.fillRect(x, y, 1, 1);
      }
    }

    const texture = new THREE.CanvasTexture(canvas);
    this.applyMinecraftFiltering(texture);
    this.missingTexture = texture;
    return texture;
  }

  private applyMinecraftFiltering(texture: THREE.Texture): void {
    texture.magFilter = THREE.NearestFilter;
    texture.minFilter = THREE.NearestFilter;
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.generateMipmaps = false;
  }

  async loadTexture(path: string): Promise<THREE.Texture> {
    // Check cache first
    const cached = this.textureCache.get(path);
    if (cached) {
      return cached;
    }

    // Check if already loading
    const existingPromise = this.loadingPromises.get(path);
    if (existingPromise) {
      return existingPromise;
    }

    // Start loading
    const loadPromise = new Promise<THREE.Texture>((resolve) => {
      this.loader.load(
        path,
        (texture) => {
          this.applyMinecraftFiltering(texture);
          this.textureCache.set(path, texture);
          this.loadingPromises.delete(path);
          resolve(texture);
        },
        undefined,
        () => {
          console.warn(`Failed to load texture: ${path}, using fallback`);
          const fallback = this.createMissingTexture();
          this.loadingPromises.delete(path);
          resolve(fallback);
        }
      );
    });

    this.loadingPromises.set(path, loadPromise);
    return loadPromise;
  }

  getTexture(path: string): THREE.Texture | undefined {
    return this.textureCache.get(path);
  }

  async preloadTextures(paths: string[]): Promise<void> {
    await Promise.all(paths.map((path) => this.loadTexture(path)));
  }

  dispose(): void {
    this.textureCache.forEach((texture) => texture.dispose());
    this.textureCache.clear();
    this.loadingPromises.clear();
    if (this.missingTexture) {
      this.missingTexture.dispose();
      this.missingTexture = null;
    }
  }
}
