import express from 'express';
import {
  toggleInteraction,
  toggleFollow,
  checkInteraction
} from '../controllers/interactionController.js';
import { auth, optionalAuth } from '../middleware/auth.js';

const router = express.Router();

router.get('/check/:targetType/:targetId', optionalAuth, checkInteraction);

router.use(auth);
router.post('/toggle', toggleInteraction);
router.post('/follow', toggleFollow);

export default router;
