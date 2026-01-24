import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  BlockModel,
  BlockModelDocument,
  ModelElement,
} from '../../schemas/block-model.schema';
import { TexturesService } from '../textures/textures.service';

// Default Minecraft cube elements (for block/cube_all parent)
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

// Texture variable mappings for common parent models
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

export interface ResolvedModel {
  modelPath: string;
  elements: ModelElement[];
  textures: Record<string, string>; // Resolved texture paths
  texturesBase64?: Record<string, string>; // Optional base64 data
  ambientOcclusion: boolean;
}

@Injectable()
export class ModelsService {
  private readonly logger = new Logger(ModelsService.name);

  constructor(
    @InjectModel(BlockModel.name) private blockModelModel: Model<BlockModel>,
    private readonly texturesService: TexturesService,
  ) {}

  async findByPath(
    modelPath: string,
    minecraftVersion?: string,
  ): Promise<BlockModelDocument | null> {
    const query: Record<string, unknown> = { modelPath };
    if (minecraftVersion) {
      query['mod.minecraftVersion'] = minecraftVersion;
    }
    return this.blockModelModel.findOne(query).exec();
  }

  async findByNamespace(
    namespace: string,
    minecraftVersion?: string,
  ): Promise<BlockModelDocument[]> {
    const query: Record<string, unknown> = { namespace };
    if (minecraftVersion) {
      query['mod.minecraftVersion'] = minecraftVersion;
    }
    return this.blockModelModel.find(query).exec();
  }

  async findMultipleByPaths(
    modelPaths: string[],
    minecraftVersion?: string,
  ): Promise<BlockModelDocument[]> {
    const query: Record<string, unknown> = {
      modelPath: { $in: modelPaths },
    };
    if (minecraftVersion) {
      query['mod.minecraftVersion'] = minecraftVersion;
    }
    return this.blockModelModel.find(query).exec();
  }

  /**
   * Resolve multiple models in batch for efficient loading
   * Returns a map of modelPath -> ResolvedModel
   */
  async resolveMultipleModels(
    modelPaths: string[],
    minecraftVersion?: string,
  ): Promise<Map<string, ResolvedModel>> {
    const result = new Map<string, ResolvedModel>();
    if (modelPaths.length === 0) return result;

    // Fetch all models
    const models = await this.findMultipleByPaths(modelPaths, minecraftVersion);
    const modelMap = new Map<string, BlockModelDocument>();
    for (const model of models) {
      modelMap.set(model.modelPath, model);
    }

    // Recursively fetch all parent models in the chain
    let newParentPaths = new Set<string>();
    for (const model of models) {
      if (model.parent && !this.isVanillaParent(model.parent) && !modelMap.has(model.parent)) {
        newParentPaths.add(model.parent);
      }
    }

    // Keep fetching parents until we have them all
    while (newParentPaths.size > 0) {
      const parentModels = await this.findMultipleByPaths(
        Array.from(newParentPaths),
        minecraftVersion,
      );

      const nextParentPaths = new Set<string>();
      for (const parent of parentModels) {
        modelMap.set(parent.modelPath, parent);
        // Check if this parent has its own parent that we need to fetch
        if (parent.parent && !this.isVanillaParent(parent.parent) && !modelMap.has(parent.parent)) {
          nextParentPaths.add(parent.parent);
        }
      }
      newParentPaths = nextParentPaths;
    }

    // Resolve each model
    for (const modelPath of modelPaths) {
      const model = modelMap.get(modelPath);
      if (!model) continue;

      const resolved = this.resolveModelSync(model, modelMap);
      if (resolved) {
        result.set(modelPath, resolved);
      }
    }

    return result;
  }

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
   * Normalize parent name by removing minecraft: prefix
   */
  private normalizeParentName(parent: string): string {
    if (parent.startsWith('minecraft:')) {
      return parent.substring('minecraft:'.length);
    }
    return parent;
  }

