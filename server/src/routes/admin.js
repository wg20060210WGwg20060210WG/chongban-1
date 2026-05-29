import express from 'express';
import {
  getUsers,
  banUser,
  reviewPost,
  getReports,
  getStatistics
} from '../controllers/adminController.js';
import { auth, authorize } from '../middleware/auth.js';

const router = express.Router();

// 所有管理接口需要管理员权限
router.use(auth, authorize('admin'));

// 用户管理
router.get('/users', getUsers);
router.put('/users/:userId/ban', banUser);

// 内容审核
router.put('/posts/:postId/review', reviewPost);
router.get('/reports', getReports);

// 数据统计
router.get('/statistics', getStatistics);

export default router;
