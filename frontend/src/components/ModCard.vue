<template>
  <div class="group flex flex-col bg-[#2c2c2c] border-2 border-black shadow-[inset_2px_2px_#FFF2,inset_-2px_-2px_#0004] hover:-translate-y-0.5 hover:border-[var(--color-mc-link)] transition-all duration-200 overflow-hidden h-full text-white decoration-0">
    <router-link :to="{ name: 'ModGuide', params: { namespace: mod.modId } }" class="flex flex-col flex-1 text-inherit decoration-0">
      <div class="w-full h-[150px] bg-[#1a1a1a] flex items-center justify-center overflow-hidden border-b-2 border-black">
        <img v-if="mod.logoBase64" :src="mod.logoBase64" :alt="mod.displayName" class="max-w-[80%] max-h-[80%] object-contain pixelated" />
        <div v-else class="text-6xl font-bold text-[#555]">{{ mod.displayName.charAt(0) }}</div>
      </div>
      <div class="p-4 flex-1 flex flex-col">
        <h3 class="text-xl mb-1 text-[var(--color-mc-link)] drop-shadow-md">{{ mod.displayName }}</h3>
        <div class="flex justify-between text-xs text-gray-400 mb-2 font-mono">
          <span>{{ mod.modId }}</span>
          <span>v{{ mod.modVersion }}</span>
        </div>
        <p class="text-sm text-gray-300 leading-relaxed" v-if="mod.description">{{ truncate(mod.description, 100) }}</p>
      </div>
    </router-link>
    
    <div class="flex justify-end p-2 gap-2 bg-[#222] border-t border-black">
      <Tooltip content="Blocks">
        <router-link 
          :to="{ name: 'ModBlocks', params: { namespace: mod.modId } }" 
          class="flex items-center justify-center p-1.5 rounded text-gray-400 hover:text-[var(--color-mc-link)] hover:scale-110 hover:bg-[#333] transition-all"
        >
          <Box class="w-5 h-5" />
        </router-link>
      </Tooltip>
      <Tooltip content="Examples">
        <router-link 
          :to="{ name: 'ModExamples', params: { namespace: mod.modId } }" 
          class="flex items-center justify-center p-1.5 rounded text-gray-400 hover:text-[var(--color-mc-link)] hover:scale-110 hover:bg-[#333] transition-all"
        >
          <BookOpen class="w-5 h-5" />
        </router-link>
      </Tooltip>
    </div>
  </div>
</template>

<script setup lang="ts">
import { type Mod } from '../composables/useMods';
import Tooltip from './ui/Tooltip.vue';
import { Box, BookOpen } from 'lucide-vue-next';

defineProps<{
  mod: Mod
}>();

const truncate = (text: string, length: number) => {
  if (text.length <= length) return text;
  return text.substring(0, length) + '...';
};
</script>