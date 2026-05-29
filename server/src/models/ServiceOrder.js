import mongoose from 'mongoose';

const serviceOrderSchema = new mongoose.Schema({
  orderNo: {
    type: String,
    unique: true,
    required: [true, '订单号是必填项']
  },
  serviceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service',
    required: [true, '服务ID是必填项']
  },
  merchantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, '商家ID是必填项']
  },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, '客户ID是必填项']
  },
  petInfo: {
    petId: { type: mongoose.Schema.Types.ObjectId, ref: 'Pet' },
    petName: { type: String, required: [true, '宠物名称是必填项'] },
    species: { type: String, required: [true, '宠物种类是必填项'] },
    breed: String,
    weight: Number,
    specialNeeds: String
  },
  appointment: {
    date: { type: Date, required: [true, '预约日期是必填项'] },
    timeSlot: { type: String, required: [true, '预约时间段是必填项'] },
    duration: { type: Number, default: 60 }
  },
  pricing: {
    servicePrice: { type: Number, required: [true, '服务价格是必填项'], min: 0 },
    additionalFees: { type: Number, default: 0, min: 0 },
    discount: { type: Number, default: 0, min: 0 },
    totalAmount: { type: Number, required: [true, '总价是必填项'], min: 0 }
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'refunded'],
    default: 'pending'
  },
  statusHistory: [{
    status: { type: String, enum: ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'refunded'], required: true },
    timestamp: { type: Date, default: Date.now },
    operator: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    note: String
  }],
  contact: {
    name: { type: String, required: [true, '联系人姓名是必填项'] },
    phone: { type: String, required: [true, '联系电话是必填项'] },
    address: String
  },
  customerNote: String,
  merchantNote: String,
  payment: {
    method: { type: String, enum: ['wechat', 'alipay', 'balance'] },
    status: { type: String, enum: ['unpaid', 'paid', 'refunded'], default: 'unpaid' },
    paidAt: Date,
    transactionId: String
  },
  review: {
    rating: { type: Number, min: 1, max: 5 },
    content: { type: String, maxlength: 1000 },
    images: { type: [String], default: [] },
    createdAt: Date
  }
}, {
  timestamps: true
});

// 索引（orderNo 已通过 unique: true 自动建索引，无需重复声明）
serviceOrderSchema.index({ customerId: 1, createdAt: -1 });
serviceOrderSchema.index({ merchantId: 1, createdAt: -1 });
serviceOrderSchema.index({ status: 1 });
serviceOrderSchema.index({ serviceId: 1 });

const ServiceOrder = mongoose.model('ServiceOrder', serviceOrderSchema);

export default ServiceOrder;
