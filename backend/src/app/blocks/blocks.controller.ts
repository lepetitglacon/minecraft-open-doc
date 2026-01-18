import { Controller, Get, Param, Query } from '@nestjs/common';
import { BlocksService, BlockFilter, PaginationOptions } from './blocks.service';

@Controller('blocks')
export class BlocksController {
  constructor(private readonly blocksService: BlocksService) {}

  @Get()
  async findAll(
    @Query('namespace') namespace?: string,
    @Query('modVersion') modVersion?: string,
    @Query('minecraftVersion') minecraftVersion?: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('withIcons') withIcons?: string,
    @Query('withTextures') withTextures?: string,
  ) {
    const filter: BlockFilter = {};
    if (namespace) filter.namespace = namespace;
    if (modVersion) filter.modVersion = modVersion;
    if (minecraftVersion) filter.minecraftVersion = minecraftVersion;
    if (search) filter.search = search;

    const pagination: PaginationOptions = {};
    if (page) pagination.page = parseInt(page, 10);
    if (limit) pagination.limit = Math.min(parseInt(limit, 10), 100);

    if (withIcons === 'true') {
      return this.blocksService.findAllWithIcons(
        filter,
        pagination,
        withTextures === 'true',
      );
    }

    return this.blocksService.findAll(filter, pagination);
  }

  @Get('stats')
  async getStats() {
    return this.blocksService.getStats();
  }

  @Get('namespaces')
  async getNamespaces() {
    return this.blocksService.getNamespaces();
  }

  @Get(':namespace/:blockId')
  async findOne(
    @Param('namespace') namespace: string,
    @Param('blockId') blockId: string,
    @Query('minecraftVersion') minecraftVersion?: string,
    @Query('withIcons') withIcons?: string,
  ) {
    if (withIcons === 'true') {
      return this.blocksService.findOneWithIcons(namespace, blockId, minecraftVersion);
    }
    return this.blocksService.findOne(namespace, blockId, minecraftVersion);
  }
}
