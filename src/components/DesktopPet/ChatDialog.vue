<template>
  <div v-if="visible" class="chat-dialog-overlay" @click.self="closeDialog">
    <div class="chat-dialog">
      <!-- 对话框头部 -->
      <div class="chat-header">
        <div class="chat-header-left">
          <div class="pet-avatar">🍅</div>
          <div class="chat-title">
            <div class="chat-name">番茄小助手</div>
            <div class="chat-status">在线</div>
          </div>
        </div>
        <button class="close-btn" @click="closeDialog">×</button>
      </div>
      
      <!-- 消息列表 -->
      <div class="chat-messages" ref="messagesContainer">
        <div 
          v-for="(message, index) in messages" 
          :key="index"
          :class="['message', message.role]"
        >
          <div class="message-avatar" v-if="message.role === 'assistant'">🍅</div>
          <div class="message-content">
            <div class="message-text">{{ message.content }}</div>
            <div class="message-time">{{ formatTime(message.timestamp) }}</div>
          </div>
          <div class="message-avatar" v-if="message.role === 'user'">👤</div>
        </div>
        
        <!-- 加载中提示 -->
        <div v-if="isLoading" class="message assistant">
          <div class="message-avatar">🍅</div>
          <div class="message-content">
            <div class="message-text typing">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 输入框 -->
      <div class="chat-input-area">
        <div class="chat-input-wrapper">
          <textarea
            v-model="inputMessage"
            class="chat-input"
            placeholder="输入消息..."
            @keydown.enter.exact.prevent="sendMessage"
            @keydown.enter.shift.exact="inputMessage += '\n'"
            rows="1"
            ref="inputRef"
          ></textarea>
          <button 
            class="send-btn" 
            @click="sendMessage"
            :disabled="!inputMessage.trim() || isLoading"
          >
            <span v-if="!isLoading">发送</span>
            <span v-else>发送中...</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { chatWithAI } from '@/api/ai'

export default {
  name: 'ChatDialog',
  props: {
    visible: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      messages: [],
      inputMessage: '',
      isLoading: false,
      inputRef: null
    }
  },
  watch: {
    visible(newVal) {
      if (newVal) {
        // 对话框打开时，添加欢迎消息
        this.addWelcomeMessage()
        // 聚焦输入框
        this.$nextTick(() => {
          if (this.$refs.inputRef) {
            this.$refs.inputRef.focus()
          }
        })
      }
    },
    messages: {
      handler() {
        // 消息更新时滚动到底部
        this.$nextTick(() => {
          this.scrollToBottom()
        })
      },
      deep: true
    }
  },
  methods: {
    addWelcomeMessage() {
      if (this.messages.length === 0) {
        const hour = new Date().getHours()
        let greeting = ''
        
        if (hour >= 6 && hour < 9) {
          greeting = '早上好呀！我是你的番茄桌宠，有什么可以帮助你的吗？'
        } else if (hour >= 9 && hour < 12) {
          greeting = '上午好！今天也要加油学习哦，有什么问题尽管问我吧！'
        } else if (hour >= 12 && hour < 14) {
          greeting = '中午好！记得适当休息，有什么想聊的吗？'
        } else if (hour >= 14 && hour < 18) {
          greeting = '下午好！继续加油，有什么需要帮助的吗？'
        } else if (hour >= 18 && hour < 22) {
          greeting = '晚上好！今天学习得怎么样？有什么问题可以问我哦！'
        } else {
          greeting = '夜深了，还在学习吗？有什么问题尽管问我吧！'
        }
        
        this.messages.push({
          role: 'assistant',
          content: greeting,
          timestamp: new Date()
        })
      }
    },
    
    async sendMessage() {
      if (!this.inputMessage.trim() || this.isLoading) {
        return
      }
      
      const userMessage = this.inputMessage.trim()
      this.inputMessage = ''
      
      // 添加用户消息
      this.messages.push({
        role: 'user',
        content: userMessage,
        timestamp: new Date()
      })
      
      // 显示加载状态
      this.isLoading = true
      
      try {
        // 调用AI API
        const response = await chatWithAI(this.messages)
        
        // 添加AI回复
        this.messages.push({
          role: 'assistant',
          content: response.content || '抱歉，我暂时无法回答这个问题。',
          timestamp: new Date()
        })
      } catch (error) {
        console.error('AI对话失败:', error)
        // 添加错误消息
        this.messages.push({
          role: 'assistant',
          content: '抱歉，我现在无法回复，请稍后再试。',
          timestamp: new Date()
        })
      } finally {
        this.isLoading = false
        // 重新聚焦输入框
        this.$nextTick(() => {
          if (this.$refs.inputRef) {
            this.$refs.inputRef.focus()
          }
        })
      }
    },
    
    closeDialog() {
      this.$emit('close')
    },
    
    scrollToBottom() {
      const container = this.$refs.messagesContainer
      if (container) {
        container.scrollTop = container.scrollHeight
      }
    },
    
    formatTime(timestamp) {
      const date = new Date(timestamp)
      const hours = date.getHours().toString().padStart(2, '0')
      const minutes = date.getMinutes().toString().padStart(2, '0')
      return `${hours}:${minutes}`
    }
  }
}
</script>

