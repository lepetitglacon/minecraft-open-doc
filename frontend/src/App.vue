<template>
  <div id="app">
    <Navbar />
    <main>
      <router-view />
    </main>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import Navbar from './components/Navbar.vue'

export default defineComponent({
  name: 'App',
  components: {
    Navbar
  }
})
</script>

<style>
/* Global styles will be added to style.css */
main {
  padding: 20px;
}
</style>