  /**
   * Merge textures from the entire parent chain (child overrides parent)
   */
  private mergeParentTexturesSync(
    model: BlockModelDocument,
    modelMap: Map<string, BlockModelDocument>,
  ): Record<string, string> {
    const result: Record<string, string> = {};

    // First, collect textures from parent chain (starting from root)
    const chain: BlockModelDocument[] = [];
    let current: BlockModelDocument | undefined = model;

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
   * Find the texture mapping by following the parent chain
   */
  private findParentMappingSync(
    parent: string,
    modelMap: Map<string, BlockModelDocument>,
  ): Record<string, string> | null {
    const normalized = this.normalizeParentName(parent);

    // Check if we have a direct mapping
    if (PARENT_TEXTURE_MAPPINGS[normalized]) {
      return PARENT_TEXTURE_MAPPINGS[normalized];
    }

    // Try to find the parent model and check its parent
    const parentModel = modelMap.get(parent);
    if (parentModel?.parent) {
      return this.findParentMappingSync(parentModel.parent, modelMap);
    }

    // No mapping found
    return null;
  }

  /**
   * Synchronously resolve a model using a pre-fetched model map
   */
  private resolveModelSync(
    model: BlockModelDocument,
    modelMap: Map<string, BlockModelDocument>,
  ): ResolvedModel | null {
    // Merge textures from parent chain
    const textures: Record<string, string> = this.mergeParentTexturesSync(
      model,
      modelMap,
    );

    // Get elements
    let elements: ModelElement[];
    if (model.elements && model.elements.length > 0) {
      elements = model.elements;
    } else if (model.parent) {
      elements = this.resolveParentElementsSync(model.parent, modelMap);

      // Find and apply parent texture mappings (following the parent chain)
      const parentMapping = this.findParentMappingSync(model.parent, modelMap);
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

    // Build resolved textures map
    const resolvedTextures: Record<string, string> = {};
    for (const [key, value] of Object.entries(textures)) {
      if (typeof value === 'string' && !value.startsWith('#')) {
        resolvedTextures[key] = value;
      }
    }

    return {
      modelPath: model.modelPath,
      elements: resolvedElements,
      textures: resolvedTextures,
      ambientOcclusion: model.ambientOcclusion,
    };
  }

  private resolveParentElementsSync(
    parent: string,
    modelMap: Map<string, BlockModelDocument>,
  ): ModelElement[] {
    // Check if it's a vanilla parent model
    if (this.isVanillaParent(parent)) {
      return DEFAULT_CUBE_ELEMENTS;
    }

    // Try to find the parent model in our map
    const parentModel = modelMap.get(parent);
    if (parentModel?.elements && parentModel.elements.length > 0) {
      return parentModel.elements;
    }

    // Check parent's parent recursively
    if (parentModel?.parent) {
      return this.resolveParentElementsSync(parentModel.parent, modelMap);
    }

    // Default fallback
    return DEFAULT_CUBE_ELEMENTS;
  }

  /**
   * Resolve a model with its parent chain for Three.js rendering
   * Returns elements with resolved texture references
   */
  async resolveModel(
    modelPath: string,
    minecraftVersion?: string,
    includeTextureData = false,
  ): Promise<ResolvedModel | null> {
    const model = await this.findByPath(modelPath, minecraftVersion);
    if (!model) return null;

    // Get elements (from model or default cube)
    let elements: ModelElement[] = [];
    const textures: Record<string, string> = { ...model.textures };

    if (model.elements && model.elements.length > 0) {
      // Model has its own elements
      elements = model.elements;
    } else if (model.parent) {
      // Try to resolve parent model
      const parentElements = await this.resolveParentElements(
        model.parent,
        minecraftVersion,
      );
      elements = parentElements;

      // Apply parent texture mappings (use normalized parent name for lookup)
      const normalizedParent = this.normalizeParentName(model.parent);
      const parentMapping = PARENT_TEXTURE_MAPPINGS[normalizedParent];
      if (parentMapping) {
        // Resolve texture variables through the mapping
        for (const [face, variable] of Object.entries(parentMapping)) {
          const varName = variable.replace('#', '');
          if (textures[varName]) {
            textures[face] = textures[varName];
          }
        }
      }
    }

    // Resolve texture variables in elements
    const resolvedElements = this.resolveTextureVariables(elements, textures);

    // Get unique texture paths
    const uniqueTextures = new Set<string>();
    for (const tex of Object.values(textures)) {
      if (typeof tex === 'string' && !tex.startsWith('#')) {
        uniqueTextures.add(tex);
      }
    }

    // Build resolved textures map
    const resolvedTextures: Record<string, string> = {};
    for (const [key, value] of Object.entries(textures)) {
      if (typeof value === 'string' && !value.startsWith('#')) {
        resolvedTextures[key] = value;
      }
    }

    const result: ResolvedModel = {
      modelPath: model.modelPath,
      elements: resolvedElements,
      textures: resolvedTextures,
      ambientOcclusion: model.ambientOcclusion,
    };

    // Optionally include base64 texture data
    if (includeTextureData && uniqueTextures.size > 0) {
      const texturesDocs = await this.texturesService.findMultiple(
        Array.from(uniqueTextures),
        minecraftVersion,
      );

      result.texturesBase64 = {};
      for (const tex of texturesDocs) {
        result.texturesBase64[tex.texturePath] = tex.base64;
      }
    }

    return result;
  }

  private async resolveParentElements(
    parent: string,
    minecraftVersion?: string,
  ): Promise<ModelElement[]> {
    // Check if it's a vanilla parent model
    if (this.isVanillaParent(parent)) {
      return DEFAULT_CUBE_ELEMENTS;
    }

    // Try to find the parent model in our DB
    const parentModel = await this.findByPath(parent, minecraftVersion);
    if (parentModel?.elements && parentModel.elements.length > 0) {
      return parentModel.elements;
    }

    // Check parent's parent recursively
    if (parentModel?.parent) {
      return this.resolveParentElements(parentModel.parent, minecraftVersion);
    }

    // Default fallback
    return DEFAULT_CUBE_ELEMENTS;
  }

  private resolveTextureVariables(
    elements: ModelElement[],
    textures: Record<string, string>,
  ): ModelElement[] {
    return elements.map((element) => {
      const resolvedFaces: typeof element.faces = {};

      for (const [faceName, face] of Object.entries(element.faces)) {
        const resolvedFace = { ...face };

        // Resolve texture variable
        if (face.texture.startsWith('#')) {
          const varName = face.texture.substring(1);
          if (textures[varName] && !textures[varName].startsWith('#')) {
            resolvedFace.texture = textures[varName];
          } else {
            // Keep the variable if we can't resolve it
            resolvedFace.texture = face.texture;
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

  async getStats(): Promise<{
    total: number;
    withElements: number;
    byNamespace: { namespace: string; count: number }[];
  }> {
    const [total, withElements, byNamespace] = await Promise.all([
      this.blockModelModel.countDocuments().exec(),
      this.blockModelModel
        .countDocuments({ elements: { $exists: true, $ne: [] } })
        .exec(),
      this.blockModelModel.aggregate([
        { $group: { _id: '$namespace', count: { $sum: 1 } } },
        { $project: { namespace: '$_id', count: 1, _id: 0 } },
        { $sort: { count: -1 } },
      ]),
    ]);

    return { total, withElements, byNamespace };
  }
}
