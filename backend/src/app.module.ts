import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { BlocksModule } from './blocks/blocks.module';
import { ParserModule } from './parser/parser.module';
import { TexturesModule } from './textures/textures.module';
import { ModelsModule } from './models/models.module';

@Module({
  imports: [
    DatabaseModule,
    BlocksModule,
    ParserModule,
    TexturesModule,
    ModelsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
