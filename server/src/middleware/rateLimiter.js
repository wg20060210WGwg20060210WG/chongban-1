import rateLimit from 'express-rate-limit';

// 登录/注册严格限流：15分钟内最多10次
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: '请求过于频繁，请15分钟后再试',
    code: 'RATE_LIMIT_EXCEEDED'
  }
});

// 普通 API 限流：1分钟内最多100次
export const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: '请求过于频繁，请稍后再试',
    code: 'RATE_LIMIT_EXCEEDED'
  }
});