import * as THREE from 'three';

interface TextureMapping {
  [key: string]: string; // variable -> texturePath
}

interface TexturesBase64 {
  [path: string]: string; // texturePath -> base64
}

// Cache global des icônes générées (blockId -> base64 image)
const iconCache = new Map<string, string>();

// Cache des textures Three.js
const textureCache = new Map<string, THREE.Texture>();

// Singleton renderer
let renderer: THREE.WebGLRenderer | null = null;
let scene: THREE.Scene | null = null;
let camera: THREE.OrthographicCamera | null = null;
let cube: THREE.Mesh | null = null;

const ICON_SIZE = 64; // Render at higher res for quality

function initRenderer() {
  if (renderer) return;

  // Créer un canvas offscreen
  const canvas = document.createElement('canvas');
  canvas.width = ICON_SIZE;
  canvas.height = ICON_SIZE;

  renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: false,
    preserveDrawingBuffer: true,
  });
  renderer.setSize(ICON_SIZE, ICON_SIZE);

  scene = new THREE.Scene();

  // Camera orthographique isométrique
  const frustumSize = 1.8;
  camera = new THREE.OrthographicCamera(
    -frustumSize / 2,
    frustumSize / 2,
    frustumSize / 2,
    -frustumSize / 2,
    0.1,
    100
  );

  // Position isométrique (comme Minecraft inventory)
  const distance = 5;
  const angleY = Math.PI / 4; // 45°
  const angleX = Math.PI / 6; // 30°

  camera.position.set(
    Math.sin(angleY) * Math.cos(angleX) * distance,
    Math.sin(angleX) * distance,
    Math.cos(angleY) * Math.cos(angleX) * distance
  );
  camera.lookAt(0, 0, 0);

  // Éclairage style Minecraft
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambientLight);

  const topLight = new THREE.DirectionalLight(0xffffff, 0.8);
  topLight.position.set(0, 1, 0);
  scene.add(topLight);

  const sideLight = new THREE.DirectionalLight(0xffffff, 0.3);
  sideLight.position.set(1, 0.5, 1);
  scene.add(sideLight);

  // Créer le cube une seule fois
  const geometry = new THREE.BoxGeometry(1, 1, 1);
  cube = new THREE.Mesh(geometry);
  scene.add(cube);
}

function loadTexture(base64: string, path: string): THREE.Texture {
  const cacheKey = path || base64.slice(0, 50);

  if (textureCache.has(cacheKey)) {
    return textureCache.get(cacheKey)!;
  }

  const loader = new THREE.TextureLoader();
  const texture = loader.load(base64);
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  texture.colorSpace = THREE.SRGBColorSpace;

  textureCache.set(cacheKey, texture);
  return texture;
}

function createMaterials(
  textures: TextureMapping,
  texturesBase64: TexturesBase64
): THREE.MeshLambertMaterial[] {
  // Ordre des faces pour BoxGeometry: +X, -X, +Y, -Y, +Z, -Z
  // Correspond à: east, west, up, down, south, north
  const faceOrder = ['east', 'west', 'up', 'down', 'south', 'north'];
  const defaultKeys = ['all', 'side', 'particle'];

  // Trouver une texture par défaut
  let defaultBase64: string | null = null;
  for (const key of defaultKeys) {
    const texPath = textures[key];
    if (texPath && texturesBase64[texPath]) {
      defaultBase64 = texturesBase64[texPath];
      break;
    }
  }

  // Si pas trouvé, prendre la première disponible
  if (!defaultBase64) {
    const firstPath = Object.keys(texturesBase64)[0];
    if (firstPath && texturesBase64[firstPath]) {
      defaultBase64 = texturesBase64[firstPath];
    }
  }

  return faceOrder.map((face) => {
    const texPath = textures[face] || textures['all'] || textures['side'];
    let base64: string | null = texPath ? (texturesBase64[texPath] ?? null) : null;

    if (!base64) {
      base64 = defaultBase64;
    }

    if (base64) {
      const texture = loadTexture(base64, texPath || '');
      return new THREE.MeshLambertMaterial({ map: texture });
    }

    return new THREE.MeshLambertMaterial({ color: 0x888888 });
  });
}

/**
 * Génère une icône 3D pour un bloc et retourne son URL base64
 */
export function renderBlockIcon(
  blockId: string,
  textures: TextureMapping,
  texturesBase64: TexturesBase64
): string {
  // Vérifier le cache
  const cacheKey = `${blockId}-${Object.keys(texturesBase64).sort().join(',')}`;
  if (iconCache.has(cacheKey)) {
    return iconCache.get(cacheKey)!;
  }

  // Vérifier qu'on a des textures
  if (!texturesBase64 || Object.keys(texturesBase64).length === 0) {
    return '';
  }

  initRenderer();

  if (!renderer || !scene || !camera || !cube) {
    return '';
  }

  // Mettre à jour les matériaux du cube
  const materials = createMaterials(textures, texturesBase64);

  // Disposer les anciens matériaux
  if (Array.isArray(cube.material)) {
    cube.material.forEach((m) => m.dispose());
  } else if (cube.material) {
    cube.material.dispose();
  }

  cube.material = materials;

  // Render
  renderer.render(scene, camera);

  // Capturer en base64
  const base64 = renderer.domElement.toDataURL('image/png');

  // Mettre en cache
  iconCache.set(cacheKey, base64);

  return base64;
}

/**
 * Génère les icônes pour plusieurs blocs de manière asynchrone
 */
export async function renderBlockIconsAsync(
  blocks: Array<{
    _id: string;
    blockId: string;
    textures?: TextureMapping;
    texturesBase64?: TexturesBase64;
  }>
): Promise<Map<string, string>> {
  const results = new Map<string, string>();

  // Traiter par batch pour ne pas bloquer le thread principal
  const BATCH_SIZE = 10;

  for (let i = 0; i < blocks.length; i += BATCH_SIZE) {
    const batch = blocks.slice(i, i + BATCH_SIZE);

    for (const block of batch) {
      if (block.textures && block.texturesBase64) {
        const icon = renderBlockIcon(
          block._id,
          block.textures,
          block.texturesBase64
        );
        if (icon) {
          results.set(block._id, icon);
        }
      }
    }

    // Laisser le thread principal respirer
    if (i + BATCH_SIZE < blocks.length) {
      await new Promise((resolve) => setTimeout(resolve, 0));
    }
  }

  return results;
}

/**
 * Vide le cache des icônes
 */
export function clearIconCache() {
  iconCache.clear();
}

/**
 * Retourne une icône depuis le cache si elle existe
 */
export function getCachedIcon(blockId: string): string | undefined {
  // Chercher par préfixe du blockId
  for (const [key, value] of iconCache.entries()) {
    if (key.startsWith(blockId + '-')) {
      return value;
    }
  }
  return undefined;
}
