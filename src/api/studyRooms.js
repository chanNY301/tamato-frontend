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
export const getRoomDetail = (roomId) => {
  const token = getToken()
  const config = token ? {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  } : {}
  
  return request.get(`${BASE_URL}/rooms/${roomId}`, config)
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
export const deleteRoom = (roomId) => {
  const token = getToken()
  const config = token ? {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  } : {}
  
  return request.delete(`${BASE_URL}/rooms/${roomId}`, config)
}

// 加入自习室
export const joinRoom = (roomId) => {
  const token = getToken()
  const config = token ? {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  } : {}
  
  return request.post(`${BASE_URL}/rooms/${roomId}/join`, {}, config)
}

// 离开自习室
export const leaveRoom = (roomId) => {
  const token = getToken()
  const config = token ? {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  } : {}
  
  return request.post(`${BASE_URL}/rooms/${roomId}/leave`, {}, config)
}

// 获取自习室成员列表
export const getRoomMembers = (roomId) => {
  const token = getToken()
  const config = token ? {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  } : {}
  
  return request.get(`${BASE_URL}/rooms/${roomId}/members`, config)
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
export const updateUserStatus = (roomId, statusData) => {
  const token = getToken()
  const config = token ? {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  } : {}
  
  return request.post(`${BASE_URL}/rooms/${roomId}/status`, statusData, config)
}