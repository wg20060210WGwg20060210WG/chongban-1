<template>
  <div class="notifications-page">
    <div class="page-header">
      <n-button quaternary @click="router.back()" class="back-btn">
        <template #icon>←</template>
        返回
      </n-button>
      <h1>通知</h1>
      <n-button
        v-if="notifications.length"
        quaternary
        size="small"
        :loading="markingAll"
        @click="handleMarkAllRead"
        class="mark-all-btn"
      >
        全部已读
      </n-button>
    </div>

    <div v-if="loading && !notifications.length" class="loading-state">
      <div class="loading-spinner"></div>
      <span>加载中...</span>
    </div>

    <div v-else-if="notifications.length" class="notification-list">
      <div
        v-for="n in notifications"
        :key="n._id"
        class="notification-item"
        :class="{ unread: !n.isRead }"
        @click="handleClick(n)"
      >
        <div class="noti-icon" :class="iconClass(n.type)">
          <svg v-if="n.type === 'like'" width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" fill="#ef4444" stroke="#ef4444" stroke-width="1.5"/></svg>
          <svg v-else-if="n.type === 'collect'" width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="#f59e0b" stroke="#f59e0b" stroke-width="1.5"/></svg>
          <svg v-else-if="n.type === 'comment'" width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" stroke="#3b82f6" stroke-width="1.5"/></svg>
          <svg v-else-if="n.type === 'follow'" width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" stroke="#10B981" stroke-width="1.5"/><circle cx="12" cy="7" r="4" stroke="#10B981" stroke-width="1.5"/></svg>
          <svg v-else-if="n.type === 'adoption'" width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4.5 9.5a2.5 2.5 0 115 0 2.5 2.5 0 01-5 0zm10 0a2.5 2.5 0 115 0 2.5 2.5 0 01-5 0zm-7.5 7c0-2.5 2-4.5 5-4.5s5 2 5 4.5" stroke="#d97706" stroke-width="1.5" stroke-linecap="round"/></svg>
          <svg v-else-if="n.type === 'order'" width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" stroke="#3b82f6" stroke-width="1.5"/></svg>
          <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" stroke="#8b5cf6" stroke-width="1.5"/><path d="M13.73 21a2 2 0 01-3.46 0" stroke="#8b5cf6" stroke-width="1.5"/></svg>
        </div>
        <div class="noti-body">
          <p class="noti-content">{{ n.content }}</p>
          <span class="noti-time">{{ formatTime(n.createdAt) }}</span>
        </div>
        <div v-if="!n.isRead" class="noti-dot"></div>
      </div>

      <div v-if="hasMore" class="load-more">
        <n-button quaternary :loading="loading" @click="loadMore">加载更多</n-button>
      </div>
    </div>

    <div v-else class="empty-state">
      <div class="empty-icon">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" stroke="var(--color-text-muted)" stroke-width="1.5"/><path d="M13.73 21a2 2 0 01-3.46 0" stroke="var(--color-text-muted)" stroke-width="1.5"/></svg>
        </div>
      <h3>暂无通知</h3>
      <p>有新消息时会在这里提醒你</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useNotificationStore } from '../../stores/notification'

const router = useRouter()
const notificationStore = useNotificationStore()
const { notifications, loading, hasMore } = storeToRefs(notificationStore)

const markingAll = ref(false)

function iconClass(type) {
  return `icon-${type || 'default'}`
}

function formatTime(d) {
  if (!d) return ''
  const diff = Date.now() - new Date(d).getTime()
  const m = Math.floor(diff / 60000)
  const h = Math.floor(diff / 3600000)
  const dy = Math.floor(diff / 86400000)
  if (m < 1) return '刚刚'
  if (m < 60) return `${m}分钟前`
  if (h < 24) return `${h}小时前`
  if (dy < 7) return `${dy}天前`
  const dt = new Date(d)
  return `${dt.getMonth() + 1}月${dt.getDate()}日`
}

function handleClick(n) {
  if (!n.isRead) notificationStore.markAsRead(n._id)
  if (n.targetType === 'post' && n.targetId) {
    router.push(`/community/${n.targetId}`)
  } else if (n.targetType === 'adoption' && n.targetId) {
    router.push(`/adoption/${n.targetId}`)
  } else if (n.relatedType === 'adoption' && n.relatedId) {
    router.push(`/adoption/${n.relatedId}`)
  }
}

async function handleMarkAllRead() {
  markingAll.value = true
  await notificationStore.markAllAsRead()
  markingAll.value = false
}

function loadMore() {
  notificationStore.loadMore()
}

onMounted(() => {
  notificationStore.fetchNotifications(1)
  notificationStore.fetchUnreadCount()
})

onUnmounted(() => {
  notificationStore.clearNotifications()
})
</script>

<style scoped>
.notifications-page {
  padding: 8px 0;
  max-width: 700px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 24px;
}

.page-header h1 {
  font-size: 24px;
  font-weight: 700;
  color: var(--color-text-primary);
  margin: 0;
  flex: 1;
}

.mark-all-btn {
  font-size: 13px;
  color: #10B981;
}

.notification-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.notification-item {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  padding: 16px;
  background: #fff;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all 0.25s;
  position: relative;
}

.notification-item:hover {
  background: rgba(16, 185, 129, 0.03);
}

.notification-item.unread {
  background: rgba(16, 185, 129, 0.06);
}

.notification-item + .notification-item {
  margin-top: 4px;
}

.noti-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  flex-shrink: 0;
  background: #f5f5f5;
}

.noti-icon.icon-like { background: rgba(239, 68, 68, 0.1); }
.noti-icon.icon-collect { background: rgba(245, 158, 11, 0.1); }
.noti-icon.icon-comment { background: rgba(59, 130, 246, 0.1); }
.noti-icon.icon-follow { background: rgba(16, 185, 129, 0.1); }
.noti-icon.icon-system { background: rgba(139, 92, 246, 0.1); }
.noti-icon.icon-adoption { background: rgba(245, 158, 11, 0.1); }
.noti-icon.icon-order { background: rgba(59, 130, 246, 0.1); }

.noti-body {
  flex: 1;
  min-width: 0;
}

.noti-content {
  font-size: 14px;
  color: var(--color-text-primary);
  margin: 0 0 6px;
  line-height: 1.5;
}

.noti-time {
  font-size: 12px;
  color: var(--color-text-muted);
}

.noti-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #10B981;
  flex-shrink: 0;
  margin-top: 6px;
}

.empty-state {
  text-align: center;
  padding: 80px 20px;
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 16px;
}

.empty-state h3 {
  font-size: 18px;
  color: var(--color-text-primary);
  margin: 0 0 8px;
}

.empty-state p {
  color: var(--color-text-muted);
  font-size: 14px;
  margin: 0;
}

.loading-state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 60px;
  color: var(--color-text-muted);
}

.loading-spinner {
  width: 20px;
  height: 20px;
  border: 2px solid #eee;
  border-top-color: #10B981;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.load-more {
  text-align: center;
  padding: 20px;
}
</style>