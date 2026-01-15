import * as THREE from 'three';
import { SceneManager } from './SceneManager';
import { CameraController, CameraOptions } from './CameraController';
import { LightingManager } from './LightingManager';
import { InteractionManager } from './InteractionManager';
import { TextureManager } from '../textures/TextureManager';
import { BlockRegistry } from '../blocks/BlockRegistry';
import { BlockFactory } from '../blocks/BlockFactory';
import { ModLoader } from '../loaders/ModLoader';
import { ModDefinition } from '../types';

export type ViewerMode = 'view' | 'build';

export interface BlockViewerOptions {
  camera?: CameraOptions;
  backgroundColor?: number;
}

export class BlockViewer {
  private sceneManager: SceneManager;
  private cameraController: CameraController;
  private lightingManager: LightingManager;
  private interactionManager: InteractionManager;
  private textureManager: TextureManager;
  private blockRegistry: BlockRegistry;
  private blockFactory: BlockFactory;
  private modLoader: ModLoader;

  private currentBlock: THREE.Object3D | null = null;
  private animationId: number | null = null;
  private isRunning = false;
  private mode: ViewerMode = 'view';
  private selectedBlockId: string | null = null;

  constructor(container: HTMLElement, options: BlockViewerOptions = {}) {
    // Initialize managers
    this.sceneManager = new SceneManager(container);
    this.cameraController = new CameraController(
      container,
      this.sceneManager.renderer,
      options.camera
    );
    this.lightingManager = new LightingManager(this.sceneManager.scene);
    this.textureManager = new TextureManager();
    this.blockRegistry = new BlockRegistry();
    this.blockFactory = new BlockFactory(this.textureManager, this.blockRegistry);
    this.modLoader = new ModLoader(this.blockRegistry);

    // Initialize interaction manager
    this.interactionManager = new InteractionManager(
      this.cameraController.camera,
      this.sceneManager.scene,
      container
    );

    // Set up interaction callbacks
    this.interactionManager.onPlace(async (blockId, position) => {
      const mesh = await this.blockFactory.createMesh(blockId);
      this.interactionManager.addBlock(mesh, blockId, position);
    });

    this.interactionManager.onRemove((position) => {
      this.interactionManager.removeBlock(position);
    });

    // Set background color
    if (options.backgroundColor !== undefined) {
      this.sceneManager.scene.background = new THREE.Color(options.backgroundColor);
    }

    // Add grid helper
    const gridHelper = new THREE.GridHelper(10, 10, 0x444444, 0x222222);
    gridHelper.position.y = -0.5;
    this.sceneManager.add(gridHelper);

    // Start render loop
    this.start();
  }

  async loadMod(configPath: string): Promise<ModDefinition> {
    return this.modLoader.loadMod(configPath);
  }

  async loadMods(configPaths: string[]): Promise<ModDefinition[]> {
    return this.modLoader.loadAllMods(configPaths);
  }

  async displayBlock(blockId: string): Promise<void> {
    // Remove current block
    if (this.currentBlock) {
      this.sceneManager.remove(this.currentBlock);
      this.disposeObject(this.currentBlock);
      this.currentBlock = null;
    }

    // Create and add new block
    const mesh = await this.blockFactory.createMesh(blockId);
    this.sceneManager.add(mesh);
    this.currentBlock = mesh;
  }

  clearBlock(): void {
    if (this.currentBlock) {
      this.sceneManager.remove(this.currentBlock);
      this.disposeObject(this.currentBlock);
      this.currentBlock = null;
    }
  }

  getRegistry(): BlockRegistry {
    return this.blockRegistry;
  }

  getAllBlockIds(): string[] {
    return this.blockRegistry.getAll().map((b) => b.id);
  }

  getBlocksByNamespace(namespace: string): string[] {
    return this.blockRegistry.getByNamespace(namespace).map((b) => b.id);
  }

  resetCamera(): void {
    this.cameraController.resetCamera();
  }

  setZoom(level: number): void {
    this.cameraController.setZoom(level);
  }

  // Mode management
  setMode(mode: ViewerMode): void {
    this.mode = mode;

    if (mode === 'view') {
      // In view mode, disable building
      this.interactionManager.setEnabled(false);
      this.cameraController.controls.enabled = true;
    } else {
      // In build mode, enable building
      this.interactionManager.setEnabled(true);
      // Keep orbit controls enabled but we'll handle clicks differently
      this.cameraController.controls.enabled = true;
      this.cameraController.controls.enableRotate = true;
      this.cameraController.controls.enablePan = true;
    }
  }

  getMode(): ViewerMode {
    return this.mode;
  }

  // Block selection for building
  async selectBlockForBuilding(blockId: string): Promise<void> {
    this.selectedBlockId = blockId;
    this.interactionManager.setSelectedBlock(blockId);

    // Create preview mesh
    const previewMesh = await this.blockFactory.createMesh(blockId);
    this.interactionManager.setPreviewMesh(previewMesh, blockId);
  }

  deselectBlock(): void {
    this.selectedBlockId = null;
    this.interactionManager.setSelectedBlock(null);
    this.interactionManager.setPreviewMesh(null, null);
  }

  getSelectedBlockId(): string | null {
    return this.selectedBlockId;
  }

  // Get placed blocks for saving/export
  getPlacedBlocks(): Array<{ blockId: string; position: { x: number; y: number; z: number } }> {
    return this.interactionManager.getPlacedBlocks().map(b => ({
      blockId: b.blockId,
      position: { x: b.position.x, y: b.position.y, z: b.position.z }
    }));
  }

  // Clear all placed blocks
  clearPlacedBlocks(): void {
    this.interactionManager.clearAllBlocks();
  }

  start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    this.animate();
  }

  stop(): void {
    this.isRunning = false;
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  private animate = (): void => {
    if (!this.isRunning) return;

    this.animationId = requestAnimationFrame(this.animate);
    this.cameraController.update();
    this.sceneManager.render(this.cameraController.camera);
  };

  private disposeObject(obj: THREE.Object3D): void {
    obj.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.geometry?.dispose();
        if (Array.isArray(child.material)) {
          child.material.forEach((m) => m.dispose());
        } else {
          child.material?.dispose();
        }
      }
    });
  }

  dispose(): void {
    this.stop();
    this.clearBlock();
    this.interactionManager.dispose();
    this.lightingManager.dispose();
    this.cameraController.dispose();
    this.sceneManager.dispose();
    this.textureManager.dispose();
    this.blockRegistry.clear();
  }
}
