// 通用工具函数
import mongoose from 'mongoose';

// 生成订单号
export const generateOrderNo = () => {
  const timestamp = Date.now().toString();
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `SO${timestamp}${random}`;
};

// 验证地理坐标
export const validateLocation = (location) => {
  if (!location || !location.coordinates || location.coordinates.length === 0) {
    return true;
  }
  const [lng, lat] = location.coordinates;
  return typeof lng === 'number' && typeof lat === 'number' &&
         lng >= -180 && lng <= 180 && lat >= -90 && lat <= 90;
};

// 结构化日志错误记录
export const logError = (ctx) => (err) => {
  console.error(`[NotifyFailed] ${ctx}`, { 
    error: err.message, 
    stack: err.stack 
  });
};

// 安全的分页参数处理
export const getPaginationParams = (query) => {
  const page = query.page || 1;
  const pageSize = query.pageSize || 10;
  
  const pageNum = Math.max(parseInt(page) || 1, 1);
  const sizeNum = Math.min(Math.max(parseInt(pageSize) || 10, 1), 100);
  const skip = (pageNum - 1) * sizeNum;
  
  return { pageNum, sizeNum, skip };
};

// 构建分页响应数据
export const buildPaginationResponse = (list, total, pageNum, sizeNum) => {
  return {
    list,
    pagination: {
      page: pageNum,
      pageSize: sizeNum,
      total,
      totalPages: Math.ceil(total / sizeNum)
    }
  };
};
