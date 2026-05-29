import Adoption from '../models/Adoption.js';
import AdoptionApplication from '../models/AdoptionApplication.js';
import User from '../models/User.js';
import { successResponse, errorResponse } from '../middleware/response.js';
import * as notificationService from '../services/notificationService.js';
import { logError, getPaginationParams, buildPaginationResponse } from '../utils/helpers.js';

// 发布领养信息
export const createAdoption = async (req, res) => {
  try {
    const adoptionData = {
      ...req.body,
      publisherId: req.userId
    };

    const adoption = new Adoption(adoptionData);
    await adoption.save();

    return successResponse(res, { adoption }, '领养信息发布成功', 201);
  } catch (error) {
    console.error('createAdoption error:', error);
    return errorResponse(res, error.message, 500, 'CREATE_ADOPTION_FAILED');
  }
};

// 获取领养列表（分页、筛选）
export const getAdoptions = async (req, res) => {
  try {
    const { 
      species, 
      city,
      keyword,
      status = 'pending',
      sort = 'latest',
      lat,
      lng
    } = req.query;

    const { pageNum, sizeNum, skip } = getPaginationParams(req.query);

    const query = {};
    if (species) query['petInfo.species'] = species;
    if (city) query['location.city'] = city;
    if (status) query.status = status;
    if (keyword) {
      query.$or = [
        { 'petInfo.name': { $regex: keyword, $options: 'i' } },
        { 'petInfo.breed': { $regex: keyword, $options: 'i' } },
        { 'petInfo.description': { $regex: keyword, $options: 'i' } }
      ];
    }

    let sortOption = { createdAt: -1 };
    if (sort === 'popular') {
      sortOption = { viewCount: -1 };
    } else if (sort === 'applications') {
      sortOption = { applicationCount: -1 };
    } else if (sort === 'nearest' && lat && lng) {
      // $near 是查询操作符，放入 query 中，自带距离排序
      query['location.coordinates'] = {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(lng), parseFloat(lat)]
          }
        }
      };
      // $near 自带排序，不需要额外 sort
      sortOption = {};
    }

    const adoptions = await Adoption.find(query)
      .populate('publisherId', 'username avatar')
      .sort(sortOption)
      .skip(skip)
      .limit(sizeNum);

    const total = await Adoption.countDocuments(query);

    return successResponse(res, buildPaginationResponse(adoptions, total, pageNum, sizeNum));
  } catch (error) {
    return errorResponse(res, error.message, 500, 'GET_ADOPTIONS_FAILED');
  }
};

// 获取领养详情
export const getAdoptionDetail = async (req, res) => {
  try {
    const adoption = await Adoption.findByIdAndUpdate(
      req.params.id,
      { $inc: { viewCount: 1 } },
      { new: true }
    )
      .populate('publisherId', 'username avatar phone')
      .populate('adoptedBy', 'username avatar');

    if (!adoption) {
      return errorResponse(res, '领养信息不存在', 404, 'ADOPTION_NOT_FOUND');
    }

    return successResponse(res, { adoption }, '领养详情获取成功');
  } catch (error) {
    return errorResponse(res, error.message, 500, 'GET_ADOPTION_FAILED');
  }
};

// 更新领养信息
export const updateAdoption = async (req, res) => {
  try {
    const isAdmin = req.role === 'admin';
    const filter = {
      _id: req.params.id,
      ...(isAdmin ? {} : { publisherId: req.userId })
    };

    const allowedFields = ['petInfo', 'rescueInfo', 'requirements', 'location'];
    const updateData = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) updateData[field] = req.body[field];
    }

    const updatedAdoption = await Adoption.findOneAndUpdate(
      filter,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedAdoption) {
      return errorResponse(res, '领养信息不存在/您没有权限更新', 404, 'ADOPTION_NOT_FOUND');
    }

    return successResponse(res, { updatedAdoption }, '领养信息更新成功');
  } catch (error) {
    return errorResponse(res, error.message, 500, 'UPDATE_ADOPTION_FAILED');
  }
};

// 删除/关闭领养信息
export const deleteAdoption = async (req, res) => {
  try {
    const isAdmin = req.role === 'admin';
    const filter = {
      _id: req.params.id,
      ...(isAdmin ? {} : { publisherId: req.userId })
    };

    const adoption = await Adoption.findOneAndUpdate(
      filter,
      { status: 'closed' },
      { new: true }
    );

    if (!adoption) {
      return errorResponse(res, '领养信息不存在/您没有权限操作', 404, 'ADOPTION_NOT_FOUND');
    }

    return successResponse(res, null, '领养信息已关闭');
  } catch (error) {
    return errorResponse(res, error.message, 500, 'DELETE_ADOPTION_FAILED');
  }
};

