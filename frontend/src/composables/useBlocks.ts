import { useQuery } from '@tanstack/vue-query';
import { computed, ref, type Ref } from 'vue';
import { useApi } from './useApi';
import { renderBlockIconsAsync } from '../services/blockIconRenderer';

// Types pour la liste (léger)
export interface BlockListItem {
  _id: string;
  registryName: string;
  namespace: string;
  blockId: string;
  displayName?: string;
  icon?: string; // Texture de base en base64
  icon3d?: string; // Icône 3D pré-rendue par le backend
  renderedIcon?: string; // Icône 3D rendue côté client (fallback)
  animatedIcon?: string; // GIF animé si disponible
}

// Types pour le détail (complet)
export interface BlockDetail {
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
  icon?: string;
  icon3d?: string;
  blockstate?: unknown;
  models?: string[];
  textures?: Record<string, string>;
  texturesBase64?: Record<string, string>;
  animatedTextures?: Record<string, string>;
  hasAnimatedTextures?: boolean;
}

interface BlocksResponse {
  data: BlockListItem[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

interface UseBlocksOptions {
  namespace: Ref<string>;
  search?: Ref<string>;
  page?: Ref<number>;
  limit?: number;
}

// Cache des icônes 3D rendues
const renderedIconsCache = new Map<string, string>();

/**
 * Liste des blocs avec icônes 3D (léger)
 */
export function useBlocks(options: UseBlocksOptions) {
  const api = useApi();
  const { namespace, search, page, limit = 100 } = options;

  const queryKey = computed(() => [
    'blocks',
    namespace.value,
    search?.value || '',
    page?.value || 1,
    limit,
  ]);

  const query = useQuery({
    queryKey,
    queryFn: async (): Promise<BlocksResponse> => {
      const response = await api.get('/blocks', {
        params: {
          namespace: namespace.value,
          search: search?.value || undefined,
          page: page?.value || 1,
          limit,
          withIcons: 'true',
          withTextures: 'true', // Nécessaire pour le rendu 3D
        },
      });
      return response.data;
    },
    enabled: computed(() => !!namespace.value),
  });

  // Icônes 3D rendues
  const renderedIcons = ref<Map<string, string>>(new Map());
  const isRenderingIcons = ref(false);

  // Générer les icônes 3D quand les données arrivent
  const renderIcons = async () => {
    if (!query.data.value?.data) return;

    isRenderingIcons.value = true;

    const blocksToRender = query.data.value.data.filter((block: any) => {
      if (renderedIconsCache.has(block._id)) return false;
      return block.textures && block.texturesBase64;
    });

    if (blocksToRender.length > 0) {
      const icons = await renderBlockIconsAsync(blocksToRender);
      icons.forEach((icon, blockId) => {
        renderedIconsCache.set(blockId, icon);
      });
    }

    // Construire le map des icônes
    const iconsMap = new Map<string, string>();
    for (const block of query.data.value.data) {
      const cached = renderedIconsCache.get(block._id);
      if (cached) {
        iconsMap.set(block._id, cached);
      }
    }

    renderedIcons.value = iconsMap;
    isRenderingIcons.value = false;
  };

  // Blocs avec icônes rendues
  const blocks = computed<BlockListItem[]>(() => {
    if (!query.data.value?.data) return [];

    return query.data.value.data.map((block: any) => {
      // Icône animée (premier GIF disponible)
      let animatedIcon: string | undefined;
      if (block.hasAnimatedTextures && block.animatedTextures) {
        animatedIcon = Object.values(block.animatedTextures)[0] as string;
      }

      // Priorité: icon3d (backend) > renderedIcon (client) > icon (fallback)
      const renderedIcon = block.icon3d
        || renderedIcons.value.get(block._id)
        || block.icon;

      return {
        _id: block._id,
        registryName: block.registryName,
        namespace: block.namespace,
        blockId: block.blockId,
        displayName: block.displayName,
        icon: block.icon,
        icon3d: block.icon3d,
        renderedIcon,
        animatedIcon,
      };
    });
  });

  return {
    blocks,
    total: computed(() => query.data.value?.total || 0),
    totalPages: computed(() => query.data.value?.pages || 1),
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error,
    renderIcons,
    isRenderingIcons,
    refetch: query.refetch,
  };
}

/**
 * Détail d'un bloc (complet avec modèles et textures)
 * @param namespace - namespace du bloc (ex: "mekanism")
 * @param blockId - id du bloc (ex: "block_steel")
 */
export function useBlock(namespace: Ref<string | null>, blockId: Ref<string | null>) {
  const api = useApi();
  const query = useQuery({
    queryKey: computed(() => ['block', namespace.value, blockId.value]),
    queryFn: async (): Promise<BlockDetail> => {
      const response = await api.get(`/blocks/${namespace.value}/${blockId.value}`, {
        params: {
          withIcons: 'true',
        },
      });
      return response.data;
    },
    enabled: computed(() => !!namespace.value && !!blockId.value),
  });

  return {
    block: computed(() => query.data.value || null),
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

/**
 * Liste des namespaces disponibles
 */
export function useNamespaces() {
  const api = useApi();
  return useQuery({
    queryKey: ['namespaces'],
    queryFn: async (): Promise<string[]> => {
      const response = await api.get('/blocks/namespaces');
      return response.data;
    },
    staleTime: 1000 * 60 * 10,
  });
}
