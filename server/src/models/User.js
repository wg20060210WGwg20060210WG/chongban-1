import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

// 验证地理坐标
const validateLocation = (location) => {
  if (!location || !location.coordinates || location.coordinates.length === 0) {
    return true;
  }
  const [lng, lat] = location.coordinates;
  return typeof lng === 'number' && typeof lat === 'number' && 
         lng >= -180 && lng <= 180 && lat >= -90 && lat <= 90;
};

// 验证 URL (支持完整URL和相对路径)
const validateUrl = (url) => {
  if (!url) return true;
  // 如果是相对路径直接通过
  if (url.startsWith('/') || url.startsWith('./') || url.startsWith('../')) {
    return true;
  }
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

// 验证手机号格式（中国）
const validatePhone = (phone) => {
  if (!phone) return true;
  return /^1[3-9]\d{9}$/.test(phone);
};

// 验证密码复杂度
const validatePassword = (password) => {
  if (!password) return true;
  if (password.length < 6) return false;
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  return hasLetter && hasNumber;
};

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, '用户名是必填项'],
    unique: true,
    trim: true,
    minlength: [3, '用户名至少3个字符'],
    maxlength: [30, '用户名不能超过30个字符']
  },
  email: {
    type: String,
    required: [true, '邮箱是必填项'],
    unique: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, '请输入有效的邮箱地址']
  },
  password: {
    type: String,
    required: [true, '密码是必填项'],
    minlength: [6, '密码至少6个字符'],
    validate: [validatePassword, '密码必须同时包含字母和数字']
  },
  avatar: {
    type: String,
    default: '',
    validate: [validateUrl, '头像必须是有效的URL']
  },
  phone: {
    type: String,
    default: undefined,
    unique: true,
    sparse: true,
    validate: [validatePhone, '请输入有效的11位手机号码']
  },
  role: {
    type: String,
    enum: ['user', 'merchant', 'rescuer', 'admin'],
    default: 'user'
  },
  status: {
    type: String,
    enum: ['active', 'banned', 'pending'],
    default: 'active'
  },
  bannedUntil: { type: Date, default: null },
  merchantInfo: {
    shopName: {
      type: String,
      trim: true
    },
    businessLicense: {
      type: String,
      validate: [validateUrl, '营业执照照片必须是有效的URL']
    },
    address: {
      type: String,
      trim: true
    },
    serviceTypes: {
      type: [String],
      default: []
    },
    rating: {
      type: Number,
      min: 0,
      max: 5,
      default: 0
    },
    reviewCount: {
      type: Number,
      min: 0,
      default: 0
    },
    verified: {
      type: Boolean,
      default: false
    }
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      default: []
    },
    city: {
      type: String,
      trim: true
    },
    district: {
      type: String,
      trim: true
    }
  },
  stats: {
    followersCount: {
      type: Number,
      min: 0,
      default: 0
    },
    followingCount: {
      type: Number,
      min: 0,
      default: 0
    },
    postsCount: {
      type: Number,
      min: 0,
      default: 0
    },
    likesReceived: {
      type: Number,
      min: 0,
      default: 0
    }
  }
}, {
  timestamps: true
});

// 创建索引（移除重复的唯一索引）
userSchema.index({ role: 1 });
userSchema.index({ 'location.coordinates': '2dsphere' });

// ==================== 密码加密中间件 ====================

