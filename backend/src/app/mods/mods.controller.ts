import { Controller, Get, Param, Query } from '@nestjs/common';
import { ModsService, ModFilter, PaginationOptions } from './mods.service';

@Controller('mods')
export class ModsController {
  constructor(private readonly modsService: ModsService) {}

  @Get()
  async findAll(
    @Query('search') search?: string,
    @Query('minecraftVersion') minecraftVersion?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const filter: ModFilter = {};
    if (search) filter.search = search;
    if (minecraftVersion) filter.minecraftVersion = minecraftVersion;

    const pagination: PaginationOptions = {};
    if (page) pagination.page = parseInt(page, 10);
    if (limit) pagination.limit = Math.min(parseInt(limit, 10), 100);

    return this.modsService.findAll(filter, pagination);
  }

  @Get('stats')
  async getStats() {
    return this.modsService.getStats();
  }

  @Get('minecraft-versions')
  async getMinecraftVersions() {
    return this.modsService.getMinecraftVersions();
  }

  @Get(':modId')
  async findByModId(
    @Param('modId') modId: string,
    @Query('minecraftVersion') minecraftVersion?: string,
  ) {
    return this.modsService.findByModId(modId, minecraftVersion);
  }
}
