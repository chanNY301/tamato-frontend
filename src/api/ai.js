// AI对话API
// 通过后端调用大模型API，避免CORS跨域问题

import request from './request'
import { API_BASE_URL } from './config'

/**
 * 与AI对话
 * @param {Array} messages - 消息历史，格式：[{role: 'user'|'assistant', content: '...'}]
 * @param {Boolean} deductTomato - 是否扣除番茄（默认true，打开聊天时扣除，发送消息时不扣除）
 * @returns {Promise} AI回复
 */
export const chatWithAI = async (messages, deductTomato = true) => {
  try {
    // 调用后端API（后端会处理大模型API调用）
    console.log('🚀 调用后端AI接口:', `${API_BASE_URL}/ai/chat`, '扣除番茄:', deductTomato)
    
    const response = await request.post(`${API_BASE_URL}/ai/chat`, { 
      messages,
      deductTomato: deductTomato !== false // 默认true，除非明确设置为false
    })
    
    if (response.success && response.data) {
      console.log('✅ 后端AI接口调用成功')
      return {
        content: response.data.content
      }
    } else {
      console.warn('⚠️ 后端AI接口返回失败，使用模拟回复')
      return getMockResponse(messages)
    }
  } catch (error) {
    console.error('❌ 后端AI接口调用失败:', error)
    // 发生错误时，返回模拟回复而不是抛出错误
    console.warn('⚠️ API调用失败，使用模拟回复')
    return getMockResponse(messages)
  }
}

/**
 * 模拟AI回复（当后端API调用失败时使用）
 */
const getMockResponse = (messages) => {
  const lastMessage = messages[messages.length - 1]?.content || ''
  const lowerMessage = lastMessage.toLowerCase()
  
  // 简单的关键词匹配回复
  const responses = {
    '你好': '你好呀！我是番茄小助手🍅，很高兴认识你！',
    '学习': '学习很重要呢！记得用番茄工作法，保持专注哦！',
    '累': '累了就休息一下吧，劳逸结合才能更好地学习！',
    '加油': '加油！我相信你可以的！💪',
    '任务': '记得完成待办任务哦，完成一个任务就给自己一个小奖励！',
    '签到': '记得每天签到领取番茄哦，坚持就是胜利！',
    '帮助': '我可以陪你聊天，给你学习建议，或者只是听你说话。有什么想聊的吗？'
  }
  
  // 查找匹配的关键词
  for (const [keyword, response] of Object.entries(responses)) {
    if (lowerMessage.includes(keyword)) {
      return { content: response }
    }
  }
  
  // 默认回复
  const defaultResponses = [
    '我在听呢，继续说吧！',
    '这个问题很有趣呢，让我想想...',
    '虽然我还不够聪明，但我会努力理解你的意思的！',
    '你可以说得更详细一点吗？',
    '我明白了，还有其他问题吗？'
  ]
  
  return {
    content: defaultResponses[Math.floor(Math.random() * defaultResponses.length)]
  }
}

export default {
  chatWithAI
}

