<template>
  <div class="flex flex-col gap-6">
    <!-- Header Section -->
    <div v-if="isLoading" class="p-8 text-center text-gray-400">
      Loading mod details...
    </div>
    <div v-else-if="error" class="p-8 text-center text-red-400">
      Failed to load mod details.
    </div>
    <div v-else-if="mod" class="minecraft-panel p-6 bg-[#2c2c2c]">
      <div class="flex flex-col md:flex-row gap-6">
        <!-- Image (Left) -->
        <div class="flex-shrink-0 w-full md:w-48 h-48 bg-black/30 border border-white/10 flex items-center justify-center rounded overflow-hidden">
          <img 
            v-if="mod.logoBase64" 
            :src="mod.logoBase64" 
            :alt="mod.displayName" 
            class="max-w-full max-h-full object-contain pixelated"
          />
          <div v-else class="text-6xl font-bold text-gray-700 select-none">
            {{ mod.displayName?.charAt(0) || '?' }}
          </div>
        </div>

        <!-- Info (Right) -->
        <div class="flex-1 min-w-0 flex flex-col gap-4">
           <!-- Title Row -->
           <div class="border-b border-white/10 pb-4">
              <h1 class="text-4xl font-bold text-white mb-2 font-[var(--font-minecraft)] tracking-wide shadow-black drop-shadow-md">
                {{ mod.displayName }}
              </h1>
              <div class="flex flex-wrap gap-3 items-center text-sm">
                 <span class="px-2 py-0.5 bg-[var(--color-mc-link)] text-black rounded font-mono font-bold">{{ mod.modId }}</span>
                 <span class="px-2 py-0.5 bg-[#4a4a4a] text-white rounded font-mono">v{{ mod.modVersion }}</span>
                 <span class="px-2 py-0.5 bg-[#4a4a4a] text-white rounded font-mono">MC {{ mod.minecraftVersion }}</span>
                 
                 <!-- Mock Modloader (if missing) -->
                 <span v-if="mod.loaders && mod.loaders.length" class="flex gap-2">
                    <span v-for="loader in mod.loaders" :key="loader" class="px-2 py-0.5 bg-orange-700 text-white rounded font-mono capitalize">{{ loader }}</span>
                 </span>
                 <span v-else class="px-2 py-0.5 bg-orange-700 text-white rounded font-mono capitalize">Forge/Fabric</span>
              </div>
           </div>

           <!-- Description & Meta -->
           <div class="flex flex-col gap-3">
              <p v-if="mod.description" class="text-gray-300 leading-relaxed text-sm line-clamp-2">
                {{ mod.description }}
              </p>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2 text-sm mt-auto">
                 <div class="flex gap-2">
                    <span class="text-gray-500 font-bold">Authors:</span>
                    <span class="text-gray-300">{{ mod.authors?.join(', ') || 'Unknown' }}</span>
                 </div>
                 
                 <!-- Links (Mocked if missing) -->
                 <div class="flex gap-4">
                    <a v-if="mod.websiteUrl" :href="mod.websiteUrl" target="_blank" class="text-[var(--color-mc-link)] hover:underline flex items-center gap-1">
                       Wiki/Web
                    </a>
                    <a v-else href="#" class="text-gray-600 cursor-not-allowed flex items-center gap-1" title="Not available">
                       Wiki
                    </a>

                    <a v-if="mod.sourceUrl" :href="mod.sourceUrl" target="_blank" class="text-[var(--color-mc-link)] hover:underline flex items-center gap-1">
                       Source
                    </a>
                    <a v-else href="#" class="text-gray-600 cursor-not-allowed flex items-center gap-1" title="Not available">
                       Source
                    </a>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>

    <!-- Navigation Tabs -->
    <nav class="flex gap-1 border-b-2 border-white/20 px-2">
      <router-link 
        :to="{ name: 'ModGuide', params: { namespace } }" 
        class="px-6 py-3 font-[var(--font-minecraft)] text-gray-400 hover:text-white hover:bg-white/5 rounded-t-lg transition-colors border-b-2 border-transparent hover:border-white/20"
        active-class="!text-[var(--color-mc-link)] !border-[var(--color-mc-link)] bg-white/5"
      >
        Guide
      </router-link>
      <router-link 
        :to="{ name: 'ModBlocks', params: { namespace } }" 
        class="px-6 py-3 font-[var(--font-minecraft)] text-gray-400 hover:text-white hover:bg-white/5 rounded-t-lg transition-colors border-b-2 border-transparent hover:border-white/20"
        active-class="!text-[var(--color-mc-link)] !border-[var(--color-mc-link)] bg-white/5"
      >
        Blocks
      </router-link>
      <router-link 
        :to="{ name: 'ModExamples', params: { namespace } }" 
        class="px-6 py-3 font-[var(--font-minecraft)] text-gray-400 hover:text-white hover:bg-white/5 rounded-t-lg transition-colors border-b-2 border-transparent hover:border-white/20"
        active-class="!text-[var(--color-mc-link)] !border-[var(--color-mc-link)] bg-white/5"
      >
        Examples
      </router-link>
    </nav>

    <!-- Sub-View Content -->
    <div class="min-h-[400px]">
      <router-view />
    </div>
  </div>
</template>

<script setup lang="ts">
import { toRef } from 'vue';
import { useMod } from '../../composables/useMods';

const props = defineProps<{
  namespace: string
}>();

const modId = toRef(props, 'namespace');
const { data: mod, isLoading, error } = useMod(modId);
</script>

<style scoped>
.minecraft-panel {
  box-shadow: inset 2px 2px 0px 0px rgba(255, 255, 255, 0.1), inset -2px -2px 0px 0px rgba(0, 0, 0, 0.2);
}
</style>