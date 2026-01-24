import { Model } from 'mongoose';
import { ParseStep } from './parse-step';
import { BlockModel, ModelElement } from '../../../schemas/block-model.schema';
import { ExtractedModel } from '../jar-extractor.service';

export interface ProcessModelsInput {
  models: ExtractedModel[];
  modId: string;
  modVersion: string;
  minecraftVersion: string;
}

export interface ProcessModelsOutput {
  modelsCreated: number;
  modelTexturesMap: Map<string, Record<string, string>>;
}

// Default Minecraft cube elements (for vanilla parent models)
const DEFAULT_CUBE_ELEMENTS: ModelElement[] = [
  {
    from: [0, 0, 0],
    to: [16, 16, 16],
    faces: {
      north: { uv: [0, 0, 16, 16], texture: '#north', cullface: 'north' },
      south: { uv: [0, 0, 16, 16], texture: '#south', cullface: 'south' },
      east: { uv: [0, 0, 16, 16], texture: '#east', cullface: 'east' },
      west: { uv: [0, 0, 16, 16], texture: '#west', cullface: 'west' },
      up: { uv: [0, 0, 16, 16], texture: '#up', cullface: 'up' },
      down: { uv: [0, 0, 16, 16], texture: '#down', cullface: 'down' },
    },
  },
];

// Texture variable mappings for vanilla parent models
const PARENT_TEXTURE_MAPPINGS: Record<string, Record<string, string>> = {
  // block/block is the base model - use particle texture as fallback for all faces
  'block/block': {
    north: '#particle',
    south: '#particle',
    east: '#particle',
    west: '#particle',
    up: '#particle',
    down: '#particle',
  },
  'block/cube_all': {
    north: '#all',
    south: '#all',
    east: '#all',
    west: '#all',
    up: '#all',
    down: '#all',
  },
  'block/cube': {
    north: '#north',
    south: '#south',
    east: '#east',
    west: '#west',
    up: '#up',
    down: '#down',
  },
  'block/cube_column': {
    north: '#side',
    south: '#side',
    east: '#side',
    west: '#side',
    up: '#end',
    down: '#end',
  },
  'block/cube_column_horizontal': {
    north: '#side',
    south: '#side',
    east: '#end',
    west: '#end',
    up: '#side',
    down: '#side',
  },
  'block/cube_bottom_top': {
    north: '#side',
    south: '#side',
    east: '#side',
    west: '#side',
    up: '#top',
    down: '#bottom',
  },
  'block/orientable': {
    north: '#front',
    south: '#side',
    east: '#side',
    west: '#side',
    up: '#top',
    down: '#top',
  },
  'block/orientable_with_bottom': {
    north: '#front',
    south: '#side',
    east: '#side',
    west: '#side',
    up: '#top',
    down: '#bottom',
  },
  'block/orientable_vertical': {
    north: '#side',
    south: '#side',
    east: '#side',
    west: '#side',
    up: '#front',
    down: '#front',
  },
};

export class ProcessModelsStep extends ParseStep<
  ProcessModelsInput,
  ProcessModelsOutput
