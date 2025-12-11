<template>
  <div id="app">
    <router-view/>
    <!-- 悬浮桌宠 - 只在登录后显示 -->
    <DesktopPet v-if="isAuthenticated && !isLoginPage" />
  </div>
</template>

<script>
import DesktopPet from '@/components/DesktopPet/DesktopPet.vue'
import { getToken } from '@/api/config'

export default {
  name: 'App',
  components: {
    DesktopPet
  },
  computed: {
    // 检查是否已登录（有token）
    isAuthenticated() {
      return !!getToken()
    },
    // 检查当前是否在登录页面
    isLoginPage() {
      return this.$route.path === '/login'
    }
  }
}
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

#app {
  min-height: 100vh;
}
</style>