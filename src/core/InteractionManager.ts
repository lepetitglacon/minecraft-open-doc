import * as THREE from 'three';

export interface PlacedBlock {
  mesh: THREE.Mesh;
  blockId: string;
  position: THREE.Vector3;
}

export interface InteractionManagerOptions {
  gridSize?: number;
  gridExtent?: number;
}

export class InteractionManager {
  private camera: THREE.Camera;
  private scene: THREE.Scene;
  private container: HTMLElement;
  private raycaster: THREE.Raycaster;
  private mouse: THREE.Vector2;
  private gridMesh: THREE.Mesh;

  private placedBlocks: Map<string, PlacedBlock> = new Map();
  private previewMesh: THREE.Mesh | null = null;

  private gridSize: number;
  private gridExtent: number;

  private isEnabled: boolean = true;
  private selectedBlockId: string | null = null;

  private onBlockPlaced?: (blockId: string, position: THREE.Vector3) => void;
  private onBlockRemoved?: (position: THREE.Vector3) => void;

  private mouseDownPosition: { x: number; y: number } | null = null;
  private readonly CLICK_THRESHOLD = 5; // pixels

  constructor(
    camera: THREE.Camera,
    scene: THREE.Scene,
    container: HTMLElement,
    options: InteractionManagerOptions = {}
  ) {
    this.camera = camera;
    this.scene = scene;
    this.container = container;

    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();

    this.gridSize = options.gridSize ?? 1;
    this.gridExtent = 10; // 10x10 grid

    // Create invisible grid mesh for raycasting
    const gridGeometry = new THREE.PlaneGeometry(
      this.gridExtent * this.gridSize,
      this.gridExtent * this.gridSize
    );
    gridGeometry.rotateX(-Math.PI / 2); // Make it horizontal
    const gridMaterial = new THREE.MeshBasicMaterial({
      visible: false,
      side: THREE.DoubleSide,
    });
    this.gridMesh = new THREE.Mesh(gridGeometry, gridMaterial);
    this.gridMesh.position.y = -0.5; // At ground level
    this.scene.add(this.gridMesh);

    this.bindEvents();
  }

  private bindEvents(): void {
    this.container.addEventListener('mousemove', this.onMouseMove);
    this.container.addEventListener('mousedown', this.onMouseDown);
    this.container.addEventListener('mouseup', this.onMouseUp);
    this.container.addEventListener('contextmenu', this.onContextMenu);
  }

  private unbindEvents(): void {
    this.container.removeEventListener('mousemove', this.onMouseMove);
    this.container.removeEventListener('mousedown', this.onMouseDown);
    this.container.removeEventListener('mouseup', this.onMouseUp);
    this.container.removeEventListener('contextmenu', this.onContextMenu);
  }

  private onContextMenu = (event: MouseEvent): void => {
    event.preventDefault();
  };

  private onMouseMove = (event: MouseEvent): void => {
    if (!this.isEnabled || !this.selectedBlockId) {
      this.hidePreview();
      return;
    }

    this.updateMousePosition(event);
    this.updatePreview();
  };

  private onMouseDown = (event: MouseEvent): void => {
    if (!this.isEnabled) return;

    // Record mouse down position to detect drag vs click
    this.mouseDownPosition = { x: event.clientX, y: event.clientY };
  };

  private onMouseUp = (event: MouseEvent): void => {
    if (!this.isEnabled || !this.mouseDownPosition) {
      this.mouseDownPosition = null;
      return;
    }

    // Check if this was a click (not a drag)
    const dx = Math.abs(event.clientX - this.mouseDownPosition.x);
    const dy = Math.abs(event.clientY - this.mouseDownPosition.y);
    const isClick = dx < this.CLICK_THRESHOLD && dy < this.CLICK_THRESHOLD;

    this.mouseDownPosition = null;

    if (!isClick) return;

    this.updateMousePosition(event);

    if (event.button === 0) {
      // Left click - place block
      this.handleLeftClick();
    } else if (event.button === 2) {
      // Right click - remove block
      this.handleRightClick();
    }
  };

  private updateMousePosition(event: MouseEvent): void {
    const rect = this.container.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  }

  private getGridPosition(point: THREE.Vector3): THREE.Vector3 | null {
    // Snap to grid center
    const halfGrid = this.gridSize / 2;
    const x = Math.floor(point.x / this.gridSize) * this.gridSize + halfGrid;
    const y = Math.floor((point.y + 0.5) / this.gridSize) * this.gridSize;
    const z = Math.floor(point.z / this.gridSize) * this.gridSize + halfGrid;

    // Check bounds - must be within grid extent and y >= 0
    const halfExtent = (this.gridExtent * this.gridSize) / 2;
    if (x < -halfExtent + halfGrid || x > halfExtent - halfGrid) return null;
    if (z < -halfExtent + halfGrid || z > halfExtent - halfGrid) return null;
    if (y < 0) return null; // Cannot place below ground
    if (y > 20) return null; // Max height limit

    return new THREE.Vector3(x, y, z);
  }

  private positionToKey(position: THREE.Vector3): string {
    return `${position.x.toFixed(1)},${position.y.toFixed(1)},${position.z.toFixed(1)}`;
  }

