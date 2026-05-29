<template>
  <div class="register-page">
    <div class="register-container">
      <div class="register-left">
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

      <div class="register-right">
        <div class="register-card">
          <div class="card-header">
            <h2 class="register-title">创建账号</h2>
            <p class="register-subtitle">加入宠伴，开启宠物生活</p>
          </div>

          <n-steps :current="currentStep" class="custom-steps">
            <n-step title="基本信息" description="填写您的账号信息" />
            <n-step title="设置密码" description="设置您的登录密码" />
          </n-steps>

          <div class="step-content">
            <n-form v-if="currentStep === 1" ref="formRefStep1" :model="formData" :rules="rulesStep1" label-placement="top" size="large">
              <n-form-item path="username">
                <n-input v-model:value="formData.username" placeholder="用户名" size="large" class="custom-input">
                  <template #prefix>
                    <span class="input-icon">👤</span>
                  </template>
                </n-input>
              </n-form-item>

              <n-form-item path="email">
                <n-input v-model:value="formData.email" placeholder="邮箱" size="large" class="custom-input">
                  <template #prefix>
                    <span class="input-icon">📧</span>
                  </template>
                </n-input>
              </n-form-item>

              <n-form-item path="phone">
                <n-input v-model:value="formData.phone" placeholder="手机号（选填）" size="large" class="custom-input">
                  <template #prefix>
                    <span class="input-icon">📱</span>
                  </template>
                </n-input>
              </n-form-item>

              <n-button type="primary" block strong size="large" @click="handleNextStep" class="primary-button">
                下一步
              </n-button>
            </n-form>

            <n-form v-if="currentStep === 2" ref="formRefStep2" :model="formData" :rules="rulesStep2" label-placement="top" size="large">
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

              <div class="password-strength" v-if="formData.password">
                <span class="strength-label">密码强度:</span>
                <div class="strength-bars">
                  <span
                    v-for="i in 4"
                    :key="i"
                    class="strength-bar"
                    :class="getStrengthClass(i)"
                  ></span>
                </div>
              </div>

              <n-form-item path="confirmPassword">
                <n-input
                  v-model:value="formData.confirmPassword"
                  type="password"
                  placeholder="确认密码"
                  show-password-on="click"
                  size="large"
                  class="custom-input"
                >
                  <template #prefix>
                    <span class="input-icon">✅</span>
                  </template>
                </n-input>
              </n-form-item>

              <div class="agree-section">
                <n-checkbox v-model:checked="formData.agree">
                  我已阅读并同意
                  <a href="#" class="link">《用户协议》</a>
                  和
                  <a href="#" class="link">《隐私政策》</a>
                </n-checkbox>
              </div>

              <div class="step-actions">
                <n-button size="large" @click="handlePrevStep" class="secondary-button">
                  上一步
                </n-button>
                <n-button type="primary" strong size="large" :loading="loading" @click="handleRegister" class="primary-button">
                  注册
                </n-button>
              </div>
            </n-form>
          </div>

          <div class="register-footer">
            <span>已有账号？</span>
            <router-link to="/login" class="login-link">立即登录</router-link>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useMessage } from 'naive-ui'
import { register } from '../../api/auth'

const router = useRouter()
const message = useMessage()
const formRefStep1 = ref(null)
const formRefStep2 = ref(null)
const loading = ref(false)
const currentStep = ref(1)

const formData = reactive({
  username: '',
  email: '',
  phone: '',
  password: '',
  confirmPassword: '',
  agree: false
})

const passwordStrength = computed(() => {
  const pwd = formData.password
  if (!pwd) return 0
  let score = 0
  if (pwd.length >= 6) score++
  if (pwd.length >= 10) score++
  if (/[A-Z]/.test(pwd) && /[a-z]/.test(pwd)) score++
  if (/[0-9]/.test(pwd)) score++
  if (/[^A-Za-z0-9]/.test(pwd)) score++
  return Math.min(4, score)
})

const rulesStep1 = {
  username: {
    required: true,
    trigger: ['blur', 'input'],
    message: '请输入用户名',
    validator(rule, value) {
      if (!value) return new Error('请输入用户名')
      if (value.length < 3) return new Error('用户名至少3个字符')
      return true
    }
  },
  email: {
    required: true,
    trigger: ['blur', 'input'],
    message: '请输入邮箱',
    validator(rule, value) {
      if (!value) return new Error('请输入邮箱')
      const emailReg = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailReg.test(value)) return new Error('请输入正确的邮箱格式')
      return true
    }
  }
}

