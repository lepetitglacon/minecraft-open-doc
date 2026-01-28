<script setup lang="ts">
import { ref, reactive } from 'vue'
import { DialogRoot, DialogTrigger, DialogPortal, DialogOverlay, DialogContent, DialogTitle, DialogDescription, DialogClose } from 'reka-ui'
import { X, Loader2 } from 'lucide-vue-next'
import { useAuthStore } from '../../stores/auth'
import { useApi } from '../../composables/useApi'

const props = defineProps<{
  triggerClass?: string
}>()

const open = ref(false)
const mode = ref<'login' | 'register' | 'reset'>('login')
const isLoading = ref(false)
const error = ref<string | null>(null)
const authStore = useAuthStore()
const api = useApi()

const loginForm = reactive({
  username: '',
  password: ''
})

const registerForm = reactive({
  username: '',
  password: '',
  repeat_password: ''
})

const resetForm = reactive({
  email: '' // Assuming email for reset, though backend wasn't clear.
})

async function handleLogin() {
  isLoading.value = true
  error.value = null
  try {
    const { data } = await api.post('/auth/login', loginForm)
    authStore.setToken(data.access_token)
    await authStore.fetchProfile()
    open.value = false
  } catch (e: any) {
    error.value = e.response?.data?.message || 'Login failed'
  } finally {
    isLoading.value = false
  }
}

async function handleRegister() {
  if (registerForm.password !== registerForm.repeat_password) {
    error.value = "Passwords do not match"
    return
  }
  
  isLoading.value = true
  error.value = null
  try {
    await api.post('/auth/register', {
      username: registerForm.username,
      password: registerForm.password,
      repeat_password: registerForm.repeat_password
    })
    // Auto login or switch to login
    mode.value = 'login'
    error.value = null // Clear error
    // Optional: Pre-fill login
    loginForm.username = registerForm.username
    loginForm.password = registerForm.password
    // Maybe just login directly?
    await handleLogin()
  } catch (e: any) {
    error.value = e.response?.data?.message || 'Registration failed'
  } finally {
    isLoading.value = false
  }
}

async function handleReset() {
  // Mock implementation as backend endpoint is missing
  isLoading.value = true
  error.value = null
  try {
    // await api.post('/auth/reset-password', resetForm)
    await new Promise(resolve => setTimeout(resolve, 1000))
    alert('Reset link sent (Mock)')
    mode.value = 'login'
  } catch (e: any) {
    error.value = 'Failed to request reset'
  } finally {
    isLoading.value = false
  }
}

function switchMode(newMode: 'login' | 'register' | 'reset') {
  mode.value = newMode
  error.value = null
}
</script>

