<template>
  <div>
    <h1 class="minecraft-title">{{ namespace }}</h1>
    <nav class="mod-nav">
      <router-link :to="{ name: 'ModGuide', params: { namespace } }">Guide</router-link>
      <router-link :to="{ name: 'ModBlocks', params: { namespace } }">Blocks</router-link>
      <router-link :to="{ name: 'ModExamples', params: { namespace } }">Examples</router-link>
    </nav>
    <div class="mod-content">
      <router-view />
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'ModDetail',
  props: {
    namespace: {
      type: String,
      required: true
    }
  }
});
</script>

<style scoped>
.mod-nav {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
  border-bottom: 2px solid #555;
  padding-bottom: 10px;
}

.mod-nav a {
  padding: 10px 15px;
  color: white;
  text-decoration: none;
  font-family: 'Minecraft', sans-serif;
  font-size: 1.1rem;
  border: 2px solid transparent;
}

.mod-nav a.router-link-exact-active {
  border-color: #FFAA00;
  background-color: #555;
}

.mod-content {
  padding: 20px 0;
}
</style>
