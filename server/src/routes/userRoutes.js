import express from 'express';
import { updateProfile, changePassword, getProfile, uploadAvatar } from '../controllers/userController.js';
import { auth } from '../middleware/auth.js';
import { uploadAvatar as upload, handleUploadError } from '../middleware/upload.js';

const router = express.Router();

// 需要认证的路由
router.get('/profile', auth, getProfile);
router.put('/profile', auth, updateProfile);
router.put('/password', auth, changePassword);
router.post('/avatar', auth, upload.single('avatar'), handleUploadError, uploadAvatar);

export default router;