<template>
  <div 
    class="desktop-pet"
    :style="petStyle"
    @mousedown="startDrag"
    @click="handleClick"
    @mouseenter="showTooltip = true"
    @mouseleave="showTooltip = false"
  >
    <!-- 桌宠主体 -->
    <div class="pet-body" :class="animationClass" :style="bodyStyle">
      <div class="pet-emoji">🍅</div>
    </div>
    
    <!-- 提示信息 -->
    <div v-if="showTooltip" class="pet-tooltip">
      {{ tooltipText }}
    </div>
    
    <!-- 对话气泡 - 放在外层，不受transform影响 -->
    <div v-if="showBubble" class="pet-bubble" :class="{ 'bubble-visible': showBubble }">
      {{ bubbleText }}
    </div>
  </div>
</template>

<script>
export default {
  name: 'DesktopPet',
  data() {
    return {
      // 位置
      x: window.innerWidth - 120,
      y: window.innerHeight - 120,
      
      // 拖拽状态
      isDragging: false,
      dragOffset: { x: 0, y: 0 },
      
      // 动画状态
      animationState: 'idle', // idle, walking, happy, sleep
      direction: 1, // 1: 向右, -1: 向左
      
      // 自动移动
      autoMoveTimer: null,
      targetX: null,
      targetY: null,
      moveSpeed: 2,
      
      // 交互
      showTooltip: false,
      showBubble: false,
      bubbleText: '',
      clickCount: 0,
      
      // 待机动画
      idleAnimationTimer: null
    }
  },
  computed: {
    petStyle() {
      return {
        left: `${this.x}px`,
        top: `${this.y}px`
      }
    },
    bodyStyle() {
      return {
        transform: `scaleX(${this.direction})`
      }
    },
    animationClass() {
      return {
        'pet-idle': this.animationState === 'idle',
        'pet-walking': this.animationState === 'walking',
        'pet-happy': this.animationState === 'happy',
        'pet-sleep': this.animationState === 'sleep'
      }
    },
    tooltipText() {
      return '点击我试试！拖拽可以移动'
    }
  },
  mounted() {
    this.initPet()
    this.startIdleAnimation()
    this.startAutoMove()
    window.addEventListener('mousemove', this.onMouseMove)
    window.addEventListener('mouseup', this.stopDrag)
    window.addEventListener('resize', this.handleResize)
  },
  beforeUnmount() {
    this.stopAllTimers()
    window.removeEventListener('mousemove', this.onMouseMove)
    window.removeEventListener('mouseup', this.stopDrag)
    window.removeEventListener('resize', this.handleResize)
  },
  methods: {
    initPet() {
      // 初始化位置（右下角）
      this.x = Math.max(20, window.innerWidth - 100)
      this.y = Math.max(20, window.innerHeight - 100)
    },
    
    // 拖拽功能
    startDrag(e) {
      this.isDragging = true
      this.dragOffset.x = e.clientX - this.x
      this.dragOffset.y = e.clientY - this.y
      this.animationState = 'walking'
      this.stopAutoMove()
    },
    
    onMouseMove(e) {
      if (this.isDragging) {
        this.x = Math.max(0, Math.min(e.clientX - this.dragOffset.x, window.innerWidth - 80))
        this.y = Math.max(0, Math.min(e.clientY - this.dragOffset.y, window.innerHeight - 80))
        
        // 根据移动方向改变朝向
        if (e.movementX > 0) {
          this.direction = 1
        } else if (e.movementX < 0) {
          this.direction = -1
        }
      }
    },
    
    stopDrag() {
      if (this.isDragging) {
        this.isDragging = false
        this.animationState = 'idle'
        this.startAutoMove()
      }
    },
    
    // 点击交互
    handleClick() {
      this.clickCount++
      
      // 显示不同的对话
      const messages = [
        '你好！我是番茄桌宠 🍅',
        '今天也要努力学习哦！',
        '记得完成待办任务～',
        '加油！你可以的！',
        '记得签到领取番茄哦 🎁'
      ]
      
      const randomMessage = messages[Math.floor(Math.random() * messages.length)]
      this.showBubbleMessage(randomMessage)
      
      // 点击动画
      this.animationState = 'happy'
      setTimeout(() => {
        if (!this.isDragging) {
          this.animationState = 'idle'
        }
      }, 500)
    },
    
    showBubbleMessage(text) {
      this.bubbleText = text
      this.showBubble = true
      setTimeout(() => {
        this.showBubble = false
      }, 3000)
    },
    
    // 自动移动
    startAutoMove() {
      this.stopAutoMove()
      
      // 每5-10秒随机移动一次
      const delay = Math.random() * 5000 + 5000
      
      this.autoMoveTimer = setTimeout(() => {
        if (!this.isDragging) {
          this.moveToRandomPosition()
        }
        this.startAutoMove()
      }, delay)
    },
    
    stopAutoMove() {
      if (this.autoMoveTimer) {
        clearTimeout(this.autoMoveTimer)
        this.autoMoveTimer = null
      }
      this.targetX = null
      this.targetY = null
    },
    
    moveToRandomPosition() {
      // 随机目标位置
      this.targetX = Math.random() * (window.innerWidth - 100)
      this.targetY = Math.random() * (window.innerHeight - 100)
      this.animationState = 'walking'
      
      // 根据目标位置决定方向
      if (this.targetX > this.x) {
        this.direction = 1
      } else {
        this.direction = -1
      }
      
      // 移动动画
      this.animateMove()
    },
    
    animateMove() {
      if (this.isDragging || !this.targetX || !this.targetY) {
        this.animationState = 'idle'
        return
      }
      
      const dx = this.targetX - this.x
      const dy = this.targetY - this.y
      const distance = Math.sqrt(dx * dx + dy * dy)
      
      if (distance < 5) {
        // 到达目标
        this.x = this.targetX
        this.y = this.targetY
        this.targetX = null
        this.targetY = null
        this.animationState = 'idle'
        return
      }
      
      // 继续移动
      const moveX = (dx / distance) * this.moveSpeed
      const moveY = (dy / distance) * this.moveSpeed
      
      this.x = Math.max(0, Math.min(this.x + moveX, window.innerWidth - 80))
      this.y = Math.max(0, Math.min(this.y + moveY, window.innerHeight - 80))
      
      requestAnimationFrame(() => this.animateMove())
    },
    
    // 待机动画
    startIdleAnimation() {
      this.idleAnimationTimer = setInterval(() => {
        if (!this.isDragging && this.animationState === 'idle') {
          // 偶尔做一些小动作
          if (Math.random() < 0.3) {
            this.animationState = 'happy'
            setTimeout(() => {
              if (this.animationState === 'happy') {
                this.animationState = 'idle'
              }
            }, 800)
          }
        }
      }, 3000)
    },
    
    // 窗口大小改变
    handleResize() {
      // 确保桌宠不会超出窗口
      this.x = Math.max(0, Math.min(this.x, window.innerWidth - 80))
      this.y = Math.max(0, Math.min(this.y, window.innerHeight - 80))
    },
    
    // 清理所有定时器
    stopAllTimers() {
      this.stopAutoMove()
      if (this.idleAnimationTimer) {
        clearInterval(this.idleAnimationTimer)
        this.idleAnimationTimer = null
      }
    }
  }
}
</script>

