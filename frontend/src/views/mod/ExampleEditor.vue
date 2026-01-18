<template>
  <div class="editor-layout">
    <div class="sidebar">
      <div class="sidebar-header">
        <h3>Block Palette</h3>
        <input 
          v-model="search" 
          placeholder="Search blocks..." 
          class="search-input"
        />
      </div>
      
      <div class="blocks-list" v-if="!isLoading">
        <div 
          v-for="block in blocks" 
          :key="block._id"
          class="block-item"
          :class="{ active: selectedBlock?._id === block._id }"
          @click="selectBlock(block)"
          :title="block.displayName"
        >
          <img 
            v-if="block.renderedIcon" 
            :src="block.renderedIcon" 
            class="block-icon" 
            loading="lazy"
          />
          <div v-else class="block-placeholder">{{ block.blockId[0] }}</div>
          <span class="block-name">{{ block.blockId }}</span>
        </div>
      </div>
      <div v-else class="loading">Loading blocks...</div>

      <div class="sidebar-footer">
        <router-link :to="{ name: 'ModExamples', params: { namespace } }" class="btn btn-cancel">
          Cancel
        </router-link>
        <button class="btn btn-save" @click="openSaveDialog" :disabled="placedBlocks.length === 0">
          Save Scene
        </button>
      </div>
    </div>

    <div class="viewport" ref="viewportRef">
      <div class="controls-hint">
        Left Click: Place | Right Click: Remove | Drag: Rotate | Scroll: Zoom
      </div>
    </div>

    <!-- Save Dialog -->
    <div v-if="showSaveDialog" class="dialog-overlay">
      <div class="dialog">
        <h3>Save Example</h3>
        <input v-model="sceneName" placeholder="Example Name" class="dialog-input" />
        <textarea v-model="sceneDescription" placeholder="Description (optional)" class="dialog-input"></textarea>
        <div class="dialog-actions">
          <button @click="showSaveDialog = false" class="btn btn-cancel">Cancel</button>
          <button @click="saveScene" class="btn btn-save" :disabled="!sceneName">Save</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, computed } from 'vue';
import { useBlocks } from '../../composables/useBlocks';
import { SceneRenderer, BlockData } from './SceneRenderer';
import { useApi } from '../../composables/useApi';
import { useRouter } from 'vue-router';

const api = useApi();

const props = defineProps<{
  namespace: string;
}>();

const router = useRouter();

// Sidebar & Data
const search = ref('');
const page = ref(1);
const { blocks, isLoading } = useBlocks({
  namespace: computed(() => props.namespace),
  search,
  page,
  limit: 200,
  withTextures: false, // Don't load all textures at once
});

// 3D Scene
const viewportRef = ref<HTMLElement | null>(null);
let renderer: SceneRenderer | null = null;
const selectedBlock = ref<any>(null);

const placedBlocks = ref<Array<{x: number, y: number, z: number, blockId: string}>>([]);

const selectBlock = (block: any) => {
  selectedBlock.value = block;
  if (renderer) {
    renderer.selectBlock({
      _id: block._id,
      blockId: block.blockId,
      textures: block.textures,
      texturesBase64: block.texturesBase64
    });
  }
};

// Save Logic
const showSaveDialog = ref(false);
const sceneName = ref('');
const sceneDescription = ref('');

const openSaveDialog = () => {
  showSaveDialog.value = true;
};

const saveScene = async () => {
  if (!renderer) return;
  
  const thumbnail = renderer.getThumbnail();
  
  const payload = {
    name: sceneName.value,
    namespace: props.namespace,
    description: sceneDescription.value,
    blocks: placedBlocks.value,
    thumbnailBase64: thumbnail,
  };

  try {
    await api.post('/examples', payload);
    router.push({ name: 'ModExamples', params: { namespace: props.namespace } });
  } catch (err) {
    alert('Failed to save scene');
    console.error(err);
  }
};

// Lifecycle
onMounted(() => {
  if (viewportRef.value) {
    renderer = new SceneRenderer(viewportRef.value);
    
    renderer.onBlockPlaced = (pos, blockId) => {
      placedBlocks.value.push({ x: pos.x, y: pos.y, z: pos.z, blockId });
    };
    
    renderer.onBlockRemoved = (pos) => {
      const idx = placedBlocks.value.findIndex(b => b.x === pos.x && b.y === pos.y && b.z === pos.z);
      if (idx !== -1) placedBlocks.value.splice(idx, 1);
    };
  }
});

onUnmounted(() => {
  if (renderer) {
    renderer.dispose();
  }
});
</script>

<style scoped>
.editor-layout {
  display: flex;
  height: calc(100vh - 70px); /* Adjust based on navbar */
  overflow: hidden;
}

.sidebar {
  width: 300px;
  background-color: #2a2a2a;
  border-right: 2px solid #000;
  display: flex;
  flex-direction: column;
}

.sidebar-header {
  padding: 15px;
  border-bottom: 2px solid #444;
}

.search-input {
  width: 100%;
  padding: 8px;
  margin-top: 10px;
  background-color: #111;
  border: 1px solid #555;
  color: white;
  font-family: 'Minecraft', monospace;
}

.blocks-list {
  flex: 1;
  overflow-y: auto;
  padding: 10px;
}

.block-item {
  display: flex;
  align-items: center;
  padding: 8px;
  cursor: pointer;
  border: 1px solid transparent;
  margin-bottom: 4px;
}

.block-item:hover {
  background-color: #333;
}

.block-item.active {
  background-color: #444;
  border-color: #FFAA00;
}

.block-icon {
  width: 32px;
  height: 32px;
  margin-right: 10px;
  image-rendering: pixelated;
}

.block-placeholder {
  width: 32px;
  height: 32px;
  background: #555;
  margin-right: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
}

.block-name {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 0.9rem;
}

.sidebar-footer {
  padding: 15px;
  border-top: 2px solid #444;
  display: flex;
  justify-content: space-between;
}

.viewport {
  flex: 1;
  position: relative;
  background-color: #1a1a2e;
}

.controls-hint {
  position: absolute;
  top: 10px;
  left: 10px;
  background-color: #00000088;
  padding: 5px 10px;
  color: #fff;
  font-size: 0.8rem;
  pointer-events: none;
  user-select: none;
}

.btn {
  padding: 8px 16px;
  font-family: 'Minecraft', monospace;
  cursor: pointer;
  border: 2px solid #000;
  color: white;
}

.btn-save {
  background-color: #4a4;
}

.btn-save:hover {
  background-color: #5b5;
}

.btn-save:disabled {
  background-color: #333;
  color: #777;
  cursor: not-allowed;
}

.btn-cancel {
  background-color: #a44;
  text-decoration: none;
  display: inline-block;
  text-align: center;
}

.btn-cancel:hover {
  background-color: #b55;
}

/* Dialog */
.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #000000bb;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.dialog {
  background-color: #333;
  border: 4px solid #000;
  padding: 20px;
  width: 400px;
  color: white;
}

.dialog h3 {
  margin-top: 0;
  color: #FFAA00;
}

.dialog-input {
  width: 100%;
  padding: 8px;
  margin-bottom: 10px;
  background-color: #111;
  border: 1px solid #555;
  color: white;
  font-family: 'Minecraft', monospace;
}

textarea.dialog-input {
  height: 80px;
  resize: vertical;
}

.dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style>