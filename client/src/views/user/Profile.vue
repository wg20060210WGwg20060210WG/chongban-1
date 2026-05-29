<template>
  <div class="profile-page">
    <!-- 英雄卡片 -->
    <div class="hero-card">
      <div class="hero-bg"></div>
      <div class="hero-content">
        <div class="avatar-wrapper" @click="triggerAvatarInput">
          <img v-if="userAvatarUrl" :src="userAvatarUrl" class="avatar-img" />
          <span v-else class="avatar-fallback">{{ avatarInitial }}</span>
          <div class="avatar-badge">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" stroke="#fff" stroke-width="2"/>
              <circle cx="12" cy="13" r="4" stroke="#fff" stroke-width="2"/>
            </svg>
          </div>
        </div>
        <input ref="avatarInputRef" type="file" accept="image/*" hidden @change="handleAvatarUpload" />

        <h1 class="hero-name">{{ userInfo?.username || '用户' }}</h1>
        <span class="hero-role">{{ roleLabel }}</span>
        <p class="hero-bio" v-if="userInfo?.bio">{{ userInfo.bio }}</p>

        <div class="stats-row">
          <div class="stat-item" @click="router.push('/my-posts')">
            <span class="stat-num">{{ userStats.postCount || 0 }}</span>
            <span class="stat-label">帖子</span>
          </div>
          <div class="stat-divider"></div>
          <div class="stat-item">
            <span class="stat-num">{{ userStats.followersCount || 0 }}</span>
            <span class="stat-label">粉丝</span>
          </div>
          <div class="stat-divider"></div>
          <div class="stat-item">
            <span class="stat-num">{{ userStats.followingCount || 0 }}</span>
            <span class="stat-label">关注</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 快捷入口 -->
    <div class="quick-grid">
      <div class="quick-item" @click="router.push('/my-posts')">
        <div class="quick-icon icon-green">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke="currentColor" stroke-width="1.8"/>
            <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
          </svg>
        </div>
        <span class="quick-label">我的帖子</span>
      </div>
      <div class="quick-item" @click="router.push('/my-collections')">
        <div class="quick-icon icon-amber">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>
          </svg>
        </div>
        <span class="quick-label">我的收藏</span>
      </div>
      <div class="quick-item" @click="router.push('/notifications')">
        <div class="quick-icon icon-blue">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M13.73 21a2 2 0 01-3.46 0" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
          </svg>
          <span v-if="unreadCount > 0" class="quick-badge">{{ unreadCount > 99 ? '99+' : unreadCount }}</span>
        </div>
        <span class="quick-label">通知中心</span>
      </div>
      <div class="quick-item" @click="router.push('/settings')">
        <div class="quick-icon icon-gray">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="1.8"/>
            <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" stroke="currentColor" stroke-width="1.8"/>
          </svg>
        </div>
        <span class="quick-label">设置</span>
      </div>
      <div class="quick-item" @click="router.push('/adoption/applications')">
        <div class="quick-icon icon-pink">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke="currentColor" stroke-width="1.8"/>
            <circle cx="8.5" cy="7" r="4" stroke="currentColor" stroke-width="1.8"/>
            <path d="M20 8v6M23 11h-6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
          </svg>
        </div>
        <span class="quick-label">我的申请</span>
      </div>
      <div class="quick-item" @click="router.push('/adoption/my')">
        <div class="quick-icon icon-teal">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" stroke="currentColor" stroke-width="1.8"/>
          </svg>
        </div>
        <span class="quick-label">我的领养</span>
      </div>
      <div class="quick-item" @click="router.push('/secondhand/my')">
        <div class="quick-icon icon-orange">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <rect x="2" y="7" width="20" height="14" rx="2" stroke="currentColor" stroke-width="1.8"/>
            <path d="M16 7V5a4 4 0 00-8 0v2" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
          </svg>
        </div>
        <span class="quick-label">我的商品</span>
      </div>
      <div class="quick-item" @click="router.push('/secondhand/orders')">
        <div class="quick-icon icon-indigo">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" stroke="currentColor" stroke-width="1.8"/>
            <line x1="3" y1="6" x2="21" y2="6" stroke="currentColor" stroke-width="1.8"/>
            <path d="M16 10a4 4 0 01-8 0" stroke="currentColor" stroke-width="1.8"/>
          </svg>
        </div>
        <span class="quick-label">二手订单</span>
      </div>
      <div class="quick-item" @click="router.push('/services/orders')">
        <div class="quick-icon icon-teal">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
            <rect x="9" y="3" width="6" height="4" rx="1" stroke="currentColor" stroke-width="1.8"/>
            <path d="M9 14l2 2 4-4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
        <span class="quick-label">服务订单</span>
      </div>
      <div class="quick-item" @click="router.push('/ai/consultation-history')">
        <div class="quick-icon icon-purple">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" stroke="currentColor" stroke-width="1.8"/>
            <path d="M8 12l3 3 5-5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
        <span class="quick-label">问诊历史</span>
      </div>
      <div class="quick-item" @click="router.push('/merchant')">
        <div class="quick-icon icon-green">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M3 12l9-9 9 9M5 10v10a1 1 0 001 1h3a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1h3a1 1 0 001-1V10" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
        <span class="quick-label">商家中心</span>
      </div>
      <div v-if="userInfo?.role === 'admin'" class="quick-item" @click="router.push('/admin')">
        <div class="quick-icon icon-red">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
        <span class="quick-label">管理后台</span>
      </div>
    </div>

    <!-- 功能列表 -->
    <div class="menu-card">
      <div class="menu-item" @click="router.push('/pets')">
        <div class="menu-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4.5 9.5a2.5 2.5 0 115 0 2.5 2.5 0 01-5 0zm10 0a2.5 2.5 0 115 0 2.5 2.5 0 01-5 0zm-7.5 7c0-2.5 2-4.5 5-4.5s5 2 5 4.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg></div>
        <span class="menu-label">我的宠物</span>
        <svg class="menu-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none">
          <path d="M9 18l6-6-6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>
      <div class="menu-item" @click="router.push('/pets/health-reminders')">
        <div class="menu-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M22 12h-4l-3 9L9 3l-3 9H2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg></div>
        <span class="menu-label">健康提醒</span>
        <svg class="menu-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none">
          <path d="M9 18l6-6-6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>
      <div class="menu-item" @click="router.push('/settings')">
        <div class="menu-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="1.5"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" stroke="currentColor" stroke-width="1.5"/></svg></div>
        <span class="menu-label">账号设置</span>
        <svg class="menu-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none">
          <path d="M9 18l6-6-6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useAuthStore } from '../../stores/auth'
