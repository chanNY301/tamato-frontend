<template>
  <div class="user-settings-component">
    
    <div v-if="loading" class="status-indicator loading">
      <div class="spinner"></div>
      正在加载隐私设置...
    </div>
    <div v-else-if="error" class="status-indicator error">
      {{ error }}
      <button @click="fetchPrivacySettings" class="btn-retry">重试</button>
    </div>

    <div v-else class="settings-container">
      <div v-if="isSaving" class="status-indicator saving">
        <div class="spinner"></div>
        正在保存设置，请勿频繁操作...
      </div>
      
      <section class="privacy-settings-card">
        <h3>隐私设置</h3>
        <p class="description">管理谁可以查看您的个人信息以及您是否可被搜索。</p>
        
        <div class="settings-list">
          
          <div class="setting-item">
            <div class="setting-label">
              <span class="title">允许他人查看我的生日</span>
              <span class="subtitle">如果关闭，您的生日将只对您自己可见。</span>
            </div>
            <label class="toggle-switch">
              <input 
                type="checkbox" 
                v-model="settings.show_birthday" 
                @change="updateSetting('show_birthday')" 
                :disabled="isSaving" 
              />
              <span class="slider round"></span>
            </label>
          </div>

          <div class="setting-item">
            <div class="setting-label">
              <span class="title">允许他人查看我的邮箱</span>
              <span class="subtitle">您的邮箱是敏感信息，建议谨慎开启。</span>
            </div>
            <label class="toggle-switch">
              <input 
                type="checkbox" 
                v-model="settings.show_email" 
                @change="updateSetting('show_email')" 
                :disabled="isSaving" 
              />
              <span class="slider round"></span>
            </label>
          </div>

          <div class="setting-item">
            <div class="setting-label">
              <span class="title">允许他人查看我的手机号</span>
              <span class="subtitle">手机号仅用于紧急联系和验证。</span>
            </div>
            <label class="toggle-switch">
              <input 
                type="checkbox" 
                v-model="settings.show_phone" 
                @change="updateSetting('show_phone')" 
                :disabled="isSaving" 
              />
              <span class="slider round"></span>
            </label>
          </div>

          <div class="setting-item">
            <div class="setting-label">
              <span class="title">允许他人查看我的地区</span>
              <span class="subtitle">这有助于您的朋友找到您。</span>
            </div>
            <label class="toggle-switch">
              <input 
                type="checkbox" 
                v-model="settings.show_location" 
                @change="updateSetting('show_location')" 
                :disabled="isSaving" 
              />
              <span class="slider round"></span>
            </label>
          </div>

          <div class="setting-item">
            <div class="setting-label">
              <span class="title">允许被搜索</span>
              <span class="subtitle">允许其他用户通过您的用户名、邮箱或手机号搜索到您。</span>
            </div>
            <label class="toggle-switch">
              <input 
                type="checkbox" 
                v-model="settings.searchable" 
                @change="updateSetting('searchable')" 
                :disabled="isSaving" 
              />
              <span class="slider round"></span>
            </label>
          </div>

        </div>
      </section>
      
    </div>
  </div>
</template>

<script>
const BASE_URL = 'http://127.0.0.1:4523/m1/7239915-6966518-default';