> {
  readonly name = 'process-models';

  constructor(private readonly blockModelModel: Model<BlockModel>) {
    super();
  }

  async execute(input: ProcessModelsInput): Promise<ProcessModelsOutput> {
    const { models, modId, modVersion, minecraftVersion } = input;

    this.progress(0, models.length);

    // Build in-memory map of all models for parent resolution
    const modelMap = new Map<string, ExtractedModel>();
    for (const model of models) {
      modelMap.set(model.modelPath, model);
    }

    let modelsCreated = 0;
    const modelTexturesMap = new Map<string, Record<string, string>>();

    for (let i = 0; i < models.length; i++) {
      const model = models[i];

      const resolvedTextures = model.textures
        ? Object.values(model.textures).filter(
            (t) => typeof t === 'string' && !t.startsWith('#'),
          )
        : [];

      if (model.textures) {
        modelTexturesMap.set(model.modelPath, model.textures);
      }

      // Pre-resolve the model
      const { resolvedElements, resolvedTextureMap } = this.resolveModel(
        model,
        modelMap,
      );

      const result = await this.blockModelModel.updateOne(
        {
          modelPath: model.modelPath,
          'mod.modVersion': modVersion,
          'mod.minecraftVersion': minecraftVersion,
        },
        {
          $set: {
            modelPath: model.modelPath,
            namespace: modId,
            mod: { modId, modVersion, minecraftVersion },
            parent: model.parent,
            textures: model.textures || {},
            elements: model.elements || [],
            display: model.display,
            ambientOcclusion: model.ambientOcclusion ?? true,
            resolvedTextures,
            resolvedElements,
            resolvedTextureMap,
          },
        },
        { upsert: true },
      );

      if (result.upsertedCount > 0) modelsCreated++;

      if ((i + 1) % 50 === 0 || i === models.length - 1) {
        this.progress(i + 1, models.length);
      }
    }

    this.complete(`${modelsCreated} models created`);

    return { modelsCreated, modelTexturesMap };
  }

  /**
   * Normalize parent name by removing minecraft: prefix
   */
  private normalizeParentName(parent: string): string {
    if (parent.startsWith('minecraft:')) {
      return parent.substring('minecraft:'.length);
    }
    return parent;
  }

  /**
   * Check if a parent is a vanilla Minecraft parent
   */
  private isVanillaParent(parent: string): boolean {
    const normalized = this.normalizeParentName(parent);
    return (
      normalized.startsWith('block/cube') ||
      normalized === 'block/block' ||
      normalized.startsWith('block/orientable') ||
      normalized.startsWith('block/cross') ||
      normalized.startsWith('block/tinted_cross') ||
      normalized.startsWith('block/template_') ||
      normalized === 'block/thin_block'
    );
  }

  /**
   * Merge textures from the entire parent chain (child overrides parent)
   */
  private mergeParentTextures(
    model: ExtractedModel,
    modelMap: Map<string, ExtractedModel>,
  ): Record<string, string> {
    const result: Record<string, string> = {};

    // Collect parent chain (starting from root)
    const chain: ExtractedModel[] = [];
    let current: ExtractedModel | undefined = model;

    while (current) {
      chain.unshift(current); // Add to beginning
      if (current.parent && !this.isVanillaParent(current.parent)) {
        current = modelMap.get(current.parent);
      } else {
        break;
      }
    }

    // Apply textures from root to child (child overrides parent)
    for (const m of chain) {
      if (m.textures) {
        Object.assign(result, m.textures);
      }
    }

    return result;
  }

  /**
   * Find parent texture mapping by following the parent chain
   */
  private findParentMapping(
    parent: string,
    modelMap: Map<string, ExtractedModel>,
  ): Record<string, string> | null {
    const normalized = this.normalizeParentName(parent);

    // Check if we have a direct mapping
    if (PARENT_TEXTURE_MAPPINGS[normalized]) {
      return PARENT_TEXTURE_MAPPINGS[normalized];
    }

    // Try to find the parent model and check its parent
    const parentModel = modelMap.get(parent);
    if (parentModel?.parent) {
      return this.findParentMapping(parentModel.parent, modelMap);
    }

    return null;
  }

  /**
   * Get elements from parent chain
   */
  private resolveParentElements(
    parent: string,
    modelMap: Map<string, ExtractedModel>,
  ): ModelElement[] {
    if (this.isVanillaParent(parent)) {
      return DEFAULT_CUBE_ELEMENTS;
    }

    const parentModel = modelMap.get(parent);
    if (parentModel?.elements && parentModel.elements.length > 0) {
      return parentModel.elements as ModelElement[];
    }

    if (parentModel?.parent) {
      return this.resolveParentElements(parentModel.parent, modelMap);
    }

    return DEFAULT_CUBE_ELEMENTS;
  }

  /**
   * Resolve texture variables in elements
   */
  private resolveTextureVariables(
    elements: ModelElement[],
    textures: Record<string, string>,
  ): ModelElement[] {
    return elements.map((element) => {
      const resolvedFaces: typeof element.faces = {};

      for (const [faceName, face] of Object.entries(element.faces)) {
        const resolvedFace = { ...face };

        if (face.texture.startsWith('#')) {
          const varName = face.texture.substring(1);
          if (textures[varName] && !textures[varName].startsWith('#')) {
            resolvedFace.texture = textures[varName];
          }
        }

        resolvedFaces[faceName] = resolvedFace;
      }

      return {
        ...element,
        faces: resolvedFaces,
      };
    });
  }

  /**
   * Fully resolve a model with its parent chain
   */
  private resolveModel(
    model: ExtractedModel,
    modelMap: Map<string, ExtractedModel>,
  ): { resolvedElements: ModelElement[]; resolvedTextureMap: Record<string, string> } {
    // Merge textures from parent chain
    const textures = this.mergeParentTextures(model, modelMap);

    // Get elements
    let elements: ModelElement[];
    if (model.elements && model.elements.length > 0) {
      elements = model.elements as ModelElement[];
    } else if (model.parent) {
      elements = this.resolveParentElements(model.parent, modelMap);

      // Apply parent texture mappings
      const parentMapping = this.findParentMapping(model.parent, modelMap);
      if (parentMapping) {
        for (const [face, variable] of Object.entries(parentMapping)) {
          const varName = variable.replace('#', '');
          if (textures[varName]) {
            textures[face] = textures[varName];
          }
        }
      }
    } else {
      elements = DEFAULT_CUBE_ELEMENTS;
    }

    // Resolve texture variables in elements
    const resolvedElements = this.resolveTextureVariables(elements, textures);

    // Build resolved texture map (only non-variable values)
    const resolvedTextureMap: Record<string, string> = {};
    for (const [key, value] of Object.entries(textures)) {
      if (typeof value === 'string' && !value.startsWith('#')) {
        resolvedTextureMap[key] = value;
      }
    }

    return { resolvedElements, resolvedTextureMap };
  }
}
