import Notification from '../models/Notification.js';

const DEDUP_WINDOW_MS = 60 * 1000;

// 检查不可以给自己发送通知
const deduplicate = async (userId, type, relatedType, relatedId) => {
  const recent = await Notification.findOne({
    userId,
    type,
    relatedType: relatedType || null,
    relatedId: relatedId || null,
    createdAt: { $gte: new Date(Date.now() - DEDUP_WINDOW_MS) }
  }).lean();

  return !!recent;
};

// 校验必填参数
const validateRequired = (params, requiredFields) => {
  const missing = requiredFields.filter(field => !params[field]);
  if (missing.length > 0) {
    throw new Error(`缺少必填参数: ${missing.join(', ')}`);
  }
};

//把通知储存到数据库然后使用socket实时通知
export const sendNotification = async ({
  userId,
  type,
  title,
  content,
  relatedType,
  relatedId,
  extraData,
  senderId,
  senderName,
  senderAvatar
}) => {
  validateRequired({ userId, type, title, content }, ['userId', 'type', 'title', 'content']);

  if (senderId && userId.toString() === senderId.toString()) {
    return { skipped: true, reason: 'self_notification' };
  }

  const isDuplicate = await deduplicate(userId, type, relatedType, relatedId);
  if (isDuplicate) {
    return { skipped: true, reason: 'duplicate' };
  }

  const notification = await Notification.create({
    userId,
    type,
    title,
    content,
    relatedType,
    relatedId,
    extraData,
    senderId,
    senderName,
    senderAvatar
  });

  const notifySocket = global.notificationSocket;
  if (notifySocket && typeof notifySocket.emitToUser === 'function') {
    try {
      notifySocket.emitToUser(userId.toString(), 'notification', notification);
    } catch (socketError) {
      console.error('Socket notification push failed:', socketError.message);
    }
  }

  return { notification, skipped: false };
};

export const sendLikeNotification = async ({ targetUserId, senderId, senderName, senderAvatar, relatedType, relatedId }) => {
  return sendNotification({
    userId: targetUserId,
    type: 'like',
    title: '新点赞',
    content: `${senderName || '有用户'}赞了你`,
    relatedType,
    relatedId,
    senderId,
    senderName,
    senderAvatar
  });
};

export const sendCommentNotification = async ({ targetUserId, senderId, senderName, senderAvatar, postId, commentId, isReply }) => {
  let title = '新评论';
  let content = `${senderName || '有用户'}评论了你`;
  
  if (isReply) {
    title = '新回复';
    content = `${senderName || '有用户'}回复了你`;
  }

  return sendNotification({
    userId: targetUserId,
    type: 'comment',
    title,
    content,
    relatedType: 'post',
    relatedId: postId,
    extraData: {
      postId,
      commentId
    },
    senderId,
    senderName,
    senderAvatar
  });
};

export const sendFollowNotification = async ({ targetUserId, senderId, senderName, senderAvatar }) => {
  return sendNotification({
    userId: targetUserId,
    type: 'follow',
    title: '新粉丝',
    content: `${senderName || '有用户'}关注了你`,
    relatedType: 'user',
    relatedId: senderId,
    senderId,
    senderName,
    senderAvatar
  });
};

export const sendAdoptionNotification = async ({ targetUserId, senderId, senderName, senderAvatar, adoptionId, action }) => {
  const actionMap = {
    applied: { title: '新领养申请', content: `${senderName || '有用户'}提交了领养申请` },
    approved: { title: '领养申请通过', content: '你的领养申请已通过审核' },
    rejected: { title: '领养申请未通过', content: '你的领养申请未被通过' }
  };

  const info = actionMap[action] || { title: '领养通知', content: '有新的领养动态' };

  return sendNotification({
    userId: targetUserId,
    type: 'adoption',
    title: info.title,
    content: info.content,
    relatedType: 'adoption',
    relatedId: adoptionId,
    senderId,
    senderName,
    senderAvatar
  });
};

export const sendOrderNotification = async ({ targetUserId, orderId, orderNo, action }) => {
  const actionMap = {
    new:       { title: '新订单',     content: `订单 ${orderNo || ''} 已创建，请及时处理` },
    confirmed:  { title: '订单已确认', content: `订单 ${orderNo || ''} 已被商家确认` },
    completed:  { title: '服务已完成', content: `订单 ${orderNo || ''} 已完成，快去评价吧` },
    cancelled:  { title: '订单已取消', content: `订单 ${orderNo || ''} 已被取消` },
    paid:       { title: '支付成功',    content: `订单 ${orderNo || ''} 支付成功` }
  };

  const info = actionMap[action] || { title: '订单通知', content: `订单 ${orderNo || ''} 状态已更新` };

  return sendNotification({
    userId: targetUserId,
    type: 'order',
    title: info.title,
    content: info.content,
    relatedType: 'order',
    relatedId: orderId
  });
};

export const sendSystemNotification = async ({ userId, title, content, relatedType, relatedId, senderId, senderName, senderAvatar }) => {
  return sendNotification({
    userId,
    type: 'system',
    title,
    content,
    relatedType,
    relatedId,
    senderId,
    senderName,
    senderAvatar
  });
};
