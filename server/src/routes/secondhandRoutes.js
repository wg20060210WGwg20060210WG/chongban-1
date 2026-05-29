import express from 'express';
import {
  createItem,
  getItems,
  getItemDetail,
  updateItem,
  deleteItem,
  getMyItems
} from '../controllers/secondhandController.js';
import {
  createOrder,
  getMyOrders,
  getOrderDetail,
  updateOrderStatus,
  confirmReceipt,
  cancelOrder,
  addMessage
} from '../controllers/secondhandOrderController.js';
import { auth } from '../middleware/auth.js';
import { uploadSecondhand, handleUploadError } from '../middleware/upload.js';

const router = express.Router();

// ========== 商品公开路由 ==========
router.get('/', getItems);

// ========== 需要认证的路由 ==========
router.use(auth);

// 商品管理
router.get('/my', getMyItems);
router.get('/detail/:itemId', getItemDetail);
router.post('/', uploadSecondhand.array('images', 10), handleUploadError, createItem);
router.put('/:itemId', uploadSecondhand.array('images', 10), handleUploadError, updateItem);
router.delete('/:itemId', deleteItem);

// 订单管理
router.post('/orders', createOrder);
router.get('/orders/my', getMyOrders);
router.get('/orders/:orderId', getOrderDetail);
router.put('/orders/:orderId/status', updateOrderStatus);
router.put('/orders/:orderId/confirm', confirmReceipt);
router.put('/orders/:orderId/cancel', cancelOrder);
router.post('/orders/:orderId/messages', addMessage);

export default router;
