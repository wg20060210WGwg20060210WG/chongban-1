import express from 'express';
import { uploadImage, uploadImages } from '../controllers/uploadController.js';
import { auth } from '../middleware/auth.js';
import { uploadImage as uploadImageMiddleware, handleUploadError } from '../middleware/upload.js';

const router = express.Router();

router.use(auth);

router.post('/image', uploadImageMiddleware.single('file'), handleUploadError, uploadImage);
router.post('/images', uploadImageMiddleware.array('files', 10), handleUploadError, uploadImages);

export default router;
