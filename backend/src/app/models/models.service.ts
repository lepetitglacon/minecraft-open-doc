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
  'block/cube_bottom_top': {
    north: '#side',
    south: '#side',
    east: '#side',
    west: '#side',
    up: '#top',
    down: '#bottom',
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
    let textures: Record<string, string> = { ...model.textures };

    if (model.elements && model.elements.length > 0) {
      // Model has its own elements
      elements = model.elements as ModelElement[];
    } else if (model.parent) {
      // Try to resolve parent model
      const parentElements = await this.resolveParentElements(
        model.parent,
        minecraftVersion,
      );
      elements = parentElements;

      // Apply parent texture mappings
      const parentMapping = PARENT_TEXTURE_MAPPINGS[model.parent];
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
    if (
      parent.startsWith('block/cube') ||
      parent === 'block/block' ||
      parent.startsWith('minecraft:block/')
    ) {
      return DEFAULT_CUBE_ELEMENTS;
    }

    // Try to find the parent model in our DB
    const parentModel = await this.findByPath(parent, minecraftVersion);
    if (parentModel?.elements && parentModel.elements.length > 0) {
      return parentModel.elements as ModelElement[];
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
