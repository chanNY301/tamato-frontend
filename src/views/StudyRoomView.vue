<template>
  <div class="study-room-view">
    <nav class="navbar">
      <div class="nav-brand">Tomato</div>
      <div class="nav-links">
        <a class="nav-link" @click="goToHome">返回首页</a>
      </div>
    </nav>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading-container">
      <div class="loading-spinner"></div>
      <p>正在验证自习室...</p>
    </div>

    <!-- 房间不存在提示 -->
    <div v-else-if="roomNotFound" class="room-not-found-container">
      <div class="not-found-content">
        <div class="not-found-icon"></div>
        <h1 class="not-found-title">自习室不存在</h1>
        <p class="not-found-message">
          房间号 <strong>{{ roomId }}</strong> 不存在或已被解散
        </p>
        <div class="not-found-actions">
          <button class="action-btn primary-btn" @click="goToHome">
            返回首页
          </button>
          <button class="action-btn secondary-btn" @click="goToJoinRoom">
            重新加入
          </button>
        </div>
      </div>
    </div>

    <!-- 正常显示自习室内容 -->
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

        <!-- 中间：番茄钟组件 -->
        <div class="study-center-section">
          <PomodoroTimer 
            :active="userStatus.isFocusing"
            @timer-started="handleTimerStart"
            @timer-paused="handleTimerPause"
            @timer-resumed="handleTimerResume"
            @timer-stopped="handleTimerStop"
            @focus-completed="handleFocusCompleted"
            @break-skipped="handleBreakSkipped"
          />
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
      // 新增：房间是否存在标识
      roomNotFound: false,
      // 新增：当前用户信息
      currentUser: {
        id: 'user_123', // 这里需要从登录状态获取，暂时写死
        username: '我'
      },
      // 添加状态变化标识
      statusChanged: false,
      // 新增：用于存储专注时长的计时器
      focusTimer: null,
      // 移除 updateInterval 定时器
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
    },
    // 新增：房间统计数据
    roomStatistics() {
      const focusingCount = this.focusingMembers.length
      const restingCount = this.restingMembers.length
      const totalMembers = this.members.length
      
      // 计算当前用户的角色
      const currentUserMember = this.members.find(member => member.user_id === this.currentUser.id)
      const isHost = currentUserMember?.role === 'host'
      
      return {
        focusingCount,
        restingCount,
        totalMembers,
        isHost
      }
    }
  },
  async mounted() {
    await this.validateAndLoadRoom()
  },
  // 路由变化时重新验证
  watch: {
    '$route.params.roomId': {
      handler(newRoomId) {
        if (newRoomId) {
          this.validateAndLoadRoom()
        }
      },
      immediate: false
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
        
        const response = await getRoomDetail(this.roomId)
        console.log('房间验证响应:', response)
        
        // 验证房间是否存在
        if (response && response.code === 200 && response.data) {
          // 房间存在，加载数据
          this.roomInfo = { ...response.data }
          
          // 加载成员列表
          await this.loadMembersData()
          
          // 检查当前用户是否为房主
          this.checkIfRoomOwner()
          
          console.log('房间验证成功，加载数据:', this.roomInfo)
        } else {
          // 房间不存在
          this.roomNotFound = true
          console.log('房间不存在，响应:', response)
        }
      } catch (error) {
        console.error('验证房间时出错:', error)
        
        // 根据错误类型判断
        if (error.response && error.response.status === 404) {
          this.roomNotFound = true
        } else {
          // 其他错误，也显示房间不存在
          this.roomNotFound = true
        }
      } finally {
        this.loading = false
        this.lastRefreshTime = Date.now()
      }
    },

    // 加载成员数据（使用真实API）
    async loadMembersData() {
      try {
        const response = await getRoomMembers(this.roomId)
        console.log('成员列表响应:', response)
        
        if (response.code === 200 && response.data && response.data.list) {
          // 转换API返回的数据格式为前端需要的格式
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

    // 临时成员数据（备用）
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
        },
        {
          id: 'user_456',
          user_id: 'user_456',
          name: '奋斗的小红',
          username: '奋斗的小红',
          role: 'member',
          status: 'focusing',
          focusTime: '01:23:45',
          joined_at: '2024-06-13T10:05:00Z',
          isCurrentUser: false
        }
      ]
    },

    // 计算专注时间（根据加入时间或其他逻辑）
    calculateFocusTime(member) {
      if (member.status !== 'focusing') return ''
      
      // 如果有专注开始时间，计算已专注时长
      if (member.focus_start_time) {
        const startTime = new Date(member.focus_start_time).getTime()
        const now = Date.now()
        const elapsed = now - startTime
        
        return this.formatTime(elapsed)
      }
      
      // 否则显示默认
      return '进行中'
    },

    // 格式化时间（毫秒转时分秒）
    formatTime(ms) {
      const totalSeconds = Math.floor(ms / 1000)
      const hours = Math.floor(totalSeconds / 3600)
      const minutes = Math.floor((totalSeconds % 3600) / 60)
      const seconds = totalSeconds % 60
      
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
    },

    // 检查当前用户是否为房主
    checkIfRoomOwner() {
      const currentMember = this.members.find(member => member.isCurrentUser)
      this.isRoomOwner = currentMember?.role === 'host'
      return this.isRoomOwner
    },

    // 更新用户状态到服务器
    async updateUserStatusToServer() {
      try {
        const status = this.userStatus.isFocusing ? 'focusing' : 'resting'
        
        // 更新本地成员列表中的当前用户状态
        const currentMember = this.members.find(member => member.isCurrentUser)
        if (currentMember) {
          currentMember.status = status
          if (status === 'focusing') {
            currentMember.focusTime = '进行中'
            currentMember.restTime = ''
            
            // 开始专注计时
            this.startFocusTimer()
          } else {
            currentMember.restTime = '休息中'
            currentMember.focusTime = ''
            
            // 停止专注计时
            this.stopFocusTimer()
          }
        }
        
        // 调用API更新服务器状态
        const response = await updateUserStatus({
          roomId: this.roomId,
          status: status,
          userId: this.currentUser.id
        })
        
        if (response.code === 200) {
          console.log('用户状态更新成功:', status)
          
          // 重新加载成员列表，确保数据同步
          await this.loadMembersData()
        }
      } catch (error) {
        console.error('更新用户状态失败:', error)
      } finally {
        this.statusChanged = false
      }
    },

    // 开始专注计时
    startFocusTimer() {
      this.userStatus.focusStartTime = Date.now()
      
      // 清除之前的计时器
      if (this.focusTimer) {
        clearInterval(this.focusTimer)
      }
      
      // 每秒更新专注时间
      this.focusTimer = setInterval(() => {
        if (this.userStatus.isFocusing) {
          const elapsed = Date.now() - this.userStatus.focusStartTime
          this.userStatus.focusTime = this.formatTime(elapsed)
          
          // 更新成员列表中的显示
          const currentMember = this.members.find(member => member.isCurrentUser)
          if (currentMember) {
            currentMember.focusTime = this.userStatus.focusTime
          }
        }
      }, 1000)
    },

    // 停止专注计时
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

    // 番茄钟事件处理方法
    handleTimerStart() {
      console.log('番茄钟开始')
      this.userStatus.isFocusing = true
      // 状态变化会自动触发 watch，调用 updateUserStatusToServer
    },
    
    handleTimerPause() {
      console.log('番茄钟暂停')
      // 如果需要暂停状态，可以在这里处理
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
      // 完成专注后自动进入休息状态
      setTimeout(() => {
        this.userStatus.isFocusing = false
      }, 1000)
    },
    
    handleBreakSkipped() {
      console.log('休息被跳过')
      // 跳过休息，直接开始下一个专注
      this.userStatus.isFocusing = true
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
      const userConfirmed = confirm('确定要退出自习室吗？')
      if (!userConfirmed) {
        return
      }

      try {
        console.log('正在退出房间...', this.roomId)
        
        const response = await leaveRoom(this.roomId)
        console.log('退出房间API响应:', response)
        
        if (response && response.code === 200) {
          console.log('退出房间成功')
        } else {
          console.log('退出房间API返回异常:', response?.message)
        }
        
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
    // 清理计时器
    if (this.focusTimer) {
      clearInterval(this.focusTimer)
    }
  }
}
</script>

<style scoped>
/* 样式保持不变，只修改加载提示文字 */
.loading-container p {
  color: #666;
  font-size: 1.1em;
  margin-top: 16px;
}

/* 房间不存在提示容器的样式（如果你还没有添加） */
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
</style>

<style scoped>
/* 保持你原有的所有样式，只添加以下新样式 */

/* 房间不存在提示容器 */
.room-not-found-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: calc(100vh - 80px); /* 减去导航栏高度 */
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

/* 修改加载提示文字 */
.loading-container p {
  color: #666;
  font-size: 1.1em;
  margin-top: 16px;
}
</style>