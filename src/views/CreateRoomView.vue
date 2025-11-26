<template>
  <div class="create-room-view">
    <!-- 顶部导航栏 -->
    <nav class="navbar">
      <div class="nav-brand">Tomato</div>
      <div class="nav-links">
        <a class="nav-link" @click="goToHome">返回首页</a>
      </div>
    </nav>

    <!-- 主要内容区域 -->
    <main class="main-content">
      <div class="create-room-header">
        <h1 class="page-title">创建自习室</h1>
      </div>

      <div class="create-room-content">
        <!-- 左侧表单区域 -->
        <div class="form-section">
          <h2 class="section-title">基本信息：</h2>
          <br>
          <br>
          
          <div class="form-group">
            <label class="form-label">自习室名称：</label>
            <input 
              type="text" 
              v-model="roomForm.room_name" 
              placeholder="请输入自习室名称"
              class="form-input"
              :disabled="loading"
            >
          </div>

          <div class="form-group">
            <label class="form-label">自习室简介：</label>
            <textarea 
              v-model="roomForm.description" 
              placeholder="请输入自习室简介"
              class="form-textarea"
              rows="3"
              :disabled="loading"
            ></textarea>
          </div>

          <div class="form-group">
            <label class="form-label">最大人数：</label>
            <div class="select-wrapper">
              <select v-model="roomForm.max_members" class="form-select" :disabled="loading">
                <option value="1">1人</option>
                <option value="2">2人</option>
                <option value="3">3人</option>
                <option value="4">4人</option>
                <option value="5">5人</option>
                <option value="6">6人</option>
              </select>
              <span class="select-arrow">↓</span>
            </div>
          </div>

          <!-- 新增音乐选择字段 -->
          <div class="form-group">
            <label class="form-label">背景音乐：</label>
            <div class="select-wrapper">
              <select v-model="roomForm.music_name" class="form-select" :disabled="loading">
                <option value="无">无背景音乐</option>
                <option value="轻音乐">轻音乐</option>
                <option value="白噪音">白噪音</option>
                <option value="自然声">自然声</option>
                <option value="古典音乐">古典音乐</option>
              </select>
              <span class="select-arrow">↓</span>
            </div>
          </div>
        </div>

        <!-- 右侧操作按钮区域 -->
        <div class="action-section">
          <div class="button-group">
            <button @click="createRoom" class="confirm-btn" :disabled="loading">
              {{ loading ? '创建中...' : '确认创建' }}
            </button>
            <button @click="goToHome" class="cancel-btn" :disabled="loading">
              返回首页
            </button>
          </div>
          
          <!-- 创建提示 -->
          <div class="action-tips">
            <p>创建后可以邀请好友一起学习</p>
            <p>自习室信息随时可以修改</p>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script>
import { createRoom } from '@/api/studyRooms'

export default {
  name: 'CreateRoomView',
  data() {
    return {
      loading: false,
      roomForm: {
        room_name: '',
        description: '',
        max_members: '4',
        music_name: '无',
        // 这些字段API可能需要，但可以先给默认值
        create_person: 'user123', // 这里需要从登录信息获取
        current_time: Math.floor(Date.now() / 1000),
        end_time: Math.floor(Date.now() / 1000) + 3600 // 默认1小时后结束
      }
    }
  },
  methods: {
        async createRoom() {
      // 基本表单验证
      if (!this.roomForm.room_name.trim()) {
        alert('请输入自习室名称')
        return
      }

      this.loading = true

      try {
        // 准备测试数据 - 使用固定值避免字段缺失
        const requestData = {
          room_name: this.roomForm.room_name.trim(),
          description: this.roomForm.description.trim() || '这是一个自习室',
          max_members: parseInt(this.roomForm.max_members) || 4,
          music_name: this.roomForm.music_name || '无',
          create_person: 'test_user_001', // 固定测试用户ID
          create_time: Math.floor(Date.now() / 1000)
        }

        console.log('🎯 发送Mock请求:', requestData)
        
        const response = await createRoom(requestData)
        console.log('✅ Mock响应:', response)
        
        // Mock 测试：假设任何响应都算成功
        if (response) {
          // 生成一个模拟的房间ID（因为Mock可能不会返回真实ID）
          const mockRoomId = 'MOCK_' + Math.random().toString(36).substr(2, 9).toUpperCase()
          
          alert(`Mock测试成功！模拟房间ID: ${mockRoomId}`)
          
          // 跳转到自习室页面（使用模拟ID）
          this.$router.push({
            name: 'study-room', 
            params: { roomId: mockRoomId }
          })
        } else {
          alert('Mock请求失败，但继续跳转测试页面流程')
          // 即使失败也跳转，测试页面导航
          this.$router.push({
            name: 'study-room',
            params: { roomId: 'test-room' }
          })
        }
        
      } catch (error) {
        console.error('❌ Mock请求异常:', error)
        alert('Mock测试遇到异常，但继续测试页面跳转')
        
        // 即使出错也跳转，确保页面流程可测试
        this.$router.push({
          name: 'study-room',
          params: { roomId: 'error-test-room' }
        })
      } finally {
        this.loading = false
      }
    },
    
    goToHome() {
      this.$router.push('/')
    }
  }
}
</script>

