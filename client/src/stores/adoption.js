import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  getAdoptions,
  getAdoptionDetail,
  createAdoption,
  getMyAdoptions,
  updateAdoption,
  deleteAdoption,
  applyAdoption,
  getMyApplications,
  getAdoptionApplications,
  reviewApplication,
  cancelApplication,
  addFollowUp
} from '../api/adoption'

export const useAdoptionStore = defineStore('adoption', () => {
  const adoptionList = ref([])
  const currentAdoption = ref(null)
  const myAdoptions = ref([])
  const myApplications = ref([])
  const adoptionApplications = ref([])
  const loading = ref(false)
  const error = ref(null)

  const pagination = ref({
    page: 1,
    pageSize: 10,
    total: 0,
    totalPages: 0
  })

  const filters = ref({
    species: '',
    city: '',
    keyword: '',
    status: 'pending',
    sort: 'latest'
  })

  const hasMore = computed(() => pagination.value.page < pagination.value.totalPages)

  async function fetchAdoptions(append = false) {
    loading.value = true
    error.value = null
    try {
      const params = {
        page: append ? pagination.value.page + 1 : 1,
        pageSize: pagination.value.pageSize,
        sort: filters.value.sort
      }
      if (filters.value.species) params.species = filters.value.species
      if (filters.value.city) params.city = filters.value.city
      if (filters.value.keyword) params.keyword = filters.value.keyword
      if (filters.value.status) params.status = filters.value.status

      const res = await getAdoptions(params)
      const data = res.data

      adoptionList.value = append ? [...adoptionList.value, ...data.list] : data.list
      pagination.value = data.pagination
    } catch (err) {
      error.value = err.message || '获取领养列表失败'
    } finally {
      loading.value = false
    }
  }

  async function fetchAdoptionDetail(id) {
    loading.value = true
    error.value = null
    try {
      const res = await getAdoptionDetail(id)
      currentAdoption.value = res.data.adoption
      return res.data.adoption
    } catch (err) {
      error.value = err.message || '获取领养详情失败'
      return null
    } finally {
      loading.value = false
    }
  }

  async function publishAdoption(data) {
    const res = await createAdoption(data)
    return res.data.adoption
  }

  async function fetchMyAdoptions(params = {}) {
    loading.value = true
    try {
      const res = await getMyAdoptions(params)
      myAdoptions.value = res.data.list || res.data
      return res.data
    } catch (err) {
      error.value = err.message || '获取我的领养列表失败'
    } finally {
      loading.value = false
    }
  }

  async function editAdoption(id, data) {
    const res = await updateAdoption(id, data)
    return res.data.updatedAdoption
  }

  async function removeAdoption(id) {
    await deleteAdoption(id)
    adoptionList.value = adoptionList.value.filter(a => a._id !== id)
    myAdoptions.value = myAdoptions.value.filter(a => a._id !== id)
  }

  async function submitApplication(id, data) {
    const res = await applyAdoption(id, data)
    return res.data.application
  }

  async function fetchMyApplications(params = {}) {
    loading.value = true
    try {
      const res = await getMyApplications(params)
      myApplications.value = res.data.list || res.data
      return res.data
    } catch (err) {
      error.value = err.message || '获取我的申请失败'
    } finally {
      loading.value = false
    }
  }

  async function fetchAdoptionApplications(id, params = {}) {
    loading.value = true
    try {
      const res = await getAdoptionApplications(id, params)
      adoptionApplications.value = res.data.list || res.data
      return res.data
    } catch (err) {
      error.value = err.message || '获取申请列表失败'
    } finally {
      loading.value = false
    }
  }

  async function reviewApp(applicationId, data) {
    const res = await reviewApplication(applicationId, data)
    return res.data.application
  }

  async function cancelApp(applicationId) {
    await cancelApplication(applicationId)
    myApplications.value = myApplications.value.map(app =>
      app._id === applicationId ? { ...app, status: 'cancelled' } : app
    )
  }

  async function submitFollowUp(applicationId, data) {
    const res = await addFollowUp(applicationId, data)
    return res.data.followUp
  }

  function setFilter(key, value) {
    filters.value[key] = value
  }

  function clearList() {
    adoptionList.value = []
    pagination.value = { page: 1, pageSize: 10, total: 0, totalPages: 0 }
    error.value = null
  }

  return {
    adoptionList,
    currentAdoption,
    myAdoptions,
    myApplications,
    adoptionApplications,
    loading,
    error,
    pagination,
    filters,
    hasMore,
    fetchAdoptions,
    fetchAdoptionDetail,
    publishAdoption,
    fetchMyAdoptions,
    editAdoption,
    removeAdoption,
    submitApplication,
    fetchMyApplications,
    fetchAdoptionApplications,
    reviewApp,
    cancelApp,
    submitFollowUp,
    setFilter,
    clearList
  }
})