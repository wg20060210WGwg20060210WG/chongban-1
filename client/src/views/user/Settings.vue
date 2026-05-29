<template>
  <div class="settings-page">
    <div class="page-header">
      <button class="back-btn" @click="router.back()">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path d="M15 18l-6-6 6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
      <h1>设置</h1>
    </div>

    <div class="settings-layout">
      <!-- 头像区域 -->
      <div class="avatar-card">
        <div class="avatar-wrapper" @click="triggerAvatarInput">
          <img v-if="userAvatarUrl" :src="userAvatarUrl" class="avatar-img" />
          <span v-else class="avatar-fallback">{{ avatarInitial }}</span>
          <div class="avatar-overlay">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" stroke="#fff" stroke-width="2"/>
              <circle cx="12" cy="13" r="4" stroke="#fff" stroke-width="2"/>
            </svg>
          </div>
        </div>
        <input ref="avatarInputRef" type="file" accept="image/*" hidden @change="handleAvatarUpload" />
        <div class="avatar-info">
          <h3>{{ profileForm.username || '用户' }}</h3>
          <p>点击更换头像</p>
        </div>
      </div>

      <!-- 个人资料 -->
      <div class="settings-card">
        <div class="card-title">
          <div class="title-icon icon-green">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" stroke="currentColor" stroke-width="1.8"/>
              <circle cx="12" cy="7" r="4" stroke="currentColor" stroke-width="1.8"/>
            </svg>
          </div>
          <h3>个人资料</h3>
        </div>
        <n-form ref="profileFormRef" :model="profileForm" :rules="profileRules" label-placement="left" label-width="70">
          <n-form-item label="用户名" path="username">
            <n-input v-model:value="profileForm.username" placeholder="请输入用户名">
              <template #prefix>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" stroke="#bbb" stroke-width="1.5"/><circle cx="12" cy="7" r="4" stroke="#bbb" stroke-width="1.5"/></svg>
              </template>
            </n-input>
          </n-form-item>
          <n-form-item label="邮箱" path="email">
            <n-input v-model:value="profileForm.email" placeholder="请输入邮箱">
              <template #prefix>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" stroke="#bbb" stroke-width="1.5"/><path d="M22 6l-10 7L2 6" stroke="#bbb" stroke-width="1.5"/></svg>
              </template>
            </n-input>
          </n-form-item>
          <n-form-item label="手机号" path="phone">
            <n-input v-model:value="profileForm.phone" placeholder="请输入手机号">
              <template #prefix>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><rect x="5" y="2" width="14" height="20" rx="2" stroke="#bbb" stroke-width="1.5"/><path d="M12 18h.01" stroke="#bbb" stroke-width="2" stroke-linecap="round"/></svg>
              </template>
            </n-input>
          </n-form-item>
          <n-form-item label="昵称" path="nickname">
            <n-input v-model:value="profileForm.nickname" placeholder="请输入昵称">
              <template #prefix>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="#bbb" stroke-width="1.5"/><path d="M8 14s1.5 2 4 2 4-2 4-2" stroke="#bbb" stroke-width="1.5" stroke-linecap="round"/><circle cx="9" cy="9.5" r="1" fill="#bbb"/><circle cx="15" cy="9.5" r="1" fill="#bbb"/></svg>
              </template>
            </n-input>
          </n-form-item>
          <n-form-item label="个人简介" path="bio">
            <n-input v-model:value="profileForm.bio" type="textarea" placeholder="介绍一下自己" :rows="3" />
          </n-form-item>
          <n-form-item label="城市" path="city">
            <n-input v-model:value="profileForm.city" placeholder="所在城市">
              <template #prefix>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" stroke="#bbb" stroke-width="1.5"/><circle cx="12" cy="10" r="3" stroke="#bbb" stroke-width="1.5"/></svg>
              </template>
            </n-input>
          </n-form-item>
          <n-form-item label="详细地址" path="address">
            <n-input v-model:value="profileForm.address" placeholder="详细地址" />
          </n-form-item>
        </n-form>
        <div class="form-actions">
          <n-button type="primary" strong :loading="profileSaving" @click="handleSaveProfile" round>
            保存资料
          </n-button>
        </div>
      </div>

      <!-- 修改密码 -->
      <div class="settings-card">
        <div class="card-title">
          <div class="title-icon icon-amber">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="11" width="18" height="11" rx="2" stroke="currentColor" stroke-width="1.8"/>
              <path d="M7 11V7a5 5 0 0110 0v4" stroke="currentColor" stroke-width="1.8"/>
            </svg>
          </div>
          <h3>修改密码</h3>
        </div>
        <n-form ref="pwdFormRef" :model="pwdForm" :rules="pwdRules" label-placement="left" label-width="90">
          <n-form-item label="当前密码" path="currentPassword">
            <n-input v-model:value="pwdForm.currentPassword" type="password" show-password-on="click" placeholder="请输入当前密码">
              <template #prefix>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><rect x="3" y="11" width="18" height="11" rx="2" stroke="#bbb" stroke-width="1.5"/><path d="M7 11V7a5 5 0 0110 0v4" stroke="#bbb" stroke-width="1.5"/></svg>
              </template>
            </n-input>
          </n-form-item>
          <n-form-item label="新密码" path="newPassword">
            <n-input v-model:value="pwdForm.newPassword" type="password" show-password-on="click" placeholder="至少6位，含字母和数字">
              <template #prefix>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 2L2 7l10 5 10-5-10-5z" stroke="#bbb" stroke-width="1.5"/><path d="M2 17l10 5 10-5" stroke="#bbb" stroke-width="1.5"/><path d="M2 12l10 5 10-5" stroke="#bbb" stroke-width="1.5"/></svg>
              </template>
            </n-input>
          </n-form-item>
          <n-form-item label="确认密码" path="confirmPassword">
            <n-input v-model:value="pwdForm.confirmPassword" type="password" show-password-on="click" placeholder="再次输入新密码">
              <template #prefix>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="#bbb" stroke-width="1.5"/></svg>
              </template>
            </n-input>
          </n-form-item>
        </n-form>
        <div class="form-actions">
          <n-button type="warning" strong :loading="pwdSaving" @click="showPwdConfirm = true" round>
            修改密码
          </n-button>
        </div>
      </div>

      <!-- 退出登录 -->
      <div class="settings-card danger-card">
        <div class="danger-row">
          <div class="danger-info">
            <div class="title-icon icon-red">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" stroke="currentColor" stroke-width="1.8"/>
                <polyline points="16 17 21 12 16 7" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
                <line x1="21" y1="12" x2="9" y2="12" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
              </svg>
            </div>
            <div>
              <p class="danger-label">退出登录</p>
              <p class="danger-desc">退出当前账号，返回登录页</p>
            </div>
          </div>
          <n-button type="error" strong @click="showLogoutConfirm = true" round>退出</n-button>
        </div>
      </div>
    </div>

    <!-- 修改密码确认 -->
    <n-modal v-model:show="showPwdConfirm" preset="dialog" title="确认修改密码" positive-text="确认修改" negative-text="取消" @positive-click="handleChangePassword">
      修改密码后需要重新登录，确定继续吗？
    </n-modal>

    <!-- 退出登录确认 -->
    <n-modal v-model:show="showLogoutConfirm" preset="dialog" title="确认退出" positive-text="退出" negative-text="取消" @positive-click="handleLogout">
      确定要退出当前账号吗？
    </n-modal>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useAuthStore } from '../../stores/auth'
