import mongoose from 'mongoose';

// 通用工具：验证关联文档是否存在
const validateRefExists = async (modelName, id, ctx = 'save') => {
  if (!id) return true;
  const model = mongoose.models[modelName];
  if (!model) return true;
  const exists = await model.exists({ _id: id });
  return exists !== null;
};

const adoptionSchema = new mongoose.Schema({
  publisherId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, '发布人是必填项']
  },
  status: {
    type: String,
    enum: ['pending', 'adopted', 'closed'],
    default: 'pending'
  },
  petInfo: {
    name: {
      type: String,
      required: [true, '宠物名字是必填项']
    },
    species: {
      type: String,
      enum: ['cat', 'dog', 'rabbit', 'bird', 'fish', 'hamster', 'other'],
      required: [true, '宠物类型是必填项']
    },
    breed: {
      type: String,
      default: ''
    },
    age: {
      type: Number,
      min: 0,
      default: 0
    },
    gender: {
      type: String,
      enum: ['male', 'female'],
      required: [true, '性别是必填项']
    },
    photos: {
      type: [{ type: String }],
      default: []
    },
    description: {
      type: String,
      default: ''
    },
    isVaccinated: {
      type: Boolean,
      default: false
    },
    isNeutered: {
      type: Boolean,
      default: false
    },
    healthStatus: {
      type: String,
      default: '健康'
    }
  },
  rescueInfo: {
    rescueDate: Date,
    rescueLocation: String,
    rescueReason: String
  },
  requirements: {
    hasExperience: {
      type: Boolean,
      default: false
    },
    hasSpace: {
      type: Boolean,
      default: false
    },
    canAfford: {
      type: Boolean,
      default: false
    },
    agreeVisit: {
      type: Boolean,
      default: false
    },
    otherRequirements: {
      type: String,
      default: ''
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
    city: String,
    district: String,
    address: String
  },
  viewCount: {
    type: Number,
    default: 0
  },
  applicationCount: {
    type: Number,
    default: 0
  },
  adoptedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  adoptedAt: Date
}, {
  timestamps: true
});

// 创建索引
adoptionSchema.index({ publisherId: 1 });
adoptionSchema.index({ status: 1 });
adoptionSchema.index({ 'location.coordinates': '2dsphere' });
adoptionSchema.index({ createdAt: -1 });
adoptionSchema.index({ 'petInfo.species': 1 });

// 验证地理坐标
function validateLocation(location) {
  if (!location || !location.coordinates || location.coordinates.length === 0) {
    return true;
  }
  const [lng, lat] = location.coordinates;
  return typeof lng === 'number' && typeof lat === 'number' && 
         lng >= -180 && lng <= 180 && lat >= -90 && lat <= 90;
}

// 通用：提取更新值
const getUpdateValue = (update, field) => {
  if (update.$set && field in update.$set) return update.$set[field];
  if (field in update) return update[field];
  return undefined;
};

// 保存前验证
adoptionSchema.pre('save', async function() {
  // 验证 publisherId 存在
  if (this.isModified('publisherId') || this.isNew) {
    const publisherExists = await validateRefExists('User', this.publisherId);
    if (!publisherExists) {
      throw new Error('发布人不存在');
    }
  }
  // 验证 adoptedBy 存在
  if (this.isModified('adoptedBy') && this.adoptedBy) {
    const adopterExists = await validateRefExists('User', this.adoptedBy);
    if (!adopterExists) {
      throw new Error('领养人不存在');
    }
  }
  // 验证地理坐标
  if (!validateLocation(this.location)) {
    throw new Error('无效的地理坐标：经度范围 -180~180，纬度范围 -90~90');
  }
  // 业务规则：status 为 adopted 时，adoptedBy 和 adoptedAt 必须非空
  if (this.status === 'adopted') {
    if (!this.adoptedBy) {
      throw new Error('状态为已领养时，领养人不能为空');
    }
    if (!this.adoptedAt) {
      this.adoptedAt = new Date();
    }
  }
});

// findOneAndUpdate 钩子
adoptionSchema.pre('findOneAndUpdate', async function() {
  const update = this.getUpdate();
  
  // 验证地理坐标
  const location = getUpdateValue(update, 'location');
  if (location !== undefined && !validateLocation(location)) {
    throw new Error('无效的地理坐标：经度范围 -180~180，纬度范围 -90~90');
  }
  
  // 验证 publisherId 存在
  const publisherId = getUpdateValue(update, 'publisherId');
  if (publisherId !== undefined) {
    const publisherExists = await validateRefExists('User', publisherId);
    if (!publisherExists) {
      throw new Error('发布人不存在');
    }
  }
  
  // 验证 adoptedBy 存在
  const adoptedBy = getUpdateValue(update, 'adoptedBy');
  if (adoptedBy !== undefined && adoptedBy !== null) {
    const adopterExists = await validateRefExists('User', adoptedBy);
    if (!adopterExists) {
      throw new Error('领养人不存在');
    }
  }
  
  // 业务规则：status 为 adopted 时，验证 adoptedBy
  const status = getUpdateValue(update, 'status');
  if (status === 'adopted') {
    let adoptedByVal = adoptedBy;
    if (adoptedByVal === undefined && this.getQuery()._id) {
      const currentDoc = await mongoose.model('Adoption').findById(this.getQuery()._id);
      adoptedByVal = currentDoc?.adoptedBy;
    }
    if (!adoptedByVal) {
      throw new Error('状态为已领养时，必须同时设置领养人');
    }
    if (!(('adoptedAt' in (update.$set || {})) || ('adoptedAt' in update))) {
      this.set({ adoptedAt: new Date() });
    }
  }
});

// updateOne 钩子
adoptionSchema.pre('updateOne', async function() {
  const update = this.getUpdate();
  const location = getUpdateValue(update, 'location');
  if (location !== undefined && !validateLocation(location)) {
    throw new Error('无效的地理坐标：经度范围 -180~180，纬度范围 -90~90');
  }
});

// updateMany 钩子
adoptionSchema.pre('updateMany', async function() {
  const update = this.getUpdate();
  const location = getUpdateValue(update, 'location');
  if (location !== undefined && !validateLocation(location)) {
    throw new Error('无效的地理坐标：经度范围 -180~180，纬度范围 -90~90');
  }
});

const Adoption = mongoose.model('Adoption', adoptionSchema);

export default Adoption;
