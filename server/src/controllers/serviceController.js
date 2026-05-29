import Service from '../models/Service.js';
import ServiceOrder from '../models/ServiceOrder.js';
import { successResponse, errorResponse } from '../middleware/response.js';
import { validateLocation, getPaginationParams, buildPaginationResponse } from '../utils/helpers.js';

// 发布服务
export const createService = async (req, res) => {
  try {
    // FormData 中 JSON 字符串字段需要解析
    const parseJSON = (val) => typeof val === 'string' ? JSON.parse(val) : val;
    if (req.body.pricing) req.body.pricing = parseJSON(req.body.pricing);
    if (req.body.businessHours) req.body.businessHours = parseJSON(req.body.businessHours);
    if (req.body.location) req.body.location = parseJSON(req.body.location);
    if (req.body.applicablePets) req.body.applicablePets = parseJSON(req.body.applicablePets);

    // 必填字段校验
    const { serviceName, category, pricing } = req.body;
    if (!serviceName || !serviceName.trim()) {
      return errorResponse(res, '服务名称不能为空', 400, 'SERVICE_NAME_REQUIRED');
    }
    if (!category) {
      return errorResponse(res, '服务分类不能为空', 400, 'CATEGORY_REQUIRED');
    }
    if (!pricing || (pricing.price == null && pricing.priceMin == null)) {
      return errorResponse(res, '定价信息不能为空', 400, 'PRICING_REQUIRED');
    }
    if (pricing.type === 'fixed' && (pricing.price == null || pricing.price < 0)) {
      return errorResponse(res, '请输入有效的价格', 400, 'INVALID_PRICE');
    }
    if (pricing.type === 'range') {
      if (pricing.priceMin == null || pricing.priceMin < 0) {
        return errorResponse(res, '请输入有效的最低价格', 400, 'INVALID_PRICE_MIN');
      }
      if (pricing.priceMax != null && pricing.priceMax < pricing.priceMin) {
        return errorResponse(res, '最高价格不能低于最低价格', 400, 'INVALID_PRICE_RANGE');
      }
    }

    // 如果有上传图片，处理图片URL
    let images = [];
    if (req.files && req.files.length > 0) {
      images = req.files.map(file => 
        `${req.protocol}://${req.get('host')}/uploads/services/${file.filename}`
      );
    }

    // 处理前端预上传的图片URL（Naive Upload 先上传到 /upload/images，再以URL字符串发回）
    if (req.body.existingImages) {
      const existing = Array.isArray(req.body.existingImages)
        ? req.body.existingImages : [req.body.existingImages];
      images = [...images, ...existing.filter(u => typeof u === 'string')];
      delete req.body.existingImages;
    }

    const serviceData = {
      ...req.body,
      merchantId: req.userId,
      images: images.length > 0 ? images : undefined
    };

    // 验证地理坐标
    if (serviceData.location && !validateLocation(serviceData.location)) {
      return errorResponse(res, '无效的地理坐标', 400, 'INVALID_LOCATION');
    }

    const service = new Service(serviceData);
    await service.save();

    return successResponse(res, { service }, '服务发布成功', 201);
  } catch (error) {
    return errorResponse(res, error.message, 500, 'CREATE_SERVICE_FAILED');
  }
};

