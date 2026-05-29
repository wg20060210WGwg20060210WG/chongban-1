import AIConsultation from '../models/AIConsultation.js';
import AIConversation from '../models/AIConversation.js';
import AIMessage from '../models/AIMessage.js';
import Pet from '../models/Pet.js';
import aiService from '../services/aiService.js';
import { successResponse, errorResponse } from '../middleware/response.js';
import { getPaginationParams, buildPaginationResponse } from '../utils/helpers.js';

// AI问诊
export const consult = async (req, res) => {
  try {
    const { petId, symptoms, images, duration, severity } = req.body;

    if (!petId) {
      return errorResponse(res, '宠物ID是必填项', 400, 'PET_ID_REQUIRED');
    }
    if (!symptoms) {
      return errorResponse(res, '症状描述是必填项', 400, 'SYMPTOMS_REQUIRED');
    }

    const pet = await Pet.findById(petId);
    if (!pet) {
      return errorResponse(res, '宠物不存在', 404, 'PET_NOT_FOUND');
    }

    if (pet.ownerId.toString() !== req.userId.toString() && req.role !== 'admin') {
      return errorResponse(res, '无权访问该宠物信息', 403, 'FORBIDDEN');
    }

    const petInfo = {
      species: pet.species,
      breed: pet.breed,
      name: pet.name
    };

    const { analysis: aiAnalysis, apiResponse } = await aiService.consultPet(symptoms, petInfo, { duration, severity });

    const consultation = await AIConsultation.create({
      userId: req.userId,
      petId,
      symptoms,
      images: images || [],
      duration,
      severity: severity || 'moderate',
      aiAnalysis,
      aiModel: 'doubao',
      apiResponse // 保存原始AI响应用于调试
    });

    await consultation.populate('petId', 'name species breed');

    return successResponse(res, { consultationId: consultation._id, aiAnalysis, consultation }, '问诊完成');
  } catch (error) {
    return errorResponse(res, error.message, 500, 'CONSULT_FAILED');
  }
};

