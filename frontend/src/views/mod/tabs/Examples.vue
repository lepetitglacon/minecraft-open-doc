<template>
  <div class="examples-container">
    <div class="header">
      <h2>Community Examples</h2>
      <router-link 
        :to="{ name: 'CreateExample', params: { namespace } }" 
        class="minecraft-btn"
      >
        Create New Example
      </router-link>
    </div>

    <div v-if="isLoading" class="loading">Loading examples...</div>
    <div v-else-if="examples.length === 0" class="empty">
      <p>No examples yet. Be the first to create one!</p>
    </div>
    <div v-else class="examples-grid">
      <div v-for="example in examples" :key="example._id" class="example-card">
        <div class="thumbnail">
          <img v-if="example.thumbnailBase64" :src="example.thumbnailBase64" alt="Thumbnail" />
          <div v-else class="placeholder">No Preview</div>
        </div>
        <div class="info">
          <h3>{{ example.name }}</h3>
          <p class="desc" v-if="example.description">{{ example.description }}</p>
          <div class="meta">
            <span>{{ new Date(example.createdAt).toLocaleDateString() }}</span>
            <span class="block-count">{{ example.blocks.length }} blocks</span>
          </div>
          <button class="delete-btn" @click="deleteExample(example._id)">Delete</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import api from '../../../services/api';

const props = defineProps<{
  namespace: string;
}>();

interface ModExample {
  _id: string;
  name: string;
  description?: string;
  thumbnailBase64?: string;
  blocks: any[];
  createdAt: string;
}

const examples = ref<ModExample[]>([]);
const isLoading = ref(true);

const fetchExamples = async () => {
  try {
    const res = await api.get(`/examples/${props.namespace}`);
    examples.value = res.data;
  } catch (err) {
    console.error(err);
  } finally {
    isLoading.value = false;
  }
};

const deleteExample = async (id: string) => {
  if (!confirm('Are you sure you want to delete this example?')) return;
  try {
    await api.delete(`/examples/${id}`);
    await fetchExamples();
  } catch (err) {
    console.error(err);
  }
};

onMounted(fetchExamples);
</script>

<style scoped>
.examples-container {
  padding: 20px 0;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
}

.examples-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
}

.example-card {
  background-color: #2a2a2a;
  border: 2px solid #555;
  border-radius: 4px;
  overflow: hidden;
}

.thumbnail {
  height: 160px;
  background-color: #111;
  display: flex;
  align-items: center;
  justify-content: center;
  border-bottom: 2px solid #555;
}

.thumbnail img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.thumbnail .placeholder {
  color: #555;
  font-family: 'Minecraft', monospace;
}

.info {
  padding: 15px;
}

h3 {
  margin: 0 0 5px 0;
  color: #ffaa00;
  font-family: 'Minecraft', monospace;
}

.desc {
  color: #ccc;
  font-size: 0.9rem;
  margin-bottom: 10px;
}

.meta {
  display: flex;
  justify-content: space-between;
  font-size: 0.8rem;
  color: #888;
  margin-bottom: 10px;
}

.delete-btn {
  background: none;
  border: none;
  color: #ff5555;
  cursor: pointer;
  font-size: 0.8rem;
  padding: 0;
}

.delete-btn:hover {
  text-decoration: underline;
}

.loading, .empty {
  text-align: center;
  padding: 40px;
  color: #888;
}
</style>