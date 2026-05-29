import Post from '../models/Post.js';
import { successResponse, errorResponse } from '../middleware/response.js';

// 允许前端提交的字段白名单
const ALLOWED_POST_FIELDS = [
  'type', 'title', 'content', 'images', 'videos',
  'channel', 'topics', 'petTag', 'location', 'visibility'
];

// 过滤请求体，只保留允许的字段
const filterPostBody = (body) => {
  const filtered = {};
  ALLOWED_POST_FIELDS.forEach(field => {
    if (body[field] !== undefined) {
      filtered[field] = body[field];
    }
  });
  return filtered;
};

// 创建帖子
export const createPost = async (req, res) => {
  try {
    const postData = {
      ...filterPostBody(req.body),
      authorId: req.userId
    };

    const post = new Post(postData);
    await post.save();

    return successResponse(res, { post }, '发布成功', 201);
  } catch (error) {
    console.error('创建帖子错误:', error);
    return errorResponse(res, error.message, 500, 'CREATE_POST_FAILED');
  }
};

// 获取帖子列表
export const getPosts = async (req, res) => {
  try {
    const {
      page = 1,
      pageSize = 10,
      type,
      channel,
      topic,
      city,
      keyword,
      authorId,
      sortBy = 'createdAt'
    } = req.query;

    const safePage = Math.max(1, parseInt(page));
    const safePageSize = Math.min(50, Math.max(1, parseInt(pageSize)));

    const query = { status: 'published' };
    if (type) query.type = type;
    if (channel) query.channel = channel;
    if (topic) query.topics = topic;
    if (city) query['location.city'] = city;
    if (authorId) query.authorId = authorId;
    if (keyword) {
      const regex = new RegExp(keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      query.$or = [
        { title: regex },
        { content: regex },
        { channel: regex },
        { topics: regex }
      ];
    }

    const sortOptions = {
      latest: { createdAt: -1 },
      hot: { hotScore: -1 },
      popular: { 'stats.likeCount': -1 }
    };

    const posts = await Post.find(query)
      .populate('authorId', 'username avatar')
      .sort(sortOptions[sortBy] || sortOptions.latest)
      .skip((safePage - 1) * safePageSize)
      .limit(safePageSize);

    const total = await Post.countDocuments(query);

    return successResponse(res, {
      list: posts,
      pagination: {
        page: safePage,
        pageSize: safePageSize,
        total,
        totalPages: Math.ceil(total / safePageSize)
      }
    });
  } catch (error) {
    return errorResponse(res, error.message, 500, 'GET_POSTS_FAILED');
  }
};

// 获取帖子详情
export const getPostById = async (req, res) => {
  try {
    // 一次查询：查找未删除的帖子并增加浏览量
    const post = await Post.findOneAndUpdate(
      { _id: req.params.id, status: { $ne: 'deleted' } },
      { $inc: { 'stats.viewCount': 1 } },
      { new: true }
    ).populate('authorId', 'username avatar');

    if (!post) {
      // 区分不存在和已删除
      const checkPost = await Post.findById(req.params.id).select('_id status');
      if (!checkPost) {
        return errorResponse(res, '帖子不存在', 404, 'POST_NOT_FOUND');
      }
      return errorResponse(res, '帖子已被删除', 404, 'POST_DELETED');
    }

    return successResponse(res, { post });
  } catch (error) {
    if (error.name === 'CastError') {
      return errorResponse(res, '无效的帖子ID', 400, 'INVALID_ID');
    }
    return errorResponse(res, error.message, 500, 'GET_POST_FAILED');
  }
};

// 更新帖子
export const updatePost = async (req, res) => {
  try {
    const query = { _id: req.params.id };
    
    // 非管理员只能修改自己的帖子
    if (req.role !== 'admin') {
      query.authorId = req.userId;
    }

    const updatedPost = await Post.findOneAndUpdate(
      query,
      filterPostBody(req.body),
      { new: true, runValidators: true }
    ).populate('authorId', 'username avatar');

    if (!updatedPost) {
      const post = await Post.findById(req.params.id);
      if (!post) {
        return errorResponse(res, '帖子不存在', 404, 'POST_NOT_FOUND');
      }
      return errorResponse(res, '您没有权限修改此帖子', 403, 'FORBIDDEN');
    }

    return successResponse(res, { post: updatedPost }, '更新成功');
  } catch (error) {
    if (error.name === 'CastError') {
      return errorResponse(res, '无效的帖子ID', 400, 'INVALID_ID');
    }
    return errorResponse(res, error.message, 500, 'UPDATE_POST_FAILED');
  }
};

// 删除帖子
export const deletePost = async (req, res) => {
  try {
    const query = { _id: req.params.id };
    
    // 非管理员只能删除自己的帖子
    if (req.role !== 'admin') {
      query.authorId = req.userId;
    }

    const deletedPost = await Post.findOneAndUpdate(
      query,
      { status: 'deleted' },
      { new: true }
    );

    if (!deletedPost) {
      const post = await Post.findById(req.params.id);
      if (!post) {
        return errorResponse(res, '帖子不存在', 404, 'POST_NOT_FOUND');
      }
      return errorResponse(res, '您没有权限删除此帖子', 403, 'FORBIDDEN');
    }

    return successResponse(res, null, '删除成功');
  } catch (error) {
    if (error.name === 'CastError') {
      return errorResponse(res, '无效的帖子ID', 400, 'INVALID_ID');
    }
    return errorResponse(res, error.message, 500, 'DELETE_POST_FAILED');
  }
};
