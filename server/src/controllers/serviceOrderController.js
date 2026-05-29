import Service from '../models/Service.js';
import ServiceOrder from '../models/ServiceOrder.js';
import User from '../models/User.js';
import Pet from '../models/Pet.js';
import { successResponse, errorResponse } from '../middleware/response.js';
import * as notificationService from '../services/notificationService.js';
import { generateOrderNo, logError, getPaginationParams, buildPaginationResponse } from '../utils/helpers.js';

// 权限校验辅助函数（兼容 populate 后的文档和原始 ObjectId）
const isAdmin = (req) => req.role === 'admin';
const isMerchant = (req, order) => String(order.merchantId?._id || order.merchantId) === String(req.userId);
const isCustomer = (req, order) => String(order.customerId?._id || order.customerId) === String(req.userId);

// 创建服务订单
export const createOrder = async (req, res) => {
  try {
    const { serviceId, petInfo, appointment, contact, customerNote } = req.body;

    // 验证必填字段
    if (!serviceId) {
      return errorResponse(res, '服务ID是必填项', 400, 'SERVICE_ID_REQUIRED');
    }
    if (!petInfo?.petName || !petInfo?.species) {
      return errorResponse(res, '宠物名称和种类是必填项', 400, 'PET_INFO_REQUIRED');
    }
    if (!appointment?.date || !appointment?.timeSlot) {
      return errorResponse(res, '预约日期和时间段是必填项', 400, 'APPOINTMENT_REQUIRED');
    }
    if (!contact?.name || !contact?.phone) {
      return errorResponse(res, '联系人姓名和电话是必填项', 400, 'CONTACT_REQUIRED');
    }

    const service = await Service.findById(serviceId);
    if (!service) {
      return errorResponse(res, '服务不存在', 404, 'SERVICE_NOT_FOUND');
    }

    if (service.status !== 'active') {
      return errorResponse(res, '该服务已下架', 400, 'SERVICE_INACTIVE');
    }

    if (service.merchantId.toString() === req.userId.toString()) {
      return errorResponse(res, '不能预约自己的服务', 400, 'CANNOT_ORDER_OWN_SERVICE');
    }

    // 如果提供了petId，获取宠物信息
    let fullPetInfo = petInfo;
    if (petInfo.petId) {
      const pet = await Pet.findById(petInfo.petId);
      if (pet && pet.ownerId.toString() === req.userId.toString()) {
        fullPetInfo = {
          petId: pet._id,
          petName: petInfo.petName || pet.name,
          species: petInfo.species || pet.species,
          breed: petInfo.breed || pet.breed,
          weight: petInfo.weight || pet.weight,
          specialNeeds: petInfo.specialNeeds
        };
      }
    }

    // 创建订单数据（修复 pricing 安全访问）
    const orderData = {
      orderNo: generateOrderNo(),
      serviceId,
      merchantId: service.merchantId,
      customerId: req.userId,
      petInfo: fullPetInfo,
      appointment,
      contact,
      customerNote,
      pricing: req.body.pricing || {
        servicePrice: (service.pricing && service.pricing.price) || 0,
        additionalFees: 0,
        discount: 0,
        totalAmount: (service.pricing && service.pricing.price) || 0
      },
      statusHistory: [{
        status: 'pending',
        timestamp: new Date()
      }]
    };

    const order = new ServiceOrder(orderData);
    await order.save();

    // 更新服务订单数
    await Service.findByIdAndUpdate(serviceId, { $inc: { 'stats.orderCount': 1 } });

    // 发送通知给商家
    const currentUser = await User.findById(req.userId);
    if (currentUser) {
      notificationService.sendOrderNotification({
        targetUserId: service.merchantId,
        orderId: order._id,
        orderNo: order.orderNo,
        action: 'new'
      }).catch(logError('createOrder'));
    }

    return successResponse(res, { order }, '订单创建成功', 201);
  } catch (error) {
    return errorResponse(res, error.message, 500, 'CREATE_ORDER_FAILED');
  }
};

