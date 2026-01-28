<template>
  <div class="flex flex-col items-center py-10 min-h-[80vh]">
    <div class="text-center mb-10">
      <h1 class="text-5xl text-white mb-2" style="text-shadow: 4px 4px #000;">Minecraft Open Doc</h1>
      <p class="text-xl text-gray-300" style="text-shadow: 2px 2px #000;">Your ultimate guide to Minecraft mods.</p>
    </div>

    <div class="w-full max-w-6xl px-4">
      <div class="mb-8 flex justify-center">
        <input 
          v-model="search" 
          type="text" 
          placeholder="Search everything... @ # "
          class="w-full max-w-2xl px-5 py-3 text-xl bg-black/50 border-2 border-[#707070] text-white focus:border-[var(--color-mc-link)] focus:bg-black/70 outline-none transition-colors font-[var(--font-minecraft)] placeholder:text-gray-600"
        />
      </div>

      <div v-if="isLoading" class="text-center text-2xl text-gray-400 mt-10">Loading mods...</div>
      <div v-else-if="error" class="text-center text-2xl text-red-500 mt-10">Error loading mods</div>
      <div v-else-if="mods.length === 0" class="text-center text-2xl text-gray-400 mt-10">No mods found</div>
      
      <div v-else class="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-5">
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
