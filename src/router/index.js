import Vue from 'vue'
import VueRouter from 'vue-router'
import HomeView from '../views/HomeView.vue'

Vue.use(VueRouter)

const routes = [
  {
    path: '/',
    name: 'home',
    component: HomeView
  },
  {
    path: '/tui-editor',
    name: 'tui-editor',
    component: () => import('../views/TuiEditorView.vue')
  },
  {
    path: '/fabric-editor',
    name: 'fabric-editor',
    component: () => import('../views/FabricEditorView.vue')
  },
  {
    path: '/cropper-editor',
    name: 'cropper-editor',
    component: () => import('../views/CropperEditorView.vue')
  },
  {
    path: '/jimp-editor',
    name: 'jimp-editor',
    component: () => import('../views/JimpEditorView.vue')
  },
  {
    path: '/konva-editor',
    name: 'konva-editor',
    component: () => import('../views/KonvaEditorView.vue')
  },
  {
    path: '/unified-editor',
    name: 'unified-editor',
    component: () => import('../views/UnifiedEditorDemo.vue')
  },
  {
    path: '/ui-components',
    name: 'ui-components',
    component: () => import('../views/UIComponentsDemo.vue')
  },
  {
    path: '/advanced-ui',
    name: 'advanced-ui',
    component: () => import('../views/AdvancedUIDemo.vue')
  },
  {
    path: '/advanced-components',
    name: 'advanced-components',
    component: () => import('../views/AdvancedComponentsDemo.vue')
  },
  {
    path: '/mid-priority-components',
    name: 'mid-priority-components',
    component: () => import('../views/MidPriorityComponentsDemo.vue')
  },
  {
    path: '/low-priority-components',
    name: 'low-priority-components',
    component: () => import('../views/LowPriorityComponentsDemo.vue')
  }
]

const router = new VueRouter({
  mode: 'history',
  base: process.env.BASE_URL,
  routes
})

export default router
