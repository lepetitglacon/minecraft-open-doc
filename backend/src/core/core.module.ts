import { Module } from '@nestjs/common';
import { DatabaseModule } from './database/database.module';
import { EventEmitterModule } from '@nestjs/event-emitter';
import {ConfigModule} from "@nestjs/config";

@Module({
  imports: [
    ConfigModule.forRoot(),
    DatabaseModule,
    EventEmitterModule.forRoot()
  ],
})
export class CoreModule {}
