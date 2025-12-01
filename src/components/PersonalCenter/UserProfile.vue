<template>
  <div class="user-profile-component">
    <div class="profile-header">
      <div class="header-left">
        <div 
          :class="['avatar-wrapper', { 'is-editing': isEditing }]" 
          @click="isEditing ? changeAvatar() : null"
        >
          <img :src="userInfo.avatar" alt="头像" class="avatar-img" />
          <div v-if="isEditing" class="avatar-edit-mask">
            点击更换
          </div>
        </div>
        
        <div v-if="!isEditing" class="header-info">
          <div class="header-name">{{ userInfo.username }}</div>
          <div class="header-id">ID: {{ userInfo.userId }}</div>
        </div>
      </div>

      <div class="header-right">
        <div class="tomato-stat">
          <img src="@/assets/logo.png" alt="番茄" class="tomato-icon" />
          <span class="tomato-count">{{ userInfo.tomatoCount }}</span>
        </div>

        <div class="action-buttons">
          <button 
            v-if="!isEditing" 
            class="btn-primary" 
            @click="startEdit"
          >
            修改资料
          </button>
          <div v-else class="edit-actions">
            <div v-if="overallError" class="overall-error">{{ overallError }}</div>
            
            <button class="btn-save" @click="saveEdit" :disabled="isSaving">
              {{ isSaving ? '保存中...' : '保存' }}
            </button>
            <button class="btn-cancel" @click="cancelEdit" :disabled="isSaving">取消</button>
          </div>
        </div>
      </div>
    </div>

    <hr class="divider" />

    <div class="profile-details">
      <div class="detail-item">
        <label>用户名</label>
        <div v-if="!isEditing" class="read-only-text">{{ userInfo.username }}</div>
        <div v-else>
          <input v-model="editForm.username" type="text" class="form-input" />
          <div v-if="editErrors.username" class="error-message">{{ editErrors.username }}</div>
        </div>
      </div>

      <div class="detail-item">
        <label>邮箱</label>
        <div v-if="!isEditing" class="read-only-text">{{ userInfo.email }}</div>
        <div v-else>
          <input v-model="editForm.email" type="email" class="form-input" />
          <div v-if="editErrors.email" class="error-message">{{ editErrors.email }}</div>
        </div>
      </div>
      
      <div class="detail-item">
        <label>手机号</label>
        <div v-if="!isEditing" class="read-only-text">{{ userInfo.phone }}</div>
        <input v-else v-model="editForm.phone" type="tel" class="form-input" />
      </div>

      <div class="detail-item">
        <label>性别</label>
        <div v-if="!isEditing" class="read-only-text">{{ userInfo.gender }}</div>
        <select v-else v-model="editForm.gender" class="form-input">
          <option value="男">男</option>
          <option value="女">女</option>
          <option value="保密">保密</option>
        </select>
      </div>

      <div class="detail-item">
        <label>生日</label>
        <div v-if="!isEditing" class="read-only-text">{{ userInfo.birthday }}</div>
        <input v-else v-model="editForm.birthday" type="date" class="form-input" />
      </div>

      <div class="detail-item">
        <label>地区</label>
        <div v-if="!isEditing" class="read-only-text">{{ userInfo.region }}</div>
        <input v-else v-model="editForm.region" type="text" class="form-input" placeholder="例如：上海市" />
      </div>

    </div>
  </div>
</template>

<script>
const BASE_URL = 'http://127.0.0.1:4523/m1/7239915-6966518-default';

export default {
  name: 'UserProfile',
  props: {
    userInfo: {
      type: Object,
      required: true,
      default: () => ({
        userId: 'N/A', 
        username: 'N/A',
        avatar: '',
        gender: '保密',
        birthday: '',
        region: '',
        phone: '',
        email: '',
        tomatoCount: 0, 
        password_hash: '', 
      })
    },
  },
  data() {
    return {
      isEditing: false, 
      isSaving: false,
      overallError: '',
      editErrors: {
        username: '',
        email: ''
      },
      editForm: {}
    }
  },
  methods: {
    isValidEmail(email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      return emailRegex.test(email)
    },

    validateForm() {
      this.editErrors = { username: '', email: '' }
      this.overallError = ''
      let isValid = true
      
      const { username, email } = this.editForm

      // 1. 用户名验证 (3-10位)
      if (!username) {
        this.editErrors.username = '请输入用户名'
        isValid = false
      } else if (username.length < 3 || username.length > 10) {
        this.editErrors.username = '用户名长度应为3-10位'
        isValid = false
      }

      // 2. 邮箱验证
      if (!email) {
        this.editErrors.email = '请输入邮箱地址'
        isValid = false
      } else if (!this.isValidEmail(email)) {
        this.editErrors.email = '请输入有效的邮箱地址'
        isValid = false
      }

      if (!isValid) {
        this.overallError = '请检查并修正表单中的错误。'
      }

      return isValid
    },
    
    changeAvatar() {
      alert('点击了更换头像。在实际应用中，这里会打开文件上传窗口。');
    },

    startEdit() {
      // 从 prop 复制数据到编辑表单
      this.editForm = JSON.parse(JSON.stringify(this.userInfo))
      this.editErrors = { username: '', email: '' }
      this.overallError = ''
      this.isEditing = true
    },
    
    cancelEdit() {
      this.isEditing = false
      this.editForm = {}
      this.editErrors = { username: '', email: '' }
      this.overallError = ''
    },
    
    async saveEdit() {
      if (!this.validateForm()) {
        return
      }

      this.isSaving = true
      this.overallError = '正在保存...'
      
      try {
        // 构造 PUT 请求体，需将字段名转回 API 期望的格式
        const updatePayload = {
          user_id: Number(this.userInfo.userId),
          username: this.editForm.username,
          status: '在线', 
          email: this.editForm.email,
          phone: this.editForm.phone,
          sex: this.editForm.gender, 
          // birthday 需要转换回 YYYYMMDD 数字格式
          birthday: this.editForm.birthday ? Number(this.editForm.birthday.replace(/-/g, '')) : 0, 
          password_hash: this.userInfo.password_hash || 'placeholder', 
          tomato: this.userInfo.tomatoCount, 
          province: this.editForm.region
        };
        
        // 调用更新 API (PUT /me)
        const updateResponse = await fetch(`${BASE_URL}/me`, {
          method: 'PUT',
          headers: { 
            'Content-Type': 'application/json' 
          },
          body: JSON.stringify(updatePayload)
        });

        const result = await updateResponse.json();

        if (result.code == 200) {
          // 200 判定更新成功
          // 触发事件，**不传递数据**，通知父组件重新 GET 最新数据
          this.$emit('update-user-info'); 
          
          this.isEditing = false;
          this.overallError = '';
          alert('个人资料已更新成功！');
        } else {
          // 其他 code 或无 code 字段判定为失败
          this.overallError = `资料保存失败: ${result.messege || '服务器错误'}`;
        }
      } catch (error) {
        this.overallError = '网络请求失败，请检查服务连接。'
        console.error('Save Error:', error);
      } finally {
        this.isSaving = false;
      }
    }
  }
}
</script>

