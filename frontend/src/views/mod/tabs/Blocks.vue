<template>
  <div>
    <h1 class="minecraft-title">Mods</h1>
    <div v-if="loading">Loading...</div>
    <div v-if="error">{{ error }}</div>
    <ul v-if="namespaces && namespaces.length > 0" class="namespaces-list">
      <li v-for="ns in namespaces" :key="ns" class="namespace-item">
        <a @click.prevent="selectNamespace(ns)">{{ ns }}</a>
      </li>
    </ul>
    <p v-if="!loading && (!namespaces || namespaces.length === 0)">No mods found.</p>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';
import { useNamespaces } from '../../../composables/useBlocks.ts';

const router = useRouter();
const { data: namespaces, isLoading: loading, error } = useNamespaces();

const selectNamespace = (namespace: string) => {
  router.push({ name: 'ModDetail', params: { namespace } });
};
</script>

<style scoped>
.namespaces-list {
  list-style: none;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 15px;
}

.namespace-item a {
  display: block;
  padding: 20px;
  background-color: #707070;
  border: 2px solid #000;
  box-shadow: inset -2px -4px #0004, inset 2px 2px #FFF7;
  color: white;
  text-shadow: 2px 2px #0007;
  text-align: center;
  text-transform: uppercase;
}

.namespace-item a:hover {
  background-color: #7d7d7d;
}
</style>
