import mongoose from 'mongoose';

const secondhandOrderSchema = new mongoose.Schema({
  orderNo: {
    type: String,
    unique: true,
    required: [true, '订单号是必填项']
  },
  itemId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SecondhandItem',
    required: [true, '商品ID是必填项']
  },
  sellerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, '卖家ID是必填项']
  },
  buyerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, '买家ID是必填项']
  },
  itemSnapshot: {
    title: { type: String, required: [true, '商品标题快照是必填项'] },
    images: { type: [String], default: [] },
    price: { type: Number, required: [true, '商品价格快照是必填项'], min: 0 },
    quantity: { type: Number, required: [true, '商品数量快照是必填项'], min: 1 }
  },
  deliveryMethod: {
    type: String,
    enum: ['pickup', 'shipping'],
    required: [true, '配送方式是必填项']
  },
  shippingInfo: {
    recipientName: String,
    phone: String,
    address: String,
    trackingNumber: String
  },
  totalAmount: {
    type: Number,
    required: [true, '总价是必填项'],
    min: 0
  },
  status: {
    type: String,
    enum: ['pending', 'paid', 'shipped', 'completed', 'cancelled'],
    default: 'pending'
  },
  statusHistory: [{
    status: { type: String, enum: ['pending', 'paid', 'shipped', 'completed', 'cancelled'], required: true },
    timestamp: { type: Date, default: Date.now },
    operator: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    note: String
  }],
  messages: [{
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: [true, '消息内容是必填项'], maxlength: 500 },
    timestamp: { type: Date, default: Date.now }
  }],
  review: {
    rating: { type: Number, min: 1, max: 5 },
    content: { type: String, maxlength: 1000 },
    createdAt: Date
  }
}, {
  timestamps: true
});

// 索引（orderNo 已通过 unique: true 自动建索引，无需重复声明）
secondhandOrderSchema.index({ sellerId: 1, createdAt: -1 });
secondhandOrderSchema.index({ buyerId: 1, createdAt: -1 });
secondhandOrderSchema.index({ status: 1 });
secondhandOrderSchema.index({ itemId: 1 });

const SecondhandOrder = mongoose.model('SecondhandOrder', secondhandOrderSchema);

export default SecondhandOrder;
