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
  return request.put(`${API_BASE_URL}/tasks/edit`, data)
}

// 删除任务
export function deleteTask(taskId, userId) {
  // 后端使用 /tasks/delete 端点，需要传递 DeleteTaskRequest
  return request.delete(`${API_BASE_URL}/tasks/delete`, {
    taskId: taskId,
    userId: userId
  })
}