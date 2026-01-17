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

        <div v-if="isUploading" class="upload-progress">
          <div class="spinner"></div>
          <p>Parsing {{ selectedFile?.name }}...</p>
          <p class="upload-hint">This may take a few moments</p>
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
            <span>{{ result.blocksCreated }} blocks created</span>
            <span>{{ result.blocksUpdated }} blocks updated</span>
            <span>{{ result.texturesCreated }} textures</span>
            <span>{{ result.modelsCreated }} models</span>
          </div>
          <router-link
            v-if="result.mod?.modId"
            :to="{ name: 'ModBlocks', params: { namespace: result.mod.modId } }"
            class="view-mod-btn"
          >
            View Blocks →
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

<script setup lang="ts">
import { ref } from 'vue';
import api from '../services/api';

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
  error?: string;
}

const fileInput = ref<HTMLInputElement | null>(null);
const selectedFile = ref<File | null>(null);
const isDragging = ref(false);
const isUploading = ref(false);
const result = ref<UploadResult | null>(null);

const triggerFileInput = () => {
  if (!isUploading.value) {
    fileInput.value?.click();
  }
};

const handleFileSelect = (event: Event) => {
  const input = event.target as HTMLInputElement;
  if (input.files && input.files.length > 0) {
    selectFile(input.files[0]);
  }
};

const handleDrop = (event: DragEvent) => {
  isDragging.value = false;
  if (isUploading.value) return;

  const files = event.dataTransfer?.files;
  if (files && files.length > 0) {
    selectFile(files[0]);
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

const uploadFile = async () => {
  if (!selectedFile.value || isUploading.value) return;

  isUploading.value = true;
  result.value = null;

  try {
    const formData = new FormData();
    formData.append('file', selectedFile.value);

    const response = await api.post('/parser/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 300000, // 5 minutes timeout
    });

    result.value = response.data;
  } catch (error: any) {
    result.value = {
      success: false,
      error: error.response?.data?.message || error.message || 'Upload failed',
    };
  } finally {
    isUploading.value = false;
    selectedFile.value = null;
  }
};
</script>

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
  cursor: wait;
  opacity: 0.7;
}

.upload-placeholder,
.upload-selected,
.upload-progress {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.upload-icon,
.file-icon {
  font-size: 48px;
  margin-bottom: 8px;
}

.upload-placeholder p,
.upload-progress p {
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
  width: 40px;
  height: 40px;
  border: 4px solid #333;
  border-top-color: #ffaa00;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
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
