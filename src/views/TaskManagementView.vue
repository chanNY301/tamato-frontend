<template>
  <div class="task-management-view">
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
        <h1 class="page-title">任务管理</h1>
        <p class="page-subtitle">简单高效的任务清单</p>
      </div>

      <div class="task-layout">
        <!-- 左侧：任务列表 -->
        <div class="task-list-section">
          <div class="section-header">
            <h2 class="section-title">我的任务</h2>
            <button @click="showCreateModal = true" class="create-task-btn">
              <span class="btn-icon">+</span>
              新建任务
            </button>
          </div>

          <!-- 任务状态筛选 -->
          <div class="filter-tabs">
            <button 
              v-for="tab in statusTabs" 
              :key="tab.value"
              @click="activeTab = tab.value"
              :class="['tab-btn', { active: activeTab === tab.value }]"
            >
              {{ tab.label }}
              <span class="tab-count">{{ getTaskCount(tab.value) }}</span>
            </button>
          </div>

          <!-- 任务列表 -->
          <div class="tasks-container">
            <div 
              v-for="task in filteredTasks" 
              :key="task.task_id || task.taskId"
              class="task-card"
              :class="getTaskStatusClass(task.status)"
            >
              <div class="task-main">
                <div class="task-header">
                  <div class="task-title-section">
                    <h3 class="task-title">{{ task.task_name || task.taskName }}</h3>
                    <span class="task-duration">{{ task.duration || 25 }}分钟</span>
                  </div>
                  <div class="task-actions">
                    <button 
                      v-if="task.status !== '已完成'" 
                      @click="toggleTaskStatus(task)"
                      class="action-btn status-btn"
                    >
                      {{ task.status === '进行中' ? '进行中' : '开始' }}
                    </button>
                    <button @click="editTask(task)" class="action-btn edit-btn">
                      编辑
                    </button>
                    <button @click="deleteTask(task.task_id || task.taskId)" class="action-btn delete-btn">
                      删除
                    </button>
                  </div>
                </div>
                
                <p v-if="task.task_note || task.taskNote" class="task-note">{{ task.task_note || task.taskNote }}</p>
                
                <div class="task-footer">
                  <span class="create-time">
                    创建: {{ formatTime(task.created_at || task.createdAt) }}
                  </span>
                  <span class="status-tag" :class="getStatusTagClass(task.status)">
                    {{ getStatusText(task.status) }}
                  </span>
                </div>
              </div>
            </div>

            <!-- 空状态 -->
            <div v-if="filteredTasks.length === 0" class="empty-state">
              <div class="empty-icon">📝</div>
              <h3>暂无任务</h3>
              <p>创建一个新任务开始你的学习计划吧</p>
              <button @click="showCreateModal = true" class="create-first-btn">
                创建第一个任务
              </button>
            </div>
          </div>
        </div>

        <!-- 右侧：统计信息 -->
        <div class="stats-section">
          <div class="stats-card">
            <h3 class="stats-title">任务统计</h3>
            <div class="stats-grid">
              <div class="stat-item">
                <div class="stat-value">{{ totalTasks }}</div>
                <div class="stat-label">总任务</div>
              </div>
              <div class="stat-item">
                <div class="stat-value">{{ todayCompleted }}</div>
                <div class="stat-label">已完成</div>
              </div>
              <div class="stat-item">
                <div class="stat-value">{{ inProgressTasks }}</div>
                <div class="stat-label">进行中</div>
              </div>
            </div>
          </div>

          <!-- 快速导航 -->
          <div class="quick-nav-card">
            <h3 class="nav-title">快速导航</h3>
            <div class="nav-buttons">
              <button @click="goToCreateRoom" class="nav-btn create-room-btn">
                创建自习室
              </button>
              <button @click="goToJoinRoom" class="nav-btn join-room-btn">
                加入自习室
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- 创建/编辑任务弹窗 -->
    <div v-if="showCreateModal || editingTask" class="modal-overlay">
      <div class="task-modal">
        <h3 class="modal-title">{{ editingTask ? '编辑任务' : '创建新任务' }}</h3>
        
        <form @submit.prevent="submitTask" class="task-form">
          <div class="form-group">
            <label class="form-label">任务名称 *</label>
            <input 
              type="text" 
              v-model="taskForm.task_name"
              placeholder="请输入任务名称"
              class="form-input"
              required
            >
          </div>

          <div class="form-group">
            <label class="form-label">任务备注</label>
            <textarea 
              v-model="taskForm.task_note"
              placeholder="请输入任务备注（可选）"
              class="form-textarea"
              rows="3"
            ></textarea>
          </div>

          <div class="form-group">
            <label class="form-label">计划时长（分钟）</label>
            <select v-model="taskForm.duration" class="form-select">
              <option value="25">25分钟（1个番茄）</option>
              <option value="50">50分钟（2个番茄）</option>
              <option value="75">75分钟（3个番茄）</option>
              <option value="100">100分钟（4个番茄）</option>
            </select>
          </div>

          <div class="form-actions">
            <button type="button" @click="closeModal" class="cancel-btn">
              取消
            </button>
            <button type="submit" class="confirm-btn">
              {{ editingTask ? '更新任务' : '创建任务' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script>
import { getTasks, createTask, updateTask, deleteTask } from '@/api/tasks'
import { getCurrentUser } from '@/api/user'

export default {
  name: 'TaskManagementView',
  data() {
    return {
      loading: false,
      tasks: [],
      userId: null, // 当前用户ID
      activeTab: 'all',
      showCreateModal: false,
      editingTask: null,
      taskForm: {
        task_name: '',
        task_note: '',
        duration: 25
      },
      statusTabs: [
        { label: '全部', value: 'all' },
        { label: '未完成', value: '未完成' },
        { label: '进行中', value: '进行中' },
        { label: '已完成', value: '已完成' }
      ]
    }
  },
  computed: {
    filteredTasks() {
      if (this.activeTab === 'all') {
        return this.tasks
      }
      return this.tasks.filter(task => task.status === this.activeTab)
    },
    totalTasks() {
      return this.tasks.length
    },
    todayCompleted() {
      return this.tasks.filter(task => task.status === '已完成').length
    },
    inProgressTasks() {
      return this.tasks.filter(task => task.status === '进行中').length
    }
  },
  async mounted() {
    await this.initUser()
    await this.loadTasks()
  },
  methods: {
    async initUser() {
      try {
        const userResult = await getCurrentUser()
        if (userResult.success && userResult.data) {
          this.userId = userResult.data.user_id
        } else {
          console.error('获取用户信息失败')
        }
      } catch (error) {
        console.error('初始化用户失败:', error)
      }
    },

    async loadTasks() {
      if (!this.userId) {
        console.error('用户ID未获取，无法加载任务')
        return
      }

      try {
        this.loading = true
        const response = await getTasks(this.userId)
        console.log('获取任务列表响应:', response)
        
        // 处理后端返回的数据格式
        if (response.success === true || response.success === "true" || response.code === 200) {
          // 可能是 {success: true, data: []} 或 {code: 200, data: []} 格式
          this.tasks = response.data || []
        } else if (Array.isArray(response)) {
          // 如果直接返回数组
          this.tasks = response
        } else {
          console.error('获取任务失败:', response.message || '未知错误')
          this.tasks = []
        }
      } catch (error) {
        console.error('加载任务失败:', error)
        this.tasks = []
      } finally {
        this.loading = false
      }
    },

    getTaskCount(status) {
      if (status === 'all') return this.tasks.length
      return this.tasks.filter(task => task.status === status).length
    },

    getTaskStatusClass(status) {
      return {
        'task-not-started': status === '未完成',
        'task-in-progress': status === '进行中',
        'task-completed': status === '已完成'
      }
    },

    getStatusTagClass(status) {
      return {
        'tag-not-started': status === '未完成',
        'tag-in-progress': status === '进行中',
        'tag-completed': status === '已完成'
      }
    },

    getStatusText(status) {
      const statusMap = {
        '未完成': '未开始',
        '进行中': '进行中',
        '已完成': '已完成'
      }
      return statusMap[status] || status
    },

    formatTime(timeStr) {
      if (!timeStr) return '-'
      return new Date(timeStr).toLocaleDateString()
    },

    async submitTask() {
      try {
        if (this.editingTask) {
          // 更新任务
          const taskId = this.editingTask.task_id || this.editingTask.taskId
          const updateData = {
            task_name: this.taskForm.task_name,
            task_note: this.taskForm.task_note || null,
            task_id: taskId
          }
          const response = await updateTask(taskId, updateData)
          console.log('更新任务响应:', response)
          
          // 检查响应
          if (response.success === false || response.success === "false") {
            alert(response.message || '更新任务失败')
            return
          }
        } else {
          // 创建任务
          const createData = {
            task_name: this.taskForm.task_name,
            task_note: this.taskForm.task_note || null,
            duration: parseInt(this.taskForm.duration) || 25
          }
          const response = await createTask(createData)
          console.log('创建任务响应:', response)
          
          // 检查响应（后端返回 success 可能是字符串 "true"/"false"）
          if (response.success === false || response.success === "false") {
            alert(response.message || '创建任务失败')
            return
          }
        }
        
        // 关闭弹窗
        this.closeModal()
        // 重新加载任务列表
        await this.loadTasks()
      } catch (error) {
        console.error('操作任务失败:', error)
        alert('操作失败，请重试: ' + (error.message || '未知错误'))
      }
    },

    editTask(task) {
      this.editingTask = task
      this.taskForm = {
        task_name: task.task_name || task.taskName || '',
        task_note: task.task_note || task.taskNote || '',
        duration: task.duration || 25
      }
    },

    async deleteTask(taskId) {
      if (!confirm('确定要删除这个任务吗？')) return
      
      try {
        const response = await deleteTask(taskId)
        console.log('删除任务响应:', response)
        await this.loadTasks()
      } catch (error) {
        console.error('删除任务失败:', error)
        alert('删除失败，请重试')
      }
    },

    async toggleTaskStatus(task) {
      try {
        let newStatus
        if (task.status === '未完成' || task.status === '未开始') {
          newStatus = '进行中'
        } else if (task.status === '进行中') {
          newStatus = '已完成'
        } else {
          return
        }

        const taskId = task.task_id || task.taskId
        const updateData = {
          task_name: task.task_name || task.taskName,
          task_note: task.task_note || task.taskNote || null,
          task_id: taskId,
          status: newStatus
        }
        
        const response = await updateTask(taskId, updateData)
        console.log('更新状态响应:', response)
        
        // 检查响应
        if (response.success === false || response.success === "false") {
          alert(response.message || '更新任务状态失败')
          return
        }
        
        await this.loadTasks()
      } catch (error) {
        console.error('更新任务状态失败:', error)
        alert('更新任务状态失败: ' + (error.message || '未知错误'))
      }
    },

    closeModal() {
      this.showCreateModal = false
      this.editingTask = null
      this.taskForm = {
        task_name: '',
        task_note: '',
        duration: 25
      }
    },

    goToHome() {
      this.$router.push('/')
    },

    goToCreateRoom() {
      this.$router.push('/create-room')
    },

    goToJoinRoom() {
      this.$router.push('/join-room')
    }
  }
}
</script>

<style scoped>
/* 使用白色背景 */
.task-management-view {
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

/* 任务布局 */
.task-layout {
  display: grid;
  grid-template-columns: 1fr 350px;
  gap: 30px;
  align-items: start;
}

/* 任务列表区域 */
.task-list-section {
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
  margin-bottom: 25px;
}

.section-title {
  font-size: 1.6em;
  color: #333;
  font-weight: 600;
  margin: 0;
}

.create-task-btn {
  background: #eeaa67;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 8px;
}

.create-task-btn:hover {
  background: #e69c55;
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(238, 170, 103, 0.3);
}

.btn-icon {
  font-size: 1.2em;
}

/* 筛选标签 */
.filter-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 25px;
  padding: 4px;
  background: #f8f9fa;
  border-radius: 12px;
}

.tab-btn {
  flex: 1;
  padding: 12px 16px;
  border: none;
  background: transparent;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-weight: 500;
  color: #666;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.tab-btn.active {
  background: white;
  color: #eeaa67;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.tab-count {
  background: #f0f0f0;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 0.8em;
}

.tab-btn.active .tab-count {
  background: #eeaa67;
  color: white;
}

/* 任务卡片 */
.tasks-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.task-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  border: 1px solid #e9ecef;
  transition: all 0.3s ease;
}

.task-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  border-color: #eeaa67;
}

