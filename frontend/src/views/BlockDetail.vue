<template>
  <div class="block-detail">
    <Breadcrumb />

    <div v-if="isLoading" class="loading">Loading...</div>
    <div v-else-if="error" class="error">{{ error }}</div>
    <div v-else-if="block" class="block-content">
      <!-- En-tête du bloc -->
      <div class="block-header">
        <div class="block-icon-large">
          <img
            v-if="block.animatedIcon"
            :src="block.animatedIcon"
            :alt="block.blockId"
            class="block-image animated"
          />
          <img
            v-else-if="block.renderedIcon"
            :src="block.renderedIcon"
            :alt="block.blockId"
            class="block-image"
          />
          <div v-else class="block-placeholder">
            {{ block.blockId.charAt(0).toUpperCase() }}
          </div>
        </div>
        <div class="block-info">
          <h1 class="block-title">{{ block.displayName || block.blockId }}</h1>
          <p class="block-registry">{{ block.registryName }}</p>
          <div class="block-tags">
            <span class="tag tag-namespace">{{ block.namespace }}</span>
            <span v-if="block.hasAnimatedTextures" class="tag tag-animated">Animated</span>
          </div>
        </div>
      </div>

      <!-- Section Crafting -->
      <div class="section">
        <h2 class="section-title">Crafting Recipe</h2>
        <div v-if="recipes.length > 0" class="recipes-list">
          <div v-for="(recipe, index) in recipes" :key="index" class="recipe-card">
            <CraftingGrid :recipe="recipe" :textures="allTextures" />
          </div>
        </div>
        <div v-else class="no-recipes">
          <p>No crafting recipe found for this block.</p>
          <p class="hint">This block may be obtained through other means (mining, drops, etc.)</p>
        </div>
      </div>

      <!-- Section Textures -->
      <div class="section">
        <h2 class="section-title">Textures</h2>
        <div class="textures-grid">
          <div
            v-for="(base64, path) in block.texturesBase64"
            :key="path"
            class="texture-item"
          >
            <img :src="block.animatedTextures?.[path] || base64" :alt="path" class="texture-preview" />
            <span class="texture-path">{{ getTextureName(path) }}</span>
          </div>
        </div>
      </div>

      <!-- Section Infos -->
      <div class="section">
        <h2 class="section-title">Information</h2>
        <table class="info-table">
          <tr>
            <td>Registry Name</td>
            <td><code>{{ block.registryName }}</code></td>
          </tr>
          <tr>
            <td>Namespace</td>
            <td>{{ block.namespace }}</td>
          </tr>
          <tr>
            <td>Block ID</td>
            <td><code>{{ block.blockId }}</code></td>
          </tr>
          <tr>
            <td>Mod Version</td>
            <td>{{ block.mod.modVersion }}</td>
          </tr>
          <tr>
            <td>Minecraft Version</td>
            <td>{{ block.mod.minecraftVersion }}</td>
          </tr>
        </table>
      </div>
    </div>
    <div v-else class="not-found">Block not found</div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import Breadcrumb from '../components/Breadcrumb.vue';
import CraftingGrid from '../components/CraftingGrid.vue';
import api from '../services/api';
import { renderBlockIcon } from '../services/blockIconRenderer';

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
  textures?: Record<string, string>;
  texturesBase64?: Record<string, string>;
  animatedTextures?: Record<string, string>;
  hasAnimatedTextures?: boolean;
}

interface Recipe {
  type: string;
  pattern?: string[];
  key?: Record<string, { item?: string; tag?: string }>;
  ingredients?: Array<{ item?: string; tag?: string } | Array<{ item?: string; tag?: string }>>;
  result: { item: string; count?: number } | string;
}

const route = useRoute();
const namespace = computed(() => route.params.namespace as string);
const blockId = computed(() => route.params.blockId as string);

const block = ref<Block | null>(null);
const recipes = ref<Recipe[]>([]);
const allTextures = ref<Record<string, string>>({});
const isLoading = ref(true);
const error = ref<string | null>(null);
const renderedIcon = ref<string | null>(null);
const animatedIcon = ref<string | null>(null);

const blockWithIcons = computed(() => {
  if (!block.value) return null;
  return {
    ...block.value,
    renderedIcon: renderedIcon.value,
    animatedIcon: animatedIcon.value,
  };
});

const getTextureName = (path: string) => {
  const parts = path.split('/');
  return parts[parts.length - 1];
};

