import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  getServices,
  getServiceDetail,
  getMyServices,
  getMyOrders,
  getOrderDetail,
  updateService as updateServiceApi,
  deleteService as deleteServiceApi
} from '../api/service'

export const useServiceStore = defineStore('service', () => {
  // ========== 服务列表 ==========
  const serviceList = ref([])
  const serviceLoading = ref(false)
  const servicePagination = ref({ page: 1, pageSize: 12, total: 0 })
  const serviceFilters = ref({ category: '', city: '', sort: 'latest' })
  const hasMore = ref(true)

  async function fetchServices(reset = false) {
    if (serviceLoading.value) return
    if (reset) {
      servicePagination.value.page = 1
      serviceList.value = []
      hasMore.value = true
    }
    if (!hasMore.value) return

    serviceLoading.value = true
    try {
      const params = {
        page: servicePagination.value.page,
        pageSize: servicePagination.value.pageSize,
        ...serviceFilters.value
      }
      // 清除空值
      Object.keys(params).forEach(k => { if (!params[k]) delete params[k] })

      const res = await getServices(params)
      const data = res.data
      if (reset) {
        serviceList.value = data.list || []
      } else {
        serviceList.value.push(...(data.list || []))
      }
      servicePagination.value.total = data.total || 0
      hasMore.value = serviceList.value.length < data.total
      if (hasMore.value) servicePagination.value.page++
    } catch (e) {
      console.error('获取服务列表失败:', e)
    } finally {
      serviceLoading.value = false
    }
  }

  function setServiceFilter(key, value) {
    serviceFilters.value[key] = value
  }

  // ========== 服务详情 ==========
  const currentService = ref(null)
  const detailLoading = ref(false)

  async function fetchServiceDetail(id) {
    detailLoading.value = true
    try {
      const res = await getServiceDetail(id)
      currentService.value = res.data.service
      return currentService.value
    } catch (e) {
      console.error('获取服务详情失败:', e)
      throw e
    } finally {
      detailLoading.value = false
    }
  }

  // ========== 我的服务（商家） ==========
  const myServices = ref([])
  const myServicesLoading = ref(false)

  async function fetchMyServices(params = {}) {
    myServicesLoading.value = true
    try {
      const res = await getMyServices(params)
      myServices.value = res.data.list || []
      return myServices.value
    } catch (e) {
      console.error('获取我的服务失败:', e)
    } finally {
      myServicesLoading.value = false
    }
  }

  // ========== 我的订单 ==========
  const orderList = ref([])
  const orderLoading = ref(false)
  const orderPagination = ref({ page: 1, pageSize: 10, total: 0 })
  const orderHasMore = ref(true)

  async function fetchMyOrders(params = {}, reset = false) {
    if (orderLoading.value) return
    if (reset) {
      orderPagination.value.page = 1
      orderList.value = []
      orderHasMore.value = true
    }
    if (!orderHasMore.value) return

    orderLoading.value = true
    try {
      const reqParams = {
        page: orderPagination.value.page,
        pageSize: orderPagination.value.pageSize,
        ...params
      }
      const res = await getMyOrders(reqParams)
      const data = res.data
      if (reset) {
        orderList.value = data.list || []
      } else {
        orderList.value.push(...(data.list || []))
      }
      orderPagination.value.total = data.total || 0
      orderHasMore.value = orderList.value.length < data.total
      if (orderHasMore.value) orderPagination.value.page++
    } catch (e) {
      console.error('获取订单列表失败:', e)
    } finally {
      orderLoading.value = false
    }
  }

  // ========== 订单详情 ==========
  const currentOrder = ref(null)
  const orderDetailLoading = ref(false)

  async function fetchOrderDetail(id) {
    orderDetailLoading.value = true
    try {
      const res = await getOrderDetail(id)
      currentOrder.value = res.data.order
      return currentOrder.value
    } catch (e) {
      console.error('获取订单详情失败:', e)
      throw e
    } finally {
      orderDetailLoading.value = false
    }
  }

  // ========== 更新/删除服务 ==========
  async function updateServiceAction(id, data) {
    const res = await updateServiceApi(id, data)
    return res.data
  }

  async function deleteServiceAction(id) {
    await deleteServiceApi(id)
  }

  return {
    // 服务列表
    serviceList, serviceLoading, servicePagination, serviceFilters, hasMore,
    fetchServices, setServiceFilter,
    // 服务详情
    currentService, detailLoading, fetchServiceDetail,
    // 我的服务
    myServices, myServicesLoading, fetchMyServices,
    // 订单
    orderList, orderLoading, orderPagination, orderHasMore, fetchMyOrders,
    currentOrder, orderDetailLoading, fetchOrderDetail,
    // 更新/删除
    updateServiceAction, deleteServiceAction
  }
})