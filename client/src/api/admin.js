import request from './index'

// 获取用户列表
export const getUsers = (params) => request.get('/admin/users', { params })

// 封禁/解封用户
export const banUser = (userId, data) => request.put(`/admin/users/${userId}/ban`, data)

// 审核帖子
export const reviewPost = (postId, data) => request.put(`/admin/posts/${postId}/review`, data)

// 获取举报列表
export const getReports = (params) => request.get('/admin/reports', { params })

// 获取统计数据
export const getStatistics = () => request.get('/admin/statistics')