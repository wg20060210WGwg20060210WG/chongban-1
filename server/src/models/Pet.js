import mongoose from 'mongoose';

// 通用工具：验证关联文档是否存在
const validateRefExists = async (modelName, id) => {
  if (!id) return true;
  const model = mongoose.models[modelName];
  if (!model) return true;
  const exists = await model.exists({ _id: id });
  return exists !== null;
};

const petSchema = new mongoose.Schema({
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, '宠物主人是必填项']
  },
  name: {
    type: String,
    required: [true, '宠物名字是必填项'],
    trim: true
  },
  species: {
    type: String,
    enum: ['cat', 'dog', 'rabbit', 'bird', 'fish', 'hamster', 'other'],
    required: [true, '宠物类型是必填项']
  },
  breed: {
    type: String,
    default: ''
  },
  gender: {
    type: String,
    enum: ['male', 'female'],
    required: [true, '性别是必填项']
  },
  birthday: {
    type: Date
  },
  weight: {
    type: Number,
    min: 0
  },
  color: {
    type: String,
    default: ''
  },
  avatar: {
    type: String,
    default: ''
  },
  photos: {
    type: [{ type: String }],
    default: []
  },
  // healthRecords：健康记录
  healthRecords: {
    // vaccines：疫苗记录
    vaccines: {
      type: [{
        name: {
          type: String,
          required: [true, '疫苗名称是必填项'],
          trim: true
        },
        date: {
          type: Date,
          required: [true, '接种日期是必填项']
        },
        nextDate: {
          type: Date
        },
        hospital: {
          type: String,
          trim: true
        }
      }],
      default: [],
      // 验证 vaccines 数组中的每个元素
      validate: {
        validator: function(vaccines) {
          for (const vaccine of vaccines) {
            // nextDate 不能早于 date
            if (vaccine.nextDate && vaccine.date && vaccine.nextDate < vaccine.date) {
              return false;
            }
          }
          return true;
        },
        message: '下次接种日期不能早于接种日期'
      }
    },
    // dewormings：驱虫记录
    dewormings: {
      type: [{
        type: {
          type: String,
          enum: ['internal', 'external']
        },
        date: {
          type: Date,
          required: [true, '驱虫日期是必填项']
        },
        nextDate: {
          type: Date
        },
        medicine: {
          type: String,
          trim: true
        }
      }],
      default: [],
      validate: {
        validator: function(dewormings) {
          for (const deworming of dewormings) {
            if (deworming.nextDate && deworming.date && deworming.nextDate < deworming.date) {
              return false;
            }
          }
          return true;
        },
        message: '下次驱虫日期不能早于驱虫日期'
      }
    },
    // medicalHistory：病史记录
    medicalHistory: {
      type: [{
        date: {
          type: Date,
          required: [true, '就诊日期是必填项']
        },
        diagnosis: {
          type: String,
          required: [true, '诊断结果是必填项'],
          trim: true
        },
        treatment: {
          type: String,
          trim: true
        },
        hospital: {
          type: String,
          trim: true
        }
      }],
      default: []
    }
  },
  isNeutered: {
    type: Boolean,
    default: false
  },
  specialNeeds: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

// 创建索引
petSchema.index({ ownerId: 1 });
petSchema.index({ ownerId: 1, species: 1 });

// ==================== 中间件：关联文档存在性校验 ====================

petSchema.pre('save', async function() {
  if (this.isModified('ownerId') || this.isNew) {
    const ownerExists = await validateRefExists('User', this.ownerId);
    if (!ownerExists) {
      throw new Error('宠物主人不存在');
    }
  }
});

// 通用：提取更新值
const getUpdateValue = (update, field) => {
  if (update.$set && field in update.$set) return update.$set[field];
  if (field in update) return update[field];
  return undefined;
};

petSchema.pre('findOneAndUpdate', async function() {
  const update = this.getUpdate();
  const ownerId = getUpdateValue(update, 'ownerId');
  if (ownerId !== undefined) {
    const ownerExists = await validateRefExists('User', ownerId);
    if (!ownerExists) {
      throw new Error('宠物主人不存在');
    }
  }
});

// ==================== 中间件：冗余字段联动更新（Pet.name -> Post.petTag.petName）====================

petSchema.post('save', async function(doc) {
  try {
    if (doc.isModified('name')) {
      const Post = mongoose.models.Post;
      if (Post) {
        // 更新所有关联该 Pet 的 Post 的 petTag.petName
        await Post.updateMany(
          { 'petTag.petId': doc._id },
          { $set: { 'petTag.petName': doc.name } }
        );
      }
    }
  } catch (error) {
    console.error('Post petName sync error:', error);
  }
});

// 注意：post('findOneAndUpdate') 钩子中无法获取 update 信息，该功能暂不支持
// 如需更新冗余字段，建议使用单独的服务方法处理

const Pet = mongoose.model('Pet', petSchema);

export default Pet;
