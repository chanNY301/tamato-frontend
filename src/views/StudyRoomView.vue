<template>
  <div class="study-room-view">
    <nav class="navbar">
      <div class="nav-brand">Tomato</div>
      <div class="nav-links">
        <a class="nav-link" @click="goToHome">返回首页</a>
      </div>
    </nav>

    <div v-if="loading" class="loading-container">
      <div class="loading-spinner"></div>
      <p>正在加载自习室数据...</p>
    </div>

    <main v-else class="study-room-content">
      <!-- 顶部房间名称 -->
      <div class="room-title-section">
        <h1 class="room-title">{{ roomInfo.room_name || '自习室' }}</h1>
        <div class="room-subtitle">房间号：{{ roomInfo.room_id }}</div>
      </div>

      <div class="main-layout">
        <!-- 左侧：自习室信息和成员列表 -->
        <div class="room-info-section">
          <div class="room-basic-info">
            <div class="info-header">
              <h2 class="info-title">自习室信息</h2>
              <button 
                v-if="isRoomOwner" 
                @click="showRoomSettings" 
                class="settings-btn"
              >
                设置
              </button>
            </div>
            
            <div class="room-details">
              <div class="detail-item">
                <label class="detail-label">创建者：</label>
                <span class="detail-content">{{ roomInfo.create_person }}</span>
              </div>
              <div class="detail-item">
                <label class="detail-label">最大人数：</label>
                <span class="detail-content">{{ roomInfo.max_members }}人</span>
              </div>
              <div class="detail-item">
                <label class="detail-label">背景音乐：</label>
                <span class="detail-content">{{ roomInfo.music_name }}</span>
              </div>
              <div class="detail-item">
                <label class="detail-label">房间状态：</label>
                <span class="detail-content">{{ roomInfo.status || '运行中' }}</span>
              </div>
            </div>
          </div>

          <!-- 成员状态表格 -->
          <div class="members-section">
            <div class="section-header">
              <h2 class="section-title">成员状态</h2>
              <span class="member-count-total">{{ members.length }}人在线</span>
            </div>
            
            <div class="members-table">
              <div class="focusing-section">
                <div class="status-header focusing">
                  <span class="status-text">专注中</span>
                  <span class="member-count">{{ focusingMembers.length }}人</span>
                </div>
                <div class="members-grid">
                  <div 
                    v-for="member in focusingMembers" 
                    :key="member.id"
                    class="member-card focusing"
                  >
                    <div class="member-avatar">
                      <div class="avatar-placeholder">
                        {{ getInitials(member.name) }}
                      </div>
                    </div>
                    <div class="member-info">
                      <div class="member-name">{{ member.name }}</div>
                      <div class="focus-time">{{ member.focusTime }}</div>
                    </div>
                    <div class="member-tag focusing-tag">专注中</div>
                  </div>
                </div>
              </div>

              <div class="resting-section">
                <div class="status-header resting">
                  <span class="status-text">休息中</span>
                  <span class="member-count">{{ restingMembers.length }}人</span>
                </div>
                <div class="members-grid">
                  <div 
                    v-for="member in restingMembers" 
                    :key="member.id"
                    class="member-card resting"
                  >
                    <div class="member-avatar">
                      <div class="avatar-placeholder">
                        {{ getInitials(member.name) }}
                      </div>
                    </div>
                    <div class="member-info">
                      <div class="member-name">{{ member.name }}</div>
                      <div class="rest-time">{{ member.restTime }}</div>
                    </div>
                    <div class="member-tag resting-tag">休息中</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 中间：番茄钟学习组件预留位置 -->
        <div class="study-tools-section">
          <div class="tools-header">
            <h2 class="tools-title">学习工具</h2>
          </div>
          
          <!-- 番茄钟组件预留位置 -->
          <div class="tomato-timer-placeholder">
            <div class="placeholder-content">
              <h3>番茄钟学习法</h3>
              <p>专注25分钟，休息5分钟</p>
              <div class="timer-controls">
                <button 
                  v-if="!userStatus.isFocusing"
                  @click="startTomatoTimer"
                  class="tomato-btn start-tomato"
                >
                  开始专注
                </button>
                <button 
                  v-else
                  @click="stopTomatoTimer"
                  class="tomato-btn stop-tomato"
                >
                  结束专注
                </button>
              </div>
            </div>
          </div>
          
          <!-- 其他学习工具预留位置 -->
          <div class="other-tools-placeholder">
            <p>其他学习工具开发中...</p>
          </div>
        </div>

        <!-- 右侧：操作按钮区域 -->
        <div class="action-section">
          <div class="action-card">
            <div class="action-header">
              <h3 class="action-title">房间操作</h3>
            </div>
            
            <div class="action-buttons">
              <button @click="leaveRoom" class="action-btn leave-btn">
                退出房间
              </button>
              
              <!-- 房主专属功能预留 -->
              <div v-if="isRoomOwner" class="owner-actions">
                <button @click="showRoomSettings" class="action-btn owner-btn">
                  房间设置
                </button>
                <button @click="manageMembers" class="action-btn owner-btn">
                  成员管理
                </button>
              </div>
            </div>

            <div class="room-stats">
              <div class="stat-item">
                <div class="stat-value">{{ roomInfo.max_members }}</div>
                <div class="stat-label">最大人数</div>
              </div>
              <div class="stat-item">
                <div class="stat-value">{{ members.length }}</div>
                <div class="stat-label">在线</div>
              </div>
              <div class="stat-item">
                <div class="stat-value">{{ focusingMembers.length }}</div>
                <div class="stat-label">专注中</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- 房间设置弹窗预留 -->
    <div v-if="showSettings" class="modal-overlay">
      <div class="settings-modal">
        <h3>房间设置</h3>
        <p>房间设置功能开发中...</p>
        <button @click="closeSettings">关闭</button>
      </div>
    </div>
  </div>
