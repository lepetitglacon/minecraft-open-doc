import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Block, BlockDocument } from '../../schemas/block.schema';
import { TexturesService } from '../textures/textures.service';
import { ModelsService } from '../models/models.service';

type BlockQuery = Record<string, unknown>;

export interface BlockFilter {
  namespace?: string;
  modVersion?: string;
  minecraftVersion?: string;
  search?: string;
}

export interface PaginationOptions {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface ModelElement {
  from: [number, number, number];
  to: [number, number, number];
  rotation?: {
    origin: [number, number, number];
    axis: 'x' | 'y' | 'z';
    angle: number;
    rescale?: boolean;
  };
  faces: Record<
    string,
    {
      uv?: [number, number, number, number];
      texture: string;
      cullface?: string;
      rotation?: number;
      tintindex?: number;
    }
  >;
}

export interface BlockModel3D {
  modelPath: string;
  elements: ModelElement[];
  ambientOcclusion: boolean;
}

export interface BlockWithIcon {
  _id: string;
  registryName: string;
  namespace: string;
  blockId: string;
  displayName?: string;
  mod: {
    modId: string;
    modVersion: string;
    minecraftVersion: string;
  };
  icon?: string; // base64 de la première texture (fallback)
  icon3d?: string; // icône 3D pré-rendue (base64 PNG)
  textures?: Record<string, string>; // mapping face/variable -> texturePath
  texturesBase64?: Record<string, string>; // mapping texturePath -> base64
  animatedTextures?: Record<string, string>; // mapping texturePath -> GIF base64 (pour textures animées)
  hasAnimatedTextures?: boolean; // true si au moins une texture est animée
  model?: BlockModel3D; // modèle 3D complet avec éléments
}

@Injectable()
export class BlocksService {
  constructor(
    @InjectModel(Block.name) private blockModel: Model<Block>,
    private texturesService: TexturesService,
    private modelsService: ModelsService,
  ) {}

  async findAll(
    filter: BlockFilter = {},
    pagination: PaginationOptions = {},
  ): Promise<PaginatedResult<BlockDocument>> {
    const { page = 1, limit = 50, sort, order = 'asc' } = pagination;
    const skip = (page - 1) * limit;

    const query: BlockQuery = {};

    if (filter.namespace) {
      query.namespace = filter.namespace;
    }

    if (filter.modVersion) {
      query['mod.modVersion'] = filter.modVersion;
    }

    if (filter.minecraftVersion) {
      query['mod.minecraftVersion'] = filter.minecraftVersion;
    }

    if (filter.search) {
      query.$text = { $search: filter.search };
    }

    const sortOptions: Record<string, 1 | -1> = {};
    if (sort) {
      sortOptions[sort] = order === 'asc' ? 1 : -1;
    } else {
      // Default sort by registryName
      sortOptions.registryName = 1;
    }

    const [data, total] = await Promise.all([
      this.blockModel
        .find(query)
        .sort(sortOptions)
        .skip(skip)
        .limit(limit)
        .exec(),
      this.blockModel.countDocuments(query).exec(),
    ]);

    return {
      data,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    };
  }

  async findOne(
    namespace: string,
    blockId: string,
    minecraftVersion?: string,
  ): Promise<BlockDocument | null> {
    const query: BlockQuery = {
      namespace,
      blockId,
    };

    if (minecraftVersion) {
      query['mod.minecraftVersion'] = minecraftVersion;
    }

    return this.blockModel.findOne(query).exec();
  }

