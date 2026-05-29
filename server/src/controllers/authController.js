import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { successResponse, errorResponse } from '../middleware/response.js';

// 注册
export const register = async (req, res) => {
  console.log('📥 收到注册请求, req.body:', JSON.stringify(req.body, null, 2));
  try {
    const { username, email, password, role } = req.body;
    const phone = req.body.phone?.trim() || undefined;
    console.log('📋 处理后的注册数据:', { username, email, phone, password: '***' });

    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    });

    if (existingUser) {
      return errorResponse(res, '用户名或邮箱已存在', 400, 'USER_EXISTS');
    }

    if (phone) {
      const existingPhone = await User.findOne({ phone });
      if (existingPhone) {
        return errorResponse(res, '该手机号已被注册', 400, 'PHONE_EXISTS');
      }
    }

    const user = new User({
      username,
      email,
      password,
      phone: phone || undefined,
      role: role || 'user'
    });

    await user.save();
    console.log('✅ 注册成功:', user._id, user.username);

    return successResponse(res, null, '注册成功', 201);
  } catch (error) {
    console.error('❌ 注册失败, 错误详情:', {
      name: error.name,
      message: error.message,
      code: error.code,
      keyPattern: error.keyPattern,
      keyValue: error.keyValue,
      stack: error.stack
    });
    let message = '注册失败，请稍后再试';
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      const fieldNames = { username: '用户名', email: '邮箱', phone: '手机号' };
      message = `${fieldNames[field] || field}已被注册`;
    } else if (error.name === 'ValidationError') {
      const firstError = Object.values(error.errors)[0];
      message = firstError?.message || '数据验证失败';
    }
    return errorResponse(res, message, 400, 'REGISTER_FAILED');
  }
};

// 登录
export const login = async (req, res) => {
  console.log('📥 收到登录请求, req.body:', JSON.stringify(req.body, null, 2));
  try {
    const { account, password } = req.body;

    if (!account || !password) {
      return errorResponse(res, '请输入账号和密码', 400, 'MISSING_CREDENTIALS');
    }

    // 根据输入格式来判断登录类型
    let query = {};

    // 手机号11位数字
    const isPhone = /^1[3-9]\d{9}$/.test(account);
    // 邮箱包含@
    const isEmail = account.includes('@');

    if (isPhone) {
      query = { phone: account };
    } else if (isEmail) {
      query = { email: account };
    } else {
      query = { username: account };
    }

    // 查找用户
    console.log('🔍 使用查询条件:', query);
    const user = await User.findOne(query);
    console.log('👤 找到的用户:', user ? { _id: user._id, username: user.username, email: user.email } : null);
    if (!user) {
      return errorResponse(res, '账号或密码错误', 401, 'INVALID_CREDENTIALS');
    }

    // 验证密码（使用模型实例方法）
    const isPasswordValid = await user.comparePassword(password);
    console.log('🔑 密码验证结果:', isPasswordValid);
    if (!isPasswordValid) {
      return errorResponse(res, '账号或密码错误', 401, 'INVALID_CREDENTIALS');
    }

    // 检查账号状态
    if (user.status === 'banned') {
      if (user.bannedUntil && user.bannedUntil < new Date()) {
        user.status = 'active';
        user.bannedUntil = null;
        await user.save();
      } else {
        return errorResponse(res, '账号已被封禁', 403, 'ACCOUNT_BANNED');
      }
    }

    // 生成JWT令牌
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    console.log('✅ 登录成功:', user._id, user.username);
    return successResponse(res, {
      token,
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        phone: user.phone,
        avatar: user.avatar
      }
    }, '登录成功');
  } catch (error) {
    console.error('❌ 登录失败, 错误详情:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    return errorResponse(res, error.message, 500, 'LOGIN_FAILED');
  }
};