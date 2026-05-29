import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getNotifications, getUnreadCount, markAllRead, markRead } from '../api/notification'
import { onSocket, offSocket } from '../utils/websocket'

export const useNotificationStore = defineStore('notification', () => {
  const notifications = ref([])
  const unreadCount = ref(0)
  const loading = ref(false)
  const pagination = ref({ page: 1, pageSize: 20, total: 0, totalPages: 0 })
  const hasMore = ref(true)
  let socketListenerInited = false

  async function fetchNotifications(page = 1) {
    if (loading.value) return
    loading.value = true
    try {
      const res = await getNotifications({ page, pageSize: pagination.value.pageSize })
      const data = res.data
      if (page === 1) {
        notifications.value = data.list || []
      } else {
        notifications.value.push(...(data.list || []))
      }
      if (data.pagination) {
        pagination.value = data.pagination
        hasMore.value = data.pagination.page < data.pagination.totalPages
      }
    } catch (e) {
      console.error('获取通知失败:', e)
    } finally {
      loading.value = false
    }
  }

  async function fetchUnreadCount() {
    try {
      const res = await getUnreadCount()
      unreadCount.value = res.data?.count ?? res.data ?? 0
    } catch {}
  }

  async function markAllAsRead() {
    try {
      await markAllRead()
      unreadCount.value = 0
      notifications.value.forEach((n) => { n.isRead = true })
    } catch (e) {
      console.error('标记全部已读失败:', e)
    }
  }

  async function markAsRead(id) {
    try {
      await markRead(id)
      const n = notifications.value.find((x) => x._id === id)
      if (n && !n.isRead) {
        n.isRead = true
        unreadCount.value = Math.max(0, unreadCount.value - 1)
      }
    } catch (e) {
      console.error('标记已读失败:', e)
    }
  }

  function loadMore() {
    if (!hasMore.value || loading.value) return
    fetchNotifications(pagination.value.page + 1)
  }

  function clearNotifications() {
    notifications.value = []
    pagination.value = { page: 1, pageSize: 20, total: 0, totalPages: 0 }
    hasMore.value = true
    socketListenerInited = false
  }

  function initSocketListener() {
    if (socketListenerInited) return
    socketListenerInited = true
    onSocket('notification', (data) => {
      unreadCount.value++
      notifications.value.unshift(data)
    })
  }

  return {
    notifications,
    unreadCount,
    loading,
    pagination,
    hasMore,
    fetchNotifications,
    fetchUnreadCount,
    markAllAsRead,
    markAsRead,
    loadMore,
    clearNotifications,
    initSocketListener
  }
})