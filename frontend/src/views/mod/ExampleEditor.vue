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
        <div class="sort-controls">
          <select v-model="sort" class="sort-select">
            <option value="registryName">Name</option>
            <option value="type">Type</option>
          </select>
          <button @click="toggleOrder" class="sort-btn" :title="order === 'asc' ? 'Ascending' : 'Descending'">
            {{ order === 'asc' ? 'AZ' : 'ZA' }}
          </button>
        </div>
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
        <button class="btn btn-save" @click="openSaveDialog" >
          Save Scene
        </button>
      </div>
    </div>

    <div class="viewport-container">
      <div class="viewport-wrapper">
         <div 
           class="viewport" 
           ref="viewportRef"
         ></div>
         
         <!-- Overlay Controls -->
         <div class="controls-overlay">
            <div class="controls-hint">
               Left Click: Place<br>
               Right Click: Remove<br>
               Drag: Rotate<br>
               Scroll: Zoom
            </div>

            <div class="viewport-tools">
              <!-- Import Button -->
              <div 
                class="tool-btn import-btn"
                :class="{ 'window-drag': isWindowDragging, 'drag-over': isButtonDragOver }"
                @click="triggerFileInput"
                @drop.prevent="handleButtonDrop"
                @dragover.prevent="isButtonDragOver = true"
                @dragleave.prevent="isButtonDragOver = false"
                title="Import GLTF Scene"
              >
                 <Download class="w-5 h-5" />
                 <span class="label">Import</span>
                 <input  
                    type="file" 
                    ref="fileInputRef" 
                    class="hidden" 
                    accept=".gltf,.glb" 
                    @change="handleFileSelect"
                 />
              </div>

              <div class="separator"></div>

              <select v-model="selectedBackground" @change="onBackgroundChange" class="background-select">
                <option value="overworld">Overworld</option>
                <option value="nether">Nether</option>
                <option value="end">End</option>
                <option value="void">Void</option>
              </select>
              <button
                class="tool-btn"
                :class="{ active: isShadowsEnabled }"
                @click="toggleShadows"
                title="Toggle Shadows"
              >
                Shadows
              </button>
              <button
                class="tool-btn"
                :class="{ active: isConnectionMode }"
                @click="toggleConnectionMode"
                title="Toggle Edit Mode"
              >
                Edit
              </button>
              <button
                class="tool-btn"
                :class="{ active: isViewOnly }"
                @click="toggleViewMode"
                title="Toggle Raw GLTF / Parsed Blocks"
              >
                {{ isViewOnly ? 'Raw' : 'Parsed' }}
              </button>
            </div>
         </div>
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
import { SceneRenderer, type BackgroundType } from './SceneRenderer';
import { useApi } from '../../composables/useApi';
import { useRouter } from 'vue-router';
import { useGltfLoader } from '../../composables/useGltfLoader';
import { Download } from 'lucide-vue-next';

const api = useApi();
const { loadGltfFromFile } = useGltfLoader();

const props = defineProps<{
  namespace: string;
}>();

const router = useRouter();

// Sidebar & Data
const search = ref('');
const page = ref(1);
const sort = ref('registryName');
const order = ref<'asc' | 'desc'>('asc');
const detectedBlockIds = ref<string[]>([]);

const { blocks, isLoading } = useBlocks({
  namespace: computed(() => {
    // If search contains a dot (e.g. "block.minecraft.stone"), we search globally
    if (search.value && search.value.includes('.')) {
      return undefined;
    }
    return props.namespace;
  }),
  blockIds: detectedBlockIds,
  search,
  page,
  limit: 200,
  sort,
  order,
});

// Sort handling
const toggleOrder = () => {
  order.value = order.value === 'asc' ? 'desc' : 'asc';
  page.value = 1;
};

watch(sort, () => {
  page.value = 1;
});

// 3D Scene
const viewportRef = ref<HTMLElement | null>(null);
let renderer: SceneRenderer | null = null;
const selectedBlock = ref<any>(null);
const isConnectionMode = ref(false);
const isShadowsEnabled = ref(true);
const selectedBackground = ref<BackgroundType>('void');
const isViewOnly = ref(false);

// Import Drag & Drop
const fileInputRef = ref<HTMLInputElement | null>(null);
const isWindowDragging = ref(false);
const isButtonDragOver = ref(false);
let dragCounter = 0;

