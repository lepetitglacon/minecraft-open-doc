import { createApp } from 'vue'
import { VueQueryPlugin, QueryClient } from '@tanstack/vue-query'
import './style.css'
import App from './App.vue'
import router from './router'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes (anciennement cacheTime)
      refetchOnWindowFocus: false,
    },
  },
})

createApp(App)
  .use(router)
  .use(VueQueryPlugin, { queryClient })
  .mount('#app')
