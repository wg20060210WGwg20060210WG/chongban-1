import mongoose from 'mongoose';

const secondhandItemSchema = new mongoose.Schema({
  sellerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, '卖家ID是必填项']
  },
  category: {
    type: String,
    enum: ['food', 'litter', 'cage', 'toy', 'clothing', 'medicine', 'other'],
    required: [true, '商品分类是必填项']
  },
  title: {
    type: String,
    required: [true, '商品标题是必填项'],
    trim: true,
    maxlength: [100, '商品标题不能超过100个字符']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [2000, '商品描述不能超过2000个字符']
  },
  images: {
    type: [String],
    default: []
  },
  originalPrice: {
    type: Number,
    min: [0, '原价不能为负数'],
    required: [true, '原价是必填项']
  },
  sellingPrice: {
    type: Number,
    min: [0, '售价不能为负数'],
    required: [true, '售价是必填项']
  },
  isPriceNegotiable: {
    type: Boolean,
    default: false
  },
  condition: {
    type: String,
    enum: ['new', 'like_new', 'good', 'fair'],
    required: [true, '商品成色是必填项']
  },
  quantity: {
    type: Number,
    min: [1, '数量至少为1'],
    default: 1
  },
  deliveryMethods: {
    pickUp: { type: Boolean, default: false },
    shipping: { type: Boolean, default: false },
    shippingFee: { type: Number, min: 0, default: 0 }
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: { type: [Number], default: [] },
    city: String,
    district: String
  },
  status: {
    type: String,
    enum: ['available', 'sold', 'reserved', 'removed'],
    default: 'available'
  },
  viewCount: {
    type: Number,
    default: 0
  },
  favoriteCount: {
    type: Number,
    default: 0
  },
  inquiryCount: {
    type: Number,
    default: 0
  },
  soldTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  soldAt: Date
}, {
  timestamps: true
});

// 索引
secondhandItemSchema.index({ sellerId: 1 });
secondhandItemSchema.index({ category: 1 });
secondhandItemSchema.index({ status: 1 });
secondhandItemSchema.index({ 'location.coordinates': '2dsphere' });
secondhandItemSchema.index({ createdAt: -1 });
secondhandItemSchema.index({ sellingPrice: 1 });

const SecondhandItem = mongoose.model('SecondhandItem', secondhandItemSchema);

export default SecondhandItem;
