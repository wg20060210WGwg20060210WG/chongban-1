import express from 'express';
import {
  createPet,
  getMyPets,
  getPetProfile,
  updatePetProfile,
  deletePetProfile,
  addHealthRecord,
  deleteHealthRecord,
  getHealthReminders,
  uploadPetAvatar,
  uploadPetPhotos,
  deletePetPhoto
} from '../controllers/petController.js';
import { auth } from '../middleware/auth.js';
import { uploadPet, handleUploadError } from '../middleware/upload.js';

const router = express.Router();

// 所有路由都需要认证
router.use(auth);

// 创建宠物档案
router.post('/createPetProfile', createPet);

// 获取当前用户的宠物列表
router.get('/my-pets', getMyPets);

// 获取宠物详情
router.get('/:id/getPetProfile', getPetProfile);

// 更新宠物信息
router.put('/:id/updatePetProfile', updatePetProfile);

// 删除宠物档案
router.delete('/:id/deletePetProfile', deletePetProfile);

// 添加健康记录
router.post('/:id/health-record', addHealthRecord);

// 删除健康记录
router.delete('/:id/health-record/:type/:recordId', deleteHealthRecord);

// 上传宠物头像
router.post('/:id/upload-avatar', uploadPet.single('avatar'), handleUploadError, uploadPetAvatar);

// 上传宠物照片（多张）
router.post('/:id/upload-photos', uploadPet.array('photos', 10), handleUploadError, uploadPetPhotos);

// 删除宠物照片
router.delete('/:id/delete-photo', deletePetPhoto);

// 获取健康提醒
router.get('/health-reminders', getHealthReminders);

export default router;
