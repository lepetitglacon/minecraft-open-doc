import { BlockDefinition } from '../types';

export class BlockRegistry {
  private blocks: Map<string, BlockDefinition> = new Map();
  private texturePaths: Map<string, string> = new Map(); // namespace -> base path

  register(definition: BlockDefinition, textureBasePath: string): void {
    this.blocks.set(definition.id, definition);
    const namespace = definition.id.split(':')[0];
    if (!this.texturePaths.has(namespace)) {
      this.texturePaths.set(namespace, textureBasePath);
    }
  }

  registerMultiple(definitions: BlockDefinition[], textureBasePath: string): void {
    definitions.forEach((def) => this.register(def, textureBasePath));
  }

  get(id: string): BlockDefinition | undefined {
    return this.blocks.get(id);
  }

  getTextureBasePath(id: string): string {
    const namespace = id.split(':')[0];
    return this.texturePaths.get(namespace) ?? '/textures/';
  }

  getByNamespace(namespace: string): BlockDefinition[] {
    return Array.from(this.blocks.values()).filter(
      (block) => block.id.startsWith(namespace + ':')
    );
  }

  getAll(): BlockDefinition[] {
    return Array.from(this.blocks.values());
  }

  getAllNamespaces(): string[] {
    const namespaces = new Set<string>();
    this.blocks.forEach((_, id) => {
      namespaces.add(id.split(':')[0]);
    });
    return Array.from(namespaces);
  }

  has(id: string): boolean {
    return this.blocks.has(id);
  }

  clear(): void {
    this.blocks.clear();
    this.texturePaths.clear();
  }
}
