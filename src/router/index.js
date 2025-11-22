import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'

import Login from '@/views/Login.vue'
import Register from '@/views/Register.vue'

const routes = [
  {
    path: '/',
    name: 'home',
    component: HomeView
  },
  {
    path: '/login',
    name: 'login',
    component: Login
  },
  {
    path: '/task-management',
    name: 'task-management',
    component: () => import('../views/TaskManagementView.vue')
  },
  {
    path: '/create-room',
    name: 'create-room',
    component: () => import('../views/CreateRoomView.vue')
  },
  {
    path: '/join-room',
    name: 'join-room',
    component: () => import('../views/JoinRoomView.vue')
  },
  {
    path: '/register',
    name: 'Register',
    component: Register
  }
]

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
})

export default router