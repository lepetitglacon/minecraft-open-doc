import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ModsController } from './mods.controller';
import { ModsService } from './mods.service';
import { Mod, ModSchema } from '../../schemas/mod.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: Mod.name, schema: ModSchema }])],
  controllers: [ModsController],
  providers: [ModsService],
  exports: [ModsService],
})
export class ModsModule {}