export default {
  name: 'UserSettings',
  props: {
    userInfo: Object,
  },
  data() {
    return {
      loading: false,
      error: '',
      isSaving: false, 
      settings: {
        show_birthday: false,
        show_email: false,
        show_phone: false,
        show_location: false,
        searchable: false,
      },
    };
  },
  created() {
    this.fetchPrivacySettings();
  },
  methods: {
    // 获取隐私设置
    async fetchPrivacySettings() {
      if (this.isSaving) return;

      this.loading = true;
      this.error = '';

      try {
        const response = await fetch(`${BASE_URL}/me/privacy`);
        const result = await response.json();

        if (response.ok && result.code === 200 && result.data) {
          Object.keys(this.settings).forEach(key => {
            if (key in result.data) {
              this.settings[key] = result.data[key];
            }
          });
          this.error = ''; 
        } else {
          this.error = result.message || '获取隐私设置失败。';
          console.error('API Error:', result);
        }
      } catch (err) {
        this.error = '网络请求失败，请检查服务连接。';
        console.error('Fetch Error:', err);
      } finally {
        this.loading = false;
      }
    },
    
    // 更新单个隐私设置
    async updateSetting(key) {
      // 在 @change 触发时，v-model 已经更新了 settings[key]
      const oldValue = !this.settings[key]; 

      if (this.isSaving) {
        this.settings[key] = oldValue; // 回滚
        alert('正在进行其他保存操作，请稍候！'); 
        return;
      }

      this.isSaving = true;
      this.error = '';

      try {
        // PUT 请求需要发送整个 settings 对象
        const response = await fetch(`${BASE_URL}/me/privacy`, {
          method: 'PUT',
          headers: { 
            'Content-Type': 'application/json' 
          },
          body: JSON.stringify(this.settings)
        });

        const result = await response.json();

        if (response.ok && result.code === 200) {
          // 直接使用返回的 data 更新本地状态
          if (result.data) {
            Object.assign(this.settings, result.data);
          }
          console.log('隐私设置更新成功。');
        } else {
          // 更新失败：回滚本地更改，并显示错误
          this.error = `更新失败: ${result.message || '服务器错误'}`;
          this.settings[key] = oldValue; 
        }
      } catch (err) {
        this.error = '网络请求失败，请检查服务连接。'
        this.settings[key] = oldValue; 
        console.error('Update Error:', err);
      } finally {
        this.isSaving = false;
      }
    },
  },
};
</script>

<style scoped>
.user-settings-component {
  padding: 10px;
}

/* 状态指示样式 */
.status-indicator {
  padding: 15px;
  text-align: center;
  border-radius: 8px;
  font-weight: 500;
  margin: 15px 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.loading {
  color: #007bff;
  background-color: #e9f7ff;
}

.saving {
  color: #ffa500;
  background-color: #fff8e1;
  border: 1px solid #ffd700;
}

.error {
  color: #cc2a1f;
  background-color: #ffe0e0;
  border: 1px solid #cc2a1f;
}

.btn-retry {
  background: none;
  border: 1px solid #cc2a1f;
  color: #cc2a1f;
  margin-left: 10px;
  padding: 4px 10px;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.btn-retry:hover {
  background-color: #cc2a1f;
  color: white;
}

/* 加载动画 */
.spinner {
  display: inline-block;
  width: 12px;
  height: 12px;
  border: 2px solid rgba(0, 123, 255, 0.3);
  border-radius: 50%;
  border-top-color: currentColor; 
  animation: spin 1s linear infinite;
  margin-right: 8px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* 设置容器和卡片样式 */
.settings-container {
  max-width: 800px;
  margin: 0 auto;
}

.privacy-settings-card {
  background: #ffffff;
  padding: 30px 20px;
  border-radius: 12px;
}

.privacy-settings-card h3 {
  margin-top: 0;
  color: #333;
  font-size: 1.4em;
  border-bottom: 2px solid #f0f0f0;
  padding-bottom: 15px;
  margin-bottom: 20px;
}

.description {
  color: #666;
  font-size: 0.95em;
  margin-bottom: 30px;
}

/* 设置列表样式 */
.settings-list {
  display: flex;
  flex-direction: column;
  gap: 1px; 
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  overflow: hidden;
}

.setting-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  background-color: #fcfcfc;
  border-bottom: 1px solid #f0f0f0;
}

.setting-item:last-child {
  border-bottom: none;
}

.setting-label {
  display: flex;
  flex-direction: column;
  flex-grow: 1;
}

.setting-label .title {
  font-weight: 600;
  color: #333;
  margin-bottom: 4px;
}

.setting-label .subtitle {
  font-size: 0.85em;
  color: #888;
}

/* ------------------------------------- */
/* Toggle 开关样式 */
/* ------------------------------------- */
.toggle-switch {
  position: relative;
  display: inline-block;
  width: 50px;
  height: 28px;
  flex-shrink: 0;
}

.toggle-switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #ccc;
  transition: .4s;
}

.slider:before {
  position: absolute;
  content: "";
  height: 20px;
  width: 20px;
  left: 4px;
  bottom: 4px;
  background-color: white;
  transition: .4s;
}

/* 选中状态 */
input:checked + .slider {
  background-color: #cc2a1f; /* 使用主题红色 */
}

input:checked + .slider:before {
  transform: translateX(22px);
}

/* 禁用状态 */
input:disabled + .slider {
  opacity: 0.6;
  cursor: not-allowed;
}

/* 圆角 */
.slider.round {
  border-radius: 28px;
}

.slider.round:before {
  border-radius: 50%;
}
</style>