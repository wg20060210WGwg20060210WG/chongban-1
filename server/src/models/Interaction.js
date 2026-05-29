import mongoose from 'mongoose';

// 通用工具：验证关联文档是否存在
const validateRefExists = async (modelName, id) => {
  if (!id) return true;
  const model = mongoose.models[modelName];
  if (!model) return true;
  const exists = await model.exists({ _id: id });
  return exists !== null;
};

// targetType 到 modelName 的映射
const targetTypeModelMap = {
  'post': 'Post',
  'comment': 'Comment',
  'user': 'User'
};

// 通用：提取更新值
const getUpdateValue = (update, field) => {
  if (update.$set && field in update.$set) return update.$set[field];
  if (field in update) return update[field];
  return undefined;
};

const interactionSchema = new mongoose.Schema({
  // userId：执行互动的用户
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, '用户ID是必填项']
  },
  // type：互动类型
  type: {
    type: String,
    enum: ['like', 'collect', 'follow'],
    required: [true, '互动类型是必填项']
  },
  // targetType：目标类型
  targetType: {
    type: String,
    enum: ['post', 'comment', 'user'],
    required: [true, '目标类型是必填项']
  },
  // targetId：目标ID（根据 targetType 关联到不同的模型）
  targetId: {
    type: mongoose.Schema.Types.ObjectId,
    required: [true, '目标ID是必填项']
  }
}, {
  timestamps: true
});

// 创建索引：userId + targetId + type 唯一索引，防止重复互动
interactionSchema.index({ userId: 1, type: 1 });
interactionSchema.index({ targetType: 1, targetId: 1, type: 1 });
interactionSchema.index({ userId: 1, targetId: 1, type: 1 }, { unique: true });

// ==================== 中间件：关联文档存在性校验 ====================

interactionSchema.pre('save', function() {
  this.$isNew = this.isNew;
});

interactionSchema.pre('save', async function() {
  if (this.isModified('userId') || this.isNew) {
    const userExists = await validateRefExists('User', this.userId);
    if (!userExists) {
      throw new Error('用户不存在');
    }
  }
  if (this.isModified('targetId') || this.isModified('targetType') || this.isNew) {
    const modelName = targetTypeModelMap[this.targetType];
    if (modelName) {
      const targetExists = await validateRefExists(modelName, this.targetId);
      if (!targetExists) {
        throw new Error(`关联的${this.targetType}不存在`);
      }
    }
  }
});

interactionSchema.pre('findOneAndUpdate', async function() {
  const update = this.getUpdate();
  const userId = getUpdateValue(update, 'userId');
  if (userId !== undefined) {
    const userExists = await validateRefExists('User', userId);
    if (!userExists) {
      throw new Error('用户不存在');
    }
  }
  const targetId = getUpdateValue(update, 'targetId');
  const targetType = getUpdateValue(update, 'targetType');
  if (targetId !== undefined || targetType !== undefined) {
    let currentTargetType = targetType;
    if (!currentTargetType && this.getQuery()._id) {
      const currentDoc = await this.model.findById(this.getQuery()._id);
      currentTargetType = currentDoc?.targetType;
    }
    if (currentTargetType) {
      const modelName = targetTypeModelMap[currentTargetType];
      if (modelName) {
        const targetIdToCheck = targetId !== undefined ? targetId : (await this.model.findById(this.getQuery()._id))?.targetId;
        if (targetIdToCheck) {
          const targetExists = await validateRefExists(modelName, targetIdToCheck);
          if (!targetExists) {
            throw new Error(`关联的${currentTargetType}不存在`);
          }
        }
      }
    }
  }
});

// ==================== 中间件：关联计数同步 ====================

// save 钩子：新增互动时更新计数（post 互动由 controller 直接更新，避免与异步钩子竞态）
interactionSchema.post('save', async function(doc) {
  try {
    if (!doc.$isNew) return;

    if (doc.targetType === 'post') {
      return;
    }

    const modelName = targetTypeModelMap[doc.targetType];
    const Model = mongoose.models[modelName];
    if (!Model) return;

    if (doc.targetType === 'comment') {
      if (doc.type === 'like') {
        await Model.findByIdAndUpdate(doc.targetId, { $inc: { likeCount: 1 } });
      }
    } else if (doc.targetType === 'user') {
      if (doc.type === 'follow') {
        await Model.findByIdAndUpdate(doc.targetId, { $inc: { 'stats.followersCount': 1 } });
        const User = mongoose.models.User;
        if (User) {
          await User.findByIdAndUpdate(doc.userId, { $inc: { 'stats.followingCount': 1 } });
        }
      }
    }
  } catch (error) {
    console.error('Interaction count sync error:', error);
  }
});

// findOneAndDelete/deleteOne 钩子：删除互动时更新计数（post 互动由 controller 直接更新，避免与异步钩子竞态）
interactionSchema.pre('findOneAndDelete', async function() {
  const doc = await this.model.findOne(this.getQuery());
  if (doc) {
    if (doc.targetType === 'post') {
      return;
    }
    const modelName = targetTypeModelMap[doc.targetType];
    const Model = mongoose.models[modelName];
    if (!Model) return;

    if (doc.targetType === 'comment') {
      if (doc.type === 'like') {
        await Model.findByIdAndUpdate(doc.targetId, { $inc: { likeCount: -1 } });
      }
    } else if (doc.targetType === 'user') {
      if (doc.type === 'follow') {
        await Model.findByIdAndUpdate(doc.targetId, { $inc: { 'stats.followersCount': -1 } });
        const User = mongoose.models.User;
        if (User) {
          await User.findByIdAndUpdate(doc.userId, { $inc: { 'stats.followingCount': -1 } });
        }
      }
    }
  }
});

interactionSchema.pre('deleteOne', async function() {
  const doc = await this.model.findOne(this.getQuery());
  if (doc) {
    if (doc.targetType === 'post') {
      return;
    }
    const modelName = targetTypeModelMap[doc.targetType];
    const Model = mongoose.models[modelName];
    if (!Model) return;

    if (doc.targetType === 'comment') {
      if (doc.type === 'like') {
        await Model.findByIdAndUpdate(doc.targetId, { $inc: { likeCount: -1 } });
      }
    } else if (doc.targetType === 'user') {
      if (doc.type === 'follow') {
        await Model.findByIdAndUpdate(doc.targetId, { $inc: { 'stats.followersCount': -1 } });
        const User = mongoose.models.User;
        if (User) {
          await User.findByIdAndUpdate(doc.userId, { $inc: { 'stats.followingCount': -1 } });
        }
      }
    }
  }
});

// ==================== 错误处理：唯一索引冲突时的友好提示 ====================

interactionSchema.post('save', function(error, doc, next) {
  if (error.name === 'MongoServerError' && error.code === 11000) {
    // 唯一索引冲突：重复互动
    let message = '已执行过该操作';
    if (doc.type === 'like') {
      message = '已点赞';
    } else if (doc.type === 'collect') {
      message = '已收藏';
    } else if (doc.type === 'follow') {
      message = '已关注';
    }
    next(new Error(message));
  } else {
    next(error);
  }
});

const Interaction = mongoose.model('Interaction', interactionSchema);

export default Interaction;
