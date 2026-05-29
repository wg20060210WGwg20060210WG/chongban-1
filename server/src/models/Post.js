import mongoose from 'mongoose';

// 通用工具：验证关联文档是否存在
const validateRefExists = async (modelName, id) => {
  if (!id) return true;
  const model = mongoose.models[modelName];
  if (!model) return true;
  const exists = await model.exists({ _id: id });
  return exists !== null;
};

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

const postSchema = new mongoose.Schema({
  authorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, '作者是必填项']
  },
  type: {
    type: String,
    enum: ['text', 'image', 'video'],
    default: 'text'
  },
  title: {
    type: String,
    trim: true
  },
  content: {
    type: String,
    required: [true, '帖子内容不能为空'],
    trim: true
  },
  images: {
    type: [{ type: String }],
    default: []
  },
  videos: {
    type: [{ type: String }],
    default: []
  },
  channel: {
    type: String,
    required: [true, '频道是必填项'],
    trim: true
  },
  topics: {
    type: [{ type: String }],
    default: []
  },
  // petTag：关联的宠物标签，petName 冗余存储（用于减少查询）
  petTag: {
    petId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Pet'
    },
    petName: String
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: { 
      type: [Number], 
      default: undefined,
      validate: {
        validator: function(coords) {
          if (!coords || coords.length === 0) return true;
          if (coords.length !== 2) return false;
          const [lng, lat] = coords;
          return typeof lng === 'number' && typeof lat === 'number' && 
                 lng >= -180 && lng <= 180 && lat >= -90 && lat <= 90;
        },
        message: '无效的地理坐标：经度范围 -180~180，纬度范围 -90~90'
      }
    },
    city: String,
    locationName: String
  },
  status: {
    type: String,
    enum: ['published', 'hidden', 'deleted'],
    default: 'published'
  },
  visibility: {
    type: String,
    enum: ['public', 'followers', 'private'],
    default: 'public'
  },
  // stats：统计信息（注意：这些字段应通过中间件自动更新，不要手动修改）
  stats: {
    viewCount: { type: Number, min: 0, default: 0 },
    likeCount: { type: Number, min: 0, default: 0 },
    commentCount: { type: Number, min: 0, default: 0 },
    shareCount: { type: Number, min: 0, default: 0 },
    collectCount: { type: Number, min: 0, default: 0 }
  },
  hotScore: {
    type: Number,
    default: 0
  },
  isRecommended: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

postSchema.index({ authorId: 1 });
postSchema.index({ status: 1 });
postSchema.index({ createdAt: -1 });
postSchema.index({ hotScore: -1 });
postSchema.index({ topics: 1 });
postSchema.index({ 'location.coordinates': '2dsphere' }, { sparse: true });

// ==================== 中间件：关联文档存在性校验 ====================

postSchema.pre('save', async function() {
  if (this.isModified('authorId') || this.isNew) {
    const authorExists = await validateRefExists('User', this.authorId);
    if (!authorExists) {
      throw new Error('作者不存在');
    }
  }
  if (this.isModified('petTag.petId') && this.petTag?.petId) {
    const petExists = await validateRefExists('Pet', this.petTag.petId);
    if (!petExists) {
      throw new Error('关联的宠物不存在');
    }
  }
  if (!validateLocation(this.location)) {
    throw new Error('无效的地理坐标：经度范围 -180~180，纬度范围 -90~90');
  }
  if (this.location && (!this.location.coordinates || this.location.coordinates.length === 0)) {
    this.location = undefined;
  }
});

postSchema.pre('findOneAndUpdate', async function() {
  const update = this.getUpdate();
  const authorId = getUpdateValue(update, 'authorId');
  if (authorId !== undefined) {
    const authorExists = await validateRefExists('User', authorId);
    if (!authorExists) {
      throw new Error('作者不存在');
    }
  }
  const petTag = getUpdateValue(update, 'petTag');
  if (petTag !== undefined && petTag?.petId) {
    const petExists = await validateRefExists('Pet', petTag.petId);
    if (!petExists) {
      throw new Error('关联的宠物不存在');
    }
  }
  const location = getUpdateValue(update, 'location');
  if (location !== undefined && !validateLocation(location)) {
    throw new Error('无效的地理坐标：经度范围 -180~180，纬度范围 -90~90');
  }
});

postSchema.pre('updateOne', async function() {
  const update = this.getUpdate();
  const location = getUpdateValue(update, 'location');
  if (location !== undefined && !validateLocation(location)) {
    throw new Error('无效的地理坐标：经度范围 -180~180，纬度范围 -90~90');
  }
});

postSchema.pre('updateMany', async function() {
  const update = this.getUpdate();
  const location = getUpdateValue(update, 'location');
  if (location !== undefined && !validateLocation(location)) {
    throw new Error('无效的地理坐标：经度范围 -180~180，纬度范围 -90~90');
  }
});

const Post = mongoose.model('Post', postSchema);

export default Post;
