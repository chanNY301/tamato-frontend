<template>
  <div class="study-room-view">
    <!-- 顶部导航栏 -->
    <nav class="navbar">
      <div class="nav-brand">Tomato</div>
      <div class="nav-links">
        <button @click="leaveRoom" class="nav-link">退出房间</button>
        <button @click="goToHome" class="nav-link">返回首页</button>
      </div>
    </nav>

    <!-- 主要内容区域 -->
    <main class="main-content">
      <!-- 状态1：加载中 -->
      <div v-if="loading" class="loading-container">
        <div class="loading-spinner"></div>
        <p>正在加载自习室...</p>
      </div>

      <!-- 状态2：房间不存在 -->
      <div v-else-if="roomNotFound" class="room-not-found-container">
        <div class="not-found-content">
          <div class="not-found-icon">🚫</div>
          <h2 class="not-found-title">自习室不存在</h2>
          <p class="not-found-message">
            房间ID <strong>{{ roomId }}</strong> 不存在或已关闭
          </p>
          <div class="not-found-actions">
            <button @click="goToHome" class="action-btn primary-btn">返回首页</button>
            <button @click="goToJoinRoom" class="action-btn secondary-btn">加入其他自习室</button>
          </div>
        </div>
      </div>

      <!-- 状态3：正常显示 -->
      <div v-else class="room-content">
        <!-- 房间头部信息 -->
        <div class="room-header">
          <div class="room-title-section">
            <h1 class="room-title">{{ roomInfo.room_name || '未命名自习室' }}</h1>
            <div class="room-meta">
              <span class="meta-item">房间ID: {{ roomInfo.room_id || roomId }}</span>
              <span class="meta-item">创建者: {{ roomInfo.create_person || '未知' }}</span>
              <span class="meta-item">最大人数: {{ roomInfo.max_members || 4 }}</span>
            </div>
          </div>
          <div class="room-actions">
            <button v-if="isRoomOwner" @click="showRoomSettings" class="action-btn settings-btn">
              房间设置
            </button>
          </div>
        </div>

        <div class="room-layout">
          <!-- 左侧：番茄钟和工作区 -->
          <div class="left-section">
            <div class="timer-section">
              <PomodoroTimer
                :key="roomId"
                @timer-start="handleTimerStart"
                @timer-pause="handleTimerPause"
                @timer-resume="handleTimerResume"
                @timer-stop="handleTimerStop"
                @focus-completed="handleFocusCompleted"
                @break-skipped="handleBreakSkipped"
              />
            </div>

            <!-- 用户状态控制 -->
            <div class="user-status-section">
              <h3>我的状态</h3>
              <div class="status-control">
                <button 
                  @click="userStatus.isFocusing = true" 
                  :class="['status-btn', { active: userStatus.isFocusing }]"
                >
                  🎯 专注中
                </button>
                <button 
                  @click="userStatus.isFocusing = false" 
                  :class="['status-btn', { active: !userStatus.isFocusing }]"
                >
                  ☕ 休息中
                </button>
              </div>
              <div class="focus-time" v-if="userStatus.isFocusing">
                已专注: {{ userStatus.focusTime }}
              </div>
            </div>
          </div>

          <!-- 右侧：成员列表 -->
          <div class="right-section">
            <div class="members-section">
              <div class="section-header">
                <h3>成员列表 ({{ members.length }}/{{ roomInfo.max_members || 4 }})</h3>
                <div class="stats">
                  <span class="stat focusing">专注: {{ focusingMembers.length }}</span>
                  <span class="stat resting">休息: {{ restingMembers.length }}</span>
                </div>
              </div>

              <div class="members-list">
                <div v-for="member in members" :key="member.id" class="member-card">
                  <div class="member-avatar">
                    {{ getInitials(member.name) }}
                  </div>
                  <div class="member-info">
                    <div class="member-name">
                      {{ member.name }}
                      <span v-if="member.isCurrentUser" class="current-user-tag">(我)</span>
                      <span v-if="member.role === 'host'" class="host-tag">房主</span>
                    </div>
                    <div class="member-status">
                      <span :class="['status-tag', member.status]">
                        {{ member.status === 'focusing' ? '🎯 专注中' : '☕ 休息中' }}
                      </span>
                      <span class="time-info">
                        {{ member.status === 'focusing' ? member.focusTime : member.restTime }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- 房间设置弹窗 -->
    <div v-if="showSettings" class="modal-overlay">
      <div class="settings-modal">
        <h3>房间设置</h3>
        <!-- 设置内容 -->
        <button @click="closeSettings" class="close-btn">关闭</button>
      </div>
    </div>
  </div>
</template>

<script>
import { getRoomDetail, leaveRoom, updateUserStatus, getRoomMembers } from '@/api/studyRooms'
import PomodoroTimer from '@/components/PomodoroTimer/PomodoroTimer.vue'

export default {
  name: 'StudyRoomView',
  components: {
    PomodoroTimer
  },
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
      loading: true,
      showSettings: false,
      isRoomOwner: false,
      roomNotFound: false,
      currentUser: {
        id: 'user_123',
        username: '我'
      },
      statusChanged: false,
      focusTimer: null,
      lastRefreshTime: null
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
    await this.validateAndLoadRoom()
  },
  watch: {
    '$route.params.roomId': {
      handler(newRoomId) {
        if (newRoomId) {
          this.validateAndLoadRoom()
        }
      }
    },
    'userStatus.isFocusing'(newVal, oldVal) {
      if (newVal !== oldVal) {
        this.statusChanged = true
        this.updateUserStatusToServer()
      }
    }
  },
  methods: {
    // 验证并加载房间数据
    async validateAndLoadRoom() {
      try {
        this.loading = true
        this.roomNotFound = false
        
        console.log('正在验证房间，roomId:', this.roomId)
        
        const response = await getRoomDetail(this.roomId)
        console.log('房间验证响应:', response)
        console.log('响应数据:', response.data)
        
        // ✅ 检查响应是否成功
        if (response && (response.success === true || response.success === "true")) {
          console.log('房间验证成功')
          
          if (response.data) {
            // ✅ 正确处理字段名映射
            this.roomInfo = {
              room_id: response.data.roomId || response.data.room_id || this.roomId,
              room_name: response.data.roomName || response.data.room_name || '未命名自习室',
              create_person: response.data.createPerson || response.data.create_person || '',
              max_members: response.data.maxMembers || response.data.max_members || 4,
              current_time: response.data.current_time || 0,
              end_time: response.data.end_time || 0,
              music_name: response.data.musicName || response.data.music_name || '无'
            }
            
            console.log('转换后的roomInfo:', this.roomInfo)
            
            // 加载成员列表
            await this.loadMembersData()
            
            // 检查当前用户是否为房主
            this.checkIfRoomOwner()
            
            console.log('房间验证成功，加载数据完成')
          } else {
            console.log('房间数据为空，视为不存在')
            this.roomNotFound = true
          }
        } else {
          console.log('房间验证失败')
          this.roomNotFound = true
        }
      } catch (error) {
        console.error('验证房间时出错:', error)
        this.roomNotFound = true
      } finally {
        this.loading = false
        this.lastRefreshTime = Date.now()
      }
    },

    // 加载成员数据
    async loadMembersData() {
      try {
        const response = await getRoomMembers(this.roomId)
        console.log('成员列表响应:', response)
        
        if (response.code === 200 && response.data && response.data.list) {
          this.members = response.data.list.map(member => {
            const isCurrentUser = member.user_id === this.currentUser.id
            
            return {
              id: member.user_id,
              user_id: member.user_id,
              name: isCurrentUser ? '我' : member.username,
              username: member.username,
              role: member.role,
              status: member.status || 'resting',
              focusTime: member.status === 'focusing' ? this.calculateFocusTime(member) : '',
              restTime: member.status === 'resting' ? '休息中' : '',
              joined_at: member.joined_at,
              isCurrentUser: isCurrentUser
            }
          })
          
          // 更新当前用户状态
          const currentMember = this.members.find(m => m.isCurrentUser)
          if (currentMember) {
            this.userStatus.isFocusing = currentMember.status === 'focusing'
          }
          
          console.log('成员数据加载成功:', this.members)
        } else {
          console.log('成员列表API返回异常，使用临时数据')
          this.setTempMembersData()
        }
      } catch (error) {
        console.error('加载成员数据失败:', error)
        this.setTempMembersData()
      }
    },

    // 临时成员数据
    setTempMembersData() {
      this.members = [
        {
          id: 'user_123',
          user_id: 'user_123',
          name: '我',
          username: this.currentUser.username,
          role: 'host',
          status: this.userStatus.isFocusing ? 'focusing' : 'resting',
          focusTime: this.userStatus.isFocusing ? '进行中' : '',
          restTime: this.userStatus.isFocusing ? '' : '休息中',
          joined_at: new Date().toISOString(),
          isCurrentUser: true
        }
      ]
    },

    calculateFocusTime(member) {
      if (member.status !== 'focusing') return ''
      
      if (member.focus_start_time) {
        const startTime = new Date(member.focus_start_time).getTime()
        const now = Date.now()
        const elapsed = now - startTime
        return this.formatTime(elapsed)
      }
      
      return '进行中'
    },

    formatTime(ms) {
      const totalSeconds = Math.floor(ms / 1000)
      const hours = Math.floor(totalSeconds / 3600)
      const minutes = Math.floor((totalSeconds % 3600) / 60)
      const seconds = totalSeconds % 60
      
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
    },

    checkIfRoomOwner() {
      const currentMember = this.members.find(member => member.isCurrentUser)
      this.isRoomOwner = currentMember?.role === 'host'
      return this.isRoomOwner
    },

    async updateUserStatusToServer() {
      try {
        const status = this.userStatus.isFocusing ? 'focusing' : 'resting'
        
        const currentMember = this.members.find(member => member.isCurrentUser)
        if (currentMember) {
          currentMember.status = status
          if (status === 'focusing') {
            currentMember.focusTime = '进行中'
            currentMember.restTime = ''
            this.startFocusTimer()
          } else {
            currentMember.restTime = '休息中'
            currentMember.focusTime = ''
            this.stopFocusTimer()
          }
        }
        
        const response = await updateUserStatus({
          roomId: this.roomId,
          status: status,
          userId: this.currentUser.id
        })
        
        if (response.code === 200) {
          console.log('用户状态更新成功:', status)
          await this.loadMembersData()
        }
      } catch (error) {
        console.error('更新用户状态失败:', error)
      } finally {
        this.statusChanged = false
      }
    },

    startFocusTimer() {
      this.userStatus.focusStartTime = Date.now()
      
      if (this.focusTimer) {
        clearInterval(this.focusTimer)
      }
      
      this.focusTimer = setInterval(() => {
        if (this.userStatus.isFocusing) {
          const elapsed = Date.now() - this.userStatus.focusStartTime
          this.userStatus.focusTime = this.formatTime(elapsed)
          
          const currentMember = this.members.find(member => member.isCurrentUser)
          if (currentMember) {
            currentMember.focusTime = this.userStatus.focusTime
          }
        }
      }, 1000)
    },

    stopFocusTimer() {
      if (this.focusTimer) {
        clearInterval(this.focusTimer)
        this.focusTimer = null
      }
      this.userStatus.focusTime = '00:00:00'
    },

    getInitials(name) {
      if (!name) return '?'
      return name.charAt(0).toUpperCase()
    },

    // 番茄钟事件
    handleTimerStart() {
      console.log('番茄钟开始')
      this.userStatus.isFocusing = true
    },
    
    handleTimerPause() {
      console.log('番茄钟暂停')
    },
    
    handleTimerResume() {
      console.log('番茄钟继续')
      this.userStatus.isFocusing = true
    },
    
    handleTimerStop() {
      console.log('番茄钟停止')
      this.userStatus.isFocusing = false
    },
    
    handleFocusCompleted(sessions) {
      console.log(`专注完成，已完成 ${sessions} 个番茄`)
      setTimeout(() => {
        this.userStatus.isFocusing = false
      }, 1000)
    },
    
    handleBreakSkipped() {
      console.log('休息被跳过')
      this.userStatus.isFocusing = true
    },

    showRoomSettings() {
      this.showSettings = true
    },

    closeSettings() {
      this.showSettings = false
    },

    async leaveRoom() {
      const userConfirmed = confirm('确定要退出自习室吗？')
      if (!userConfirmed) return

      try {
        console.log('正在退出房间...', this.roomId)
        const response = await leaveRoom(this.roomId)
        console.log('退出房间API响应:', response)
      } catch (error) {
        console.error('退出房间请求失败:', error)
      } finally {
        this.goToHome()
      }
    },
    
    goToHome() {
      console.log('跳转到首页')
      this.$router.push('/')
    },

    goToJoinRoom() {
      this.$router.push('/join-room')
    }
  },
  beforeUnmount() {
    if (this.focusTimer) {
      clearInterval(this.focusTimer)
    }
  }
}
</script>

