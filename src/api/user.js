import request from './request'
import { API_BASE_URL, getToken } from './config'

// 获取当前用户信息
export const getCurrentUser = async () => {
  return request.get(`${API_BASE_URL}/user/me`)
}

// 更新当前用户信息
export const updateCurrentUser = async (data) => {
  return request.put(`${API_BASE_URL}/me`, data)
}

// 上传头像
export const uploadAvatar = async (file) => {
  const formData = new FormData()
  formData.append('file', file)
  
  const token = getToken()
  if (!token) {
    throw new Error('未登录，请先登录')
  }
  
  const response = await fetch(`${API_BASE_URL}/me/avatar`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: formData
  })
  
  if (!response.ok) {
    let errorText = ''
    try {
      errorText = await response.text()
    } catch (e) {
      errorText = `HTTP ${response.status} ${response.statusText}`
    }
    const error = new Error(errorText || `请求失败: ${response.status}`)
    error.status = response.status
    throw error
  }
  
  const result = await response.json()
  console.log('uploadAvatar API返回结果:', JSON.stringify(result, null, 2))
  return result
}

// 获取当前用户隐私设置
export const getCurrentUserPrivacy = async () => {
  return request.get(`${API_BASE_URL}/me/privacy`)
}

// 更新当前用户隐私设置
export const updateCurrentUserPrivacy = async (data) => {
  return request.put(`${API_BASE_URL}/me/privacy`, data)
}

// 获取当前用户资产信息（包括签到天数）
export const getCurrency = async () => {
  return request.get(`${API_BASE_URL}/me/currency`)
}

// 每日签到
export const checkIn = async () => {
  return request.post(`${API_BASE_URL}/me/checkin`)
}

// 获取本月所有签到日期
export const getCurrentMonthCheckInDates = async () => {
  return request.get(`${API_BASE_URL}/me/checkin/dates`)
}

// 结束专注
export const stopFocus = async () => {
  return request.post(`${API_BASE_URL}/focus/stop`)
}

