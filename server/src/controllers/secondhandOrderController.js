import SecondhandItem from '../models/SecondhandItem.js';
import SecondhandOrder from '../models/SecondhandOrder.js';
import User from '../models/User.js';
import { successResponse, errorResponse } from '../middleware/response.js';
import { generateOrderNo, getPaginationParams, buildPaginationResponse, logError } from '../utils/helpers.js';
import * as notificationService from '../services/notificationService.js';

// 权限校验辅助函数
const isAdmin = (req) => req.role === 'admin';
const isSeller = (req, order) => order.sellerId.toString() === req.userId.toString();
const isBuyer = (req, order) => order.buyerId.toString() === req.userId.toString();

// 创建订单
export const createOrder = async (req, res) => {
  let reservedItem = null;
  let itemId = null;
  try {
    ({ itemId } = req.body);
    const { deliveryMethod, shippingInfo } = req.body;
    
    // 校验 deliveryMethod
    if (!deliveryMethod) {
      return errorResponse(res, '配送方式不能为空', 400, 'DELIVERY_METHOD_REQUIRED');
    }
    if (!['pickup', 'shipping'].includes(deliveryMethod)) {
      return errorResponse(res, '配送方式必须为 pickup 或 shipping', 400, 'INVALID_DELIVERY_METHOD');
    }

    // 原子操作：检查商品是否可用，同时将状态改为 reserved
    reservedItem = await SecondhandItem.findOneAndUpdate(
      {
        _id: itemId,
        status: 'available',
        sellerId: { $ne: req.userId }
      },
      { $set: { status: 'reserved' } },
      { new: true }
    );

    if (!reservedItem) {
      // 再次查询原因，给用户更准确的错误提示
      const originalItem = await SecondhandItem.findById(itemId);
      if (!originalItem) {
        return errorResponse(res, '商品不存在', 404, 'ITEM_NOT_FOUND');
      }
      if (originalItem.sellerId.toString() === req.userId.toString()) {
        return errorResponse(res, '不能购买自己的商品', 400, 'CANNOT_BUY_OWN_ITEM');
      }
      return errorResponse(res, '商品不可购买', 400, 'ITEM_NOT_AVAILABLE');
    }

    let totalAmount = reservedItem.sellingPrice;
    if (deliveryMethod === 'shipping') {
      totalAmount += Number(reservedItem.deliveryMethods?.shippingFee) || 0;
    }

    const orderData = {
      orderNo: generateOrderNo(),
      itemId,
      sellerId: reservedItem.sellerId,
      buyerId: req.userId,
      itemSnapshot: {
        title: reservedItem.title,
        images: reservedItem.images,
        price: reservedItem.sellingPrice,
        quantity: 1
      },
      deliveryMethod,
      shippingInfo: deliveryMethod === 'shipping' ? shippingInfo : undefined,
      totalAmount,
      statusHistory: [{
        status: 'pending',
        timestamp: new Date(),
        operator: req.userId
      }]
    };

    const order = new SecondhandOrder(orderData);
    await order.save();

    const buyer = await User.findById(req.userId);
    if (buyer) {
      notificationService.sendSystemNotification({
        userId: reservedItem.sellerId,
        title: '新的订单！',
        content: `${buyer.username} 想要购买您的商品「${reservedItem.title}」`,
        relatedType: 'secondhand_order',
        relatedId: order._id,
        senderId: req.userId,
        senderName: buyer.username,
        senderAvatar: buyer.avatar
      }).catch(logError('createOrder'));
    }

    return successResponse(res, { order }, '订单创建成功', 201);
  } catch (error) {
    if (reservedItem && itemId) {
      await SecondhandItem.findByIdAndUpdate(itemId, { $set: { status: 'available' } }).catch(err => console.error('回滚商品状态失败:', err));
    }
    return errorResponse(res, error.message, 500, 'CREATE_ORDER_FAILED');
  }
};

