import express from 'express';
import { auth } from '../middleware/auth.js';
import * as notificationController from '../controllers/notificationController.js';

const router = express.Router();

router.use(auth);

router.get('/', notificationController.getNotifications);
router.get('/unread-count', notificationController.getUnreadCount);
router.put('/read-all', notificationController.markAllAsRead);
router.put('/:notificationId/read', notificationController.markAsRead);

export default router;
