import { useQuery } from '@tanstack/vue-query';
import { computed, type Ref } from 'vue';
import { useApi } from './useApi';

export interface Mod {
  _id: string;
  modId: string;
  modVersion: string;
  minecraftVersion: string;
  displayName: string;
  description?: string;
  authors?: string[];
  logoFile?: string;
  logoBase64?: string;
  websiteUrl?: string;
  sourceUrl?: string;
  issueTrackerUrl?: string;
  license?: string;
  loaders?: string[];
}

interface ModsResponse {
  data: Mod[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

interface UseModsOptions {
  search?: Ref<string>;
  page?: Ref<number>;
  limit?: number;
}

export function useMods(options: UseModsOptions = {}) {
  const api = useApi();
  const { search, page, limit = 50 } = options;

  const queryKey = computed(() => [
    'mods',
    search?.value || '',
    page?.value || 1,
    limit,
  ]);

  const query = useQuery({
    queryKey,
    queryFn: async (): Promise<ModsResponse> => {
      const response = await api.get('/mods', {
        params: {
          search: search?.value || undefined,
          page: page?.value || 1,
          limit,
        },
      });
      return response.data;
    },
  });

  return {
    ...query,
    mods: computed(() => query.data.value?.data || []),
    total: computed(() => query.data.value?.total || 0),
    totalPages: computed(() => query.data.value?.pages || 1),
  };
}

export function useMod(modId: Ref<string>) {
  const api = useApi();

  return useQuery({
    queryKey: computed(() => ['mod', modId.value]),
    queryFn: async (): Promise<Mod> => {
      const { data } = await api.get(`/mods/${modId.value}`);
      return data;
    },
    enabled: computed(() => !!modId.value),
  });
}
