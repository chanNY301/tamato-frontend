<template>
  <div class="register-page">
    <div class="register-container">
      <AuthForm
        :is-login="false"
        :loading="loading"
        :error="error"
        :success-message="successMessage"
        :logo="logoUrl"
        @submit="handleRegister"
        @toggle-mode="$router.push('/login')"
      >
        <template #form-fields>
          <FormInput
            v-model="formData.username"
            type="text"
            label="用户名"
            placeholder="请输入3-10位用户名"
            required
            :error="errors.username"
          />
          
          <FormInput
            v-model="formData.email"
            type="email"
            label="邮箱地址"
            placeholder="请输入您的邮箱"
            required
            :error="errors.email"
          />
          
          <FormInput
            v-model="formData.password"
            type="password"
            label="密码"
            placeholder="请输入6-15位密码"
            required
            :error="errors.password"
          />
          
          <FormInput
            v-model="formData.confirmPassword"
            type="password"
            label="确认密码"
            placeholder="请再次输入密码"
            required
            :error="errors.confirmPassword"
          />
        </template>
      </AuthForm>
    </div>
  </div>
</template>

<script>
import AuthForm from '@/components/Login/AuthForm.vue'
import FormInput from '@/components/Login/FormInput.vue'
import { register } from '@/api/auth'
import { getFriendlyErrorMessage } from '@/utils/errorMessages'

export default {
  name: 'RegisterView',
  components: {
    AuthForm,
    FormInput
  },
  data() {
    return {
      loading: false,
      error: '',
      successMessage: '',
      formData: {
        username: '',
        email: '',
        password: '',
        confirmPassword: ''
      },
      errors: {
        username: '',
        email: '',
        password: '',
        confirmPassword: ''
      },
      logoUrl: require('@/assets/logo.png')
    }
  },
  methods: {
    validateForm() {
      this.errors = {
        username: '',
        email: '',
        password: '',
        confirmPassword: ''
      }
      let isValid = true

      // 用户名验证 (3-10位)
      if (!this.formData.username) {
        this.errors.username = '请输入用户名'
        isValid = false
      } else if (this.formData.username.length < 3 || this.formData.username.length > 10) {
        this.errors.username = '用户名长度应为3-10位'
        isValid = false
      }

      // 邮箱验证
      if (!this.formData.email) {
        this.errors.email = '请输入邮箱地址'
        isValid = false
      } else if (!this.isValidEmail(this.formData.email)) {
        this.errors.email = '请输入有效的邮箱地址'
        isValid = false
      }

      // 密码验证 (6-15位)
      if (!this.formData.password) {
        this.errors.password = '请输入密码'
        isValid = false
      } else if (this.formData.password.length < 6 || this.formData.password.length > 15) {
        this.errors.password = '密码长度应为6-15位'
        isValid = false
      }

      // 确认密码验证
      if (!this.formData.confirmPassword) {
        this.errors.confirmPassword = '请确认密码'
        isValid = false
      } else if (this.formData.password !== this.formData.confirmPassword) {
        this.errors.confirmPassword = '两次输入的密码不一致'
        isValid = false
      }

      return isValid
    },

    isValidEmail(email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      return emailRegex.test(email)
    },

    async handleRegister() {
      if (!this.validateForm()) {
        return
      }

      // 防止重复提交
      if (this.loading) {
        return
      }

      this.loading = true
      this.error = ''
      this.successMessage = ''

      try {
        const result = await register(
          this.formData.username,
          this.formData.email,
          this.formData.password
        )

        // 清除之前的错误和成功消息
        this.error = ''
        this.successMessage = ''

        if (result && result.success) {
          // 注册成功，显示提示信息并跳转到登录页面
          this.successMessage = '注册成功！请使用您的账号登录'
          
          setTimeout(() => {
            // 跳转到登录页面，并传递注册成功的提示
            this.$router.push({
              path: '/login',
              query: { registered: 'true', username: this.formData.username }
            })
          }, 2000)
        } else {
          // 注册失败，使用友好的错误消息
          this.error = getFriendlyErrorMessage(result?.message || '注册失败，请重试', 'register')
        }
      } catch (err) {
        // 清除成功消息，只显示错误
        this.successMessage = ''
        
        // 检查错误响应中是否包含 result（可能是 JSON 格式的错误）
        if (err.result && err.result.success === false) {
          // 如果错误响应是 JSON 格式，使用其中的消息
          this.error = getFriendlyErrorMessage(err.result.message || err.message, 'register')
        } else if (err.isNetworkError) {
          this.error = '无法连接到服务器，请确保后端服务正在运行'
        } else if (err.message) {
          // 尝试从错误消息中提取 JSON（如果是 JSON 字符串）
          try {
            const errorObj = JSON.parse(err.message)
            if (errorObj.message) {
              this.error = getFriendlyErrorMessage(errorObj.message, 'register')
            } else {
              this.error = getFriendlyErrorMessage(err.message, 'register')
            }
          } catch (e) {
            // 不是 JSON 格式，直接使用错误消息
            this.error = getFriendlyErrorMessage(err.message, 'register')
          }
        } else {
          this.error = '注册失败，请检查网络连接后重试'
        }
        console.error('注册请求失败:', err)
      } finally {
        this.loading = false
      }
    }
  }
}
</script>

<style scoped>
.register-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #ffffff 0%, #ffd7b4 100%);
  padding: 1rem;
}

.register-container {
  width: 100%;
  max-width: 400px;
}
</style>