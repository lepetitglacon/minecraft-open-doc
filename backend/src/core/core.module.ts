import { Module } from '@nestjs/common';
import {DatabaseModule} from "./database/database.module";
import {EventEmitterModule} from "@nestjs/event-emitter";

@Module({
    imports: [
        DatabaseModule,
        EventEmitterModule.forRoot()
    ]
})
export class CoreModule {}
