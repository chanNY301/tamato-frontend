<template>
  <div class="friends-view">
    <!-- 顶部导航栏 -->
    <nav class="navbar">
      <div class="nav-brand">Tomato</div>
      <div class="nav-links">
        <a class="nav-link" @click="goToHome">返回首页</a>
      </div>
    </nav>

    <main class="main-content">
      <!-- 页面标题 -->
      <div class="page-header">
        <h1 class="page-title">好友管理</h1>
        <p class="page-subtitle">搜索用户、管理好友关系</p>
      </div>

      <div class="friends-layout">
        <!-- 左侧：搜索和好友申请 -->
        <div class="left-section">
          <!-- 搜索用户 -->
          <div class="search-section">
            <h2 class="section-title">搜索用户</h2>
            <div class="search-box">
              <input 
                type="text" 
                v-model="searchUsername" 
                placeholder="请输入用户名"
                class="search-input"
                @keyup.enter="handleSearch"
              >
              <button @click="handleSearch" class="search-btn" :disabled="searching">
                {{ searching ? '搜索中...' : '搜索' }}
              </button>
            </div>
            
            <!-- 搜索结果 -->
            <div v-if="searchResult" class="search-result">
              <div class="user-card">
                <div class="user-avatar">
                  <img 
                    :src="getAvatarUrl(searchResult.avatar)" 
                    alt="用户头像"
                    @error="handleAvatarError"
                  />
                </div>
                <div class="user-info">
                  <h3 class="user-name">{{ searchResult.username }}</h3>
                  <p class="user-id">ID: {{ searchResult.user_id }}</p>
                  <div class="user-status">
                    <span :class="['status-dot', getStatusClass(searchResult.status)]"></span>
                    <span>{{ searchResult.status || '未知' }}</span>
                  </div>
                </div>
                <div class="user-actions">
                  <button 
                    v-if="!isFriend(searchResult.user_id) && !hasPendingRequest(searchResult.user_id)"
                    @click="showSendRequestModal(searchResult)"
                    class="btn-add-friend"
                  >
                    添加好友
                  </button>
                  <span v-else-if="isFriend(searchResult.user_id)" class="friend-badge">已是好友</span>
                  <span v-else class="pending-badge">申请中</span>
                </div>
              </div>
            </div>
            
            <!-- 搜索错误提示 -->
            <div v-if="searchError" class="error-message">
              {{ searchError }}
            </div>
          </div>

          <!-- 好友申请 -->
          <div class="requests-section">
            <h2 class="section-title">好友申请</h2>
            <div v-if="loadingRequests" class="loading-state">
              <div class="spinner"></div>
              <p>加载中...</p>
            </div>
            <div v-else-if="friendRequests.length === 0" class="empty-state">
              <p>暂无好友申请</p>
            </div>
            <div v-else class="requests-list">
              <div 
                v-for="request in friendRequests" 
                :key="request.id"
                class="request-item"
              >
                <div class="request-avatar">
                  <img 
                    :src="getAvatarUrl(request.from_user_avatar || request.avatar)" 
                    alt="头像"
                    @error="handleAvatarError"
                  />
                </div>
                <div class="request-info">
                  <h4 class="request-name">{{ request.from_user_name || request.from_username }}</h4>
                  <p class="request-message" v-if="request.message">{{ request.message }}</p>
                  <p class="request-time">{{ formatTime(request.created_at || request.createdAt) }}</p>
                </div>
                <div class="request-actions">
                  <button 
                    @click="handleRequest(request, 'accept')"
                    class="btn-accept"
                    :disabled="request.status !== '待处理'"
                  >
                    接受
                  </button>
                  <button 
                    @click="handleRequest(request, 'reject')"
                    class="btn-reject"
                    :disabled="request.status !== '待处理'"
                  >
                    拒绝
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 右侧：好友列表 -->
        <div class="right-section">
          <div class="friends-list-section">
            <div class="section-header">
              <h2 class="section-title">我的好友</h2>
              <button @click="refreshFriends" class="refresh-btn" :disabled="loadingFriends">
                {{ loadingFriends ? '刷新中...' : '🔄' }}
              </button>
            </div>

            <div v-if="loadingFriends" class="loading-state">
              <div class="spinner"></div>
              <p>加载中...</p>
            </div>
            <div v-else-if="friendsList.length === 0" class="empty-state">
              <div class="empty-icon">👥</div>
              <h3>暂无好友</h3>
              <p>搜索用户并发送好友申请吧</p>
            </div>
            <div v-else class="friends-list">
              <div 
                v-for="friend in friendsList" 
                :key="friend.friend_id"
                class="friend-item"
              >
                <div class="friend-avatar">
                  <img 
                    :src="getAvatarUrl(friend.friend_avatar || friend.avatar)" 
                    alt="好友头像"
                    @error="handleAvatarError"
                  />
                </div>
                <div class="friend-info">
                  <h4 class="friend-name">{{ friend.friend_name || friend.friend_username }}</h4>
                  <div class="friend-status">
                    <span :class="['status-dot', getStatusClass(friend.friend_status)]"></span>
                    <span>{{ friend.friend_status || '未知' }}</span>
                  </div>
                </div>
                <button 
                  @click="showDeleteConfirm(friend)"
                  class="btn-delete"
                >
                  删除
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- 发送好友申请弹窗 -->
    <div v-if="showRequestModal" class="modal-overlay" @click="closeRequestModal">
      <div class="modal-content" @click.stop>
        <h3 class="modal-title">发送好友申请</h3>
        <form @submit.prevent="sendFriendRequest">
          <div class="form-group">
            <label class="form-label">用户名</label>
            <input 
              type="text" 
              :value="selectedUser?.username" 
              class="form-input"
              disabled
            >
          </div>
          <div class="form-group">
            <label class="form-label">申请留言（可选）</label>
            <textarea 
              v-model="requestMessage"
              placeholder="请输入申请留言"
              class="form-textarea"
              rows="3"
            ></textarea>
          </div>
          <div class="form-actions">
            <button type="button" @click="closeRequestModal" class="cancel-btn">
              取消
            </button>
            <button type="submit" class="confirm-btn" :disabled="sendingRequest">
              {{ sendingRequest ? '发送中...' : '发送申请' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- 删除确认弹窗 -->
    <div v-if="showDeleteModal" class="modal-overlay" @click="closeDeleteModal">
      <div class="modal-content" @click.stop>
        <h3 class="modal-title">确认删除</h3>
        <p class="modal-message">确定要删除好友 <strong>{{ selectedFriend?.friend_name || selectedFriend?.friend_username }}</strong> 吗？</p>
        <div class="form-actions">
          <button type="button" @click="closeDeleteModal" class="cancel-btn">
            取消
          </button>
          <button @click="confirmDelete" class="confirm-btn delete-confirm-btn" :disabled="deleting">
            {{ deleting ? '删除中...' : '确认删除' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { searchUser, sendFriendRequest, getFriendRequests, processFriendRequest, getFriends, deleteFriend } from '@/api/friends'
import { getCurrentUser } from '@/api/user'
import avatarImage from '@/assets/images/avatar.png'
import { API_BASE_URL } from '@/api/config'

export default {
  name: 'FriendsView',
  data() {
    return {
      searchUsername: '',
      searching: false,
      searchResult: null,
      searchError: '',
      friendRequests: [],
      loadingRequests: false,
      friendsList: [],
      loadingFriends: false,
      showRequestModal: false,
      selectedUser: null,
      requestMessage: '',
      sendingRequest: false,
      showDeleteModal: false,
      selectedFriend: null,
      deleting: false,
      currentUserId: null
    }
  },
  async mounted() {
    await this.initUser()
    await this.loadFriendRequests()
    await this.loadFriends()
  },
  methods: {
    async initUser() {
      try {
        const userResult = await getCurrentUser()
        if (userResult.success && userResult.data) {
          this.currentUserId = userResult.data.user_id
        }
      } catch (error) {
        console.error('获取用户信息失败:', error)
      }
    },

    async handleSearch() {
      if (!this.searchUsername.trim()) {
        this.searchError = '请输入用户名'
        return
      }

      this.searching = true
      this.searchError = ''
      this.searchResult = null

      try {
        // 由于后端可能没有专门的搜索API，我们直接创建一个用户对象用于发送申请
        // 如果后端有搜索接口，可以在这里调用
        const response = await searchUser(this.searchUsername.trim())
        
        if (response.success && response.data) {
          this.searchResult = response.data
        } else {
          this.searchError = response.message || '用户不存在'
        }
      } catch (error) {
        console.error('搜索用户失败:', error)
        // 如果搜索接口不存在，创建一个简单的用户对象用于发送申请
        // 实际发送申请时，后端会验证用户是否存在
        this.searchResult = {
          username: this.searchUsername.trim(),
          user_id: null,
          status: '未知',
          avatar: null
        }
        this.searchError = ''
      } finally {
        this.searching = false
      }
    },

    showSendRequestModal(user) {
      this.selectedUser = user
      this.requestMessage = ''
      this.showRequestModal = true
    },

    closeRequestModal() {
      this.showRequestModal = false
      this.selectedUser = null
      this.requestMessage = ''
    },

    async sendFriendRequest() {
      if (!this.selectedUser) return

      this.sendingRequest = true
      try {
        const response = await sendFriendRequest({
          user_name: this.selectedUser.username || this.searchUsername.trim(),
          message: this.requestMessage.trim() || null
        })

        if (response.success === true || response.success === "true") {
          alert('好友申请发送成功！')
          this.closeRequestModal()
          this.searchResult = null
          this.searchUsername = ''
          await this.loadFriendRequests()
        } else {
          alert(response.message || '发送好友申请失败')
        }
      } catch (error) {
        console.error('发送好友申请失败:', error)
        alert('发送好友申请失败: ' + (error.message || '未知错误'))
      } finally {
        this.sendingRequest = false
      }
    },

    async loadFriendRequests() {
      this.loadingRequests = true
      try {
        const response = await getFriendRequests()
        
        if (response.success === true || response.success === "true" || response.code === 200) {
          // 只显示待处理的申请
          this.friendRequests = (response.data || []).filter(req => req.status === '待处理')
        } else {
          console.error('获取好友申请失败:', response.message)
          this.friendRequests = []
        }
      } catch (error) {
        console.error('加载好友申请失败:', error)
        this.friendRequests = []
      } finally {
        this.loadingRequests = false
      }
    },

    async handleRequest(request, action) {
      try {
        const response = await processFriendRequest({
          from_user_id: request.from_user_id,
          action: action
        })

        if (response.success === true || response.success === "true") {
          alert(action === 'accept' ? '已接受好友申请' : '已拒绝好友申请')
          await this.loadFriendRequests()
          if (action === 'accept') {
            await this.loadFriends()
          }
        } else {
          alert(response.message || '处理失败')
        }
      } catch (error) {
        console.error('处理好友申请失败:', error)
        alert('处理失败: ' + (error.message || '未知错误'))
      }
    },

    async loadFriends() {
      this.loadingFriends = true
      try {
        const response = await getFriends()
        
        if (response.success === true || response.success === "true" || response.code === 200) {
          this.friendsList = response.data || []
        } else {
          console.error('获取好友列表失败:', response.message)
          this.friendsList = []
        }
      } catch (error) {
        console.error('加载好友列表失败:', error)
        this.friendsList = []
      } finally {
        this.loadingFriends = false
      }
    },

    refreshFriends() {
      this.loadFriends()
      this.loadFriendRequests()
    },

    showDeleteConfirm(friend) {
      this.selectedFriend = friend
      this.showDeleteModal = true
    },

    closeDeleteModal() {
      this.showDeleteModal = false
      this.selectedFriend = null
    },

    async confirmDelete() {
      if (!this.selectedFriend) return

      this.deleting = true
      try {
        const response = await deleteFriend({
          friend_name: this.selectedFriend.friend_name || this.selectedFriend.friend_username
        })

        if (response.success === true || response.success === "true") {
          alert('删除好友成功')
          this.closeDeleteModal()
          await this.loadFriends()
        } else {
          alert(response.message || '删除好友失败')
        }
      } catch (error) {
        console.error('删除好友失败:', error)
        alert('删除好友失败: ' + (error.message || '未知错误'))
      } finally {
        this.deleting = false
      }
    },

    isFriend(userId) {
      return this.friendsList.some(f => f.friend_id === userId)
    },

    hasPendingRequest(userId) {
      return this.friendRequests.some(r => r.from_user_id === userId && r.status === '待处理')
    },

    getStatusClass(status) {
      if (status === '在线') return 'status-online'
      if (status === '专注中') return 'status-busy'
      return 'status-offline'
    },

    getAvatarUrl(avatar) {
      if (!avatar || avatar === avatarImage) {
        return avatarImage
      }
      if (avatar.startsWith('http')) {
        return avatar
      }
      if (avatar.startsWith('/')) {
        return `http://localhost:8090${avatar}`
      }
      return `${API_BASE_URL}${avatar}`
    },

    handleAvatarError(event) {
      event.target.src = avatarImage
    },

    formatTime(timeStr) {
      if (!timeStr) return '-'
      const date = new Date(timeStr)
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString().slice(0, 5)
    },

    goToHome() {
      this.$router.push('/')
    }
  }
}
</script>

<style scoped>
/* 使用白色背景 */
.friends-view {
  min-height: 100vh;
  background: #ffffff;
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

/* 主要内容区域 */
.main-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 40px 5%;
}

.page-header {
  text-align: center;
  margin-bottom: 40px;
}

.page-title {
  font-size: 2.8em;
  color: #333;
  font-weight: 700;
  margin: 0 0 12px 0;
  background: linear-gradient(135deg, #eeaa67, #ff8c42);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.page-subtitle {
  font-size: 1.2em;
  color: #666;
  margin: 0;
}

/* 好友布局 */
.friends-layout {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 30px;
  align-items: start;
}

/* 左侧区域 */
.left-section {
  display: flex;
  flex-direction: column;
  gap: 30px;
}

/* 搜索区域 */
.search-section,
.requests-section {
  background: white;
  border-radius: 16px;
  padding: 30px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border: 1px solid #e9ecef;
}

.section-title {
  font-size: 1.6em;
  color: #333;
  font-weight: 600;
  margin: 0 0 20px 0;
}

.search-box {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
}

.search-input {
  flex: 1;
  padding: 12px 16px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 1em;
  transition: all 0.3s ease;
}

.search-input:focus {
  outline: none;
  border-color: #eeaa67;
  box-shadow: 0 0 0 3px rgba(238, 170, 103, 0.1);
}

.search-btn {
  padding: 12px 24px;
  background: #eeaa67;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.search-btn:hover:not(:disabled) {
  background: #e69c55;
  transform: translateY(-1px);
  box-shadow: 0 4px 15px rgba(238, 170, 103, 0.3);
}

.search-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.search-result {
  margin-top: 20px;
}

.user-card {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 12px;
  border: 1px solid #e9ecef;
}

.user-avatar {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
  background: #ddd;
}

.user-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.user-info {
  flex: 1;
  min-width: 0;
}

.user-name {
  margin: 0 0 4px 0;
  font-size: 1.1em;
  font-weight: 600;
  color: #333;
}

.user-id {
  margin: 0 0 8px 0;
  font-size: 0.9em;
  color: #666;
}

.user-status {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.85em;
  color: #666;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.status-dot.status-online {
  background-color: #4CAF50;
}

.status-dot.status-busy {
  background-color: #f1c40f;
}

.status-dot.status-offline {
  background-color: #95a5a6;
}

.user-actions {
  flex-shrink: 0;
}

.btn-add-friend {
  padding: 8px 16px;
  background: #eeaa67;
  color: white;
  border: none;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-add-friend:hover {
  background: #e69c55;
}

.friend-badge,
.pending-badge {
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 0.9em;
  font-weight: 500;
}

.friend-badge {
  background: #e7f5e9;
  color: #2b8a3e;
}

.pending-badge {
  background: #fff9f2;
  color: #eeaa67;
}

.error-message {
  margin-top: 12px;
  padding: 12px;
  background: #fff5f5;
  color: #c92a2a;
  border-radius: 8px;
  font-size: 0.9em;
}

/* 好友申请列表 */
.requests-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.request-item {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 12px;
  border: 1px solid #e9ecef;
  transition: all 0.2s ease;
}

.request-item:hover {
  border-color: #eeaa67;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.request-avatar {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
  background: #ddd;
}

.request-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.request-info {
  flex: 1;
  min-width: 0;
}

.request-name {
  margin: 0 0 4px 0;
  font-size: 1em;
  font-weight: 600;
  color: #333;
}

.request-message {
  margin: 0 0 4px 0;
  font-size: 0.9em;
  color: #666;
}

.request-time {
  margin: 0;
  font-size: 0.85em;
  color: #999;
}

.request-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.btn-accept,
.btn-reject {
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-accept {
  background: #4CAF50;
  color: white;
}

.btn-accept:hover:not(:disabled) {
  background: #45a049;
}

.btn-reject {
  background: #f8f9fa;
  color: #666;
  border: 1px solid #e0e0e0;
}

.btn-reject:hover:not(:disabled) {
  background: #e9ecef;
  border-color: #ccc;
}

.btn-accept:disabled,
.btn-reject:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 右侧好友列表 */
.right-section {
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
  margin-bottom: 20px;
}

.refresh-btn {
  padding: 8px 12px;
  background: #f8f9fa;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
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

.friends-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.friend-item {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 12px;
  border: 1px solid #e9ecef;
  transition: all 0.2s ease;
}

.friend-item:hover {
  border-color: #eeaa67;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.friend-avatar {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
  background: #ddd;
}

.friend-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.friend-info {
  flex: 1;
  min-width: 0;
}

.friend-name {
  margin: 0 0 4px 0;
  font-size: 1em;
  font-weight: 600;
  color: #333;
}

.friend-status {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.85em;
  color: #666;
}

.btn-delete {
  padding: 8px 16px;
  background: #fff5f5;
  color: #c92a2a;
  border: 1px solid #ffcccc;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-delete:hover {
  background: #ffebee;
  border-color: #ff9999;
}

/* 空状态和加载状态 */
.empty-state,
.loading-state {
  text-align: center;
  padding: 40px 20px;
  color: #666;
}

.empty-icon {
  font-size: 4em;
  margin-bottom: 20px;
}

.empty-state h3 {
  margin: 0 0 12px 0;
  color: #333;
}

.empty-state p {
  margin: 0;
}

.spinner {
  border: 4px solid rgba(0, 0, 0, 0.1);
  border-top: 4px solid #eeaa67;
  border-radius: 50%;
  width: 30px;
  height: 30px;
  animation: spin 1s linear infinite;
  margin: 0 auto 15px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
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

.modal-content {
  background: white;
  border-radius: 16px;
  padding: 30px;
  max-width: 500px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
}

.modal-title {
  font-size: 1.5em;
  color: #333;
  margin: 0 0 25px 0;
  font-weight: 600;
}

.modal-message {
  margin: 0 0 25px 0;
  color: #666;
  line-height: 1.6;
}

.form-group {
  margin-bottom: 20px;
}

.form-label {
  display: block;
  font-weight: 500;
  color: #333;
  margin-bottom: 8px;
}

.form-input,
.form-textarea {
  width: 100%;
  padding: 12px 16px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 1em;
  transition: all 0.3s ease;
  font-family: inherit;
}

.form-input:focus,
.form-textarea:focus {
  outline: none;
  border-color: #eeaa67;
  box-shadow: 0 0 0 3px rgba(238, 170, 103, 0.1);
}

.form-input:disabled {
  background: #f8f9fa;
  cursor: not-allowed;
}

.form-textarea {
  resize: vertical;
  min-height: 80px;
}

.form-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 20px;
}

.cancel-btn,
.confirm-btn {
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.cancel-btn {
  background: #f8f9fa;
  color: #666;
  border: 2px solid #e0e0e0;
}

.cancel-btn:hover {
  background: #e9ecef;
}

.confirm-btn {
  background: #eeaa67;
  color: white;
}

.confirm-btn:hover:not(:disabled) {
  background: #e69c55;
  transform: translateY(-1px);
  box-shadow: 0 4px 15px rgba(238, 170, 103, 0.3);
}

.confirm-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.delete-confirm-btn {
  background: #c92a2a;
  color: white;
}

.delete-confirm-btn:hover:not(:disabled) {
  background: #b52217;
}

/* 响应式设计 */
@media (max-width: 968px) {
  .friends-layout {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .main-content {
    padding: 20px;
  }
  
  .page-title {
    font-size: 2.2em;
  }
  
  .search-section,
  .requests-section,
  .right-section {
    padding: 20px;
  }
  
  .search-box {
    flex-direction: column;
  }
  
  .request-item,
  .friend-item {
    flex-wrap: wrap;
  }
  
  .request-actions,
  .user-actions {
    width: 100%;
    margin-top: 12px;
  }
}
</style>

