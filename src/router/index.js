import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import CreateRoomView from '../views/CreateRoomView.vue'
import JoinRoomView from '../views/JoinRoomView.vue'
import StudyRoomView from '../views/StudyRoomView.vue'
import TaskManagementView from '../views/TaskManagementView.vue'
import Login from '@/views/Login.vue'
import Register from '@/views/Register.vue'
import ForgotPassword from '@/views/ForgotPassword.vue'
import PersonalCenter from '@/views/PersonalCenter.vue'
import FriendsView from '@/views/FriendsView.vue'


const routes = [
  {
    path: '/',
    redirect: '/login'
  },
  {
    path: '/home',
    name: 'home',
    component: HomeView
  },
  {
    path: '/login',
    name: 'login',
    component: Login
  },
  {
    path: '/register',
    name: 'register',
    component: Register
  },
  {
    path: '/forgot-password',
    name: 'forgot-password',
    component: ForgotPassword
  },
  {
    path: '/create-room',
    name: 'create-room',
    component: CreateRoomView
  },
  {
    path: '/join-room',
    name: 'join-room',
    component: JoinRoomView
  },
  {
    path: '/study-room/:roomId',
    name: 'study-room',
    component: StudyRoomView,
    props: true
  },
  {
    path: '/task-management',
    name: 'task-management',
    component: TaskManagementView
  },
  {
    path: '/personal-center',
    name: 'PersonalCenter',
    component: PersonalCenter
  },
  {
    path: '/friends',
    name: 'friends',
    component: FriendsView
  }
]

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
})

export default router