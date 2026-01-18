// upload-jar.decorator.ts
import {
  applyDecorators,
  BadRequestException,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { Request } from 'express';
import { UPLOAD_DIR } from '../parser.controller';

export function JarFileInterceptor(): MethodDecorator {
  return applyDecorators(
    UseInterceptors(
      FileInterceptor('file', {
        storage: diskStorage({
          destination: UPLOAD_DIR,
          filename: (
            req: Request,
            file: Express.Multer.File,
            cb: (error: Error | null, filename: string) => void,
          ) => {
            const uniqueName = `${Date.now()}-${file.originalname}`;
            cb(null, uniqueName);
          },
        }),
        fileFilter: (
          req: Request,
          file: Express.Multer.File,
          cb: (error: Error | null, acceptFile: boolean) => void,
        ) => {
          if (!file.originalname.endsWith('.jar')) {
            cb(new BadRequestException('Only .jar files are allowed'), false);
          } else {
            cb(null, true);
          }
        },
        limits: {
          fileSize: 100 * 1024 * 1024,
        },
      }),
    ),
  );
}
