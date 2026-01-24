

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue';
import { useApi } from '../composables/useApi';

interface StepProgress {
  current: number;
  total: number;
}

interface StepEvent {
  name: string;
  status: 'pending' | 'running' | 'completed' | 'error';
  progress?: StepProgress;
  message?: string;
}

interface StepInfo {
  name: string;
  label: string;
}

interface UploadResult {
  success: boolean;
  filename?: string;
  mod?: {
    modId: string;
    modVersion: string;
    minecraftVersion: string;
    displayName: string;
  };
  blocksCreated?: number;
  blocksUpdated?: number;
  texturesCreated?: number;
  modelsCreated?: number;
  iconsGenerated?: number;
  error?: string;
}

const fileInput = ref<HTMLInputElement | null>(null);
const selectedFile = ref<File | null>(null);
const isDragging = ref(false);
const isUploading = ref(false);
const result = ref<UploadResult | null>(null);
const steps = ref<StepEvent[]>([]);
const stepInfos = ref<StepInfo[]>([]);
let eventSource: EventSource | null = null;

const fetchSteps = async () => {
  try {
    const api = useApi();
    const response = await api.get<StepInfo[]>('/parser/steps');
    stepInfos.value = response.data;
  } catch (e) {
    console.error('Failed to fetch steps', e);
  }
};

const initSteps = () => {
  steps.value = stepInfos.value.map(info => ({
    name: info.name,
    status: 'pending' as const,
  }));
};

const updateStep = (event: StepEvent) => {
  const index = steps.value.findIndex(s => s.name === event.name);
  if (index !== -1) {
    steps.value[index] = { ...steps.value[index], ...event };
  }
};

const getStepLabel = (name: string): string => {
  const info = stepInfos.value.find(s => s.name === name);
  return info ? info.label : name;
};

const triggerFileInput = () => {
  if (!isUploading.value) {
    fileInput.value?.click();
  }
};

const handleFileSelect = (event: Event) => {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (file) {
    selectFile(file);
  }
};

const handleDrop = (event: DragEvent) => {
  isDragging.value = false;
  if (isUploading.value) return;

  const file = event.dataTransfer?.files?.[0];
  if (file) {
    selectFile(file);
  }
};

const selectFile = (file: File) => {
  if (!file.name.endsWith('.jar')) {
    result.value = { success: false, error: 'Please select a .jar file' };
    return;
  }
  selectedFile.value = file;
  result.value = null;
};

const clearSelection = () => {
  selectedFile.value = null;
  result.value = null;
  if (fileInput.value) {
    fileInput.value.value = '';
  }
};

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
};

const setupSSE = () => {
  if (eventSource) return;
  
  eventSource = new EventSource('http://localhost:3000/parser/upload');
  
  eventSource.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      console.log(data)
      if (data.type === 'step') {
        updateStep(data.payload);
      }
      if (data.type === 'complete') {
        result.value = data.payload
      }
    } catch (e) {
      console.error('Failed to parse SSE event', e);
    }
  };
};

const uploadFile = async () => {
  if (!selectedFile.value || isUploading.value) return;

  isUploading.value = true;
  result.value = null;
  initSteps();
    setupSSE();

  try {
    const formData = new FormData();
    formData.append('file', selectedFile.value);


    const api = useApi();
    const response = await api.post('/parser/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 300000, // 5 minutes timeout
    });
    
    // Process result from response (backup if SSE missed it)
    if (response.data) {
       result.value = response.data;
    }
    
  } catch (error: any) {
    result.value = {
      success: false,
      error: error.message || 'Upload failed',
    };
  } finally {
    isUploading.value = false;
    selectedFile.value = null;
  }
};

onMounted(() => {
  fetchSteps();
});

onUnmounted(() => {
  if (eventSource) {
    eventSource.close();
  }
});
</script>

