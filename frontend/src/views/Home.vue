<template>
  <div class="home-container">
    <h1 class="minecraft-title">Minecraft Open Guide</h1>
    <p class="minecraft-text">Your ultimate guide to Minecraft mods.</p>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'Home',
})
</script>

<style scoped>
.home-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: calc(100vh - 70px); /* Viewport height minus approximate navbar height */
  text-align: center;
}
</style>
