<template>
  <div class="service-card" @click="$emit('click', service)">
    <div class="card-image">
      <img
        v-if="service.images && service.images.length > 0"
        :src="resolveFileUrl(service.images[0])"
        :alt="service.serviceName"
        loading="lazy"
      />
      <div v-else class="image-placeholder">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <rect x="3" y="3" width="18" height="18" rx="3" stroke="currentColor" stroke-width="1.5"/>
          <circle cx="8.5" cy="8.5" r="1.5" stroke="currentColor" stroke-width="1.5"/>
          <path d="M21 15l-5-5L5 21" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>
      <span class="category-tag">{{ categoryLabel }}</span>
      <span v-if="service.location?.isHomeService" class="home-badge">上门</span>
    </div>
    <div class="card-body">
      <h3 class="card-title">{{ service.serviceName }}</h3>
      <p class="card-desc">{{ service.description || '暂无描述' }}</p>
      <div class="card-meta">
        <div class="rating" v-if="service.stats?.reviewCount > 0">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="#f59e0b" aria-hidden="true">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
          </svg>
          <span class="rating-num">{{ service.stats.rating.toFixed(1) }}</span>
          <span class="review-count">({{ service.stats.reviewCount }})</span>
        </div>
        <span v-else class="no-review">暂无评价</span>
        <span class="order-count">{{ service.stats?.orderCount || 0 }}单</span>
      </div>
      <div class="card-footer">
        <div class="price">
          <span class="price-symbol">¥</span>
          <span class="price-value">{{ priceText }}</span>
          <span class="price-unit">/{{ service.pricing?.unit || '次' }}</span>
        </div>
        <span class="merchant-name" v-if="service.merchantId?.username">
          {{ service.merchantId.username }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { resolveFileUrl } from '../../utils/fileUrl'

const props = defineProps({
  service: { type: Object, required: true }
})

defineEmits(['click'])

const CATEGORY_MAP = {
  grooming: '美容洗护',
  boarding: '寄养',
  walking: '遛狗',
  training: '训练',
  photography: '摄影',
  funeral: '殡葬'
}

const categoryLabel = computed(() => CATEGORY_MAP[props.service.category] || '其他')

const priceText = computed(() => {
  const p = props.service.pricing
  if (!p) return '面议'
  if (p.type === 'range' && p.priceMin != null && p.priceMax != null) {
    return `${p.priceMin}-${p.priceMax}`
  }
  if (p.price != null) return p.price.toString()
  return '面议'
})
</script>

<style scoped>
.service-card {
  background: #fff;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04), 0 4px 16px rgba(0, 0, 0, 0.03);
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  flex-direction: column;
}

.service-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08), 0 2px 8px rgba(0, 0, 0, 0.04);
}

.card-image {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 10;
  overflow: hidden;
  background: #f5f7f6;
}

.card-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.4s ease;
}

.service-card:hover .card-image img {
  transform: scale(1.05);
}

.image-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #c5c5c5;
  background: linear-gradient(135deg, #f8faf9 0%, #eef2f0 100%);
}

.category-tag {
  position: absolute;
  top: 10px;
  left: 10px;
  background: rgba(16, 185, 129, 0.9);
  backdrop-filter: blur(8px);
  color: #fff;
  font-size: 11px;
  font-weight: 600;
  padding: 3px 10px;
  border-radius: 12px;
  letter-spacing: 0.3px;
}

.home-badge {
  position: absolute;
  top: 10px;
  right: 10px;
  background: rgba(99, 102, 241, 0.9);
  backdrop-filter: blur(8px);
  color: #fff;
  font-size: 11px;
  font-weight: 600;
  padding: 3px 8px;
  border-radius: 12px;
}

.card-body {
  padding: 14px 16px 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1;
}

.card-title {
  font-size: 15px;
  font-weight: 700;
  color: #1a1a2e;
  margin: 0;
  line-height: 1.3;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.card-desc {
  font-size: 13px;
  color: #999;
  margin: 0;
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.card-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.rating {
  display: flex;
  align-items: center;
  gap: 3px;
}

.rating-num {
  font-size: 13px;
  font-weight: 600;
  color: #f59e0b;
}

.review-count {
  font-size: 12px;
  color: #bbb;
}

.no-review {
  font-size: 12px;
  color: #ccc;
}

.order-count {
  font-size: 12px;
  color: #aaa;
}

.card-footer {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  margin-top: auto;
}

.price {
  display: flex;
  align-items: baseline;
}

.price-symbol {
  font-size: 13px;
  font-weight: 600;
  color: #ef4444;
}

.price-value {
  font-size: 20px;
  font-weight: 800;
  color: #ef4444;
  letter-spacing: -0.5px;
}

.price-unit {
  font-size: 12px;
  color: #bbb;
  margin-left: 2px;
}

.merchant-name {
  font-size: 12px;
  color: #aaa;
  max-width: 80px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

@media (max-width: 768px) {
  .card-body {
    padding: 10px 12px 12px;
  }
  .card-title {
    font-size: 14px;
  }
  .price-value {
    font-size: 18px;
  }
}
</style>