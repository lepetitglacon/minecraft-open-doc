<template>
  <div class="mod-card">
    <router-link :to="{ name: 'ModGuide', params: { namespace: mod.modId } }" class="mod-card-content">
      <div class="mod-logo-container">
        <img v-if="mod.logoBase64" :src="mod.logoBase64" :alt="mod.displayName" class="mod-logo" />
        <div v-else class="placeholder-logo">{{ mod.displayName.charAt(0) }}</div>
      </div>
      <div class="mod-info">
        <h3 class="mod-name">{{ mod.displayName }}</h3>
        <div class="mod-meta">
          <span class="mod-id">{{ mod.modId }}</span>
          <span class="mod-version">v{{ mod.modVersion }}</span>
        </div>
        <p class="mod-desc" v-if="mod.description">{{ truncate(mod.description, 100) }}</p>
      </div>
    </router-link>
    
    <div class="mod-actions">
      <Tooltip content="Blocks">
        <router-link 
          :to="{ name: 'ModBlocks', params: { namespace: mod.modId } }" 
          class="action-btn"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 16.5C21 16.88 20.79 17.21 20.47 17.38L12.57 21.82C12.41 21.94 12.21 22 12 22C11.79 22 11.59 21.94 11.43 21.82L3.53 17.38C3.21 17.21 3 16.88 3 16.5V7.5C3 7.12 3.21 6.79 3.53 6.62L11.43 2.18C11.59 2.06 11.79 2 12 2C12.21 2 12.41 2.06 12.57 2.18L20.47 6.62C20.79 6.79 21 7.12 21 7.5V16.5Z"/>
            <path d="M12 22V11"/>
            <path d="M12 11L20.66 6.13"/>
            <path d="M12 11L3.34 6.13"/>
          </svg>
        </router-link>
      </Tooltip>
      <Tooltip content="Examples">
        <router-link 
          :to="{ name: 'ModExamples', params: { namespace: mod.modId } }" 
          class="action-btn"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
            <path d="M6.5 2H20V22H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
          </svg>
        </router-link>
      </Tooltip>
    </div>
  </div>
</template>

<script setup lang="ts">
import { type Mod } from '../composables/useMods';
import Tooltip from './ui/Tooltip.vue';

defineProps<{
  mod: Mod
}>();

const truncate = (text: string, length: number) => {
  if (text.length <= length) return text;
  return text.substring(0, length) + '...';
};
</script>

<style scoped>
.mod-card {
  display: flex;
  flex-direction: column;
  background-color: #2c2c2c;
  border: 2px solid #000;
  box-shadow: inset 2px 2px #FFF2, inset -2px -2px #0004;
  transition: transform 0.2s, border-color 0.2s;
  overflow: hidden;
  height: 100%;
  color: white;
  text-decoration: none;
}

.mod-card-content {
  display: flex;
  flex-direction: column;
  flex: 1;
  text-decoration: none;
  color: inherit;
}

.mod-card:hover {
  transform: translateY(-2px);
  border-color: #FFAA00;
}

.mod-logo-container {
  width: 100%;
  height: 150px;
  background-color: #1a1a1a;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border-bottom: 2px solid #000;
}

.mod-logo {
  max-width: 80%;
  max-height: 80%;
  object-fit: contain;
  image-rendering: pixelated;
}

.placeholder-logo {
  font-size: 4rem;
  font-weight: bold;
  color: #555;
}

.mod-info {
  padding: 15px;
  flex: 1;
  display: flex;
  flex-direction: column;
}

.mod-name {
  font-size: 1.2rem;
  margin-bottom: 5px;
  color: #FFAA00;
  text-shadow: 2px 2px #000;
}

.mod-meta {
  display: flex;
  justify-content: space-between;
  font-size: 0.8rem;
  color: #aaa;
  margin-bottom: 10px;
  font-family: monospace;
}

.mod-desc {
  font-size: 0.9rem;
  color: #ddd;
  line-height: 1.4;
}

.mod-actions {
  display: flex;
  justify-content: flex-end;
  padding: 10px;
  gap: 10px;
  background-color: #222;
  border-top: 1px solid #000;
}

.action-btn {
  color: #aaa;
  transition: color 0.2s, transform 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 5px;
  border-radius: 4px;
}

.action-btn:hover {
  color: #FFAA00;
  transform: scale(1.1);
  background-color: #333;
}
</style>
