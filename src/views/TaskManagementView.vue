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
            <button @click="openCreateModal" class="create-task-btn">
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
              :key="getTaskId(task)"
              class="task-card"
              :class="getTaskStatusClass(task.status)"
            >
              <div class="task-main">
                <div class="task-header">
                  <div class="task-title-section">
                    <h3 class="task-title">{{ getTaskName(task) }}</h3>
                    <span class="task-duration">{{ task.duration || 25 }}分钟</span>
                  </div>
                  <div class="task-actions">
                    <!-- 完成按钮 -->
                    <button 
                      v-if="!isTaskCompleted(task)"
                      @click="completeTask(task)"
                      class="action-btn complete-btn"
                    >
                      完成
                    </button>
                    <!-- 编辑按钮 -->
                    <button @click="editTask(task)" class="action-btn edit-btn">
                      编辑
                    </button>
                    <!-- 删除按钮 -->
                    <button @click="deleteTask(getTaskId(task))" class="action-btn delete-btn">
                      删除
                    </button>
                  </div>
                </div>
                
                <p v-if="getTaskNote(task)" class="task-note">{{ getTaskNote(task) }}</p>
                
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
              <button @click="openCreateModal" class="create-first-btn">
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
                <div class="stat-value">{{ completedTasks }}</div>
                <div class="stat-label">已完成</div>
              </div>
              <div class="stat-item">
                <div class="stat-value">{{ pendingTasks }}</div>
                <div class="stat-label">未完成</div>
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
    <div v-if="showModal" class="modal-overlay">
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
      userId: null,
      activeTab: 'all',
      showModal: false,
      editingTask: null,
      taskForm: {
        task_name: '',
        task_note: '',
        duration: 25
      },
      statusTabs: [
        { label: '全部', value: 'all' },
        { label: '未完成', value: '未完成' },
        { label: '已完成', value: '已完成' }
      ]
    }
  },
  computed: {
    // 将已完成的任务排在列表底部，其余任务在前面
    sortedTasks() {
      return [...this.tasks].sort((a, b) => {
        const aCompleted = this.getStatusText(a.status) === '已完成'
        const bCompleted = this.getStatusText(b.status) === '已完成'

        // 已完成的排到最后
        if (aCompleted !== bCompleted) {
          return aCompleted - bCompleted // false(0) 在前，true(1) 在后
        }

        // 同一类里，按创建时间倒序（新的在前）
        const aTime = new Date(a.created_at || a.createdAt || 0).getTime()
        const bTime = new Date(b.created_at || b.createdAt || 0).getTime()
        return bTime - aTime
      })
    },
    filteredTasks() {
      const base = this.sortedTasks
      if (this.activeTab === 'all') {
        return base
      }
      
      return base.filter(task => {
        const status = this.getStatusText(task.status)
        return status === this.activeTab
      })
    },
    totalTasks() {
      return this.tasks.length
    },
    completedTasks() {
      return this.tasks.filter(task => this.isTaskCompleted(task)).length
    },
    pendingTasks() {
      return this.tasks.filter(task => !this.isTaskCompleted(task)).length
    },
    inProgressTasks() {
      return this.tasks.filter(task => this.getStatusText(task.status) === '进行中').length
    }
  },
  async mounted() {
    await this.initUser()
    await this.loadTasks()
  },
  methods: {
    // 工具方法
    getTaskId(task) {
      return task.task_id || task.taskId
    },
    
    getTaskName(task) {
      return task.task_name || task.taskName
    },
    
    getTaskNote(task) {
      return task.task_note || task.taskNote
    },

    // 状态判断
    isTaskCompleted(task) {
      const status = task.status || ''
      const statusText = this.getStatusText(status)
      return statusText === '已完成'
    },

    getTaskCount(status) {
      if (status === 'all') return this.tasks.length
      return this.tasks.filter(task => this.getStatusText(task.status) === status).length
    },

    getTaskStatusClass(status) {
      const statusText = this.getStatusText(status)
      if (statusText === '未完成') return 'task-not-started'
      if (statusText === '进行中') return 'task-in-progress'
      if (statusText === '已完成') return 'task-completed'
      return 'task-not-started'
    },

    getStatusTagClass(status) {
      const statusText = this.getStatusText(status)
      if (statusText === '未完成') return 'tag-not-started'
      if (statusText === '进行中') return 'tag-in-progress'
      if (statusText === '已完成') return 'tag-completed'
      return 'tag-not-started'
    },

    getStatusText(status) {
      if (!status) return '未完成'
      
      const statusStr = String(status).trim().toLowerCase()
      
      if (
        statusStr === '已完成' || 
        statusStr === '完成' ||
        statusStr === 'finished' || 
        statusStr === 'done' ||
        statusStr === '已完'
      ) {
        return '已完成'
      }
      
      if (
        statusStr === '进行中' ||
        statusStr === '进行' ||
        statusStr === 'in_progress' ||
        statusStr === 'in progress' ||
        statusStr === 'doing'
      ) {
        return '进行中'
      }
      
      return '未完成'
    },

    formatTime(timeStr) {
      if (!timeStr) return '-'
      return new Date(timeStr).toLocaleDateString()
    },

    // API相关方法
    async initUser() {
      try {
        const userResult = await getCurrentUser()
        console.log('用户信息响应:', userResult)
        
        if (userResult && userResult.data) {
          // 根据user.js的返回结构，user_id可能在不同的位置
          if (userResult.data.user_id) {
            this.userId = userResult.data.user_id
          } else if (userResult.data.id) {
            this.userId = userResult.data.id
          } else {
            console.warn('未找到user_id字段，用户数据:', userResult.data)
          }
        }
        console.log('获取到的userId:', this.userId)
      } catch (error) {
        console.error('初始化用户失败:', error)
      }
    },

    async loadTasks() {
      if (!this.userId) {
        console.warn('userId为空，无法加载任务')
        return
      }

      try {
        this.loading = true
        console.log('正在加载任务，userId:', this.userId)
        const response = await getTasks(this.userId)
        console.log('任务加载响应:', response)
        
        if (response.success === true || response.success === "true" || response.code === 200) {
          this.tasks = response.data || []
        } else if (Array.isArray(response)) {
          this.tasks = response
        } else {
          this.tasks = []
        }
        
        console.log('加载的任务列表:', this.tasks)
        
      } catch (error) {
        console.error('加载任务失败:', error)
        this.tasks = []
      } finally {
        this.loading = false
      }
    },

    // 完成任务
    async completeTask(task) {
      if (this.isTaskCompleted(task)) {
        return
      }
      
      if (!confirm('确定要标记为完成吗？')) return
      
      try {
        const taskId = this.getTaskId(task)
        if (!taskId) {
          alert('任务ID不存在，无法完成')
          return
        }
        
        if (!this.userId) {
          alert('用户ID不存在，请重新登录')
          this.$router.push('/login')
          return
        }
        
        const updateData = {
          task_name: this.getTaskName(task),
          task_note: this.getTaskNote(task) || null,
          user_id: this.userId,
          userId: this.userId,  // 同时发送两种格式
          status: '已完成',
          taskStatus: '已完成'  // 同时发送两种可能的字段名
        }
        
        console.log('📋 完成任务 - 准备发送的数据:', {
          taskId: taskId,
          updateData: updateData,
          '完整请求体（包含task_id后）': {
            ...updateData,
            task_id: taskId,
            taskId: taskId
          }
        })
        
        const response = await updateTask(taskId, updateData)
        console.log('✅ 完成任务响应:', response)
        
        // 详细检查响应内容
        if (response) {
          console.log('📊 响应详情:', {
            success: response.success,
            message: response.message,
            data: response.data,
            '响应中的任务状态': response.data?.status || response.status
          })
        }
        
        // 检查响应是否成功
        if (response && (response.success === false || response.success === "false")) {
          alert(response.message || '标记完成失败')
          return
        }
        
        // 重新加载任务列表以确保数据同步
        await this.loadTasks()
        
        // 显示成功提示
        console.log('任务已成功标记为完成')
        
      } catch (error) {
        console.error('完成任务失败:', error)
        // 更友好的错误提示
        if (error.status === 401 || (error.response && error.response.status === 401)) {
          alert('请先登录')
          this.$router.push('/login')
        } else if (error.status === 404 || (error.response && error.response.status === 404)) {
          alert('任务不存在或已被删除')
          await this.loadTasks() // 重新加载任务列表
        } else {
          const errorMsg = error.message || '标记完成失败，请稍后重试'
          alert(errorMsg)
          console.error('完整错误信息:', error)
        }
      }
    },

    // 创建/更新任务 - 根据接口文档修复
    async submitTask() {
      try {
        if (this.editingTask) {
          // 编辑现有任务
          const taskId = this.getTaskId(this.editingTask)
          const updateData = {
            task_name: this.taskForm.task_name,
            task_note: this.taskForm.task_note || null,
            // ✅ 编辑时也一并更新计划时长
            duration: parseInt(this.taskForm.duration) || 25,
            user_id: this.userId
          }
          
          console.log('编辑任务数据:', updateData)
          
          const response = await updateTask(taskId, updateData)
          console.log('编辑任务响应:', response)
          
          if (response.success === false || response.success === "false") {
            alert(response.message || '更新任务失败')
            return
          }
        } else {
          // 创建新任务 - 根据接口文档
          const createData = {
            user_id: this.userId,  // 必需字段
            task_name: this.taskForm.task_name,  // 必需字段
            task_note: this.taskForm.task_note || null,  // 可选
            duration: parseInt(this.taskForm.duration) || 25  // 可选
            // 注意：不传status字段，让后端设置默认值
          }
          
          console.log('创建任务数据:', createData)
          
          const response = await createTask(createData)
          console.log('创建任务响应:', response)
          
          if (response.success === false || response.success === "false") {
            alert(response.message || '创建任务失败')
            return
          }
        }
        
        this.closeModal()
        // 重新加载确保数据同步
        await this.loadTasks()
        
      } catch (error) {
        console.error('操作任务失败:', error)
        alert('操作失败，请重试: ' + (error.message || '未知错误'))
      }
    },

    // 删除任务 - 根据接口文档修复
    async deleteTask(taskId) {
      if (!confirm('确定要删除这个任务吗？')) return
      
      try {
        console.log('正在删除任务，taskId:', taskId)
        // 注意：deleteTask函数的参数名应该对应接口的taskid（小写）
        await deleteTask(taskId)
        await this.loadTasks()
        alert('删除成功！')
      } catch (error) {
        console.error('删除任务失败:', error)
        alert('删除失败，请重试')
      }
    },

    // 模态框管理
    openCreateModal() {
      this.editingTask = null
      this.resetTaskForm()
      this.showModal = true
    },

    editTask(task) {
      this.editingTask = task
      this.taskForm = {
        task_name: this.getTaskName(task),
        task_note: this.getTaskNote(task) || '',
        duration: task.duration || 25
      }
      this.showModal = true
    },

    closeModal() {
      this.showModal = false
      this.editingTask = null
      this.resetTaskForm()
    },

    resetTaskForm() {
      this.taskForm = {
        task_name: '',
        task_note: '',
        duration: 25
      }
    },

    // 路由跳转
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

/* ✅ 完成按钮（原本的橙色） */
.complete-btn {
  background: #eeaa67;
  color: white;
  border-color: #eeaa67;
}

.complete-btn:hover {
  background: #e69c55;
  border-color: #e69c55;
}

/* ✅ 已完成按钮（灰色） */
.completed-btn {
  background: #bdc3c7 !important;
  border-color: #95a5a6 !important;
  cursor: not-allowed !important;
  opacity: 0.7;
}

.completed-btn:hover {
  background: #bdc3c7 !important;
  transform: none !important;
  box-shadow: none !important;
}

/* 编辑按钮样式 */
.edit-btn:hover {
  background: #fff9f2;
  border-color: #eeaa67;
  color: #e69c55;
}

/* 删除按钮样式 */
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

  .task-已完成 {
  border-left: 4px solid #28a745;
  opacity: 0.8;
}
}
</style>