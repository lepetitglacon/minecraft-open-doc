<template>
  <nav class="flex items-center justify-between px-6 py-4 bg-[#1a1a1a] border-b-4 border-black/50 shadow-lg backdrop-blur-sm relative z-20">
    <div class="flex items-center gap-8">
      <!-- Logo / Titre -->
      <router-link to="/" class="flex items-center gap-3 group">
        <span class="text-xl font-bold tracking-wider text-white group-hover:text-[var(--color-mc-link)] transition-colors font-[var(--font-minecraft)]">
          Minecraft Open Doc
        </span>
      </router-link>

      <!-- Menu Principal -->
      <div class="hidden md:flex items-center gap-6">
        <router-link to="/" class="text-gray-300 hover:text-white hover:underline decoration-[var(--color-mc-link)] decoration-2 underline-offset-4 transition-all text-sm uppercase tracking-wide font-medium">
          Home
        </router-link>
        <router-link to="/upload" class="text-gray-300 hover:text-white hover:underline decoration-[var(--color-mc-link)] decoration-2 underline-offset-4 transition-all text-sm uppercase tracking-wide font-medium">
          Upload
        </router-link>
      </div>
    </div>
    
    <!-- Auth Section (Droite) -->
    <div class="flex items-center gap-6">
      <template v-if="authStore.isAuthenticated">
         <div class="flex items-center gap-3">
            <span class="text-white hidden sm:block font-[var(--font-minecraft)] text-sm">{{ authStore.user?.username }}</span>
            <DropdownMenuRoot>
              <DropdownMenuTrigger class="outline-none">
                 <div class="w-8 h-8 bg-gray-700 rounded flex items-center justify-center border border-gray-500 hover:border-[var(--color-mc-link)] cursor-pointer">
                    <User class="w-5 h-5 text-white" />
                 </div>
              </DropdownMenuTrigger>
              <DropdownMenuPortal>
                <DropdownMenuContent class="min-w-[150px] bg-[#2a2a2a] border-2 border-[#555] p-1 shadow-xl z-50 text-white animate-in fade-in zoom-in-95 duration-200">
                  <DropdownMenuItem @select="authStore.logout" class="flex items-center gap-2 px-2 py-1.5 outline-none hover:bg-[var(--color-mc-link)] hover:text-black cursor-pointer rounded-sm text-sm font-[var(--font-minecraft)]">
                    <LogOut class="w-4 h-4" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenuPortal>
            </DropdownMenuRoot>
         </div>
      </template>
      <template v-else>
         <AuthDialog>
            <button class="minecraft-btn flex items-center gap-2 !py-1.5 !px-4 !text-sm">
               <LogIn class="w-4 h-4" />
               <span>Login</span>
            </button>
         </AuthDialog>
      </template>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { LogIn, User, LogOut } from 'lucide-vue-next'
import AuthDialog from '../auth/AuthDialog.vue'
import { useAuthStore } from '../../stores/auth'
import { DropdownMenuRoot, DropdownMenuTrigger, DropdownMenuPortal, DropdownMenuContent, DropdownMenuItem } from 'reka-ui'

const authStore = useAuthStore()
</script>
