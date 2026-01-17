<template>
  <div class="home-container">
    <div class="hero">
      <h1 class="minecraft-title">Minecraft Open Guide</h1>
      <p class="minecraft-text">Your ultimate guide to Minecraft mods.</p>
    </div>

    <div class="content-wrapper">
      <div class="search-container">
        <input 
          v-model="search" 
          type="text" 
          placeholder="Search mods..." 
          class="search-input"
        />
      </div>

      <div v-if="isLoading" class="status-msg">Loading mods...</div>
      <div v-else-if="error" class="status-msg error">Error loading mods</div>
      <div v-else-if="mods.length === 0" class="status-msg">No mods found</div>
      
      <div v-else class="mods-grid">
        <router-link 
          v-for="mod in mods" 
          :key="mod._id" 
          :to="{ name: 'ModGuide', params: { namespace: mod.modId } }"
          class="mod-card"
        >
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
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useMods } from '../composables/useMods';

const search = ref('');
const { mods, isLoading, error } = useMods({ search });

const truncate = (text: string, length: number) => {
  if (text.length <= length) return text;
  return text.substring(0, length) + '...';
};
</script>

<style scoped>
.home-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px 20px;
  min-height: calc(100vh - 70px);
}

.hero {
  text-align: center;
  margin-bottom: 40px;
}

.content-wrapper {
  width: 100%;
  max-width: 1200px;
}

.search-container {
  margin-bottom: 30px;
  display: flex;
  justify-content: center;
}

.search-input {
  width: 100%;
  max-width: 600px;
  padding: 12px 20px;
  font-size: 1.2rem;
  font-family: 'Minecraft', sans-serif;
  background-color: #00000080;
  border: 2px solid #707070;
  color: white;
  outline: none;
}

.search-input:focus {
  border-color: #FFAA00;
  background-color: #000000aa;
}

.mods-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

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

.status-msg {
  text-align: center;
  font-size: 1.5rem;
  color: #aaa;
  margin-top: 40px;
}

.status-msg.error {
  color: #ff5555;
}
</style>