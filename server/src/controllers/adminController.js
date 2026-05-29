import User from '../models/User.js';
import Post from '../models/Post.js';
import Adoption from '../models/Adoption.js';
import ServiceOrder from '../models/ServiceOrder.js';
import SecondhandOrder from '../models/SecondhandOrder.js';
import { successResponse, errorResponse } from '../middleware/response.js';
import { getPaginationParams, buildPaginationResponse } from '../utils/helpers.js';

// 获取用户列表
export const getUsers = async (req, res) => {
  try {
    const { role, status, keyword } = req.query;
    const { pageNum, sizeNum, skip } = getPaginationParams(req.query);

    const query = {};
    if (role) query.role = role;
    if (status) query.status = status;
    if (keyword) {
      query.$or = [
        { username: { $regex: keyword, $options: 'i' } },
        { email: { $regex: keyword, $options: 'i' } },
        { phone: { $regex: keyword, $options: 'i' } }
      ];
    }

    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(sizeNum);

    const total = await User.countDocuments(query);

    return successResponse(res, buildPaginationResponse(users, total, pageNum, sizeNum));
  } catch (error) {
    return errorResponse(res, error.message, 500, 'GET_USERS_FAILED');
  }
};

// 封禁/解封用户
export const banUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { reason, duration } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return errorResponse(res, '用户不存在', 404, 'USER_NOT_FOUND');
    }

    const newStatus = user.status === 'banned' ? 'active' : 'banned';
    user.status = newStatus;
    if (newStatus === 'banned') {
      user.bannedUntil = duration && duration > 0 ? new Date(Date.now() + duration * 1000) : null;
    } else {
      user.bannedUntil = null;
    }
    await user.save();

    return successResponse(res, {
      userId: user._id,
      username: user.username,
      status: newStatus,
      bannedUntil: user.bannedUntil,
      reason: reason || ''
    }, newStatus === 'banned' ? '用户已封禁' : '用户已解封');
  } catch (error) {
    return errorResponse(res, error.message, 500, 'BAN_USER_FAILED');
  }
};

// 审核帖子
export const reviewPost = async (req, res) => {
  try {
    const { postId } = req.params;
    const { status, reason } = req.body;

    if (!status || !['published', 'hidden'].includes(status)) {
      return errorResponse(res, '无效的审核状态', 400, 'INVALID_REVIEW_STATUS');
    }

    const post = await Post.findByIdAndUpdate(
      postId,
      { status },
      { new: true, runValidators: true }
    ).populate('authorId', 'username avatar');

    if (!post) {
      return errorResponse(res, '帖子不存在', 404, 'POST_NOT_FOUND');
    }

    return successResponse(res, { post, reason: reason || '' }, status === 'published' ? '帖子已发布' : '帖子已隐藏');
  } catch (error) {
    if (error.name === 'CastError') {
      return errorResponse(res, '无效的帖子ID', 400, 'INVALID_ID');
    }
    return errorResponse(res, error.message, 500, 'REVIEW_POST_FAILED');
  }
};

// 获取举报列表
export const getReports = async (req, res) => {
  try {
    const { type, status = 'pending' } = req.query;
    const { pageNum, sizeNum, skip } = getPaginationParams(req.query);

    // 举报系统暂未完善，返回被隐藏的帖子作为待审核列表
    const query = {};
    if (type === 'post' || !type) {
      Object.assign(query, { status: 'hidden' });
    }

    const posts = await Post.find(query)
      .populate('authorId', 'username avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(sizeNum);

    const total = await Post.countDocuments(query);

    return successResponse(res, buildPaginationResponse(posts, total, pageNum, sizeNum));
  } catch (error) {
    return errorResponse(res, error.message, 500, 'GET_REPORTS_FAILED');
  }
};

// 数据统计
export const getStatistics = async (req, res) => {
  try {
    const [
      totalUsers,
      newUsersToday,
      activeUsersToday,
      totalPosts,
      newPostsToday,
      totalServiceOrders,
      pendingServiceOrders,
      totalSecondhandOrders,
      pendingSecondhandOrders,
      totalAdoptions,
      pendingAdoptionApps
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({
        createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) }
      }),
      User.countDocuments({ status: 'active' }),
      Post.countDocuments({ status: { $ne: 'deleted' } }),
      Post.countDocuments({
        createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) }
      }),
      ServiceOrder.countDocuments(),
      ServiceOrder.countDocuments({ status: 'pending' }),
      SecondhandOrder.countDocuments(),
      SecondhandOrder.countDocuments({ status: 'pending' }),
      Adoption.countDocuments(),
      Adoption.countDocuments({ status: 'pending' })
    ]);

    return successResponse(res, {
      users: {
        total: totalUsers,
        newToday: newUsersToday,
        active: activeUsersToday
      },
      posts: {
        total: totalPosts,
        newToday: newPostsToday
      },
      orders: {
        service: {
          total: totalServiceOrders,
          pending: pendingServiceOrders
        },
        secondhand: {
          total: totalSecondhandOrders,
          pending: pendingSecondhandOrders
        }
      },
      adoptions: {
        total: totalAdoptions,
        pendingApplications: pendingAdoptionApps
      }
    }, '获取统计数据成功');
  } catch (error) {
    return errorResponse(res, error.message, 500, 'GET_STATISTICS_FAILED');
  }
};
