import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

interface TextureMapping {
  [key: string]: string;
}

interface TexturesBase64 {
  [path: string]: string;
}

interface ModelElementFace {
  uv?: [number, number, number, number];
  texture: string;
  cullface?: string;
  rotation?: number;
  tintindex?: number;
}

interface ModelElement {
  from: [number, number, number];
  to: [number, number, number];
  rotation?: {
    origin: [number, number, number];
    axis: 'x' | 'y' | 'z';
    angle: number;
    rescale?: boolean;
  };
  faces: Record<string, ModelElementFace>;
}

interface BlockModel3D {
  modelPath: string;
  elements: ModelElement[];
  ambientOcclusion: boolean;
}

export interface BlockData {
  _id: string;
  blockId: string;
  textures?: TextureMapping;
  texturesBase64?: TexturesBase64;
  model?: BlockModel3D;
}

export class SceneRenderer {
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  public renderer: THREE.WebGLRenderer;
  public controls: OrbitControls;
  
  private container: HTMLElement;
  private raycaster: THREE.Raycaster;
  private mouse: THREE.Vector2;
  private gridHelper: THREE.GridHelper;
  private plane: THREE.Mesh; // Invisible plane for raycasting against ground

  private textureCache = new Map<string, THREE.Texture>();
  private materialsCache = new Map<string, THREE.Material[]>();
  private geometryCache = new Map<string, THREE.BufferGeometry>();

  private placedBlocks: Map<string, THREE.Object3D> = new Map(); // key "x,y,z" -> Mesh/Group
  private previewMesh: THREE.Object3D | null = null;

  private currentBlockData: BlockData | null = null;
  private currentYRotation: number = 0;

  // Drag detection
  private mouseDownPosition: { x: number; y: number } | null = null;
  private readonly CLICK_THRESHOLD = 5; // pixels

  public onBlockPlaced?: (position: THREE.Vector3, blockId: string) => void;
  public onBlockRemoved?: (position: THREE.Vector3) => void;

