import request from './request'
import { API_BASE_URL } from './config'

// 搜索用户（通过用户名）
// 注意：后端可能没有专门的搜索API，这里先返回一个占位实现
// 实际使用时，如果后端有搜索接口，可以替换为真实的API调用
export const searchUser = async (username) => {
  // 暂时返回一个错误，提示用户直接输入用户名发送申请
  // 后续如果后端提供搜索接口，可以在这里实现
  return Promise.reject(new Error(`搜索功能暂未实现，请直接输入用户名"${username}"发送好友申请`))
}

// 发送好友申请
export const sendFriendRequest = async (data) => {
  return request.post(`${API_BASE_URL}/friends/requests`, data)
}

// 查看好友申请
export const getFriendRequests = async () => {
  return request.get(`${API_BASE_URL}/friends/requests`)
}

// 处理好友申请（接受/拒绝）
export const processFriendRequest = async (data) => {
  return request.put(`${API_BASE_URL}/friends/requests`, data)
}

// 获取好友列表
export const getFriends = async () => {
  return request.get(`${API_BASE_URL}/friends`)
}

// 删除好友
export const deleteFriend = async (data) => {
  return request.post(`${API_BASE_URL}/friends/delete`, data)
}

