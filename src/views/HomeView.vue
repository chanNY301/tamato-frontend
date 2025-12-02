<template>
  <div class="home-container">
    <nav class="navbar">
      <div class="nav-brand">Tomato</div>
      <div class="nav-links">
        <a class="nav-link" @click="goToFriends">好友</a>
        <a class="nav-link" @click="goToTaskManagement">任务管理</a>
        <a class="nav-link" @click="goToProfile">个人中心</a>
      </div>
      <div class="user-avatar-container">
        <div 
          class="user-avatar" 
          @mouseenter="showDropdown = true"
          @mouseleave="handleAvatarLeave"
        >
          <img :src="avatarImage" alt="用户头像" />
        </div>
        <div 
          v-show="showDropdown" 
          class="dropdown-menu"
          @mouseenter="handleDropdownEnter"
          @mouseleave="handleDropdownLeave"
        >
          <div class="dropdown-item" @click="toggleTheme">
            <span class="dropdown-icon">🎨</span>
            主题设置
          </div>
          <div class="dropdown-item" @click="logout">
            <span class="dropdown-icon">🚪</span>
            退出登录
          </div>
        </div>
      </div>
    </nav>

    <main class="main-grid">
      <aside class="friends-list-area">
        <FriendList />
      </aside>

      <section class="content-area">
        <div class="poster-carousel">
          <div class="poster-slide">
            <img :src="currentPoster" alt="宣传海报" class="poster-image" />
          </div>
          <button class="carousel-arrow left-arrow" @click="prevPoster">‹</button>
          <button class="carousel-arrow right-arrow" @click="nextPoster">›</button>
          
          <div class="carousel-indicators">
            <span 
              v-for="(poster, index) in posters" 
              :key="index"
              :class="['indicator', { active: currentPosterIndex === index }]"
              @click="switchPoster(index)"
            ></span>
          </div>
        </div>

        <div class="quick-join">
          <QuickJoin 
            :limit="5" 
            :auto-refresh="true"
            :refresh-interval="60000"
            @join-room="handleJoinRoom"
          />
        </div>
      </section>

      <aside class="right-sidebar">
        <div class="sticky-buttons">
          <button class="btn-primary" @click="createRoom">
            <span class="btn-icon"></span>
            创建自习室
          </button>
          <button class="btn-secondary" @click="joinRoom">
            <span class="btn-icon"></span>
            加入自习室
          </button>
        </div>
        
        <TaskSidebar @task-status-changed="handleTaskStatusChange" />
      </aside>
    </main>
  </div>
</template>

<script>
// 只导入头像，海报改为动态导入
import avatarImage from '@/assets/images/avatar.png'
// 添加任务侧边栏组件
import TaskSidebar from '@/components/TaskSidebar/TaskSidebar.vue'
// 导入快速加入组件
import QuickJoin from '@/components/QuickJoin/QuickJoin.vue'
// 【新增】导入 FriendList 组件
import FriendList from '@/components/FriendList/FriendList.vue'

