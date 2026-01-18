import { Controller, Get, Param, Query } from '@nestjs/common';
import { RecipesService } from './recipes.service';

@Controller('recipes')
export class RecipesController {
  constructor(private readonly recipesService: RecipesService) {}

  @Get('stats')
  async getStats() {
    return this.recipesService.getStats();
  }

  @Get(':namespace/:blockId')
  async findByResult(
    @Param('namespace') namespace: string,
    @Param('blockId') blockId: string,
    @Query('minecraftVersion') minecraftVersion?: string,
  ) {
    return this.recipesService.findByResult(namespace, blockId, minecraftVersion);
  }

  @Get('by-namespace/:namespace')
  async findByNamespace(
    @Param('namespace') namespace: string,
    @Query('minecraftVersion') minecraftVersion?: string,
  ) {
    return this.recipesService.findByNamespace(namespace, minecraftVersion);
  }
}
