<template>
  <div class="friends-list-container">
    <div class="friends-header">
      <h3>👥 好友列表</h3>
      <span class="online-count">在线 (3)</span>
    </div>

    <div class="friend-item" v-for="n in 5" :key="n">
      <div class="friend-avatar active"></div>
      <div class="friend-info">
        <div class="friend-name">好友 {{ n }}</div>
        <div class="friend-status">
          <span v-if="n % 2 === 0" class="status-dot online"></span>
          <span v-else class="status-dot busy"></span>
          {{ n % 2 === 0 ? '专注中' : '空闲' }}
        </div>
      </div>
      <button class="chat-btn">聊</button>
    </div>
    
    <div class="view-all">
        <a href="#">查看所有好友 »</a>
    </div>
  </div>
</template>

<script>
export default {
  name: 'FriendList',
  // 这里可以添加实际的好友数据和方法
}
</script>

<style scoped>
.friends-list-container {
  padding: 15px;
  background: white;
  border-radius: 10px;
  box-shadow: 0 2px 4px rgba(238, 170, 103, 0.1);
  border: 1px solid #ffe4cc;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.friends-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 10px;
  border-bottom: 1px solid #f0f0f0;
}

.friends-header h3 {
  margin: 0;
  color: #eeaa67;
}

.online-count {
  font-size: 0.9em;
  color: #666;
}

.friend-item {
  display: flex;
  align-items: center;
  padding: 8px 0;
  gap: 10px;
  border-radius: 6px;
  transition: background-color 0.2s;
}

.friend-item:hover {
  background-color: #fff5eb;
}

.friend-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: #ddd;
  border: 2px solid transparent;
}

.friend-info {
  flex-grow: 1;
}

.friend-name {
  font-weight: bold;
  color: #333;
}

.friend-status {
  font-size: 0.8em;
  color: #666;
  display: flex;
  align-items: center;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-right: 5px;
}

.online {
  background-color: #4CAF50; /* 绿色 */
}

.busy {
  background-color: #eeaa67; /* 橘黄色 */
}

.chat-btn {
  background-color: #eeaa67;
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 5px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.chat-btn:hover {
  background-color: #e69c55;
}

.view-all {
    text-align: center;
    padding-top: 10px;
    border-top: 1px solid #f0f0f0;
    font-size: 0.9em;
}

.view-all a {
    color: #eeaa67;
    text-decoration: none;
}
</style>