// 获取服务列表（分页、筛选）
export const getServices = async (req, res) => {
  try {
    const { 
      category, 
      city,
      status,
      sort = 'latest',
      lat,
      lng
    } = req.query;

    const { pageNum, sizeNum, skip } = getPaginationParams(req.query);

    // 非管理员只能查看 active 状态的服务
    const query = {};
    if (category) query.category = category;
    if (city) query['location.city'] = city;
    if (status && req.role === 'admin') {
      query.status = status;
    } else {
      query.status = 'active';
    }

    let sortOption = { createdAt: -1 };
    if (sort === 'rating') {
      sortOption = { 'stats.rating': -1, 'stats.reviewCount': -1 };
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

    const services = await Service.find(query)
      .populate('merchantId', 'username avatar')
      .sort(sortOption)
      .skip(skip)
      .limit(sizeNum);

    const total = await Service.countDocuments(query);

    return successResponse(res, buildPaginationResponse(services, total, pageNum, sizeNum));
  } catch (error) {
    return errorResponse(res, error.message, 500, 'GET_SERVICES_FAILED');
  }
};

// 获取服务详情
export const getServiceDetail = async (req, res) => {
  try {
    const service = await Service.findByIdAndUpdate(
      req.params.id,
      { $inc: { 'stats.viewCount': 1 } },
      { new: true }
    ).populate('merchantId', 'username avatar phone');

    if (!service) {
      return errorResponse(res, '服务不存在', 404, 'SERVICE_NOT_FOUND');
    }

    return successResponse(res, { service }, '服务详情获取成功');
  } catch (error) {
    return errorResponse(res, error.message, 500, 'GET_SERVICE_FAILED');
  }
};

// 更新服务信息
export const updateService = async (req, res) => {
  try {
    const isAdmin = req.role === 'admin';
    const filter = {
      _id: req.params.id,
      ...(isAdmin ? {} : { merchantId: req.userId })
    };

    delete req.body.merchantId;
    delete req.body.stats;

    // 如果有上传图片，处理图片URL
    if (req.files && req.files.length > 0) {
      req.body.images = req.files.map(file => 
        `${req.protocol}://${req.get('host')}/uploads/services/${file.filename}`
      );
    }

    // 处理前端预上传的图片URL
    if (req.body.existingImages) {
      const existing = Array.isArray(req.body.existingImages)
        ? req.body.existingImages : [req.body.existingImages];
      req.body.images = [...(req.body.images || []), ...existing.filter(u => typeof u === 'string')];
      delete req.body.existingImages;
    }

    // 验证地理坐标
    if (req.body.location && !validateLocation(req.body.location)) {
      return errorResponse(res, '无效的地理坐标', 400, 'INVALID_LOCATION');
    }

    const updatedService = await Service.findOneAndUpdate(
      filter,
      req.body,
      { new: true, runValidators: true }
    );

    if (!updatedService) {
      return errorResponse(res, '服务不存在/您没有权限更新', 404, 'SERVICE_NOT_FOUND');
    }

    return successResponse(res, { updatedService }, '服务更新成功');
  } catch (error) {
    return errorResponse(res, error.message, 500, 'UPDATE_SERVICE_FAILED');
  }
};

// 下架服务
export const deleteService = async (req, res) => {
  try {
    const isAdmin = req.role === 'admin';
    const filter = {
      _id: req.params.id,
      ...(isAdmin ? {} : { merchantId: req.userId })
    };

    // 检查是否有进行中的订单
    const activeOrder = await ServiceOrder.findOne({
      serviceId: req.params.id,
      status: { $in: ['pending', 'confirmed', 'in_progress'] }
    });
    if (activeOrder) {
      return errorResponse(res, '该服务有进行中的订单，无法下架', 400, 'HAS_ACTIVE_ORDERS');
    }

    const service = await Service.findOneAndUpdate(
      filter,
      { status: 'inactive' },
      { new: true }
    );

    if (!service) {
      return errorResponse(res, '服务不存在/您没有权限操作', 404, 'SERVICE_NOT_FOUND');
    }

    return successResponse(res, null, '服务已下架');
  } catch (error) {
    return errorResponse(res, error.message, 500, 'DELETE_SERVICE_FAILED');
  }
};

// 获取我的服务列表
export const getMyServices = async (req, res) => {
  try {
    const { status } = req.query;

    const { pageNum, sizeNum, skip } = getPaginationParams(req.query);

    const query = { merchantId: req.userId };
    if (status) query.status = status;

    const services = await Service.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(sizeNum);

    const total = await Service.countDocuments(query);

    return successResponse(res, buildPaginationResponse(services, total, pageNum, sizeNum));
  } catch (error) {
    return errorResponse(res, error.message, 500, 'GET_MY_SERVICES_FAILED');
  }
};
