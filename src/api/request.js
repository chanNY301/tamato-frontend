// 使用 fetch 替代 axios
const request = {
  async post(url, data) {
    try {
      console.log('🚀 发送请求到:', url)
      console.log('📦 请求数据:', data)
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      })
      
      const result = await response.json()
      console.log('✅ 请求成功:', result)
      return result
      
    } catch (error) {
      console.error('❌ 请求失败:', error)
      throw error
    }
  },
  
  async get(url) {
    try {
      console.log('🚀 发送GET请求到:', url)
      const response = await fetch(url)
      const result = await response.json()
      console.log('✅ GET请求成功:', result)
      return result
    } catch (error) {
      console.error('❌ GET请求失败:', error)
      throw error
    }
  }
}

export default request