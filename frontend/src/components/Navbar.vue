<template>
  <nav class="navbar">
    <div class="navbar-brand">
      <router-link to="/">Minecraft Open Guide</router-link>
    </div>
    <div class="navbar-links">
      <router-link to="/">Home</router-link>
      <router-link to="/upload" class="upload-link">Upload</router-link>
    </div>
  </nav>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'Navbar'
})
</script>

<style scoped>
.navbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #333;
  padding: 10px 20px;
  border-bottom: 4px solid #000;
  background-image: url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGAAAAAYCAYAAAAfG/f8AAAAIUlEQVR42u3BAQEAAACCIP+vbkhAAQAAAAAAAAAAAAAAAAAAAAAAAACeBnYqAAE/s/gPAAAAAElFTkSuQmCC');
  background-repeat: repeat-x;
  background-size: auto 100%;
}

.navbar-brand a,
.navbar-links a {
  color: white;
  text-decoration: none;
  font-size: 1.2rem;
  padding: 5px 10px;
  text-shadow: 2px 2px #333;
}

.navbar-links a {
  margin-left: 15px;
}

.navbar-brand a:hover,
.navbar-links a:hover,
.navbar-links a.router-link-exact-active {
  color: #FFAA00;
}

.upload-link {
  background-color: #4a4;
  border-radius: 4px;
  padding: 5px 12px !important;
}

.upload-link:hover {
  background-color: #5b5;
}
</style>
