<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useBlocks } from '../../composables/useBlocks.ts';
import { debounce } from 'lodash-es';

const route = useRoute();
const namespace = computed(() => route.params.namespace as string);

const searchInput = ref('');
const search = ref('');
const page = ref(1);
const sort = ref('registryName');
const order = ref<'asc' | 'desc'>('asc');

const {
  blocks,
  total,
  totalPages,
  isLoading,
  error,
} = useBlocks({
  namespace,
  search,
  page,
  limit: 100,
  sort,
  order,
});

// Debounce search
const handleSearch = debounce(() => {
  search.value = searchInput.value;
  page.value = 1;
}, 300);

// Sort handling
const toggleOrder = () => {
  order.value = order.value === 'asc' ? 'desc' : 'asc';
  page.value = 1;
};

watch(sort, () => {
  page.value = 1;
});

// Navigation
const nextPage = () => {
  if (page.value < totalPages.value) {
    page.value++;
  }
};

const prevPage = () => {
  if (page.value > 1) {
    page.value--;
  }
};

// Reset page quand namespace change
watch(namespace, () => {
  page.value = 1;
  searchInput.value = '';
  search.value = '';
});
</script>

<template>
  <div class="jei-container">
    <div class="jei-header">
      <input
        type="text"
        v-model="searchInput"
        placeholder="Search..."
        @input="handleSearch"
        class="jei-search"
      />
      
      <div class="jei-sort-controls">
        <select v-model="sort" class="jei-select">
          <option value="registryName">Name</option>
          <option value="type">Type</option>
        </select>
        <button @click="toggleOrder" class="jei-sort-btn" :title="order === 'asc' ? 'Ascending' : 'Descending'">
          {{ order === 'asc' ? 'AZ' : 'ZA' }}
        </button>
      </div>

      <span class="jei-count">
        <template v-if="isLoading">Loading...</template>
        <template v-else>{{ total }} blocks</template>
      </span>
    </div>

    <div v-if="error" class="jei-error">{{ error }}</div>

    <div class="jei-grid-container">
      <div v-if="blocks.length > 0" class="jei-grid">
        <router-link
          v-for="block in blocks"
          :key="block._id"
          :to="{ name: 'BlockDetail', params: { namespace, blockId: block.blockId } }"
          class="jei-slot"
          :class="{ 'jei-slot-animated': block.animatedIcon }"
          :title="block.displayName || block.blockId"
        >
          <!-- Icône animée (GIF) si disponible -->
          <template v-if="block.animatedIcon">
            <img
              :src="block.animatedIcon"
              :alt="block.blockId"
              class="jei-icon jei-icon-animated"
              loading="lazy"
            />
          </template>
          <!-- Icône statique (rendu 3D ou icon fallback) -->
          <template v-else-if="block.renderedIcon || block.icon">
            <img
              :src="block.renderedIcon || block.icon"
              :alt="block.blockId"
              class="jei-icon"
              loading="lazy"
            />
          </template>
          <!-- Placeholder si aucune icône -->
          <div v-else class="jei-icon-placeholder">
            <span>{{ block.blockId.charAt(0).toUpperCase() }}</span>
          </div>
        </router-link>
      </div>

      <p v-else-if="!isLoading" class="jei-empty">No blocks found.</p>
    </div>

    <div class="jei-footer" v-if="totalPages > 1">
      <button @click="prevPage" :disabled="page === 1" class="jei-nav-btn">&lt;</button>
      <span class="jei-page-info">{{ page }} / {{ totalPages }}</span>
      <button @click="nextPage" :disabled="page >= totalPages" class="jei-nav-btn">&gt;</button>
    </div>
  </div>
</template>

<style scoped>
.jei-container {
  background-color: #c6c6c6;
  border: 2px solid #373737;
  border-radius: 3px;
  padding: 8px;
  box-shadow:
    inset 2px 2px 0 #fff,
    inset -2px -2px 0 #555;
  display: flex;
  flex-direction: column;
  max-height: 80vh;
}

