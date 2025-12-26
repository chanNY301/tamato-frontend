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
import { setUserOffline, getCurrentUser } from '@/api/user'
import { getUserIdFromToken } from '@/utils/jwt'

export default {
  name: 'App',
  components: {
    DesktopPet
  },
  data() {
    return {
      currentUserId: null,
      // 用于 beforeunload 事件的闭包变量，避免 sessionStorage 被覆盖的问题
      windowUserId: null,
      // 标记是否已经发送过离线请求，防止重复发送
      offlineRequestSent: false
    }
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
  },
  async mounted() {
    // 初始化当前用户ID，然后再绑定页面关闭事件
    await this.initCurrentUser()
    this.setupPageUnloadHandler()
    
    // 监听路由变化，确保在登录后重新获取用户ID
    this.$watch('$route', async (to, from) => {
      // 如果从非登录页跳转到登录页，清除用户ID
      if (to.path === '/login') {
        this.currentUserId = null
      }
      // 如果从登录页跳转到其他页面，重新获取用户ID
      else if (from.path === '/login' && this.isAuthenticated && !this.currentUserId) {
        await this.initCurrentUser()
      }
    })
  },
  methods: {
    async initCurrentUser() {
      if (!this.isAuthenticated) {
        this.currentUserId = null
        this.windowUserId = null
        return
      }
      try {
        const response = await getCurrentUser()
        const data = response?.data || response
        // 兼容多种字段名
        this.currentUserId =
          data?.userId || data?.user_id || data?.id || null
        // 同时保存到闭包变量，避免 sessionStorage 被其他标签页覆盖
        this.windowUserId = this.currentUserId
        console.log('App 初始化当前用户ID:', this.currentUserId)
      } catch (error) {
        console.error('初始化当前用户信息失败:', error)
        this.currentUserId = null
        this.windowUserId = null
      }
    },

    setupPageUnloadHandler() {
      // 保存组件实例引用
      const self = this
      
      // 使用 beforeunload 事件监听页面关闭
      // 关键：直接从当前窗口的 token 解析 userId，不依赖任何共享状态
      window.addEventListener('beforeunload', () => {
        // 防止重复发送请求
        if (self.offlineRequestSent) {
          console.log('⚠️ beforeunload: 离线请求已发送，跳过重复请求')
          return
        }

        // 获取当前窗口的 token（每个窗口的 localStorage 是独立的）
        const token = getToken()
        if (!token) {
          console.log('⚠️ beforeunload: 没有 token，跳过离线更新')
          return
        }

        // 直接从 token 解析 userId（这是最可靠的方式，不依赖任何共享状态）
        const userId = getUserIdFromToken(token)
        
        console.log('🔔 beforeunload 事件触发 [窗口ID:', window.name || 'unnamed', ']:', {
          userId: userId,
          tokenPreview: token ? token.substring(0, 20) + '...' : null,
          hasToken: !!token,
          windowName: window.name,
          windowLocation: window.location.href
        })
        
        // 如果成功解析到 userId，更新状态为离线
        if (userId) {
          // 标记已发送，防止重复
          self.offlineRequestSent = true
          
          console.log('✅ beforeunload: 准备更新离线状态', { 
            userId,
            windowId: window.name || 'unnamed'
          })
          
          setUserOffline(userId).then(() => {
            console.log('✅ 离线状态更新请求已发送:', userId)
          }).catch((err) => {
            // 静默处理错误，避免阻塞页面关闭
            console.log('❌ 更新离线状态失败（页面已关闭）:', err)
          })
        } else {
          console.log('⚠️ beforeunload: 无法从 token 解析 userId，跳过离线更新')
        }
      })

      // 使用 visibilitychange 事件监听页面隐藏（切换标签页、最小化等）
      // 注意：这里不更新为离线，因为用户可能只是切换标签页
      // 只在真正关闭页面时才更新为离线
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