  async findOneWithIcons(
    namespace: string,
    blockId: string,
    minecraftVersion?: string,
  ): Promise<BlockWithIcon | null> {
    const block = await this.findOne(namespace, blockId, minecraftVersion);
    if (!block) return null;

    let icon: string | undefined;
    let blockTextures: Record<string, string> | undefined;
    let blockTexturesBase64: Record<string, string> | undefined;
    let animatedTextures: Record<string, string> | undefined;
    let hasAnimatedTextures = false;

    if (block.models && block.models.length > 0) {
      // Récupérer le modèle
      const models = await this.modelsService.findMultipleByPaths(
        [block.models[0]],
        minecraftVersion,
      );

      if (models.length > 0) {
        const model = models[0];
        blockTextures = model.textures || {};

        // Collecter les chemins de textures
        const texturePaths = new Set<string>();
        for (const texPath of Object.values(blockTextures)) {
          if (typeof texPath === 'string' && !texPath.startsWith('#')) {
            texturePaths.add(texPath);
          }
        }
        for (const texPath of model.resolvedTextures || []) {
          texturePaths.add(texPath);
        }

        // Récupérer les textures
        const textures = await this.texturesService.findMultiple(
          Array.from(texturePaths),
          minecraftVersion,
        );

        // Construire les maps
        blockTexturesBase64 = {};
        animatedTextures = {};

        for (const tex of textures) {
          blockTexturesBase64[tex.texturePath] = tex.base64;
          if (tex.animated && tex.animatedGif) {
            animatedTextures[tex.texturePath] = tex.animatedGif;
            hasAnimatedTextures = true;
          }
        }

        // Icon fallback
        if (model.resolvedTextures && model.resolvedTextures.length > 0) {
          icon = blockTexturesBase64[model.resolvedTextures[0]];
        } else {
          icon = Object.values(blockTexturesBase64)[0];
        }
      }
    }

    return {
      _id: block._id.toString(),
      registryName: block.registryName,
      namespace: block.namespace,
      blockId: block.blockId,
      displayName: block.displayName,
      mod: block.mod,
      icon,
      icon3d: block.icon3d,
      textures: blockTextures,
      texturesBase64: blockTexturesBase64,
      animatedTextures: hasAnimatedTextures ? animatedTextures : undefined,
      hasAnimatedTextures,
    };
  }

  async findByRegistryName(
    registryName: string,
    minecraftVersion?: string,
  ): Promise<BlockDocument | null> {
    const query: BlockQuery = { registryName };

    if (minecraftVersion) {
      query['mod.minecraftVersion'] = minecraftVersion;
    }

    return this.blockModel.findOne(query).exec();
  }

  async getNamespaces(): Promise<string[]> {
    return this.blockModel.distinct('namespace').exec();
  }

  async getStats(): Promise<{
    totalBlocks: number;
    namespaces: number;
    byNamespace: { namespace: string; count: number }[];
  }> {
    const [totalBlocks, namespaces, byNamespace] = await Promise.all([
      this.blockModel.countDocuments().exec(),
      this.blockModel.distinct('namespace').exec(),
      this.blockModel.aggregate([
        { $group: { _id: '$namespace', count: { $sum: 1 } } },
        { $project: { namespace: '$_id', count: 1, _id: 0 } },
        { $sort: { count: -1 } },
      ]),
    ]);

    return {
      totalBlocks,
      namespaces: namespaces.length,
      byNamespace,
    };
  }

