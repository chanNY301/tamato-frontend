import request from './request'

// 修正 BASE_URL - 去掉 /me/tasks
const BASE_URL = 'http://127.0.0.1:4523/m1/7239915-6966518-default'

// 获取当前用户的所有任务
export function getTasks() {
  // 根据你的 Apifox 接口：GET /me/tasks
  return request.get(`${BASE_URL}/me/tasks`)
}

// 创建新任务
export function createTask(data) {
  // 根据你的 Apifox 接口：POST /tasks
  return request.post(`${BASE_URL}/tasks`, data)
}

// 更新任务信息
export function updateTask(taskId, data) {
  // 根据你的 Apifox 接口：PUT /tasks/(taskid)
  // 注意：Apifox 显示是 PUT 方法
  return request.put(`${BASE_URL}/tasks/${taskId}`, data)
}

// 删除任务
export function deleteTask(taskId) {
  // 根据你的 Apifox 接口：DELETE /tasks/(taskid)
  // 注意：删除不需要 body 参数，taskid 通过路径传递
  return request.delete(`${BASE_URL}/tasks/${taskId}`)
}