// 获取我的订单
export const getMyOrders = async (req, res) => {
  try {
    const { status, role = 'buyer' } = req.query;

    const { pageNum, sizeNum, skip } = getPaginationParams(req.query);

    const query = role === 'seller' 
      ? { sellerId: req.userId } 
      : { buyerId: req.userId };

    if (status) query.status = status;

    const orders = await SecondhandOrder.find(query)
      .populate('itemId', 'title images')
      .populate(role === 'seller' ? 'buyerId' : 'sellerId', 'username avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(sizeNum);

    const total = await SecondhandOrder.countDocuments(query);

    return successResponse(res, buildPaginationResponse(orders, total, pageNum, sizeNum));
  } catch (error) {
    return errorResponse(res, error.message, 500, 'GET_ORDERS_FAILED');
  }
};

// 获取订单详情
export const getOrderDetail = async (req, res) => {
  try {
    const order = await SecondhandOrder.findById(req.params.orderId)
      .populate('itemId', 'title images description category')
      .populate('sellerId', 'username avatar phone')
      .populate('buyerId', 'username avatar phone');

    if (!order) {
      return errorResponse(res, '订单不存在', 404, 'ORDER_NOT_FOUND');
    }

    if (!isAdmin(req) && !isSeller(req, order) && !isBuyer(req, order)) {
      return errorResponse(res, '您没有权限查看此订单', 403, 'FORBIDDEN');
    }

    return successResponse(res, { order }, '订单详情获取成功');
  } catch (error) {
    return errorResponse(res, error.message, 500, 'GET_ORDER_FAILED');
  }
};

// 更新订单状态
export const updateOrderStatus = async (req, res) => {
  try {
    const { status, trackingNumber, note } = req.body;
    const order = await SecondhandOrder.findById(req.params.orderId);

    if (!order) {
      return errorResponse(res, '订单不存在', 404, 'ORDER_NOT_FOUND');
    }

    if (!isAdmin(req) && !isSeller(req, order)) {
      return errorResponse(res, '您没有权限操作此订单', 403, 'FORBIDDEN');
    }

    const validTransitions = {
      pending: ['paid', 'cancelled'],
      paid: ['shipped', 'cancelled'],
      shipped: ['completed', 'cancelled'],
      completed: [],
      cancelled: []
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

    if (trackingNumber && order.shippingInfo) {
      order.shippingInfo.trackingNumber = trackingNumber;
    }

    await order.save();

    if (status === 'paid') {
      await SecondhandItem.findByIdAndUpdate(order.itemId, { status: 'sold', soldTo: order.buyerId, soldAt: new Date() });
    } else if (status === 'cancelled') {
      const item = await SecondhandItem.findById(order.itemId);
      if (item && item.status !== 'sold') {
        item.status = 'available';
        await item.save();
      }
    }

    const otherUserId = isSeller(req, order) ? order.buyerId : order.sellerId;
    const operator = await User.findById(req.userId);
    if (operator) {
      const statusText = {
        pending: '待支付',
        paid: '已支付',
        shipped: '已发货',
        completed: '已完成',
        cancelled: '已取消'
      };
      notificationService.sendSystemNotification({
        userId: otherUserId,
        title: '订单状态更新',
        content: `订单 ${order.orderNo} 状态更新为「${statusText[status]}」`,
        relatedType: 'secondhand_order',
        relatedId: order._id,
        senderId: req.userId,
        senderName: operator.username,
        senderAvatar: operator.avatar
      }).catch(logError('updateOrderStatus'));
    }

    return successResponse(res, { order }, '订单状态已更新');
  } catch (error) {
    return errorResponse(res, error.message, 500, 'UPDATE_ORDER_FAILED');
  }
};

// 买家确认收货
export const confirmReceipt = async (req, res) => {
  try {
    const order = await SecondhandOrder.findById(req.params.orderId);

    if (!order) {
      return errorResponse(res, '订单不存在', 404, 'ORDER_NOT_FOUND');
    }

    if (!isBuyer(req, order) && !isAdmin(req)) {
      return errorResponse(res, '您没有权限操作此订单', 403, 'FORBIDDEN');
    }

    if (order.status !== 'shipped') {
      return errorResponse(res, '只能确认已发货的订单', 400, 'INVALID_STATUS');
    }

    order.status = 'completed';
    order.statusHistory.unshift({
      status: 'completed',
      timestamp: new Date(),
      operator: req.userId,
      note: isAdmin(req) ? '管理员确认收货' : '买家确认收货'
    });

    await order.save();

    await SecondhandItem.findByIdAndUpdate(order.itemId, { 
      status: 'sold', 
      soldTo: order.buyerId, 
      soldAt: new Date() 
    });

    const operator = await User.findById(req.userId);
    if (operator) {
      notificationService.sendSystemNotification({
        userId: order.sellerId,
        title: '订单已完成！',
        content: `${operator.username} 已确认收货，订单 ${order.orderNo} 已完成`,
        relatedType: 'secondhand_order',
        relatedId: order._id,
        senderId: req.userId,
        senderName: operator.username,
        senderAvatar: operator.avatar
      }).catch(logError('confirmReceipt'));
    }

    return successResponse(res, { order }, '确认收货成功');
  } catch (error) {
    return errorResponse(res, error.message, 500, 'CONFIRM_RECEIPT_FAILED');
  }
};

// 买家取消订单
export const cancelOrder = async (req, res) => {
  try {
    const order = await SecondhandOrder.findById(req.params.orderId);

    if (!order) {
      return errorResponse(res, '订单不存在', 404, 'ORDER_NOT_FOUND');
    }

    if (!isBuyer(req, order) && !isAdmin(req)) {
      return errorResponse(res, '您没有权限取消此订单', 403, 'FORBIDDEN');
    }

    const validTransitions = ['pending', 'paid'];
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

    await order.save();

    const item = await SecondhandItem.findById(order.itemId);
    if (item && item.status !== 'sold') {
      item.status = 'available';
      await item.save();
    }

    const buyer = await User.findById(req.userId);
    if (buyer) {
      notificationService.sendSystemNotification({
        userId: order.sellerId,
        title: '订单已取消',
        content: `${buyer.username} 取消了订单 ${order.orderNo}`,
        relatedType: 'secondhand_order',
        relatedId: order._id,
        senderId: req.userId,
        senderName: buyer.username,
        senderAvatar: buyer.avatar
      }).catch(logError('cancelOrder'));
    }

    return successResponse(res, { order }, '订单已取消');
  } catch (error) {
    return errorResponse(res, error.message, 500, 'CANCEL_ORDER_FAILED');
  }
};

// 发送消息
export const addMessage = async (req, res) => {
  try {
    const { content } = req.body;
    
    // 校验消息内容
    if (!content || !content.trim()) {
      return errorResponse(res, '消息内容不能为空', 400, 'CONTENT_REQUIRED');
    }
    
    const order = await SecondhandOrder.findById(req.params.orderId);

    if (!order) {
      return errorResponse(res, '订单不存在', 404, 'ORDER_NOT_FOUND');
    }

    if (!isAdmin(req) && !isSeller(req, order) && !isBuyer(req, order)) {
      return errorResponse(res, '您没有权限操作此订单', 403, 'FORBIDDEN');
    }

    // 已取消/已完成的订单不允许发消息
    if (['cancelled', 'completed'].includes(order.status)) {
      return errorResponse(res, '该订单已结束，无法发送消息', 400, 'ORDER_ENDED');
    }

    const message = {
      senderId: req.userId,
      content
    };

    // 使用原子 $push 追加消息，防止竞态丢失
    const updatedOrder = await SecondhandOrder.findByIdAndUpdate(
      req.params.orderId,
      { $push: { messages: message } },
      { new: true }
    );

    // 确定通知目标
    const sender = await User.findById(req.userId);
    if (sender) {
      const notificationData = {
        title: '新的订单消息',
        content: `${sender.username}: ${content.substring(0, 50)}${content.length > 50 ? '...' : ''}`,
        relatedType: 'secondhand_order',
        relatedId: order._id,
        senderId: req.userId,
        senderName: sender.username,
        senderAvatar: sender.avatar
      };

      if (isAdmin(req)) {
        // 管理员：同时通知买卖双方
        notificationService.sendSystemNotification({
          userId: order.sellerId,
          ...notificationData
        }).catch(logError('addMessage'));
        notificationService.sendSystemNotification({
          userId: order.buyerId,
          ...notificationData
        }).catch(logError('addMessage'));
      } else {
        // 普通用户：通知另一方
        const otherUserId = isSeller(req, order) ? order.buyerId : order.sellerId;
        notificationService.sendSystemNotification({
          userId: otherUserId,
          ...notificationData
        }).catch(logError('addMessage'));
      }
    }

    const lastMessage = updatedOrder.messages[updatedOrder.messages.length - 1];
    return successResponse(res, { message: lastMessage }, '消息发送成功');
  } catch (error) {
    return errorResponse(res, error.message, 500, 'ADD_MESSAGE_FAILED');
  }
};
