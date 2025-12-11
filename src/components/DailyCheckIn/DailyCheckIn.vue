<template>
  <div class="daily-checkin-card">
    <div class="checkin-header">
      <span class="checkin-title">📅 {{ currentMonth }}</span>
      <span class="checkin-days">{{ checkInDays }}天</span>
    </div>
    
    <!-- 本月日历 -->
    <div class="calendar-container">
      <!-- 星期标题 -->
      <div class="calendar-weekdays">
        <div class="weekday" v-for="day in weekdays" :key="day">{{ day }}</div>
      </div>
      
      <!-- 日期网格 -->
      <div class="calendar-grid">
        <div 
          v-for="(day, index) in calendarDays" 
          :key="index"
          :class="['calendar-day', { 
            'other-month': day.isOtherMonth,
            'today': day.isToday,
            'checked': day.isChecked
          }]"
          :title="day.date"
        >
          <span v-if="day.isChecked" class="tomato-icon">🍅</span>
          <span v-else class="day-number">{{ day.day }}</span>
        </div>
      </div>
    </div>
    
    <!-- 签到按钮 -->
    <div class="checkin-button-container">
      <button 
        v-if="!hasCheckedInToday"
        class="checkin-button" 
        @click="handleCheckIn"
        :disabled="checkingIn"
      >
        <span v-if="checkingIn">签到中...</span>
        <span v-else>立即签到</span>
      </button>
      <div v-else class="checked-message">
        <span class="checked-icon">✓</span>
        <span>今日已签到</span>
      </div>
    </div>
  </div>
</template>

<script>
import { getCurrency, checkIn, getCurrentMonthCheckInDates } from '@/api/user'

export default {
  name: 'DailyCheckIn',
  data() {
    return {
      checkInDays: 0,
      hasCheckedInToday: false,
      checkingIn: false,
      currentDate: new Date(),
      checkedDates: new Set() // 存储已签到的日期
    }
  },
  computed: {
    currentMonth() {
      const year = this.currentDate.getFullYear()
      const month = this.currentDate.getMonth() + 1
      return `${year}年${month}月`
    },
    weekdays() {
      return ['日', '一', '二', '三', '四', '五', '六']
    },
    calendarDays() {
      const year = this.currentDate.getFullYear()
      const month = this.currentDate.getMonth()
      const today = new Date()
      
      // 获取本月第一天是星期几
      const firstDay = new Date(year, month, 1)
      const firstDayWeek = firstDay.getDay()
      
      // 获取本月天数
      const daysInMonth = new Date(year, month + 1, 0).getDate()
      
      // 获取上个月需要显示的天数
      const prevMonthDays = firstDayWeek
      
      // 获取上个月的最后几天
      const prevMonth = new Date(year, month, 0)
      const daysInPrevMonth = prevMonth.getDate()
      
      const days = []
      
      // 添加上个月的日期（灰色显示）
      for (let i = prevMonthDays - 1; i >= 0; i--) {
        const day = daysInPrevMonth - i
        const date = new Date(year, month - 1, day)
        const dateStr = this.formatDate(date)
        days.push({
          day: day,
          date: dateStr,
          isOtherMonth: true,
          isToday: false,
          isChecked: this.checkedDates.has(dateStr)
        })
      }
      
      // 添加本月的日期
      for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day)
        const dateStr = this.formatDate(date)
        const isToday = date.getDate() === today.getDate() &&
                       date.getMonth() === today.getMonth() &&
                       date.getFullYear() === today.getFullYear()
        
        days.push({
          day: day,
          date: dateStr,
          isOtherMonth: false,
          isToday: isToday,
          isChecked: this.checkedDates.has(dateStr)
        })
      }
      
      // 添加下个月的日期（填充到6行，42个格子）
      const remainingDays = 42 - days.length
      for (let day = 1; day <= remainingDays; day++) {
        const date = new Date(year, month + 1, day)
        const dateStr = this.formatDate(date)
        days.push({
          day: day,
          date: dateStr,
          isOtherMonth: true,
          isToday: false,
          isChecked: this.checkedDates.has(dateStr)
        })
      }
      
      return days
    }
  },
  mounted() {
    this.loadCheckInStatus()
  },
  methods: {
    formatDate(date) {
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    },
    
    async loadCheckInStatus() {
      try {
        // 并行获取资产信息和签到记录
        const [currency, checkInDates] = await Promise.all([
          getCurrency(),
          getCurrentMonthCheckInDates().catch(() => []) // 如果API不存在，返回空数组
        ])
        
        if (currency) {
          this.checkInDays = currency.check_day || 0
          this.hasCheckedInToday = currency.has_checked_in_today || false
        }
        
        // 更新已签到的日期集合
        this.updateCheckedDates(checkInDates || [])
      } catch (error) {
        console.error('加载签到状态失败:', error)
        // 如果获取签到记录失败，至少显示今天的签到状态
        try {
          const currency = await getCurrency()
          if (currency) {
            this.checkInDays = currency.check_day || 0
            this.hasCheckedInToday = currency.has_checked_in_today || false
          }
        } catch (e) {
          console.error('获取资产信息失败:', e)
        }
        this.updateCheckedDates([])
      }
    },
    
    updateCheckedDates(checkInDateStrings = []) {
      // 清空已签到的日期集合
      this.checkedDates.clear()
      
      // 添加所有已签到的日期
      checkInDateStrings.forEach(dateStr => {
        this.checkedDates.add(dateStr)
      })
      
      // 如果今天已签到但不在列表中，确保添加今天
      if (this.hasCheckedInToday) {
        const today = new Date()
        const todayStr = this.formatDate(today)
        this.checkedDates.add(todayStr)
      }
    },
    
    async handleCheckIn() {
      if (this.hasCheckedInToday || this.checkingIn) {
        return
      }
      
      this.checkingIn = true
      try {
        await checkIn()
        // 签到成功后，重新加载签到状态
        await this.loadCheckInStatus()
        
        // 显示成功提示
        this.$emit('checkin-success', {
          message: '签到成功！获得 1 个番茄 🍅',
          tomatoes: 1
        })
      } catch (error) {
        console.error('签到失败:', error)
        const errorMessage = error.message || '签到失败，请稍后重试'
        if (errorMessage.includes('今日已签到')) {
          alert('今日已签到，请明天再来')
          await this.loadCheckInStatus()
        } else {
          alert(errorMessage)
        }
      } finally {
        this.checkingIn = false
      }
    }
  }
}
</script>