export default {
  name: 'HomeView',
  components: {
    // 【新增】注册 FriendList 组件
    FriendList,
    TaskSidebar,
    QuickJoin
  },
  data() {
    return {
      // 使用导入的图片
      avatarImage: avatarImage,
      
      // 下拉菜单显示状态
      showDropdown: false,
      dropdownTimer: null,
      
      // 海报轮播数据 - 初始为空数组，将在created钩子中动态加载
      posters: [],
      currentPosterIndex: 0,
      
      // 快速加入房间的假数据
      quickJoinRooms: [
        { id: 1, name: '考研数学冲刺', members: 15, status: '专注中' },
        { id: 2, name: '英语阅读小组', members: 8, status: '空闲' },
        { id: 3, name: '深夜代码角', members: 25, status: '专注中' },
        { id: 4, name: '物理学习室', members: 12, status: '空闲' },
        { id: 5, name: '历史讨论组', members: 6, status: '空闲' },
        { id: 6, name: '编程自习班', members: 18, status: '专注中' },
        { id: 7, name: '化学实验室', members: 9, status: '空闲' },
        { id: 8, name: '文学创作间', members: 11, status: '专注中' },
        { id: 9, name: '医学考研组', members: 20, status: '专注中' },
        { id: 10, name: '法律自习室', members: 7, status: '空闲' }
      ]
    }
  },
  computed: {
    // 当前显示的海报
    currentPoster() {
      return this.posters.length > 0 ? this.posters[this.currentPosterIndex] : ''
    }
  },
  created() {
    // 组件创建时动态加载海报
    this.loadPosters()
  },
  methods: {
    // 动态加载海报图片
    async loadPosters() {
      try {
        // 海报文件数量 - 根据你的文件列表，有6个海报
        const posterCount = 6
        
        // 使用 Promise.all 并行加载所有海报
        const posterPromises = []
        
        for (let i = 1; i <= posterCount; i++) {
          // 动态导入海报图片
          const posterPromise = import(`@/assets/images/poster${i}.jpg`)
            .then(module => module.default)
            .catch(error => {
              console.warn(`无法加载海报 poster${i}.jpg:`, error)
              return null
            })
          posterPromises.push(posterPromise)
        }
        
        // 等待所有图片加载完成
        const loadedPosters = await Promise.all(posterPromises)
        
        // 过滤掉加载失败的图片
        this.posters = loadedPosters.filter(poster => poster !== null)
        
        console.log(`成功加载 ${this.posters.length} 张海报`)
        
      } catch (error) {
        console.error('加载海报时出错:', error)
        this.posters = [] // 确保posters始终是数组
      }
    },
    
    // 鼠标从头像移出
    handleAvatarLeave() {
      // 短暂延迟，让用户有时间移动到下拉菜单
      this.dropdownTimer = setTimeout(() => {
        this.showDropdown = false
      }, 150)
    },
    
    // 鼠标进入下拉菜单
    handleDropdownEnter() {
      // 取消隐藏计时器
      if (this.dropdownTimer) {
        clearTimeout(this.dropdownTimer)
      }
    },
    
    // 鼠标从下拉菜单移出
    handleDropdownLeave() {
      // 立即隐藏下拉菜单
      this.showDropdown = false
    },
    
    // 切换主题
    toggleTheme() {
      alert('主题设置功能待实现')
      this.showDropdown = false
    },
    
    // 退出登录 - 跳转到登录页面
    logout() {
      if (confirm('确定要退出登录吗？')) {
        this.$router.push('/login')
      }
    },
    
    // 跳转到好友界面（预留）
    goToFriends() {
      alert('好友功能正在开发中...')
      // this.$router.push('/friends') // 预留跳转逻辑
    },
    
    // 跳转到任务管理界面
    goToTaskManagement() {
      this.$router.push('/task-management')
    },
    
    // 跳转到个人中心（预留）
    goToProfile() {
      //alert('个人中心功能正在开发中...')
      this.$router.push('/personal-center') // 预留跳转逻辑
    },
    
    // 海报轮播方法
    nextPoster() {
      if (this.posters.length === 0) return
      this.currentPosterIndex = (this.currentPosterIndex + 1) % this.posters.length
    },
    prevPoster() {
      if (this.posters.length === 0) return
      this.currentPosterIndex = (this.currentPosterIndex - 1 + this.posters.length) % this.posters.length
    },
    switchPoster(index) {
      if (this.posters.length === 0) return
      this.currentPosterIndex = index
    },
    
    // 创建自习室
    createRoom() {
      this.$router.push('/create-room')
    },
    
    // 加入自习室
    joinRoom() {
      this.$router.push('/join-room')
    },
    
    quickJoin(roomId) {
      alert(`快速加入房间 ${roomId} - 功能待实现`)
    },

    handleTaskStatusChange(data) {
      console.log('任务状态改变:', data)
      // 可以在这里处理任务状态改变的逻辑
      // 例如：显示提示、更新其他数据等
    },

    handleJoinRoom(roomId) {
      console.log('加入房间:', roomId)
      // 跳转到自习室页面
      this.$router.push({
        name: 'study-room',
        params: { roomId: roomId }
      })
    }
  }
}
</script>

<style scoped>
/* 整体容器 */
.home-container {
  min-height: 100vh;
  background-color: #fefaf5; /* 浅橘黄色背景 */
}

/* 顶部导航栏 (保持不变) */
.navbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 20px;
  background: white;
  border-bottom: 1px solid #ffe4cc; /* 橘黄色边框 */
  position: sticky;
  top: 0;
  z-index: 100;
}

.nav-brand {
  font-size: 1.5em;
  font-weight: bold;
  color: #eeaa67; /* 橘黄色品牌色 */
}

.nav-links {
  display: flex;
  gap: 30px;
}

.nav-link {
  cursor: pointer;
  padding: 8px 12px;
  border-radius: 6px;
  transition: background-color 0.2s;
  color: #333;
}

.nav-link:hover {
  background-color: #fff5eb; /* 浅橘黄色悬停背景 */
  color: #eeaa67; /* 橘黄色文字 */
}

/* 用户头像 */
.user-avatar:hover img {
  border-color: #eeaa67; /* 橘黄色边框 */
  transform: scale(1.05);
}

/* 下拉菜单样式 */
.dropdown-item:hover {
  background-color: #fff5eb; /* 浅橘黄色悬停背景 */
}

/* ============================
   主要内容网格区域 (修改 grid-template-columns)
   ============================ */
.main-grid {
  display: grid;
  /* 调整列宽：左侧好友列表 280px，中央内容 1fr，右侧边栏 300px */
  grid-template-columns: 280px 1fr 300px; 
  gap: 20px;
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
}

/* ============================
   左侧好友列表区域 (原 widgets-area)
   ============================ */
/* 统一类名并去除原有占位符样式 */
.friends-list-area { 
  /* 继承 FriendList.vue 中的样式 */
  display: flex;
  flex-direction: column;
  gap: 15px;
  height: fit-content;
  position: sticky;
  top: 100px;
}

