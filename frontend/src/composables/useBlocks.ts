import { useQuery } from '@tanstack/vue-query';
import { computed, ref, type Ref } from 'vue';
import api from '../services/api';
import { renderBlockIconsAsync } from '../services/blockIconRenderer';

interface Block {
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
  textures?: Record<string, string>;
  texturesBase64?: Record<string, string>;
  animatedTextures?: Record<string, string>; // GIFs animés
  hasAnimatedTextures?: boolean;
}

interface BlocksResponse {
  data: Block[];
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

// Cache des icônes rendues par blockId
const renderedIconsCache = new Map<string, string>();

export function useBlocks(options: UseBlocksOptions) {
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
        },
      });
      return response.data;
    },
    enabled: computed(() => !!namespace.value),
  });

  // Icônes rendues (générées de manière asynchrone)
  const renderedIcons = ref<Map<string, string>>(new Map());
  const isRenderingIcons = ref(false);

  // Quand les données changent, générer les icônes 3D
  const renderIcons = async () => {
    if (!query.data.value?.data) return;

    isRenderingIcons.value = true;

    const blocksToRender = query.data.value.data.filter((block) => {
      // Ne pas re-rendre si déjà en cache
      if (renderedIconsCache.has(block._id)) {
        return false;
      }
      return block.textures && block.texturesBase64;
    });

    if (blocksToRender.length > 0) {
      const icons = await renderBlockIconsAsync(blocksToRender);

      // Mettre à jour le cache global
      icons.forEach((icon, blockId) => {
        renderedIconsCache.set(blockId, icon);
      });
    }

    // Construire le map des icônes pour cette page
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
  const blocksWithRenderedIcons = computed(() => {
    if (!query.data.value?.data) return [];

    return query.data.value.data.map((block) => {
      // Pour les blocs avec textures animées, utiliser le premier GIF disponible
      let animatedIcon: string | undefined;
      if (block.hasAnimatedTextures && block.animatedTextures) {
        const firstGif = Object.values(block.animatedTextures)[0];
        if (firstGif) {
          animatedIcon = firstGif;
        }
      }

      return {
        ...block,
        renderedIcon: renderedIcons.value.get(block._id) || block.icon,
        animatedIcon, // GIF animé si disponible
      };
    });
  });

  return {
    // Query state
    data: query.data,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error,

    // Données transformées
    blocks: blocksWithRenderedIcons,
    total: computed(() => query.data.value?.total || 0),
    totalPages: computed(() => query.data.value?.pages || 1),

    // Rendu des icônes
    renderIcons,
    isRenderingIcons,
    renderedIcons,

    // Refetch
    refetch: query.refetch,
  };
}

export function useNamespaces() {
  return useQuery({
    queryKey: ['namespaces'],
    queryFn: async (): Promise<string[]> => {
      const response = await api.get('/blocks/namespaces');
      return response.data;
    },
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
}
