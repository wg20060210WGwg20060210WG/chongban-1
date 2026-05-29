import express from 'express';
import {
  createComment,
  getPostComments,
  deleteComment
} from '../controllers/commentController.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

router.get('/post/:postId', getPostComments);

router.use(auth);
router.post('/', createComment);
router.delete('/:id', deleteComment);

export default router;
