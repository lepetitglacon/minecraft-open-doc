import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

interface TextureMapping {
  [key: string]: string;
}

interface TexturesBase64 {
  [path: string]: string;
}

export interface BlockData {
  _id: string;
  blockId: string;
  textures?: TextureMapping;
  texturesBase64?: TexturesBase64;
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
  
  private placedBlocks: Map<string, THREE.Mesh> = new Map(); // key "x,y,z" -> Mesh
  private previewMesh: THREE.Mesh | null = null;
  
  private currentBlockData: BlockData | null = null;

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
    window.addEventListener('resize', this.onWindowResize.bind(this));
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
  private loadTexture(base64: string, path: string): THREE.Texture {
    const cacheKey = path || base64.slice(0, 50);
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

  private createMaterials(blockData: BlockData): THREE.Material[] {
    const cacheKey = blockData._id;
    if (this.materialsCache.has(cacheKey)) {
      return this.materialsCache.get(cacheKey)!;
    }

    const { textures, texturesBase64 } = blockData;
    if (!textures || !texturesBase64) {
      const mat = new THREE.MeshLambertMaterial({ color: 0x888888 });
      return Array(6).fill(mat);
    }

    const faceOrder = ['east', 'west', 'up', 'down', 'south', 'north'];
    const defaultKeys = ['all', 'side', 'particle'];

    // Find default texture
    let defaultBase64: string | null = null;
    for (const key of defaultKeys) {
      const texPath = textures[key];
      if (texPath && texturesBase64[texPath]) {
        defaultBase64 = texturesBase64[texPath];
        break;
      }
    }
    if (!defaultBase64) {
      const firstPath = Object.keys(texturesBase64)[0];
      if (firstPath) defaultBase64 = texturesBase64[firstPath];
    }

    const materials = faceOrder.map((face) => {
      const texPath = textures[face] || textures['all'] || textures['side'];
      let base64: string | null = texPath ? (texturesBase64[texPath] ?? null) : null;
      if (!base64) base64 = defaultBase64;

      if (base64) {
        const texture = this.loadTexture(base64, texPath || '');
        return new THREE.MeshLambertMaterial({ map: texture });
      }
      return new THREE.MeshLambertMaterial({ color: 0x888888 });
    });

    this.materialsCache.set(cacheKey, materials);
    return materials;
  }

  // --- Interaction ---

  public selectBlock(blockData: BlockData | null) {
    this.currentBlockData = blockData;
    this.updatePreview();
  }

  private updatePreview() {
    if (this.previewMesh) {
      this.scene.remove(this.previewMesh);
      this.previewMesh = null;
    }

    if (!this.currentBlockData) return;

    const materials = this.createMaterials(this.currentBlockData).map(m => {
      const clone = m.clone();
      clone.transparent = true;
      clone.opacity = 0.5;
      return clone;
    });

    const geometry = new THREE.BoxGeometry(1, 1, 1);
    this.previewMesh = new THREE.Mesh(geometry, materials);
    this.previewMesh.visible = false; // Hidden until mouse over valid spot
    this.scene.add(this.previewMesh);
  }

  private getIntersect(event: MouseEvent): THREE.Intersection | null {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);

    // Intersect with placed blocks first
    const blockMeshes = Array.from(this.placedBlocks.values());
    const blockIntersects = this.raycaster.intersectObjects(blockMeshes);
    if (blockIntersects.length > 0) return blockIntersects[0];

    // Intersect with plane
    const planeIntersects = this.raycaster.intersectObject(this.plane);
    if (planeIntersects.length > 0) return planeIntersects[0];

    return null;
  }

  private onMouseMove(event: MouseEvent) {
    if (!this.previewMesh || !this.currentBlockData) return;

    const intersect = this.getIntersect(event);
    if (intersect) {
      const pos = intersect.point.clone().add(intersect.face!.normal!);
      pos.divideScalar(1).floor().addScalar(0.5); // Snap to grid center

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

    const intersect = this.getIntersect(event);
    if (!intersect) return;

    // Right Click: Remove
    if (event.button === 2) {
      if (intersect.object !== this.plane && intersect.object !== this.gridHelper) {
        // We clicked a block
        const pos = intersect.object.position;
        const key = `${pos.x},${pos.y},${pos.z}`;
        
        this.scene.remove(intersect.object);
        this.placedBlocks.delete(key);
        
        if (this.onBlockRemoved) this.onBlockRemoved(pos);
      }
      return;
    }

    // Left Click: Place
    if (event.button === 0 && this.currentBlockData && this.previewMesh && this.previewMesh.visible) {
      const pos = this.previewMesh.position.clone();
      const key = `${pos.x},${pos.y},${pos.z}`;

      if (this.placedBlocks.has(key)) return;

      const materials = this.createMaterials(this.currentBlockData);
      const geometry = new THREE.BoxGeometry(1, 1, 1);
      const mesh = new THREE.Mesh(geometry, materials);
      mesh.position.copy(pos);
      
      this.scene.add(mesh);
      this.placedBlocks.set(key, mesh);

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

    // Remove event listeners
    this.renderer.domElement.removeEventListener('mousemove', this.onMouseMove.bind(this));
    this.renderer.domElement.removeEventListener('mousedown', this.onMouseDown.bind(this));
    window.removeEventListener('resize', this.onWindowResize.bind(this));

    if (this.previewMesh) {
      this.previewMesh.geometry.dispose();
    }
  }
}
