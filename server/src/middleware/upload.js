import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 确保上传目录存在
const uploadDirs = {
  avatars: path.join(__dirname, '../../uploads/avatars'),
  pets: path.join(__dirname, '../../uploads/pets'),
  posts: path.join(__dirname, '../../uploads/posts'),
  services: path.join(__dirname, '../../uploads/services'),
  secondhand: path.join(__dirname, '../../uploads/secondhand'),
  images: path.join(__dirname, '../../uploads/images')
};

// 创建所有上传目录
Object.values(uploadDirs).forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// 宠物照片存储配置
const petStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDirs.pets);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `pet-${uniqueSuffix}${ext}`);
  }
});

// 服务照片存储配置
const serviceStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDirs.services);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `service-${uniqueSuffix}${ext}`);
  }
});

// 二手商品照片存储配置
const secondhandStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDirs.secondhand);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `secondhand-${uniqueSuffix}${ext}`);
  }
});

// 配置存储
const avatarStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDirs.avatars);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `avatar-${uniqueSuffix}${ext}`);
  }
});

// 文件过滤（只允许图片）
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    cb(null, true);
  } else {
    cb(new Error('只支持 jpeg、jpg、png、gif、webp 格式的图片'), false);
  }
};

// 创建 multer 实例
export const uploadAvatar = multer({
  storage: avatarStorage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  }
});

export const uploadPet = multer({
  storage: petStorage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  }
});

export const uploadService = multer({
  storage: serviceStorage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  }
});

export const uploadSecondhand = multer({
  storage: secondhandStorage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  }
});

const imageStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDirs.images);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `img-${uniqueSuffix}${ext}`);
  }
});

export const uploadImage = multer({
  storage: imageStorage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024
  }
});

// 兼容旧的导出
export const upload = uploadAvatar;

// 错误处理中间件
export const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'FILE_TOO_LARGE',
          message: '文件大小不能超过 5MB'
        }
      });
    }
    return res.status(400).json({
      success: false,
      error: {
        code: 'UPLOAD_ERROR',
        message: err.message
      }
    });
  }
  if (err) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_FILE_TYPE',
        message: err.message
      }
    });
  }
  next();
};