// 获取我发布的领养列表
export const getMyAdoptions = async (req, res) => {
  try {
    const { status } = req.query;

    const { pageNum, sizeNum, skip } = getPaginationParams(req.query);

    const query = { publisherId: req.userId };
    if (status) query.status = status;

    const adoptions = await Adoption.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(sizeNum);

    const total = await Adoption.countDocuments(query);

    return successResponse(res, buildPaginationResponse(adoptions, total, pageNum, sizeNum));
  } catch (error) {
    return errorResponse(res, error.message, 500, 'GET_MY_ADOPTIONS_FAILED');
  }
};

// 提交领养申请
export const applyAdoption = async (req, res) => {
  try {
    const adoption = await Adoption.findById(req.params.id);

    if (!adoption) {
      return errorResponse(res, '领养信息不存在', 404, 'ADOPTION_NOT_FOUND');
    }

    if (adoption.status !== 'pending') {
      return errorResponse(res, '该领养信息已结束', 400, 'ADOPTION_CLOSED');
    }

    if (adoption.publisherId.toString() === req.userId.toString()) {
      return errorResponse(res, '不能申请自己发布的领养', 400, 'CANNOT_APPLY_OWN_ADOPTION');
    }

    // 前置检查是否已申请
    const existingApp = await AdoptionApplication.findOne({
      adoptionId: req.params.id,
      applicantId: req.userId
    });
    if (existingApp) {
      return errorResponse(res, '您已经申请过这个领养了', 400, 'ALREADY_APPLIED');
    }

    const applicationData = {
      adoptionId: req.params.id,
      applicantId: req.userId,
      applicantInfo: req.body.applicantInfo
    };

    const application = new AdoptionApplication(applicationData);
    await application.save();

    // 获取当前用户信息并发送申请通知给发布者
    const currentUser = await User.findById(req.userId);
    if (currentUser) {
      notificationService.sendAdoptionNotification({
        targetUserId: adoption.publisherId,
        senderId: req.userId,
        senderName: currentUser.username,
        senderAvatar: currentUser.avatar,
        adoptionId: req.params.id,
        action: 'applied'
      }).catch(logError('applyAdoption'));
    }

    return successResponse(res, { application }, '领养申请提交成功', 201);
  } catch (error) {
    if (error.code === 11000) {
      return errorResponse(res, '您已经申请过这个领养了', 400, 'ALREADY_APPLIED');
    }
    return errorResponse(res, error.message, 500, 'APPLY_ADOPTION_FAILED');
  }
};

// 获取我的领养申请
export const getMyApplications = async (req, res) => {
  try {
    const { status } = req.query;

    const { pageNum, sizeNum, skip } = getPaginationParams(req.query);

    const query = { applicantId: req.userId };
    if (status) query.status = status;

    const applications = await AdoptionApplication.find(query)
      .populate('adoptionId', 'petInfo.name petInfo.photos status')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(sizeNum);

    const total = await AdoptionApplication.countDocuments(query);

    return successResponse(res, buildPaginationResponse(applications, total, pageNum, sizeNum));
  } catch (error) {
    return errorResponse(res, error.message, 500, 'GET_APPLICATIONS_FAILED');
  }
};

