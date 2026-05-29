import mongoose from 'mongoose';

// 通用工具：验证关联文档是否存在
const validateRefExists = async (modelName, id) => {
  if (!id) return true;
  const model = mongoose.models[modelName];
  if (!model) return true;
  const exists = await model.exists({ _id: id });
  return exists !== null;
};

const commentSchema = new mongoose.Schema({
  postId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post',
    required: [true, '帖子ID是必填项']
  },
  authorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, '评论者是必填项']
  },
  content: {
    type: String,
    required: [true, '评论内容不能为空'],
    trim: true
  },
  images: {
    type: [{ type: String }],
    default: []
  },
  // parentId：父评论ID，null 表示顶级评论
  parentId: {
    type: mongoose.Schema.Types.ObjectId,
    default: null
  },
  // replyToUserId：回复的用户ID（仅当 parentId 不为 null 时有意义）
  replyToUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  likeCount: {
    type: Number,
    min: 0,
    default: 0
  },
  replyCount: {
    type: Number,
    min: 0,
    default: 0
  },
  status: {
    type: String,
    enum: ['visible', 'hidden', 'deleted'],
    default: 'visible'
  }
}, {
  timestamps: true
});

commentSchema.index({ postId: 1, createdAt: -1 });
commentSchema.index({ authorId: 1 });
commentSchema.index({ parentId: 1 });

// 通用：提取更新值
const getUpdateValue = (update, field) => {
  if (update.$set && field in update.$set) return update.$set[field];
  if (field in update) return update[field];
  return undefined;
};

// ==================== 中间件：关联文档存在性校验和业务规则 ====================

commentSchema.pre('save', async function() {
  if (!this.parentId && this.replyToUserId) {
    throw new Error('顶级评论不能设置回复对象');
  }
  if (this.isModified('postId') || this.isNew) {
    const postExists = await validateRefExists('Post', this.postId);
    if (!postExists) {
      throw new Error('关联的帖子不存在');
    }
  }
  if (this.isModified('authorId') || this.isNew) {
    const authorExists = await validateRefExists('User', this.authorId);
    if (!authorExists) {
      throw new Error('评论者不存在');
    }
  }
  if (this.isModified('parentId') && this.parentId) {
    const parentExists = await validateRefExists('Comment', this.parentId);
    if (!parentExists) {
      throw new Error('父评论不存在');
    }
  }
  if (this.isModified('replyToUserId') && this.replyToUserId) {
    const replyToUserExists = await validateRefExists('User', this.replyToUserId);
    if (!replyToUserExists) {
      throw new Error('回复的用户不存在');
    }
  }
});

commentSchema.pre('findOneAndUpdate', async function() {
  const update = this.getUpdate();
  const oldDoc = await this.model.findOne(this.getQuery());
  
  const parentId = getUpdateValue(update, 'parentId');
  const replyToUserId = getUpdateValue(update, 'replyToUserId');
  if (parentId === null && replyToUserId) {
    throw new Error('顶级评论不能设置回复对象');
  }
  const postId = getUpdateValue(update, 'postId');
  if (postId !== undefined) {
    const postExists = await validateRefExists('Post', postId);
    if (!postExists) {
      throw new Error('关联的帖子不存在');
    }
  }
  const authorId = getUpdateValue(update, 'authorId');
  if (authorId !== undefined) {
    const authorExists = await validateRefExists('User', authorId);
    if (!authorExists) {
      throw new Error('评论者不存在');
    }
  }
  if (parentId !== undefined && parentId !== null) {
    const parentExists = await validateRefExists('Comment', parentId);
    if (!parentExists) {
      throw new Error('父评论不存在');
    }
  }
  if (replyToUserId !== undefined && replyToUserId !== null) {
    const replyToUserExists = await validateRefExists('User', replyToUserId);
    if (!replyToUserExists) {
      throw new Error('回复的用户不存在');
    }
  }
  const newStatus = getUpdateValue(update, 'status');
  if (oldDoc && newStatus !== undefined && oldDoc.status !== newStatus) {
    const Comment = mongoose.models.Comment;
    const Post = mongoose.models.Post;

    const wasVisible = oldDoc.status === 'visible';
    const isVisible = newStatus === 'visible';

    if (wasVisible && !isVisible) {
      if (Post) {
        await Post.findByIdAndUpdate(oldDoc.postId, { $inc: { 'stats.commentCount': -1 } });
      }
      if (oldDoc.parentId && Comment) {
        await Comment.findByIdAndUpdate(oldDoc.parentId, { $inc: { replyCount: -1 } });
      }
    } else if (!wasVisible && isVisible) {
      if (Post) {
        await Post.findByIdAndUpdate(oldDoc.postId, { $inc: { 'stats.commentCount': 1 } });
      }
      if (oldDoc.parentId && Comment) {
        await Comment.findByIdAndUpdate(oldDoc.parentId, { $inc: { replyCount: 1 } });
      }
    }
  }
});