<style scoped>
.daily-checkin-card {
  background: white;
  border-radius: 10px;
  padding: 12px;
  box-shadow: 0 2px 6px rgba(238, 170, 103, 0.1);
  border: 1px solid #ffe4cc;
  margin-bottom: 15px;
}

.checkin-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  padding-bottom: 8px;
  border-bottom: 1px solid #f5f5f5;
}

.checkin-title {
  font-size: 0.9em;
  color: #333;
  font-weight: 600;
}

.checkin-days {
  font-size: 0.75em;
  color: #eeaa67;
  font-weight: 600;
  background: #fff5eb;
  padding: 2px 8px;
  border-radius: 10px;
}

.calendar-container {
  margin-bottom: 10px;
}

.calendar-weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 2px;
  margin-bottom: 4px;
}

.weekday {
  text-align: center;
  font-size: 0.7em;
  color: #999;
  font-weight: 500;
  padding: 4px 0;
}

.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 2px;
}

.calendar-day {
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  font-size: 0.75em;
  transition: all 0.2s;
  position: relative;
}

.calendar-day.other-month {
  color: #ddd;
}

.calendar-day.today {
  background: #fff5eb;
  border: 1px solid #ffe4cc;
  font-weight: 600;
  color: #eeaa67;
}

.calendar-day.checked {
  background: #fff5eb;
}

.tomato-icon {
  font-size: 1.2em;
  display: block;
}

.day-number {
  display: block;
  color: #666;
}

.calendar-day.today .day-number {
  color: #eeaa67;
}

.calendar-day.other-month .day-number {
  color: #ddd;
}

.checkin-button-container {
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid #f5f5f5;
  text-align: center;
}

.checkin-button {
  width: 100%;
  padding: 8px;
  background: linear-gradient(135deg, #eeaa67, #f5b877);
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 0.85em;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 4px rgba(238, 170, 103, 0.25);
}

.checkin-button:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 3px 8px rgba(238, 170, 103, 0.35);
}

.checkin-button:active:not(:disabled) {
  transform: translateY(0);
}

.checkin-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.checked-message {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  color: #eeaa67;
  font-size: 0.85em;
  font-weight: 500;
  padding: 8px;
}

.checked-icon {
  font-size: 1em;
  font-weight: bold;
}

@media (max-width: 768px) {
  .daily-checkin-card {
    padding: 10px;
  }
  
  .checkin-title {
    font-size: 0.85em;
  }
  
  .weekday {
    font-size: 0.65em;
  }
  
  .calendar-day {
    font-size: 0.7em;
  }
  
  .tomato-icon {
    font-size: 1em;
  }
}
</style>
