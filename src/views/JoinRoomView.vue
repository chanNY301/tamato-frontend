<template>
  <div class="join-room-view">
    <div class="header">
      <h1>加入自习室</h1>
      <button @click="$router.back()" class="back-btn">返回首页</button>
    </div>
    <div class="content">
      <p>加入自习室功能正在开发中...</p>
      <!-- 这里之后可以添加加入自习室相关功能 -->
    </div>
  </div>
</template>

<script>
export default {
  name: 'JoinRoomView'
}
</script>

<style scoped>
.join-room-view {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
}

.back-btn {
  padding: 10px 20px;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}

.content {
  background: white;
  padding: 40px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  text-align: center;
}
</style>