<template>
  <div class="study-room-view">
    <!-- 顶部导航栏 -->
    <nav class="navbar">
      <div class="nav-brand">Tomato</div>
      <div class="nav-links">
        <a class="nav-link" @click="goToHome">返回首页</a>
      </div>
    </nav>

    <!-- 自习室主要内容 -->
    <main class="study-room-content">
      <!-- 左侧：自习室信息和成员列表 -->
      <div class="room-info-section">
        <!-- 自习室基本信息 -->
        <div class="room-basic-info">
          <div class="room-header">
            <h1 class="room-name">{{ roomInfo.name }}</h1>
            <div class="room-id">房间号：{{ roomInfo.id }}</div>
          </div>
          
          <div class="room-details">
            <div class="detail-item">
              <label class="detail-label">简介：</label>
              <span class="detail-content">{{ roomInfo.description }}</span>
            </div>
            <div class="detail-item">
              <label class="detail-label">音质：</label>
              <div class="audio-quality-selector">
                <select v-model="roomInfo.audioQuality" class="quality-select">
                  <option value="standard">标准音质</option>
                  <option value="high">高清音质</option>
                  <option value="super">超清音质</option>
                  <option value="lossless">无损音质</option>
                </select>
                <span class="select-arrow">↓</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 成员状态表格 -->
        <div class="members-section">
          <div class="section-header">
            <h2 class="section-title">成员状态</h2>
            <div class="room-status">{{ roomInfo.status }}</div>
          </div>
          
          <div class="members-table">
            <!-- 专注中区域 -->
            <div class="focusing-section">
              <div class="status-header focusing">
                <span class="status-icon">🎯</span>
                <span class="status-text">专注中</span>
                <span class="member-count">{{ focusingMembers.length }}人</span>
              </div>
              <div class="members-grid">
                <div 
                  v-for="member in focusingMembers" 
                  :key="member.id"
                  class="member-card focusing"
                >
                  <div class="member-avatar">{{ member.avatar }}</div>
                  <div class="member-info">
                    <div class="member-name">{{ member.name }}</div>
                    <div class="focus-time">{{ member.focusTime }}</div>
                  </div>
                  <div class="member-tag">已专注→创新</div>
                </div>
              </div>
            </div>

            <!-- 休息中区域 -->
            <div class="resting-section">
              <div class="status-header resting">
                <span class="status-icon">☕</span>
                <span class="status-text">休息中</span>
                <span class="member-count">{{ restingMembers.length }}人</span>
              </div>
              <div class="members-grid">
                <div 
                  v-for="member in restingMembers" 
                  :key="member.id"
                  class="member-card resting"
                >
                  <div class="member-avatar">{{ member.avatar }}</div>
                  <div class="member-info">
                    <div class="member-name">{{ member.name }}</div>
                    <div class="rest-time">{{ member.restTime }}</div>
                  </div>
                  <div class="member-tag">已专注→创新</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧：操作按钮区域 -->
      <div class="action-section">
        <div class="action-card">
          <div class="action-header">
            <div class="action-icon">⏱️</div>
            <h3 class="action-title">专注控制</h3>
          </div>
          
          <div class="focus-controls">
            <button 
              v-if="!userStatus.isFocusing"
              @click="startFocus"
              class="focus-btn start-focus"
            >
              <span class="btn-icon">🚀</span>
              立即开始专注
            </button>
            <button 
              v-else
              @click="stopFocus"
              class="focus-btn stop-focus"
            >
              <span class="btn-icon">⏸️</span>
              结束专注
            </button>
            
            <div v-if="userStatus.isFocusing" class="focus-timer">
              <div class="timer-display">{{ userStatus.focusTime }}</div>
              <div class="timer-label">已专注时间</div>
            </div>
          </div>

          <div class="room-actions">
            <button @click="leaveRoom" class="action-btn leave-btn">
              <span class="btn-icon">🚪</span>
              退出房间
            </button>
          </div>

          <div class="room-stats">
            <div class="stat-item">
              <div class="stat-value">{{ roomInfo.totalMembers }}</div>
              <div class="stat-label">总成员</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">{{ roomInfo.onlineMembers }}</div>
              <div class="stat-label">在线</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">{{ roomInfo.focusingMembers }}</div>
              <div class="stat-label">专注中</div>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script>
