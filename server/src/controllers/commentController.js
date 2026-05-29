import Comment from '../models/Comment.js';
import Post from '../models/Post.js';
import User from '../models/User.js';
import { successResponse, errorResponse } from '../middleware/response.js';
import * as notificationService from '../services/notificationService.js';

// 允许前端提交的字段白名单
const ALLOWED_COMMENT_FIELDS = ['content', 'images', 'parentId', 'replyToUserId'];

const filterCommentBody = (body) => {
  const filtered = {};
  ALLOWED_COMMENT_FIELDS.forEach(field => {
    if (body[field] !== undefined) {
      filtered[field] = body[field];
    }
  });
  return filtered;
};

// 创建评论
export const createComment = async (req, res) => {
  try {
    const { postId, parentId, replyToUserId } = req.body;

    if (!postId) {
      return errorResponse(res, '帖子ID不能为空', 400, 'MISSING_POST_ID');
    }

    // 验证帖子是否存在
    const post = await Post.findById(postId);
    if (!post) {
      return errorResponse(res, '帖子不存在', 404, 'POST_NOT_FOUND');
    }

    const commentData = {
      ...filterCommentBody(req.body),
      postId,
      authorId: req.userId
    };

    const comment = new Comment(commentData);
    await comment.save();

    await Post.findByIdAndUpdate(postId, { $inc: { 'stats.commentCount': 1 } });

    const currentUser = await User.findById(req.userId);
    if (currentUser) {
      if (parentId && replyToUserId) {
        const parentComment = await Comment.findById(parentId);
        if (parentComment) {
          notificationService.sendCommentNotification({
            targetUserId: replyToUserId,
            senderId: req.userId,
            senderName: currentUser.username,
            senderAvatar: currentUser.avatar,
            postId,
            commentId: comment._id,
            isReply: true
          }).catch(err => console.error('发送回复通知失败:', err));
        }
      } else {
        if (post.authorId.toString() !== req.userId.toString()) {
          notificationService.sendCommentNotification({
            targetUserId: post.authorId,
            senderId: req.userId,
            senderName: currentUser.username,
            senderAvatar: currentUser.avatar,
            postId,
            commentId: comment._id,
            isReply: false
          }).catch(err => console.error('发送评论通知失败:', err));
        }
      }
    }

    const updatedPostStats = await Post.findById(postId).select('stats');
    return successResponse(res, { comment, postStats: updatedPostStats }, '评论成功', 201);
  } catch (error) {
    return errorResponse(res, error.message, 500, 'CREATE_COMMENT_FAILED');
  }
};

// 获取帖子评论列表
export const getPostComments = async (req, res) => {
  try {
    const { page = 1, pageSize = 20 } = req.query;

    // 分页参数限制
    const safePage = Math.max(1, parseInt(page));
    const safePageSize = Math.min(50, Math.max(1, parseInt(pageSize)));

    const query = {
      postId: req.params.postId,
      status: 'visible',
      parentId: null
    };

    const comments = await Comment.find(query)
      .populate('authorId', 'username avatar')
      .sort({ createdAt: -1 })
      .skip((safePage - 1) * safePageSize)
      .limit(safePageSize);

    // 获取每条评论的回复
    const commentsWithReplies = await Promise.all(
      comments.map(async (comment) => {
        const replies = await Comment.find({
          parentId: comment._id,
          status: 'visible'
        })
          .populate('authorId', 'username avatar')
          .populate('replyToUserId', 'username')
          .sort({ createdAt: 1 })
          .limit(5);

        return {
          ...comment.toObject(),
          replies
        };
      })
    );

    const total = await Comment.countDocuments(query);

    return successResponse(res, {
      list: commentsWithReplies,
      pagination: {
        page: safePage,
        pageSize: safePageSize,
        total,
        totalPages: Math.ceil(total / safePageSize)
      }
    });
  } catch (error) {
    return errorResponse(res, error.message, 500, 'GET_COMMENTS_FAILED');
  }
};

// 删除评论
export const deleteComment = async (req, res) => {
  try {
    const query = { _id: req.params.id };
    
    if (req.role !== 'admin') {
      query.authorId = req.userId;
    }

    const deletedComment = await Comment.findOneAndUpdate(
      query,
      { status: 'deleted' },
      { new: true }
    );

    if (!deletedComment) {
      const comment = await Comment.findById(req.params.id);
      if (!comment) {
        return errorResponse(res, '评论不存在', 404, 'COMMENT_NOT_FOUND');
      }
      return errorResponse(res, '您没有权限删除此评论', 403, 'FORBIDDEN');
    }

    await Post.findByIdAndUpdate(deletedComment.postId, { $inc: { 'stats.commentCount': -1 } }).catch(err => console.error('更新评论计数失败:', err));

    return successResponse(res, null, '删除成功');
  } catch (error) {
    if (error.name === 'CastError') {
      return errorResponse(res, '无效的评论ID', 400, 'INVALID_ID');
    }
    return errorResponse(res, error.message, 500, 'DELETE_COMMENT_FAILED');
  }
};
