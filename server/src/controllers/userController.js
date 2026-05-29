import User from '../models/User.js';
import { successResponse, errorResponse } from '../middleware/response.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 获取用户信息
export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    if (!user) {
      return errorResponse(res, '用户不存在', 404, 'USER_NOT_FOUND');
    }
    return successResponse(res, { user });
  } catch (error) {
    return errorResponse(res, error.message, 500, 'GET_PROFILE_FAILED');
  }
};

// 更新用户信息
export const updateProfile = async (req, res) => {
  try {
    const updates = req.body;

    // 不允许直接更新密码和敏感字段
    delete updates.password;
    delete updates.role;
    delete updates.status;

    const user = await User.findByIdAndUpdate(
      req.userId,
      updates,
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return errorResponse(res, '用户不存在', 404, 'USER_NOT_FOUND');
    }

    return successResponse(res, { user }, '更新成功');
  } catch (error) {
    return errorResponse(res, error.message, 500, 'UPDATE_PROFILE_FAILED');
  }
};

// 修改密码
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.userId);

    if (!user) {
      return errorResponse(res, '用户不存在', 404, 'USER_NOT_FOUND');
    }

    // 验证当前密码
    const isPasswordValid = await user.comparePassword(currentPassword);

    if (!isPasswordValid) {
      return errorResponse(res, '当前密码不正确', 401, 'INVALID_PASSWORD');
    }

    // 更新密码（由模型钩子处理加密）
    user.password = newPassword;
    await user.save();

    return successResponse(res, null, '密码修改成功');
  } catch (error) {
    return errorResponse(res, error.message, 500, 'CHANGE_PASSWORD_FAILED');
  }
};

// 上传头像
export const uploadAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return errorResponse(res, '请选择要上传的图片', 400, 'NO_FILE_UPLOADED');
    }

    const avatarUrl = `/uploads/avatars/${req.file.filename}`;
    console.log('👤 [uploadAvatar] 新文件名:', req.file.filename);
    console.log('👤 [uploadAvatar] 新头像URL:', avatarUrl);
    console.log('👤 [uploadAvatar] 用户ID:', req.userId);

    const user = await User.findByIdAndUpdate(
      req.userId,
      { avatar: avatarUrl },
      { new: true, runValidators: true }
    ).select('-password');

    console.log('👤 [uploadAvatar] 更新后头像:', user?.avatar);

    if (!user) {
      return errorResponse(res, '用户不存在', 404, 'USER_NOT_FOUND');
    }

    return successResponse(res, {
      avatar: avatarUrl,
      user
    }, '头像上传成功');
  } catch (error) {
    console.error('👤 [uploadAvatar] 错误:', error);
    return errorResponse(res, error.message, 500, 'UPLOAD_AVATAR_FAILED');
  }
};