const onWindowDragEnter = (e: DragEvent) => {
  e.preventDefault();
  dragCounter++;
  if (dragCounter > 0) {
    isWindowDragging.value = true;
  }
};

const onWindowDragLeave = (e: DragEvent) => {
  e.preventDefault();
  dragCounter--;
  if (dragCounter <= 0) {
    dragCounter = 0;
    isWindowDragging.value = false;
  }
};

const onWindowDrop = (e: DragEvent) => {
  e.preventDefault();
  dragCounter = 0;
  isWindowDragging.value = false;
  isButtonDragOver.value = false;
};

const onWindowDragOver = (e: DragEvent) => {
  e.preventDefault();
};

const triggerFileInput = () => {
  fileInputRef.value?.click();
};

const handleFileSelect = async (event: Event) => {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (file) {
    await processFile(file);
    // Reset input
    input.value = '';
  }
};

const handleButtonDrop = async (event: DragEvent) => {
  isButtonDragOver.value = false;
  isWindowDragging.value = false;
  dragCounter = 0;
  
  const file = event.dataTransfer?.files[0];
  if (file) {
    await processFile(file);
  }
};

const processFile = async (file: File) => {
  if (file.name.endsWith('.gltf') || file.name.endsWith('.glb')) {
    try {
      const gltf = await loadGltfFromFile(file);
      console.log(gltf)
      if (renderer) {
        renderer.dispose();
        renderer = new SceneRenderer(viewportRef.value!, { viewOnly: isViewOnly.value });
        renderer.processGltf(gltf);
        
        renderer.setBackground(selectedBackground.value);
        renderer.setShadows(isShadowsEnabled.value);
        setupRendererEvents();
        
        // Reselect block if any
        if (selectedBlock.value) {
            selectBlock(selectedBlock.value);
        }
      }
    } catch (e) {
      console.error("Failed to load dropped GLTF", e);
      alert("Failed to load GLTF file.");
    }
  } else {
     alert("Please upload a .gltf or .glb file.");
  }
};


const onBackgroundChange = () => {
  if (renderer) {
    renderer.setBackground(selectedBackground.value);
  }
};

const placedBlocks = ref<Array<{x: number, y: number, z: number, blockId: string}>>([]);

const toggleConnectionMode = () => {
  isConnectionMode.value = !isConnectionMode.value;
  if (renderer) {
    renderer.setConnectionMode(isConnectionMode.value);
  }
};

const toggleShadows = () => {
  isShadowsEnabled.value = !isShadowsEnabled.value;
  if (renderer) {
    renderer.setShadows(isShadowsEnabled.value);
  }
};

const toggleViewMode = () => {
  isViewOnly.value = !isViewOnly.value;
  initRenderer();
  if (selectedBlock.value) {
    selectBlock(selectedBlock.value);
  }
};

