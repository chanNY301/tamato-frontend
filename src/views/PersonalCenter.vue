<template>
  <div class="personal-center">
    <!-- 顶部导航栏 -->
    <nav class="top-navbar">
      <div class="nav-back" @click="goBack">
        <span class="back-arrow">←</span>
        返回首页
      </div>
      <div class="nav-title">个人中心</div>
      <div class="nav-placeholder"></div>
    </nav>

    <!-- 主要内容区域 -->
    <div class="main-content">
      <!-- 左侧边栏 -->
      <aside class="sidebar">
        <!-- 用户信息 -->
        <div class="user-info">
          <div class="avatar-container">
            <img :src="avatarImage" alt="用户头像" class="avatar" />
          </div>
          <div class="user-id">ID: {{ userId }}</div>
        </div>

        <!-- 导航菜单 -->
        <nav class="side-nav">
          <div
            v-for="item in navItems"
            :key="item.key"
            :class="['nav-item', { active: activeNav === item.key }]"
            @click="switchNav(item.key)"
          >
            <!-- <span class="nav-icon">{{ item.icon }}</span> -->
            <span class="nav-text">{{ item.text }}</span>
          </div>
        </nav>
      </aside>

      <!-- 右侧内容区域 -->
      <main class="content-area">
        <div class="content-header">
          <h2>{{ currentNavText }}</h2>
        </div>
        
        <div class="content-body">
          <!-- 根据当前选中的导航显示不同内容 -->
          <div v-if="activeNav === 'profile'" class="tab-content">
            <div class="placeholder-content">
              <h3>个人资料</h3>
              <p>开发中</p>
            </div>
          </div>
          
          <div v-else-if="activeNav === 'statistics'" class="tab-content">
            <div class="placeholder-content">
              <h3>专注统计</h3>
              <p>开发中</p>
            </div>
          </div>
          
          <div v-else-if="activeNav === 'settings'" class="tab-content">
            <div class="placeholder-content">
              <h3>设置</h3>
              <p>开发中</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  </div>
</template>

<script>
import avatarImage from '@/assets/images/avatar.png'

export default {
  name: 'PersonalCenter',
  data() {
    return {
      avatarImage: avatarImage,
      userId: '100001',
      activeNav: 'profile', // 默认选中个人资料
      navItems: [
        { key: 'profile', text: '个人资料' },
        { key: 'statistics', text: '专注统计' },
        { key: 'settings', text: '设置' }
      ]
    }
  },
  computed: {
    // 当前选中导航的显示文本
    currentNavText() {
      const item = this.navItems.find(item => item.key === this.activeNav)
      return item ? item.text : '个人中心'
    }
  },
  methods: {
    // 返回首页
    goBack() {
      this.$router.push('/')
    },
    
    // 切换导航
    switchNav(navKey) {
      this.activeNav = navKey
    }
  }
}
</script>

<style scoped>
.personal-center {
  min-height: 100vh;
  background-color: #f8f9fa;
}

/* 顶部导航栏 */
.top-navbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 20px;
  background: white;
  border-bottom: 1px solid #e0e0e0;
  position: sticky;
  top: 0;
  z-index: 100;
}

.nav-back {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  color: #cc2a1f;
  font-weight: 500;
  padding: 8px 12px;
  border-radius: 6px;
  transition: background-color 0.2s;
}

.nav-back:hover {
  background-color: #f0f0f0;
}

.back-arrow {
  font-size: 1.2em;
}

.nav-title {
  font-size: 1.3em;
  font-weight: bold;
  color: #333;
}

.nav-placeholder {
  width: 80px;
}

/* 主要内容布局 */
.main-content {
  display: flex;
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  gap: 20px;
  min-height: calc(100vh - 80px);
}

/* 左侧边栏 */
.sidebar {
  width: 280px;
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  height: fit-content;
  position: sticky;
  top: 100px;
}

/* 用户信息 */
.user-info {
  text-align: center;
  padding-bottom: 20px;
  border-bottom: 1px solid #f0f0f0;
  margin-bottom: 20px;
}

.avatar-container {
  margin-bottom: 12px;
}

.avatar {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  border: 3px solid #cc2a1f;
  object-fit: cover;
  background: #f8f9fa;
}

.user-id {
  color: #666;
  font-size: 0.9em;
  font-weight: 500;
}

/* 侧边导航 */
.side-nav {
  display: flex;
  flex-direction: column;
  gap: 4px;
  align-items: center;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
  background: none;
  text-align: center;
  justify-content: center;
  width: 100%;
  max-width: 200px;
}

.nav-item:hover {
  background: #f8f9ff;
  color: #cc2a1f;
}

.nav-item.active {
  background: #cc2a1f;
  color: white;
}

/* .nav-icon {
  font-size: 1.1em;
  width: 20px;
  text-align: center;
} */

.nav-text {
  font-weight: 500;
  text-align: center;
  width: 100%;
}

/* 右侧内容区域 */
.content-area {
  flex: 1;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  overflow: hidden;
}

.content-header {
  padding: 20px 24px;
  border-bottom: 1px solid #f0f0f0;
  background: #fafafa;
}

.content-header h2 {
  margin: 0;
  color: #333;
  font-size: 1.5em;
}

.content-body {
  padding: 30px;
  min-height: 400px;
}

/* 标签内容 */
.tab-content {
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.placeholder-content {
  text-align: center;
  color: #666;
  max-width: 400px;
  margin: 0 auto;
  padding: 40px 0;
}

.placeholder-content h3 {
  margin: 0 0 12px 0;
  color: #333;
  font-size: 1.3em;
}

.placeholder-content p {
  margin: 0 0 20px 0;
  line-height: 1.5;
}

.placeholder-icon {
  font-size: 4em;
  opacity: 0.7;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .main-content {
    flex-direction: column;
    padding: 15px;
  }
  
  .sidebar {
    width: 100%;
    position: static;
  }
  
  .content-body {
    padding: 20px;
  }
  
  .avatar {
    width: 80px;
    height: 80px;
  }
}
</style>