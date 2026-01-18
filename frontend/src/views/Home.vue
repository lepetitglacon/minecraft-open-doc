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
        <ModCard 
          v-for="mod in mods" 
          :key="mod._id" 
          :mod="mod"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useMods } from '../composables/useMods';
import ModCard from '../components/ModCard.vue';

const search = ref('');
const { mods, isLoading, error } = useMods({ search });
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