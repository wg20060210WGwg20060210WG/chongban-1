const STORAGE_PREFIX = 'chongban_'

export const STORAGE_KEYS = {
  TOKEN: `${STORAGE_PREFIX}token`,
  USER_INFO: `${STORAGE_PREFIX}user_info`
}

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1'

export const ROLES = {
  USER: 'user',
  MERCHANT: 'merchant',
  RESCUER: 'rescuer',
  ADMIN: 'admin'
}

export const PET_SPECIES = {
  CAT: 'cat',
  DOG: 'dog',
  RABBIT: 'rabbit',
  BIRD: 'bird',
  FISH: 'fish',
  HAMSTER: 'hamster',
  OTHER: 'other'
}

export const SERVICE_CATEGORIES = {
  GROOMING: 'grooming',
  BOARDING: 'boarding',
  WALKING: 'walking',
  TRAINING: 'training',
  PHOTOGRAPHY: 'photography',
  FUNERAL: 'funeral'
}

export const ORDER_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  REFUNDED: 'refunded'
}

// 二手商品分类
export const SECONDHAND_CATEGORIES = {
  FOOD: 'food',
  LITTER: 'litter',
  CAGE: 'cage',
  TOY: 'toy',
  CLOTHING: 'clothing',
  MEDICINE: 'medicine',
  OTHER: 'other'
}

export const SECONDHAND_CATEGORY_LABELS = {
  food: '宠物粮食',
  litter: '猫砂/尿垫',
  cage: '笼子/窝',
  toy: '玩具',
  clothing: '服饰',
  medicine: '药品/保健',
  other: '其他'
}

// 商品成色
export const ITEM_CONDITIONS = {
  NEW: 'new',
  LIKE_NEW: 'like_new',
  GOOD: 'good',
  FAIR: 'fair'
}

export const ITEM_CONDITION_LABELS = {
  new: '全新',
  like_new: '几乎全新',
  good: '成色良好',
  fair: '一般'
}

// 商品状态
export const ITEM_STATUS = {
  AVAILABLE: 'available',
  RESERVED: 'reserved',
  SOLD: 'sold',
  REMOVED: 'removed'
}

export const ITEM_STATUS_LABELS = {
  available: '在售',
  reserved: '已预留',
  sold: '已售出',
  removed: '已下架'
}

// 二手订单状态
export const SECONDHAND_ORDER_STATUS = {
  PENDING: 'pending',
  PAID: 'paid',
  SHIPPED: 'shipped',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
}

export const SECONDHAND_ORDER_STATUS_LABELS = {
  pending: '待付款',
  paid: '已付款',
  shipped: '已发货',
  completed: '已完成',
  cancelled: '已取消'
}
