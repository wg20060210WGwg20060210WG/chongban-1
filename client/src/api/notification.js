import request from './index'

export const getNotifications = (params = {}) => {
  return request.get('/notifications', { params })
}

export const getUnreadCount = () => {
  return request.get('/notifications/unread-count')
}

export const markAllRead = () => {
  return request.put('/notifications/read-all')
}

export const markRead = (notificationId) => {
  return request.put(`/notifications/${notificationId}/read`)
}