<template>
  <header class="app-header">
    <div class="header-container">
      <router-link to="/home" class="logo">
        <span>🐾 宠伴</span>
      </router-link>
      <nav class="nav-links">
        <router-link to="/home" class="nav-link">首页</router-link>
        <router-link to="/pets" class="nav-link">宠物</router-link>
        <router-link to="/community" class="nav-link">社区</router-link>
        <router-link to="/adoption" class="nav-link">领养</router-link>
        <router-link to="/secondhand" class="nav-link">二手</router-link>
        <router-link to="/services" class="nav-link">服务</router-link>
        <router-link to="/ai" class="nav-link">AI 健康</router-link>
      </nav>
      <div class="header-right">
        <template v-if="isLoggedIn">
          <n-badge :value="notificationStore.unreadCount" :dot="notificationStore.unreadCount > 0" class="notification-badge" @click="router.push('/notifications')">
            <n-button quaternary circle size="medium" @click="router.push('/notifications')">
              <span style="font-size: 20px;">🔔</span>
            </n-button>
          </n-badge>
          <n-dropdown trigger="click" :options="userMenuOptions" @select="handleMenuSelect">
            <div class="user-avatar-wrapper">
              <img v-if="userInfo?.avatar" :src="userAvatarUrl" class="user-avatar-img" />
              <span v-else class="user-avatar-text">{{ userInfo?.username?.[0]?.toUpperCase() || 'U' }}</span>
            </div>
          </n-dropdown>
        </template>
        <template v-else>
          <router-link to="/login" class="login-btn">登录</router-link>
          <router-link to="/register" class="register-btn">注册</router-link>
        </template>
      </div>
    </div>
  </header>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/auth'
import { useNotificationStore } from '../../stores/notification'
import { useMessage } from 'naive-ui'
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { resolveFileUrl, bustCache } from '../../utils/fileUrl'

const router = useRouter()
const message = useMessage()
const authStore = useAuthStore()
const notificationStore = useNotificationStore()

const { userInfo, isLoggedIn } = storeToRefs(authStore)
const { clearAuth } = authStore

const userAvatarUrl = computed(() => bustCache(resolveFileUrl(userInfo.value?.avatar)))

const userMenuOptions = computed(() => {
  const items = [
    { label: '个人中心', key: 'profile' },
    { label: '我的宠物', key: 'pets' },
    { label: '我的帖子', key: 'posts' },
    { type: 'divider', key: 'divider1' },
    { label: '设置', key: 'settings' }
  ]
  if (userInfo.value?.role === 'admin') {
    items.push({ type: 'divider', key: 'divider-admin' })
    items.push({ label: '管理后台', key: 'admin' })
  }
  items.push({ type: 'divider', key: 'divider2' })
  items.push({ label: '退出登录', key: 'logout' })
  return items
})

function handleMenuSelect(key) {
  if (key === 'logout') {
    clearAuth()
    message.success('已退出登录')
    router.push('/login')
  } else if (key === 'profile') {
    router.push('/profile')
  } else if (key === 'pets') {
    router.push('/pets')
  } else if (key === 'posts') {
    router.push('/my-posts')
  } else if (key === 'settings') {
    router.push('/settings')
  } else if (key === 'admin') {
    router.push('/admin')
  }
}
</script>

<style scoped>
.app-header {
  background: #fff;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  position: sticky;
  top: 0;
  z-index: 1000;
}

.header-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 20px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.logo {
  font-size: 22px;
  font-weight: 700;
  color: #10B981;
  text-decoration: none;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: opacity 0.3s;
}

.logo:hover {
  opacity: 0.8;
}

.nav-links {
  display: flex;
  gap: 32px;
}

.nav-link {
  color: #4a4a68;
  text-decoration: none;
  font-size: 15px;
  font-weight: 500;
  transition: color 0.3s;
  position: relative;
}

.nav-link:hover,
.nav-link.router-link-active {
  color: #10B981;
}

.nav-link.router-link-active::after {
  content: '';
  position: absolute;
  bottom: -8px;
  left: 50%;
  transform: translateX(-50%);
  width: 20px;
  height: 3px;
  background: linear-gradient(135deg, #10B981, #059669);
  border-radius: 2px;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.notification-badge {
  margin-right: 8px;
}

.user-avatar-wrapper {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #10B981;
}

.user-avatar-wrapper:hover {
  transform: scale(1.05);
}

.user-avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%;
  display: block;
}

.user-avatar-text {
  color: #fff;
  font-size: 16px;
  font-weight: 700;
  line-height: 1;
}

.login-btn,
.register-btn {
  padding: 8px 22px;
  border-radius: 20px;
  text-decoration: none;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s;
}

.login-btn {
  color: #4a4a68;
}

.login-btn:hover {
  color: #10B981;
  background: rgba(16, 185, 129, 0.08);
}

.register-btn {
  background: linear-gradient(135deg, #10B981, #059669);
  color: #fff;
  box-shadow: 0 4px 16px rgba(16, 185, 129, 0.35);
}

.register-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(16, 185, 129, 0.45);
}
</style>
