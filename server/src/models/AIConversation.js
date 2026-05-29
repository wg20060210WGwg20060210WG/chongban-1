import mongoose from 'mongoose';

const aiConversationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, '用户ID是必填项']
  },
  petId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Pet',
    default: null
  },
  type: {
    type: String,
    enum: ['consultation', 'guide', 'general'],
    default: 'consultation'
  },
  title: {
    type: String,
    trim: true,
    maxlength: [200, '标题不能超过200个字符'],
    default: '新对话'
  },
  lastMessageAt: {
    type: Date,
    default: Date.now
  },
  messageCount: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['active', 'archived'],
    default: 'active'
  }
}, {
  timestamps: true
});

// 索引
aiConversationSchema.index({ userId: 1, lastMessageAt: -1 });
aiConversationSchema.index({ userId: 1, status: 1 });

const AIConversation = mongoose.model('AIConversation', aiConversationSchema);

export default AIConversation;