<style scoped>
.chat-dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.chat-dialog {
  width: 90%;
  max-width: 600px;
  height: 80vh;
  max-height: 700px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  animation: slideUp 0.3s ease;
}

@keyframes slideUp {
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

/* 头部 */
.chat-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid #e0e0e0;
  background: linear-gradient(135deg, #eeaa67, #f5b877);
  color: white;
}

.chat-header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.pet-avatar {
  font-size: 32px;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
}

.chat-title {
  display: flex;
  flex-direction: column;
}

.chat-name {
  font-size: 16px;
  font-weight: 600;
}

.chat-status {
  font-size: 12px;
  opacity: 0.9;
}

.close-btn {
  width: 32px;
  height: 32px;
  border: none;
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border-radius: 50%;
  cursor: pointer;
  font-size: 24px;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.3);
}

/* 消息列表 */
.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  background: #f5f5f5;
}

.chat-messages::-webkit-scrollbar {
  width: 6px;
}

.chat-messages::-webkit-scrollbar-track {
  background: #f1f1f1;
}

.chat-messages::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.message {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  margin-bottom: 16px;
  animation: messageSlide 0.3s ease;
}

@keyframes messageSlide {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.message.user {
  flex-direction: row-reverse;
}

.message-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  flex-shrink: 0;
  background: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.message-content {
  max-width: 70%;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.message.user .message-content {
  align-items: flex-end;
}

.message.assistant .message-content {
  align-items: flex-start;
}

.message-text {
  padding: 10px 14px;
  border-radius: 12px;
  word-wrap: break-word;
  line-height: 1.5;
}

.message.user .message-text {
  background: linear-gradient(135deg, #eeaa67, #f5b877);
  color: white;
  border-bottom-right-radius: 4px;
}

.message.assistant .message-text {
  background: white;
  color: #333;
  border-bottom-left-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.message-time {
  font-size: 11px;
  color: #999;
  padding: 0 4px;
}

/* 打字动画 */
.typing {
  display: flex;
  gap: 4px;
  padding: 10px 14px;
}

.typing span {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #999;
  animation: typing 1.4s infinite;
}

.typing span:nth-child(2) {
  animation-delay: 0.2s;
}

.typing span:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes typing {
  0%, 60%, 100% {
    transform: translateY(0);
    opacity: 0.7;
  }
  30% {
    transform: translateY(-10px);
    opacity: 1;
  }
}

/* 输入区域 */
.chat-input-area {
  padding: 16px 20px;
  border-top: 1px solid #e0e0e0;
  background: white;
}

.chat-input-wrapper {
  display: flex;
  gap: 10px;
  align-items: flex-end;
}

.chat-input {
  flex: 1;
  padding: 10px 14px;
  border: 1px solid #e0e0e0;
  border-radius: 20px;
  font-size: 14px;
  resize: none;
  max-height: 120px;
  font-family: inherit;
  transition: border-color 0.2s;
}

.chat-input:focus {
  outline: none;
  border-color: #eeaa67;
}

.send-btn {
  padding: 10px 20px;
  background: linear-gradient(135deg, #eeaa67, #f5b877);
  color: white;
  border: none;
  border-radius: 20px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: transform 0.2s, box-shadow 0.2s;
  white-space: nowrap;
}

.send-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(238, 170, 103, 0.4);
}

.send-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* 响应式 */
@media (max-width: 768px) {
  .chat-dialog {
    width: 100%;
    height: 100vh;
    max-height: 100vh;
    border-radius: 0;
  }
  
  .message-content {
    max-width: 85%;
  }
}
</style>

