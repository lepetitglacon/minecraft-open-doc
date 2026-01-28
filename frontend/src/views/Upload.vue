<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue';
import { baseUrl, useApi } from '../composables/useApi';
import { UploadCloud, Loader2, Check, X, Circle, Package } from 'lucide-vue-next';

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
  
  eventSource = new EventSource(`${baseUrl}/parser/upload`);
  
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
  <div class="flex justify-center items-center min-h-[calc(100vh-200px)] p-5">
    <div class="bg-[#2a2a2a] border-2 border-[#555] rounded-lg p-8 max-w-[500px] w-full text-center shadow-xl">
      <h1 class="font-[var(--font-minecraft)] text-3xl text-white mb-3">Upload Mod</h1>
      <p class="text-[#888] mb-6 text-sm">
        Upload a Minecraft mod JAR file to parse its blocks and textures.
      </p>

      <div
        class="border-4 border-dashed border-[#555] rounded-lg p-10 cursor-pointer transition-all bg-[#1a1a1a] hover:border-[#888] hover:bg-[#222]"
        :class="{ '!border-[var(--color-mc-link)] !bg-[#2a2a1a]': isDragging, 'cursor-default hover:!border-[#555] hover:!bg-[#1a1a1a]': isUploading }"
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

        <!-- Progress with steps -->
        <div v-if="isUploading" class="text-left">
          <div class="flex items-center justify-center gap-3 mb-5">
            <Loader2 class="w-6 h-6 animate-spin text-[var(--color-mc-link)]" />
            <p class="text-white text-sm m-0">Parsing {{ selectedFile?.name }}...</p>
          </div>

          <div class="flex flex-col gap-2">
            <div
              v-for="step in steps"
              :key="step.name"
              class="flex items-center gap-3 p-2 rounded bg-[#222] transition-all"
              :class="{
                'opacity-50': step.status === 'pending',
                'bg-[#2a2a1a] border-l-2 border-[var(--color-mc-link)]': step.status === 'running',
                'bg-[#1a2a1a]': step.status === 'completed',
                'bg-[#2a1a1a] border-l-2 border-red-500': step.status === 'error',
              }"
            >
              <div class="w-5 text-center flex justify-center">
                <Circle v-if="step.status === 'pending'" class="w-4 h-4 text-[#555]" />
                <Loader2 v-else-if="step.status === 'running'" class="w-4 h-4 animate-spin text-[var(--color-mc-link)]" />
                <Check v-else-if="step.status === 'completed'" class="w-4 h-4 text-green-500" />
                <X v-else class="w-4 h-4 text-red-500" />
              </div>
              <div class="flex-1 flex items-center gap-2 flex-wrap">
                <span class="text-gray-300 text-xs">{{ getStepLabel(step.name) }}</span>
                <span v-if="step.progress" class="text-[#888] text-[10px] bg-[#333] px-1.5 rounded">
                  {{ step.progress.current }}/{{ step.progress.total }}
                </span>
                <span v-if="step.message && step.status === 'completed'" class="text-[#666] text-[10px] ml-auto">
                  {{ step.message }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div v-else-if="selectedFile" class="flex flex-col items-center gap-2">
          <Package class="w-12 h-12 text-white mb-2" />
          <p class="text-white font-bold break-all m-0">{{ selectedFile.name }}</p>
          <p class="text-[#888] text-xs m-0">{{ formatFileSize(selectedFile.size) }}</p>
          
          <div class="mt-4 flex gap-2">
            <button 
                class="minecraft-btn !bg-[#4a4] hover:!bg-[#5b5] !py-2 !px-4 !text-sm"
                @click.stop="uploadFile"
            >
                Parse Mod
            </button>
            <button 
                class="minecraft-btn !bg-transparent !border-0 text-[#888] hover:text-white !shadow-none !py-2 !px-4 !text-sm"
                @click.stop="clearSelection"
            >
                Cancel
            </button>
          </div>
        </div>

        <div v-else class="flex flex-col items-center gap-2">
          <UploadCloud class="w-12 h-12 text-[#555] mb-2" />
          <p class="text-[#aaa] m-0">Drag & drop a .jar file here</p>
          <p class="text-[#666] text-xs m-0">or click to browse</p>
        </div>
      </div>

      <!-- Result -->
      <div v-if="result" class="mt-6 p-4 rounded-lg text-left" :class="result.success ? 'bg-[#1a2a1a] border border-[#4a4]' : 'bg-[#2a1a1a] border border-[#a44]'">
        <div v-if="result.success">
          <h3 class="font-[var(--font-minecraft)] text-white m-0 mb-2">✓ {{ result.mod?.displayName || result.mod?.modId }}</h3>
          <p class="text-[#aaa] text-sm mb-2">Version: {{ result.mod?.modVersion }} (MC {{ result.mod?.minecraftVersion }})</p>
          <div class="flex flex-wrap gap-2 mt-3">
            <span class="bg-[#333] px-2 py-1 rounded text-xs text-[#888]">{{ result.blocksCreated }} blocks</span>
            <span class="bg-[#333] px-2 py-1 rounded text-xs text-[#888]">{{ result.texturesCreated }} textures</span>
            <span class="bg-[#333] px-2 py-1 rounded text-xs text-[#888]">{{ result.modelsCreated }} models</span>
            <span class="bg-[#333] px-2 py-1 rounded text-xs text-[#888]">{{ result.iconsGenerated }} icons</span>
          </div>
          <router-link
            v-if="result.mod?.modId"
            :to="{ name: 'ModGuide', params: { namespace: result.mod.modId } }"
            class="minecraft-btn !bg-[var(--color-mc-link)] !text-black hover:!bg-[var(--color-mc-link-hover)] !mt-4 block w-full"
          >
            View Mod →
          </router-link>
        </div>
        <div v-else>
          <h3 class="font-[var(--font-minecraft)] text-white m-0 mb-2">✗ Error</h3>
          <p class="text-[#aaa] text-sm">{{ result.error }}</p>
        </div>
      </div>
    </div>
  </div>
</template>