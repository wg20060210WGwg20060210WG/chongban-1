import express from 'express';
import { register, login } from '../controllers/authController.js';

const router = express.Router();

// 公开路由（不需要认证）
router.post('/register', register);
router.post('/login', login);

export default router;