.task-not-started {
  border-left: 4px solid #6c757d;
}

.task-in-progress {
  border-left: 4px solid #eeaa67;
}

.task-completed {
  border-left: 4px solid #28a745;
  opacity: 0.8;
}

.task-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}

.task-title-section {
  flex: 1;
}

.task-title {
  font-size: 1.2em;
  color: #333;
  font-weight: 600;
  margin: 0 0 4px 0;
}

.task-duration {
  color: #eeaa67;
  font-size: 0.9em;
  font-weight: 500;
}

.task-actions {
  display: flex;
  gap: 8px;
}

.action-btn {
  padding: 8px 12px;
  border: 1px solid #e0e0e0;
  background: white;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.85em;
  transition: all 0.2s ease;
}

.status-btn {
  background: #eeaa67;
  color: white;
  border-color: #eeaa67;
}

.status-btn:hover {
  background: #e69c55;
}

.edit-btn:hover {
  background: #fff9f2;
  border-color: #eeaa67;
  color: #e69c55;
}

.delete-btn:hover {
  background: #fff5f5;
  border-color: #ff8787;
  color: #c92a2a;
}

.task-note {
  color: #666;
  margin: 0 0 16px 0;
  line-height: 1.5;
  font-size: 0.95em;
}

.task-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 16px;
  border-top: 1px solid #f0f0f0;
}

