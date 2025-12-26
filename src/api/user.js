import request from './request'
import { API_BASE_URL, getToken } from './config'

// 设置用户状态为离线（用于页面关闭时调用）
// 通过 userId 精确更新，避免多窗口/多账号互相影响
export const setUserOffline = (userId) => {
  if (!userId) {
    console.log('setUserOffline: userId 为空，跳过')
    return Promise.resolve({ success: true })
  }

  const url = `${API_BASE_URL}/users/${userId}/offline`
  const token = getToken()

  console.log('setUserOffline: 准备发送离线请求', { userId, url, hasToken: !!token })

  // 优先使用 navigator.sendBeacon（最可靠，专门为页面卸载设计）
  if (navigator.sendBeacon) {
    try {
      // sendBeacon 不能设置自定义 headers，所以我们需要在 URL 中传递 token
      // 或者使用 FormData（但后端需要支持）
      // 为了简单，我们使用 fetch with keepalive 作为主要方式
      // sendBeacon 作为备用
    } catch (e) {
      console.log('setUserOffline: sendBeacon 不可用', e)
    }
  }

  // 使用 fetch 的 keepalive 选项，确保请求在页面关闭后也能完成
  try {
    const headers = {
      'Content-Type': 'application/json'
    }
    
    // 如果有 token，添加到 headers（后端需要认证）
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    // 使用 fetch with keepalive（这是最可靠的方式）
    const fetchPromise = fetch(url, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify({}),
      keepalive: true // 关键：确保请求在页面关闭后也能完成
    })

    // 不等待响应，立即返回（避免阻塞页面关闭）
    fetchPromise.then(response => {
      console.log('setUserOffline: 请求发送成功', response.status, response.statusText)
      if (!response.ok) {
        console.warn('setUserOffline: 请求返回非成功状态', response.status)
      }
    }).catch((err) => {
      // 静默处理错误，避免阻塞页面关闭
      console.log('setUserOffline: 请求发送失败（页面可能已关闭）', err)
    })
    
    return Promise.resolve({ success: true })
  } catch (e) {
    // 如果 fetch 失败，静默处理
    console.log('setUserOffline: fetch 调用异常', e)
    return Promise.resolve({ success: true })
  }
}

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

// 补签功能
export const makeupCheckIn = async (date) => {
  // date格式: 'YYYY-MM-DD'
  return request.post(`${API_BASE_URL}/me/checkin/makeup?date=${encodeURIComponent(date)}`, null)
}

// 结束专注
export const stopFocus = async () => {
  return request.post(`${API_BASE_URL}/focus/stop`)
}

