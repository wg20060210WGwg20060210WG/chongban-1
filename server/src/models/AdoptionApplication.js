import mongoose from 'mongoose';

// 通用工具：验证关联文档是否存在
const validateRefExists = async (modelName, id) => {
  if (!id) return true;
  const model = mongoose.models[modelName];
  if (!model) return true;
  const exists = await model.exists({ _id: id });
  return exists !== null;
};

// 通用：提取更新值
const getUpdateValue = (update, field) => {
  if (update.$set && field in update.$set) return update.$set[field];
  if (field in update) return update[field];
  return undefined;
};

// 更新 Adoption 的 applicationCount
const updateAdoptionCount = async (adoptionId, delta) => {
  if (!adoptionId) return;
  const Adoption = mongoose.models.Adoption;
  if (!Adoption) return;
  await Adoption.findByIdAndUpdate(adoptionId, { $inc: { applicationCount: delta } });
};

const adoptionApplicationSchema = new mongoose.Schema({
  adoptionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Adoption',
    required: [true, '关联的领养信息是必填项']
  },
  applicantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, '申请人是必填项']
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'cancelled'],
    default: 'pending'
  },
  applicantInfo: {
    realName: {
      type: String,
      required: [true, '真实姓名是必填项']
    },
    age: {
      type: Number,
      min: 0,
      max: 150
    },
    occupation: String,
    phone: {
      type: String,
      required: [true, '联系电话是必填项']
    },
    address: String,
    housingType: String,
    hasExperience: {
      type: Boolean,
      default: false
    },
    currentPets: String,
    familyAgreement: {
      type: Boolean,
      default: false
    },
    reasonToAdopt: String,
    idCardPhoto: String
  },
  review: {
    reviewerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reviewedAt: Date,
    result: {
      type: String,
      enum: ['approved', 'rejected']
    },
    reason: String,
    notes: String
  },
  // followUps：后续回访记录
  followUps: [{
    date: Date,
    photos: [String],
    description: String,
    reviewer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }]
}, {
  timestamps: true
});

// 创建索引
adoptionApplicationSchema.index({ adoptionId: 1 });
adoptionApplicationSchema.index({ applicantId: 1 });
adoptionApplicationSchema.index({ status: 1 });
adoptionApplicationSchema.index({ adoptionId: 1, applicantId: 1 }, { unique: true });

// ==================== 中间件：关联计数同步 ====================

// save 钩子：新增申请时 +1
adoptionApplicationSchema.post('save', async function(doc) {
  if (doc.isNew) {
    await updateAdoptionCount(doc.adoptionId, 1);
  }
});

// findOneAndDelete/deleteOne 钩子：删除时 -1（仅当 status 不是 cancelled 时）
adoptionApplicationSchema.pre('findOneAndDelete', async function() {
  const doc = await this.model.findOne(this.getQuery());
  if (doc && doc.status !== 'cancelled') {
    await updateAdoptionCount(doc.adoptionId, -1);
  }
});

// deleteOne 钩子（同 findOneAndDelete）
adoptionApplicationSchema.pre('deleteOne', async function() {
  const doc = await this.model.findOne(this.getQuery());
  if (doc && doc.status !== 'cancelled') {
    await updateAdoptionCount(doc.adoptionId, -1);
  }
});

// deleteMany 钩子：批量删除时计数同步（警告：性能消耗大，不建议使用）
adoptionApplicationSchema.pre('deleteMany', async function() {
  const docs = await this.model.find(this.getQuery());
  for (const doc of docs) {
    if (doc.status !== 'cancelled') {
      await updateAdoptionCount(doc.adoptionId, -1);
    }
  }
});

// ==================== 中间件：status 变更时计数同步 ====================

// save 钩子：status 变更时处理
adoptionApplicationSchema.pre('save', async function() {
  if (this.isModified('status') && !this.isNew) {
    const oldDoc = await this.constructor.findById(this._id);
    const wasCounted = oldDoc && oldDoc.status !== 'cancelled';
    const isCounted = this.status !== 'cancelled';
    
    if (wasCounted && !isCounted) {
      await updateAdoptionCount(this.adoptionId, -1);
    } else if (!wasCounted && isCounted) {
      await updateAdoptionCount(this.adoptionId, 1);
    }
  }
});

// ==================== 中间件：关联文档存在性校验 ====================

adoptionApplicationSchema.pre('save', async function() {
  // 验证 adoptionId 存在
  if (this.isModified('adoptionId') || this.isNew) {
    const adoptionExists = await validateRefExists('Adoption', this.adoptionId);
    if (!adoptionExists) {
      throw new Error('关联的领养信息不存在');
    }
  }
  // 验证 applicantId 存在
  if (this.isModified('applicantId') || this.isNew) {
    const applicantExists = await validateRefExists('User', this.applicantId);
    if (!applicantExists) {
      throw new Error('申请人不存在');
    }
  }
  // 验证 reviewerId 存在
  if (this.isModified('review.reviewerId') && this.review?.reviewerId) {
    const reviewerExists = await validateRefExists('User', this.review.reviewerId);
    if (!reviewerExists) {
      throw new Error('审核人不存在');
    }
  }
});

adoptionApplicationSchema.pre('findOneAndUpdate', async function() {
  const update = this.getUpdate();
  
  // 验证 adoptionId 存在
  const adoptionId = getUpdateValue(update, 'adoptionId');
  if (adoptionId !== undefined) {
    const adoptionExists = await validateRefExists('Adoption', adoptionId);
    if (!adoptionExists) {
      throw new Error('关联的领养信息不存在');
    }
  }
  // 验证 applicantId 存在
  const applicantId = getUpdateValue(update, 'applicantId');
  if (applicantId !== undefined) {
    const applicantExists = await validateRefExists('User', applicantId);
    if (!applicantExists) {
      throw new Error('申请人不存在');
    }
  }
  
  // status 变更时处理
  const newStatus = getUpdateValue(update, 'status');
  if (newStatus !== undefined) {
    const oldDoc = await this.model.findOne(this.getQuery());
    if (oldDoc && oldDoc.status !== newStatus) {
      const wasCounted = oldDoc.status !== 'cancelled';
      const isCounted = newStatus !== 'cancelled';
      
      if (wasCounted && !isCounted) {
        await updateAdoptionCount(oldDoc.adoptionId, -1);
      } else if (!wasCounted && isCounted) {
        await updateAdoptionCount(oldDoc.adoptionId, 1);
      }
    }
  }
});

// updateOne 钩子：status 变更时处理
adoptionApplicationSchema.pre('updateOne', async function() {
  const update = this.getUpdate();
  const newStatus = getUpdateValue(update, 'status');
  
  if (newStatus !== undefined) {
    const oldDoc = await this.model.findOne(this.getQuery());
    if (oldDoc && oldDoc.status !== newStatus) {
      const wasCounted = oldDoc.status !== 'cancelled';
      const isCounted = newStatus !== 'cancelled';
      
      if (wasCounted && !isCounted) {
        await updateAdoptionCount(oldDoc.adoptionId, -1);
      } else if (!wasCounted && isCounted) {
        await updateAdoptionCount(oldDoc.adoptionId, 1);
      }
    }
  }
});

const AdoptionApplication = mongoose.model('AdoptionApplication', adoptionApplicationSchema);

export default AdoptionApplication;
