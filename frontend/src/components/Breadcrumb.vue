<template>
  <nav class="breadcrumb">
    <ol>
      <li v-for="(crumb, index) in crumbs" :key="index">
        <router-link v-if="crumb.to" :to="crumb.to" class="breadcrumb-link">
          {{ crumb.label }}
        </router-link>
        <span v-else class="breadcrumb-current">{{ crumb.label }}</span>
        <span v-if="index < crumbs.length - 1" class="breadcrumb-separator">/</span>
      </li>
    </ol>
  </nav>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';

interface Crumb {
  label: string;
  to?: { name: string; params?: Record<string, string> };
}

const route = useRoute();

const crumbs = computed<Crumb[]>(() => {
  const result: Crumb[] = [
    { label: 'Home', to: { name: 'Home' } }
  ];

  const namespace = route.params.namespace as string | undefined;
  const blockId = route.params.blockId as string | undefined;

  if (namespace) {
    result.push({
      label: namespace.charAt(0).toUpperCase() + namespace.slice(1),
      to: blockId ? { name: 'ModBlocks', params: { namespace } } : undefined
    });
  }

  if (blockId) {
    result.push({
      label: blockId.replace(/_/g, ' ')
    });
  }

  return result;
});
</script>

<style scoped>
.breadcrumb {
  margin-bottom: 16px;
}

.breadcrumb ol {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  list-style: none;
  padding: 8px 12px;
  margin: 0;
  background-color: #2a2a2a;
  border: 2px solid #555;
  border-radius: 4px;
}

.breadcrumb li {
  display: flex;
  align-items: center;
  gap: 8px;
}

.breadcrumb-link {
  color: #5c9eff;
  text-decoration: none;
  font-family: 'Minecraft', monospace;
  font-size: 14px;
  transition: color 0.2s;
}

.breadcrumb-link:hover {
  color: #ffaa00;
  text-decoration: underline;
}

.breadcrumb-current {
  color: #ccc;
  font-family: 'Minecraft', monospace;
  font-size: 14px;
}

.breadcrumb-separator {
  color: #666;
  font-size: 12px;
}
</style>
