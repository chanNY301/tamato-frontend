<template>
  <div class="login-page">
    <div class="login-container">
      <AuthForm
        :is-login="true"
        :loading="loading"
        :error="error"
        :logo="logoUrl"
        @submit="handleLogin"
        @toggle-mode="$router.push('/register')"
      >
        <template #form-fields>
          <FormInput
            v-model="formData.username"
            type="text"
            label="用户名"
            placeholder="请输入您的用户名"
            required
            :error="errors.username"
          />
          
          <FormInput
            v-model="formData.password"
            type="password"
            label="密码"
            placeholder="请输入您的密码"
            required
            :error="errors.password"
          />
        </template>
      </AuthForm>
    </div>
  </div>
</template>

<script>
import AuthForm from '@/components/Login/AuthForm.vue'
import FormInput from '@/components/Login/FormInput.vue'

export default {
  name: 'LoginView',
  components: {
    AuthForm,
    FormInput
  },
  data() {
    return {
      loading: false,
      error: '',
      formData: {
        username: '',
        password: ''
      },
      errors: {
        username: '',
        password: ''
      },
      logoUrl: require('@/assets/logo.png')
    }
  },
  methods: {
    validateForm() {
      this.errors = {
        username: '',
        password: ''
      }
      let isValid = true

      if (!this.formData.username) {
        this.errors.username = '请输入用户名'
        isValid = false
      }

      if (!this.formData.password) {
        this.errors.password = '请输入密码'
        isValid = false
      }

      return isValid
    },

    async handleLogin(formOptions) {
      if (!this.validateForm()) {
        return
      }

      this.loading = true
      this.error = ''

      try {
        // 模拟登录API调用
        await this.mockLoginAPI(this.formData)
        
        // 登录成功处理
        this.$router.push('/dashboard')
        
        // 如果需要记住我，保存到localStorage
        if (formOptions.rememberMe) {
          localStorage.setItem('rememberMe', 'true')
          localStorage.setItem('username', this.formData.username)
        }
      } catch (err) {
        this.error = err.message || '登录失败，请重试'
      } finally {
        this.loading = false
      }
    },

    mockLoginAPI(credentials) {
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          // 模拟验证逻辑
          const users = JSON.parse(localStorage.getItem('users') || '[]')
          const user = users.find(u => 
            u.username === credentials.username && 
            u.password === credentials.password
          )
          
          if (user) {
            resolve({ success: true, user })
          } else {
            reject(new Error('用户名或密码错误'))
          }
        }, 1500)
      })
    }
  },
  mounted() {
    // 检查是否有保存的用户名
    if (localStorage.getItem('rememberMe') === 'true') {
      const savedUsername = localStorage.getItem('username')
      if (savedUsername) {
        this.formData.username = savedUsername
      }
    }
  }
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #eeaa67 0%, #ffd7b4 100%);
  padding: 1rem;
}

.login-container {
  width: 100%;
  max-width: 400px;
}
</style>