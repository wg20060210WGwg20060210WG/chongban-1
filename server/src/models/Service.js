import mongoose from 'mongoose';

const serviceSchema = new mongoose.Schema({
  merchantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, '商家ID是必填项']
  },
  category: {
    type: String,
    enum: ['grooming', 'boarding', 'walking', 'training', 'photography', 'funeral'],
    required: [true, '服务分类是必填项']
  },
  serviceName: {
    type: String,
    required: [true, '服务名称是必填项'],
    trim: true,
    maxlength: [100, '服务名称不能超过100个字符']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [2000, '服务描述不能超过2000个字符']
  },
  images: {
    type: [String],
    default: []
  },
  pricing: {
    type: {
      type: String,
      enum: ['fixed', 'range', 'custom'],
      default: 'fixed'
    },
    price: { type: Number, min: [0, '价格不能为负数'] },
    priceMin: { type: Number, min: [0, '最低价格不能为负数'] },
    priceMax: { type: Number, min: [0, '最高价格不能为负数'] },
    unit: { type: String, default: '次' }
  },
  applicablePets: {
    type: [String],
    default: ['cat', 'dog']
  },
  businessHours: {
    monday: { open: { type: String, default: '09:00' }, close: { type: String, default: '18:00' }, closed: { type: Boolean, default: false } },
    tuesday: { open: { type: String, default: '09:00' }, close: { type: String, default: '18:00' }, closed: { type: Boolean, default: false } },
    wednesday: { open: { type: String, default: '09:00' }, close: { type: String, default: '18:00' }, closed: { type: Boolean, default: false } },
    thursday: { open: { type: String, default: '09:00' }, close: { type: String, default: '18:00' }, closed: { type: Boolean, default: false } },
    friday: { open: { type: String, default: '09:00' }, close: { type: String, default: '18:00' }, closed: { type: Boolean, default: false } },
    saturday: { open: { type: String, default: '09:00' }, close: { type: String, default: '18:00' }, closed: { type: Boolean, default: false } },
    sunday: { open: { type: String, default: '09:00' }, close: { type: String, default: '18:00' }, closed: { type: Boolean, default: false } }
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: { type: [Number], default: [] },
    city: String,
    district: String,
    address: String,
    isHomeService: { type: Boolean, default: false }
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'reviewing'],
    default: 'active'
  },
  stats: {
    orderCount: { type: Number, default: 0 },
    rating: { type: Number, min: 0, max: 5, default: 0 },
    reviewCount: { type: Number, default: 0 }
  }
}, {
  timestamps: true
});

// 索引
serviceSchema.index({ merchantId: 1 });
serviceSchema.index({ category: 1 });
serviceSchema.index({ status: 1 });
serviceSchema.index({ 'location.coordinates': '2dsphere' });
serviceSchema.index({ 'stats.rating': -1 });
serviceSchema.index({ createdAt: -1 });

const Service = mongoose.model('Service', serviceSchema);

export default Service;
