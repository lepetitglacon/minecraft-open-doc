import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ExamplesController } from './examples.controller';
import { ExamplesService } from './examples.service';
import { ModExample, ModExampleSchema } from '../schemas/mod-example.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ModExample.name, schema: ModExampleSchema },
    ]),
  ],
  controllers: [ExamplesController],
  providers: [ExamplesService],
})
export class ExamplesModule {}
