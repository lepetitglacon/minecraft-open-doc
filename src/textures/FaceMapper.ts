import { BlockFace, BlockTextures, ResolvedFaceTextures } from '../types';

export class FaceMapper {
  static resolveFaceTexture(textures: BlockTextures, face: BlockFace): string {
    // Priority: specific face > sides (for lateral faces) > all
    switch (face) {
      case 'top':
        return textures.top ?? textures.all ?? '';
      case 'bottom':
        return textures.bottom ?? textures.all ?? '';
      case 'north':
        return textures.north ?? textures.sides ?? textures.all ?? '';
      case 'south':
        return textures.south ?? textures.sides ?? textures.all ?? '';
      case 'east':
        return textures.east ?? textures.sides ?? textures.all ?? '';
      case 'west':
        return textures.west ?? textures.sides ?? textures.all ?? '';
    }
  }

  static resolveAllFaces(textures: BlockTextures): ResolvedFaceTextures {
    return {
      top: this.resolveFaceTexture(textures, 'top'),
      bottom: this.resolveFaceTexture(textures, 'bottom'),
      north: this.resolveFaceTexture(textures, 'north'),
      south: this.resolveFaceTexture(textures, 'south'),
      east: this.resolveFaceTexture(textures, 'east'),
      west: this.resolveFaceTexture(textures, 'west'),
    };
  }

  static getUniquePaths(textures: BlockTextures, basePath: string): string[] {
    const resolved = this.resolveAllFaces(textures);
    const paths = new Set<string>();

    Object.values(resolved).forEach((textureName) => {
      if (textureName) {
        paths.add(basePath + textureName);
      }
    });

    return Array.from(paths);
  }
}
