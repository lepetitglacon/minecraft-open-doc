import { Module } from '@nestjs/common';
import {BlocksModule} from "./blocks/blocks.module";
import {TexturesModule} from "./textures/textures.module";
import {ModelsModule} from "./models/models.module";
import {RecipesModule} from "./recipes/recipes.module";
import {ModsModule} from "./mods/mods.module";
import {ExamplesModule} from "./examples/examples.module";

@Module({
    imports: [
        BlocksModule,
        TexturesModule,
        ModelsModule,
        RecipesModule,
        ModsModule,
        ExamplesModule,
    ]
})
export class AppModule {}