</template>

<script>
import { getRoomDetail, leaveRoom } from '@/api/studyRooms'

export default {
  name: 'StudyRoomView',
  data() {
    return {
      roomInfo: {
        room_id: '',
        room_name: '',
        create_person: '',
        max_members: 0,
        current_time: 0,
        end_time: 0,
        music_name: ''
      },
      userStatus: {
        isFocusing: false,
        focusTime: '00:00:00',
        focusStartTime: null
      },
      members: [],
      focusTimer: null,
      loading: true,
      updateInterval: null,
      showSettings: false,
      isRoomOwner: false
    }
  },
  computed: {
    roomId() {
      return this.$route.params.roomId
    },
    focusingMembers() {
      return this.members.filter(member => member.status === 'focusing')
    },
    restingMembers() {
      return this.members.filter(member => member.status === 'resting')
    }
  },
  async mounted() {
    await this.loadRoomData()
    this.updateInterval = setInterval(this.loadRoomData, 30000)
  },
  methods: {
    async loadRoomData() {
      try {
        this.loading = true
        
        const response = await getRoomDetail(this.roomId)
        
        if (response.code === 200 && response.data) {
          this.roomInfo = { ...response.data }
          this.isRoomOwner = this.checkIfRoomOwner()
          this.loadMembersData()
        } else {
          this.setDefaultRoomInfo()
        }
        
      } catch (error) {
        console.error('加载自习室数据时出错:', error)
        this.setDefaultRoomInfo()
      } finally {
        this.loading = false
      }
    },

    checkIfRoomOwner() {
      const currentUser = 'user_123'
      return this.roomInfo.create_person === currentUser
    },

    setDefaultRoomInfo() {
      this.roomInfo.room_id = this.roomId
      this.roomInfo.room_name = '自习室 ' + this.roomId
      this.roomInfo.create_person = '未知用户'
      this.roomInfo.max_members = 4
      this.roomInfo.music_name = '无背景音乐'
      this.roomInfo.current_time = 0
      this.roomInfo.end_time = Math.floor(Date.now() / 1000) + 7200
    },

    loadMembersData() {
      this.members = [
        { 
          id: 1, 
          name: this.roomInfo.create_person, 
          avatar: '',
          status: 'focusing', 
          focusTime: '01:23:45' 
        },
        { 
          id: 2, 
          name: '学习伙伴A', 
          avatar: '',
          status: 'focusing', 
          focusTime: '00:45:30' 
        },
        { 
          id: 3, 
          name: '学习伙伴B', 
          avatar: '',
          status: 'resting', 
          restTime: '休息中' 
        }
      ]
    },

    getInitials(name) {
      if (!name) return '?'
      return name.charAt(0).toUpperCase()
    },

    startTomatoTimer() {
      this.userStatus.isFocusing = true
      this.updateCurrentUserStatus('focusing')
    },
    
    stopTomatoTimer() {
      this.userStatus.isFocusing = false
      this.updateCurrentUserStatus('resting')
    },

    updateCurrentUserStatus(status) {
      let currentUser = this.members.find(member => member.name === '我')
      if (!currentUser) {
        currentUser = {
          id: Date.now(),
          name: '我',
          avatar: '',
          status: status
        }
        this.members.unshift(currentUser)
      } else {
        currentUser.status = status
      }
      
      if (status === 'focusing') {
        currentUser.focusTime = '进行中'
        currentUser.restTime = undefined
      } else {
        currentUser.restTime = '休息中'
        currentUser.focusTime = undefined
      }
    },

    showRoomSettings() {
      this.showSettings = true
    },

    closeSettings() {
      this.showSettings = false
    },

    manageMembers() {
      alert('成员管理功能开发中...')
    },

    async leaveRoom() {
      // 确认对话框
      const userConfirmed = confirm('确定要退出自习室吗？')
      if (!userConfirmed) {
        return // 用户取消，不执行任何操作
      }

      try {
        console.log('正在退出房间...', this.roomId)
        
        // 调用退出房间API
        const response = await leaveRoom(this.roomId)
        console.log('退出房间API响应:', response)
        
        // 无论API返回什么状态，都执行跳转
        if (response && response.code === 200) {
          console.log('退出房间成功')
        } else {
          console.log('退出房间API返回异常:', response?.message)
        }
        
      } catch (error) {
        console.error('退出房间请求失败:', error)
        // 即使请求失败也继续跳转
      } finally {
        // 确保无论如何都跳转到首页
        this.goToHome()
      }
    },
    
    goToHome() {
      console.log('跳转到首页')
      this.$router.push('/')
    }
  },
  beforeUnmount() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval)
    }
  }
}
</script>