import { useMessage } from 'naive-ui'
import { getProfile, updateProfile, changePassword, uploadAvatar } from '../../api/user'
import { resolveFileUrl } from '../../utils/fileUrl'

const router = useRouter()
const message = useMessage()
const authStore = useAuthStore()
const { userInfo } = storeToRefs(authStore)

const profileFormRef = ref(null)
const pwdFormRef = ref(null)
const avatarInputRef = ref(null)
const profileSaving = ref(false)
const pwdSaving = ref(false)
const showPwdConfirm = ref(false)
const showLogoutConfirm = ref(false)
const avatarVersion = ref(0)

const userAvatarUrl = computed(() => {
  const url = resolveFileUrl(userInfo.value?.avatar)
  if (!url) return ''
  const sep = url.includes('?') ? '&' : '?'
  return `${url}${sep}v=${avatarVersion.value}`
})

const avatarInitial = computed(() => {
  const name = userInfo.value?.username || profileForm.username || '用户'
  return name.charAt(0).toUpperCase()
})

const profileForm = reactive({
  username: '', email: '', phone: '', nickname: '', bio: '', city: '', address: ''
})

const profileRules = {
  username: { required: true, message: '请输入用户名', trigger: 'blur' },
  email: { type: 'email', message: '请输入有效邮箱', trigger: 'blur' }
}