// 获取问诊历史
export const getConsultations = async (req, res) => {
  try {
    const { petId } = req.query;
    const { pageNum, sizeNum, skip } = getPaginationParams(req.query);

    const query = {};
    if (req.role !== 'admin') {
      query.userId = req.userId;
    }
    if (petId) {
      query.petId = petId;
    }

    const consultations = await AIConsultation.find(query)
      .populate('petId', 'name species breed avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(sizeNum);

    const total = await AIConsultation.countDocuments(query);

    return successResponse(res, buildPaginationResponse(consultations, total, pageNum, sizeNum));
  } catch (error) {
    return errorResponse(res, error.message, 500, 'GET_CONSULTATIONS_FAILED');
  }
};

// AI养宠指南
export const getGuide = async (req, res) => {
  try {
    const { petId, type = 'feeding' } = req.body;

    if (!petId) {
      return errorResponse(res, '宠物ID是必填项', 400, 'PET_ID_REQUIRED');
    }

    const validTypes = ['feeding', 'training', 'health', 'behavior'];
    if (!validTypes.includes(type)) {
      return errorResponse(res, '无效的指南类型', 400, 'INVALID_GUIDE_TYPE');
    }

    const pet = await Pet.findById(petId);
    if (!pet) {
      return errorResponse(res, '宠物不存在', 404, 'PET_NOT_FOUND');
    }

    if (pet.ownerId.toString() !== req.userId.toString() && req.role !== 'admin') {
      return errorResponse(res, '无权访问该宠物信息', 403, 'FORBIDDEN');
    }

    const petInfo = {
      species: pet.species,
      breed: pet.breed,
      name: pet.name
    };

    const guide = await aiService.getPetGuide(petInfo, type);

    return successResponse(res, { guide }, '获取指南成功');
  } catch (error) {
    return errorResponse(res, error.message, 500, 'GET_GUIDE_FAILED');
  }
};

// 获取单条问诊详情
export const getConsultationDetail = async (req, res) => {
  try {
    const { id } = req.params;

    const consultation = await AIConsultation.findById(id)
      .populate('petId', 'name species breed avatar');

    if (!consultation) {
      return errorResponse(res, '问诊记录不存在', 404, 'CONSULTATION_NOT_FOUND');
    }

    if (consultation.userId.toString() !== req.userId.toString() && req.role !== 'admin') {
      return errorResponse(res, '无权访问该问诊记录', 403, 'FORBIDDEN');
    }

    return successResponse(res, { consultation });
  } catch (error) {
    return errorResponse(res, error.message, 500, 'GET_CONSULTATION_DETAIL_FAILED');
  }
};

// 提交问诊反馈
export const submitFeedback = async (req, res) => {
  try {
    const { consultationId } = req.params;
    const { isHelpful, comment, actualDiagnosis } = req.body;

    const consultation = await AIConsultation.findById(consultationId);
    if (!consultation) {
      return errorResponse(res, '问诊记录不存在', 404, 'CONSULTATION_NOT_FOUND');
    }

    if (consultation.userId.toString() !== req.userId.toString() && req.role !== 'admin') {
      return errorResponse(res, '无权操作该问诊记录', 403, 'FORBIDDEN');
    }

    consultation.feedback = {
      isHelpful: isHelpful !== undefined ? isHelpful : consultation.feedback?.isHelpful,
      comment: comment || consultation.feedback?.comment,
      actualDiagnosis: actualDiagnosis || consultation.feedback?.actualDiagnosis
    };

    await consultation.save();

    return successResponse(res, { consultation }, '反馈提交成功');
  } catch (error) {
    return errorResponse(res, error.message, 500, 'SUBMIT_FEEDBACK_FAILED');
  }
};

// ========== 对话式API ==========

// 创建对话
export const createConversation = async (req, res) => {
  try {
    const { petId, type = 'consultation', title } = req.body;

    // 验证宠物归属
    if (petId) {
      const pet = await Pet.findById(petId);
      if (!pet) {
        return errorResponse(res, '宠物不存在', 404, 'PET_NOT_FOUND');
      }
      if (pet.ownerId.toString() !== req.userId.toString() && req.role !== 'admin') {
        return errorResponse(res, '无权访问该宠物信息', 403, 'FORBIDDEN');
      }
    }

    const conversation = await AIConversation.create({
      userId: req.userId,
      petId: petId || null,
      type,
      title: title || '新对话'
    });

    await conversation.populate('petId', 'name species breed avatar');

    return successResponse(res, { conversation }, '对话创建成功');
  } catch (error) {
    return errorResponse(res, error.message, 500, 'CREATE_CONVERSATION_FAILED');
  }
};

// 获取对话列表
export const getConversations = async (req, res) => {
  try {
    const { pageNum, sizeNum, skip } = getPaginationParams(req.query);
    const { type, status = 'active' } = req.query;

    const query = { userId: req.userId, status };
    if (type) query.type = type;

    const conversations = await AIConversation.find(query)
      .populate('petId', 'name species breed avatar')
      .sort({ lastMessageAt: -1 })
      .skip(skip)
      .limit(sizeNum);

    const total = await AIConversation.countDocuments(query);

    return successResponse(res, buildPaginationResponse(conversations, total, pageNum, sizeNum));
  } catch (error) {
    return errorResponse(res, error.message, 500, 'GET_CONVERSATIONS_FAILED');
  }
};

// 获取对话详情
export const getConversationDetail = async (req, res) => {
  try {
    const { id } = req.params;

    const conversation = await AIConversation.findById(id)
      .populate('petId', 'name species breed avatar');

    if (!conversation) {
      return errorResponse(res, '对话不存在', 404, 'CONVERSATION_NOT_FOUND');
    }

    if (conversation.userId.toString() !== req.userId.toString() && req.role !== 'admin') {
      return errorResponse(res, '无权访问该对话', 403, 'FORBIDDEN');
    }

    return successResponse(res, { conversation });
  } catch (error) {
    return errorResponse(res, error.message, 500, 'GET_CONVERSATION_DETAIL_FAILED');
  }
};

// 删除对话（软删除）
export const deleteConversation = async (req, res) => {
  try {
    const { id } = req.params;

    const conversation = await AIConversation.findById(id);
    if (!conversation) {
      return errorResponse(res, '对话不存在', 404, 'CONVERSATION_NOT_FOUND');
    }

    if (conversation.userId.toString() !== req.userId.toString() && req.role !== 'admin') {
      return errorResponse(res, '无权删除该对话', 403, 'FORBIDDEN');
    }

    conversation.status = 'archived';
    await conversation.save();

    return successResponse(res, null, '对话已删除');
  } catch (error) {
    return errorResponse(res, error.message, 500, 'DELETE_CONVERSATION_FAILED');
  }
};

// 获取对话消息历史
export const getMessages = async (req, res) => {
  try {
    const { id } = req.params;
    const { pageNum, sizeNum, skip } = getPaginationParams(req.query);

    const conversation = await AIConversation.findById(id);
    if (!conversation) {
      return errorResponse(res, '对话不存在', 404, 'CONVERSATION_NOT_FOUND');
    }

    if (conversation.userId.toString() !== req.userId.toString() && req.role !== 'admin') {
      return errorResponse(res, '无权访问该对话', 403, 'FORBIDDEN');
    }

    const messages = await AIMessage.find({ conversationId: id })
      .sort({ createdAt: 1 })
      .skip(skip)
      .limit(sizeNum);

    const total = await AIMessage.countDocuments({ conversationId: id });

    return successResponse(res, buildPaginationResponse(messages, total, pageNum, sizeNum));
  } catch (error) {
    return errorResponse(res, error.message, 500, 'GET_MESSAGES_FAILED');
  }
};

// 发送消息并获取AI回复（SSE流式）
export const sendMessageStream = async (req, res) => {
  try {
    const { id } = req.params;
    const { content, petId, symptoms, duration, severity, images, guideType } = req.body;

    if (!content) {
      return errorResponse(res, '消息内容是必填项', 400, 'CONTENT_REQUIRED');
    }

    const conversation = await AIConversation.findById(id);
    if (!conversation) {
      return errorResponse(res, '对话不存在', 404, 'CONVERSATION_NOT_FOUND');
    }

    if (conversation.userId.toString() !== req.userId.toString() && req.role !== 'admin') {
      return errorResponse(res, '无权访问该对话', 403, 'FORBIDDEN');
    }

    // 获取宠物信息
    let petInfo = null;
    const effectivePetId = petId || conversation.petId;
    if (effectivePetId) {
      const pet = await Pet.findById(effectivePetId);
      if (pet) {
        petInfo = { species: pet.species, breed: pet.breed, name: pet.name };
        // 更新对话的宠物ID
        if (!conversation.petId && petId) {
          conversation.petId = petId;
          await conversation.save();
        }
      }
    }

    // 保存用户消息
    const userMessage = await AIMessage.create({
      conversationId: id,
      role: 'user',
      content,
      contentType: images?.length > 0 ? 'image' : 'text',
      metadata: { symptoms: symptoms || content, duration, severity, images: images || [] }
    });

    // 更新对话标题（如果是第一条消息）
    if (conversation.messageCount === 0) {
      conversation.title = content.substring(0, 50) + (content.length > 50 ? '...' : '');
    }
    conversation.messageCount += 1;
    conversation.lastMessageAt = new Date();
    await conversation.save();

    // 获取历史消息用于上下文
    const recentMessages = await AIMessage.find({ conversationId: id })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    const context = recentMessages.reverse().map(m => ({
      role: m.role,
      content: m.content
    }));

    // 设置SSE响应头
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');

    // 发送用户消息ID
    res.write(`data: ${JSON.stringify({ type: 'user_message', messageId: userMessage._id })}\n\n`);

    // 调用AI服务（流式）
    let fullResponse = '';
    let aiMetadata = {};

    try {
      const onChunk = (chunk) => {
        res.write(`data: ${JSON.stringify({ type: 'chunk', content: chunk })}\n\n`);
      };

      const onDone = async (responseText) => {
        fullResponse = responseText;

        // 解析AI响应获取元数据
        if (conversation.type === 'guide' || guideType) {
          aiMetadata = { guideType: guideType || 'feeding', guideContent: fullResponse };
        } else {
          aiMetadata = {
            possibleDiseases: aiService.extractDiseases(fullResponse),
            needsVet: aiService.extractNeedsVet(fullResponse),
            urgency: aiService.extractUrgency(fullResponse),
            homeCareTips: aiService.extractHomeCareTips(fullResponse),
            suggestions: fullResponse
          };
        }

        // 保存AI回复
        const aiMessage = await AIMessage.create({
          conversationId: id,
          role: 'assistant',
          content: fullResponse,
          contentType: 'card',
          metadata: aiMetadata
        });

        // 更新对话消息数
        conversation.messageCount += 1;
        conversation.lastMessageAt = new Date();
        await conversation.save();

        // 发送完成事件
        res.write(`data: ${JSON.stringify({
          type: 'done',
          messageId: aiMessage._id,
          metadata: aiMetadata
        })}\n\n`);

        res.end();
      };

      if (conversation.type === 'guide' || guideType) {
        // 养宠指南流式
        await aiService.getPetGuideStream(
          petInfo || { species: '通用' },
          guideType || 'feeding',
          onChunk,
          onDone
        );
      } else {
        // 问诊对话流式
        await aiService.consultPetStream(
          symptoms || content,
          petInfo || { species: '通用' },
          { duration, severity: severity || 'moderate' },
          onChunk,
          onDone
        );
      }

    } catch (aiError) {
      res.write(`data: ${JSON.stringify({ type: 'error', message: aiError.message })}\n\n`);
      res.end();
    }
  } catch (error) {
    if (!res.headersSent) {
      return errorResponse(res, error.message, 500, 'SEND_MESSAGE_FAILED');
    }
  }
};

// 发送消息（非流式，兼容旧版）
export const sendMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const { content, petId, symptoms, duration, severity, images, guideType } = req.body;

    if (!content) {
      return errorResponse(res, '消息内容是必填项', 400, 'CONTENT_REQUIRED');
    }

    const conversation = await AIConversation.findById(id);
    if (!conversation) {
      return errorResponse(res, '对话不存在', 404, 'CONVERSATION_NOT_FOUND');
    }

    if (conversation.userId.toString() !== req.userId.toString() && req.role !== 'admin') {
      return errorResponse(res, '无权访问该对话', 403, 'FORBIDDEN');
    }

    // 获取宠物信息
    let petInfo = null;
    const effectivePetId = petId || conversation.petId;
    if (effectivePetId) {
      const pet = await Pet.findById(effectivePetId);
      if (pet) {
        petInfo = { species: pet.species, breed: pet.breed, name: pet.name };
        if (!conversation.petId && petId) {
          conversation.petId = petId;
          await conversation.save();
        }
      }
    }

    // 保存用户消息
    const userMessage = await AIMessage.create({
      conversationId: id,
      role: 'user',
      content,
      contentType: images?.length > 0 ? 'image' : 'text',
      metadata: { symptoms: symptoms || content, duration, severity, images: images || [] }
    });

    // 更新对话
    if (conversation.messageCount === 0) {
      conversation.title = content.substring(0, 50) + (content.length > 50 ? '...' : '');
    }
    conversation.messageCount += 1;
    conversation.lastMessageAt = new Date();
    await conversation.save();

    // 调用AI服务
    let aiMetadata = {};
    let fullResponse = '';

    if (conversation.type === 'guide' || guideType) {
      const guide = await aiService.getPetGuide(petInfo || { species: '通用' }, guideType || 'feeding');
      fullResponse = guide.content || guide;
      aiMetadata = { guideType: guideType || 'feeding', guideContent: fullResponse };
    } else {
      const result = await aiService.consultPet(
        symptoms || content,
        petInfo || { species: '通用' },
        { duration, severity: severity || 'moderate' }
      );
      fullResponse = result.analysis.suggestions || '';
      aiMetadata = {
        possibleDiseases: result.analysis.possibleDiseases,
        needsVet: result.analysis.needsVet,
        urgency: result.analysis.urgency,
        homeCareTips: result.analysis.homeCareTips,
        suggestions: result.analysis.suggestions
      };
    }

    // 保存AI回复
    const aiMessage = await AIMessage.create({
      conversationId: id,
      role: 'assistant',
      content: fullResponse,
      contentType: 'card',
      metadata: aiMetadata
    });

    conversation.messageCount += 1;
    conversation.lastMessageAt = new Date();
    await conversation.save();

    return successResponse(res, {
      userMessage,
      aiMessage
    }, '消息发送成功');
  } catch (error) {
    return errorResponse(res, error.message, 500, 'SEND_MESSAGE_FAILED');
  }
};
