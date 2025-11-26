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

    async handleLogin() {
      if (!this.validateForm()) {
        return
      }

      this.loading = true
      this.error = ''

      try {
        // 调用本地 mock 接口
        const response = await fetch('http://127.0.0.1:4523/m1/7239915-6966518-default/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            username: this.formData.username,
            password: this.formData.password
          })
        })

        const result = await response.json()

        if (result.code === 200) {
          // 登录成功，跳转到首页
          console.log('登录成功，跳转中')
          setTimeout(() => {
            this.$router.push('/')
          }, 800)
        } else {
          this.error = '用户名或密码错误'
        }
      } catch (err) {
        this.error = '登录失败，请检查网络连接'
        console.error('登录请求失败:', err)
      } finally {
        this.loading = false
      }
    }
  },
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