// 获取某个领养的所有申请（发布者查看）
export const getAdoptionApplications = async (req, res) => {
  try {
    const adoption = await Adoption.findById(req.params.id);

    if (!adoption) {
      return errorResponse(res, '领养信息不存在', 404, 'ADOPTION_NOT_FOUND');
    }

    if (adoption.publisherId.toString() !== req.userId.toString() && req.role !== 'admin') {
      return errorResponse(res, '您没有权限查看这些申请', 403, 'FORBIDDEN');
    }

    const { status } = req.query;

    const { pageNum, sizeNum, skip } = getPaginationParams(req.query);

    const query = { adoptionId: req.params.id };
    if (status) query.status = status;

    const applications = await AdoptionApplication.find(query)
      .populate('applicantId', 'username avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(sizeNum);

    const total = await AdoptionApplication.countDocuments(query);

    return successResponse(res, buildPaginationResponse(applications, total, pageNum, sizeNum));
  } catch (error) {
    return errorResponse(res, error.message, 500, 'GET_APPLICATIONS_FAILED');
  }
};

// 审核领养申请（发布者）
export const reviewApplication = async (req, res) => {
  try {
    const application = await AdoptionApplication.findById(req.params.id)
      .populate('adoptionId');

    if (!application) {
      return errorResponse(res, '申请不存在', 404, 'APPLICATION_NOT_FOUND');
    }

    if (!application.adoptionId) {
      return errorResponse(res, '关联的领养信息已不存在', 400, 'ADOPTION_NOT_FOUND');
    }

    if (application.adoptionId.publisherId.toString() !== req.userId.toString() && req.role !== 'admin') {
      return errorResponse(res, '您没有权限审核此申请', 403, 'FORBIDDEN');
    }

    if (application.status !== 'pending') {
      return errorResponse(res, '该申请已审核过', 400, 'ALREADY_REVIEWED');
    }

    const { result, reason, notes } = req.body;

    // 校验审核结果
    if (!result || !['approved', 'rejected'].includes(result)) {
      return errorResponse(res, '审核结果必须为 approved 或 rejected', 400, 'INVALID_RESULT');
    }

    application.status = result;
    application.review = {
      reviewerId: req.userId,
      reviewedAt: new Date(),
      result,
      reason,
      notes
    };

    await application.save();

    // 如果审核通过，更新领养状态
    if (result === 'approved') {
      try {
        const adoptionDoc = await Adoption.findById(application.adoptionId._id);
        if (adoptionDoc) {
          adoptionDoc.status = 'adopted';
          adoptionDoc.adoptedBy = application.applicantId;
          adoptionDoc.adoptedAt = new Date();
          await adoptionDoc.save();
        }
      } catch (adoptionErr) {
        console.error('[reviewApplication] 更新领养状态失败:', adoptionErr.message);
      }

      // 同时拒绝其他申请
      await AdoptionApplication.updateMany(
        { adoptionId: application.adoptionId._id, status: 'pending', _id: { $ne: application._id } },
        { $set: { status: 'rejected', 'review.result': 'rejected', 'review.reason': '已有其他申请者被选中' } }
      );
    }

    // 获取当前审核者信息并发送审核结果通知给申请者
    try {
      const currentUser = await User.findById(req.userId);
      if (currentUser) {
        await notificationService.sendSystemNotification({
          userId: application.applicantId,
          title: result === 'approved' ? '领养申请已通过！' : '领养申请未通过',
          content: result === 'approved'
            ? `恭喜！您对「${application.adoptionId.petInfo?.name || '宠物'}」的领养申请已通过审核，请联系发布者沟通后续事宜。`
            : `很抱歉，您对「${application.adoptionId.petInfo?.name || '宠物'}」的领养申请未通过审核。${reason || '感谢您的关注！'}`,
          relatedType: 'adoption',
          relatedId: application.adoptionId._id,
          senderId: req.userId,
          senderName: currentUser.username,
          senderAvatar: currentUser.avatar
        });
      }
    } catch (notifyErr) {
      logError('reviewApplication')(notifyErr);
    }

    return successResponse(res, { application }, '申请审核完成');
  } catch (error) {
    console.error('[reviewApplication] 错误:', error.message, error.stack);
    return errorResponse(res, error.message, 500, 'REVIEW_APPLICATION_FAILED');
  }
};

// 取消领养申请
export const cancelApplication = async (req, res) => {
  try {
    const application = await AdoptionApplication.findById(req.params.id);

    if (!application) {
      return errorResponse(res, '申请不存在', 404, 'APPLICATION_NOT_FOUND');
    }

    if (application.applicantId.toString() !== req.userId.toString() && req.role !== 'admin') {
      return errorResponse(res, '您没有权限取消此申请', 403, 'FORBIDDEN');
    }

    if (application.status !== 'pending') {
      return errorResponse(res, '只能取消待审核的申请', 400, 'CANNOT_CANCEL');
    }

    application.status = 'cancelled';
    await application.save();

    // 通知发布者申请已被取消
    try {
      const adoption = await Adoption.findById(application.adoptionId);
      const currentUser = await User.findById(req.userId);
      if (adoption && currentUser) {
        await notificationService.sendSystemNotification({
          userId: adoption.publisherId,
          title: '领养申请已撤回',
          content: `用户「${currentUser.username}」撤回了对「${adoption.petInfo?.name || '宠物'}」的领养申请。`,
          relatedType: 'adoption',
          relatedId: adoption._id,
          senderId: req.userId,
          senderName: currentUser.username,
          senderAvatar: currentUser.avatar
        });
      }
    } catch (notifyErr) {
      logError('cancelApplication')(notifyErr);
    }

    return successResponse(res, null, '申请已取消');
  } catch (error) {
    return errorResponse(res, error.message, 500, 'CANCEL_APPLICATION_FAILED');
  }
};

// 添加回访记录
export const addFollowUp = async (req, res) => {
  try {
    const application = await AdoptionApplication.findById(req.params.id)
      .populate('adoptionId');

    if (!application) {
      return errorResponse(res, '申请不存在', 404, 'APPLICATION_NOT_FOUND');
    }

    if (application.adoptionId.publisherId.toString() !== req.userId.toString() && req.role !== 'admin') {
      return errorResponse(res, '您没有权限添加回访记录', 403, 'FORBIDDEN');
    }

    if (application.status !== 'approved') {
      return errorResponse(res, '只能给已通过的申请添加回访', 400, 'INVALID_STATUS');
    }

    const followUp = {
      date: new Date(),
      photos: req.body.photos || [],
      description: req.body.description,
      reviewer: req.userId
    };

    application.followUps.push(followUp);
    await application.save();

    return successResponse(res, { followUp }, '回访记录添加成功');
  } catch (error) {
    return errorResponse(res, error.message, 500, 'ADD_FOLLOWUP_FAILED');
  }
};
