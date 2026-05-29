import SecondhandItem from '../models/SecondhandItem.js';
import SecondhandOrder from '../models/SecondhandOrder.js';
import { successResponse, errorResponse } from '../middleware/response.js';
import { validateLocation, getPaginationParams, buildPaginationResponse } from '../utils/helpers.js';

// 创建二手商品
export const createItem = async (req, res) => {
  try {
    // 必填字段校验
    const { title, sellingPrice, category } = req.body;
    if (!title || !title.trim()) {
      return errorResponse(res, '商品标题不能为空', 400, 'TITLE_REQUIRED');
    }
    if (sellingPrice === undefined || sellingPrice === null || Number(sellingPrice) < 0) {
      return errorResponse(res, '售价不能为空且不能为负数', 400, 'PRICE_REQUIRED');
    }
    if (!category) {
      return errorResponse(res, '商品分类不能为空', 400, 'CATEGORY_REQUIRED');
    }

    let images = [];
    if (req.files && req.files.length > 0) {
      images = req.files.map(file => 
        `${req.protocol}://${req.get('host')}/uploads/secondhand/${file.filename}`
      );
    }

    // 处理 ImageUploader 预上传的图片 URL
    if (req.body.existingImages) {
      const existing = Array.isArray(req.body.existingImages)
        ? req.body.existingImages
        : [req.body.existingImages];
      images = [...images, ...existing];
      delete req.body.existingImages;
    }

    const itemData = {
      ...req.body,
      sellerId: req.userId,
      images: images.length > 0 ? images : undefined
    };

    if (itemData.location && !validateLocation(itemData.location)) {
      return errorResponse(res, '无效的地理坐标', 400, 'INVALID_LOCATION');
    }

    const item = new SecondhandItem(itemData);
    await item.save();

    return successResponse(res, { item }, '商品发布成功', 201);
  } catch (error) {
    return errorResponse(res, error.message, 500, 'CREATE_ITEM_FAILED');
  }
};

// 获取商品列表
export const getItems = async (req, res) => {
  try {
    const { category, city, priceMin, priceMax, condition, status = 'available', sort = 'latest', lat, lng } = req.query;

    const { pageNum, sizeNum, skip } = getPaginationParams(req.query);

    const query = { status };
    if (category) query.category = category;
    if (city) query['location.city'] = city;
    if (condition) query.condition = condition;
    if (priceMin !== undefined) query.sellingPrice = { ...query.sellingPrice, $gte: Number(priceMin) };
    if (priceMax !== undefined) query.sellingPrice = { ...query.sellingPrice, $lte: Number(priceMax) };

    let sortOption = { createdAt: -1 };
    if (sort === 'price_asc') {
      sortOption = { sellingPrice: 1 };
    } else if (sort === 'price_desc') {
      sortOption = { sellingPrice: -1 };
    } else if (sort === 'nearest' && lat && lng) {
      query['location.coordinates'] = {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(lng), parseFloat(lat)]
          }
        }
      };
      sortOption = {};
    }

    const items = await SecondhandItem.find(query)
      .populate('sellerId', 'username avatar')
      .sort(sortOption)
      .skip(skip)
      .limit(sizeNum);

    const total = await SecondhandItem.countDocuments(query);

    return successResponse(res, buildPaginationResponse(items, total, pageNum, sizeNum));
  } catch (error) {
    return errorResponse(res, error.message, 500, 'GET_ITEMS_FAILED');
  }
};

// 获取商品详情
export const getItemDetail = async (req, res) => {
  try {
    const item = await SecondhandItem.findByIdAndUpdate(
      req.params.itemId,
      { $inc: { viewCount: 1 } },
      { new: true }
    ).populate('sellerId', 'username avatar phone');

    if (!item) {
      return errorResponse(res, '商品不存在', 404, 'ITEM_NOT_FOUND');
    }

    return successResponse(res, { item }, '商品详情获取成功');
  } catch (error) {
    return errorResponse(res, error.message, 500, 'GET_ITEM_FAILED');
  }
};

