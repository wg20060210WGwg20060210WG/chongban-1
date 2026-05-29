import request from './index'

// ========== 服务相关 ==========

/** 获取服务列表（公开） */
export const getServices = (params) => {
  return request.get('/services/getServices', { params })
}

/** 获取服务详情（公开） */
export const getServiceDetail = (id) => {
  return request.get(`/services/${id}/getServiceDetail`)
}

/** 发布服务（商家） */
export const createService = (data) => {
  return request.post('/services/createService', data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
}

/** 更新服务 */
export const updateService = (id, data) => {
  return request.put(`/services/${id}/updateService`, data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
}

/** 下架服务 */
export const deleteService = (id) => {
  return request.delete(`/services/${id}/deleteService`)
}

/** 获取我的服务列表（商家） */
export const getMyServices = (params) => {
  return request.get('/services/my/getMyServices', { params })
}

// ========== 订单相关 ==========

/** 创建订单 */
export const createOrder = (data) => {
  return request.post('/services/orders/createOrder', data)
}

/** 获取我的订单 */
export const getMyOrders = (params) => {
  return request.get('/services/orders/my/getMyOrders', { params })
}

/** 获取订单详情 */
export const getOrderDetail = (id) => {
  return request.get(`/services/orders/${id}/getOrderDetail`)
}

/** 商家确认订单 */
export const confirmOrder = (id, data) => {
  return request.put(`/services/orders/${id}/confirmOrder`, data)
}

/** 更新订单状态 */
export const updateOrderStatus = (id, data) => {
  return request.put(`/services/orders/${id}/updateOrderStatus`, data)
}

/** 评价订单 */
export const reviewOrder = (id, data) => {
  return request.post(`/services/orders/${id}/reviewOrder`, data)
}

/** 模拟支付 */
export const simulatePayment = (id, data) => {
  return request.post(`/services/orders/${id}/simulatePayment`, data)
}

/** 取消订单 */
export const cancelOrder = (id, data) => {
  return request.put(`/services/orders/${id}/cancelOrder`, data)
}

/** 获取服务评价列表（公开） */
export const getServiceReviews = (serviceId, params) => {
  return request.get(`/services/${serviceId}/getServiceReviews`, { params })
}