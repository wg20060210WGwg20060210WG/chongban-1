<template>
  <div class="login-page">
    <div class="login-container">
      <div class="login-left">
        <div class="welcome-content">
          <div class="logo-section">
            <n-avatar :size="80">
              <span style="font-size: 32px;">🐾</span>
            </n-avatar>
            <h1 class="app-name">宠伴</h1>
            <p class="app-slogan">宠物生活，有你陪伴</p>
          </div>
          <div class="decoration-dots">
            <span v-for="i in 3" :key="i" class="dot" :style="{ animationDelay: `${i * 0.5}s` }"></span>
          </div>
        </div>
      </div>

      <div class="login-right">
        <div class="login-card">
          <div class="card-header">
            <h2 class="login-title">欢迎回来</h2>
            <p class="login-subtitle">登录您的宠伴账号</p>
          </div>

          <n-form ref="formRef" :model="formData" :rules="rules" label-placement="top" size="large">
            <n-form-item path="account">
              <n-input
                v-model:value="formData.account"
                placeholder="用户名 / 邮箱 / 手机号"
                size="large"
                class="custom-input"
              >
                <template #prefix>
                  <span class="input-icon">👤</span>
                </template>
              </n-input>
            </n-form-item>
            <n-form-item path="password">
              <n-input
                v-model:value="formData.password"
                type="password"
                placeholder="密码"
                show-password-on="click"
                size="large"
                class="custom-input"
              >
                <template #prefix>
                  <span class="input-icon">🔒</span>
                </template>
              </n-input>
            </n-form-item>
            <div class="form-actions">
              <n-checkbox v-model:checked="rememberMe">记住我</n-checkbox>
              <a href="#" class="forgot-password">忘记密码？</a>
            </div>
            <n-button type="primary" block strong size="large" :loading="loading" @click="handleLogin" class="login-button">
              登录
            </n-button>
          </n-form>

          <div class="divider">
            <span>其他登录方式</span>
          </div>

          <div class="social-login">
            <div class="social-btn">
              <span style="font-size: 24px;">💬</span>
            </div>
            <div class="social-btn">
              <span style="font-size: 24px;">🐙</span>
            </div>
            <div class="social-btn">
              <span style="font-size: 24px;">🔍</span>
            </div>
          </div>

          <div class="login-footer">
            <span>还没有账号？</span>
            <router-link to="/register" class="register-link">立即注册</router-link>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/auth'
import { useMessage } from 'naive-ui'
import { login } from '../../api/auth'

const router = useRouter()
const authStore = useAuthStore()
const message = useMessage()

const formRef = ref(null)
const loading = ref(false)
const rememberMe = ref(false)

const formData = reactive({
  account: '',
  password: ''
})

const rules = {
  account: {
    required: true,
    trigger: ['blur', 'input'],
    message: '请输入用户名/邮箱/手机号'
  },
  password: {
    required: true,
    trigger: ['blur', 'input'],
    message: '请输入密码',
    validator(rule, value) {
      if (!value) {
        return new Error('请输入密码')
      }
      if (value.length < 6) {
        return new Error('密码长度不能少于6个字符')
      }
      return true
    }
  }
}

async function handleLogin() {
  try {
    await formRef.value?.validate()
  } catch {
    return
  }

  loading.value = true
  try {
    const res = await login(formData)
    authStore.setAuth(res.data.token, res.data.user)
    message.success('登录成功')
    router.push('/home')
  } catch (error) {
    console.error('登录失败:', error)
    // API拦截器已处理错误信息，直接显示
    message.error(error.message || '登录失败，请检查账号密码')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  padding: 40px 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.login-container {
  display: flex;
  width: 900px;
  min-height: 580px;
  background: transparent;
  border-radius: 24px;
  box-shadow: 0 24px 72px rgba(0, 0, 0, 0.25);
  overflow: hidden;
}

.login-left {
  flex: 1;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.welcome-content {
  text-align: center;
  color: #fff;
}

.logo-section {
  margin-bottom: 40px;
}

.app-name {
  font-size: 48px;
  font-weight: 700;
  margin: 20px 0 10px;
  letter-spacing: 4px;
}

.app-slogan {
  font-size: 16px;
  opacity: 0.9;
}

.decoration-dots {
  display: flex;
  justify-content: center;
  gap: 12px;
  margin-top: 40px;
}

.dot {
  width: 12px;
  height: 12px;
  background: rgba(255, 255, 255, 0.5);
  border-radius: 50%;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
    opacity: 0.5;
  }
  50% {
    transform: scale(1.3);
    opacity: 1;
  }
}

.login-right {
  width: 420px;
  padding: 20px 48px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  background-color:#ffffff;
}

.login-card {
  width: 100%;
}

.card-header {
  margin-bottom: 32px;
}

.login-title {
  font-size: 32px;
  font-weight: 700;
  color: #1a1a2e;
  margin: 0 0 6px;
  letter-spacing: -0.5px;
}

.login-subtitle {
  font-size: 15px;
  color: #8b8b9c;
  margin: 0;
}

.custom-input :deep(.n-input-wrapper) {
  background: #f7f8fa;
  border: 1px solid transparent;
  border-radius: 14px;
  transition: all 0.3s ease;
}

.custom-input :deep(.n-input-wrapper:hover) {
  background: #f0f2f5;
}

.custom-input :deep(.n-input--focused .n-input-wrapper) {
  background: #fff;
  border-color: #667eea;
  box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.1);
}

.input-icon {
  opacity: 0.5;
  filter: grayscale(100%);
  margin-right: 4px;
}

.form-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 8px 0 24px;
}

.forgot-password {
  color: #667eea;
  text-decoration: none;
  font-size: 14px;
  font-weight: 500;
  transition: opacity 0.2s;
}

.forgot-password:hover {
  opacity: 0.75;
}

.login-button {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  border-radius: 14px;
  height: 52px;
  font-size: 16px;
  font-weight: 600;
  box-shadow: 0 4px 16px rgba(102, 126, 234, 0.35);
  transition: all 0.3s ease;
}

.login-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.45);
}

.login-button :deep(.n-button__content) {
  color: white;
}

.divider {
  display: flex;
  align-items: center;
  margin: 36px 0 28px;
  color: #b5b5c7;
  font-size: 13px;
}

.divider::before,
.divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: #e8e8ef;
}

.divider span {
  padding: 0 16px;
}

.social-login {
  display: flex;
  justify-content: center;
  gap: 20px;
  margin-bottom: 28px;
}

.social-btn {
  width: 56px;
  height: 56px;
  border-radius: 16px;
  background: #f7f8fa;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
}

.social-btn:hover {
  background: #f0f2f5;
  transform: translateY(-2px);
}

.login-footer {
  text-align: center;
  font-size: 14px;
  color: #6b6b80;
}

.register-link {
  color: #667eea;
  text-decoration: none;
  font-weight: 600;
  margin-left: 4px;
  transition: opacity 0.2s;
}

.register-link:hover {
  opacity: 0.75;
}
</style>