export default {
  name: 'StudyRoomView',
  data() {
    return {
      roomInfo: {
        name: '考研数学冲刺小组',
        id: 'X8K9P2',
        description: '专注数学学习，互相监督进步',
        audioQuality: 'high',
        status: '运行中',
        totalMembers: 8,
        onlineMembers: 6,
        focusingMembers: 4
      },
      userStatus: {
        isFocusing: false,
        focusTime: '00:00:00',
        focusStartTime: null
      },
      members: [
        { id: 1, name: '用户1', avatar: '👨', status: 'focusing', focusTime: '01:23:45' },
        { id: 2, name: '用户2', avatar: '👩', status: 'focusing', focusTime: '00:45:30' },
        { id: 3, name: '用户3', avatar: '👦', status: 'resting', restTime: '休息中' },
        { id: 4, name: '用户4', avatar: '👧', status: 'focusing', focusTime: '02:15:20' },
        { id: 5, name: '用户5', avatar: '🧑', status: 'focusing', focusTime: '00:30:15' },
        { id: 6, name: '用户6', avatar: '🧒', status: 'resting', restTime: '休息中' }
      ],
      focusTimer: null
    }
  },
  computed: {
    focusingMembers() {
      return this.members.filter(member => member.status === 'focusing')
    },
    restingMembers() {
      return this.members.filter(member => member.status === 'resting')
    }
  },
  methods: {
    // 开始专注
    startFocus() {
      this.userStatus.isFocusing = true
      this.userStatus.focusStartTime = new Date()
      this.startFocusTimer()
      
      // 更新用户状态到专注中
      const currentUser = this.members.find(member => member.name === '当前用户')
      if (currentUser) {
        currentUser.status = 'focusing'
        currentUser.focusTime = '00:00:00'
      }
    },
    
    // 结束专注
    stopFocus() {
      this.userStatus.isFocusing = false
      this.stopFocusTimer()
      
      // 更新用户状态到休息中
      const currentUser = this.members.find(member => member.name === '当前用户')
      if (currentUser) {
        currentUser.status = 'resting'
        currentUser.restTime = '休息中'
      }
    },
    
    // 专注计时器
    startFocusTimer() {
      this.focusTimer = setInterval(() => {
        if (this.userStatus.focusStartTime) {
          const now = new Date()
          const diff = now - this.userStatus.focusStartTime
          const hours = Math.floor(diff / 3600000)
          const minutes = Math.floor((diff % 3600000) / 60000)
          const seconds = Math.floor((diff % 60000) / 1000)
          
          this.userStatus.focusTime = 
            `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
        }
      }, 1000)
    },
    
    stopFocusTimer() {
      if (this.focusTimer) {
        clearInterval(this.focusTimer)
        this.focusTimer = null
      }
    },
    
    // 退出房间
    leaveRoom() {
      if (confirm('确定要退出自习室吗？')) {
        this.stopFocusTimer()
        this.goToHome()
      }
    },
    
    // 返回首页
    goToHome() {
      this.$router.push('/')
    }
  },
  beforeUnmount() {
    this.stopFocusTimer()
  }
}
</script>

<style scoped>
.study-room-view {
  min-height: 100vh;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
}

/* 导航栏样式 */
.navbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 5%;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid #dee2e6;
  position: sticky;
  top: 0;
  z-index: 100;
}

.nav-brand {
  font-size: 1.8em;
  font-weight: bold;
  color: #eeaa67;
}

.nav-links {
  display: flex;
  gap: 30px;
}

.nav-link {
  cursor: pointer;
  padding: 10px 20px;
  border-radius: 8px;
  transition: all 0.3s ease;
  color: #333;
  font-weight: 500;
}

.nav-link:hover {
  background-color: #fff5eb;
  color: #eeaa67;
  transform: translateY(-1px);
}

/* 主要内容布局 */
.study-room-content {
  display: grid;
  grid-template-columns: 1fr 350px;
  gap: 30px;
  max-width: 1400px;
  margin: 0 auto;
  padding: 30px 5%;
}

/* 左侧信息区域 */
.room-info-section {
  display: flex;
  flex-direction: column;
  gap: 30px;
}

.room-basic-info {
  background: white;
  border-radius: 16px;
  padding: 30px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border: 1px solid #e9ecef;
}

.room-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
}

.room-name {
  font-size: 2.2em;
  color: #333;
  font-weight: 700;
  margin: 0;
  background: linear-gradient(135deg, #eeaa67, #ff8c42);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.room-id {
  background: #f8f9fa;
  padding: 8px 16px;
  border-radius: 20px;
  color: #666;
  font-size: 0.9em;
  font-weight: 500;
}

.room-details {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.detail-item {
  display: flex;
  align-items: center;
  gap: 16px;
}

.detail-label {
  font-weight: 600;
  color: #333;
  min-width: 60px;
}

.detail-content {
  color: #666;
  flex: 1;
}

.audio-quality-selector {
  position: relative;
  display: inline-block;
}

.quality-select {
  padding: 10px 40px 10px 16px;
  border: 2px solid #e9ecef;
  border-radius: 8px;
  background: white;
  color: #333;
  font-size: 1em;
  cursor: pointer;
  appearance: none;
  min-width: 150px;
}

.quality-select:focus {
  outline: none;
  border-color: #eeaa67;
}

.select-arrow {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  pointer-events: none;
  color: #666;
}

/* 成员状态区域 */
.members-section {
  background: white;
  border-radius: 16px;
  padding: 30px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border: 1px solid #e9ecef;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.section-title {
  font-size: 1.6em;
  color: #333;
  font-weight: 600;
  margin: 0;
}

.room-status {
  background: #28a745;
  color: white;
  padding: 6px 16px;
  border-radius: 20px;
  font-size: 0.9em;
  font-weight: 500;
}

.members-table {
  display: flex;
  flex-direction: column;
  gap: 30px;
}

.status-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 0;
  border-bottom: 2px solid;
  margin-bottom: 16px;
}

.status-header.focusing {
  border-color: #eeaa67;
}

.status-header.resting {
  border-color: #6c757d;
}

.status-icon {
  font-size: 1.4em;
}

.status-text {
  font-size: 1.2em;
  font-weight: 600;
  color: #333;
}

.member-count {
  background: #f8f9fa;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 0.9em;
  color: #666;
  margin-left: auto;
}

.members-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.member-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  border-radius: 12px;
  transition: all 0.3s ease;
}

.member-card.focusing {
  background: #fff9f2;
  border: 1px solid #ffe4cc;
}

.member-card.resting {
  background: #f8f9fa;
  border: 1px solid #e9ecef;
}

.member-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.member-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, #eeaa67, #f5b877);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2em;
}

.member-info {
  flex: 1;
}

.member-name {
  font-weight: 600;
  color: #333;
  margin-bottom: 4px;
}

.focus-time,
.rest-time {
  font-size: 0.85em;
  color: #666;
}

.member-tag {
  background: #e7f3ff;
  color: #1971c2;
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 0.8em;
  font-weight: 500;
}

/* 右侧操作区域 */
.action-section {
  position: sticky;
  top: 100px;
  height: fit-content;
}

.action-card {
  background: white;
  border-radius: 16px;
  padding: 30px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border: 1px solid #e9ecef;
}

.action-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 24px;
}

.action-icon {
  font-size: 1.8em;
}

.action-title {
  font-size: 1.4em;
  color: #333;
  font-weight: 600;
  margin: 0;
}

.focus-controls {
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin-bottom: 30px;
}

.focus-btn {
  padding: 16px 24px;
  border: none;
  border-radius: 12px;
  font-size: 1.1em;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.start-focus {
  background: linear-gradient(135deg, #eeaa67, #f5b877);
  color: white;
  box-shadow: 0 4px 15px rgba(238, 170, 103, 0.3);
}

.start-focus:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(238, 170, 103, 0.4);
}

.stop-focus {
  background: #6c757d;
  color: white;
}

.stop-focus:hover {
  background: #5a6268;
  transform: translateY(-2px);
}

.focus-timer {
  text-align: center;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 12px;
}

.timer-display {
  font-size: 2em;
  font-weight: 700;
  color: #eeaa67;
  font-family: 'Courier New', monospace;
}

.timer-label {
  color: #666;
  font-size: 0.9em;
  margin-top: 8px;
}

.room-actions {
  margin-bottom: 25px;
}

.action-btn {
  width: 100%;
  padding: 14px 20px;
  border: 2px solid #e9ecef;
  border-radius: 10px;
  background: white;
  color: #666;
  font-size: 1em;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.leave-btn:hover {
  background: #fff5f5;
  border-color: #ff6b6b;
  color: #ff6b6b;
  transform: translateY(-1px);
}

.room-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  padding-top: 20px;
  border-top: 1px solid #e9ecef;
}

.stat-item {
  text-align: center;
}

.stat-value {
  font-size: 1.8em;
  font-weight: 700;
  color: #eeaa67;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 0.85em;
  color: #666;
}

/* 响应式设计 */
@media (max-width: 1024px) {
  .study-room-content {
    grid-template-columns: 1fr;
    gap: 20px;
  }
  
  .action-section {
    position: static;
  }
}

@media (max-width: 768px) {
  .study-room-content {
    padding: 20px;
  }
  
  .room-header {
    flex-direction: column;
    gap: 12px;
  }
  
  .section-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  
  .members-grid {
    grid-template-columns: 1fr;
  }
  
  .room-stats {
    grid-template-columns: repeat(3, 1fr);
  }
}
</style>