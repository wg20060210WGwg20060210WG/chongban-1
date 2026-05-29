<script setup>
import { watch } from 'vue'
import { NMessageProvider, NDialogProvider, NNotificationProvider, NLoadingBarProvider, NConfigProvider } from 'naive-ui'
import { useAuthStore } from './stores/auth'
import { useNotificationStore } from './stores/notification'
import { connectSocket, disconnectSocket } from './utils/websocket'

const themeOverrides = {
  common: {
    primaryColor: '#10B981',
    primaryColorHover: '#34D399',
    primaryColorPressed: '#059669',
    primaryColorSuppl: '#34D399',
    successColor: '#10B981',
    successColorHover: '#34D399',
    successColorPressed: '#059669',
    borderRadius: '10px',
    borderRadiusSmall: '8px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
  },
  Button: {
    borderRadiusMedium: '10px',
    borderRadiusLarge: '12px'
  },
  Card: {
    borderRadius: '14px'
  },
  Input: {
    borderRadius: '10px'
  },
  Tag: {
    borderRadius: '10px'
  },
  Tabs: {
    tabBorderRadius: '10px'
  }
}

// 登录后连接 Socket.IO 并监听通知
const authStore = useAuthStore()
const notificationStore = useNotificationStore()

watch(() => authStore.isLoggedIn, (loggedIn) => {
  if (loggedIn) {
    connectSocket()
    notificationStore.fetchUnreadCount()
    notificationStore.initSocketListener()
  } else {
    disconnectSocket()
    notificationStore.clearNotifications()
  }
}, { immediate: true })
</script>

<template>
  <n-config-provider :theme-overrides="themeOverrides">
    <n-message-provider>
      <n-dialog-provider>
        <n-notification-provider>
          <n-loading-bar-provider>
            <router-view />
          </n-loading-bar-provider>
        </n-notification-provider>
      </n-dialog-provider>
    </n-message-provider>
  </n-config-provider>
</template>

<style>
</style>
