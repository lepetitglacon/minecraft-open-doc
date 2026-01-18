import { Module } from '@nestjs/common';
import { CoreModule } from './core/core.module';
import { JavaModule } from './java/java.module';
import {AppModule} from "./app/app.module";

@Module({
  imports: [
    CoreModule,
    JavaModule,
    AppModule,
  ],
})
export class RootModule {}