const pwdForm = reactive({ currentPassword: '', newPassword: '', confirmPassword: '' })

const pwdRules = {
  currentPassword: { required: true, message: '请输入当前密码', trigger: 'blur' },
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, message: '密码至少6位', trigger: 'blur' },
    { pattern: /^(?=.*[A-Za-z])(?=.*\d)/, message: '需包含字母和数字', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请确认新密码', trigger: 'blur' },
    { validator: (rule, value) => value === pwdForm.newPassword, message: '两次密码不一致', trigger: 'blur' }
  ]
}

onMounted(async () => {
  try {
    const res = await getProfile()
    const user = res.data?.user || res.data
    Object.assign(profileForm, {
      username: user.username || '', email: user.email || '', phone: user.phone || '',
      nickname: user.nickname || '', bio: user.bio || '', city: user.city || '', address: user.address || ''
    })
  } catch {
    profileForm.username = userInfo.value?.username || ''
    profileForm.email = userInfo.value?.email || ''
    profileForm.phone = userInfo.value?.phone || ''
  }
})

function triggerAvatarInput() {
  avatarInputRef.value?.click()
}

async function handleAvatarUpload(event) {
  const file = event.target.files?.[0]
  if (!file) return
  if (!file.type.startsWith('image/')) { message.error('请选择图片文件'); return }
  if (file.size > 5 * 1024 * 1024) { message.error('图片不能超过5MB'); return }

  const fd = new FormData()
  fd.append('avatar', file)
  try {
    const res = await uploadAvatar(fd)
    const user = res.data?.user || res.data
    if (user?.avatar) {
      authStore.setUserInfo({ ...userInfo.value, avatar: user.avatar })
      avatarVersion.value++
      message.success('头像更新成功')
    }
  } catch {
    message.error('头像上传失败')
  }
  event.target.value = ''
}

async function handleSaveProfile() {
  try { await profileFormRef.value?.validate() } catch { return }
  profileSaving.value = true
  try {
    const res = await updateProfile({
      username: profileForm.username, email: profileForm.email, phone: profileForm.phone,
      nickname: profileForm.nickname, bio: profileForm.bio, city: profileForm.city, address: profileForm.address
    })
    const user = res.data?.user || res.data
    if (user) authStore.setUserInfo({ ...userInfo.value, ...user })
    message.success('资料保存成功')
  } catch (e) {
    message.error(e.message || '保存失败')
  } finally {
    profileSaving.value = false
  }
}

