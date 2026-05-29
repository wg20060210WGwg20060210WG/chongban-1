import express from 'express';
import {
  createPost,
  getPosts,
  getPostById,
  updatePost,
  deletePost
} from '../controllers/postController.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

router.get('/', getPosts);
router.get('/:id', getPostById);
router.use(auth);
router.post('/', createPost);
router.put('/:id', updatePost);
router.delete('/:id', deletePost);

export default router;
