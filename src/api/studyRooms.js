import request from './request'

const BASE_URL = 'http://127.0.0.1:4523/m1/7239915-6966518-default'

// 获取自习室列表
export const getRoomsList = () => {
  return request.get(`${BASE_URL}/rooms`)
}

// 创建自习室
export const createRoom = (roomData) => {
  return request.post(`${BASE_URL}/rooms`, roomData)
}

// 获取自习室详情
export const getRoomDetail = (roomId) => {
  return request.get(`${BASE_URL}/rooms/${roomId}`)
}

// 更新自习室信息
export const updateRoom = (roomId, roomData) => {
  return request.put(`${BASE_URL}/rooms/${roomId}`, roomData)
}

// 解散自习室
export const deleteRoom = (roomId) => {
  return request.delete(`${BASE_URL}/rooms/${roomId}`)
}

// 加入自习室
export const joinRoom = (roomId) => {
  return request.post(`${BASE_URL}/rooms/${roomId}/join`)
}

// 离开自习室
export const leaveRoom = (roomId) => {
  return request.post(`${BASE_URL}/rooms/${roomId}/leave`)
}

// 获取自习室成员列表
export const getRoomMembers = (roomId) => {
  return request.get(`${BASE_URL}/rooms/${roomId}/members`)
}

// 踢出成员
export const kickMember = (roomId, userId) => {
  return request.delete(`${BASE_URL}/rooms/${roomId}/members/${userId}`)
}