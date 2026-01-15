import * as THREE from 'three';
import { ResolvedFaceTextures } from '../../types';
import { TextureManager } from '../../textures/TextureManager';

export class FullCubeShape {
  static createGeometry(): THREE.BoxGeometry {
    return new THREE.BoxGeometry(1, 1, 1);
  }

  static async createMaterials(
    textures: ResolvedFaceTextures,
    basePath: string,
    textureManager: TextureManager,
    transparent: boolean = false
  ): Promise<THREE.MeshLambertMaterial[]> {
    // BoxGeometry face order: +X, -X, +Y, -Y, +Z, -Z
    // Which corresponds to: east, west, top, bottom, south, north
    const faceOrder: (keyof ResolvedFaceTextures)[] = [
      'east',
      'west',
      'top',
      'bottom',
      'south',
      'north',
    ];

    const materials = await Promise.all(
      faceOrder.map(async (face) => {
        const texturePath = basePath + textures[face];
        const texture = await textureManager.loadTexture(texturePath);

        return new THREE.MeshLambertMaterial({
          map: texture,
          transparent,
          alphaTest: transparent ? 0.1 : 0,
          side: THREE.FrontSide,
        });
      })
    );

    return materials;
  }

  static async createMesh(
    textures: ResolvedFaceTextures,
    basePath: string,
    textureManager: TextureManager,
    transparent: boolean = false
  ): Promise<THREE.Mesh> {
    const geometry = this.createGeometry();
    const materials = await this.createMaterials(
      textures,
      basePath,
      textureManager,
      transparent
    );

    return new THREE.Mesh(geometry, materials);
  }
}
