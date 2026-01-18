<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';

interface Crumb {
  label: string;
  path?: string;
}

const route = useRoute();

const crumbs = computed<Crumb[]>(() => {
  const segments = route.path.split('/').filter(Boolean);

  if (segments.length === 0) {
    return [{ label: 'Home' }];
  }

  const result: Crumb[] = [{ label: 'Home', path: '/' }];

  let currentPath = '';
  segments.forEach((segment, index) => {
    currentPath += '/' + segment;
    const isLast = index === segments.length - 1;
    result.push({
      label: segment,
      path: isLast ? undefined : currentPath
    });
  });

  return result;
});
</script>

<template>
  <nav class="breadcrumb">
    <ol>
      <li v-for="(crumb, index) in crumbs" :key="index">
        <router-link v-if="crumb.path" :to="crumb.path" class="breadcrumb-link">
          {{ crumb.label }}
        </router-link>
        <span v-else class="breadcrumb-current">{{ crumb.label }}</span>
        <span v-if="index < crumbs.length - 1" class="breadcrumb-separator">/</span>
      </li>
    </ol>
  </nav>
</template>

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