.create-time {
  color: #999;
  font-size: 0.85em;
}

.status-tag {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.8em;
  font-weight: 500;
}

.tag-not-started {
  background: #f8f9fa;
  color: #6c757d;
}

.tag-in-progress {
  background: #fff9f2;
  color: #eeaa67;
}

.tag-completed {
  background: #e7f5e9;
  color: #2b8a3e;
}

/* 空状态 */
.empty-state {
  text-align: center;
  padding: 60px 20px;
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
  margin: 0 0 24px 0;
}

.create-first-btn {
  background: #eeaa67;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.create-first-btn:hover {
  background: #e69c55;
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(238, 170, 103, 0.3);
}

/* 统计区域 */
.stats-section {
  display: flex;
  flex-direction: column;
  gap: 20px;
  position: sticky;
  top: 100px;
}

.stats-card, .quick-nav-card {
  background: white;
  border-radius: 16px;
  padding: 25px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border: 1px solid #e9ecef;
}

.stats-title, .nav-title {
  font-size: 1.3em;
  color: #333;
  margin: 0 0 20px 0;
  font-weight: 600;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 15px;
}

.stat-item {
  text-align: center;
}

.stat-value {
  font-size: 2em;
  font-weight: 700;
  margin-bottom: 4px;
  color: #eeaa67;
}

