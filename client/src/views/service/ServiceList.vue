<template>
  <div class="service-page">
    <!-- 搜索与筛选 -->
    <div class="top-section">
      <div class="search-sort-bar">
        <div class="search-wrap">
          <svg class="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle cx="11" cy="11" r="8" stroke="currentColor" stroke-width="2"/>
            <path d="M21 21l-4.35-4.35" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
          <input
            v-model="searchQuery"
            type="text"
            class="search-input"
            placeholder="搜索服务..."
            @input="onSearchInput"
          />
          <button v-if="searchQuery" class="search-clear" @click="clearSearch" aria-label="清除搜索">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
          </button>
        </div>
        <select v-model="currentSort" class="sort-select" @change="onSortChange" aria-label="排序方式">
          <option value="latest">最新发布</option>
          <option value="rating">评分最高</option>
          <option value="orders">订单最多</option>
        </select>
      </div>

      <div class="category-tabs" role="tablist" aria-label="服务分类">
        <button
          v-for="cat in categories"
          :key="cat.value"
          class="cat-tab"
          :class="{ active: currentCategory === cat.value }"
          role="tab"
          :aria-selected="currentCategory === cat.value"
          @click="switchCategory(cat.value)"
        >
          <span class="tab-icon" v-html="cat.icon"></span>
          <span class="tab-label">{{ cat.label }}</span>
        </button>
      </div>
    </div>

    <!-- 服务列表 -->
    <div class="content-area">
      <div v-if="serviceStore.serviceList.length" class="service-grid">
        <TransitionGroup name="card-stagger">
          <ServiceCard
            v-for="(service, index) in serviceStore.serviceList"
            :key="service._id"
            :service="service"
            :style="{ '--delay': Math.min(index * 0.06, 0.5) + 's' }"
            @click="goToDetail(service._id)"
          />
        </TransitionGroup>
      </div>

      <!-- 骨架屏 -->
      <div v-else-if="serviceStore.serviceLoading" class="skeleton-grid">
        <div v-for="i in 8" :key="i" class="skeleton-card">
          <div class="skeleton-img"></div>
          <div class="skeleton-body">
            <div class="skeleton-line w80"></div>
            <div class="skeleton-line w60"></div>
          </div>
          <div class="skeleton-footer">
            <div class="skeleton-line w40"></div>
            <div class="skeleton-line w30"></div>
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-else class="empty-state">
        <div class="empty-illustration">
          <svg width="120" height="120" viewBox="0 0 120 120" fill="none" aria-hidden="true">
            <circle cx="60" cy="60" r="50" fill="#f0fdf4" stroke="#bbf7d0" stroke-width="1.5"/>
            <rect x="35" y="45" width="50" height="35" rx="6" fill="#fff" stroke="#d1d5db" stroke-width="1"/>
            <path d="M45 60h30M45 68h20" stroke="#e5e7eb" stroke-width="1.5" stroke-linecap="round"/>
            <circle cx="60" cy="35" r="8" fill="#10b981" opacity="0.2"/>
            <path d="M57 35l2 2 4-4" stroke="#10b981" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
        <h3 class="empty-title">暂无服务</h3>
        <p class="empty-desc">还没有相关服务，换个分类试试</p>
        <div class="empty-actions">
          <button class="empty-btn" @click="router.push('/merchant')">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M3 12l9-9 9 9M5 10v10a1 1 0 001 1h3a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1h3a1 1 0 001-1V10" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
            商家中心
          </button>
        </div>
      </div>

      <!-- 加载更多 -->
      <div v-if="serviceStore.serviceLoading && serviceStore.serviceList.length" class="loading-indicator">
        <div class="pulse-dots"><i></i><i></i><i></i></div>
      </div>

      <button
        v-if="serviceStore.hasMore && !serviceStore.serviceLoading"
        class="load-more"
        @click="loadMore"
      >
        <span>加载更多</span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M6 9l6 6 6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </button>

      <div v-if="!serviceStore.hasMore && serviceStore.serviceList.length" class="end-hint">
        <span class="end-line"></span>
        <span class="end-text">已经到底啦</span>
        <span class="end-line"></span>
      </div>
    </div>

    <!-- FAB 发布服务 -->
    <button class="fab" @click="router.push('/merchant/services/publish')" aria-label="发布服务">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M12 5v14M5 12h14" stroke="#fff" stroke-width="2.5" stroke-linecap="round"/>
      </svg>
      <span class="fab-tooltip">发布服务</span>
    </button>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useServiceStore } from '../../stores/service'
import ServiceCard from '../../components/service/ServiceCard.vue'

const router = useRouter()
const serviceStore = useServiceStore()

const searchQuery = ref('')
const currentSort = ref('latest')
const currentCategory = ref('')
let searchTimer = null

