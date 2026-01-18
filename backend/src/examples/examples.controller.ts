import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { ExamplesService } from './examples.service';
import { ModExample } from '../schemas/mod-example.schema';

@Controller('examples')
export class ExamplesController {
  constructor(private readonly examplesService: ExamplesService) {}

  @Get(':namespace')
  async findAll(@Param('namespace') namespace: string) {
    return this.examplesService.findAll(namespace);
  }

  @Post()
  async create(@Body() example: ModExample) {
    return this.examplesService.create(example);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.examplesService.delete(id);
  }
}