<template>
  <div class="upload-container">
    <div class="upload-card">
      <h1 class="upload-title">Upload Mod</h1>
      <p class="upload-description">
        Upload a Minecraft mod JAR file to parse its blocks and textures.
      </p>

      <div
        class="upload-dropzone"
        :class="{ 'dropzone-active': isDragging, 'dropzone-disabled': isUploading }"
        @dragover.prevent="isDragging = true"
        @dragleave.prevent="isDragging = false"
        @drop.prevent="handleDrop"
        @click="triggerFileInput"
      >
        <input
          ref="fileInput"
          type="file"
          accept=".jar"
          @change="handleFileSelect"
          hidden
        />

        <!-- Progress avec steps -->
        <div v-if="isUploading" class="upload-progress">
          <div class="progress-header">
            <div class="spinner"></div>
            <p>Parsing {{ selectedFile?.name }}...</p>
          </div>

          <div class="steps-list">
            <div
              v-for="step in steps"
              :key="step.name"
              class="step-item"
              :class="{
                'step-pending': step.status === 'pending',
                'step-running': step.status === 'running',
                'step-completed': step.status === 'completed',
                'step-error': step.status === 'error',
              }"
            >
              <div class="step-icon">
                <span v-if="step.status === 'pending'">○</span>
                <span v-else-if="step.status === 'running'" class="step-spinner">◐</span>
                <span v-else-if="step.status === 'completed'">✓</span>
                <span v-else>✗</span>
              </div>
              <div class="step-content">
                <span class="step-name">{{ getStepLabel(step.name) }}</span>
                <span v-if="step.progress" class="step-progress">
                  {{ step.progress.current }}/{{ step.progress.total }}
                </span>
                <span v-if="step.message && step.status === 'completed'" class="step-message">
                  {{ step.message }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div v-else-if="selectedFile" class="upload-selected">
          <div class="file-icon">📦</div>
          <p class="file-name">{{ selectedFile.name }}</p>
          <p class="file-size">{{ formatFileSize(selectedFile.size) }}</p>
          <button class="upload-btn" @click.stop="uploadFile">
            Parse Mod
          </button>
          <button class="cancel-btn" @click.stop="clearSelection">
            Cancel
          </button>
        </div>

        <div v-else class="upload-placeholder">
          <div class="upload-icon">📁</div>
          <p>Drag & drop a .jar file here</p>
          <p class="upload-hint">or click to browse</p>
        </div>
      </div>

      <!-- Résultat -->
      <div v-if="result" class="upload-result" :class="{ 'result-success': result.success, 'result-error': !result.success }">
        <div v-if="result.success" class="result-content">
          <h3>✓ {{ result.mod?.displayName || result.mod?.modId }}</h3>
          <p>Version: {{ result.mod?.modVersion }} (MC {{ result.mod?.minecraftVersion }})</p>
          <div class="result-stats">
            <span>{{ result.blocksCreated }} blocks</span>
            <span>{{ result.texturesCreated }} textures</span>
            <span>{{ result.modelsCreated }} models</span>
            <span>{{ result.iconsGenerated }} icons</span>
          </div>
          <router-link
            v-if="result.mod?.modId"
            :to="{ name: 'ModGuide', params: { namespace: result.mod.modId } }"
            class="view-mod-btn"
          >
            View Mod →
          </router-link>
        </div>
        <div v-else class="result-content">
          <h3>✗ Error</h3>
          <p>{{ result.error }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.upload-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: calc(100vh - 200px);
  padding: 20px;
}

.upload-card {
  background-color: #2a2a2a;
  border: 2px solid #555;
  border-radius: 8px;
  padding: 32px;
  max-width: 500px;
  width: 100%;
  text-align: center;
}

.upload-title {
  font-family: 'Minecraft', monospace;
  font-size: 28px;
  color: #fff;
  margin: 0 0 12px 0;
}

.upload-description {
  color: #888;
  margin: 0 0 24px 0;
  font-size: 14px;
}

.upload-dropzone {
  border: 3px dashed #555;
  border-radius: 8px;
  padding: 40px 20px;
  cursor: pointer;
  transition: all 0.2s;
  background-color: #1a1a1a;
}

.upload-dropzone:hover:not(.dropzone-disabled) {
  border-color: #888;
  background-color: #222;
}

.dropzone-active {
  border-color: #ffaa00 !important;
  background-color: #2a2a1a !important;
}

.dropzone-disabled {
  cursor: default;
}

.upload-placeholder,
.upload-selected {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.upload-progress {
  text-align: left;
}

.progress-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
  justify-content: center;
}

.progress-header p {
  color: #fff;
  margin: 0;
  font-size: 14px;
}

.upload-icon,
.file-icon {
  font-size: 48px;
  margin-bottom: 8px;
}

.upload-placeholder p {
  color: #aaa;
  margin: 0;
}

.upload-hint {
  font-size: 12px;
  color: #666 !important;
}

.file-name {
  color: #fff;
  font-weight: bold;
  margin: 0;
  word-break: break-all;
}

.file-size {
  color: #888;
  font-size: 12px;
  margin: 0;
}

/* Steps */
.steps-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.step-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  border-radius: 4px;
  background-color: #222;
  transition: all 0.2s;
}

.step-pending {
  opacity: 0.5;
}

.step-running {
  background-color: #2a2a1a;
  border-left: 3px solid #ffaa00;
}

.step-completed {
  background-color: #1a2a1a;
}

.step-error {
  background-color: #2a1a1a;
  border-left: 3px solid #a44;
}

.step-icon {
  width: 20px;
  text-align: center;
  font-size: 14px;
}

.step-pending .step-icon { color: #555; }
.step-running .step-icon { color: #ffaa00; }
.step-completed .step-icon { color: #4a4; }
.step-error .step-icon { color: #a44; }

.step-spinner {
  display: inline-block;
  animation: spin 1s linear infinite;
}

.step-content {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.step-name {
  color: #ccc;
  font-size: 13px;
}

.step-progress {
  color: #888;
  font-size: 11px;
  background-color: #333;
  padding: 2px 6px;
  border-radius: 3px;
}

.step-message {
  color: #666;
  font-size: 11px;
  margin-left: auto;
}

/* Buttons */
.upload-btn,
.cancel-btn,
.view-mod-btn {
  margin-top: 16px;
  padding: 10px 24px;
  font-family: 'Minecraft', monospace;
  font-size: 14px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
  text-decoration: none;
  display: inline-block;
}

.upload-btn {
  background-color: #4a4;
  color: #fff;
}

.upload-btn:hover {
  background-color: #5b5;
}

.cancel-btn {
  background-color: transparent;
  color: #888;
  margin-left: 8px;
}

.cancel-btn:hover {
  color: #fff;
}

.view-mod-btn {
  background-color: #ffaa00;
  color: #000;
  margin-top: 16px;
}

.view-mod-btn:hover {
  background-color: #ffbb33;
}

/* Spinner */
.spinner {
  width: 24px;
  height: 24px;
  border: 3px solid #333;
  border-top-color: #ffaa00;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* Résultat */
.upload-result {
  margin-top: 24px;
  padding: 16px;
  border-radius: 8px;
  text-align: left;
}

.result-success {
  background-color: #1a2a1a;
  border: 1px solid #4a4;
}

.result-error {
  background-color: #2a1a1a;
  border: 1px solid #a44;
}

.result-content h3 {
  margin: 0 0 8px 0;
  color: #fff;
  font-family: 'Minecraft', monospace;
}

.result-content p {
  margin: 0 0 8px 0;
  color: #aaa;
  font-size: 14px;
}

.result-stats {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
}

.result-stats span {
  background-color: #333;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  color: #888;
}
</style>
