<template>
  <div id="app">
    <Navbar />
    <main>
      <Breadcrumb />
      <router-view />
    </main>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import Navbar from './components/Navbar.vue'
import Breadcrumb from './components/Breadcrumb.vue'

export default defineComponent({
  name: 'App',
  components: {
    Navbar,
    Breadcrumb
  }
})
</script>

<style>
/* Global styles will be added to style.css */
main {
  padding: 20px;
}
</style>
