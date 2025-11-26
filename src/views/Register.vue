<template>
  <div class="register-page">
    <div class="register-container">
      <AuthForm
        :is-login="false"
        :loading="loading"
        :error="error"
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

      this.loading = true
      this.error = ''

      try {
        // 调用注册接口
        const response = await fetch('http://127.0.0.1:4523/m1/7239915-6966518-default/auth/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            username: this.formData.username,
            email: this.formData.email,
            password_hash: this.formData.password
          })
        })

        const result = await response.json()
        console.log('注册接口返回:', result) // 调试用，查看实际返回的code

        if (result.code === 200) {
          // 200注册成功
          this.error = '注册成功！正在跳转到登录页...'
          
          setTimeout(() => {
            this.$router.push('/login')
          }, 1000)
        } else {
          // 其他code都判定为失败
          this.error = '注册失败，请重试'
        }
      } catch (err) {
        this.error = '注册失败，请检查网络连接'
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