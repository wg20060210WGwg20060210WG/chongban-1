import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  getItems,
  getItemDetail,
  createItem,
  getMyItems,
  updateItem,
  deleteItem,
  createOrder,
  getMyOrders,
  getOrderDetail,
  updateOrderStatus,
  confirmReceipt,
  cancelOrder,
  sendMessage
} from '../api/secondhand'

export const useSecondhandStore = defineStore('secondhand', () => {
  // 商品列表
  const itemList = ref([])
  const currentItem = ref(null)
  const myItems = ref([])
  const loading = ref(false)
  const error = ref(null)

  // 订单
  const myOrders = ref([])
  const currentOrder = ref(null)

  // 分页
  const pagination = ref({
    page: 1,
    pageSize: 10,
    total: 0,
    totalPages: 0
  })

  // 筛选条件
  const filters = ref({
    category: '',
    city: '',
    priceMin: '',
    priceMax: '',
    condition: '',
    sort: 'latest'
  })

  const hasMore = computed(() => pagination.value.page < pagination.value.totalPages)

  // ==================== 商品 ====================

  async function fetchItems(append = false) {
    loading.value = true
    error.value = null
    try {
      const params = {
        page: append ? pagination.value.page + 1 : 1,
        pageSize: pagination.value.pageSize,
        sort: filters.value.sort
      }
      if (filters.value.category) params.category = filters.value.category
      if (filters.value.city) params.city = filters.value.city
      if (filters.value.priceMin) params.priceMin = filters.value.priceMin
      if (filters.value.priceMax) params.priceMax = filters.value.priceMax
      if (filters.value.condition) params.condition = filters.value.condition

      const res = await getItems(params)
      const data = res.data

      itemList.value = append ? [...itemList.value, ...data.list] : data.list
      pagination.value = data.pagination
    } catch (err) {
      error.value = err.message || '获取商品列表失败'
    } finally {
      loading.value = false
    }
  }

  async function fetchItemDetail(itemId) {
    loading.value = true
    error.value = null
    try {
      const res = await getItemDetail(itemId)
      currentItem.value = res.data.item
      return res.data.item
    } catch (err) {
      error.value = err.message || '获取商品详情失败'
      return null
    } finally {
      loading.value = false
    }
  }

  async function publishItem(formData) {
    const res = await createItem(formData)
    return res.data.item
  }

  async function fetchMyItems(params = {}) {
    loading.value = true
    try {
      const res = await getMyItems(params)
      myItems.value = res.data.list || res.data
      return res.data
    } catch (err) {
      error.value = err.message || '获取我的商品失败'
    } finally {
      loading.value = false
    }
  }

  async function editItem(itemId, formData) {
    const res = await updateItem(itemId, formData)
    return res.data.item
  }

  async function removeItem(itemId) {
    await deleteItem(itemId)
    itemList.value = itemList.value.filter(item => item._id !== itemId)
    myItems.value = myItems.value.filter(item => item._id !== itemId)
  }

  // ==================== 订单 ====================

  async function placeOrder(data) {
    const res = await createOrder(data)
    return res.data.order
  }

  async function fetchMyOrders(params = {}) {
    loading.value = true
    try {
      const res = await getMyOrders(params)
      myOrders.value = res.data.list || res.data
      return res.data
    } catch (err) {
      error.value = err.message || '获取订单列表失败'
    } finally {
      loading.value = false
    }
  }

  async function fetchOrderDetail(orderId) {
    loading.value = true
    error.value = null
    try {
      const res = await getOrderDetail(orderId)
      currentOrder.value = res.data.order
      return res.data.order
    } catch (err) {
      error.value = err.message || '获取订单详情失败'
      return null
    } finally {
      loading.value = false
    }
  }

  async function markAsPaid(orderId, data = {}) {
    const res = await updateOrderStatus(orderId, { status: 'paid', ...data })
    return res.data.order
  }

  async function markAsShipped(orderId, data = {}) {
    const res = await updateOrderStatus(orderId, { status: 'shipped', ...data })
    return res.data.order
  }

  async function buyerConfirmReceipt(orderId) {
    const res = await confirmReceipt(orderId)
    return res.data.order
  }

  async function buyerCancelOrder(orderId) {
    const res = await cancelOrder(orderId)
    myOrders.value = myOrders.value.map(o =>
      o._id === orderId ? { ...o, status: 'cancelled' } : o
    )
    return res.data.order
  }

  async function sendOrderMessage(orderId, content) {
    const res = await sendMessage(orderId, content)
    return res.data.message || res.data
  }

  // ==================== 通用 ====================

  function setFilter(key, value) {
    filters.value[key] = value
  }

  function clearList() {
    itemList.value = []
    pagination.value = { page: 1, pageSize: 10, total: 0, totalPages: 0 }
    error.value = null
  }

  return {
    itemList,
    currentItem,
    myItems,
    myOrders,
    currentOrder,
    loading,
    error,
    pagination,
    filters,
    hasMore,
    fetchItems,
    fetchItemDetail,
    publishItem,
    fetchMyItems,
    editItem,
    removeItem,
    placeOrder,
    fetchMyOrders,
    fetchOrderDetail,
    markAsPaid,
    markAsShipped,
    buyerConfirmReceipt,
    buyerCancelOrder,
    sendOrderMessage,
    setFilter,
    clearList
  }
})