<template>
  <div class="user-statistics">
    <div v-if="loading" class="loading-container">
      <div class="loading-spinner"></div>
      <p>加载中...</p>
    </div>

    <div v-else class="statistics-content">
      <!-- 今日统计卡片 -->
      <div class="stats-cards">
        <div class="stat-card">
          <div class="stat-icon study-time">📚</div>
          <div class="stat-info">
            <div class="stat-label">今日学习时长</div>
            <div class="stat-value">{{ formatTime(todayStats.studyTime) }}</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon new-tasks">➕</div>
          <div class="stat-info">
            <div class="stat-label">今日新建任务</div>
            <div class="stat-value">{{ todayStats.newTasks }}</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon completed-tasks">✅</div>
          <div class="stat-info">
            <div class="stat-label">今日完成任务</div>
            <div class="stat-value">{{ todayStats.completedTasks }}</div>
          </div>
        </div>
      </div>

      <!-- 近一周学习时长图表 -->
      <div class="chart-section">
        <h3 class="chart-title">近一周学习时长</h3>
        <div class="chart-container">
          <div class="chart-bars">
            <div 
              v-for="(day, index) in weeklyData" 
              :key="index"
              class="chart-bar-wrapper"
            >
              <div class="chart-bar-container">
                <div 
                  class="chart-bar"
                  :style="{ height: getBarHeight(day.studyTime) + '%' }"
                  :title="`${day.date}: ${formatTime(day.studyTime)}`"
                >
                  <span class="bar-value">{{ formatTime(day.studyTime) }}</span>
                </div>
              </div>
              <div class="chart-label">{{ day.dateLabel }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 详细数据表格 -->
      <div class="details-section">
        <h3 class="section-title">每日详细数据</h3>
        <div class="table-container">
          <table class="stats-table">
            <thead>
              <tr>
                <th style="width: 30px;"></th>
                <th>日期</th>
                <th>学习时长</th>
                <th>新建任务</th>
                <th>完成任务</th>
              </tr>
            </thead>
            <tbody>
              <template v-for="(day, index) in weeklyData" :key="index">
                <tr 
                  class="table-row-clickable"
                  @click="toggleDayDetail(day.date)"
                >
                  <td class="expand-icon">
                    <span :class="['icon', { 'expanded': expandedDate === day.date }]">
                      ▶
                    </span>
                  </td>
                  <td>{{ day.dateLabel }}</td>
                  <td>{{ formatTime(day.studyTime) }}</td>
                  <td>{{ day.newTasks }}</td>
                  <td>{{ day.completedTasks }}</td>
                </tr>
                <!-- 展开的任务详情 -->
                <tr v-if="expandedDate === day.date" class="detail-row">
                  <td colspan="5" class="detail-cell">
                    <div class="day-details">
                      <!-- 新建任务 -->
                      <div v-if="dailyTasks[day.date] && dailyTasks[day.date].newTasks.length > 0" class="task-group">
                        <h4 class="task-group-title">
                          <span class="task-icon new">➕</span>
                          新建任务 ({{ dailyTasks[day.date].newTasks.length }})
                        </h4>
                        <div class="task-list">
                          <div 
                            v-for="(task, taskIndex) in dailyTasks[day.date].newTasks" 
                            :key="taskIndex"
                            class="task-item"
                          >
                            <div class="task-name">{{ task.task_name || task.taskName || '未命名任务' }}</div>
                            <div v-if="task.task_note || task.taskNote" class="task-note">{{ task.task_note || task.taskNote }}</div>
                            <div class="task-time">
                              <span class="time-label">创建时间：</span>
                              {{ formatDateTime(task.created_at || task.createdAt) }}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div v-else class="task-group">
                        <h4 class="task-group-title">
                          <span class="task-icon new">➕</span>
                          新建任务 (0)
                        </h4>
                        <div class="empty-tasks">暂无新建任务</div>
                      </div>

                      <!-- 完成任务 -->
                      <div v-if="dailyTasks[day.date] && dailyTasks[day.date].completedTasks.length > 0" class="task-group">
                        <h4 class="task-group-title">
                          <span class="task-icon completed">✅</span>
                          完成任务 ({{ dailyTasks[day.date].completedTasks.length }})
                        </h4>
                        <div class="task-list">
                          <div 
                            v-for="(task, taskIndex) in dailyTasks[day.date].completedTasks" 
                            :key="taskIndex"
                            class="task-item completed"
                          >
                            <div class="task-name">{{ task.task_name || task.taskName || '未命名任务' }}</div>
                            <div v-if="task.task_note || task.taskNote" class="task-note">{{ task.task_note || task.taskNote }}</div>
                            <div class="task-time">
                              <span class="time-label">完成时间：</span>
                              {{ formatDateTime(task.end_time || task.endTime) }}
                            </div>
                            <div v-if="task.actual_duration || task.actualDuration" class="task-duration">
                              <span class="time-label">专注时长：</span>
                              {{ formatTime(task.actual_duration || task.actualDuration) }}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div v-else class="task-group">
                        <h4 class="task-group-title">
                          <span class="task-icon completed">✅</span>
                          完成任务 (0)
                        </h4>
                        <div class="empty-tasks">暂无完成任务</div>
                      </div>
                    </div>
                  </td>
                </tr>
              </template>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { getCurrentUser } from '@/api/user'
import { getTasks } from '@/api/tasks'
import { API_BASE_URL, getToken } from '@/api/config'

export default {
  name: 'UserStatistics',
  data() {
    return {
      loading: true,
      focusRecords: [],
      tasks: [],
      todayStats: {
        studyTime: 0, // 分钟
        newTasks: 0,
        completedTasks: 0
      },
      weeklyData: [], // 近一周的数据
      expandedDate: null, // 当前展开的日期
      dailyTasks: {} // 存储每日的任务详情 {date: {newTasks: [], completedTasks: []}}
    }
  },
  created() {
    this.fetchStatistics()
  },
  methods: {
    async fetchStatistics() {
      this.loading = true
      
      try {
        // 获取用户ID
        const userResult = await getCurrentUser()
        if (!userResult.success || !userResult.data) {
          throw new Error('获取用户信息失败')
        }
        const userId = userResult.data.user_id

        // 并行获取专注记录和任务数据
        const [focusResult, tasksResult] = await Promise.all([
          this.getFocusReport(),
          getTasks(userId)
        ])

        this.focusRecords = focusResult || []
        // 处理任务数据，可能是数组或对象
        if (tasksResult.success) {
          if (Array.isArray(tasksResult.data)) {
            this.tasks = tasksResult.data
          } else if (tasksResult.data && Array.isArray(tasksResult.data.data)) {
            this.tasks = tasksResult.data.data
          } else {
            this.tasks = []
          }
        } else {
          this.tasks = []
        }

        // 计算统计数据
        this.calculateStatistics()
        // 组织每日任务详情
        this.organizeDailyTasks()
      } catch (error) {
        console.error('获取统计数据失败:', error)
      } finally {
        this.loading = false
      }
    },

    async getFocusReport() {
      try {
        const token = getToken()
        if (!token) {
          throw new Error('未登录')
        }

        const response = await fetch(`${API_BASE_URL}/focus/report`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`)
        }

        const result = await response.json()
        if (result.success && result.data) {
          return result.data
        }
        return []
      } catch (error) {
        console.error('获取专注记录失败:', error)
        return []
      }
    },

    calculateStatistics() {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      // 初始化近一周的数据（从今天往前7天）
      this.weeklyData = []
      for (let i = 6; i >= 0; i--) {
        const date = new Date(today)
        date.setDate(date.getDate() - i)
        const dateStr = this.formatDate(date)
        
        this.weeklyData.push({
          date: dateStr,
          dateLabel: this.getDateLabel(date, i),
          studyTime: 0,
          newTasks: 0,
          completedTasks: 0
        })
      }

      // 计算今日统计
      const todayStr = this.formatDate(today)
      this.todayStats = {
        studyTime: 0,
        newTasks: 0,
        completedTasks: 0
      }

      // 处理专注记录（计算学习时长）
      this.focusRecords.forEach(record => {
        if (record.created_at) {
          const recordDate = new Date(record.created_at)
          const recordDateStr = this.formatDate(recordDate)
          
          // 更新对应日期的学习时长
          const dayData = this.weeklyData.find(d => d.date === recordDateStr)
          if (dayData && record.actual_duration) {
            dayData.studyTime += record.actual_duration || 0
          }

          // 如果是今天，更新今日统计
          if (recordDateStr === todayStr && record.actual_duration) {
            this.todayStats.studyTime += record.actual_duration || 0
          }
        }
      })

      // 处理任务数据
      this.tasks.forEach(task => {
        // 处理创建时间（可能是 created_at 或 createdAt）
        const createdAt = task.created_at || task.createdAt
        if (createdAt) {
          const taskDate = new Date(createdAt)
          if (!isNaN(taskDate.getTime())) {
            const taskDateStr = this.formatDate(taskDate)
            
            // 更新对应日期的任务数
            const dayData = this.weeklyData.find(d => d.date === taskDateStr)
            if (dayData) {
              // 新建任务数
              dayData.newTasks++
              
              // 如果是今天，更新今日统计
              if (taskDateStr === todayStr) {
                this.todayStats.newTasks++
              }
            }
          }
        }

        // 完成任务数（可能是 end_time 或 endTime）
        if (task.status === '已完成') {
          const endTime = task.end_time || task.endTime
          if (endTime) {
            const completedDate = new Date(endTime)
            if (!isNaN(completedDate.getTime())) {
              const completedDateStr = this.formatDate(completedDate)
              
              const dayData = this.weeklyData.find(d => d.date === completedDateStr)
              if (dayData) {
                dayData.completedTasks++
              }

              // 如果是今天，更新今日统计
              if (completedDateStr === todayStr) {
                this.todayStats.completedTasks++
              }
            }
          }
        }
      })
    },

    formatDate(date) {
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    },

    getDateLabel(date, daysAgo) {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      if (daysAgo === 0) {
        return '今天'
      } else if (daysAgo === 1) {
        return '昨天'
      } else {
        const month = date.getMonth() + 1
        const day = date.getDate()
        return `${month}/${day}`
      }
    },

    formatTime(minutes) {
      if (!minutes || minutes === 0) {
        return '0分钟'
      }
      const hours = Math.floor(minutes / 60)
      const mins = minutes % 60
      
      if (hours > 0 && mins > 0) {
        return `${hours}小时${mins}分钟`
      } else if (hours > 0) {
        return `${hours}小时`
      } else {
        return `${mins}分钟`
      }
    },

    getBarHeight(studyTime) {
      // 找到最大值
      const maxTime = Math.max(...this.weeklyData.map(d => d.studyTime), 1)
      // 计算百分比（最小高度10%，最大100%）
      const percentage = maxTime > 0 ? (studyTime / maxTime) * 90 + 10 : 10
      return Math.max(percentage, 10)
    },

    organizeDailyTasks() {
      // 初始化每日任务详情
      this.dailyTasks = {}
      this.weeklyData.forEach(day => {
        this.dailyTasks[day.date] = {
          newTasks: [],
          completedTasks: []
        }
      })

      // 组织新建任务
      this.tasks.forEach(task => {
        const createdAt = task.created_at || task.createdAt
        if (createdAt) {
          const taskDate = new Date(createdAt)
          if (!isNaN(taskDate.getTime())) {
            const taskDateStr = this.formatDate(taskDate)
            if (this.dailyTasks[taskDateStr]) {
              this.dailyTasks[taskDateStr].newTasks.push(task)
            }
          }
        }
      })

      // 组织完成任务
      this.tasks.forEach(task => {
        if (task.status === '已完成') {
          const endTime = task.end_time || task.endTime
          if (endTime) {
            const completedDate = new Date(endTime)
            if (!isNaN(completedDate.getTime())) {
              const completedDateStr = this.formatDate(completedDate)
              if (this.dailyTasks[completedDateStr]) {
                this.dailyTasks[completedDateStr].completedTasks.push(task)
              }
            }
          }
        }
      })
    },

    toggleDayDetail(date) {
      if (this.expandedDate === date) {
        this.expandedDate = null
      } else {
        this.expandedDate = date
      }
    },

    formatDateTime(dateTimeStr) {
      if (!dateTimeStr) return ''
      const date = new Date(dateTimeStr)
      if (isNaN(date.getTime())) return dateTimeStr
      
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      const hours = String(date.getHours()).padStart(2, '0')
      const minutes = String(date.getMinutes()).padStart(2, '0')
      
      return `${year}-${month}-${day} ${hours}:${minutes}`
    }
  }
}
</script>

<style scoped>
.user-statistics {
  padding: 20px;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 0;
  color: #666;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #cc2a1f;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 20px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.statistics-content {
  max-width: 1000px;
}

/* 统计卡片 */
.stats-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.stat-card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  display: flex;
  align-items: center;
  gap: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  border: 1px solid #f0f0f0;
  transition: transform 0.3s, box-shadow 0.3s;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(204, 42, 31, 0.15);
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2em;
}

.stat-icon.study-time {
  background: linear-gradient(135deg, #ff6b6b, #ff8787);
}

.stat-icon.new-tasks {
  background: linear-gradient(135deg, #4ecdc4, #6edcd4);
}

.stat-icon.completed-tasks {
  background: linear-gradient(135deg, #95e1d3, #a8e8db);
}

.stat-info {
  flex: 1;
}

.stat-label {
  color: #666;
  font-size: 0.9em;
  margin-bottom: 8px;
}

.stat-value {
  color: #333;
  font-size: 1.8em;
  font-weight: bold;
}

/* 图表区域 */
.chart-section {
  background: white;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 30px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  border: 1px solid #f0f0f0;
}

.chart-title {
  font-size: 1.3em;
  font-weight: bold;
  color: #333;
  margin: 0 0 24px 0;
}

.chart-container {
  padding: 20px 0;
}

.chart-bars {
  display: flex;
  justify-content: space-around;
  align-items: flex-end;
  height: 300px;
  gap: 10px;
}

.chart-bar-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 100%;
}

.chart-bar-container {
  flex: 1;
  width: 100%;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  position: relative;
}

.chart-bar {
  width: 80%;
  max-width: 60px;
  background: linear-gradient(180deg, #cc2a1f, #e63946);
  border-radius: 6px 6px 0 0;
  position: relative;
  transition: all 0.3s;
  min-height: 20px;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: 8px;
  cursor: pointer;
}

.chart-bar:hover {
  background: linear-gradient(180deg, #b52217, #d63031);
  transform: scaleY(1.05);
  box-shadow: 0 4px 12px rgba(204, 42, 31, 0.3);
}

.bar-value {
  color: white;
  font-size: 0.75em;
  font-weight: bold;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
}

.chart-label {
  margin-top: 10px;
  color: #666;
  font-size: 0.85em;
  text-align: center;
}

/* 详细数据表格 */
.details-section {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  border: 1px solid #f0f0f0;
}

.section-title {
  font-size: 1.3em;
  font-weight: bold;
  color: #333;
  margin: 0 0 20px 0;
}

.table-container {
  overflow-x: auto;
}

.stats-table {
  width: 100%;
  border-collapse: collapse;
}

.stats-table thead {
  background: #f8f9fa;
}

.stats-table th {
  padding: 12px 16px;
  text-align: left;
  font-weight: 600;
  color: #333;
  border-bottom: 2px solid #e0e0e0;
  font-size: 0.9em;
}

.stats-table td {
  padding: 12px 16px;
  border-bottom: 1px solid #f0f0f0;
  color: #666;
}

.stats-table tbody tr:hover {
  background: #f8f9fa;
}

.stats-table tbody tr:last-child td {
  border-bottom: none;
}

/* 可点击的行 */
.table-row-clickable {
  cursor: pointer;
  transition: background-color 0.2s;
}

.table-row-clickable:hover {
  background: #f8f9fa !important;
}

.expand-icon {
  text-align: center;
  padding: 0 8px;
}

.expand-icon .icon {
  display: inline-block;
  transition: transform 0.3s;
  color: #cc2a1f;
  font-size: 0.8em;
}

.expand-icon .icon.expanded {
  transform: rotate(90deg);
}

/* 详情行 */
.detail-row {
  background: #fafafa;
}

.detail-cell {
  padding: 0 !important;
  border-top: 2px solid #e0e0e0;
}

.day-details {
  padding: 20px;
}

.task-group {
  margin-bottom: 24px;
}

.task-group:last-child {
  margin-bottom: 0;
}

.task-group-title {
  font-size: 1.1em;
  font-weight: 600;
  color: #333;
  margin: 0 0 16px 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.task-icon {
  font-size: 1.2em;
}

.task-icon.new {
  color: #4ecdc4;
}

.task-icon.completed {
  color: #95e1d3;
}

.task-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.task-item {
  background: white;
  border-radius: 8px;
  padding: 16px;
  border-left: 4px solid #cc2a1f;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
  transition: box-shadow 0.2s;
}

.task-item:hover {
  box-shadow: 0 2px 8px rgba(204, 42, 31, 0.15);
}

.task-item.completed {
  border-left-color: #4caf50;
}

.task-name {
  font-size: 1em;
  font-weight: 500;
  color: #333;
  margin-bottom: 8px;
}

.task-note {
  font-size: 0.9em;
  color: #666;
  margin-bottom: 8px;
  line-height: 1.5;
}

.task-time,
.task-duration {
  font-size: 0.85em;
  color: #888;
  margin-top: 4px;
}

.time-label {
  font-weight: 500;
  color: #666;
}

.empty-tasks {
  text-align: center;
  padding: 20px;
  color: #999;
  font-size: 0.9em;
  background: #f8f9fa;
  border-radius: 8px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .stats-cards {
    grid-template-columns: 1fr;
  }

  .chart-bars {
    height: 250px;
    gap: 5px;
  }

  .chart-bar {
    width: 90%;
    max-width: 40px;
  }

  .bar-value {
    font-size: 0.65em;
  }

  .stats-table {
    font-size: 0.9em;
  }

  .stats-table th,
  .stats-table td {
    padding: 8px 12px;
  }
}
</style>