/* 移除原有的 widget-placeholder 样式，现在由 FriendList 组件内部处理 */

/* 海报轮播 (保持不变) */
.poster-carousel {
  position: relative;
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 8px rgba(238, 170, 103, 0.1); /* 橘黄色阴影 */
  border: 1px solid #ffe4cc; /* 橘黄色边框 */
}

.poster-slide {
  height: 400px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #fef6f0 0%, #ffe4cc 100%); /* 橘黄色渐变背景 */
}

/* 快速加入区域 (保持不变) */
.quick-join {
  background: white;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(238, 170, 103, 0.1); /* 橘黄色阴影 */
  border: 1px solid #ffe4cc; /* 橘黄色边框 */
}

/* 右侧边栏按钮 (保持不变) */
.btn-primary {
  background: linear-gradient(135deg, #eeaa67, #f5b877); /* 橘黄色渐变 */
  color: white;
}

.btn-secondary {
  background: white;
  color: #eeaa67; /* 橘黄色文字 */
  border: 2px solid #eeaa67; /* 橘黄色边框 */
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(238, 170, 103, 0.4); /* 橘黄色阴影 */
}

.btn-secondary:hover {
  background: #eeaa67; /* 橘黄色背景 */
  color: white;
}

.sidebar-placeholder {
  background: white;
  padding: 20px;
  border-radius: 10px;
  box-shadow: 0 2px 4px rgba(238, 170, 103, 0.1); /* 橘黄色阴影 */
  text-align: center;
  border: 1px solid #ffe4cc; /* 橘黄色边框 */
}

/* 其他样式保持不变 (确保没有多余的旧样式残留) */
/* ... (原 HomeView.vue 中的其他样式保持不变) ... */

.user-avatar-container {
  position: relative;
}

.user-avatar {
  cursor: pointer;
}

.user-avatar img {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 2px solid #e0e0e0;
  object-fit: cover;
  transition: all 0.3s ease;
}

.dropdown-menu {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 8px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  min-width: 150px;
  z-index: 1000;
  border: 1px solid #e0e0e0;
  overflow: hidden;
  animation: dropdownFade 0.2s ease;
}

@keyframes dropdownFade {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.dropdown-item {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  cursor: pointer;
  transition: background-color 0.2s;
  border-bottom: 1px solid #f0f0f0;
}

.dropdown-item:last-child {
  border-bottom: none;
}

.dropdown-icon {
  margin-right: 10px;
  font-size: 1.1em;
}

.content-area {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.poster-image {
  max-width: 90%;
  max-height: 90%;
  object-fit: contain;
  border-radius: 8px;
}

.carousel-arrow {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  background: rgba(0,0,0,0.5);
  color: white;
  border: none;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  cursor: pointer;
  font-size: 1.5em;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.3s;
}

.left-arrow {
  left: 15px;
}

.right-arrow {
  right: 15px;
}

.carousel-arrow:hover {
  background: rgba(0,0,0,0.7);
}

.carousel-indicators {
  position: absolute;
  bottom: 15px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 8px;
}

.indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.5);
  cursor: pointer;
  transition: all 0.3s ease;
}

.indicator.active {
  background: white;
  transform: scale(1.2);
}

.indicator:hover {
  background: rgba(255, 255, 255, 0.8);
}

.quick-join h3 {
  margin: 0 0 15px 0;
  color: #333;
}

.quick-join-list {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
  max-height: 400px;
  overflow-y: auto;
  padding-right: 8px;
}

.quick-join-list::-webkit-scrollbar {
  width: 6px;
}

.quick-join-list::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.quick-join-list::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.quick-join-list::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

.quick-join-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  transition: all 0.2s;
}

.quick-join-item:hover {
  border-color: #eeaa67; /* 橘黄色边框 */
  background: #fffaf5; /* 浅橘黄色背景 */
}

.room-avatar {
  font-size: 1.5em;
}

.room-info {
  flex-grow: 1;
}

.room-name {
  font-weight: bold;
  margin-bottom: 4px;
}

.room-stats {
  font-size: 0.8em;
  color: #666;
}

.join-btn {
  padding: 6px 12px;
  background: #eeaa67; /* 橘黄色按钮 */
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9em;
  transition: background-color 0.2s;
}

.join-btn:hover {
  background: #e69c55; /* 深橘黄色 */
}

.right-sidebar {
  position: sticky;
  top: 100px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  z-index: 90;
  height: fit-content;
}

.sticky-buttons {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.sticky-buttons button {
  padding: 15px;
  border: none;
  border-radius: 10px;
  font-size: 1.1em;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

/* 响应式设计 (更新 grid-template-columns) */
@media (max-width: 1024px) {
  /* 调整为左侧 250px，中央 1fr */
  .main-grid {
    grid-template-columns: 250px 1fr;
  }
  .right-sidebar {
    display: none;
  }
}

@media (max-width: 768px) {
  .main-grid {
    grid-template-columns: 1fr;
    gap: 15px;
  }
  .friends-list-area {
    /* 在小屏上隐藏左侧好友列表 */
    display: none;
  }
}
</style>