<style scoped>
.desktop-pet {
  position: fixed;
  width: 80px;
  height: 80px;
  z-index: 9999;
  cursor: grab;
  user-select: none;
  pointer-events: auto;
  transition: transform 0.1s ease;
}

.desktop-pet:active {
  cursor: grabbing;
}

.pet-body {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.pet-emoji {
  font-size: 60px;
  transition: transform 0.3s ease;
}

/* 待机动画 */
.pet-idle .pet-emoji {
  animation: idleBounce 2s ease-in-out infinite;
}

@keyframes idleBounce {
  0%, 100% {
    transform: translateY(0) scale(1);
  }
  50% {
    transform: translateY(-5px) scale(1.05);
  }
}

/* 走路动画 */
.pet-walking .pet-emoji {
  animation: walking 0.6s ease-in-out infinite;
}

@keyframes walking {
  0%, 100% {
    transform: translateY(0) rotate(-5deg);
  }
  50% {
    transform: translateY(-8px) rotate(5deg);
  }
}

/* 开心动画 */
.pet-happy .pet-emoji {
  animation: happy 0.5s ease-in-out;
}

@keyframes happy {
  0% {
    transform: scale(1) rotate(0deg);
  }
  25% {
    transform: scale(1.2) rotate(-10deg);
  }
  50% {
    transform: scale(1.3) rotate(10deg);
  }
  75% {
    transform: scale(1.2) rotate(-5deg);
  }
  100% {
    transform: scale(1) rotate(0deg);
  }
}

/* 睡觉动画 */
.pet-sleep .pet-emoji {
  animation: sleep 3s ease-in-out infinite;
  opacity: 0.7;
}

@keyframes sleep {
  0%, 100% {
    transform: translateY(0) rotate(0deg);
  }
  50% {
    transform: translateY(-3px) rotate(5deg);
  }
}

/* 提示信息 */
.pet-tooltip {
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 12px;
  white-space: nowrap;
  margin-bottom: 8px;
  pointer-events: none;
  animation: tooltipFade 0.3s ease;
}

.pet-tooltip::after {
  content: '';
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  border: 6px solid transparent;
  border-top-color: rgba(0, 0, 0, 0.8);
}

@keyframes tooltipFade {
  from {
    opacity: 0;
    transform: translateX(-50%) translateY(5px);
  }
  to {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
}

/* 对话气泡 */
.pet-bubble {
  position: absolute;
  left: 100%;
  top: 50%;
  transform: translateY(-50%);
  background: white;
  color: #333;
  padding: 8px 12px;
  border-radius: 12px;
  font-size: 13px;
  max-width: 250px;
  margin-left: 15px;
  white-space: nowrap;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.3s ease, transform 0.3s ease;
  z-index: 10000;
  /* 确保文字不镜像 */
  direction: ltr;
  text-align: left;
}

.pet-bubble.bubble-visible {
  opacity: 1;
  transform: translateY(-50%) translateX(5px);
}

.pet-bubble::after {
  content: '';
  position: absolute;
  right: 100%;
  top: 50%;
  transform: translateY(-50%);
  border: 8px solid transparent;
  border-right-color: white;
}

/* 响应式 */
@media (max-width: 768px) {
  .desktop-pet {
    width: 60px;
    height: 60px;
  }
  
  .pet-emoji {
    font-size: 45px;
  }
  
  .pet-bubble {
    max-width: 150px;
    font-size: 12px;
  }
}
</style>

