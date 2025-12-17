<template>
  <div class="study-room-view">
    <!-- 顶部导航栏 -->
    <nav class="navbar">
      <div class="nav-brand">Tomato</div>
      <div class="nav-links">
        <!-- 房主显示解散按钮，普通成员显示退出按钮 -->
        <button 
          v-if="isRoomOwner" 
          @click="disbandRoom" 
          class="nav-link disband-nav-btn"
          title="解散自习室（房主专用）"
        >
           解散自习室
        </button>
        <button 
          v-else 
          @click="leaveRoom" 
          class="nav-link"
        >
          退出房间
        </button>
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
              <!-- 调试信息：显示房主状态 -->
              <span v-if="!isRoomOwner && members.length > 0" class="meta-item debug-info" style="color: #999; font-size: 0.85em;">
                调试: 当前用户角色 = {{ getCurrentUserRole() }}
              </span>
            </div>
          </div>
          <div class="room-actions">
            <button v-if="isRoomOwner" @click="disbandRoom" class="action-btn disband-btn">
              <span class="btn-icon">🗑️</span>
              <span class="btn-text">解散自习室</span>
            </button>
            <button v-if="isRoomOwner" @click="showRoomSettings" class="action-btn settings-btn">
              <span class="btn-icon">⚙️</span>
              <span class="btn-text">房间设置</span>
            </button>
          </div>
        </div>

        <div class="room-layout">
          <!-- 左侧：番茄钟和工作区 -->
          <div class="left-section">
            <PomodoroTimer
              class="timer-component"
              :key="roomId"
              @timer-started="handleTimerStart"
              @timer-paused="handleTimerPause"
              @timer-resumed="handleTimerResume"
              @timer-stopped="handleTimerStop"
              @focus-completed="handleFocusCompleted"
              @break-skipped="handleBreakSkipped"
              @user-status-change="handleUserStatusChange" 
            />

            <!-- 用户状态控制 -->
            <div class="user-status-section">
              <h3>我的状态</h3>
              <div class="status-display" :class="userStatus.isFocusing ? 'focusing' : 'resting'">
                <span class="status-label">
                  {{ userStatus.isFocusing ? '🎯 专注中' : '☕ 休息中' }}
                </span>
                <span class="status-tip">状态会随番茄钟开始/停止自动同步</span>
              </div>
              <div class="focus-time" v-if="userStatus.isFocusing">
                已专注: {{ userStatus.focusTime }}
              </div>
              <div class="rest-tip" v-else>
                当前处于休息，等待下一次番茄开始
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
import { getRoomDetail, leaveRoom, getRoomMembers, deleteRoom } from '@/api/studyRooms'
import PomodoroTimer from '@/components/PomodoroTimer/PomodoroTimer.vue'
import { getCurrentUser } from '@/api/user'

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
      hasStartedFocus: false,
      members: [],
      loading: true,
      showSettings: false,
      isRoomOwner: false,
      roomNotFound: false,
      currentUser: null,
      statusChanged: false,
      focusTimer: null,
      lastRefreshTime: null,
      refreshTimer: null,
      refreshInterval: 5000
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
    currentUserId() {
      if (!this.currentUser) return null
      return this.currentUser.id || this.currentUser.userId || this.currentUser.user_id
    },
    normalizedCurrentUserId() {
      if (!this.currentUserId && this.currentUserId !== 0) return null
      return String(this.currentUserId)
    }
  },
  async mounted() {
    // 先获取用户信息，再加载房间数据
    await this.loadCurrentUser()
    await this.validateAndLoadRoom()
    this.startMembersAutoRefresh()
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
        // 先本地同步右侧成员列表状态
        this.updateMemberStatusLocally(newVal ? 'focusing' : 'resting')
        this.statusChanged = true
        this.updateUserStatusToServer()
      }
    }
  },
  methods: {
    // 处理用户状态变化（新方法）
    handleUserStatusChange(status) {
      console.log('番茄钟状态变化:', status)
      this.syncLocalStatus(status)
      
      // 同步到后端服务器（这里需要调用你的API）
      this.syncStatusToServer(status)
    },

    // 同步状态到服务器
    async syncStatusToServer(status) {
      try {
        // 这里需要调用你的后端API来更新用户状态
        // 示例：await updateUserStatus(this.roomId, this.currentUserId, status)
        console.log('正在同步状态到服务器:', {
          roomId: this.roomId,
          userId: this.currentUserId,
          status: status
        })
        
        // 临时模拟：更新当前用户的专注开始时间
        if (status === 'focusing') {
          this.userStatus.focusStartTime = Date.now()
        }
      } catch (error) {
        console.error('同步状态到服务器失败:', error)
      }
    },

    // 修改 syncLocalStatus 方法
    syncLocalStatus(status) {
      const isFocus = status === 'focusing'
      this.hasStartedFocus = isFocus
      this.userStatus.isFocusing = isFocus
      
      if (isFocus) {
        this.startFocusTimer()
      } else {
        this.stopFocusTimer()
      }
      
      this.updateMemberStatusLocally(status)
      this.loadMembersData().catch(err => console.error('刷新成员列表失败:', err))
    },

    // 番茄钟事件处理（简化）
    handleTimerStart() {
      console.log('番茄钟开始')
      // 这个事件已经被 handleUserStatusChange 处理了
    },
    
    handleTimerPause() {
      console.log('番茄钟暂停')
      // 暂停时状态不变，还是专注
    },
    
    handleTimerResume() {
      console.log('番茄钟继续')
      // 这个事件已经被 handleUserStatusChange 处理了
    },
    
    handleTimerStop() {
      console.log('番茄钟停止')
      // 这个事件已经被 handleUserStatusChange 处理了
    },
    
    handleFocusCompleted(sessions) {
      console.log(`专注完成，已完成 ${sessions} 个番茄`)
      // 这个事件已经被 handleUserStatusChange 处理了
    },
    
    handleBreakSkipped() {
      console.log('休息被跳过')
      // 这个事件已经被 handleUserStatusChange 处理了
    },

    // 加载当前用户信息
    async loadCurrentUser() {
      try {
        const response = await getCurrentUser()
        
        if (response.success && response.data) {
          this.currentUser = response.data
          console.log('获取到当前用户:', this.currentUser)
        } else {
          console.warn('获取用户信息失败:', response)
          // 如果获取失败，设置默认值
          this.currentUser = {
            id: 'user_unknown',
            username: '未知用户'
          }
        }
      } catch (error) {
        console.error('获取用户信息时出错:', error)
        this.currentUser = {
          id: 'user_unknown',
          username: '未知用户'
        }
      }
    },

    // 验证并加载房间数据
    async validateAndLoadRoom() {
      try {
        this.loading = true
        this.roomNotFound = false
        
        console.log('正在验证房间，roomId:', this.roomId)
        
        const response = await getRoomDetail(this.roomId, this.currentUserId)
        console.log('房间验证响应:', response)
        
        if (response && (response.success === true || response.success === "true")) {
          console.log('房间验证成功')
          
          if (response.data) {
            this.roomInfo = {
              room_id: response.data.roomId || response.data.room_id || this.roomId,
              room_name: response.data.roomName || response.data.room_name || '未命名自习室',
              create_person: response.data.createPerson || response.data.create_person || '',
              max_members: response.data.maxMembers || response.data.max_members || 4,
              current_time: response.data.current_time || 0,
              end_time: response.data.end_time || 0,
              music_name: response.data.musicName || response.data.music_name || '无'
            }
            
            console.log('房间信息:', this.roomInfo)
            
            // 加载成员列表（loadMembersData 内部会调用 checkIfRoomOwner）
            await this.loadMembersData()
            
            console.log('房间数据加载完成')
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
        const response = await getRoomMembers(this.roomId, this.currentUserId)
        console.log('成员列表响应:', response)

        // 兼容多种返回格式
        const data = response?.data
        const list = Array.isArray(data?.list) ? data.list
          : Array.isArray(data?.members) ? data.members
          : Array.isArray(data?.content) ? data.content
          : Array.isArray(data) ? data
          : []

        if ((response.code === 200 || response.success === true) && list.length) {
          const currentIdStr = this.normalizedCurrentUserId
          console.log('当前用户ID（用于匹配）:', currentIdStr, '类型:', typeof currentIdStr)
          console.log('成员列表原始数据:', list)
          
          this.members = list.map(member => {
            // ✅ 兼容多种ID字段：userId, user_id, id（注意：API返回的是 userId）
            const rawId = member.userId ?? member.user_id ?? member.id
            const memberIdStr = rawId !== undefined && rawId !== null ? String(rawId) : null
            const isCurrentUser = currentIdStr !== null && memberIdStr !== null && memberIdStr === currentIdStr
            
            console.log('处理成员:', {
              rawId: rawId,
              memberIdStr: memberIdStr,
              currentIdStr: currentIdStr,
              isCurrentUser: isCurrentUser,
              role: member.role,
              username: member.username || member.name,
              'member.userId': member.userId,
              'member.user_id': member.user_id,
              'member.id': member.id
            })

            // 兼容不同字段的状态表示
            const rawStatus = member.status ?? member.userStatus ?? member.state
            let normalizedStatus = (() => {
              if (typeof rawStatus === 'string') {
                const lower = rawStatus.toLowerCase()
                if (['focus', 'focusing', 'focus_ing', '专注', '专注中'].includes(lower)) return 'focusing'
                if (['rest', 'resting', '休息', '休息中'].includes(lower)) return 'resting'
              }
              if (rawStatus === true || rawStatus === 1) return 'focusing'
              if (rawStatus === false || rawStatus === 0) return 'resting'
              if (member.isFocusing !== undefined) return member.isFocusing ? 'focusing' : 'resting'
              return 'resting'
            })()

            // 进入房间时，如果后端默认给了"专注中"，但前端还未开始番茄钟，则保持后端状态
            // 不再强制设置为休息中，让用户自主控制番茄钟状态
            // 但需要确保用户状态与番茄钟实际运行状态一致
            if (isCurrentUser && !this.hasStartedFocus) {
              // 如果用户手动启动了番茄钟，以番茄钟状态为准
              // 否则保持后端返回的状态
              // this.hasStartedFocus 会在番茄钟开始时被设置为 true
            }

            return {
              id: rawId,
              user_id: rawId,
              name: member.username || member.name || `用户${memberIdStr || ''}`,
              username: member.username || member.name || '',
              role: member.role,
              status: normalizedStatus,
              focusTime: normalizedStatus === 'focusing' ? this.calculateFocusTime(member) : '',
              restTime: normalizedStatus === 'resting' ? '休息中' : '',
              joined_at: member.joined_at,
              isCurrentUser: isCurrentUser
            }
          })

          // 更新当前用户状态
          const currentMember = this.members.find(m => m.isCurrentUser)
          if (currentMember) {
            this.userStatus.isFocusing = currentMember.status === 'focusing'
            console.log('当前用户信息:', {
              id: currentMember.id,
              name: currentMember.name,
              role: currentMember.role,
              isCurrentUser: currentMember.isCurrentUser
            })
          } else {
            console.warn('⚠️ 当前用户不在成员列表中')
            console.log('成员列表:', this.members.map(m => ({ id: m.id, name: m.name, role: m.role })))
            console.log('当前用户ID:', this.currentUserId, '类型:', typeof this.currentUserId)
          }

          console.log('成员数据加载成功，当前成员数:', this.members.length)
          
          // 加载完成员列表后，立即检查是否为房主
          this.checkIfRoomOwner()
          console.log('房主状态检查结果:', this.isRoomOwner)
        } else {
          console.log('成员列表API返回异常或无数据，使用临时数据')
          this.setTempMembersData()
          // 即使使用临时数据，也检查一下
          this.checkIfRoomOwner()
        }
      } catch (error) {
        console.error('加载成员数据失败:', error)
        this.setTempMembersData()
        // 即使失败，也检查一下
        this.checkIfRoomOwner()
      }
    },

    // 临时成员数据
    setTempMembersData() {
      this.members = [
        {
          id: this.currentUserId || 'user_unknown',
          user_id: this.currentUserId || 'user_unknown',
          name: this.currentUser?.username || '用户',
          username: this.currentUser?.username || '用户',
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
      
      if (!currentMember) {
        console.warn('checkIfRoomOwner: 当前用户不在成员列表中')
        console.log('所有成员:', this.members.map(m => ({
          id: m.id,
          name: m.name,
          role: m.role,
          isCurrentUser: m.isCurrentUser
        })))
        console.log('当前用户ID:', this.currentUserId, '类型:', typeof this.currentUserId)
        this.isRoomOwner = false
        return false
      }
      
      // 兼容多种 role 值：host, owner, creator, admin 等
      const role = currentMember.role
      const normalizedRole = typeof role === 'string' ? role.toLowerCase() : role
      
      // 判断是否为房主：host, owner, creator, admin 都视为房主
      const isOwner = normalizedRole === 'host' || 
                     normalizedRole === 'owner' || 
                     normalizedRole === 'creator' || 
                     normalizedRole === 'admin' ||
                     normalizedRole === '房主'
      
      this.isRoomOwner = isOwner
      
      console.log('checkIfRoomOwner 结果:', {
        currentMember: {
          id: currentMember.id,
          name: currentMember.name,
          role: role,
          normalizedRole: normalizedRole
        },
        isRoomOwner: this.isRoomOwner
      })
      
      // 如果应该是房主但不是，输出警告
      if (!this.isRoomOwner && role) {
        console.warn('⚠️ 用户可能是房主，但 role 值不匹配:', role, '支持的 role 值: host, owner, creator, admin')
      }
      
      return this.isRoomOwner
    },
    
    // 获取当前用户的角色（用于调试显示）
    getCurrentUserRole() {
      const currentMember = this.members.find(member => member.isCurrentUser)
      if (!currentMember) {
        return '未找到（不在成员列表中）'
      }
      return currentMember.role || '无角色'
    },

    // 保留方法避免 eslint 未使用报错；实际逻辑在 syncLocalStatus 中
    updateUserStatusToServer() {
      this.statusChanged = false
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

    showRoomSettings() {
      this.showSettings = true
    },

    closeSettings() {
      this.showSettings = false
    },

    async leaveRoom() {
      const userConfirmed = confirm('确定要退出自习室吗？')
      if (!userConfirmed) return

      // 先验证用户ID，避免不必要的 loading 状态
      console.log('正在退出房间...')
      console.log('房间ID:', this.roomId)
      console.log('当前用户ID:', this.currentUserId)
      console.log('用户ID类型:', typeof this.currentUserId)
      
      // 如果用户ID为空，尝试重新加载用户信息
      if (!this.currentUserId && this.currentUserId !== 0) {
        console.warn('用户ID为空，尝试重新加载用户信息...')
        try {
          await this.loadCurrentUser()
          if (!this.currentUserId && this.currentUserId !== 0) {
            console.error('重新加载后用户ID仍为空:', this.currentUserId)
            alert('用户身份信息错误，无法退出。请尝试刷新页面或重新登录。')
            return
          }
        } catch (error) {
          console.error('重新加载用户信息失败:', error)
          alert('获取用户信息失败，无法退出。请尝试刷新页面或重新登录。')
          return
        }
      }
      
      // 尝试将用户ID转换为数字
      let userId = null
      if (typeof this.currentUserId === 'number') {
        userId = this.currentUserId
      } else if (typeof this.currentUserId === 'string') {
        // 如果是字符串，尝试转换为数字
        const numId = Number(this.currentUserId)
        if (!isNaN(numId) && this.currentUserId.trim() !== '') {
          userId = numId
        }
      } else {
        // 尝试直接转换
        const numId = Number(this.currentUserId)
        if (!isNaN(numId)) {
          userId = numId
        }
      }
      
      if (userId === null || isNaN(userId)) {
        console.error('用户ID不是有效的数字:', this.currentUserId)
        alert('用户身份信息错误，无法退出。请尝试刷新页面或重新登录。')
        return
      }
      
      this.loading = true
      
      try {
        // 清理定时器
        if (this.refreshTimer) {
          clearInterval(this.refreshTimer)
          this.refreshTimer = null
        }
        if (this.focusTimer) {
          clearInterval(this.focusTimer)
          this.focusTimer = null
        }
        
        console.log(`发送退出请求: /api/rooms/${this.roomId}/leave?userId=${userId}`)
        console.log('退出逻辑说明: 此API会从后端成员列表中删除当前用户')
        
        // ✅ 调用退出房间API，传递用户ID
        // 这个API应该从后端的成员列表中删除该用户
        const response = await leaveRoom(this.roomId, userId)
        console.log('退出房间API响应:', response)
        console.log('响应详情:', JSON.stringify(response, null, 2))
        
        // 处理响应 - 兼容多种响应格式
        const isSuccess = response && (
          response.code === 200 || 
          response.success === true || 
          response.success === "true" ||
          (response.status === undefined && response.code === undefined && !response.message)
        )
        
        if (isSuccess) {
          console.log('✅ 退出房间成功')
          console.log('说明: 用户已从后端成员列表中移除，其他用户的成员列表会在下次自动刷新时更新（最多5秒）')
          
          // 显示成功消息
          alert('已成功退出自习室')
          
          // 跳转到首页
          this.goToHome()
        } else {
          const errorMsg = response?.message || response?.error || '退出失败'
          console.error('退出房间失败:', errorMsg)
          console.error('响应对象:', response)
          alert(`退出失败: ${errorMsg}`)
        }
        
      } catch (error) {
        console.error('退出房间请求失败:', error)
        
        // 详细的错误处理 - 适配 fetch API 的错误格式
        let errorMessage = '退出失败'
        
        if (error.status) {
          // fetch API 返回的错误可能包含 status
          if (error.status === 404) {
            errorMessage = '房间不存在'
          } else if (error.status === 403) {
            errorMessage = '权限不足，无法退出'
          } else if (error.status === 400 || error.status === 500) {
            errorMessage = `服务器错误: ${error.status}`
          } else {
            errorMessage = `退出失败: ${error.message || `服务器错误: ${error.status}`}`
          }
        } else if (error.message) {
          errorMessage = error.message
          if (error.message.includes('无法连接到服务器')) {
            errorMessage = '无法连接到服务器，请检查网络连接'
          }
        }
        
        alert(errorMessage)
      } finally {
        this.loading = false
      }
    },
    
    goToHome() {
      this.$router.push('/')
    },

    goToJoinRoom() {
      this.$router.push('/join-room')
    },

    async disbandRoom() {
      if (!this.isRoomOwner) {
        console.warn('非房主尝试解散房间')
        return
      }
      
      // 使用更友好的确认对话框
      const confirmed = confirm(
        '⚠️ 确定要解散自习室吗？\n\n' +
        '• 房间将被永久删除\n' +
        '• 所有成员将被移出\n' +
        '• 此操作不可恢复\n\n' +
        '如果确定，请点击"确定"'
      )
      
      if (!confirmed) {
        console.log('用户取消解散房间')
        return
      }

      try {
        this.loading = true
        console.log('开始解散房间...')
        console.log('房间ID:', this.roomId)
        console.log('用户ID:', this.currentUserId)
        
        const userIdNumber = Number(this.currentUserId)
        const userIdForRequest = isNaN(userIdNumber) ? this.currentUserId : userIdNumber
        
        console.log('调用解散房间API...')
        const response = await deleteRoom(this.roomId, userIdForRequest)
        console.log('解散房间响应:', response)
        
        if (response && (response.code === 200 || response.success === true)) {
          console.log('✅ 自习室解散成功')
          alert('✅ 自习室已成功解散')
          this.goToHome()
        } else {
          const errorMsg = response?.message || '解散失败，请稍后再试'
          console.error('解散房间失败:', errorMsg)
          alert(`解散失败: ${errorMsg}`)
        }
      } catch (error) {
        console.error('解散房间失败:', error)
        let errorMessage = '解散失败，请稍后再试'
        
        if (error.message) {
          errorMessage = error.message
        } else if (error.status) {
          if (error.status === 403) {
            errorMessage = '权限不足，无法解散自习室'
          } else if (error.status === 404) {
            errorMessage = '房间不存在'
          } else {
            errorMessage = `服务器错误: ${error.status}`
          }
        }
        
        alert(errorMessage)
      } finally {
        this.loading = false
      }
    },

    startMembersAutoRefresh() {
      if (this.refreshTimer) {
        clearInterval(this.refreshTimer)
      }
      this.refreshTimer = setInterval(() => {
        this.loadMembersData()
      }, this.refreshInterval)
    },

    updateMemberStatusLocally(status) {
      const currentIdStr = this.normalizedCurrentUserId
      if (!currentIdStr) return
      let found = false
      this.members = this.members.map(member => {
        const memberIdStr = member?.user_id !== undefined && member?.user_id !== null
          ? String(member.user_id)
          : member?.id !== undefined && member?.id !== null
            ? String(member.id)
            : null
        if (memberIdStr && memberIdStr === currentIdStr) {
          found = true
          return {
            ...member,
            status,
            focusTime: status === 'focusing' ? '进行中' : '',
            restTime: status === 'resting' ? '休息中' : ''
          }
        }
        return member
      })

      // 如果当前用户不在列表，补充一条以保证前端立即显示
      if (!found) {
        this.members = [
          ...this.members,
          {
            id: currentIdStr,
            user_id: currentIdStr,
            name: this.currentUser?.username || '用户',
            username: this.currentUser?.username || '用户',
            role: this.isRoomOwner ? 'host' : 'member',
            status,
            focusTime: status === 'focusing' ? '进行中' : '',
            restTime: status === 'resting' ? '休息中' : '',
            isCurrentUser: true
          }
        ]
      }
    }
  },
  beforeUnmount() {
    if (this.focusTimer) {
      clearInterval(this.focusTimer)
    }
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer)
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
  display: flex;
  align-items: center;
  gap: 8px;
}

.settings-btn:hover {
  background: #e69c55;
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(238, 170, 103, 0.3);
}

.settings-btn .btn-icon {
  font-size: 1.1em;
}

.settings-btn .btn-text {
  font-size: 1em;
}

.disband-btn {
  background: linear-gradient(135deg, #ff6b6b, #ff8787);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 10px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-right: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
  box-shadow: 0 2px 8px rgba(255, 107, 107, 0.3);
}

.disband-btn:hover {
  background: linear-gradient(135deg, #fa5252, #ff6b6b);
  box-shadow: 0 4px 15px rgba(250, 82, 82, 0.4);
  transform: translateY(-2px);
}

.disband-btn:active {
  transform: translateY(0);
  box-shadow: 0 2px 8px rgba(250, 82, 82, 0.3);
}

.disband-btn .btn-icon {
  font-size: 1.1em;
}

.disband-btn .btn-text {
  font-size: 1em;
}

/* 导航栏中的解散按钮 */
.disband-nav-btn {
  background: linear-gradient(135deg, #ff6b6b, #ff8787) !important;
  color: white !important;
  border: none !important;
  font-weight: 600 !important;
  box-shadow: 0 2px 8px rgba(255, 107, 107, 0.3) !important;
}

.disband-nav-btn:hover {
  background: linear-gradient(135deg, #fa5252, #ff6b6b) !important;
  box-shadow: 0 4px 15px rgba(250, 82, 82, 0.4) !important;
  transform: translateY(-2px) !important;
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

/* 番茄钟组件样式 */
.timer-component {
  background: white;
  border-radius: 16px;
  padding: 30px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border: 1px solid #e9ecef;
  width: 100%;
  height: 100%; /* 让高度自动适应 */
  min-height: 550px; /* 设置最小高度与下方一致 */
  display: flex;
  flex-direction: column;
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

.status-display {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 14px;
  border-radius: 10px;
  border: 1px solid #e0e0e0;
  background: #f8f9fa;
}

.status-display.focusing {
  border-color: #b7e4c7;
  background: #e8f6ed;
}

.status-display.resting {
  border-color: #ffe0c2;
  background: #fff6ed;
}

.status-label {
  font-weight: 600;
  color: #333;
}

.status-tip {
  color: #777;
  font-size: 0.9em;
}

.focus-time {
  text-align: center;
  color: #eeaa67;
  font-weight: 600;
  font-size: 1.1em;
}

.rest-tip {
  text-align: center;
  color: #666;
  font-size: 0.95em;
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