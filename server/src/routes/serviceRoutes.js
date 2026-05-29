import express from 'express';
import {
  createService,
  getServices,
  getServiceDetail,
  updateService,
  deleteService,
  getMyServices
} from '../controllers/serviceController.js';
import {
  createOrder,
  getMyOrders,
  getOrderDetail,
  confirmOrder,
  updateOrderStatus,
  reviewOrder,
  simulatePayment,
  cancelOrder,
  getServiceReviews
} from '../controllers/serviceOrderController.js';
import { auth, authorize } from '../middleware/auth.js';
import { uploadService, handleUploadError } from '../middleware/upload.js';

const router = express.Router();

// ========== 服务公开路由 ==========
router.get('/getServices', getServices);
router.get('/:id/getServiceDetail', getServiceDetail);
router.get('/:id/getServiceReviews', getServiceReviews);

// ========== 需要认证的路由 ==========
router.use(auth);

// 服务管理（需要用户、商户或管理员角色）
router.post('/createService',
  authorize('user', 'merchant', 'admin'),
  uploadService.array('images', 10),
  handleUploadError,
  createService
);
router.get('/my/getMyServices', authorize('user', 'merchant', 'admin'), getMyServices);
router.put('/:id/updateService',
  uploadService.array('images', 10),
  handleUploadError,
  updateService
);
router.delete('/:id/deleteService', deleteService);

// 订单管理
router.post('/orders/createOrder', createOrder);
router.get('/orders/my/getMyOrders', getMyOrders);
router.get('/orders/:id/getOrderDetail', getOrderDetail);
router.put('/orders/:id/confirmOrder', confirmOrder);
router.put('/orders/:id/updateOrderStatus', updateOrderStatus);
router.post('/orders/:id/reviewOrder', reviewOrder);
router.post('/orders/:id/simulatePayment', simulatePayment);
router.put('/orders/:id/cancelOrder', cancelOrder);

export default router;
