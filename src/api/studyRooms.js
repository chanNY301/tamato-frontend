// api/studyRooms.js
import request from './request'
import { getToken } from './config'

const BASE_URL = 'http://localhost:8090/api'

// 获取自习室列表
export const getRoomsList = () => {
  return request.get(`${BASE_URL}/rooms`)
}

// 创建自习室
export const createRoom = (roomData) => {
  const token = getToken()
  const config = token ? {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  } : {}
  
  console.log('创建自习室请求配置:', config)
  return request.post(`${BASE_URL}/rooms`, roomData, config)
}

// 获取自习室详情
export const getRoomDetail = (roomId, userId) => {
  const token = getToken()
  const config = token ? {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  } : {}
  const url = userId ? `${BASE_URL}/rooms/${roomId}?userId=${userId}` : `${BASE_URL}/rooms/${roomId}`
  
  return request.get(url, config)
}

// 更新自习室信息
export const updateRoom = (roomId, roomData) => {
  const token = getToken()
  const config = token ? {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  } : {}
  
  return request.put(`${BASE_URL}/rooms/${roomId}`, roomData, config)
}

// 解散自习室
export const deleteRoom = (roomId, userId) => {
  const token = getToken()
  const config = token ? {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  } : {}
  const url = userId ? `${BASE_URL}/rooms/${roomId}?userId=${userId}` : `${BASE_URL}/rooms/${roomId}`
  
  return request.delete(url, null, config)
}

// 加入自习室
// studyRooms.js - 修改 joinRoom 函数
export const joinRoom = (roomId, userId) => {
  const token = getToken()
  const config = token ? {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  } : {}
  
  // ✅ 关键修改：将 userId 作为查询参数传递
  // 格式: /api/rooms/{roomId}/join?userId={userId}
  const url = `${BASE_URL}/rooms/${roomId}/join?userId=${userId}`
  
  console.log('加入房间请求URL:', url)
  console.log('请求配置:', config)
  
  // 发送空请求体，因为参数都在URL中
  return request.post(url, {}, config)
}

// api/studyRooms.js - 修改 leaveRoom 函数
export const leaveRoom = (roomId, userId) => {
  // ✅ 将 userId 作为查询参数传递
  // 格式: /api/rooms/{roomId}/leave?userId={userId}
  const url = `${BASE_URL}/rooms/${roomId}/leave?userId=${userId}`
  
  console.log('退出房间请求URL:', url)
  
  // request.post 会自动处理 Authorization header（通过 buildHeaders）
  // 发送空请求体
  return request.post(url, {}, {})
}

// 获取自习室成员列表
export const getRoomMembers = (roomId, userId) => {
  const token = getToken()
  const config = token ? {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  } : {}
  const url = userId ? `${BASE_URL}/rooms/${roomId}/members?userId=${userId}` : `${BASE_URL}/rooms/${roomId}/members`
  
  return request.get(url, config)
}

// 踢出成员
export const kickMember = (roomId, userId) => {
  const token = getToken()
  const config = token ? {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  } : {}
  
  return request.delete(`${BASE_URL}/rooms/${roomId}/members/${userId}`, config)
}

// 更新用户状态（专注/休息）
// 优先调用 /rooms/{roomId}/status，若后端未实现该路径则降级到 /rooms/status
export const updateUserStatus = async (roomId, statusData) => {
  const token = getToken()
  const config = token ? {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  } : {}

  const primaryUrl = `${BASE_URL}/rooms/${roomId}/status`
  const fallbackUrl = `${BASE_URL}/rooms/status`

  // 1) 优先 POST rooms/{roomId}/status
  const primaryRes = await request.post(primaryUrl, statusData, config)

  // request.post 不会在 4xx 时抛错，因此这里显式判断 404 再尝试备用接口
  if (primaryRes && (primaryRes.status === 404 || primaryRes.code === 404)) {
    console.warn('rooms/{roomId}/status 返回 404，尝试备用接口 /rooms/status')
    return request.post(fallbackUrl, { roomId, ...statusData }, config)
  }

  // 2) 若返回 405/500 且 message 提示不支持 POST，再尝试 PUT rooms/{roomId}/status
  const msg = primaryRes?.message || primaryRes?.error || ''
  if (primaryRes && (primaryRes.status === 405 || primaryRes.code === 405 || /not.*supported/i.test(msg))) {
    console.warn('rooms/{roomId}/status POST 不被支持，尝试 PUT')
    const putRes = await request.put(primaryUrl, statusData, config)
    if (putRes && (putRes.status === 404 || putRes.code === 404)) {
      console.warn('PUT rooms/{roomId}/status 返回 404，尝试备用接口 /rooms/status')
      return request.put(fallbackUrl, { roomId, ...statusData }, config)
    }
    return putRes
  }

  return primaryRes
}