<style scoped>
/* 基础样式 */
.study-room-view {
  min-height: 100vh;
  background: linear-gradient(135deg, #fefaf5 0%, #fff5eb 100%);
}

/* 导航栏样式 */
.navbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 5%;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid #ffe4cc;
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
  gap: 16px;
}

.nav-link {
  background: #f8f9fa;
  border: 1px solid #e0e0e0;
  padding: 8px 16px;
  border-radius: 8px;
  cursor: pointer;
  color: #333;
  font-weight: 500;
  transition: all 0.3s ease;
}

.nav-link:hover {
  background: #eeaa67;
  color: white;
  border-color: #eeaa67;
}

/* 主要内容区域 */
.main-content {
  max-width: 1400px;
  margin: 0 auto;
  padding: 30px 5%;
}

/* 加载状态 */
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
}

.loading-spinner {
  width: 50px;
  height: 50px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #eeaa67;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading-container p {
  color: #666;
  font-size: 1.1em;
  margin-top: 16px;
}

/* 房间不存在状态 */
.room-not-found-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: calc(100vh - 80px);
  padding: 40px 20px;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
}

.not-found-content {
  text-align: center;
  max-width: 500px;
  width: 100%;
  padding: 40px;
  background: white;
  border-radius: 20px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
  border: 1px solid #ffe4cc;
}

