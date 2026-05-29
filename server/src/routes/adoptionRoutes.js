import express from 'express';
import {
  createAdoption,
  getAdoptions,
  getAdoptionDetail,
  updateAdoption,
  deleteAdoption,
  getMyAdoptions,
  applyAdoption,
  getMyApplications,
  getAdoptionApplications,
  reviewApplication,
  cancelApplication,
  addFollowUp
} from '../controllers/adoptionController.js';
import { auth, authorize } from '../middleware/auth.js';

const router = express.Router();

// 公开路由 - 获取领养列表和详情不需要登录
router.get('/getAdoptions', getAdoptions);
router.get('/:id/getAdoptionDetail', getAdoptionDetail);

// 以下路由需要认证
router.use(auth);

// 发布领养信息（所有登录用户均可发布）
router.post('/createAdoption', authorize('user', 'rescuer', 'admin', 'merchant'), createAdoption);

// 获取我发布的领养列表
router.get('/my/getMyAdoptions', getMyAdoptions);

// 更新领养信息
router.put('/:id/updateAdoption', updateAdoption);

// 关闭/删除领养信息
router.delete('/:id/deleteAdoption', deleteAdoption);

// 提交领养申请
router.post('/:id/applyAdoption', applyAdoption);

// 获取我的领养申请
router.get('/applications/my/getMyApplications', getMyApplications);

// 获取某个领养的所有申请（发布者查看）
router.get('/:id/applications/getAdoptionApplications', getAdoptionApplications);

// 审核领养申请
router.put('/applications/:id/reviewApplication', reviewApplication);

// 取消领养申请
router.put('/applications/:id/cancelApplication', cancelApplication);

// 添加回访记录
router.post('/applications/:id/addFollowUp', addFollowUp);

export default router;
