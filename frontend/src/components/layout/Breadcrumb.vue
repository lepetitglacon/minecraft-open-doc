<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { ChevronRight, Box } from 'lucide-vue-next';

interface Crumb {
  label: string;
  path?: string;
}

const route = useRoute();

const crumbs = computed<Crumb[]>(() => {
  const segments = route.path.split('/').filter(Boolean);
  if (segments.length === 0) return []; // Ne rien afficher sur la home
  
  const result: Crumb[] = [{ label: 'Home', path: '/' }];

  let currentPath = '';
  segments.forEach((segment, index) => {
    currentPath += '/' + segment;
    const isLast = index === segments.length - 1;
    result.push({
      label: segment.charAt(0).toUpperCase() + segment.slice(1), 
      path: isLast ? undefined : currentPath
    });
  });

  return result;
});
</script>

<template>
  <transition
    enter-active-class="transition duration-300 ease-out"
    enter-from-class="transform -translate-y-full opacity-0"
    enter-to-class="transform translate-y-0 opacity-100"
    leave-active-class="transition duration-200 ease-in"
    leave-from-class="transform translate-y-0 opacity-100"
    leave-to-class="transform -translate-y-full opacity-0"
  >
    <nav 
      v-if="crumbs.length > 1" 
      aria-label="Breadcrumb" 
      class="w-full bg-black/40 border-b border-white/5 backdrop-blur-md relative z-10"
    >
      <div class="container mx-auto px-6 py-1.5">
        <ol class="flex items-center gap-1.5">
          <li v-for="(crumb, index) in crumbs" :key="index" class="flex items-center">
            <template v-if="index > 0">
               <ChevronRight class="w-3.5 h-3.5 mx-1 text-gray-600" />
            </template>
            
            <router-link 
              v-if="crumb.path" 
              :to="crumb.path" 
              class="flex items-center gap-1 text-xs text-gray-500 hover:text-[var(--color-mc-link)] transition-colors"
            >
              <Box v-if="index === 0" class="w-3.5 h-3.5" />
              <span v-else>{{ crumb.label }}</span>
            </router-link>
            
            <span v-else class="text-xs font-medium text-gray-300">
              {{ crumb.label }}
            </span>
          </li>
        </ol>
      </div>
    </nav>
  </transition>
</template>