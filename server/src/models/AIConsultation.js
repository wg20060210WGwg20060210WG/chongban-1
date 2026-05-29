import mongoose from 'mongoose';

const aiConsultationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, '用户ID是必填项']
  },
  petId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Pet',
    required: [true, '宠物ID是必填项']
  },
  symptoms: {
    type: String,
    required: [true, '症状描述是必填项'],
    trim: true,
    maxlength: [2000, '症状描述不能超过2000个字符']
  },
  images: {
    type: [String],
    default: []
  },
  duration: {
    type: String,
    trim: true,
    maxlength: [100, '持续时间描述不能超过100个字符']
  },
  severity: {
    type: String,
    enum: ['mild', 'moderate', 'severe'],
    default: 'moderate'
  },
  aiAnalysis: {
    possibleDiseases: [{
      name: String,
      probability: { type: Number, min: 0, max: 100 },
      description: String
    }],
    suggestions: String,
    needsVet: { type: Boolean, default: false },
    urgency: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
    homeCareTips: String
  },
  aiModel: {
    type: String,
    enum: ['doubao', 'tongyi', 'other'],
    default: 'doubao'
  },
  apiResponse: {
    type: mongoose.Schema.Types.Mixed
  },
  feedback: {
    isHelpful: Boolean,
    comment: String,
    actualDiagnosis: String
  }
}, {
  timestamps: true
});

// 索引
aiConsultationSchema.index({ userId: 1, createdAt: -1 });
aiConsultationSchema.index({ petId: 1 });

const AIConsultation = mongoose.model('AIConsultation', aiConsultationSchema);

export default AIConsultation;