.stat-label {
  font-size: 0.85em;
  color: #666;
}

/* 快速导航 */
.nav-buttons {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.nav-btn {
  padding: 14px 20px;
  border: none;
  border-radius: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  text-align: center;
}

.create-room-btn {
  background: #eeaa67;
  color: white;
}

.create-room-btn:hover {
  background: #e69c55;
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(238, 170, 103, 0.3);
}

.join-room-btn {
  background: white;
  color: #333;
  border: 2px solid #e9ecef;
}

.join-room-btn:hover {
  background: #f8f9fa;
  transform: translateY(-2px);
  border-color: #eeaa67;
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

.task-modal {
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

.task-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-label {
  font-weight: 500;
  color: #333;
}

.form-input, .form-textarea, .form-select {
  padding: 12px 16px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 1em;
  transition: all 0.3s ease;
  font-family: inherit;
}

.form-input:focus, .form-textarea:focus, .form-select:focus {
  outline: none;
  border-color: #eeaa67;
  box-shadow: 0 0 0 3px rgba(238, 170, 103, 0.1);
}

.form-textarea {
  resize: vertical;
  min-height: 80px;
}

.form-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 10px;
}

.cancel-btn, .confirm-btn {
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

.confirm-btn:hover {
  background: #e69c55;
  transform: translateY(-1px);
  box-shadow: 0 4px 15px rgba(238, 170, 103, 0.3);
}

/* 响应式设计 */
@media (max-width: 968px) {
  .task-layout {
    grid-template-columns: 1fr;
  }
  
  .stats-section {
    position: static;
  }
}

@media (max-width: 768px) {
  .main-content {
    padding: 20px;
  }
  
  .page-title {
    font-size: 2.2em;
  }
  
  .task-list-section {
    padding: 20px;
  }
  
  .section-header {
    flex-direction: column;
    gap: 15px;
    align-items: stretch;
  }
  
  .task-header {
    flex-direction: column;
    gap: 12px;
  }
  
  .task-actions {
    align-self: flex-end;
  }
  
  .form-actions {
    flex-direction: column;
  }
}
</style>