// 获取我的订单（客户或商家）
export const getMyOrders = async (req, res) => {
  try {
    const { status, role = 'customer' } = req.query;

    const { pageNum, sizeNum, skip } = getPaginationParams(req.query);

    const query = role === 'merchant' 
      ? { merchantId: req.userId } 
      : { customerId: req.userId };

    if (status) query.status = status;

    const orders = await ServiceOrder.find(query)
      .populate('serviceId', 'serviceName category images')
      .populate(role === 'merchant' ? 'customerId' : 'merchantId', 'username avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(sizeNum);

    const total = await ServiceOrder.countDocuments(query);

    return successResponse(res, buildPaginationResponse(orders, total, pageNum, sizeNum));
  } catch (error) {
    return errorResponse(res, error.message, 500, 'GET_ORDERS_FAILED');
  }
};

// 获取订单详情
export const getOrderDetail = async (req, res) => {
  try {
    const order = await ServiceOrder.findById(req.params.id)
      .populate('serviceId', 'serviceName category images pricing')
      .populate('merchantId', 'username avatar phone')
      .populate('customerId', 'username avatar phone');

    if (!order) {
      return errorResponse(res, '订单不存在', 404, 'ORDER_NOT_FOUND');
    }

    // 验证权限（统一权限校验）
    if (!isAdmin(req) && !isMerchant(req, order) && !isCustomer(req, order)) {
      return errorResponse(res, '您没有权限查看此订单', 403, 'FORBIDDEN');
    }

    return successResponse(res, { order }, '订单详情获取成功');
  } catch (error) {
    return errorResponse(res, error.message, 500, 'GET_ORDER_FAILED');
  }
};

// 商家确认订单
export const confirmOrder = async (req, res) => {
  try {
    const order = await ServiceOrder.findById(req.params.id);

    if (!order) {
      return errorResponse(res, '订单不存在', 404, 'ORDER_NOT_FOUND');
    }

    if (!isAdmin(req) && !isMerchant(req, order)) {
      return errorResponse(res, '您没有权限操作此订单', 403, 'FORBIDDEN');
    }

    if (order.status !== 'pending') {
      return errorResponse(res, '该订单已处理过', 400, 'ORDER_ALREADY_PROCESSED');
    }

    order.status = 'confirmed';
    order.statusHistory.unshift({
      status: 'confirmed',
      timestamp: new Date(),
      operator: req.userId,
      note: req.body.merchantNote
    });
    if (req.body.merchantNote) {
      order.merchantNote = req.body.merchantNote;
    }

    await order.save();

    // 发送通知给客户
    notificationService.sendOrderNotification({
      targetUserId: order.customerId,
      orderId: order._id,
      orderNo: order.orderNo,
      action: 'confirmed'
    }).catch(logError('confirmOrder'));

    return successResponse(res, { order }, '订单已确认');
  } catch (error) {
    return errorResponse(res, error.message, 500, 'CONFIRM_ORDER_FAILED');
  }
};

// 更新订单状态
export const updateOrderStatus = async (req, res) => {
  try {
    const { status, note } = req.body;
    const order = await ServiceOrder.findById(req.params.id);

    if (!order) {
      return errorResponse(res, '订单不存在', 404, 'ORDER_NOT_FOUND');
    }

    if (!isAdmin(req) && !isMerchant(req, order)) {
      return errorResponse(res, '您没有权限操作此订单', 403, 'FORBIDDEN');
    }

    // 修复状态转换逻辑（允许更多合理的转换）
    const validTransitions = {
      pending: ['confirmed', 'cancelled'],
      confirmed: ['in_progress', 'cancelled'],
      in_progress: ['completed', 'cancelled'],
      completed: ['refunded'],
      cancelled: [],
      refunded: []
    };

    if (!validTransitions[order.status].includes(status)) {
      return errorResponse(res, '无效的订单状态变更', 400, 'INVALID_STATUS_TRANSITION');
    }

    order.status = status;
    order.statusHistory.unshift({
      status,
      timestamp: new Date(),
      operator: req.userId,
      note
    });

    await order.save();

    // 发送通知给客户
    notificationService.sendOrderNotification({
      targetUserId: order.customerId,
      orderId: order._id,
      orderNo: order.orderNo,
      action: status
    }).catch(logError('updateOrderStatus'));

    return successResponse(res, { order }, '订单状态已更新');
  } catch (error) {
    return errorResponse(res, error.message, 500, 'UPDATE_ORDER_FAILED');
  }
};

// 评价订单
export const reviewOrder = async (req, res) => {
  try {
    const { rating, content, images } = req.body;
    const order = await ServiceOrder.findById(req.params.id)
      .populate('serviceId');

    if (!order) {
      return errorResponse(res, '订单不存在', 404, 'ORDER_NOT_FOUND');
    }

    if (!isCustomer(req, order)) {
      return errorResponse(res, '您没有权限评价此订单', 403, 'FORBIDDEN');
    }

    if (order.status !== 'completed') {
      return errorResponse(res, '只能评价已完成的订单', 400, 'ORDER_NOT_COMPLETED');
    }

    if (order.review?.rating) {
      return errorResponse(res, '该订单已评价过', 400, 'ORDER_ALREADY_REVIEWED');
    }

    // 评分范围校验
    if (rating === undefined || rating === null || Number(rating) < 1 || Number(rating) > 5) {
      return errorResponse(res, '评分必须在 1-5 之间', 400, 'INVALID_RATING');
    }

    order.review = {
      rating,
      content,
      images: images || [],
      createdAt: new Date()
    };

    await order.save();

    // 更新服务的评分和评价数（修复浮点精度问题）
    const service = order.serviceId;
    const oldTotalRating = service.stats.rating * service.stats.reviewCount;
    const newReviewCount = service.stats.reviewCount + 1;
    const newRating = Math.round(((oldTotalRating + rating) / newReviewCount) * 10) / 10;

    await Service.findByIdAndUpdate(service._id, {
      'stats.rating': newRating,
      'stats.reviewCount': newReviewCount
    });

    return successResponse(res, { order }, '评价成功');
  } catch (error) {
    return errorResponse(res, error.message, 500, 'REVIEW_ORDER_FAILED');
  }
};

// 获取服务的评价列表（公开）
export const getServiceReviews = async (req, res) => {
  try {
    const { pageNum, sizeNum, skip } = getPaginationParams(req.query);
    const serviceId = req.params.id;

    const service = await Service.findById(serviceId);
    if (!service) {
      return errorResponse(res, '服务不存在', 404, 'SERVICE_NOT_FOUND');
    }

    const query = {
      serviceId,
      'review.rating': { $exists: true }
    };

    const total = await ServiceOrder.countDocuments(query);
    const orders = await ServiceOrder.find(query)
      .select('review customerId petInfo.petName createdAt')
      .populate('customerId', 'username avatar')
      .sort({ 'review.createdAt': -1 })
      .skip(skip)
      .limit(sizeNum);

    const reviews = orders.map(o => ({
      _id: o._id,
      rating: o.review.rating,
      content: o.review.content,
      images: o.review.images || [],
      createdAt: o.review.createdAt,
      user: o.customerId,
      petName: o.petInfo?.petName
    }));

    return successResponse(res, buildPaginationResponse(reviews, total, pageNum, sizeNum));
  } catch (error) {
    return errorResponse(res, error.message, 500, 'GET_SERVICE_REVIEWS_FAILED');
  }
};

// 模拟支付
export const simulatePayment = async (req, res) => {
  try {
    const { method } = req.body;
    const order = await ServiceOrder.findById(req.params.id);

    if (!order) {
      return errorResponse(res, '订单不存在', 404, 'ORDER_NOT_FOUND');
    }

    if (!isCustomer(req, order)) {
      return errorResponse(res, '您没有权限操作此订单', 403, 'FORBIDDEN');
    }

    if (order.payment?.status === 'paid') {
      return errorResponse(res, '该订单已支付', 400, 'ORDER_ALREADY_PAID');
    }

    order.payment = {
      method,
      status: 'paid',
      paidAt: new Date(),
      transactionId: `TXN${Date.now()}`
    };

    // 修复：支付成功后自动确认订单（如果是 pending 状态）
    if (order.status === 'pending') {
      order.status = 'confirmed';
      order.statusHistory.unshift({
        status: 'confirmed',
        timestamp: new Date(),
        operator: req.userId,
        note: '支付成功自动确认'
      });
    }

    await order.save();

    // 发送通知给商家
    notificationService.sendOrderNotification({
      targetUserId: order.merchantId,
      orderId: order._id,
      orderNo: order.orderNo,
      action: 'paid'
    }).catch(logError('simulatePayment'));

    return successResponse(res, { payment: order.payment, order }, '支付成功');
  } catch (error) {
    return errorResponse(res, error.message, 500, 'PAYMENT_FAILED');
  }
};

// 客户取消订单
export const cancelOrder = async (req, res) => {
  try {
    const order = await ServiceOrder.findById(req.params.id);

    if (!order) {
      return errorResponse(res, '订单不存在', 404, 'ORDER_NOT_FOUND');
    }

    if (!isCustomer(req, order) && !isAdmin(req)) {
      return errorResponse(res, '您没有权限取消此订单', 403, 'FORBIDDEN');
    }

    const validTransitions = ['pending', 'confirmed'];
    if (!validTransitions.includes(order.status)) {
      return errorResponse(res, '该状态下无法取消订单', 400, 'CANNOT_CANCEL');
    }

    order.status = 'cancelled';
    order.statusHistory.unshift({
      status: 'cancelled',
      timestamp: new Date(),
      operator: req.userId,
      note: req.body.note
    });

    // 如果已支付，标记退款状态
    if (order.payment?.status === 'paid') {
      order.payment.status = 'refunded';
    }

    await order.save();

    // 发送通知给商家
    notificationService.sendOrderNotification({
      targetUserId: order.merchantId,
      orderId: order._id,
      orderNo: order.orderNo,
      action: 'cancelled'
    }).catch(logError('cancelOrder'));

    return successResponse(res, { order }, '订单已取消');
  } catch (error) {
    return errorResponse(res, error.message, 500, 'CANCEL_ORDER_FAILED');
  }
};