// updateOne 钩子：status 变更时的计数同步
commentSchema.pre('updateOne', async function() {
  const update = this.getUpdate();
  const oldDoc = await this.model.findOne(this.getQuery());

  const newStatus = getUpdateValue(update, 'status');
  if (oldDoc && newStatus !== undefined && oldDoc.status !== newStatus) {
    const Comment = mongoose.models.Comment;
    const Post = mongoose.models.Post;

    const wasVisible = oldDoc.status === 'visible';
    const isVisible = newStatus === 'visible';

    if (wasVisible && !isVisible) {
      if (Post) {
        await Post.findByIdAndUpdate(oldDoc.postId, { $inc: { 'stats.commentCount': -1 } });
      }
      if (oldDoc.parentId && Comment) {
        await Comment.findByIdAndUpdate(oldDoc.parentId, { $inc: { replyCount: -1 } });
      }
    } else if (!wasVisible && isVisible) {
      if (Post) {
        await Post.findByIdAndUpdate(oldDoc.postId, { $inc: { 'stats.commentCount': 1 } });
      }
      if (oldDoc.parentId && Comment) {
        await Comment.findByIdAndUpdate(oldDoc.parentId, { $inc: { replyCount: 1 } });
      }
    }
  }
});

// ==================== 中间件：关联计数同步（Post.commentCount 和 Comment.replyCount）====================

// save 钩子：新增评论时更新计数（评论创建的帖子计数由 controller 处理，避免响应时计数未生效）
commentSchema.post('save', async function(doc) {
  try {
    const Comment = mongoose.models.Comment;

    if (doc.isNew && doc.status === 'visible') {
      if (doc.parentId && Comment) {
        await Comment.findByIdAndUpdate(doc.parentId, { $inc: { replyCount: 1 } });
      }
    }
  } catch (error) {
    console.error('Comment count sync error:', error);
  }
});

// findOneAndDelete/deleteOne 钩子：删除评论时更新计数
commentSchema.pre('findOneAndDelete', async function() {
  const doc = await this.model.findOne(this.getQuery());
  if (doc) {
    const Post = mongoose.models.Post;
    const Comment = mongoose.models.Comment;
    if (Post && doc.status === 'visible') {
      await Post.findByIdAndUpdate(doc.postId, { $inc: { 'stats.commentCount': -1 } });
    }
    if (doc.parentId && Comment && doc.status === 'visible') {
      await Comment.findByIdAndUpdate(doc.parentId, { $inc: { replyCount: -1 } });
    }
  }
});

commentSchema.pre('deleteOne', async function() {
  const doc = await this.model.findOne(this.getQuery());
  if (doc) {
    const Post = mongoose.models.Post;
    const Comment = mongoose.models.Comment;
    if (Post && doc.status === 'visible') {
      await Post.findByIdAndUpdate(doc.postId, { $inc: { 'stats.commentCount': -1 } });
    }
    if (doc.parentId && Comment && doc.status === 'visible') {
      await Comment.findByIdAndUpdate(doc.parentId, { $inc: { replyCount: -1 } });
    }
  }
});

const Comment = mongoose.model('Comment', commentSchema);

export default Comment;