const selectBlock = (block: any) => {
  selectedBlock.value = block;
  if (renderer) {
    renderer.selectBlock({
      _id: block._id,
      blockId: block.blockId,
      textures: block.textures,
      texturesBase64: block.texturesBase64,
      model: block.model,
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

const setupRendererEvents = () => {
  if (!renderer) return;

  if (!isViewOnly.value) {
    renderer.onBlocksDetected = (ids) => {
      detectedBlockIds.value = ids;
    };

    renderer.onBlockPlaced = (pos, blockId) => {
      placedBlocks.value.push({ x: pos.x, y: pos.y, z: pos.z, blockId });
    };

    renderer.onBlockRemoved = (pos) => {
      const idx = placedBlocks.value.findIndex(b => b.x === pos.x && b.y === pos.y && b.z === pos.z);
      if (idx !== -1) placedBlocks.value.splice(idx, 1);
    };

    renderer.onBlockPicked = (blockId) => {
      const found = blocks.value.find(b => b.blockId === blockId);
      if (found) {
        selectBlock(found);
      } else {
        search.value = blockId;
      }
    };

    renderer.onSceneLoaded = (loadedBlocks) => {
      placedBlocks.value = loadedBlocks;
    };

    renderer.setConnectionMode(isConnectionMode.value);
  }
};

// Renderer initialization
const initRenderer = () => {
  if (!viewportRef.value) return;

  // Dispose previous renderer
  if (renderer) {
    renderer.dispose();
    renderer = null;
  }

  renderer = new SceneRenderer(viewportRef.value, { viewOnly: isViewOnly.value });
  renderer.init(); // Loads default test scene

  // Apply current settings
  renderer.setBackground(selectedBackground.value);
  renderer.setShadows(isShadowsEnabled.value);

  setupRendererEvents();
};

// Lifecycle
onMounted(() => {
  initRenderer();
  
  // Window Drag Events
  window.addEventListener('dragenter', onWindowDragEnter);
  window.addEventListener('dragleave', onWindowDragLeave);
  window.addEventListener('dragover', onWindowDragOver);
  window.addEventListener('drop', onWindowDrop);
});

onUnmounted(() => {
  if (renderer) {
    renderer.dispose();
  }
  
  window.removeEventListener('dragenter', onWindowDragEnter);
  window.removeEventListener('dragleave', onWindowDragLeave);
  window.removeEventListener('dragover', onWindowDragOver);
  window.removeEventListener('drop', onWindowDrop);
});
</script>

<style scoped>
.editor-layout {
  display: flex;
  height: calc(100vh - 120px); /* Adjust based on new header */
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

.sort-controls {
  display: flex;
  gap: 5px;
  margin-top: 8px;
}

.sort-select {
  flex: 1;
  padding: 4px;
  background-color: #111;
  border: 1px solid #555;
  color: white;
  font-family: 'Minecraft', monospace;
}

.sort-btn {
  padding: 4px 8px;
  background-color: #444;
  border: 1px solid #555;
  color: white;
  cursor: pointer;
  font-family: 'Minecraft', monospace;
}

.sort-btn:hover {
  background-color: #555;
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

/* Viewport */
.viewport-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  background-color: #1a1a2e;
}

.viewport-wrapper {
  flex: 1;
  position: relative;
  overflow: hidden;
}

.viewport {
  width: 100%;
  height: 100%;
}

/* Controls Overlay */
.controls-overlay {
  position: absolute;
  top: 10px;
  left: 10px;
  right: 10px;
  bottom: 10px;
  pointer-events: none; /* Let clicks pass through to viewport */
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.controls-hint {
  background-color: #00000088;
  padding: 10px;
  color: #fff;
  font-size: 0.8rem;
  border-radius: 4px;
  pointer-events: auto; /* Allow selecting text if needed */
  line-height: 1.5;
}

.viewport-tools {
  display: flex;
  flex-direction: column;
  gap: 10px;
  pointer-events: auto;
}

/* Tool Buttons */
.tool-btn {
  background-color: #2a2a2a;
  border: 2px solid #000;
  color: white;
  padding: 8px 12px;
  cursor: pointer;
  font-family: 'Minecraft', monospace;
  font-size: 0.9rem;
  text-align: center;
  transition: all 0.2s;
  box-shadow: 2px 2px 0px rgba(0,0,0,0.5);
  min-width: 100px;
}

.tool-btn:hover {
  background-color: #333;
  transform: translateX(-2px);
}

.tool-btn:active {
  transform: translateX(0);
  box-shadow: inset 2px 2px 0px rgba(0,0,0,0.5);
}

.tool-btn.active {
  background-color: #4a4;
  border-color: #fff;
}

/* Import Button Specifics */
.import-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border-color: #555;
  background-color: #222;
}

.import-btn .icon {
  font-size: 1.1em;
}

/* Window dragging state */
.import-btn.window-drag {
  animation: pulse-border 1s infinite;
  background-color: #2a2a1a;
  border-color: #FFAA00;
  color: #FFAA00;
}

/* Hover over button state */
.import-btn.drag-over {
  background-color: #FFAA00;
  color: #000;
  border-color: #fff;
  transform: scale(1.05);
  box-shadow: 0 0 15px rgba(255, 170, 0, 0.5);
}

@keyframes pulse-border {
  0% { border-color: #555; }
  50% { border-color: #FFAA00; }
  100% { border-color: #555; }
}

.separator {
  height: 2px;
  background-color: #000;
  border-bottom: 1px solid #444;
  margin: 5px 0;
}

.background-select {
  background-color: #2a2a2a;
  border: 2px solid #000;
  color: white;
  padding: 6px 12px;
  cursor: pointer;
  font-family: 'Minecraft', monospace;
  font-size: 0.9rem;
  box-shadow: 2px 2px 0px rgba(0,0,0,0.5);
}

.background-select:hover {
  background-color: #333;
}

.background-select option {
  background-color: #2a2a2a;
  color: white;
}

.hidden {
  display: none;
}

/* Dialog and Buttons (Unchanged) */
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
