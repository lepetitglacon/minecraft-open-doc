import * as THREE from 'three';
import { BlockDefinition } from '../types';
import { BlockRegistry } from './BlockRegistry';
import { TextureManager } from '../textures/TextureManager';
import { FaceMapper } from '../textures/FaceMapper';
import { FullCubeShape } from './shapes/FullCubeShape';

export class BlockFactory {
  constructor(
    private textureManager: TextureManager,
    private registry: BlockRegistry
  ) {}

  async createMesh(blockId: string): Promise<THREE.Mesh> {
    const definition = this.registry.get(blockId);
    if (!definition) {
      throw new Error(`Block not found: ${blockId}`);
    }

    return this.createMeshFromDefinition(definition);
  }

  async createMeshFromDefinition(definition: BlockDefinition): Promise<THREE.Mesh> {
    const basePath = this.registry.getTextureBasePath(definition.id);
    const resolvedTextures = FaceMapper.resolveAllFaces(definition.textures);
    const transparent = definition.transparent ?? false;

    let mesh: THREE.Mesh;

    switch (definition.shape) {
      case 'full_cube':
        mesh = await FullCubeShape.createMesh(
          resolvedTextures,
          basePath,
          this.textureManager,
          transparent
        );
        break;

      case 'slab_bottom':
        mesh = await this.createSlabMesh(resolvedTextures, basePath, transparent, false);
        break;

      case 'slab_top':
        mesh = await this.createSlabMesh(resolvedTextures, basePath, transparent, true);
        break;

      case 'stairs':
        mesh = await this.createStairsMesh(resolvedTextures, basePath, transparent);
        break;

      default:
        // Fallback to full cube
        mesh = await FullCubeShape.createMesh(
          resolvedTextures,
          basePath,
          this.textureManager,
          transparent
        );
    }

    mesh.userData.blockId = definition.id;
    mesh.userData.blockDefinition = definition;

    return mesh;
  }

  private async createSlabMesh(
    textures: { top: string; bottom: string; north: string; south: string; east: string; west: string },
    basePath: string,
    transparent: boolean,
    isTop: boolean
  ): Promise<THREE.Mesh> {
    const geometry = new THREE.BoxGeometry(1, 0.5, 1);

    const faceOrder: ('east' | 'west' | 'top' | 'bottom' | 'south' | 'north')[] = [
      'east', 'west', 'top', 'bottom', 'south', 'north',
    ];

    const materials = await Promise.all(
      faceOrder.map(async (face) => {
        const texturePath = basePath + textures[face];
        const texture = await this.textureManager.loadTexture(texturePath);

        return new THREE.MeshLambertMaterial({
          map: texture,
          transparent,
          alphaTest: transparent ? 0.1 : 0,
        });
      })
    );

    const mesh = new THREE.Mesh(geometry, materials);
    mesh.position.y = isTop ? 0.25 : -0.25;

    return mesh;
  }

  private async createStairsMesh(
    textures: { top: string; bottom: string; north: string; south: string; east: string; west: string },
    basePath: string,
    transparent: boolean
  ): Promise<THREE.Mesh> {
    // Simplified stairs - just use two boxes for now
    const group = new THREE.Group();

    // Bottom half
    const bottomGeometry = new THREE.BoxGeometry(1, 0.5, 1);
    const topGeometry = new THREE.BoxGeometry(1, 0.5, 0.5);

    const faceOrder: ('east' | 'west' | 'top' | 'bottom' | 'south' | 'north')[] = [
      'east', 'west', 'top', 'bottom', 'south', 'north',
    ];

    const materials = await Promise.all(
      faceOrder.map(async (face) => {
        const texturePath = basePath + textures[face];
        const texture = await this.textureManager.loadTexture(texturePath);

        return new THREE.MeshLambertMaterial({
          map: texture,
          transparent,
          alphaTest: transparent ? 0.1 : 0,
        });
      })
    );

    const bottomMesh = new THREE.Mesh(bottomGeometry, materials);
    bottomMesh.position.y = -0.25;
    group.add(bottomMesh);

    const topMesh = new THREE.Mesh(topGeometry, materials.map(m => m.clone()));
    topMesh.position.y = 0.25;
    topMesh.position.z = 0.25;
    group.add(topMesh);

    // Convert group to single mesh for consistency
    // For simplicity, we'll return the first mesh and add the second as a child
    const container = new THREE.Mesh();
    container.add(group);

    return container;
  }

  async preloadBlockTextures(blockId: string): Promise<void> {
    const definition = this.registry.get(blockId);
    if (!definition) return;

    const basePath = this.registry.getTextureBasePath(blockId);
    const paths = FaceMapper.getUniquePaths(definition.textures, basePath);
    await this.textureManager.preloadTextures(paths);
  }
}