  private getPlacementPosition(): THREE.Vector3 | null {
    this.raycaster.setFromCamera(this.mouse, this.camera);

    // First, check if we hit any existing blocks
    const blockMeshes = Array.from(this.placedBlocks.values()).map(b => b.mesh);

    if (blockMeshes.length > 0) {
      const intersects = this.raycaster.intersectObjects(blockMeshes);

      if (intersects.length > 0) {
        const hit = intersects[0];
        const face = hit.face;

        if (face && hit.object instanceof THREE.Mesh) {
          // Calculate the position for the new block based on the hit face
          const normal = face.normal.clone();
          normal.transformDirection(hit.object.matrixWorld);

          const newPos = hit.object.position.clone().add(normal);
          return this.getGridPosition(newPos);
        }
      }
    }

    // If no block hit, intersect with grid mesh
    const gridIntersects = this.raycaster.intersectObject(this.gridMesh);
    if (gridIntersects.length > 0) {
      const hit = gridIntersects[0];
      // Place block at y=0 (first layer above ground)
      const point = hit.point.clone();
      point.y = 0; // Force to ground level for placement calculation
      return this.getGridPosition(point);
    }

    return null;
  }

  private getRemovalPosition(): THREE.Vector3 | null {
    this.raycaster.setFromCamera(this.mouse, this.camera);

    const blockMeshes = Array.from(this.placedBlocks.values()).map(b => b.mesh);

    if (blockMeshes.length === 0) return null;

    const intersects = this.raycaster.intersectObjects(blockMeshes);

    if (intersects.length > 0) {
      const hit = intersects[0];
      if (hit.object instanceof THREE.Mesh) {
        return hit.object.position.clone();
      }
    }

    return null;
  }

  private handleLeftClick(): void {
    if (!this.selectedBlockId) return;

    const position = this.getPlacementPosition();
    if (position) {
      const key = this.positionToKey(position);

      // Check if position is already occupied
      if (this.placedBlocks.has(key)) {
        return;
      }

      this.onBlockPlaced?.(this.selectedBlockId, position);
    }
  }

  private handleRightClick(): void {
    const position = this.getRemovalPosition();
    if (position) {
      const key = this.positionToKey(position);
      const block = this.placedBlocks.get(key);

      if (block) {
        this.onBlockRemoved?.(position);
      }
    }
  }

  private updatePreview(): void {
    if (!this.previewMesh || !this.selectedBlockId) {
      this.hidePreview();
      return;
    }

    const position = this.getPlacementPosition();
    if (position) {
      const key = this.positionToKey(position);

      // Don't show preview if position is occupied
      if (this.placedBlocks.has(key)) {
        this.previewMesh.visible = false;
        return;
      }

      this.previewMesh.position.copy(position);
      this.previewMesh.visible = true;
    } else {
      this.previewMesh.visible = false;
    }
  }

  private hidePreview(): void {
    if (this.previewMesh) {
      this.previewMesh.visible = false;
    }
  }

  setSelectedBlock(blockId: string | null): void {
    this.selectedBlockId = blockId;
    if (!blockId) {
      this.hidePreview();
    }
  }

  setPreviewMesh(mesh: THREE.Mesh | null, _blockId: string | null): void {
    // Remove old preview
    if (this.previewMesh) {
      this.scene.remove(this.previewMesh);
      this.disposeMesh(this.previewMesh);
    }

    this.previewMesh = mesh;

    if (mesh) {
      // Make preview semi-transparent
      mesh.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          if (Array.isArray(child.material)) {
            child.material = child.material.map(m => {
              const newMat = m.clone();
              newMat.transparent = true;
              newMat.opacity = 0.5;
              return newMat;
            });
          } else {
            const newMat = child.material.clone();
            newMat.transparent = true;
            newMat.opacity = 0.5;
            child.material = newMat;
          }
        }
      });

      mesh.visible = false;
      this.scene.add(mesh);
    }
  }

  addBlock(mesh: THREE.Mesh, blockId: string, position: THREE.Vector3): void {
    const key = this.positionToKey(position);
    mesh.position.copy(position);
    this.scene.add(mesh);
    this.placedBlocks.set(key, { mesh, blockId, position: position.clone() });
  }

  removeBlock(position: THREE.Vector3): PlacedBlock | null {
    const key = this.positionToKey(position);
    const block = this.placedBlocks.get(key);

    if (block) {
      this.scene.remove(block.mesh);
      this.disposeMesh(block.mesh);
      this.placedBlocks.delete(key);
      return block;
    }

    return null;
  }

  clearAllBlocks(): void {
    for (const block of this.placedBlocks.values()) {
      this.scene.remove(block.mesh);
      this.disposeMesh(block.mesh);
    }
    this.placedBlocks.clear();
  }

  getPlacedBlocks(): PlacedBlock[] {
    return Array.from(this.placedBlocks.values());
  }

  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
    if (!enabled) {
      this.hidePreview();
    }
  }

  onPlace(callback: (blockId: string, position: THREE.Vector3) => void): void {
    this.onBlockPlaced = callback;
  }

  onRemove(callback: (position: THREE.Vector3) => void): void {
    this.onBlockRemoved = callback;
  }

  private disposeMesh(mesh: THREE.Mesh): void {
    mesh.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.geometry?.dispose();
        if (Array.isArray(child.material)) {
          child.material.forEach(m => m.dispose());
        } else {
          child.material?.dispose();
        }
      }
    });
  }

  dispose(): void {
    this.unbindEvents();
    this.clearAllBlocks();
    if (this.previewMesh) {
      this.scene.remove(this.previewMesh);
      this.disposeMesh(this.previewMesh);
    }
    // Clean up grid mesh
    this.scene.remove(this.gridMesh);
    this.gridMesh.geometry.dispose();
    (this.gridMesh.material as THREE.Material).dispose();
  }
}
