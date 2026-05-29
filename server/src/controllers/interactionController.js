import mongoose from 'mongoose';
import Interaction from '../models/Interaction.js';
import Post from '../models/Post.js';
import Comment from '../models/Comment.js';
import User from '../models/User.js';
import { successResponse, errorResponse } from '../middleware/response.js';
import * as notificationService from '../services/notificationService.js';

// 验证目标是否存在
const validateTarget = async (targetType, targetId) => {
  try {
    let target;
    if (targetType === 'post') {
      target = await Post.findById(targetId);
    } else if (targetType === 'comment') {
      target = await Comment.findById(targetId);
    } else if (targetType === 'user') {
      target = await User.findById(targetId);
    }
    return !!target;
  } catch (error) {
    if (error.name === 'CastError') {
      return false;
    }
    throw error;
  }
};

// 验证参数
const validateObjectId = (id) => {
  return mongoose.Types.ObjectId.isValid(id);
};

// 点赞/收藏
export const toggleInteraction = async (req, res) => {
  try {
    const { type, targetType, targetId } = req.body;

    if (!type || !targetType || !targetId) {
      return errorResponse(res, '缺少必要参数', 400, 'MISSING_FIELDS');
    }

    if (!['like', 'collect'].includes(type)) {
      return errorResponse(res, '无效的互动类型', 400, 'INVALID_TYPE');
    }

    if (!['post', 'comment'].includes(targetType)) {
      return errorResponse(res, '无效的目标类型', 400, 'INVALID_TARGET');
    }

    if (!validateObjectId(targetId)) {
      return errorResponse(res, '无效的目标ID格式', 400, 'INVALID_ID');
    }

    const targetExists = await validateTarget(targetType, targetId);
    if (!targetExists) {
      return errorResponse(res, '目标不存在', 404, 'TARGET_NOT_FOUND');
    }

    const existing = await Interaction.findOneAndDelete(
      { userId: req.userId, type, targetType, targetId }
    );

    if (existing) {
      let updatedPostStats = null;
      if (targetType === 'post') {
        const statsField = type === 'like' ? 'stats.likeCount' : 'stats.collectCount';
        await Post.findByIdAndUpdate(targetId, { $inc: { [statsField]: -1 } });
        updatedPostStats = await Post.findById(targetId).select('stats');
      }
      return successResponse(res, { action: 'cancelled', postStats: updatedPostStats }, '取消成功');
    }

    try {
      await Interaction.create({ userId: req.userId, type, targetType, targetId });
    } catch (error) {
      if (error.code === 11000) {
        const updatedPostStats = targetType === 'post'
          ? await Post.findById(targetId).select('stats')
          : null;
        return successResponse(res, { action: 'created', postStats: updatedPostStats }, '操作成功');
      }
      throw error;
    }

    if (targetType === 'post') {
      const statsField = type === 'like' ? 'stats.likeCount' : 'stats.collectCount';
      await Post.findByIdAndUpdate(targetId, { $inc: { [statsField]: 1 } });
    }

    if (type === 'like') {
    const currentUser = await User.findById(req.userId);
      let target, targetAuthorId;
      if (targetType === 'post') {
        target = await Post.findById(targetId);
        targetAuthorId = target?.authorId;
      } else if (targetType === 'comment') {
        target = await Comment.findById(targetId);
        targetAuthorId = target?.authorId;
      }

      if (targetAuthorId && currentUser) {
        notificationService.sendLikeNotification({
          targetUserId: targetAuthorId,
          senderId: req.userId,
          senderName: currentUser.username,
          senderAvatar: currentUser.avatar,
          relatedType: targetType,
          relatedId: targetId
        }).catch(err => console.error('发送点赞通知失败:', err));
      }
    }

    const updatedPostStats = targetType === 'post'
      ? await Post.findById(targetId).select('stats')
      : null;

    return successResponse(res, { action: 'created', postStats: updatedPostStats }, '操作成功');
  } catch (error) {
    if (error.name === 'CastError') {
      return errorResponse(res, '无效的目标ID', 400, 'INVALID_ID');
    }
    return errorResponse(res, error.message, 500, 'TOGGLE_INTERACTION_FAILED');
  }
};