<style scoped>
.study-room-view {
  min-height: 100vh;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
}

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

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 100px 20px;
  text-align: center;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #eeaa67;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.study-room-content {
  max-width: 1400px;
  margin: 0 auto;
  padding: 30px 5%;
}

.room-title-section {
  text-align: center;
  margin-bottom: 30px;
  padding: 20px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.room-title {
  font-size: 2.5em;
  color: #333;
  font-weight: 700;
  margin: 0 0 8px 0;
  background: linear-gradient(135deg, #eeaa67, #ff8c42);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.room-subtitle {
  color: #666;
  font-size: 1.1em;
}

.main-layout {
  display: grid;
  grid-template-columns: 300px 1fr 280px;
  gap: 20px;
  align-items: start;
}

.room-info-section {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.room-basic-info {
  background: white;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border: 1px solid #e9ecef;
}

.info-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.info-title {
  font-size: 1.4em;
  color: #333;
  font-weight: 600;
  margin: 0;
}

.settings-btn {
  padding: 6px 12px;
  background: #6c757d;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 0.9em;
  cursor: pointer;
  transition: background-color 0.3s;
}

.settings-btn:hover {
  background: #5a6268;
}

.room-details {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.detail-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.detail-label {
  font-weight: 600;
  color: #333;
  min-width: 80px;
  font-size: 0.95em;
}

.detail-content {
  color: #666;
  flex: 1;
  font-size: 0.95em;
}

.members-section {
  background: white;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border: 1px solid #e9ecef;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.section-title {
  font-size: 1.4em;
  color: #333;
  font-weight: 600;
  margin: 0;
}

.member-count-total {
  background: #f8f9fa;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 0.9em;
  color: #666;
}

.members-table {
  display: flex;
  flex-direction: column;
  gap: 24px;
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

.status-text {
  font-size: 1.1em;
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
  grid-template-columns: 1fr;
  gap: 12px;
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
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  flex-shrink: 0;
}

.avatar-placeholder {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #eeaa67, #f5b877);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 600;
  font-size: 0.9em;
}

.member-info {
  flex: 1;
  min-width: 0;
}

.member-name {
  font-weight: 600;
  color: #333;
  margin-bottom: 4px;
  font-size: 0.95em;
}

.focus-time,
.rest-time {
  font-size: 0.85em;
  color: #666;
}

.member-tag {
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 0.8em;
  font-weight: 500;
  flex-shrink: 0;
}

.focusing-tag {
  background: #e7f3ff;
  color: #1971c2;
}

.resting-tag {
  background: #f8f9fa;
  color: #6c757d;
}

.study-tools-section {
  background: white;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border: 1px solid #e9ecef;
}

.tools-header {
  margin-bottom: 20px;
}

.tools-title {
  font-size: 1.4em;
  color: #333;
  font-weight: 600;
  margin: 0;
}

.tomato-timer-placeholder {
  background: #f8f9fa;
  border-radius: 12px;
  padding: 30px 20px;
  text-align: center;
  margin-bottom: 20px;
  border: 2px dashed #e9ecef;
}

.placeholder-content h3 {
  margin: 0 0 8px 0;
  color: #333;
  font-size: 1.3em;
}

.placeholder-content p {
  margin: 0 0 20px 0;
  color: #666;
  font-size: 0.95em;
}

.timer-controls {
  display: flex;
  justify-content: center;
  gap: 12px;
}

.tomato-btn {
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-size: 1em;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.start-tomato {
  background: #28a745;
  color: white;
}

.start-tomato:hover {
  background: #218838;
  transform: translateY(-2px);
}

.stop-tomato {
  background: #dc3545;
  color: white;
}

.stop-tomato:hover {
  background: #c82333;
  transform: translateY(-2px);
}

.other-tools-placeholder {
  background: #f8f9fa;
  border-radius: 12px;
  padding: 20px;
  text-align: center;
  color: #666;
  border: 1px dashed #dee2e6;
  font-size: 0.95em;
}

.action-section {
  position: sticky;
  top: 100px;
  height: fit-content;
}

.action-card {
  background: white;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border: 1px solid #e9ecef;
}

.action-header {
  margin-bottom: 20px;
}

.action-title {
  font-size: 1.4em;
  color: #333;
  font-weight: 600;
  margin: 0;
}

.action-buttons {
  display: flex;
  flex-direction: column;
  gap: 12px;
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
}

.leave-btn:hover {
  background: #fff5f5;
  border-color: #ff6b6b;
  color: #ff6b6b;
  transform: translateY(-1px);
}

.owner-actions {
  margin-top: 15px;
  padding-top: 15px;
  border-top: 1px solid #e9ecef;
}

.owner-btn {
  background: #ffc107;
  color: #212529;
  margin-bottom: 8px;
  border: none;
}

.owner-btn:hover {
  background: #e0a800;
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

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.settings-modal {
  background: white;
  padding: 30px;
  border-radius: 12px;
  max-width: 400px;
  width: 90%;
  text-align: center;
}

.settings-modal h3 {
  margin: 0 0 16px 0;
  color: #333;
}

.settings-modal p {
  margin: 0 0 20px 0;
  color: #666;
}

.settings-modal button {
  padding: 10px 20px;
  background: #6c757d;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}

.settings-modal button:hover {
  background: #5a6268;
}

@media (max-width: 1200px) {
  .main-layout {
    grid-template-columns: 280px 1fr;
  }
  .action-section {
    grid-column: 1 / -1;
  }
}

@media (max-width: 768px) {
  .main-layout {
    grid-template-columns: 1fr;
  }
  
  .room-title {
    font-size: 2em;
  }
  
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
}
</style>