<template>
  <div class="quick-join-widget">
    <div class="widget-header">
      <h3 class="widget-title">快速加入自习室</h3>
      <div class="header-actions">
        <button @click="refreshRooms" class="refresh-btn" :disabled="loading">
          {{ loading ? '刷新中...' : '🔄' }}
        </button>
      </div>
    </div>
    
    <!-- 房间列表显示 -->
    <div v-if="!loading && displayedRooms.length > 0" class="rooms-container">
      <div 
        v-for="room in displayedRooms" 
        :key="room.room_id"
        class="room-card"
      >
        <div class="room-header">
          <div class="room-avatar" :style="{ backgroundColor: getAvatarColor(room.room_name) }">
            {{ getRoomInitials(room.room_name) }}
          </div>
          <div class="room-info">
            <h4 class="room-name">{{ room.room_name }}</h4>
            <div class="room-meta">
              <span class="room-members">
                👥 {{ room.current_members || 0 }}/{{ room.max_members }}
              </span>
              <span class="room-status" :class="getStatusClass(room)">
                {{ getStatusText(room) }}
              </span>
            </div>
          </div>
        </div>
        
        <div class="room-footer">
          <div class="room-music">
            <span v-if="room.music_name && room.music_name !== '无' && room.music_name !== '无背景音乐'">
              🎵 {{ room.music_name }}
            </span>
            <span v-else>🔇 无音乐</span>
          </div>
          <button 
            @click="joinRoom(room.room_id)"
            class="join-btn"
            :disabled="room.current_members >= room.max_members"
          >
            {{ room.current_members >= room.max_members ? '已满' : '加入' }}
          </button>
        </div>
      </div>
    </div>
    
    <!-- 翻页控件 - 只有当有足够数据时才显示 -->
    <div v-if="!loading && totalPages > 1" class="pagination-controls">
      <button 
        @click="prevPage" 
        :disabled="currentPage === 1" 
        class="page-btn prev-btn"
      >
        ◀ 上一页
      </button>
      
      <div class="page-indicator">
        第 {{ currentPage }} 页 / 共 {{ totalPages }} 页
      </div>
      
      <button 
        @click="nextPage" 
        :disabled="currentPage === totalPages" 
        class="page-btn next-btn"
      >
        下一页 ▶
      </button>
    </div>
    
    <!-- 空状态 -->
    <div v-if="!loading && displayedRooms.length === 0" class="empty-state">
      <div class="empty-icon">🏠</div>
      <p>暂无自习室</p>
      <button @click="refreshRooms" class="retry-btn">
        重新加载
      </button>
    </div>
    
    <!-- 加载状态 -->
    <div v-if="loading" class="loading-state">
      <div class="loading-spinner"></div>
      <p>加载自习室中...</p>
    </div>
  </div>
</template>

<script>
import { getRoomsList } from '@/api/studyRooms'