.jei-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
  padding-bottom: 8px;
  border-bottom: 2px solid #555;
  flex-shrink: 0;
}

.jei-search {
  flex: 1;
  padding: 4px 8px;
  border: 2px solid #373737;
  background-color: #fff;
  font-family: 'Minecraft', monospace;
  font-size: 14px;
  box-shadow: inset 1px 1px 0 #555;
}

.jei-search:focus {
  outline: none;
  border-color: #5c5cff;
}

.jei-sort-controls {
  display: flex;
  gap: 4px;
}

.jei-select {
  padding: 4px;
  border: 2px solid #373737;
  background-color: #fff;
  font-family: 'Minecraft', monospace;
  font-size: 12px;
  box-shadow: inset 1px 1px 0 #555;
  cursor: pointer;
}

.jei-sort-btn {
  padding: 4px 8px;
  border: 2px solid #373737;
  background-color: #c6c6c6;
  font-family: 'Minecraft', monospace;
  font-size: 12px;
  cursor: pointer;
  box-shadow:
    inset 1px 1px 0 #fff,
    inset -1px -1px 0 #555;
}

.jei-sort-btn:active {
  box-shadow:
    inset -1px -1px 0 #fff,
    inset 1px 1px 0 #555;
}

.jei-count {
  color: #373737;
  font-size: 12px;
  white-space: nowrap;
}

.jei-error {
  text-align: center;
  padding: 20px;
  color: #aa0000;
}

.jei-grid-container {
  flex: 1;
  overflow-y: auto;
  min-height: 200px;
}

.jei-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(36px, 36px));
  gap: 2px;
  background-color: #8b8b8b;
  padding: 4px;
  border: 2px solid #373737;
  box-shadow: inset 1px 1px 0 #555;
}

.jei-slot {
  width: 36px;
  height: 36px;
  background-color: #8b8b8b;
  border: 1px solid #555;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background-color 0.1s;
  overflow: hidden;
  text-decoration: none;
}

.jei-slot:hover {
  background-color: #aaa;
  border-color: #5c5cff;
}

a.jei-slot {
  color: inherit;
}

.jei-icon {
  width: 32px;
  height: 32px;
  image-rendering: pixelated;
  image-rendering: crisp-edges;
  object-fit: contain;
}

.jei-icon-animated {
  /* Les GIFs animés s'affichent directement */
}

.jei-slot-animated {
  /* Indicateur visuel pour les textures animées */
  position: relative;
}

.jei-slot-animated::after {
  content: '';
  position: absolute;
  bottom: 2px;
  right: 2px;
  width: 6px;
  height: 6px;
  background-color: #5c5cff;
  border-radius: 50%;
  box-shadow: 0 0 3px #5c5cff;
}

.jei-icon-placeholder {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #555;
  color: #aaa;
  font-size: 14px;
  font-weight: bold;
}

.jei-empty {
  text-align: center;
  padding: 40px;
  color: #373737;
}

.jei-footer {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
  padding-top: 8px;
  border-top: 2px solid #555;
  flex-shrink: 0;
}

.jei-nav-btn {
  width: 24px;
  height: 24px;
  background-color: #c6c6c6;
  border: 2px solid #373737;
  box-shadow:
    inset 1px 1px 0 #fff,
    inset -1px -1px 0 #555;
  cursor: pointer;
  font-weight: bold;
  color: #373737;
}

.jei-nav-btn:hover:not(:disabled) {
  background-color: #ddd;
}

.jei-nav-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.jei-nav-btn:active:not(:disabled) {
  box-shadow:
    inset -1px -1px 0 #fff,
    inset 1px 1px 0 #555;
}

.jei-page-info {
  color: #373737;
  font-size: 12px;
  min-width: 60px;
  text-align: center;
}
</style>
