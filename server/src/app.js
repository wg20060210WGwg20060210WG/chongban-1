import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';
import { errorResponse } from './middleware/response.js';
import { authLimiter, apiLimiter } from './middleware/rateLimiter.js';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import petRoutes from './routes/petRoutes.js';
import postRoutes from './routes/postRoutes.js';
import commentRoutes from './routes/commentRoutes.js';
import interactionRoutes from './routes/interactionRoutes.js';
import adoptionRoutes from './routes/adoptionRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import serviceRoutes from './routes/serviceRoutes.js';
import secondhandRoutes from './routes/secondhandRoutes.js';
import aiRoutes from './routes/ai.js';
import adminRoutes from './routes/admin.js';
import uploadRoutes from './routes/upload.js';

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 基础路由配置
app.use(helmet()); // 安全头部
app.use(cors());  // 跨域支持
app.use(morgan('combined'));  // 请求日志
app.use(express.json());  // JSON解析
app.use(express.urlencoded({ extended: true }));  // URL编码

// 静态文件服务（上传的文件）— 在 helmet 之后，手动设置 CORP
app.use('/uploads', (req, res, next) => {
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  next();
}, express.static(path.join(__dirname, '../uploads')));

// 健康路由
app.get('/health',(req,res)=>{
    res.status(200).json({
        status:'OK',
        timestamp: new Date().toISOString(),
        uptime:process.uptime()
    })
})

// 根路由
app.get('/',(req,res)=>{
    res.status(200).json({
        message:'宠伴后端服务启动成功',
        version: '1.0.0',
        timestamp: new Date().toISOString()
    })
})

// API v1 路由
app.use('/api/v1/auth', authLimiter, authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/pets', petRoutes);
app.use('/api/v1/posts', postRoutes);
app.use('/api/v1/comments', commentRoutes);
app.use('/api/v1/interactions', interactionRoutes);
app.use('/api/v1/adoptions', adoptionRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/services', serviceRoutes);
app.use('/api/v1/secondhand', secondhandRoutes);
app.use('/api/v1/ai', aiRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/upload', uploadRoutes);

// 404错误处理 - 放在所有路由之后
app.use((req, res) => {
  return errorResponse(res, '路由不存在', 404, 'NOT_FOUND', { path: req.originalUrl });
});

app.use((err, req, res, next) => {
  console.error('服务器错误', err);
  const details = process.env.NODE_ENV === 'development' ? { message: err.message } : null;
  return errorResponse(res, '服务器内部错误', 500, 'INTERNAL_SERVER_ERROR', details);
});

export default app;