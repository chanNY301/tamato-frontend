import request from './request'
import { API_BASE_URL, setToken, removeToken } from './config'

// 登录
export const login = async (username, password) => {
  const response = await request.post(
    `${API_BASE_URL}/auth/login`,
    {
      username: username,
      password: password
    },
    { includeAuth: false } // 登录接口不需要token
  )
  
  // 如果登录成功，保存token
  if (response.success && response.data && response.data.token) {
    setToken(response.data.token)
  }
  
  return response
}

// 注册
export const register = async (username, email, password, phone = null) => {
  const requestData = {
    username: username,
    email: email,
    password: password
  }
  
  // 只有当手机号不为空时才添加到请求中
  if (phone && phone.trim() !== '') {
    requestData.phone = phone.trim()
  }
  
  const response = await request.post(
    `${API_BASE_URL}/auth/register`,
    requestData,
    { includeAuth: false } // 注册接口不需要token
  )
  
  // 注册成功后不自动保存token，让用户手动登录
  // 这样用户可以在登录页面看到注册成功的提示
  
  return response
}

// 登出
export const logout = async () => {
  const response = await request.post(`${API_BASE_URL}/auth/logout`)
  // 登出成功后清除本地token
  if (response.success) {
    removeToken()
  }
  return response
}