const fetchBlock = async () => {
  isLoading.value = true;
  error.value = null;

  try {
    // Récupérer les détails du bloc
    const response = await api.get(`/blocks/${namespace.value}/${blockId.value}`, {
      params: { withIcons: 'true' }
    });
    block.value = response.data;

    // Générer l'icône rendue
    if (block.value?.textures && block.value?.texturesBase64) {
      const icon = await renderBlockIcon(
        block.value._id,
        block.value.textures,
        block.value.texturesBase64
      );
      if (icon) {
        renderedIcon.value = icon;
      }

      // Icône animée si disponible
      if (block.value.hasAnimatedTextures && block.value.animatedTextures) {
        animatedIcon.value = Object.values(block.value.animatedTextures)[0] || null;
      }
    }

    // Récupérer les recettes
    try {
      const recipesResponse = await api.get(`/recipes/${namespace.value}/${blockId.value}`);
      recipes.value = recipesResponse.data || [];
    } catch {
      // Pas de recettes trouvées
      recipes.value = [];
    }

    // Récupérer toutes les textures pour le crafting grid
    if (recipes.value.length > 0) {
      const textureResponse = await api.get(`/textures/by-namespace/${namespace.value}`);
      // On utilisera les textures du bloc pour l'instant
    }
  } catch (err: any) {
    error.value = err.message || 'Failed to load block';
  } finally {
    isLoading.value = false;
  }
};

watch([namespace, blockId], fetchBlock, { immediate: true });
</script>

<style scoped>
.block-detail {
  max-width: 900px;
  margin: 0 auto;
}

.loading, .error, .not-found {
  text-align: center;
  padding: 40px;
  color: #aaa;
}

.error {
  color: #ff6b6b;
}

.block-content {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* Header */
.block-header {
  display: flex;
  gap: 24px;
  align-items: flex-start;
  padding: 20px;
  background-color: #2a2a2a;
  border: 2px solid #555;
  border-radius: 4px;
}

.block-icon-large {
  width: 96px;
  height: 96px;
  background-color: #8b8b8b;
  border: 2px solid #555;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.block-image {
  width: 80px;
  height: 80px;
  image-rendering: pixelated;
  object-fit: contain;
}

.block-image.animated {
  /* GIF animé */
}

.block-placeholder {
  width: 80px;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #555;
  color: #aaa;
  font-size: 32px;
  font-weight: bold;
}

.block-info {
  flex: 1;
}

.block-title {
  margin: 0 0 8px 0;
  font-family: 'Minecraft', monospace;
  font-size: 24px;
  color: #fff;
}

.block-registry {
  margin: 0 0 12px 0;
  color: #888;
  font-family: monospace;
  font-size: 14px;
}

.block-tags {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.tag {
  padding: 4px 8px;
  font-size: 12px;
  font-family: 'Minecraft', monospace;
  border-radius: 3px;
}

.tag-namespace {
  background-color: #3a5a3a;
  color: #8f8;
}

.tag-animated {
  background-color: #3a3a5a;
  color: #88f;
}

/* Sections */
.section {
  background-color: #2a2a2a;
  border: 2px solid #555;
  border-radius: 4px;
  padding: 16px;
}

.section-title {
  margin: 0 0 16px 0;
  font-family: 'Minecraft', monospace;
  font-size: 18px;
  color: #ffaa00;
  border-bottom: 1px solid #555;
  padding-bottom: 8px;
}

/* Recipes */
.recipes-list {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}

.recipe-card {
  background-color: #1a1a1a;
  border: 1px solid #444;
  border-radius: 4px;
  padding: 16px;
}

.no-recipes {
  text-align: center;
  padding: 20px;
  color: #888;
}

.no-recipes .hint {
  font-size: 12px;
  color: #666;
  margin-top: 8px;
}

/* Textures */
.textures-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 12px;
}

.texture-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 12px;
  background-color: #1a1a1a;
  border: 1px solid #444;
  border-radius: 4px;
}

.texture-preview {
  width: 64px;
  height: 64px;
  image-rendering: pixelated;
  object-fit: contain;
  background-color: #8b8b8b;
}

.texture-path {
  font-size: 11px;
  color: #888;
  text-align: center;
  word-break: break-all;
}

/* Info table */
.info-table {
  width: 100%;
  border-collapse: collapse;
}

.info-table td {
  padding: 8px 12px;
  border-bottom: 1px solid #444;
}

.info-table tr:last-child td {
  border-bottom: none;
}

.info-table td:first-child {
  color: #888;
  width: 150px;
}

.info-table td:last-child {
  color: #fff;
}

.info-table code {
  background-color: #1a1a1a;
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 13px;
}
</style>