  constructor(container: HTMLElement) {
    this.container = container;
    
    // Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x1a1a2e); // Dark blue-ish

    // Camera
    this.camera = new THREE.PerspectiveCamera(
      75,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    this.camera.position.set(5, 5, 5);
    this.camera.lookAt(0, 0, 0);

    // Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: false }); // Pixel art style
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(this.renderer.domElement);

    // Controls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambientLight);
    
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(10, 20, 10);
    this.scene.add(dirLight);

    // Grid
    this.gridHelper = new THREE.GridHelper(20, 20, 0x444444, 0x222222);
    this.scene.add(this.gridHelper);

    // Invisible Ground Plane (for raycasting)
    const planeGeo = new THREE.PlaneGeometry(20, 20);
    planeGeo.rotateX(-Math.PI / 2);
    const planeMat = new THREE.MeshBasicMaterial({ visible: false });
    this.plane = new THREE.Mesh(planeGeo, planeMat);
    this.scene.add(this.plane);

    // Raycaster
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();

    // Events
    this.bindEvents();
    
    // Start Loop
    this.animate();
  }

  private bindEvents() {
    this.renderer.domElement.addEventListener('mousemove', this.onMouseMove.bind(this));
    this.renderer.domElement.addEventListener('mousedown', this.onMouseDown.bind(this));
    this.renderer.domElement.addEventListener('mouseup', this.onMouseUp.bind(this));
    this.renderer.domElement.addEventListener('contextmenu', (e) => e.preventDefault());
    window.addEventListener('resize', this.onWindowResize.bind(this));
    window.addEventListener('keydown', this.onKeyDown);
  }

  private onKeyDown = (event: KeyboardEvent) => {
    if (event.key.toLowerCase() === 'r') {
      this.currentYRotation = (this.currentYRotation + Math.PI / 2) % (Math.PI * 2);
      if (this.previewMesh) {
        this.previewMesh.rotation.y = this.currentYRotation;
      }
    }
  }

  private onWindowResize() {
    if (!this.container) return;
    this.camera.aspect = this.container.clientWidth / this.container.clientHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
  }

  private animate = () => {
    requestAnimationFrame(this.animate);
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }

  // Texture Loading Logic (Adapted from blockIconRenderer)
  private loadTexture(base64: string): THREE.Texture {
    // Use base64 content as cache key (first 100 chars should be unique enough)
    const cacheKey = base64.slice(0, 100);
    if (this.textureCache.has(cacheKey)) {
      return this.textureCache.get(cacheKey)!;
    }

    const loader = new THREE.TextureLoader();
    const texture = loader.load(base64);
    texture.magFilter = THREE.NearestFilter;
    texture.minFilter = THREE.NearestFilter;
    texture.colorSpace = THREE.SRGBColorSpace;

    this.textureCache.set(cacheKey, texture);
    return texture;
  }

  /**
   * Creates a mesh (or group of meshes) from the block's model elements
   */
  private createBlockMesh(blockData: BlockData, transparent = false, opacity = 1): THREE.Object3D {
    const { textures, texturesBase64, model } = blockData;

    // If no model or no elements, create a simple cube
    if (!model || !model.elements || model.elements.length === 0) {
      const materials = this.createCubeMaterials(blockData, transparent, opacity);
      const geometry = new THREE.BoxGeometry(1, 1, 1);
      return new THREE.Mesh(geometry, materials);
    }

    // Create a group to hold all elements
    const group = new THREE.Group();

    for (const element of model.elements) {
      const mesh = this.createElementMesh(element, textures || {}, texturesBase64 || {}, transparent, opacity);
      if (mesh) {
        group.add(mesh);
      }
    }

    return group;
  }

  /**
   * Creates a mesh for a single model element
   */
  private createElementMesh(
    element: ModelElement,
    textures: TextureMapping,
    texturesBase64: TexturesBase64,
    transparent: boolean,
    opacity: number
  ): THREE.Mesh | null {
    // Convert Minecraft coordinates (0-16) to Three.js units (0-1)
    const from = element.from.map(v => v / 16) as [number, number, number];
    const to = element.to.map(v => v / 16) as [number, number, number];

    const width = to[0] - from[0];
    const height = to[1] - from[1];
    const depth = to[2] - from[2];

    // Skip invalid elements
    if (width <= 0 || height <= 0 || depth <= 0) return null;

    // Create box geometry
    const geometry = new THREE.BoxGeometry(width, height, depth);

    // Center offset (Minecraft origin is corner, Three.js is center)
    const centerX = from[0] + width / 2 - 0.5;
    const centerY = from[1] + height / 2 - 0.5;
    const centerZ = from[2] + depth / 2 - 0.5;

    // Create materials for each face
    // Three.js BoxGeometry face order: +X, -X, +Y, -Y, +Z, -Z
    // Minecraft face names: east, west, up, down, south, north
    const faceNames = ['east', 'west', 'up', 'down', 'south', 'north'];
    const materials: THREE.Material[] = [];

    for (const faceName of faceNames) {
      const faceData = element.faces[faceName];

      if (!faceData) {
        // No face defined, use transparent material
        materials.push(new THREE.MeshLambertMaterial({ visible: false }));
        continue;
      }

      // Resolve texture path
      let texturePath = faceData.texture;
      if (texturePath.startsWith('#')) {
        const varName = texturePath.substring(1);
        texturePath = textures[varName] || '';
      }

      const base64 = texturesBase64[texturePath];

      if (base64) {
        const texture = this.loadTexture(base64);

        // Apply UV mapping if specified
        if (faceData.uv) {
          const clonedTexture = texture.clone();
          clonedTexture.needsUpdate = true;
          // UV coords in Minecraft are 0-16, convert to 0-1
          const [u1, v1, u2, v2] = faceData.uv;
          clonedTexture.offset.set(u1 / 16, 1 - v2 / 16);
          clonedTexture.repeat.set((u2 - u1) / 16, (v2 - v1) / 16);

          const mat = new THREE.MeshLambertMaterial({
            map: clonedTexture,
            transparent: true, // Always true for PNG alpha support
            opacity,
            alphaTest: 0.1, // Discard nearly transparent pixels
          });
          materials.push(mat);
        } else {
          const mat = new THREE.MeshLambertMaterial({
            map: texture,
            transparent: true, // Always true for PNG alpha support
            opacity,
            alphaTest: 0.1, // Discard nearly transparent pixels
          });
          materials.push(mat);
        }
      } else {
        // Fallback gray material
        materials.push(new THREE.MeshLambertMaterial({
          color: 0x888888,
          transparent,
          opacity,
        }));
      }
    }

    const mesh = new THREE.Mesh(geometry, materials);
    mesh.position.set(centerX, centerY, centerZ);

    // Apply rotation if specified
    if (element.rotation) {
      const { origin, axis, angle } = element.rotation;
      const originVec = new THREE.Vector3(
        origin[0] / 16 - 0.5,
        origin[1] / 16 - 0.5,
        origin[2] / 16 - 0.5
      );

      // Translate to origin, rotate, translate back
      mesh.position.sub(originVec);

      const radians = (angle * Math.PI) / 180;
      switch (axis) {
        case 'x':
          mesh.rotateX(radians);
          break;
        case 'y':
          mesh.rotateY(radians);
          break;
        case 'z':
          mesh.rotateZ(radians);
          break;
      }

      // Rotate the position around the origin
      const pos = mesh.position.clone();
      switch (axis) {
        case 'x':
          mesh.position.set(
            pos.x,
            pos.y * Math.cos(radians) - pos.z * Math.sin(radians),
            pos.y * Math.sin(radians) + pos.z * Math.cos(radians)
          );
          break;
        case 'y':
          mesh.position.set(
            pos.x * Math.cos(radians) + pos.z * Math.sin(radians),
            pos.y,
            -pos.x * Math.sin(radians) + pos.z * Math.cos(radians)
          );
          break;
        case 'z':
          mesh.position.set(
            pos.x * Math.cos(radians) - pos.y * Math.sin(radians),
            pos.x * Math.sin(radians) + pos.y * Math.cos(radians),
            pos.z
          );
          break;
      }

      mesh.position.add(originVec);
    }

    return mesh;
  }

  /**
   * Creates materials for a simple cube (fallback when no model)
   */
  private createCubeMaterials(blockData: BlockData, transparent = false, opacity = 1): THREE.Material[] {
    const { textures, texturesBase64 } = blockData;
    if (!textures || !texturesBase64) {
      console.warn('⚠️ Block missing textures:', blockData.blockId);
      const mat = new THREE.MeshLambertMaterial({ color: 0x888888, transparent, opacity });
      return Array(6).fill(mat);
    }

    // Three.js BoxGeometry face order: +X, -X, +Y, -Y, +Z, -Z
    // Which corresponds to: east, west, up, down, south, north
    const faceMapping: Record<string, string[]> = {
      east:  ['east', 'right', 'side', 'all'],
      west:  ['west', 'left', 'side', 'all'],
      up:    ['up', 'top', 'end', 'all'],
      down:  ['down', 'bottom', 'end', 'all'],
      south: ['south', 'front', 'side', 'all'],
      north: ['north', 'back', 'side', 'all'],
    };

    const faceOrder = ['east', 'west', 'up', 'down', 'south', 'north'];

    // Find fallback texture (first available)
    let fallbackBase64: string | null = null;
    const fallbackKeys = ['all', 'side', 'top', 'front', 'particle'];
    for (const key of fallbackKeys) {
      const texPath = textures[key];
      if (texPath && texturesBase64[texPath]) {
        fallbackBase64 = texturesBase64[texPath];
        break;
      }
    }
    if (!fallbackBase64) {
      const firstPath = Object.values(texturesBase64)[0];
      if (firstPath) fallbackBase64 = firstPath;
    }

    return faceOrder.map((face) => {
      const alternatives = faceMapping[face];
      let base64: string | null = null;

      for (const altKey of alternatives) {
        const texPath = textures[altKey];
        if (texPath && texturesBase64[texPath]) {
          base64 = texturesBase64[texPath];
          break;
        }
      }

      if (!base64) base64 = fallbackBase64;

      if (base64) {
        const texture = this.loadTexture(base64);
        return new THREE.MeshLambertMaterial({
          map: texture,
          transparent: true, // Always true for PNG alpha support
          opacity,
          alphaTest: 0.1, // Discard nearly transparent pixels
        });
      }
      return new THREE.MeshLambertMaterial({ color: 0x888888, transparent, opacity });
    });
  }

  // --- Interaction ---

  public selectBlock(blockData: BlockData | null) {
    this.currentBlockData = blockData;
    this.updatePreview();
  }

  private disposeObject3D(obj: THREE.Object3D) {
    obj.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();
        const materials = Array.isArray(child.material) ? child.material : [child.material];
        materials.forEach(m => m.dispose());
      }
    });
  }

  private updatePreview() {
    // Dispose old preview mesh properly
    if (this.previewMesh) {
      this.scene.remove(this.previewMesh);
      this.disposeObject3D(this.previewMesh);
      this.previewMesh = null;
    }

    if (!this.currentBlockData) return;

    console.log('🔄 Updating preview for:', this.currentBlockData.blockId, 'has model:', !!this.currentBlockData.model);

    this.previewMesh = this.createBlockMesh(this.currentBlockData, true, 0.5);
    this.previewMesh.rotation.y = this.currentYRotation;
    this.previewMesh.visible = false; // Hidden until mouse over valid spot
    this.scene.add(this.previewMesh);
  }

  private getIntersect(event: MouseEvent): { intersection: THREE.Intersection; blockRoot: THREE.Object3D | null } | null {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);

    // Intersect with placed blocks first (need to check children for groups)
    const blockObjects = Array.from(this.placedBlocks.values());
    const blockIntersects = this.raycaster.intersectObjects(blockObjects, true);

    if (blockIntersects.length > 0) {
      // Find the root block object that was hit
      const hitObject = blockIntersects[0].object;
      let blockRoot: THREE.Object3D | null = null;

      for (const [, block] of this.placedBlocks) {
        if (block === hitObject || (block instanceof THREE.Group && block.children.includes(hitObject as THREE.Mesh))) {
          blockRoot = block;
          break;
        }
        // Check nested children
        let found = false;
        block.traverse((child) => {
          if (child === hitObject) found = true;
        });
        if (found) {
          blockRoot = block;
          break;
        }
      }

      return { intersection: blockIntersects[0], blockRoot };
    }

    // Intersect with plane
    const planeIntersects = this.raycaster.intersectObject(this.plane);
    if (planeIntersects.length > 0) {
      return { intersection: planeIntersects[0], blockRoot: null };
    }

    return null;
  }

  private onMouseMove(event: MouseEvent) {
    if (!this.previewMesh || !this.currentBlockData) return;

    const result = this.getIntersect(event);
    if (result) {
      const { intersection } = result;
      const pos = intersection.point.clone();
      
      if (intersection.face) {
        // Move slightly into the face or away from it to ensure correct floor()
        // To place NEXT to the hit face, we add the normal multiplied by 0.5
        pos.add(intersection.face.normal.clone().multiplyScalar(0.5));
      }
      
      // Snap to grid
      pos.floor().addScalar(0.5);

      // Check if occupied
      const key = `${pos.x},${pos.y},${pos.z}`;
      if (this.placedBlocks.has(key)) {
        this.previewMesh.visible = false;
      } else {
        this.previewMesh.position.copy(pos);
        this.previewMesh.visible = true;
      }
    } else {
      this.previewMesh.visible = false;
    }
  }

  private onMouseDown(event: MouseEvent) {
    if (event.button !== 0 && event.button !== 2) return; // Left or Right click

    // Record mouse down position to detect drag vs click
    this.mouseDownPosition = { x: event.clientX, y: event.clientY };
  }

  private onMouseUp(event: MouseEvent) {
    if (!this.mouseDownPosition) return;

    // Check if this was a click (not a drag)
    const dx = Math.abs(event.clientX - this.mouseDownPosition.x);
    const dy = Math.abs(event.clientY - this.mouseDownPosition.y);
    const isClick = dx < this.CLICK_THRESHOLD && dy < this.CLICK_THRESHOLD;

    this.mouseDownPosition = null;

    if (!isClick) return; // It was a drag, don't place/remove

    const result = this.getIntersect(event);
    if (!result) return;

    const { blockRoot } = result;

    // Right Click: Remove
    if (event.button === 2) {
      if (blockRoot) {
        // Find and remove the block
        for (const [key, block] of this.placedBlocks) {
          if (block === blockRoot) {
            this.scene.remove(block);
            this.disposeObject3D(block);
            this.placedBlocks.delete(key);

            const [x, y, z] = key.split(',').map(Number);
            if (this.onBlockRemoved) this.onBlockRemoved(new THREE.Vector3(x, y, z));
            break;
          }
        }
      }
      return;
    }

    // Left Click: Place
    if (event.button === 0 && this.currentBlockData && this.previewMesh && this.previewMesh.visible) {
      const pos = this.previewMesh.position.clone();
      const key = `${pos.x},${pos.y},${pos.z}`;

      if (this.placedBlocks.has(key)) return;

      const blockMesh = this.createBlockMesh(this.currentBlockData);
      blockMesh.position.copy(pos);
      blockMesh.rotation.y = this.currentYRotation;

      this.scene.add(blockMesh);
      this.placedBlocks.set(key, blockMesh);

      if (this.onBlockPlaced) this.onBlockPlaced(pos, this.currentBlockData.blockId);
    }
  }
  
  public getThumbnail(): string {
    this.renderer.render(this.scene, this.camera);
    return this.renderer.domElement.toDataURL('image/png');
  }

  public dispose() {
    this.renderer.dispose();

    // Dispose textures
    this.textureCache.forEach(texture => texture.dispose());
    this.textureCache.clear();

    // Dispose materials
    this.materialsCache.forEach(materials => {
      materials.forEach(material => material.dispose());
    });
    this.materialsCache.clear();

    // Dispose placed blocks
    this.placedBlocks.forEach(block => this.disposeObject3D(block));
    this.placedBlocks.clear();

    // Remove event listeners
    this.renderer.domElement.removeEventListener('mousemove', this.onMouseMove.bind(this));
    this.renderer.domElement.removeEventListener('mousedown', this.onMouseDown.bind(this));
    this.renderer.domElement.removeEventListener('mouseup', this.onMouseUp.bind(this));
    window.removeEventListener('resize', this.onWindowResize.bind(this));
    window.removeEventListener('keydown', this.onKeyDown);

    if (this.previewMesh) {
      this.disposeObject3D(this.previewMesh);
    }
  }
}
