import jwt from 'jsonwebtoken';
import 'dotenv/config';
import { errorResponse } from './response.js';
import User from '../models/User.js';

export const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return errorResponse(res, '请先登录', 401, 'AUTH_TOKEN_MISSING');
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 验证用户是否仍存在且未被封禁
    const user = await User.findById(decoded.userId).select('status bannedUntil');
    if (!user) {
      return errorResponse(res, '用户不存在', 401, 'AUTH_USER_NOT_FOUND');
    }
    if (user.status === 'banned') {
      if (user.bannedUntil && new Date(user.bannedUntil) < new Date()) {
        // 封禁已过期，自动解封
        user.status = 'active';
        user.bannedUntil = null;
        await user.save();
      } else {
        return errorResponse(res, '账号已被封禁', 403, 'AUTH_USER_BANNED');
      }
    }

    req.userId = decoded.userId;
    req.role = decoded.role;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return errorResponse(res, '认证令牌已过期，请重新登录', 401, 'AUTH_TOKEN_EXPIRED');
    }
    if (error.name === 'JsonWebTokenError') {
      return errorResponse(res, '无效的认证令牌', 401, 'AUTH_TOKEN_INVALID');
    }
    return errorResponse(res, '认证失败', 401, 'AUTH_TOKEN_INVALID');
  }
};

export const optionalAuth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.userId = decoded.userId;
      req.role = decoded.role;
    }
  } catch (error) {
    if (error.name !== 'TokenExpiredError' && error.name !== 'JsonWebTokenError') {
      console.error('[optionalAuth] 意外错误:', error.message);
    }
  }
  next();
};

export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.role)) {
      return errorResponse(res, '您没有执行此操作的权限', 403, 'AUTH_PERMISSION_DENIED');
    }
    next();
  };
};