// 关注/取消关注用户
export const toggleFollow = async (req, res) => {
  try {
    const { userId: targetUserId } = req.body;

    if (!targetUserId) {
      return errorResponse(res, '目标用户ID不能为空', 400, 'MISSING_FIELDS');
    }

    if (!validateObjectId(targetUserId)) {
      return errorResponse(res, '无效的用户ID格式', 400, 'INVALID_ID');
    }

    if (targetUserId.toString() === req.userId.toString()) {
      return errorResponse(res, '不能关注自己', 400, 'CANNOT_FOLLOW_SELF');
    }

    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      return errorResponse(res, '用户不存在', 404, 'USER_NOT_FOUND');
    }

    const existing = await Interaction.findOneAndDelete(
      { userId: req.userId, type: 'follow', targetType: 'user', targetId: targetUserId }
    );

    if (existing) {
      return successResponse(res, { action: 'unfollowed' }, '取消关注成功');
    }

    try {
      await Interaction.create({ userId: req.userId, type: 'follow', targetType: 'user', targetId: targetUserId });
    } catch (error) {
      if (error.code === 11000) {
        return successResponse(res, { action: 'followed' }, '关注成功');
      }
      throw error;
    }

    await Promise.all([
      User.findByIdAndUpdate(req.userId, { $inc: { 'stats.followingCount': 1 } }),
      User.findByIdAndUpdate(targetUserId, { $inc: { 'stats.followersCount': 1 } })
    ]).catch(err => console.error('更新关注统计失败:', err));

    const currentUser = await User.findById(req.userId);
    if (currentUser) {
      notificationService.sendFollowNotification({
        targetUserId: targetUserId,
        senderId: req.userId,
        senderName: currentUser.username,
        senderAvatar: currentUser.avatar
      }).catch(err => console.error('发送关注通知失败:', err));
    }

    return successResponse(res, { action: 'followed' }, '关注成功');
  } catch (error) {
    if (error.name === 'CastError') {
      return errorResponse(res, '无效的用户ID', 400, 'INVALID_ID');
    }
    return errorResponse(res, error.message, 500, 'TOGGLE_FOLLOW_FAILED');
  }
};

// 检查互动状态（公开接口，未登录返回默认值）
export const checkInteraction = async (req, res) => {
  try {
    const { targetType, targetId } = req.params;

    if (!targetType || !targetId) {
      return errorResponse(res, '缺少必要参数', 400, 'MISSING_FIELDS');
    }

    if (!['post', 'comment', 'user'].includes(targetType)) {
      return errorResponse(res, '无效的目标类型', 400, 'INVALID_TARGET');
    }

    if (!validateObjectId(targetId)) {
      return errorResponse(res, '无效的目标ID格式', 400, 'INVALID_ID');
    }

    if (!req.userId) {
      if (targetType === 'user') {
        return successResponse(res, { isFollowed: false });
      }
      return successResponse(res, { isLiked: false, isCollected: false });
    }

    if (targetType === 'user') {
      const isFollowed = await Interaction.findOne({
        userId: req.userId,
        type: 'follow',
        targetType,
        targetId
      });
      return successResponse(res, { isFollowed: !!isFollowed });
    } else {
      const [isLiked, isCollected] = await Promise.all([
        Interaction.findOne({
          userId: req.userId,
          type: 'like',
          targetType,
          targetId
        }),
        Interaction.findOne({
          userId: req.userId,
          type: 'collect',
          targetType,
          targetId
        })
      ]);
      return successResponse(res, {
        isLiked: !!isLiked,
        isCollected: !!isCollected
      });
    }
  } catch (error) {
    if (error.name === 'CastError') {
      return errorResponse(res, '无效的目标ID', 400, 'INVALID_ID');
    }
    return errorResponse(res, error.message, 500, 'CHECK_INTERACTION_FAILED');
  }
};
