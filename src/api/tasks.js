import request from './request'

const BASE_URL = 'https://m1.apifoxmock.com/m1/7239915-6966518-default'

// 获取当前用户的所有任务
export function getTasks() {
  return request.get(`${BASE_URL}/me/tasks`)
}

// 创建新任务
export function createTask(data) {
  return request.post(`${BASE_URL}/me/tasks`, data)
}

// 更新任务信息
export function updateTask(taskId, data) {
  return request.post(`${BASE_URL}/tasks/${taskId}`, data) // 或者 PUT，看你的mock配置
}

// 删除任务
export function deleteTask(taskId) {
  return request.post(`${BASE_URL}/tasks/${taskId}`, { // 或者 DELETE
    task_id: taskId
  })
}