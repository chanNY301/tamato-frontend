import request from './request'
import { API_BASE_URL } from './config'

// 注意：由于后端context-path是/api，RoomController的路径是/api/rooms
// 所以完整路径是 /api/api/rooms，但根据实际配置，应该是 /api/rooms
// 如果后端路径有问题，需要调整后端Controller的RequestMapping
const BASE_URL = `${API_BASE_URL}/rooms`

// 获取自习室列表
export const getRoomsList = () => {
  return request.get(BASE_URL)
}

// 创建自习室
export const createRoom = (roomData) => {
  return request.post(BASE_URL, roomData)
}

// 获取自习室详情
export const getRoomDetail = (roomId) => {
  return request.get(`${BASE_URL}/${roomId}`)
}

// 更新自习室信息
export const updateRoom = (roomId, roomData) => {
  return request.put(`${BASE_URL}/${roomId}`, roomData)
}

// 解散自习室
export const deleteRoom = (roomId, userId) => {
  return request.delete(`${BASE_URL}/${roomId}?userId=${userId}`)
}

// 加入自习室
export const joinRoom = (roomId, userId) => {
  return request.post(`${BASE_URL}/${roomId}/join?userId=${userId}`)
}

// 离开自习室
export const leaveRoom = (roomId, userId) => {
  return request.post(`${BASE_URL}/${roomId}/leave?userId=${userId}`)
}

// 获取自习室成员列表
export const getRoomMembers = (roomId) => {
  return request.get(`${BASE_URL}/${roomId}/members`)
}

// 踢出成员
export const kickMember = (roomId, userId, creatorId) => {
  return request.delete(`${BASE_URL}/${roomId}/members/${userId}?creatorId=${creatorId}`)
}