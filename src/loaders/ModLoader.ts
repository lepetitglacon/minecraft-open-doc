import { ModDefinition, BlockDefinition } from '../types';
import { BlockRegistry } from '../blocks/BlockRegistry';

export class ModLoader {
  constructor(private registry: BlockRegistry) {}

  registerMod(modDef: ModDefinition): ModDefinition {
    // Validate and normalize block definitions
    modDef.blocks = modDef.blocks.map((block) => this.normalizeBlockDefinition(block, modDef.namespace));

    // Register blocks
    this.registry.registerMultiple(modDef.blocks, modDef.textureBasePath);

    return modDef;
  }

  async loadMod(configPath: string): Promise<ModDefinition> {
    const response = await fetch(configPath);
    if (!response.ok) {
      throw new Error(`Failed to load mod config: ${configPath}`);
    }

    const modDef: ModDefinition = await response.json();
    return this.registerMod(modDef);
  }

  private normalizeBlockDefinition(block: BlockDefinition, namespace: string): BlockDefinition {
    // Ensure ID has namespace
    if (!block.id.includes(':')) {
      block.id = `${namespace}:${block.id}`;
    }

    // Default shape to full_cube
    if (!block.shape) {
      block.shape = 'full_cube';
    }

    return block;
  }

  async loadAllMods(configPaths: string[]): Promise<ModDefinition[]> {
    return Promise.all(configPaths.map((path) => this.loadMod(path)));
  }
}
