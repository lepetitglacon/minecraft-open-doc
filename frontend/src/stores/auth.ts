import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useApi } from '../composables/useApi'

interface User {
  userId: string;
  username: string;
  [key: string]: any;
}

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(localStorage.getItem('token'))
  const user = ref<User | null>(null)
  
  const isAuthenticated = computed(() => !!token.value)
  
  const api = useApi()

  function setToken(newToken: string | null) {
    token.value = newToken
    if (newToken) {
      localStorage.setItem('token', newToken)
    } else {
      localStorage.removeItem('token')
    }
  }

  function setUser(newUser: User | null) {
    user.value = newUser
  }

  async function fetchProfile() {
    if (!token.value) return
    try {
      const { data } = await api.get('/auth/profile')
      setUser(data)
    } catch (error) {
      logout()
    }
  }

  function logout() {
    setToken(null)
    setUser(null)
  }

  return {
    token,
    user,
    isAuthenticated,
    setToken,
    setUser,
    fetchProfile,
    logout
  }
})