const rulesStep2 = {
  password: {
    required: true,
    trigger: ['blur', 'input'],
    message: '请输入密码',
    validator(rule, value) {
      if (!value) return new Error('请输入密码')
      if (value.length < 6) return new Error('密码至少6个字符')
      const hasLetter = /[a-zA-Z]/.test(value)
      const hasNumber = /[0-9]/.test(value)
      if (!hasLetter || !hasNumber) return new Error('密码需要包含字母和数字')
      return true
    }
  },
  confirmPassword: {
    required: true,
    trigger: ['blur', 'input'],
    message: '请确认密码',
    validator(rule, value) {
      if (!value) return new Error('请确认密码')
      if (value !== formData.password) return new Error('两次密码输入不一致')
      return true
    }
  }
}

function getStrengthClass(index) {
  const strength = passwordStrength.value
  if (index <= strength) {
    if (strength <= 1) return 'weak'
    if (strength <= 2) return 'medium'
    if (strength <= 3) return 'strong'
    return 'very-strong'
  }
  return ''
}

async function handleNextStep() {
  try {
    await formRefStep1.value?.validate()
    currentStep.value = 2
  } catch {
    return
  }
}

function handlePrevStep() {
  currentStep.value = 1
}

async function handleRegister() {
  try {
    await formRefStep2.value?.validate()
  } catch {
    return
  }

  if (!formData.agree) {
    message.warning('请阅读并同意用户协议和隐私政策')
    return
  }

  loading.value = true
  try {
    const { confirmPassword, agree, phone, ...rest } = formData
    const registerData = { ...rest }
    if (phone && phone.trim()) registerData.phone = phone.trim()
    await register(registerData)
    message.success('注册成功，请登录')
    router.push('/login')
  } catch (error) {
    console.error('注册失败:', error)
    // API拦截器已处理错误信息，直接显示
    message.error(error.message || '注册失败，请稍后再试')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.register-page {
  min-height: 100vh;
  padding: 40px 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.register-container {
  display: flex;
  width: 900px;
  background: transparent;
  border-radius: 24px;
  box-shadow: 0 24px 72px rgba(0, 0, 0, 0.25);
  overflow: hidden;
}

.register-left {
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

.register-right {
  width: 480px;
  padding: 20px 48px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  max-height: 100vh;
  overflow-y: auto;
  background-color:#ffffff;

}

.register-card {
  width: 100%;
}

.card-header {
  margin-bottom: 24px;
}

.register-title {
  font-size: 32px;
  font-weight: 700;
  color: #1a1a2e;
  margin: 0 0 6px;
  letter-spacing: -0.5px;
}

.register-subtitle {
  font-size: 15px;
  color: #8b8b9c;
  margin: 0 0 20px 0;
}

.custom-steps {
  margin-bottom: 32px;
}

.step-content {
  margin-top: 24px;
  min-height: 300px;
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

.password-strength {
  margin-top: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.strength-label {
  font-size: 12px;
  color: #8b8b9c;
}

.strength-bars {
  display: flex;
  gap: 4px;
}

.strength-bar {
  width: 30px;
  height: 4px;
  background: #e8e8ef;
  border-radius: 2px;
  transition: background 0.3s;
}

.strength-bar.weak {
  background: #ff4d4f;
}

.strength-bar.medium {
  background: #faad14;
}

.strength-bar.strong {
  background: #52c41a;
}

.strength-bar.very-strong {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.agree-section {
  margin: 16px 0 24px;
}

.link {
  color: #667eea;
  text-decoration: none;
  font-weight: 500;
}

.link:hover {
  text-decoration: underline;
}

.step-actions {
  display: flex;
  gap: 16px;
  justify-content: flex-end;
}

.primary-button {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  border-radius: 14px;
  height: 52px;
  font-size: 16px;
  font-weight: 600;
  box-shadow: 0 4px 16px rgba(102, 126, 234, 0.35);
  transition: all 0.3s ease;
}

.primary-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.45);
}

.primary-button :deep(.n-button__content) {
  color: white;
}

.secondary-button {
  border-radius: 14px;
  height: 52px;
  font-weight: 500;
  background: #f7f8fa;
  border: none;
  color: #6b6b80;
}

.secondary-button:hover {
  background: #f0f2f5;
}

.register-footer {
  text-align: center;
  margin-top: 24px;
  font-size: 14px;
  color: #6b6b80;
}

.login-link {
  color: #667eea;
  text-decoration: none;
  font-weight: 600;
  margin-left: 4px;
  transition: opacity 0.2s;
}

.login-link:hover {
  opacity: 0.75;
}
</style>