import { useMessage } from 'naive-ui'
import { getProfile, uploadAvatar } from '../../api/user'
import { getUnreadCount } from '../../api/notification'
import { resolveFileUrl } from '../../utils/fileUrl'

const router = useRouter()
const message = useMessage()
const authStore = useAuthStore()
const { userInfo } = storeToRefs(authStore)

const avatarVersion = ref(0)
const avatarInputRef = ref(null)
const unreadCount = ref(0)
const userStats = ref({ postCount: 0, followersCount: 0, followingCount: 0 })

const userAvatarUrl = computed(() => {
  const url = resolveFileUrl(userInfo.value?.avatar)
  if (!url) return ''
  const sep = url.includes('?') ? '&' : '?'
  return `${url}${sep}v=${avatarVersion.value}`
})

const avatarInitial = computed(() => {
  const name = userInfo.value?.username || '用户'
  return name.charAt(0).toUpperCase()
})

const roleLabel = computed(() => {
  const map = { user: '普通用户', merchant: '服务商家', rescuer: '救助发起人', admin: '管理员' }
  return map[userInfo.value?.role] || '普通用户'
})

onMounted(async () => {
  try {
    const res = await getProfile()
    const user = res.data?.user || res.data
    if (user) {
      authStore.setUserInfo({ ...userInfo.value, ...user })
      userStats.value = {
        postCount: user.stats?.postCount || 0,
        followersCount: user.stats?.followersCount || 0,
        followingCount: user.stats?.followingCount || 0
      }
    }
  } catch {}

  try {
    const res = await getUnreadCount()
    unreadCount.value = res.data?.count ?? res.data ?? 0
  } catch {}
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
</script>

<style scoped>
.profile-page {
  padding: 0 0 40px;
  max-width: 600px;
  margin: 0 auto;
  animation: fade-in 0.4s ease;
}

@keyframes fade-in {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
}

/* 英雄卡片 */
.hero-card {
  position: relative;
  border-radius: 0 0 24px 24px;
  overflow: hidden;
  margin-bottom: 20px;
}

.hero-bg {
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, #10B981 0%, #059669 50%, #047857 100%);
  z-index: 0;
}

.hero-bg::after {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at 30% 20%, rgba(255,255,255,0.15) 0%, transparent 60%);
}

.hero-content {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 36px 24px 28px;
}

.avatar-wrapper {
  position: relative;
  cursor: pointer;
  width: 88px;
  height: 88px;
  border-radius: 50%;
  border: 3px solid rgba(255, 255, 255, 0.4);
  overflow: hidden;
  margin-bottom: 14px;
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
  font-size: 32px;
  font-weight: 700;
}

.avatar-badge {
  position: absolute;
  bottom: 2px;
  right: 2px;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid rgba(255, 255, 255, 0.3);
}

.hero-name {
  font-size: 22px;
  font-weight: 700;
  color: #fff;
  margin: 0 0 6px;
  text-shadow: 0 1px 4px rgba(0, 0, 0, 0.15);
}

.hero-role {
  display: inline-block;
  padding: 3px 14px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(8px);
  color: #fff;
  font-size: 12px;
  font-weight: 500;
  letter-spacing: 0.3px;
  margin-bottom: 10px;
}

.hero-bio {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.8);
  margin: 0 0 16px;
  text-align: center;
  max-width: 300px;
  line-height: 1.5;
}

