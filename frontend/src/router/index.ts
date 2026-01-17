import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import Home from '../views/Home.vue'
import Blocks from '../views/mod/tabs/Blocks.vue'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'Home',
    component: Home
  },
  {
    path: '/blocks',
    name: 'Mods',
    component: Blocks
  },
  {
    path: '/upload',
    name: 'Upload',
    component: () => import('../views/Upload.vue')
  },
  {
    path: '/mods/:namespace',
    name: 'ModDetail',
    component: () => import('../views/mod/ModDetail.vue'),
    props: true,
    children: [
      {
        path: '',
        redirect: to => ({ name: 'ModGuide', params: { namespace: to.params.namespace as string }})
      },
      {
        path: 'guide',
        name: 'ModGuide',
        component: () => import('../views/mod/tabs/Guide.vue'),
        props: true
      },
      {
        path: 'blocks',
        name: 'ModBlocks',
        component: () => import('../views/NamespaceBlocks.vue'),
        props: true
      },
      {
        path: 'blocks/:blockId',
        name: 'BlockDetail',
        component: () => import('../views/BlockDetail.vue'),
        props: true
      },
      {
        path: 'examples',
        name: 'ModExamples',
        component: () => import('../views/mod/tabs/Examples.vue'),
        props: true
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
