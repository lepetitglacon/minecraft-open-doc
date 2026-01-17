import {
  Controller,
  Post,
  Body,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { ParserService } from './parser.service';
import * as path from 'path';
import * as fs from 'fs';

// Dossier pour les uploads temporaires
const UPLOAD_DIR = path.join(process.cwd(), 'uploads');

// Créer le dossier s'il n'existe pas
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

@Controller('parser')
export class ParserController {
  constructor(private readonly parserService: ParserService) {}

  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: UPLOAD_DIR,
        filename: (req, file, cb) => {
          // Garder le nom original avec un timestamp
          const uniqueName = `${Date.now()}-${file.originalname}`;
          cb(null, uniqueName);
        },
      }),
      fileFilter: (req, file, cb) => {
        if (!file.originalname.endsWith('.jar')) {
          cb(new BadRequestException('Only .jar files are allowed'), false);
        } else {
          cb(null, true);
        }
      },
      limits: {
        fileSize: 100 * 1024 * 1024, // 100MB max
      },
    }),
  )
  async uploadAndParse(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    try {
      const result = await this.parserService.parseJar(file.path);

      // Supprimer le fichier après parsing (optionnel)
      // fs.unlinkSync(file.path);

      return {
        success: true,
        filename: file.originalname,
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
      // Supprimer le fichier en cas d'erreur
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
      throw new BadRequestException(error.message);
    }
  }

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