.stats-row {
  display: flex;
  align-items: center;
  gap: 0;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  padding: 12px 28px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  cursor: pointer;
  padding: 0 16px;
}

.stat-num {
  font-size: 20px;
  font-weight: 700;
  color: #fff;
}

.stat-label {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.75);
}

.stat-divider {
  width: 1px;
  height: 28px;
  background: rgba(255, 255, 255, 0.2);
}

/* 快捷入口 */
.quick-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  padding: 0 16px;
  margin-bottom: 20px;
}

.quick-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 16px 8px;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.quick-item:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.08);
}

.quick-icon {
  position: relative;
  width: 44px;
  height: 44px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.icon-green { background: rgba(16, 185, 129, 0.1); color: #10B981; }
.icon-amber { background: rgba(245, 158, 11, 0.1); color: #f59e0b; }
.icon-blue { background: rgba(59, 130, 246, 0.1); color: #3b82f6; }
.icon-gray { background: rgba(107, 114, 128, 0.1); color: #6b7280; }
.icon-pink { background: rgba(236, 72, 153, 0.1); color: #ec4899; }
.icon-teal { background: rgba(20, 184, 166, 0.1); color: #14b8a6; }
.icon-orange { background: rgba(249, 115, 22, 0.1); color: #f97316; }
.icon-indigo { background: rgba(99, 102, 241, 0.1); color: #6366f1; }
.icon-purple { background: rgba(139, 92, 246, 0.1); color: #8b5cf6; }
.icon-red { background: rgba(239, 68, 68, 0.1); color: #ef4444; }

.quick-badge {
  position: absolute;
  top: -4px;
  right: -4px;
  min-width: 18px;
  height: 18px;
  border-radius: 9px;
  background: #ef4444;
  color: #fff;
  font-size: 10px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 5px;
  border: 2px solid #fff;
}

.quick-label {
  font-size: 12px;
  color: var(--color-text-secondary);
  font-weight: 500;
}

/* 功能列表 */
.menu-card {
  background: #fff;
  border-radius: 16px;
  margin: 0 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
  overflow: hidden;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px 20px;
  cursor: pointer;
  transition: background 0.2s;
}

.menu-item:not(:last-child) {
  border-bottom: 1px solid rgba(0, 0, 0, 0.04);
}

.menu-item:hover {
  background: rgba(16, 185, 129, 0.03);
}

.menu-icon {
  font-size: 20px;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  background: #f8f9fa;
}

.menu-label {
  flex: 1;
  font-size: 15px;
  font-weight: 500;
  color: var(--color-text-primary);
}

.menu-arrow {
  color: #ccc;
  transition: transform 0.2s;
}

.menu-item:hover .menu-arrow {
  transform: translateX(3px);
  color: #10B981;
}

@media (max-width: 420px) {
  .quick-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .stats-row {
    padding: 10px 16px;
  }

  .stat-item {
    padding: 0 12px;
  }
}
</style>