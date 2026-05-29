import { successResponse, errorResponse } from '../middleware/response.js';

export const uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return errorResponse(res, '请选择要上传的图片', 400, 'NO_FILE_UPLOADED');
    }

    const url = `/uploads/images/${req.file.filename}`;

    return successResponse(res, {
      url,
      filename: req.file.filename,
      size: req.file.size
    }, '图片上传成功');
  } catch (error) {
    return errorResponse(res, error.message, 500, 'UPLOAD_IMAGE_FAILED');
  }
};

export const uploadImages = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return errorResponse(res, '请选择要上传的图片', 400, 'NO_FILE_UPLOADED');
    }

    const urls = req.files.map(file => `/uploads/images/${file.filename}`);

    return successResponse(res, { urls }, '批量上传成功');
  } catch (error) {
    return errorResponse(res, error.message, 500, 'UPLOAD_IMAGES_FAILED');
  }
};
