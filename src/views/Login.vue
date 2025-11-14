<template>
  <div class="login-container">
    <div class="login-box">
      <h2>{{ isLogin ? '登录' : '注册' }}</h2>
      <form @submit.prevent="handleSubmit">
        <div class="form-group">
          <input 
            type="text" 
            v-model="form.username" 
            placeholder="用户名" 
            required
          >
        </div>
        <div class="form-group">
          <input 
            type="password" 
            v-model="form.password" 
            placeholder="密码" 
            required
          >
        </div>
        <div v-if="!isLogin" class="form-group">
          <input 
            type="password" 
            v-model="form.confirmPassword" 
            placeholder="确认密码" 
            required
          >
        </div>
        <button type="submit" class="submit-btn">
          {{ isLogin ? '登录' : '注册' }}
        </button>
      </form>
      <p class="switch-mode">
        {{ isLogin ? '没有账号？' : '已有账号？' }}
        <span @click="toggleMode" class="switch-link">
          {{ isLogin ? '立即注册' : '立即登录' }}
        </span>
      </p>
    </div>
  </div>
</template>

<script>
export default {
  name: 'LoginView',
  data() {
    return {
      isLogin: true,
      form: {
        username: '',
        password: '',
        confirmPassword: ''
      }
    }
  },
  methods: {
    toggleMode() {
      this.isLogin = !this.isLogin
      this.form = {
        username: '',
        password: '',
        confirmPassword: ''
      }
    },
    handleSubmit() {
      if (this.isLogin) {
        // 登录逻辑
        console.log('登录:', this.form)
      } else {
        // 注册逻辑
        if (this.form.password !== this.form.confirmPassword) {
          alert('两次密码输入不一致')
          return
        }
        console.log('注册:', this.form)
      }
    }
  }
}
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.login-box {
  background: white;
  padding: 40px;
  border-radius: 10px;
  box-shadow: 0 10px 25px rgba(0,0,0,0.2);
  width: 100%;
  max-width: 400px;
}

h2 {
  text-align: center;
  margin-bottom: 30px;
  color: #333;
}

.form-group {
  margin-bottom: 20px;
}

input {
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 5px;
  font-size: 16px;
  box-sizing: border-box;
}

input:focus {
  outline: none;
  border-color: #667eea;
}

.submit-btn {
  width: 100%;
  padding: 12px;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 5px;
  font-size: 16px;
  cursor: pointer;
  transition: background 0.3s;
}

.submit-btn:hover {
  background: #5a6fd8;
}

.switch-mode {
  text-align: center;
  margin-top: 20px;
  color: #666;
}

.switch-link {
  color: #667eea;
  cursor: pointer;
  text-decoration: underline;
}

.switch-link:hover {
  color: #5a6fd8;
}
</style>