.not-found-icon {
  font-size: 4em;
  margin-bottom: 20px;
  opacity: 0.7;
}

.not-found-title {
  font-size: 2em;
  color: #333;
  font-weight: 700;
  margin: 0 0 16px 0;
}

.not-found-message {
  font-size: 1.1em;
  color: #666;
  margin: 0 0 32px 0;
  line-height: 1.6;
}

.not-found-message strong {
  color: #eeaa67;
  font-weight: 600;
}

.not-found-actions {
  display: flex;
  gap: 16px;
  justify-content: center;
}

.action-btn {
  padding: 14px 28px;
  border: none;
  border-radius: 10px;
  font-size: 1em;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  min-width: 140px;
}

.primary-btn {
  background: linear-gradient(135deg, #eeaa67, #f5b877);
  color: white;
}

.primary-btn:hover {
  background: linear-gradient(135deg, #e69c55, #f0b066);
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(238, 170, 103, 0.3);
}

.secondary-btn {
  background: white;
  color: #666;
  border: 2px solid #e0e0e0;
}

.secondary-btn:hover {
  background: #f8f9fa;
  border-color: #ccc;
  transform: translateY(-2px);
}

/* 正常房间内容 */
.room-content {
  animation: fadeIn 0.5s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

/* 房间头部 */
.room-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  padding: 25px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border: 1px solid #e9ecef;
}

.room-title-section {
  flex: 1;
}

.room-title {
  font-size: 2.2em;
  color: #333;
  font-weight: 700;
  margin: 0 0 12px 0;
}

.room-meta {
  display: flex;
  gap: 20px;
  color: #666;
  font-size: 0.95em;
}

.meta-item {
  background: #f8f9fa;
  padding: 6px 12px;
  border-radius: 8px;
}

.settings-btn {
  background: #eeaa67;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 10px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.settings-btn:hover {
  background: #e69c55;
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(238, 170, 103, 0.3);
}

/* 房间布局 */
.room-layout {
  display: grid;
  grid-template-columns: 1fr 350px;
  gap: 30px;
  align-items: start;
}

/* 左侧区域 */
.left-section {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.timer-section {
  background: white;
  border-radius: 16px;
  padding: 30px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border: 1px solid #e9ecef;
}

.user-status-section {
  background: white;
  border-radius: 16px;
  padding: 25px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border: 1px solid #e9ecef;
}

.user-status-section h3 {
  font-size: 1.3em;
  color: #333;
  margin: 0 0 20px 0;
  font-weight: 600;
}

.status-control {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
}

.status-btn {
  flex: 1;
  padding: 14px;
  border: 2px solid #e0e0e0;
  background: white;
  border-radius: 10px;
  font-size: 1em;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.status-btn.active {
  background: #eeaa67;
  color: white;
  border-color: #eeaa67;
}

.status-btn:hover:not(.active) {
  background: #f8f9fa;
  border-color: #ccc;
}

.focus-time {
  text-align: center;
  color: #eeaa67;
  font-weight: 600;
  font-size: 1.1em;
}

/* 右侧成员列表 */
.right-section {
  position: sticky;
  top: 100px;
}

.members-section {
  background: white;
  border-radius: 16px;
  padding: 25px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border: 1px solid #e9ecef;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.section-header h3 {
  font-size: 1.3em;
  color: #333;
  margin: 0;
  font-weight: 600;
}

.stats {
  display: flex;
  gap: 12px;
}

.stat {
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 0.85em;
  font-weight: 500;
}

.stat.focusing {
  background: #e7f5e9;
  color: #2b8a3e;
}

.stat.resting {
  background: #fff9f2;
  color: #eeaa67;
}

/* 成员列表 */
.members-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-height: 500px;
  overflow-y: auto;
  padding-right: 8px;
}

.member-card {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 12px;
  transition: all 0.3s ease;
}

.member-card:hover {
  background: #f0f2f5;
  transform: translateY(-2px);
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.08);
}

.member-avatar {
  width: 45px;
  height: 45px;
  border-radius: 50%;
  background: linear-gradient(135deg, #eeaa67, #f5b877);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 1.2em;
  flex-shrink: 0;
}

.member-info {
  flex: 1;
  min-width: 0;
}

.member-name {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
  font-weight: 600;
  color: #333;
}

.current-user-tag {
  background: #eeaa67;
  color: white;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 0.8em;
}

.host-tag {
  background: #6c757d;
  color: white;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 0.8em;
}

.member-status {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 0.9em;
}

.status-tag {
  padding: 4px 10px;
  border-radius: 12px;
  font-weight: 500;
}

.status-tag.focusing {
  background: #e7f5e9;
  color: #2b8a3e;
}

.status-tag.resting {
  background: #fff9f2;
  color: #eeaa67;
}

.time-info {
  color: #666;
}

/* 弹窗样式 */
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
  border-radius: 16px;
  padding: 30px;
  max-width: 500px;
  width: 90%;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
}

.settings-modal h3 {
  font-size: 1.5em;
  color: #333;
  margin: 0 0 25px 0;
  font-weight: 600;
}

.close-btn {
  background: #f8f9fa;
  color: #666;
  border: 2px solid #e0e0e0;
  padding: 10px 20px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
}

.close-btn:hover {
  background: #e9ecef;
}

/* 响应式设计 */
@media (max-width: 1100px) {
  .room-layout {
    grid-template-columns: 1fr;
  }
  
  .right-section {
    position: static;
  }
}

@media (max-width: 768px) {
  .main-content {
    padding: 20px;
  }
  
  .room-header {
    flex-direction: column;
    gap: 20px;
    align-items: flex-start;
    padding: 20px;
  }
  
  .room-title {
    font-size: 1.8em;
  }
  
  .room-meta {
    flex-direction: column;
    gap: 10px;
  }
  
  .section-header {
    flex-direction: column;
    gap: 12px;
    align-items: flex-start;
  }
  
  .stats {
    align-self: flex-start;
  }
  
  .navbar {
    padding: 12px 20px;
  }
  
  .nav-links {
    gap: 10px;
  }
  
  .nav-link {
    padding: 6px 12px;
    font-size: 0.9em;
  }
}
</style>