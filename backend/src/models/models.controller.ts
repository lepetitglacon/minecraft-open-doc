import { Controller, Get, Param, Query } from '@nestjs/common';
import { ModelsService } from './models.service';

@Controller('models')
export class ModelsController {
  constructor(private readonly modelsService: ModelsService) {}

  @Get('stats')
  async getStats() {
    return this.modelsService.getStats();
  }

  @Get('by-namespace/:namespace')
  async findByNamespace(
    @Param('namespace') namespace: string,
    @Query('minecraftVersion') minecraftVersion?: string,
  ) {
    const models = await this.modelsService.findByNamespace(
      namespace,
      minecraftVersion,
    );
    // Return lightweight list
    return models.map((m) => ({
      modelPath: m.modelPath,
      parent: m.parent,
      hasElements: m.elements && m.elements.length > 0,
      textureCount: Object.keys(m.textures || {}).length,
      mod: m.mod,
    }));
  }

  // GET /models/resolved/mekanism:block/storage/steel - Resolved for Three.js
  // MUST be before the wildcard route
  @Get('resolved/:namespace/*path')
  async getResolved(
    @Param('namespace') namespace: string,
    @Param('path') path: string[],
    @Query('minecraftVersion') minecraftVersion?: string,
    @Query('includeTextures') includeTextures?: string,
  ) {
    const modelPath = `${namespace}:${Array.isArray(path) ? path.join('/') : path}`;
    const resolved = await this.modelsService.resolveModel(
      modelPath,
      minecraftVersion,
      includeTextures === 'true',
    );

    if (!resolved) {
      return { error: 'Model not found', modelPath };
    }

    return resolved;
  }

  // GET /models/mekanism:block/storage/steel - Raw model data
  // Wildcard route - must be last
  @Get(':namespace/*path')
  async findByPath(
    @Param('namespace') namespace: string,
    @Param('path') path: string[],
    @Query('minecraftVersion') minecraftVersion?: string,
  ) {
    const modelPath = `${namespace}:${Array.isArray(path) ? path.join('/') : path}`;
    const model = await this.modelsService.findByPath(
      modelPath,
      minecraftVersion,
    );

    if (!model) {
      return { error: 'Model not found', modelPath };
    }

    return model;
  }
}
