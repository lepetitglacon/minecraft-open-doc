import { GLTFLoader, type GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js';

export function useGltfLoader() {
  const loader = new GLTFLoader();

  const loadGltf = async (url: string): Promise<GLTF> => {
    return await loader.loadAsync(url);
  };

  const loadGltfFromFile = async (file: File): Promise<GLTF> => {
    const url = URL.createObjectURL(file);
    try {
      const gltf = await loader.loadAsync(url);
      return gltf;
    } finally {
      URL.revokeObjectURL(url);
    }
  };

  return {
    loadGltf,
    loadGltfFromFile
  };
}
