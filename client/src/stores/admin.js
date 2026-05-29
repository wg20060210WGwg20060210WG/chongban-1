import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getUsers, banUser, reviewPost, getReports, getStatistics } from '../api/admin'

export const useAdminStore = defineStore('admin', () => {
  const users = ref([])
  const usersLoading = ref(false)
  const usersPagination = ref({ page: 1, pageSize: 20, total: 0, totalPages: 0 })

  const reports = ref([])
  const reportsLoading = ref(false)
  const reportsPagination = ref({ page: 1, pageSize: 20, total: 0, totalPages: 0 })

  const statistics = ref(null)
  const statsLoading = ref(false)

  // 用户管理
  async function fetchUsers(params = {}) {
    if (usersLoading.value) return
    usersLoading.value = true
    try {
      const res = await getUsers({ page: usersPagination.value.page, pageSize: usersPagination.value.pageSize, ...params })
      const data = res.data
      users.value = data.list || []
      if (data.pagination) {
        usersPagination.value = data.pagination
      }
    } catch (e) {
      console.error('获取用户列表失败:', e)
      throw e
    } finally {
      usersLoading.value = false
    }
  }

  async function toggleBanUser(userId, data = {}) {
    try {
      const res = await banUser(userId, data)
      const user = users.value.find(u => u._id === userId)
      if (user) {
        user.status = res.data.status
        user.bannedUntil = res.data.bannedUntil
      }
      return res
    } catch (e) {
      console.error('操作失败:', e)
      throw e
    }
  }

  // 举报管理
  async function fetchReports(params = {}) {
    if (reportsLoading.value) return
    reportsLoading.value = true
    try {
      const res = await getReports({ page: reportsPagination.value.page, pageSize: reportsPagination.value.pageSize, ...params })
      const data = res.data
      reports.value = data.list || []
      if (data.pagination) {
        reportsPagination.value = data.pagination
      }
    } catch (e) {
      console.error('获取举报列表失败:', e)
      throw e
    } finally {
      reportsLoading.value = false
    }
  }

  async function handleReviewPost(postId, status, reason = '') {
    try {
      const res = await reviewPost(postId, { status, reason })
      reports.value = reports.value.filter(p => p._id !== postId)
      return res
    } catch (e) {
      console.error('审核失败:', e)
      throw e
    }
  }

  // 统计数据
  async function fetchStatistics() {
    if (statsLoading.value) return
    statsLoading.value = true
    try {
      const res = await getStatistics()
      statistics.value = res.data
      return res.data
    } catch (e) {
      console.error('获取统计数据失败:', e)
      throw e
    } finally {
      statsLoading.value = false
    }
  }

  function resetUsers() {
    users.value = []
    usersPagination.value = { page: 1, pageSize: 20, total: 0, totalPages: 0 }
  }

  function resetReports() {
    reports.value = []
    reportsPagination.value = { page: 1, pageSize: 20, total: 0, totalPages: 0 }
  }

  return {
    users, usersLoading, usersPagination, fetchUsers, toggleBanUser, resetUsers,
    reports, reportsLoading, reportsPagination, fetchReports, handleReviewPost, resetReports,
    statistics, statsLoading, fetchStatistics
  }
})