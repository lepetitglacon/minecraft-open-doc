import { Controller, Post, Body, Get, Query } from '@nestjs/common';
import { ParserService } from './parser.service';

@Controller('parser')
export class ParserController {
  constructor(private readonly parserService: ParserService) {}

  @Post('jar')
  async parseJar(@Body('jarPath') jarPath: string) {
    if (!jarPath) {
      return { error: 'jarPath is required' };
    }

    try {
      const result = await this.parserService.parseJar(jarPath);
      return {
        success: true,
        mod: {
          modId: result.mod.modId,
          modVersion: result.mod.modVersion,
          minecraftVersion: result.mod.minecraftVersion,
          displayName: result.mod.displayName,
        },
        blocksCreated: result.blocksCreated,
        blocksUpdated: result.blocksUpdated,
        texturesCreated: result.texturesCreated,
        modelsCreated: result.modelsCreated,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  @Post('directory')
  async parseDirectory(@Body('dirPath') dirPath: string) {
    if (!dirPath) {
      return { error: 'dirPath is required' };
    }

    try {
      const results = await this.parserService.parseDirectory(dirPath);
      return {
        success: true,
        modsProcessed: results.length,
        results: results.map((r) => ({
          modId: r.mod.modId,
          modVersion: r.mod.modVersion,
          blocksCreated: r.blocksCreated,
          blocksUpdated: r.blocksUpdated,
          texturesCreated: r.texturesCreated,
          modelsCreated: r.modelsCreated,
        })),
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }
}
