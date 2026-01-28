<template>
  <div class="min-h-screen flex flex-col bg-[var(--color-mc-bg)]">
    <header class="sticky top-0 z-50 flex flex-col">
      <Navbar />
      <Breadcrumb />
    </header>
    <main class="flex-1 container mx-auto p-6">
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import Navbar from './components/layout/Navbar.vue'
import Breadcrumb from './components/layout/Breadcrumb.vue'
import { useAuthStore } from './stores/auth'

const authStore = useAuthStore()

onMounted(() => {
  authStore.fetchProfile()
})
</script>

<style>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
