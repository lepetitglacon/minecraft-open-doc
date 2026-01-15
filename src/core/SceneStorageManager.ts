export interface SceneBlock {
  blockId: string;
  position: { x: number; y: number; z: number };
}

export interface SceneMetadata {
  id: string;
  name: string;
  description?: string;
  tags?: string[];
  createdAt: number;
  updatedAt: number;
  blockCount: number;
}

export interface Scene extends SceneMetadata {
  blocks: SceneBlock[];
}

export interface SceneListItem extends SceneMetadata {}

interface StorageData {
  version: number;
  scenes: Record<string, Scene>;
}

export class SceneStorageManager {
  private readonly STORAGE_KEY = 'minecraft-viewer-scenes';
  private scenes: Map<string, Scene> = new Map();

  constructor() {
    this.load();
  }

  private load(): void {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      if (!data) return;

      const parsed: StorageData = JSON.parse(data);
      if (parsed.version !== 1) return;

      this.scenes = new Map(Object.entries(parsed.scenes));
    } catch (e) {
      console.warn('Failed to load scenes:', e);
    }
  }

  private save(): void {
    const data: StorageData = {
      version: 1,
      scenes: Object.fromEntries(this.scenes),
    };
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
  }

  private generateId(): string {
    return `scene_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  }

  createScene(options: {
    name: string;
    description?: string;
    tags?: string[];
    blocks: SceneBlock[];
  }): string {
    const id = this.generateId();
    const now = Date.now();

    const scene: Scene = {
      id,
      name: options.name,
      description: options.description,
      tags: options.tags,
      createdAt: now,
      updatedAt: now,
      blockCount: options.blocks.length,
      blocks: options.blocks,
    };

    this.scenes.set(id, scene);
    this.save();
    return id;
  }

  updateScene(id: string, updates: Partial<{
    name: string;
    description: string;
    tags: string[];
    blocks: SceneBlock[];
  }>): boolean {
    const scene = this.scenes.get(id);
    if (!scene) return false;

    if (updates.name !== undefined) scene.name = updates.name;
    if (updates.description !== undefined) scene.description = updates.description;
    if (updates.tags !== undefined) scene.tags = updates.tags;
    if (updates.blocks !== undefined) {
      scene.blocks = updates.blocks;
      scene.blockCount = updates.blocks.length;
    }
    scene.updatedAt = Date.now();

    this.scenes.set(id, scene);
    this.save();
    return true;
  }

  deleteScene(id: string): boolean {
    const deleted = this.scenes.delete(id);
    if (deleted) this.save();
    return deleted;
  }

  getScene(id: string): Scene | null {
    return this.scenes.get(id) || null;
  }

  listScenes(): SceneListItem[] {
    return Array.from(this.scenes.values())
      .map(({ blocks, ...metadata }) => metadata)
      .sort((a, b) => b.updatedAt - a.updatedAt);
  }

  searchScenes(query: string): SceneListItem[] {
    const lowerQuery = query.toLowerCase();
    return this.listScenes().filter(scene =>
      scene.name.toLowerCase().includes(lowerQuery) ||
      scene.description?.toLowerCase().includes(lowerQuery) ||
      scene.tags?.some(tag => tag.toLowerCase().includes(lowerQuery))
    );
  }

  exportScene(id: string): string | null {
    const scene = this.scenes.get(id);
    if (!scene) return null;
    return JSON.stringify(scene, null, 2);
  }

  importScene(jsonData: string): string | null {
    try {
      const scene: Scene = JSON.parse(jsonData);

      // Validate structure
      if (!scene.name || !Array.isArray(scene.blocks)) {
        throw new Error('Invalid scene format');
      }

      // Generate new ID and timestamps
      const id = this.generateId();
      const now = Date.now();

      const newScene: Scene = {
        ...scene,
        id,
        createdAt: now,
        updatedAt: now,
        blockCount: scene.blocks.length,
      };

      this.scenes.set(id, newScene);
      this.save();
      return id;
    } catch (e) {
      console.error('Failed to import scene:', e);
      return null;
    }
  }

  duplicateScene(id: string, newName?: string): string | null {
    const scene = this.scenes.get(id);
    if (!scene) return null;

    return this.createScene({
      name: newName || `${scene.name} (copy)`,
      description: scene.description,
      tags: scene.tags,
      blocks: [...scene.blocks],
    });
  }
}
