import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import gltf_scene_test from '../../assets/export_20260126_040516.gltf?url'
import {GLTFLoader} from "three/examples/jsm/loaders/GLTFLoader.js";

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

export type BackgroundType = 'overworld' | 'nether' | 'end' | 'void';

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

  private placedBlocks: Map<string, THREE.Object3D> = new Map(); // key "x,y,z" -> Mesh/Group
  private previewMesh: THREE.Object3D | null = null;
  private connectionPreviewMesh: THREE.Mesh | null = null;

  private currentBlockData: BlockData | null = null;
  private currentYRotation: number = 0;
  private isConnectionMode: boolean = false;
  private currentBackground: BackgroundType = 'void';

  // Drag detection
  private mouseDownPosition: { x: number; y: number } | null = null;
  private readonly CLICK_THRESHOLD = 5; // pixels

  public onBlockPlaced?: (position: THREE.Vector3, blockId: string) => void;
  public onBlockRemoved?: (position: THREE.Vector3) => void;
  public onBlockPicked?: (blockId: string) => void;
  public onBlocksDetected?: (blockIds: string[]) => void;

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
    
    // Directional Light with Hard Shadows
    const dirLight = new THREE.DirectionalLight(0xffffff, 1.0);
    dirLight.position.set(10, 20, 10);
    dirLight.castShadow = true;
    
    // Optimize shadow map for pixel art style
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 50;
    dirLight.shadow.camera.left = -15;
    dirLight.shadow.camera.right = 15;
    dirLight.shadow.camera.top = 15;
    dirLight.shadow.camera.bottom = -15;
    dirLight.shadow.bias = -0.0005;
    
    this.scene.add(dirLight);

    // Grid (Default, will be resized in init)
    this.gridHelper = new THREE.GridHelper(20, 20, 0x444444, 0x222222);
    this.scene.add(this.gridHelper);

    // Invisible Ground Plane (for raycasting)
    const planeGeo = new THREE.PlaneGeometry(100, 100); // Increased size
    planeGeo.rotateX(-Math.PI / 2);
    const planeMat = new THREE.MeshBasicMaterial({ visible: false });
    this.plane = new THREE.Mesh(planeGeo, planeMat);
    this.scene.add(this.plane);

    // Raycaster
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    
    // Enable shadow map
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap; // Slightly soft edges, but still distinct

    // Events
    this.bindEvents();
    
    // Start Loop
    this.animate();
  }

  async init() {
    const loader = new GLTFLoader();
    const gltf = await loader.loadAsync(gltf_scene_test);
    
    const blocksToTransfer: THREE.Mesh[] = [];
    const detectedBlockIds = new Set<string>();
    
    // Calculate bounds for adaptive grid
    const min = new THREE.Vector3(Infinity, Infinity, Infinity);
    const max = new THREE.Vector3(-Infinity, -Infinity, -Infinity);
    let hasBlocks = false;

    // 1. Traverse and prepare blocks (fix textures, identify valid blocks)
    gltf.scene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true;
        child.receiveShadow = true;

        const materials = Array.isArray(child.material) ? child.material : [child.material];
        
        materials.forEach((material: THREE.Material) => {
          const mat = material as THREE.MeshStandardMaterial;
          if (mat.map) {
            mat.map.magFilter = THREE.NearestFilter;
            mat.map.minFilter = THREE.NearestFilter;
            mat.map.generateMipmaps = false;
            mat.map.needsUpdate = true;
          }
          if (mat.emissiveMap) {
            mat.emissiveMap.magFilter = THREE.NearestFilter;
            mat.emissiveMap.minFilter = THREE.NearestFilter;
            mat.emissiveMap.generateMipmaps = false;
            mat.emissiveMap.needsUpdate = true;
          }
          if (mat.transparent) {
            mat.alphaTest = 0.5;
          }
        });

        // Check if it is a block we should manage
        const blockId = child.userData.name || child.userData.blockId || child.userData.id;
        // Relaxed condition: Just check if we have a non-empty string ID
        if (blockId && typeof blockId === 'string' && blockId.trim().length > 0) {
          blocksToTransfer.push(child);
          detectedBlockIds.add(blockId);
          
          // Update bounds
          child.geometry.computeBoundingBox();
          const bbox = child.geometry.boundingBox!.clone();
          bbox.applyMatrix4(child.matrixWorld);
          
          min.min(bbox.min);
          max.max(bbox.max);
          hasBlocks = true;
        } else {
             // Debug: Log why we skipped it
             // console.log('Skipping object:', child.name, child.userData);
        }
      }
    });

    if (this.onBlocksDetected) {
      this.onBlocksDetected(Array.from(detectedBlockIds));
    }

    // 2. Transfer blocks to the main scene
    blocksToTransfer.forEach(child => {
      this.scene.attach(child);

      const pos = new THREE.Vector3();
      child.getWorldPosition(pos);
      
      const x = Math.floor(pos.x) + 0.5;
      const y = Math.floor(pos.y) + 0.5;
      const z = Math.floor(pos.z) + 0.5;
      
      const key = `${x},${y},${z}`;
      this.placedBlocks.set(key, child);
    });
    
    // 3. Update Grid Size
    if (hasBlocks) {
        const sizeX = Math.abs(max.x - min.x);
        const sizeZ = Math.abs(max.z - min.z);
        const maxSize = Math.max(sizeX, sizeZ, 20); // Min 20
        const gridSize = Math.ceil(maxSize / 2) * 2 + 10; // Add padding and ensure even
        
        // Center the grid
        const centerX = (min.x + max.x) / 2;
        const centerZ = (min.z + max.z) / 2;
        
        this.scene.remove(this.gridHelper);
        this.gridHelper = new THREE.GridHelper(gridSize, gridSize, 0x444444, 0x222222);
        this.gridHelper.position.set(Math.floor(centerX), 0, Math.floor(centerZ));
        this.scene.add(this.gridHelper);

        // Center Camera on the scene
        this.controls.target.set(centerX, 0, centerZ);
        const distance = Math.max(sizeX, sizeZ) * 0.8 + 5; // Distance based on scene size
        this.camera.position.set(centerX + distance, distance * 0.8 + 5, centerZ + distance);
        this.controls.update();
    }
  }

  public setShadows(enabled: boolean) {
    this.renderer.shadowMap.enabled = enabled;
    
    // Toggle castShadow for directional lights
    this.scene.traverse((object) => {
      if (object instanceof THREE.DirectionalLight) {
        object.castShadow = enabled;
      }
    });
    
    // Update materials to ensure shadow maps are recompiled/removed
    this.scene.traverse((child) => {
        if (child instanceof THREE.Mesh) {
            const materials = Array.isArray(child.material) ? child.material : [child.material];
            materials.forEach(m => m.needsUpdate = true);
        }
    });
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
    texture.generateMipmaps = false;
    texture.colorSpace = THREE.SRGBColorSpace;

    this.textureCache.set(cacheKey, texture);
    return texture;
  }

  /**
   * Creates a mesh (or group of meshes) from the block's model elements
   */
  private createBlockMesh(blockData: BlockData, transparent = false, opacity = 1): THREE.Object3D {
    const { textures, texturesBase64, model, blockId } = blockData;

    // Check if it's a cable-like block (heuristic)
    const isCable = /pipe|cable|tube|transporter|conductor/i.test(blockId);

    if (isCable) {
      return this.createCableMesh(blockData, transparent, opacity);
    }

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

  private createCableMesh(blockData: BlockData, _transparent = false, opacity = 1): THREE.Object3D {
    const group = new THREE.Group();
    group.userData.isCable = true;
    group.userData.connections = {
      up: false, down: false, north: false, south: false, east: false, west: false
    };

    const radius = 0.25; // 4/16
    const diameter = radius * 2;
    
    // Materials
    // Try to find a side texture
    const { textures, texturesBase64 } = blockData;
    let material: THREE.Material = new THREE.MeshLambertMaterial({ color: 0x555555 });
    
    if (textures && texturesBase64) {
      // Logic to pick a texture
      let texBase64 = null;
      for (const key of ['side', 'all', 'particle', 'front']) {
        if (textures[key] && texturesBase64[textures[key]]) {
          texBase64 = texturesBase64[textures[key]];
          break;
        }
      }
      if (!texBase64 && Object.values(texturesBase64).length > 0) {
        texBase64 = Object.values(texturesBase64)[0];
      }

      if (texBase64) {
        const texture = this.loadTexture(texBase64);
        material = new THREE.MeshLambertMaterial({ map: texture, transparent: true, opacity });
      }
    }

    // Central Node
    const centerGeo = new THREE.BoxGeometry(diameter, diameter, diameter);
    const centerMesh = new THREE.Mesh(centerGeo, material);
    centerMesh.userData.part = 'center';
    group.add(centerMesh);

    // Branches
    const branchLength = (1 - diameter) / 2;
    const branchOffset = diameter / 2 + branchLength / 2;

    interface BranchDef {
      name: string;
      dir: [number, number, number];
      size: [number, number, number];
      pos: [number, number, number];
      rotateFaces: number[];
    }

    const branches: BranchDef[] = [
      { name: 'east',  dir: [1, 0, 0], size: [branchLength, diameter, diameter], pos: [branchOffset, 0, 0], rotateFaces: [2, 3, 4, 5] },
      { name: 'west',  dir: [-1, 0, 0], size: [branchLength, diameter, diameter], pos: [-branchOffset, 0, 0], rotateFaces: [2, 3, 4, 5] },
      { name: 'up',    dir: [0, 1, 0], size: [diameter, branchLength, diameter], pos: [0, branchOffset, 0], rotateFaces: [] },
      { name: 'down',  dir: [0, -1, 0], size: [diameter, branchLength, diameter], pos: [0, -branchOffset, 0], rotateFaces: [] },
      { name: 'south', dir: [0, 0, 1], size: [diameter, diameter, branchLength], pos: [0, 0, branchOffset], rotateFaces: [0, 1, 2, 3] },
      { name: 'north', dir: [0, 0, -1], size: [diameter, diameter, branchLength], pos: [0, 0, -branchOffset], rotateFaces: [0, 1, 2, 3] },
    ];

    for (const b of branches) {
      const geo = new THREE.BoxGeometry(b.size[0], b.size[1], b.size[2]);
      
      // Rotate UVs for specific faces to align texture
      if (b.rotateFaces.length > 0) {
        const uvAttribute = geo.getAttribute('uv');
        for (const faceIndex of b.rotateFaces) {
          // Each face has 4 vertices in standard BoxGeometry (non-indexed or separate faces)
          const offset = (faceIndex ?? 0) * 4;
          
          for (let i = 0; i < 4; i++) {
            const u = uvAttribute.getX(offset + i);
            const v = uvAttribute.getY(offset + i);
            // Rotate 90 degrees
            uvAttribute.setXY(offset + i, v, 1 - u);
          }
        }
        uvAttribute.needsUpdate = true;
      }

      const mesh = new THREE.Mesh(geo, material);
      mesh.position.set(b.pos[0], b.pos[1], b.pos[2]);
      mesh.name = b.name;
      mesh.visible = false; // Hidden by default
      mesh.userData.part = 'branch';
      mesh.userData.direction = b.name;
      group.add(mesh);
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
      const alternatives = faceMapping[face] || [];
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

  public setConnectionMode(enabled: boolean) {
    this.isConnectionMode = enabled;
    if (this.previewMesh) this.previewMesh.visible = false;
    if (this.connectionPreviewMesh) this.connectionPreviewMesh.visible = false;
  }

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

    const firstBlockIntersect = blockIntersects[0];
    if (firstBlockIntersect) {
      // Find the root block object that was hit
      const hitObject = firstBlockIntersect.object;
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

      return { intersection: firstBlockIntersect, blockRoot };
    }

    // Intersect with plane
    const planeIntersects = this.raycaster.intersectObject(this.plane);
    const firstPlaneIntersect = planeIntersects[0];
    if (firstPlaneIntersect) {
      return { intersection: firstPlaneIntersect, blockRoot: null };
    }

    return null;
  }

  private onMouseMove(event: MouseEvent) {
    // Determine which mode we are in
    if (this.isConnectionMode) {
      if (this.previewMesh) this.previewMesh.visible = false;
      this.handleConnectionPreview(event);
      return;
    }
    
    // Placement Mode
    if (this.connectionPreviewMesh) this.connectionPreviewMesh.visible = false;
    if (!this.previewMesh || !this.currentBlockData) return;

    const result = this.getIntersect(event);
    if (result) {
      const { intersection } = result;
      const pos = intersection.point.clone();
      
      if (intersection.face) {
        pos.add(intersection.face.normal.clone().multiplyScalar(0.5));
      }
      
      pos.floor().addScalar(0.5);

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

  private handleConnectionPreview(event: MouseEvent) {
    // We will manage the preview mesh dynamically based on the target branch
    
    // 1. Hide existing preview first
    if (this.connectionPreviewMesh) {
      this.connectionPreviewMesh.visible = false;
    }

    const result = this.getIntersect(event);
    if (!result || !result.blockRoot || !result.blockRoot.userData.isCable) {
      return;
    }

    const { blockRoot, intersection } = result;
    const clickedMesh = intersection.object;
    
    // We are hovering a cable. Determine direction.
    let dir = '';
    const localPoint = clickedMesh.worldToLocal(intersection.point.clone());

    if (clickedMesh.userData.part === 'center') {
      const absX = Math.abs(localPoint.x);
      const absY = Math.abs(localPoint.y);
      const absZ = Math.abs(localPoint.z);
      
      if (absX >= absY && absX >= absZ) dir = localPoint.x > 0 ? 'east' : 'west';
      else if (absY >= absX && absY >= absZ) dir = localPoint.y > 0 ? 'up' : 'down';
      else dir = localPoint.z > 0 ? 'south' : 'north';
    } else if (clickedMesh.userData.part === 'branch') {
      dir = clickedMesh.userData.direction;
    }

    if (!dir) return;

    // Find the branch object
    const branch = blockRoot.children.find(c => c.name === dir) as THREE.Mesh;
    if (!branch) return;

    // Logic: If branch is already visible (connected), we are in "remove" mode -> Show nothing
    // If branch is hidden (disconnected), we are in "add" mode -> Show preview of the branch
    if (branch.visible) {
      // It will be removed, so show nothing (as requested)
      return;
    }

    // It will be added, show the model
    if (!this.connectionPreviewMesh) {
      this.connectionPreviewMesh = new THREE.Mesh();
      this.scene.add(this.connectionPreviewMesh);
    }

    this.connectionPreviewMesh.geometry = branch.geometry;
    
    // Clone material to make it slightly transparent to indicate preview
    const originalMat = branch.material;
    if (Array.isArray(originalMat)) {
        this.connectionPreviewMesh.material = originalMat.map(m => {
            const clone = m.clone();
            clone.transparent = true;
            clone.opacity = 0.7;
            return clone;
        });
    } else {
        const clone = originalMat.clone();
        clone.transparent = true;
        clone.opacity = 0.7;
        this.connectionPreviewMesh.material = clone;
    }

    // Match transform
    const worldPos = new THREE.Vector3();
    const worldQuat = new THREE.Quaternion();
    const worldScale = new THREE.Vector3();
    
    branch.getWorldPosition(worldPos);
    branch.getWorldQuaternion(worldQuat);
    branch.getWorldScale(worldScale);

    this.connectionPreviewMesh.position.copy(worldPos);
    this.connectionPreviewMesh.quaternion.copy(worldQuat);
    this.connectionPreviewMesh.scale.copy(worldScale);
    
    this.connectionPreviewMesh.visible = true;
  }

  private onMouseDown(event: MouseEvent) {
    // Allow Left (0), Middle (1), and Right (2) clicks
    if (event.button !== 0 && event.button !== 1 && event.button !== 2) return;
    this.mouseDownPosition = { x: event.clientX, y: event.clientY };
  }

  private onMouseUp(event: MouseEvent) {
    if (!this.mouseDownPosition) return;
    const dx = Math.abs(event.clientX - this.mouseDownPosition.x);
    const dy = Math.abs(event.clientY - this.mouseDownPosition.y);
    const isClick = dx < this.CLICK_THRESHOLD && dy < this.CLICK_THRESHOLD;
    this.mouseDownPosition = null;

    if (!isClick) return;

    const result = this.getIntersect(event);
    if (!result) return;
    const { blockRoot, intersection } = result;
    
    // Middle Click: Pick Block
    if (event.button === 1) {
       if (blockRoot && this.onBlockPicked) {
           const blockId = blockRoot.userData.name || blockRoot.userData.blockId || blockRoot.userData.id;
           if (blockId) {
               this.onBlockPicked(blockId);
           }
       }
       return;
    }

    // Edit Mode (Connection Toggling)
    if (this.isConnectionMode && event.button === 0) {
      if (blockRoot && blockRoot.userData.isCable) {
        const clickedMesh = intersection.object;
        let dir = '';
        const localPoint = clickedMesh.worldToLocal(intersection.point.clone());

        if (clickedMesh.userData.part === 'center') {
          const absX = Math.abs(localPoint.x);
          const absY = Math.abs(localPoint.y);
          const absZ = Math.abs(localPoint.z);
          if (absX >= absY && absX >= absZ) dir = localPoint.x > 0 ? 'east' : 'west';
          else if (absY >= absX && absY >= absZ) dir = localPoint.y > 0 ? 'up' : 'down';
          else dir = localPoint.z > 0 ? 'south' : 'north';
        } else if (clickedMesh.userData.part === 'branch') {
          dir = clickedMesh.userData.direction;
        }

        const branch = blockRoot.children.find(c => c.name === dir);
        if (branch) {
          branch.visible = !branch.visible;
          blockRoot.userData.connections[dir] = branch.visible;
          // Update preview immediately
          this.handleConnectionPreview(event);
        }
      }
      return;
    }

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
    if (this.connectionPreviewMesh) {
      this.disposeObject3D(this.connectionPreviewMesh);
    }
  }

  /**
   * Sets the scene background based on Minecraft dimension
   */
  public setBackground(type: BackgroundType) {
    this.currentBackground = type;

    // Background colors matching Minecraft dimensions
    const backgrounds: Record<BackgroundType, number> = {
      overworld: 0x87CEEB, // Sky blue
      nether: 0x1a0a0a,    // Dark red/black
      end: 0x0a0a14,       // Dark purple/black
      void: 0x1a1a2e,      // Current dark blue
    };

    // Grid colors matching dimensions
    const gridColors: Record<BackgroundType, { main: number; secondary: number }> = {
      overworld: { main: 0x5c8a3d, secondary: 0x3d5c28 }, // Grass green
      nether: { main: 0x8b0000, secondary: 0x4a0000 },    // Dark red
      end: { main: 0x3d3d5c, secondary: 0x28283d },      // End stone purple
      void: { main: 0x444444, secondary: 0x222222 },     // Gray
    };

    this.scene.background = new THREE.Color(backgrounds[type]);

    // Update grid colors
    const colors = gridColors[type];
    this.scene.remove(this.gridHelper);
    this.gridHelper = new THREE.GridHelper(20, 20, colors.main, colors.secondary);
    this.scene.add(this.gridHelper);
  }

  public getBackground(): BackgroundType {
    return this.currentBackground;
  }
}