<template>
  <DialogRoot v-model:open="open">
    <DialogTrigger :class="triggerClass">
      <slot>Login</slot>
    </DialogTrigger>

    <DialogPortal>
      <DialogOverlay class="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
      <DialogContent class="fixed left-[50%] top-[50%] z-50 grid w-full max-w-md translate-x-[-50%] translate-y-[-50%] gap-4 border-2 border-[#555] bg-[#1e1e1e] p-0 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 sm:rounded-lg">
        
        <!-- Header -->
        <div class="flex items-center justify-between border-b-2 border-[#555] px-6 py-4 bg-[#2a2a2a]">
           <DialogTitle class="text-xl font-bold text-white font-[var(--font-minecraft)]">
             {{ mode === 'login' ? 'Login' : mode === 'register' ? 'Sign Up' : 'Reset Password' }}
           </DialogTitle>
           <DialogClose class="text-gray-400 hover:text-white transition-colors">
              <X class="w-5 h-5" />
           </DialogClose>
        </div>

        <!-- Body -->
        <div class="p-6">
           <div v-if="error" class="mb-4 p-3 bg-red-900/50 border border-red-500 text-red-200 text-sm rounded">
             {{ error }}
           </div>

           <!-- Login Form -->
           <form v-if="mode === 'login'" @submit.prevent="handleLogin" class="space-y-4">
              <div class="space-y-2">
                <label class="text-sm font-medium text-gray-300">Username</label>
                <input v-model="loginForm.username" type="text" class="w-full bg-black/50 border border-[#555] p-2 text-white focus:border-[var(--color-mc-link)] outline-none rounded" required />
              </div>
              <div class="space-y-2">
                <label class="text-sm font-medium text-gray-300">Password</label>
                <input v-model="loginForm.password" type="password" class="w-full bg-black/50 border border-[#555] p-2 text-white focus:border-[var(--color-mc-link)] outline-none rounded" required />
              </div>
              
              <button type="submit" :disabled="isLoading" class="w-full minecraft-btn !bg-[var(--color-mc-link)] !text-black hover:!bg-[var(--color-mc-link-hover)] mt-2 flex justify-center">
                 <Loader2 v-if="isLoading" class="w-5 h-5 animate-spin" />
                 <span v-else>Login</span>
              </button>
              
              <div class="flex justify-between text-xs text-gray-400 mt-4">
                 <button type="button" @click="switchMode('reset')" class="hover:text-white hover:underline">Forgot password?</button>
                 <button type="button" @click="switchMode('register')" class="hover:text-white hover:underline">Create account</button>
              </div>
           </form>

           <!-- Register Form -->
           <form v-if="mode === 'register'" @submit.prevent="handleRegister" class="space-y-4">
              <div class="space-y-2">
                <label class="text-sm font-medium text-gray-300">Username</label>
                <input v-model="registerForm.username" type="text" class="w-full bg-black/50 border border-[#555] p-2 text-white focus:border-[var(--color-mc-link)] outline-none rounded" required />
              </div>
              <div class="space-y-2">
                <label class="text-sm font-medium text-gray-300">Password</label>
                <input v-model="registerForm.password" type="password" class="w-full bg-black/50 border border-[#555] p-2 text-white focus:border-[var(--color-mc-link)] outline-none rounded" required />
              </div>
              <div class="space-y-2">
                <label class="text-sm font-medium text-gray-300">Repeat Password</label>
                <input v-model="registerForm.repeat_password" type="password" class="w-full bg-black/50 border border-[#555] p-2 text-white focus:border-[var(--color-mc-link)] outline-none rounded" required />
              </div>
              
              <button type="submit" :disabled="isLoading" class="w-full minecraft-btn !bg-[#4a4] !text-white hover:!bg-[#5b5] mt-2 flex justify-center">
                 <Loader2 v-if="isLoading" class="w-5 h-5 animate-spin" />
                 <span v-else>Sign Up</span>
              </button>
              
              <div class="text-center text-xs text-gray-400 mt-4">
                 Already have an account? <button type="button" @click="switchMode('login')" class="text-[var(--color-mc-link)] hover:underline">Login</button>
              </div>
           </form>

           <!-- Reset Form -->
           <form v-if="mode === 'reset'" @submit.prevent="handleReset" class="space-y-4">
              <p class="text-sm text-gray-400 mb-4">Enter your username or email and we'll send you a link to reset your password.</p>
              <div class="space-y-2">
                <label class="text-sm font-medium text-gray-300">Username / Email</label>
                <input v-model="resetForm.email" type="text" class="w-full bg-black/50 border border-[#555] p-2 text-white focus:border-[var(--color-mc-link)] outline-none rounded" required />
              </div>
              
              <button type="submit" :disabled="isLoading" class="w-full minecraft-btn mt-2 flex justify-center">
                 <Loader2 v-if="isLoading" class="w-5 h-5 animate-spin" />
                 <span v-else>Send Reset Link</span>
              </button>
              
              <div class="text-center text-xs text-gray-400 mt-4">
                 <button type="button" @click="switchMode('login')" class="hover:text-white hover:underline">Back to Login</button>
              </div>
           </form>
        </div>
        
        <DialogDescription class="sr-only">Authentication form</DialogDescription>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>
