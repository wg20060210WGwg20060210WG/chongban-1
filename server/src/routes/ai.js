import express from 'express';
import {
  consult,
  getConsultations,
  getConsultationDetail,
  getGuide,
  submitFeedback,
  createConversation,
  getConversations,
  getConversationDetail,
  deleteConversation,
  getMessages,
  sendMessageStream,
  sendMessage
} from '../controllers/aiController.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

// ========== 需要认证的路由 ==========
router.use(auth);

// ========== 对话式API（新） ==========

// 对话管理
router.post('/conversations', createConversation);
router.get('/conversations', getConversations);
router.get('/conversations/:id', getConversationDetail);
router.delete('/conversations/:id', deleteConversation);

// 消息管理
router.get('/conversations/:id/messages', getMessages);
router.post('/conversations/:id/messages/stream', sendMessageStream);
router.post('/conversations/:id/messages', sendMessage);

// ========== 旧版API（保留兼容） ==========

// AI问诊
router.post('/consult', consult);

// 获取问诊历史
router.get('/consultations', getConsultations);

// 获取单条问诊详情（必须在 /consultations 之后、:consultationId 之前）
router.get('/consultations/:id', getConsultationDetail);

// AI养宠指南
router.post('/guide', getGuide);

// 提交问诊反馈
router.post('/consultations/:consultationId/feedback', submitFeedback);

export default router;