  async findAllWithIcons(
    filter: BlockFilter = {},
    pagination: PaginationOptions = {},
    withTextures = false,
    withModel = false,
  ): Promise<PaginatedResult<BlockWithIcon>> {
    const result = await this.findAll(filter, pagination);

    // Collecter tous les chemins de modèles uniques (premier modèle de chaque block)
    const modelPaths = new Set<string>();
    for (const block of result.data) {
      if (block.models && block.models.length > 0) {
        modelPaths.add(block.models[0]);
      }
    }

    // Créer un map modelPath -> model data
    const modelDataMap = new Map<
      string,
      {
        textures: Record<string, string>;
        resolvedTextures: string[];
        elements?: ModelElement[];
        ambientOcclusion?: boolean;
      }
    >();
    const allTexturePaths = new Set<string>();

    // Récupérer les modèles (avec données pré-résolues si withModel)
    const models = await this.modelsService.findMultipleByPaths(
      Array.from(modelPaths),
      filter.minecraftVersion,
    );

    for (const model of models) {
      // Utiliser les données pré-résolues si disponibles et si withModel
      const textures = withModel && model.resolvedTextureMap
        ? model.resolvedTextureMap
        : model.textures || {};
      const resolvedTextures = model.resolvedTextures || [];
      const elements = withModel ? model.resolvedElements : undefined;

      modelDataMap.set(model.modelPath, {
        textures,
        resolvedTextures,
        elements: elements as ModelElement[] | undefined,
        ambientOcclusion: model.ambientOcclusion,
      });

      // Collecter les textures
      if (withModel && elements) {
        // Collecter depuis les éléments résolus
        for (const element of elements) {
          for (const face of Object.values(element.faces)) {
            const faceData = face as { texture?: string };
            if (faceData.texture && !faceData.texture.startsWith('#')) {
              allTexturePaths.add(faceData.texture);
            }
          }
        }
      }
      // Et depuis le mapping de textures
      for (const texPath of Object.values(textures)) {
        if (typeof texPath === 'string' && !texPath.startsWith('#')) {
          allTexturePaths.add(texPath);
        }
      }
      for (const texPath of resolvedTextures) {
        allTexturePaths.add(texPath);
      }
    }

    // Récupérer toutes les textures en une seule requête
    const textures = await this.texturesService.findMultiple(
      Array.from(allTexturePaths),
      filter.minecraftVersion,
    );

    // Créer des maps texturePath -> base64 et texturePath -> animatedGif
    const textureBase64Map = new Map<string, string>();
    const textureAnimatedGifMap = new Map<string, string>();
    for (const tex of textures) {
      textureBase64Map.set(tex.texturePath, tex.base64);
      if (tex.animated && tex.animatedGif) {
        textureAnimatedGifMap.set(tex.texturePath, tex.animatedGif);
      }
    }

    // Associer les données aux blocks
    const blocksWithIcons: BlockWithIcon[] = result.data.map((block) => {
      let icon: string | undefined;
      let blockTextures: Record<string, string> | undefined;
      let blockTexturesBase64: Record<string, string> | undefined;
      let animatedTextures: Record<string, string> | undefined;
      let hasAnimatedTextures = false;
      let blockModel: BlockModel3D | undefined;

      if (block.models && block.models.length > 0) {
        const modelData = modelDataMap.get(block.models[0]);

        if (modelData) {
          blockTextures = modelData.textures;

          // Construire le map des textures base64 pour ce bloc (seulement si demandé)
          if (withTextures) {
            blockTexturesBase64 = {};
            // Ajouter les textures du mapping
            for (const texPath of Object.values(modelData.textures)) {
              if (
                typeof texPath === 'string' &&
                !texPath.startsWith('#') &&
                textureBase64Map.has(texPath)
              ) {
                blockTexturesBase64[texPath] = textureBase64Map.get(texPath)!;
              }
            }
            // Si on a des éléments résolus, ajouter aussi leurs textures
            if (modelData.elements) {
              for (const element of modelData.elements) {
                for (const face of Object.values(element.faces)) {
                  if (
                    face.texture &&
                    !face.texture.startsWith('#') &&
                    textureBase64Map.has(face.texture)
                  ) {
                    blockTexturesBase64[face.texture] =
                      textureBase64Map.get(face.texture)!;
                  }
                }
              }
            }
          }

          // Inclure le modèle 3D si demandé
          if (withModel && modelData.elements && modelData.elements.length > 0) {
            blockModel = {
              modelPath: block.models[0],
              elements: modelData.elements,
              ambientOcclusion: modelData.ambientOcclusion ?? true,
            };
          }

          // Toujours collecter les GIFs animés si présents
          animatedTextures = {};
          for (const texPath of Object.values(modelData.textures)) {
            if (
              typeof texPath === 'string' &&
              !texPath.startsWith('#') &&
              textureAnimatedGifMap.has(texPath)
            ) {
              animatedTextures[texPath] = textureAnimatedGifMap.get(texPath)!;
              hasAnimatedTextures = true;
            }
          }

          // Icon fallback: première texture résolue
          if (modelData.resolvedTextures.length > 0) {
            icon = textureBase64Map.get(modelData.resolvedTextures[0]);
          } else {
            // Prendre la première texture disponible
            const firstPath = Object.values(modelData.textures).find(
              (t) => typeof t === 'string' && !t.startsWith('#'),
            );
            if (firstPath && textureBase64Map.has(firstPath)) {
              icon = textureBase64Map.get(firstPath);
            }
          }
        }
      }

      return {
        _id: block._id.toString(),
        registryName: block.registryName,
        namespace: block.namespace,
        blockId: block.blockId,
        displayName: block.displayName,
        mod: block.mod,
        icon,
        icon3d: block.icon3d,
        textures: blockTextures,
        texturesBase64: blockTexturesBase64,
        animatedTextures: hasAnimatedTextures ? animatedTextures : undefined,
        hasAnimatedTextures,
        model: blockModel,
      };
    });

    return {
      data: blocksWithIcons,
      total: result.total,
      page: result.page,
      limit: result.limit,
      pages: result.pages,
    };
  }
}