<style scoped>
.user-profile-component {
  padding: 10px;
}

/* 顶部布局 */
.error-message {
  color: #cc2a1f; /* 红色 */
  font-size: 0.85em;
  margin-top: 4px;
}

.overall-error {
  color: #cc2a1f;
  background-color: #ffe0e0;
  border: 1px solid #cc2a1f;
  padding: 8px 12px;
  border-radius: 6px;
  margin-bottom: 10px;
  text-align: left;
}

/* 按钮样式和布局 */
.action-buttons {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.edit-actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 100%;
}

.profile-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 20px;
  /* 确保在编辑模式下，左侧布局不会因为 header-info 隐藏而塌陷 */
  min-height: 80px; 
}

/* 头像区域：新增样式 */
.avatar-wrapper {
  position: relative;
  width: 80px;
  height: 80px;
  flex-shrink: 0; 
}

.avatar-wrapper.is-editing {
  cursor: pointer;
}

.avatar-img {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid #f0f0f0;
  display: block;
}

/* 遮罩：在编辑模式下立即显示半透明灰色底，文本更明显 */
.avatar-edit-mask {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  /* 半透明灰色底 */
  background: rgba(0, 0, 0, 0.5); 
  color: white;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 0.85em; 
  opacity: 1; /* 确保在 v-if 存在时立即显示 */
  transition: background 0.2s;
  text-align: center;
  line-height: 1.2;
}

/* 优化 hover 效果 */
.avatar-wrapper.is-editing:hover .avatar-edit-mask {
  background: rgba(0, 0, 0, 0.65); 
}

/* 用户名和ID区域的样式 (仅在非编辑模式下显示) */
.header-name {
  font-size: 1.4em;
  font-weight: bold;
  color: #333;
}

.header-id {
  color: #888;
  font-size: 0.9em;
  margin-top: 4px;
}


.header-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 15px;
}

/* 番茄统计样式 */
.tomato-stat {
  display: flex;
  align-items: center;
  gap: 8px;
  background-color: #fff0f0; /* 淡淡的红色背景 */
  padding: 8px 16px;
  border-radius: 20px;
  border: 1px solid #ffcccc;
}

.tomato-icon {
  width: 24px;
  height: 24px;
  object-fit: contain;
}

.tomato-count {
  font-weight: bold;
  color: #cc2a1f;
  font-size: 1.1em;
}

/* 按钮样式 */
.action-buttons {
  display: flex;
  gap: 10px;
}

button {
  cursor: pointer;
  border: none;
  border-radius: 6px;
  padding: 8px 20px;
  font-size: 0.95em;
  transition: all 0.3s;
}

.btn-primary {
  background: #cc2a1f;
  color: white;
}
.btn-primary:hover {
  background: #b52217;
}

.btn-save {
  background: #4caf50;
  color: white;
}

.btn-save:hover {
  background: #43a047;
}
/* 禁用按钮样式 */
button:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.btn-cancel {
  background: #f5f5f5;
  color: #666;
  border: 1px solid #ddd;
}
.btn-cancel:hover {
  background: #e0e0e0;
}

.divider {
  border: none;
  border-top: 1px solid #f0f0f0;
  margin: 20px 0 30px 0;
}

/* 详细资料网格布局 */
.profile-details {
  display: grid;
  grid-template-columns: repeat(2, 1fr); /* 两列显示 */
  gap: 30px 50px;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.detail-item label {
  color: #888;
  font-size: 0.9em;
}

.read-only-text {
  padding: 8px 0;
  font-size: 1.05em;
  color: #333;
  border-bottom: 1px solid transparent;
  min-height: 40px;
  display: flex;
  align-items: center;
}

.form-input {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 1em;
  height: 40px;
  outline: none;
  transition: border-color 0.2s;
}

.form-input:focus {
  border-color: #cc2a1f;
}

/* 响应式 */
@media (max-width: 600px) {
  .profile-details {
    grid-template-columns: 1fr; /* 小屏幕变单列 */
    gap: 20px;
  }
  
  .profile-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 20px;
  }
  
  .header-right {
    align-items: flex-start;
    width: 100%;
    flex-direction: row;
    justify-content: space-between;
  }
}
</style>