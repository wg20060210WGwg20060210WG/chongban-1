import request from './index'

// ==================== 商品 ====================

// 获取商品列表（公开）
export const getItems = (params) => {
  return request.get('/secondhand', { params })
}

// 获取商品详情
export const getItemDetail = (itemId) => {
  return request.get(`/secondhand/detail/${itemId}`)
}

// 发布商品（multipart/form-data）
export const createItem = (formData) => {
  return request.post('/secondhand', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
}

// 获取我发布的商品
export const getMyItems = (params) => {
  return request.get('/secondhand/my', { params })
}

// 更新商品
export const updateItem = (itemId, formData) => {
  return request.put(`/secondhand/${itemId}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
}

// 下架商品
export const deleteItem = (itemId) => {
  return request.delete(`/secondhand/${itemId}`)
}

// ==================== 订单 ====================

// 创建订单
export const createOrder = (data) => {
  return request.post('/secondhand/orders', data)
}

// 获取我的订单
export const getMyOrders = (params) => {
  return request.get('/secondhand/orders/my', { params })
}

// 获取订单详情
export const getOrderDetail = (orderId) => {
  return request.get(`/secondhand/orders/${orderId}`)
}

// 更新订单状态（卖家）
export const updateOrderStatus = (orderId, data) => {
  return request.put(`/secondhand/orders/${orderId}/status`, data)
}

// 确认收货（买家）
export const confirmReceipt = (orderId) => {
  return request.put(`/secondhand/orders/${orderId}/confirm`)
}

// 取消订单（买家）
export const cancelOrder = (orderId) => {
  return request.put(`/secondhand/orders/${orderId}/cancel`)
}

// ==================== 消息 ====================

// 发送订单消息
export const sendMessage = (orderId, content) => {
  return request.post(`/secondhand/orders/${orderId}/messages`, { content })
}