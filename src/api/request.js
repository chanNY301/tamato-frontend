// 使用 fetch 替代 axios
import { getToken, removeToken } from './config'
import router from '@/router'

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
          // 如果响应是 JSON 格式，检查HTTP状态码
          // 如果状态码表示错误，检查JSON中是否有success字段
          if (!response.ok) {
            // 如果是401错误，特殊处理
            if (response.status === 401) {
              console.warn('⚠️ Token已过期或无效，清除token并跳转到登录页')
              removeToken()
              const currentPath = router.currentRoute.value.path
              // 只有在非登录/注册/忘记密码页面时才跳转到登录页
              // 避免在跳转到/home时被立即重定向
              if (currentPath !== '/login' && currentPath !== '/register' && currentPath !== '/forgot-password') {
                // 使用nextTick延迟跳转，避免覆盖正在进行的路由跳转
                setTimeout(() => {
                  if (router.currentRoute.value.path !== '/login') {
                    router.push('/login')
                  }
                }, 100)
              }
              const error = new Error('登录已过期，请重新登录')
              error.status = 401
              error.isUnauthorized = true
              error.response = response
              throw error
            }
            // 其他错误，从JSON中提取错误消息
            const errorMessage = result.message || result.error || `请求失败: ${response.status}`
            const error = new Error(errorMessage)
            error.status = response.status
            error.response = response
            error.data = result
            throw error
          }
          // 如果成功，直接返回JSON
          console.log('📦 收到响应:', result)
          return result
        } catch (e) {
          // 如果已经是我们抛出的错误，直接抛出
          if (e.status || e.isUnauthorized) {
            throw e
          }
          // JSON 解析失败，继续使用文本方式
          console.error('JSON 解析失败:', e)
        }
      }
      
      if (!response.ok) {
        // 处理 401 未授权错误（token过期或无效）
        if (response.status === 401) {
          console.warn('⚠️ Token已过期或无效，清除token并跳转到登录页')
          removeToken()
          const currentPath = router.currentRoute.value.path
          // 只有在非登录/注册/忘记密码页面时才跳转到登录页
          if (currentPath !== '/login' && currentPath !== '/register' && currentPath !== '/forgot-password') {
            // 使用setTimeout延迟跳转，避免覆盖正在进行的路由跳转
            setTimeout(() => {
              if (router.currentRoute.value.path !== '/login') {
                router.push('/login')
              }
            }, 100)
          }
          const error = new Error('登录已过期，请重新登录')
          error.status = 401
          error.isUnauthorized = true
          error.response = response
          throw error
        }
        
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
      
      // 先尝试解析响应体（可能是 JSON 格式的错误信息）
      let result
      const contentType = response.headers.get('content-type')
      if (contentType && contentType.includes('application/json')) {
        try {
          result = await response.json()
          // 如果是401错误，处理token过期
          if (response.status === 401) {
            console.warn('⚠️ Token已过期或无效，清除token并跳转到登录页')
            removeToken()
            const currentPath = router.currentRoute.value.path
            // 只有在非登录/注册/忘记密码页面时才跳转到登录页
            if (currentPath !== '/login' && currentPath !== '/register' && currentPath !== '/forgot-password') {
              // 使用setTimeout延迟跳转，避免覆盖正在进行的路由跳转
              setTimeout(() => {
                if (router.currentRoute.value.path !== '/login') {
                  router.push('/login')
                }
              }, 100)
            }
            const error = new Error('登录已过期，请重新登录')
            error.status = 401
            error.isUnauthorized = true
            error.response = response
            throw error
          }
          // 如果是404错误，返回错误信息
          if (response.status === 404) {
            const error = new Error(result.message || '用户不存在')
            error.status = 404
            error.response = response
            throw error
          }
          // 如果响应是 JSON 格式且成功，直接返回
          if (response.ok) {
            console.log('✅ GET请求成功:', result)
            return result
          }
        } catch (e) {
          // 如果已经是我们抛出的错误，直接抛出
          if (e.isUnauthorized || e.status === 401) {
            throw e
          }
          // JSON 解析失败，继续使用文本方式
          console.error('JSON 解析失败:', e)
        }
      }
      
      if (!response.ok) {
        // 处理 401 未授权错误（token过期或无效）
        if (response.status === 401) {
          console.warn('⚠️ Token已过期或无效，清除token并跳转到登录页')
          removeToken()
          const currentPath = router.currentRoute.value.path
          // 只有在非登录/注册/忘记密码页面时才跳转到登录页
          if (currentPath !== '/login' && currentPath !== '/register' && currentPath !== '/forgot-password') {
            // 使用setTimeout延迟跳转，避免覆盖正在进行的路由跳转
            setTimeout(() => {
              if (router.currentRoute.value.path !== '/login') {
                router.push('/login')
              }
            }, 100)
          }
          const error = new Error('登录已过期，请重新登录')
          error.status = 401
          error.isUnauthorized = true
          error.response = response
          throw error
        }
        
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
      
      // 如果 response.ok 为 true，但 result 还未设置，再次解析
      if (!result) {
        result = await response.json()
      }
      console.log('✅ GET请求成功:', result)
      return result
    } catch (error) {
      console.error('❌ GET请求失败:', error)
      // 如果是网络错误（无法连接到服务器）
      if (error.name === 'TypeError' && (error.message.includes('fetch') || error.message.includes('Failed to fetch'))) {
        const networkError = new Error('无法连接到服务器，请确保后端服务正在运行 (http://localhost:8090)')
        networkError.isNetworkError = true
        throw networkError
      }
      // 如果是代理错误
      if (error.message.includes('ECONNREFUSED') || error.message.includes('proxy')) {
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
        // 处理 401 未授权错误（token过期或无效）
        if (response.status === 401) {
          console.warn('⚠️ Token已过期或无效，清除token并跳转到登录页')
          removeToken()
          const currentPath = router.currentRoute.value.path
          // 只有在非登录/注册/忘记密码页面时才跳转到登录页
          if (currentPath !== '/login' && currentPath !== '/register' && currentPath !== '/forgot-password') {
            // 使用setTimeout延迟跳转，避免覆盖正在进行的路由跳转
            setTimeout(() => {
              if (router.currentRoute.value.path !== '/login') {
                router.push('/login')
              }
            }, 100)
          }
          const error = new Error('登录已过期，请重新登录')
          error.status = 401
          error.isUnauthorized = true
          error.response = response
          throw error
        }
        
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
        // 处理 401 未授权错误（token过期或无效）
        if (response.status === 401) {
          console.warn('⚠️ Token已过期或无效，清除token并跳转到登录页')
          removeToken()
          const currentPath = router.currentRoute.value.path
          // 只有在非登录/注册/忘记密码页面时才跳转到登录页
          if (currentPath !== '/login' && currentPath !== '/register' && currentPath !== '/forgot-password') {
            // 使用setTimeout延迟跳转，避免覆盖正在进行的路由跳转
            setTimeout(() => {
              if (router.currentRoute.value.path !== '/login') {
                router.push('/login')
              }
            }, 100)
          }
          const error = new Error('登录已过期，请重新登录')
          error.status = 401
          error.isUnauthorized = true
          error.response = response
          throw error
        }
        
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