const categories = [
  { value: '', label: '全部', icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="7" height="7" rx="1.5" stroke="currentColor" stroke-width="1.8"/><rect x="14" y="3" width="7" height="7" rx="1.5" stroke="currentColor" stroke-width="1.8"/><rect x="3" y="14" width="7" height="7" rx="1.5" stroke="currentColor" stroke-width="1.8"/><rect x="14" y="14" width="7" height="7" rx="1.5" stroke="currentColor" stroke-width="1.8"/></svg>' },
  { value: 'grooming', label: '美容洗护', icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M20 7l-2 2m-2 2l-4 4m-4-4l-2-2M4 20h16" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><circle cx="12" cy="7" r="3" stroke="currentColor" stroke-width="1.8"/></svg>' },
  { value: 'boarding', label: '寄养', icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M3 12l9-9 9 9M5 10v10a1 1 0 001 1h3a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1h3a1 1 0 001-1V10" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>' },
  { value: 'walking', label: '遛狗', icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M13 4a1 1 0 100-2 1 1 0 000 2zM8 5a1 1 0 100-2 1 1 0 000 2zM18 7a1 1 0 100-2 1 1 0 000 2zM12 22V8M8 12l4-4 4 4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>' },
  { value: 'training', label: '训练', icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>' },
  { value: 'photography', label: '摄影', icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" stroke="currentColor" stroke-width="1.8"/><circle cx="12" cy="13" r="4" stroke="currentColor" stroke-width="1.8"/></svg>' },
  { value: 'funeral', label: '殡葬', icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 2v20M8 6l4-4 4 4M9 12h6M9 16h6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>' }
]

function switchCategory(value) {
  currentCategory.value = value
  serviceStore.setServiceFilter('category', value)
  serviceStore.fetchServices(true)
}

function onSearchInput() {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    serviceStore.setServiceFilter('keyword', searchQuery.value.trim())
    serviceStore.fetchServices(true)
  }, 400)
}

function clearSearch() {
  searchQuery.value = ''
  serviceStore.setServiceFilter('keyword', '')
  serviceStore.fetchServices(true)
}

function onSortChange() {
  serviceStore.setServiceFilter('sort', currentSort.value)
  serviceStore.fetchServices(true)
}

function loadMore() {
  serviceStore.fetchServices()
}

function goToDetail(id) {
  router.push(`/services/${id}`)
}

onMounted(() => {
  serviceStore.fetchServices(true)
})

onUnmounted(() => {
  clearTimeout(searchTimer)
})
</script>

<style scoped>
.service-page {
  min-height: calc(100vh - 120px);
  padding: 0 0 40px;
  position: relative;
}

.fab {
  position: fixed;
  bottom: 90px;
  right: 24px;
  width: 52px;
  height: 52px;
  border-radius: 50%;
  background: linear-gradient(135deg, #10b981, #059669);
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 16px rgba(16, 185, 129, 0.4);
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  z-index: 50;
}

.fab:hover {
  transform: scale(1.1);
  box-shadow: 0 6px 24px rgba(16, 185, 129, 0.5);
}

.fab:active {
  transform: scale(0.95);
}

.fab-tooltip {
  position: absolute;
  right: 62px;
  white-space: nowrap;
  background: #1a1a2e;
  color: #fff;
  font-size: 12px;
  font-weight: 500;
  padding: 6px 12px;
  border-radius: 8px;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.2s;
}

.fab:hover .fab-tooltip {
  opacity: 1;
}

.empty-actions {
  display: flex;
  gap: 10px;
  margin-top: 8px;
}

.empty-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 18px;
  border: 1.5px solid #e8e8e8;
  border-radius: 28px;
  background: #fff;
  font-size: 13px;
  color: #555;
  cursor: pointer;
  transition: all 0.2s;
  font-weight: 500;
}

.empty-btn:hover {
  border-color: #10b981;
  color: #10b981;
}

.top-section {
  position: sticky;
  top: 0;
  z-index: 20;
  background: rgba(255, 255, 255, 0.82);
  backdrop-filter: blur(24px) saturate(2);
  -webkit-backdrop-filter: blur(24px) saturate(2);
  border-bottom: 1px solid rgba(0, 0, 0, 0.04);
  box-shadow: 0 1px 8px rgba(0, 0, 0, 0.02);
}

.search-sort-bar {
  display: flex;
  gap: 12px;
  padding: 14px 16px 8px;
  align-items: center;
}

.search-wrap {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 10px;
  background: #f5f7f6;
  border-radius: 24px;
  padding: 10px 16px;
  border: 1.5px solid transparent;
  transition: all 0.3s ease;
}

.search-wrap:focus-within {
  background: #fff;
  border-color: rgba(16, 185, 129, 0.4);
  box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
}

.search-icon {
  color: #bbb;
  flex-shrink: 0;
}

.search-input {
  flex: 1;
  border: none;
  background: none;
  font-size: 14px;
  color: #333;
  outline: none;
}

.search-input::placeholder { color: #c5c5c5; }

.search-clear {
  background: none;
  border: none;
  color: #aaa;
  cursor: pointer;
  padding: 3px;
  display: flex;
  border-radius: 50%;
  transition: all 0.2s;
}

.search-clear:hover {
  background: rgba(0, 0, 0, 0.05);
  color: #666;
}

.sort-select {
  padding: 10px 14px;
  border: 1.5px solid #e8e8e8;
  border-radius: 12px;
  background: #fff;
  font-size: 13px;
  color: #555;
  cursor: pointer;
  outline: none;
  transition: border-color 0.2s;
}

.sort-select:focus {
  border-color: #10b981;
}

.category-tabs {
  display: flex;
  gap: 6px;
  padding: 8px 16px 14px;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
}

.category-tabs::-webkit-scrollbar { display: none; }

.cat-tab {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 7px 16px;
  border: 1.5px solid transparent;
  border-radius: 22px;
  background: rgba(0, 0, 0, 0.02);
  font-size: 13px;
  color: #999;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  white-space: nowrap;
  font-weight: 500;
}

.cat-tab:hover {
  color: #666;
  background: rgba(16, 185, 129, 0.06);
}

.cat-tab.active {
  color: #fff;
  background: linear-gradient(135deg, #10b981 0%, #059669 50%, #047857 100%);
  font-weight: 600;
  box-shadow: 0 3px 12px rgba(16, 185, 129, 0.35);
  border-color: transparent;
}

.tab-icon {
  display: flex;
  align-items: center;
  line-height: 1;
}

.content-area {
  padding-top: 4px;
}

.service-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  padding: 16px;
}

.card-stagger-enter-active {
  transition: all 0.6s cubic-bezier(0.22, 1, 0.36, 1);
  transition-delay: var(--delay, 0s);
}

.card-stagger-enter-from {
  opacity: 0;
  transform: translateY(28px) scale(0.95);
}

.skeleton-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  padding: 16px;
}

.skeleton-card {
  background: #fff;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
}

.skeleton-img {
  width: 100%;
  aspect-ratio: 16 / 10;
  background: linear-gradient(110deg, #f5f5f5 25%, #ececec 37%, #f5f5f5 63%);
  background-size: 200% 100%;
  animation: shimmer 1.8s ease-in-out infinite;
}

.skeleton-body {
  padding: 14px 16px 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.skeleton-footer {
  padding: 10px 16px 16px;
  display: flex;
  justify-content: space-between;
}

.skeleton-line {
  height: 12px;
  border-radius: 6px;
  background: linear-gradient(110deg, #f5f5f5 25%, #ececec 37%, #f5f5f5 63%);
  background-size: 200% 100%;
  animation: shimmer 1.8s ease-in-out infinite;
}

.skeleton-line.w80 { width: 80%; }
.skeleton-line.w60 { width: 60%; }
.skeleton-line.w40 { width: 40%; }
.skeleton-line.w30 { width: 30%; }

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 80px 20px 60px;
  gap: 14px;
}

.empty-illustration {
  margin-bottom: 12px;
  animation: float 3.5s ease-in-out infinite;
  filter: drop-shadow(0 8px 20px rgba(16, 185, 129, 0.1));
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

.empty-title {
  font-size: 18px;
  font-weight: 700;
  color: #444;
  margin: 0;
}

.empty-desc {
  font-size: 13px;
  color: #b0b0b0;
  margin: 0;
}

.loading-indicator {
  display: flex;
  justify-content: center;
  padding: 32px;
}

.pulse-dots {
  display: flex;
  gap: 8px;
  align-items: center;
}

.pulse-dots i {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: linear-gradient(135deg, #10b981, #059669);
  animation: pulse-dot 1.4s ease-in-out infinite;
}

.pulse-dots i:nth-child(2) { animation-delay: 0.2s; }
.pulse-dots i:nth-child(3) { animation-delay: 0.4s; }

@keyframes pulse-dot {
  0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
  40% { transform: scale(1.1); opacity: 1; }
}

.load-more {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 170px;
  margin: 24px auto;
  padding: 12px 0;
  background: #fff;
  border: 1.5px solid #e8e8e8;
  border-radius: 28px;
  font-size: 13px;
  color: #777;
  cursor: pointer;
  transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
  font-weight: 500;
}

.load-more:hover {
  border-color: #10b981;
  color: #10b981;
  transform: translateY(-2px);
}

.end-hint {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 14px;
  padding: 28px 16px;
}

.end-line {
  width: 48px;
  height: 1px;
  background: linear-gradient(90deg, transparent, #e0e0e0, transparent);
}

.end-text {
  font-size: 12px;
  color: #d0d0d0;
  font-weight: 500;
}

@media (max-width: 1024px) {
  .service-grid, .skeleton-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 768px) {
  .service-grid, .skeleton-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
    padding: 12px;
  }
  .search-sort-bar {
    padding: 10px 12px 6px;
  }
  .category-tabs {
    padding: 6px 12px 12px;
  }
  .cat-tab {
    font-size: 12px;
    padding: 6px 12px;
  }
  .fab {
    bottom: 80px;
    right: 16px;
    width: 50px;
    height: 50px;
  }
  .fab svg {
    width: 20px;
    height: 20px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .fab,
  .fab-tooltip,
  .card-stagger-enter-active,
  .cat-tab,
  .load-more {
    transition-duration: 0.01ms !important;
  }
  .empty-illustration,
  .pulse-dots i {
    animation: none;
  }
}
</style>