// 更新商品信息
export const updateItem = async (req, res) => {
  try {
    const isAdmin = req.role === 'admin';
    const filter = {
      _id: req.params.itemId,
      ...(isAdmin ? {} : { sellerId: req.userId })
    };

    delete req.body.sellerId;
    delete req.body.viewCount;
    delete req.body.favoriteCount;
    delete req.body.inquiryCount;
    delete req.body.soldTo;
    delete req.body.soldAt;

    // 业务逻辑校验：防止恶意状态变更
    if (req.body.status !== undefined) {
      const allowedStatuses = ['available', 'removed'];
      if (!allowedStatuses.includes(req.body.status)) {
        return errorResponse(res, '不允许修改该状态', 400, 'INVALID_STATUS_CHANGE');
      }
      // 防止将已售/已预留商品改回在售，通过 filter 条件原子保护
      if (req.body.status === 'available') {
        filter.status = { $nin: ['sold', 'reserved'] };
      }
    }

    if (req.files && req.files.length > 0) {
      req.body.images = req.files.map(file => 
        `${req.protocol}://${req.get('host')}/uploads/secondhand/${file.filename}`
      );
    }

    // 处理 ImageUploader 预上传的图片 URL
    if (req.body.existingImages) {
      const existing = Array.isArray(req.body.existingImages)
        ? req.body.existingImages
        : [req.body.existingImages];
      req.body.images = [...(req.body.images || []), ...existing];
      delete req.body.existingImages;
    }

    if (req.body.location && !validateLocation(req.body.location)) {
      return errorResponse(res, '无效的地理坐标', 400, 'INVALID_LOCATION');
    }

    // 原子更新，filter 包含权限+状态条件，杜绝 TOCTOU
    const updatedItem = await SecondhandItem.findOneAndUpdate(
      filter,
      req.body,
      { new: true, runValidators: true }
    );

    if (!updatedItem) {
      return errorResponse(res, '商品不存在、您没有权限编辑、或状态不允许修改', 404, 'ITEM_NOT_FOUND');
    }

    return successResponse(res, { item: updatedItem }, '商品更新成功');
  } catch (error) {
    return errorResponse(res, error.message, 500, 'UPDATE_ITEM_FAILED');
  }
};

// 下架商品
export const deleteItem = async (req, res) => {
  try {
    const isAdmin = req.role === 'admin';
    const filter = {
      _id: req.params.itemId,
      ...(isAdmin ? {} : { sellerId: req.userId })
    };

    // 检查是否有进行中的订单
    const activeOrder = await SecondhandOrder.findOne({
      itemId: req.params.itemId,
      status: { $in: ['pending', 'paid', 'shipped'] }
    });
    if (activeOrder) {
      return errorResponse(res, '该商品有进行中的订单，无法下架', 400, 'HAS_ACTIVE_ORDERS');
    }

    const item = await SecondhandItem.findOneAndUpdate(
      filter,
      { status: 'removed' },
      { new: true }
    );

    if (!item) {
      return errorResponse(res, '商品不存在或您没有权限操作', 404, 'ITEM_NOT_FOUND');
    }

    return successResponse(res, null, '商品已下架');
  } catch (error) {
    return errorResponse(res, error.message, 500, 'DELETE_ITEM_FAILED');
  }
};

// 获取我发布的商品
export const getMyItems = async (req, res) => {
  try {
    const { status } = req.query;

    const { pageNum, sizeNum, skip } = getPaginationParams(req.query);

    const query = { sellerId: req.userId };
    if (status) query.status = status;

    const items = await SecondhandItem.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(sizeNum);

    const total = await SecondhandItem.countDocuments(query);

    return successResponse(res, buildPaginationResponse(items, total, pageNum, sizeNum));
  } catch (error) {
    return errorResponse(res, error.message, 500, 'GET_MY_ITEMS_FAILED');
  }
};