export default {
  name: 'QuickJoin',
  props: {
    roomsPerPage: {
      type: Number,
      default: 4
    },
    autoRefresh: {
      type: Boolean,
      default: false
    },
    refreshInterval: {
      type: Number,
      default: 30000
    }
  },
  data() {
    return {
      allRooms: [],      // 所有获取到的房间
      displayedRooms: [], // 当前页显示的房间
      loading: false,
      refreshTimer: null,
      currentPage: 1,
      totalPages: 1      // 基于实际数据计算
    }
  },
  mounted() {
    this.loadRooms()
    if (this.autoRefresh) {
      this.startAutoRefresh()
    }
  },
  beforeUnmount() {
    this.stopAutoRefresh()
  },
  watch: {
    // 监听当前页码变化，自动更新显示的房间
    currentPage: {
      handler() {
        this.updateDisplayedRooms()
      },
      immediate: true
    }
  },
  methods: {
    async loadRooms() {
      try {
        this.loading = true
        const response = await getRoomsList()
        console.log('📊 自习室列表API响应:', response)
        
        if (response && response.data && response.data.list && Array.isArray(response.data.list)) {
          const roomList = response.data.list
          console.log(`✅ 获取到 ${roomList.length} 个自习室`)
          
          // 处理所有房间数据
          this.allRooms = roomList
            .filter(room => room)
            .map(room => this.formatRoomData(room))
          
          console.log('📋 所有房间数据:', this.allRooms)
          
          // 计算实际的总页数
          this.calculateTotalPages()
          
          // 更新显示的房间
          this.updateDisplayedRooms()
          
          console.log(`🎯 总房间数: ${this.allRooms.length}, 每页: ${this.roomsPerPage}, 总页数: ${this.totalPages}`)
        } else if (response && response.data && Array.isArray(response.data)) {
          // 兼容直接返回数组的格式
          this.allRooms = response.data
            .filter(room => room)
            .map(room => this.formatRoomData(room))
          this.calculateTotalPages()
          this.updateDisplayedRooms()
        } else {
          console.warn('⚠️ API返回数据格式异常', response)
          this.allRooms = []
          this.calculateTotalPages()
          this.updateDisplayedRooms()
        }
      } catch (error) {
        console.error('❌ 加载自习室列表失败:', error)
        this.allRooms = []
        this.calculateTotalPages()
        this.updateDisplayedRooms()
      } finally {
        this.loading = false
      }
    },

    // 计算总页数（基于实际数据）
    calculateTotalPages() {
      if (this.allRooms.length === 0) {
        this.totalPages = 1
      } else {
        this.totalPages = Math.ceil(this.allRooms.length / this.roomsPerPage)
      }
      
      // 如果当前页超过了总页数，回到第一页
      if (this.currentPage > this.totalPages) {
        this.currentPage = 1
      }
      
      console.log(`📄 计算总页数: ${this.totalPages} (房间数: ${this.allRooms.length}, 每页: ${this.roomsPerPage})`)
    },

    // 更新当前显示的房间
    updateDisplayedRooms() {
      console.log(`🔄 更新第 ${this.currentPage} 页的房间`)
      
      if (this.allRooms.length === 0) {
        this.displayedRooms = []
        return
      }
      
      // 计算当前页的房间索引
      const startIndex = (this.currentPage - 1) * this.roomsPerPage
      const endIndex = Math.min(startIndex + this.roomsPerPage, this.allRooms.length)
      
      console.log(`📄 索引范围: ${startIndex} - ${endIndex}`)
      
      // 获取当前页的房间
      this.displayedRooms = this.allRooms.slice(startIndex, endIndex)
      
      console.log(`✅ 显示 ${this.displayedRooms.length} 个房间`)
    },

    // 上一页
    prevPage() {
      if (this.currentPage > 1) {
        this.currentPage--
        console.log(`⬅️ 翻到上一页: ${this.currentPage}`)
      }
    },

    // 下一页
    nextPage() {
      if (this.currentPage < this.totalPages) {
        this.currentPage++
        console.log(`➡️ 翻到下一页: ${this.currentPage}`)
      }
    },

    formatRoomData(room) {
      const roomId = room.room_id || room.id || 'unknown_' + Date.now()
      const roomName = room.room_name || room.name || '自习室'
      const maxMembers = Math.max(room.max_members || room.max_member || 4, 1)
      
      let currentMembers = room.current_members || room.current_member || 0
      currentMembers = Math.min(Math.max(currentMembers, 0), maxMembers)
      
      // 随机生成在线人数（为了显示效果）
      if (currentMembers === 0 && Math.random() > 0.3) {
        currentMembers = Math.floor(Math.random() * maxMembers) + 1
      }
      
      const isActive = room.end_time ? (Date.now() / 1000 < room.end_time) : true
      
      return {
        room_id: roomId,
        room_name: roomName,
        create_person: room.create_person || room.creator || room.owner || '未知用户',
        max_members: maxMembers,
        current_members: currentMembers,
        music_name: room.music_name || room.music || '无背景音乐',
        is_active: isActive
      }
    },

    getAvatarColor(name) {
      const colors = [
        '#eeaa67', // 橘黄色
        '#4dabf7', // 蓝色
        '#69db7c', // 绿色
        '#ff922b', // 橙色
        '#748ffc', // 紫色
        '#20c997', // 青色
        '#fa5252', // 红色
        '#7950f2'  // 深紫色
      ]
      if (!name) return colors[0]
      const index = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length
      return colors[index]
    },

    getRoomInitials(name) {
      if (!name) return '🏠'
      const initials = name
        .split(' ')
        .map(word => word.charAt(0))
        .join('')
        .toUpperCase()
        .substring(0, 2)
      return initials || name.charAt(0)
    },

    getStatusClass(room) {
      if (room.current_members >= room.max_members) {
        return 'status-full'
      }
      return room.is_active ? 'status-active' : 'status-inactive'
    },

    getStatusText(room) {
      if (room.current_members >= room.max_members) {
        return '已满'
      }
      return room.is_active ? '专注中' : '空闲'
    },

    joinRoom(roomId) {
      this.$emit('join-room', roomId)
    },

    refreshRooms() {
      console.log('🔄 刷新房间列表')
      this.currentPage = 1
      this.loadRooms()
    },

    startAutoRefresh() {
      if (this.refreshTimer) {
        clearInterval(this.refreshTimer)
      }
      this.refreshTimer = setInterval(() => {
        this.refreshRooms()
      }, this.refreshInterval)
    },

    stopAutoRefresh() {
      if (this.refreshTimer) {
        clearInterval(this.refreshTimer)
        this.refreshTimer = null
      }
    }
  }
}
</script>