userSchema.pre('save', async function() {
  if (!this.isModified('password')) return;
  
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// ==================== 验证中间件：merchantInfo 和 location ====================

// 通用：验证 merchantInfo
const validateMerchantInfo = (doc) => {
  const hasMerchantInfo = doc.merchantInfo && (
    doc.merchantInfo.shopName ||
    doc.merchantInfo.businessLicense ||
    doc.merchantInfo.address ||
    (doc.merchantInfo.serviceTypes && doc.merchantInfo.serviceTypes.length > 0)
  );
  
  if (hasMerchantInfo && doc.role !== 'merchant') {
    throw new Error('只有 merchant 角色才能填写商家信息');
  }
  
  if (doc.role === 'merchant' && hasMerchantInfo) {
    if (!doc.merchantInfo.shopName || !doc.merchantInfo.shopName.trim()) {
      throw new Error('商家信息缺少店铺名称');
    }
    if (!doc.merchantInfo.address || !doc.merchantInfo.address.trim()) {
      throw new Error('商家信息缺少经营地址');
    }
  }
  
  return true;
};

// save 钩子
userSchema.pre('save', function() {
  validateMerchantInfo(this);
  if (!validateLocation(this.location)) {
    throw new Error('无效的地理坐标：经度范围 -180~180，纬度范围 -90~90');
  }
});

// 通用：获取更新值
const getUpdateValue = (update, field) => {
  if (update.$set && field in update.$set) return update.$set[field];
  if (field in update) return update[field];
  return undefined;
};

// 密码加密函数
const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

// findOneAndUpdate 钩子
userSchema.pre('findOneAndUpdate', async function() {
  const update = this.getUpdate();
  const query = this.getQuery();
  
  const currentDoc = await this.model.findOne(query);
  let updatedDoc = currentDoc ? currentDoc.toObject() : {};
  
  if (update.$set) {
    Object.assign(updatedDoc, update.$set);
  } else {
    Object.assign(updatedDoc, update);
  }
  
  if (update.$set && update.$set.role) {
    if (currentDoc && currentDoc.role === 'merchant' && update.$set.role !== 'merchant') {
      this.set({ merchantInfo: {
        serviceTypes: [],
        rating: 0,
        reviewCount: 0,
        verified: false
      }});
      updatedDoc.merchantInfo = {
        serviceTypes: [],
        rating: 0,
        reviewCount: 0,
        verified: false
      };
    }
  }
  
  // 密码加密处理
  const password = getUpdateValue(update, 'password');
  if (password !== undefined) {
    const hashedPassword = await hashPassword(password);
    if (update.$set) {
      update.$set.password = hashedPassword;
    } else {
      update.password = hashedPassword;
    }
  }
  
  validateMerchantInfo(updatedDoc);
  const location = getUpdateValue(update, 'location');
  if (location !== undefined && !validateLocation(location)) {
    throw new Error('无效的地理坐标：经度范围 -180~180，纬度范围 -90~90');
  }
});

// updateOne 钩子
userSchema.pre('updateOne', async function() {
  const update = this.getUpdate();
  const query = this.getQuery();
  
  const currentDoc = await this.model.findOne(query);
  if (!currentDoc) return;
  
  let updatedDoc = currentDoc.toObject();
  
  if (update.$set) {
    Object.assign(updatedDoc, update.$set);
  } else {
    Object.assign(updatedDoc, update);
  }
  
  if (update.$set && update.$set.role) {
    if (currentDoc.role === 'merchant' && update.$set.role !== 'merchant') {
      this.set({ merchantInfo: {
        serviceTypes: [],
        rating: 0,
        reviewCount: 0,
        verified: false
      }});
      updatedDoc.merchantInfo = {
        serviceTypes: [],
        rating: 0,
        reviewCount: 0,
        verified: false
      };
    }
  }
  
  // 密码加密处理
  const password = getUpdateValue(update, 'password');
  if (password !== undefined) {
    const hashedPassword = await hashPassword(password);
    if (update.$set) {
      update.$set.password = hashedPassword;
    } else {
      update.password = hashedPassword;
    }
  }
  
  validateMerchantInfo(updatedDoc);
  const location = getUpdateValue(update, 'location');
  if (location !== undefined && !validateLocation(location)) {
    throw new Error('无效的地理坐标：经度范围 -180~180，纬度范围 -90~90');
  }
});

// updateMany 钩子：禁止修改敏感字段
userSchema.pre('updateMany', function() {
  const update = this.getUpdate();
  
  const forbiddenFields = ['password', 'merchantInfo', 'location', 'role', 'stats'];
  for (const field of forbiddenFields) {
    if ((update.$set && field in update.$set) || field in update) {
      throw new Error(`禁止批量修改 ${field} 字段`);
    }
  }
});

// ==================== 实例方法：验证密码 ====================

userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);

export default User;
