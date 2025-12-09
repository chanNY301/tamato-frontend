// 使用 fetch 替代 axios
import { getToken } from './config'

// 构建请求头
const buildHeaders = (includeAuth = true) => {
  const headers = {
    'Content-Type': 'application/json',
  }
  
  if (includeAuth) {
    const token = getToken()
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }
  }
  
  return headers
}

const request = {
  async post(url, data, options = {}) {
    try {
      console.log('🚀 发送POST请求到:', url)
      console.log('📦 请求数据:', data)
      
      const response = await fetch(url, {
        method: 'POST',
        headers: buildHeaders(options.includeAuth !== false),
        body: JSON.stringify(data),
        ...options
      })
      
      // 先尝试解析响应体（可能是 JSON 格式的错误信息）
      let result
      const contentType = response.headers.get('content-type')
      if (contentType && contentType.includes('application/json')) {
        try {
          result = await response.json()
          // 如果响应是 JSON 格式，直接返回，让调用方根据 result.success 来判断
          // 无论 HTTP 状态码是什么，都返回解析后的 JSON
          console.log('📦 收到响应:', result)
          return result
        } catch (e) {
          // JSON 解析失败，继续使用文本方式
          console.error('JSON 解析失败:', e)
        }
      }
      
      if (!response.ok) {
        let errorText = ''
        try {
          errorText = await response.text()
        } catch (e) {
          errorText = `HTTP ${response.status} ${response.statusText}`
        }
        console.error('❌ 请求失败:', response.status, errorText)
        const error = new Error(errorText || `请求失败: ${response.status}`)
        error.status = response.status
        error.response = response
        throw error
      }
      
      // 如果 response.ok 为 true，但 result 还未设置，再次解析
      if (!result) {
        result = await response.json()
      }
      console.log('✅ POST请求成功:', result)
      return result
      
    } catch (error) {
      console.error('❌ POST请求失败:', error)
      // 如果是网络错误（无法连接到服务器）
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        const networkError = new Error('无法连接到服务器，请确保后端服务正在运行 (http://localhost:8090)')
        networkError.isNetworkError = true
        throw networkError
      }
      throw error
    }
  },
  
  async get(url, options = {}) {
    try {
      console.log('🚀 发送GET请求到:', url)
      const response = await fetch(url, {
        method: 'GET',
        headers: buildHeaders(options.includeAuth !== false),
        ...options
      })
      
      if (!response.ok) {
        let errorText = ''
        try {
          errorText = await response.text()
        } catch (e) {
          errorText = `HTTP ${response.status} ${response.statusText}`
        }
        console.error('❌ GET请求失败:', response.status, errorText)
        const error = new Error(errorText || `请求失败: ${response.status}`)
        error.status = response.status
        error.response = response
        throw error
      }
      
      const result = await response.json()
      console.log('✅ GET请求成功:', result)
      return result
    } catch (error) {
      console.error('❌ GET请求失败:', error)
      // 如果是网络错误（无法连接到服务器）
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        const networkError = new Error('无法连接到服务器，请确保后端服务正在运行 (http://localhost:8090)')
        networkError.isNetworkError = true
        throw networkError
      }
      throw error
    }
  },
  
  async put(url, data, options = {}) {
    try {
      console.log('🚀 发送PUT请求到:', url)
      console.log('📦 请求数据:', data)
      
      const response = await fetch(url, {
        method: 'PUT',
        headers: buildHeaders(options.includeAuth !== false),
        body: JSON.stringify(data),
        ...options
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ PUT请求失败:', response.status, errorText)
        throw new Error(`请求失败: ${response.status} ${errorText}`)
      }
      
      const result = await response.json()
      console.log('✅ PUT请求成功:', result)
      return result
      
    } catch (error) {
      console.error('❌ PUT请求失败:', error)
      throw error
    }
  },
  
  async delete(url, data = null, options = {}) {
    try {
      console.log('🚀 发送DELETE请求到:', url)
      
      const fetchOptions = {
        method: 'DELETE',
        headers: buildHeaders(options.includeAuth !== false),
        ...options
      }
      
      // 如果有数据，添加到请求体
      if (data) {
        fetchOptions.body = JSON.stringify(data)
      }
      
      const response = await fetch(url, fetchOptions)
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ DELETE请求失败:', response.status, errorText)
        throw new Error(`请求失败: ${response.status} ${errorText}`)
      }
      
      // DELETE请求可能没有响应体
      const contentType = response.headers.get('content-type')
      if (contentType && contentType.includes('application/json')) {
        const result = await response.json()
        console.log('✅ DELETE请求成功:', result)
        return result
      } else {
        console.log('✅ DELETE请求成功')
        return { success: true }
      }
    } catch (error) {
      console.error('❌ DELETE请求失败:', error)
      throw error
    }
  }
}

export default request