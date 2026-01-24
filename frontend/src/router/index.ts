import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import Home from '../views/Home.vue'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'Home',
    component: Home
  },
  {
    path: '/upload',
    name: 'Upload',
    component: () => import('../views/Upload.vue')
  },
  {
    path: '/mods',
    name: 'Mods',
    // Component wrapper to allow children rendering
    component: { template: '<router-view />' },
    children: [
      {
        path: ':namespace/examples/create',
        name: 'CreateExample',
        component: () => import('../views/mod/ExampleEditor.vue'),
        props: true
      },
      {
        path: ':namespace',
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
            component: () => import('../views/mod/NamespaceBlocks.vue'),
            props: true
          },
          {
            path: 'blocks/:blockId',
            name: 'BlockDetail',
            component: () => import('../views/mod/BlockDetail.vue'),
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
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
