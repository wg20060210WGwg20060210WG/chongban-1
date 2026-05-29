import mongoose from 'mongoose';

const aiMessageSchema = new mongoose.Schema({
  conversationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AIConversation',
    required: [true, '对话ID是必填项']
  },
  role: {
    type: String,
    enum: ['user', 'assistant', 'system'],
    required: [true, '消息角色是必填项']
  },
  content: {
    type: String,
    required: [true, '消息内容是必填项']
  },
  contentType: {
    type: String,
    enum: ['text', 'image', 'card'],
    default: 'text'
  },
  metadata: {
    // 用户消息相关
    symptoms: String,
    duration: String,
    severity: {
      type: String,
      enum: ['mild', 'moderate', 'severe']
    },
    images: [String],
    // AI消息相关
    possibleDiseases: [{
      name: String,
      probability: { type: Number, min: 0, max: 100 },
      description: String
    }],
    needsVet: Boolean,
    urgency: {
      type: String,
      enum: ['low', 'medium', 'high']
    },
    homeCareTips: String,
    suggestions: String,
    // 指南相关
    guideType: {
      type: String,
      enum: ['feeding', 'training', 'health', 'behavior']
    },
    guideContent: String
  },
  tokensUsed: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// 索引
aiMessageSchema.index({ conversationId: 1, createdAt: 1 });

const AIMessage = mongoose.model('AIMessage', aiMessageSchema);

export default AIMessage;