async function handleChangePassword() {
  try { await pwdFormRef.value?.validate() } catch { return showPwdConfirm.value = false }
  showPwdConfirm.value = false
  pwdSaving.value = true
  try {
    await changePassword({ currentPassword: pwdForm.currentPassword, newPassword: pwdForm.newPassword })
    message.success('密码修改成功，请重新登录')
    pwdForm.currentPassword = ''; pwdForm.newPassword = ''; pwdForm.confirmPassword = ''
    authStore.clearAuth()
    router.push('/login')
  } catch (e) {
    message.error(e.message || '密码修改失败')
  } finally {
    pwdSaving.value = false
  }
}

function handleLogout() {
  showLogoutConfirm.value = false
  authStore.clearAuth()
  router.push('/login')
}
</script>

<style scoped>
.settings-page {
  padding: 0 0 40px;
  max-width: 680px;
  margin: 0 auto;
  animation: fade-in 0.4s ease;
}

@keyframes fade-in {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
}

.page-header {
  display: flex;
  align-items: center;
  padding: 16px;
  gap: 12px;
  position: sticky;
  top: 0;
  z-index: 10;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(16px);
  border-bottom: 1px solid rgba(0, 0, 0, 0.04);
}

.back-btn {
  width: 36px;
  height: 36px;
  border-radius: 12px;
  border: none;
  background: #f5f5f5;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #555;
  transition: all 0.2s;
}

.back-btn:hover {
  background: #eee;
  color: #10B981;
}

.page-header h1 {
  flex: 1;
  font-size: 18px;
  font-weight: 700;
  color: var(--color-text-primary);
  margin: 0;
}

.settings-layout {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 8px 16px;
}

/* 头像卡片 */
.avatar-card {
  display: flex;
  align-items: center;
  gap: 16px;
  background: linear-gradient(135deg, #10B981 0%, #059669 100%);
  border-radius: 18px;
  padding: 20px 24px;
  box-shadow: 0 4px 16px rgba(16, 185, 129, 0.25);
}

.avatar-wrapper {
  position: relative;
  width: 64px;
  height: 64px;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.4);
  overflow: hidden;
  cursor: pointer;
  flex-shrink: 0;
  transition: transform 0.3s;
}

.avatar-wrapper:hover {
  transform: scale(1.05);
}

.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.avatar-fallback {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.2);
  color: #fff;
  font-size: 26px;
  font-weight: 700;
}

.avatar-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.2s;
}

.avatar-wrapper:hover .avatar-overlay {
  opacity: 1;
}

.avatar-info h3 {
  font-size: 18px;
  font-weight: 700;
  color: #fff;
  margin: 0 0 4px;
}

.avatar-info p {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.75);
  margin: 0;
}

/* 设置卡片 */
.settings-card {
  background: #fff;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
}

.card-title {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 18px;
}

.card-title h3 {
  font-size: 16px;
  font-weight: 600;
  color: var(--color-text-primary);
  margin: 0;
}

.title-icon {
  width: 32px;
  height: 32px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.icon-green { background: rgba(16, 185, 129, 0.1); color: #10B981; }
.icon-amber { background: rgba(245, 158, 11, 0.1); color: #f59e0b; }
.icon-red { background: rgba(239, 68, 68, 0.1); color: #ef4444; }

.form-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
  padding-top: 14px;
  border-top: 1px solid rgba(0, 0, 0, 0.04);
}

/* 退出登录 */
.danger-card {
  border: 1px solid rgba(239, 68, 68, 0.1);
}

.danger-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.danger-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.danger-label {
  font-size: 15px;
  font-weight: 600;
  color: var(--color-text-primary);
  margin: 0 0 2px;
}

.danger-desc {
  font-size: 13px;
  color: var(--color-text-muted);
  margin: 0;
}

/* 移动端吸底保存按钮 */
@media (max-width: 768px) {
  .settings-layout {
    padding-bottom: 80px;
  }

  .settings-card .form-actions {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(16px);
    padding: 12px 16px;
    margin: 0;
    border-top: 1px solid rgba(0, 0, 0, 0.06);
    z-index: 20;
    justify-content: center;
  }
}
</style>