<style scoped>
/* 保持你原有的样式不变，只添加loading相关样式 */
.form-input:disabled,
.form-textarea:disabled,
.form-select:disabled {
  background-color: #f8f9fa;
  cursor: not-allowed;
  opacity: 0.7;
}

.confirm-btn:disabled,
.cancel-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none !important;
}


.create-room-view {
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
  padding: 60px 5%;
}

.create-room-header {
  text-align: center;
  margin-bottom: 60px;
}

.page-title {
  font-size: 3em;
  color: #333;
  font-weight: 700;
  margin: 0 0 16px 0;
  background: linear-gradient(135deg, #eeaa67, #ff8c42);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.page-subtitle {
  font-size: 1.2em;
  color: #666;
  margin: 0;
}

/* 创建自习室内容布局 */
.create-room-content {
  display: grid;
  grid-template-columns: 1fr 400px;
  gap: 40px;
  align-items: start;
}

/* 左侧表单区域 */
.form-section {
  background: white;
  border-radius: 20px;
  padding: 40px;
  box-shadow: 0 10px 40px rgba(238, 170, 103, 0.1);
  border: 1px solid #ffe4cc;
  border-top: 4px solid #eeaa67;
  transition: all 0.3s ease;
}

.form-section:hover {
  transform: translateY(-2px);
  box-shadow: 0 15px 50px rgba(238, 170, 103, 0.15);
}

.form-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 32px;
}

.form-icon {
  font-size: 2em;
}

.section-title {
  font-size: 1.8em;
  color: #333;
  margin: 0;
  font-weight: 600;
}

.form-group {
  margin-bottom: 30px;
}

.form-label {
  display: block;
  margin-bottom: 12px;
  color: #333;
  font-weight: 500;
  font-size: 1.1em;
}

.form-input,
.form-textarea,
.form-select {
  width: 100%;
  padding: 16px 20px;
  border: 2px solid #e0e0e0;
  border-radius: 12px;
  font-size: 1em;
  transition: all 0.3s ease;
  box-sizing: border-box;
  background: white;
  color: #333;
  font-family: inherit;
}

.form-input:focus,
.form-textarea:focus,
.form-select:focus {
  outline: none;
  border-color: #eeaa67;
  box-shadow: 0 0 0 4px rgba(238, 170, 103, 0.1);
  transform: translateY(-1px);
}

.form-input::placeholder,
.form-textarea::placeholder {
  color: #999;
}

.form-textarea {
  resize: vertical;
  min-height: 100px;
  line-height: 1.5;
}

/* 下拉选择器样式 */
.select-wrapper {
  position: relative;
  display: inline-block;
  width: 200px;
}

.form-select {
  appearance: none;
  cursor: pointer;
  padding-right: 50px;
}

.select-arrow {
  position: absolute;
  right: 20px;
  top: 50%;
  transform: translateY(-50%);
  pointer-events: none;
  color: #666;
  font-size: 1.2em;
}

/* 右侧操作按钮区域 */
.action-section {
  position: sticky;
  top: 100px;
}

.action-card {
  background: white;
  border-radius: 20px;
  padding: 30px;
  box-shadow: 0 10px 40px rgba(238, 170, 103, 0.1);
  border: 1px solid #ffe4cc;
  border-top: 4px solid #66bb6a;
}

.action-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 25px;
}

.action-icon {
  font-size: 1.8em;
}

.action-title {
  font-size: 1.4em;
  color: #333;
  margin: 0;
  font-weight: 600;
}

.button-group {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 25px;
}

.confirm-btn,
.cancel-btn {
  padding: 16px 24px;
  border: none;
  border-radius: 12px;
  font-size: 1.1em;
  cursor: pointer;
  transition: all 0.3s ease;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.confirm-btn {
  background: linear-gradient(135deg, #eeaa67, #f5b877);
  color: white;
  box-shadow: 0 4px 15px rgba(238, 170, 103, 0.3);
}

.confirm-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(238, 170, 103, 0.4);
  background: linear-gradient(135deg, #e69c55, #f0ae65);
}

.cancel-btn {
  background: white;
  color: #666;
  border: 2px solid #e0e0e0;
}

.cancel-btn:hover {
  background: #f8f9fa;
  border-color: #ccc;
  color: #333;
  transform: translateY(-2px);
}

.btn-icon {
  font-size: 1.2em;
}

.action-tips {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 12px;
  border-left: 4px solid #eeaa67;
}

.action-tips p {
  margin: 8px 0;
  color: #666;
  font-size: 0.9em;
  line-height: 1.4;
}

.action-tips p:last-child {
  margin-bottom: 0;
}

/* 响应式设计 */
@media (max-width: 968px) {
  .create-room-content {
    grid-template-columns: 1fr;
    gap: 30px;
  }
  
  .action-section {
    position: static;
  }
  
  .form-section,
  .action-card {
    padding: 30px;
  }
}

@media (max-width: 768px) {
  .main-content {
    padding: 40px 20px;
  }
  
  .page-title {
    font-size: 2.5em;
  }
  
  .form-section,
  .action-card {
    padding: 24px;
  }
  
  .navbar {
    padding: 12px 20px;
  }
  
  .select-wrapper {
    width: 100%;
  }
  
  .form-header {
    flex-direction: column;
    text-align: center;
    gap: 12px;
  }
  
  .action-header {
    flex-direction: column;
    text-align: center;
    gap: 8px;
  }
}
</style>

createRoom