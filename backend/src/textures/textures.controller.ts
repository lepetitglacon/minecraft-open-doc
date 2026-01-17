import { Controller, Get, Param, Query } from '@nestjs/common';
import { TexturesService } from './textures.service';

@Controller('textures')
export class TexturesController {
  constructor(private readonly texturesService: TexturesService) {}

  @Get('stats')
  async getStats() {
    return this.texturesService.getStats();
  }

  @Get('by-namespace/:namespace')
  async findByNamespace(
    @Param('namespace') namespace: string,
    @Query('minecraftVersion') minecraftVersion?: string,
  ) {
    const textures = await this.texturesService.findByNamespace(
      namespace,
      minecraftVersion,
    );
    // Return without base64 for listing (too heavy)
    return textures.map((t) => ({
      texturePath: t.texturePath,
      filename: t.filename,
      animated: t.animated,
      mod: t.mod,
    }));
  }

  // GET /textures/mekanism:block/block_steel
  @Get(':namespace/*path')
  async findByPath(
    @Param('namespace') namespace: string,
    @Param('path') path: string[],
    @Query('minecraftVersion') minecraftVersion?: string,
    @Query('format') format?: 'json' | 'image',
  ) {
    const texturePath = `${namespace}:${Array.isArray(path) ? path.join('/') : path}`;
    const texture = await this.texturesService.findByPath(
      texturePath,
      minecraftVersion,
    );

    if (!texture) {
      return { error: 'Texture not found', texturePath };
    }

    // Return full JSON with base64
    return {
      texturePath: texture.texturePath,
      filename: texture.filename,
      animated: texture.animated,
      mcmeta: texture.mcmeta,
      mod: texture.mod,
      base64: texture.base64,
    };
  }
}
