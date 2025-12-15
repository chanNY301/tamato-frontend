import request from './request'
import { API_BASE_URL } from './config'

// 获取当前用户的所有任务
export function getTasks(userId) {
  return request.get(`${API_BASE_URL}/me/tasks?userId=${userId}`)
}

// 创建新任务
export function createTask(data) {
  return request.post(`${API_BASE_URL}/tasks`, data)
}

// 更新任务信息
export function updateTask(taskId, data) {
  // 后端使用 /tasks/edit 端点
  // 确保 task_id 和 taskId 都包含在请求数据中（兼容不同的后端格式）
  const updateData = {
    ...data,
    task_id: taskId,
    taskId: taskId  // 同时发送两种格式，确保后端能识别
  }
  console.log('📤 updateTask 发送的完整数据:', JSON.stringify(updateData, null, 2))
  return request.put(`${API_BASE_URL}/tasks/edit`, updateData)
}

// 删除任务
export function deleteTask(taskId) {
  // 后端 DeleteTaskRequest 只需要 task_id，用户身份从 token 中解析
  const deleteBody = { task_id: taskId }
  console.log('📤 deleteTask 发送的请求体:', deleteBody)
  return request.delete(`${API_BASE_URL}/tasks/delete`, deleteBody)
}