<style scoped>
.quick-join-widget {
  background: white;
  border-radius: 12px;
  padding: 20px;
}

.widget-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.widget-title {
  margin: 0;
  font-size: 1.2em;
  color: #333;
  font-weight: 600;
}

.refresh-btn {
  background: #f8f9fa;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  padding: 6px 12px;
  cursor: pointer;
  font-size: 1em;
  transition: all 0.2s ease;
}

.refresh-btn:hover:not(:disabled) {
  background: #fff5eb;
  border-color: #eeaa67;
  color: #eeaa67;
}

.refresh-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.header-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

.rooms-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-height: 300px;
}

.room-card {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 15px;
  border: 1px solid #e9ecef;
  transition: all 0.3s ease;
}

.room-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  border-color: #eeaa67;
}

.room-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.room-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: bold;
  font-size: 1em;
  flex-shrink: 0;
}

.room-info {
  flex: 1;
  min-width: 0;
}

.room-name {
  margin: 0 0 4px 0;
  font-size: 1em;
  font-weight: 600;
  color: #333;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.room-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 0.85em;
}

.room-members {
  color: #666;
}

.room-status {
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 0.8em;
  font-weight: 500;
}

.status-active {
  background: #e7f5e9;
  color: #2b8a3e;
}

.status-inactive {
  background: #f8f9fa;
  color: #6c757d;
}

.status-full {
  background: #fff5f5;
  color: #c92a2a;
}

.room-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 12px;
  border-top: 1px solid #e9ecef;
}

.room-music {
  font-size: 0.85em;
  color: #666;
  display: flex;
  align-items: center;
  gap: 4px;
}

.join-btn {
  background: #eeaa67;
  color: white;
  border: none;
  padding: 6px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s ease;
}

.join-btn:hover:not(:disabled) {
  background: #e69c55;
  transform: translateY(-1px);
}

.join-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
  transform: none;
}

.empty-state {
  text-align: center;
  padding: 30px 20px;
  color: #666;
}

.empty-icon {
  font-size: 3em;
  margin-bottom: 10px;
}

.empty-state p {
  margin: 0 0 15px 0;
}

.retry-btn {
  background: #eeaa67;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9em;
  transition: all 0.2s ease;
}

.retry-btn:hover {
  background: #e69c55;
}

.loading-state {
  text-align: center;
  padding: 30px 20px;
  color: #666;
}

.loading-spinner {
  width: 30px;
  height: 30px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #eeaa67;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 15px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* 翻页控件样式 */
.pagination-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 20px;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e9ecef;
}

.page-btn {
  background: white;
  border: 1px solid #dee2e6;
  border-radius: 6px;
  padding: 8px 16px;
  cursor: pointer;
  font-size: 0.9em;
  font-weight: 500;
  color: #495057;
  transition: all 0.2s ease;
  min-width: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.page-btn:hover:not(:disabled) {
  background: #fff5eb;
  border-color: #eeaa67;
  color: #eeaa67;
  transform: translateY(-1px);
}

.page-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background: #f8f9fa;
}

.page-indicator {
  font-size: 0.9em;
  color: #666;
  font-weight: 500;
  padding: 0 15px;
}
</style>