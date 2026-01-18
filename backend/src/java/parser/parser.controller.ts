import {
  Controller,
  Post,
  UploadedFile,
  BadRequestException,
  Res, Sse, Get,
} from '@nestjs/common';
import { ParserService, StepEvent } from './parser.service';
import type { Response } from 'express';
import * as path from 'path';
import * as fs from 'fs';
import {JarFileInterceptor} from "./decorator/JarFileInterceptor";
import {fromEvent, map, merge, Observable} from "rxjs";
import {EventEmitter2} from "eventemitter2";
import {OnEvent} from "@nestjs/event-emitter";

// Dossier pour les uploads temporaires
export const UPLOAD_DIR = path.join(process.cwd(), 'uploads');

// Créer le dossier s'il n'existe pas
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

@Controller('parser')
export class ParserController {
  constructor(
      private readonly parserService: ParserService,
      private readonly eventEmitter: EventEmitter2
  ) {}

  @Get('steps')
  getSteps() {
    return this.parserService.getSteps();
  }

  @Post('upload')
  @JarFileInterceptor()
  async uploadAndParseStream(
    @UploadedFile() file: Express.Multer.File,
    @Res() res: Response,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    try {
      const result = await this.parserService.parseJar(file.path, (step: StepEvent) => {
        // console.log('step', step);
        this.eventEmitter.emit('upload/step', step);
      });

      this.eventEmitter.emit('upload/complete', {
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
        iconsGenerated: result.iconsGenerated,
      });
    } catch (error) {
      this.eventEmitter.emit('upload/error', {
        error: error.message
      })

      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
    } finally {
      res.end();
    }
  }

  @OnEvent('upload/*')
  test(e) {
    // console.log('event', e)
  }

  @Sse('upload')
  uploadSse(): Observable<MessageEvent> {
    return merge(
      fromEvent(this.eventEmitter, 'upload/step').pipe(map((payload: any) => ({ type: 'step', payload }))),
      fromEvent(this.eventEmitter, 'upload/complete').pipe(map((payload: any) => ({ type: 'complete', payload }))),
      fromEvent(this.eventEmitter, 'upload/error').pipe(map((payload: any) => ({ type: 'error', payload })))
    ).pipe(
      map((event) => ({
        data: event,
      } as MessageEvent)),
    );
  }
}
