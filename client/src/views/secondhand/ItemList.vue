<template>
  <div class="secondhand-page">
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
            placeholder="搜索商品名称..."
            @input="onSearchInput"
          />
        </div>
        <select v-model="currentSort" class="sort-select" @change="onSortChange" aria-label="排序方式">
          <option value="latest">最新发布</option>
          <option value="price_asc">价格升序</option>
          <option value="price_desc">价格降序</option>
        </select>
      </div>

      <div class="filter-bar">
        <div class="category-tabs" role="tablist" aria-label="分类筛选">
          <n-space :size="8">
            <n-tag
              v-for="cat in categoryOptions"
              :key="cat.value"
              checkable
              :checked="currentCategory === cat.value"
              @update:checked="switchCategory(cat.value)"
              :bordered="false"
              round
              size="medium"
            >
              {{ cat.label }}
            </n-tag>
          </n-space>
        </div>
        <div class="price-filter">
          <input v-model="priceMin" type="number" class="price-input" placeholder="最低价" min="0" @change="onPriceChange" />
          <span class="price-sep">-</span>
          <input v-model="priceMax" type="number" class="price-input" placeholder="最高价" min="0" @change="onPriceChange" />
        </div>
      </div>
    </div>

    <div class="content-area">
      <div class="item-grid" v-if="store.itemList.length">
        <TransitionGroup name="card-stagger">
          <div
            v-for="(item, index) in store.itemList"
            :key="item._id"
            class="item-card"
            :style="{ '--delay': Math.min(index * 0.06, 0.5) + 's' }"
            @click="goToDetail(item._id)"
            role="article"
            :aria-label="item.title"
          >
            <div class="card-img-wrap">
              <img
                v-if="item.images?.length"
                :src="resolveFileUrl(item.images[0])"
                :alt="item.title"
                class="card-img"
                loading="lazy"
              />
              <div v-else class="card-img-placeholder">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <rect x="3" y="3" width="18" height="18" rx="3" stroke="var(--color-border)" stroke-width="1.2"/>
                  <circle cx="8.5" cy="8.5" r="1.5" fill="var(--color-text-muted)"/>
                  <path d="M21 15l-5-5L5 21" stroke="var(--color-text-muted)" stroke-width="1.2" stroke-linecap="round"/>
                </svg>
              </div>
              <span class="card-condition-badge" :class="item.condition">
                {{ conditionLabels[item.condition] || item.condition }}
              </span>
              <span v-if="item.images?.length > 1" class="card-img-count">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <rect x="3" y="3" width="18" height="18" rx="3" stroke="currentColor" stroke-width="2"/>
                  <rect x="7" y="7" width="14" height="14" rx="2" stroke="currentColor" stroke-width="1.5"/>
                </svg>
                {{ item.images.length }}
              </span>
            </div>
            <div class="card-body">
              <h3 class="card-title">{{ item.title }}</h3>
              <div class="card-price-row">
                <span class="card-price">&yen;{{ item.sellingPrice }}</span>
                <span v-if="item.originalPrice > item.sellingPrice" class="card-original-price">&yen;{{ item.originalPrice }}</span>
                <span v-if="item.isPriceNegotiable" class="card-negotiable">可议价</span>
              </div>
              <div class="card-footer">
                <div class="card-location" v-if="item.location?.city">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" stroke="currentColor" stroke-width="1.5"/>
                    <circle cx="12" cy="10" r="3" stroke="currentColor" stroke-width="1.5"/>
                  </svg>
                  {{ item.location.city }}
                </div>
                <div class="card-stats">
                  <span class="stat-item">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" stroke-width="1.5"/>
                      <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="1.5"/>
                    </svg>
                    {{ item.viewCount || 0 }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </TransitionGroup>
      </div>

      <div v-else-if="store.loading" class="skeleton-grid">
        <div v-for="i in 6" :key="i" class="skeleton-card">
          <div class="skeleton-img"></div>
          <div class="skeleton-body">
            <div class="skeleton-line w80"></div>
            <div class="skeleton-line w50"></div>
            <div class="skeleton-line w40"></div>
          </div>
        </div>
      </div>

      <div v-else class="empty-state">
        <div class="empty-illustration">
          <svg width="120" height="120" viewBox="0 0 120 120" fill="none" aria-hidden="true">
            <circle cx="60" cy="60" r="50" fill="var(--color-primary-light)" stroke="var(--color-primary-border)" stroke-width="1.5"/>
            <rect x="38" y="45" width="44" height="30" rx="6" fill="var(--color-bg-white)" stroke="var(--color-border)" stroke-width="1.5"/>
            <path d="M38 55h44" stroke="var(--color-border)" stroke-width="1"/>
            <circle cx="52" cy="50" r="2" fill="var(--color-text-muted)"/>
            <circle cx="68" cy="50" r="2" fill="var(--color-text-muted)"/>
            <path d="M55 65h10" stroke="var(--color-primary)" stroke-width="2" stroke-linecap="round"/>
          </svg>
        </div>
        <h3 class="empty-title">暂无商品</h3>
        <p class="empty-desc">还没有符合条件的商品，换个筛选条件试试</p>
        <div class="empty-actions">
          <button class="empty-btn" @click="clearAllFilters">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
            清除筛选
          </button>
          <button class="empty-btn primary" @click="goToPublish">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
            </svg>
            发布商品
          </button>
        </div>
      </div>

      <div v-if="store.loading && store.itemList.length" class="loading-indicator">
        <div class="pulse-dots"><i></i><i></i><i></i></div>
      </div>

      <button
        v-if="store.hasMore && !store.loading"
        class="load-more"
        @click="loadMore"
        aria-label="加载更多商品"
      >
        <span>加载更多</span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M6 9l6 6 6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>

      <div v-if="!store.hasMore && store.itemList.length" class="end-hint">
        <span class="end-line"></span>
        <span class="end-text">已经到底啦</span>
        <span class="end-line"></span>
      </div>
    </div>

    <button class="fab" @click="goToPublish" aria-label="发布商品">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M12 5v14M5 12h14" stroke="#fff" stroke-width="2.5" stroke-linecap="round"/>
      </svg>
      <span class="fab-tooltip">发布商品</span>
    </button>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useSecondhandStore } from '../../stores/secondhand'
import { SECONDHAND_CATEGORY_LABELS, ITEM_CONDITION_LABELS } from '../../utils/constants'
import { resolveFileUrl } from '../../utils/fileUrl'
import { NTag, NSpace } from 'naive-ui'

const router = useRouter()
const store = useSecondhandStore()

const categoryOptions = [
  { value: '', label: '全部', svg: 'M4 6h16M4 12h16M4 18h16' },
  { value: 'food', label: '粮食', svg: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 4c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2z' },
  { value: 'litter', label: '猫砂', svg: 'M3 7h18v10H3z' },
  { value: 'cage', label: '笼子', svg: 'M3 3h18v18H3z' },
  { value: 'toy', label: '玩具', svg: 'M12 2l3 7h7l-5.5 4 2 7L12 16l-6.5 4 2-7L2 9h7z' },
  { value: 'clothing', label: '服饰', svg: 'M12 2C8 2 5 5 5 9c0 2 1 4 2 5v1h10v-1c1-1 2-3 2-5 0-4-3-7-7-7z' },
  { value: 'medicine', label: '药品', svg: 'M12 2v20M2 12h20' },
  { value: 'other', label: '其他', svg: 'M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z' }
]

const conditionLabels = ITEM_CONDITION_LABELS

const currentCategory = ref('')
const currentSort = ref('latest')
const searchQuery = ref('')
const priceMin = ref('')
const priceMax = ref('')

let searchTimer = null
function onSearchInput() {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    store.clearList()
    store.fetchItems()
  }, 400)
}

function onSortChange() {
  store.setFilter('sort', currentSort.value)
  store.clearList()
  store.fetchItems()
}

function onPriceChange() {
  store.setFilter('priceMin', priceMin.value)
  store.setFilter('priceMax', priceMax.value)
  store.clearList()
  store.fetchItems()
}

function switchCategory(cat) {
  currentCategory.value = cat
  store.setFilter('category', cat)
  store.clearList()
  store.fetchItems()
}

function clearAllFilters() {
  currentCategory.value = ''
  currentSort.value = 'latest'
  searchQuery.value = ''
  priceMin.value = ''
  priceMax.value = ''
  store.filters.category = ''
  store.filters.sort = 'latest'
  store.filters.priceMin = ''
  store.filters.priceMax = ''
  store.clearList()
  store.fetchItems()
}

function loadMore() {
  store.fetchItems(true)
}

function goToDetail(id) {
  router.push(`/secondhand/${id}`)
}

function goToPublish() {
  router.push('/secondhand/publish')
}

onMounted(() => {
  store.clearList()
  store.fetchItems()
})

onUnmounted(() => {
  store.clearList()
})
</script>

<style scoped>
.secondhand-page {
  min-height: calc(100vh - 120px);
  padding: 0 0 40px;
  background: linear-gradient(180deg, var(--color-bg-light) 0%, var(--color-bg-page) 50%, var(--color-bg-light) 100%);
}

.top-section {
  position: sticky;
  top: 0;
  z-index: 20;
  background: rgba(255, 255, 255, 0.82);
  backdrop-filter: blur(24px) saturate(2);
  -webkit-backdrop-filter: blur(24px) saturate(2);
  border-bottom: 1px solid var(--color-border-light);
  box-shadow: var(--shadow-xs);
}

.search-sort-bar {
  display: flex;
  gap: 10px;
  padding: 10px 16px 0;
  align-items: center;
}

.search-wrap {
  flex: 1;
  position: relative;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: 12px;
  color: var(--color-text-muted);
  pointer-events: none;
}

.search-input {
  width: 100%;
  padding: 8px 16px 8px 36px;
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-full);
  font-size: 13px;
  background: var(--color-bg-white);
  color: var(--color-text-primary);
  transition: border-color 0.2s;
  outline: none;
}

.search-input:focus {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px var(--color-primary-light);
}

.search-input::placeholder {
  color: var(--color-text-muted);
}

.sort-select {
  flex-shrink: 0;
  padding: 8px 28px 8px 12px;
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-full);
  font-size: 13px;
  background: var(--color-bg-white);
  color: var(--color-text-secondary);
  cursor: pointer;
  outline: none;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L5 5L9 1' stroke='%23999' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 10px center;
  transition: border-color 0.2s;
}

.sort-select:focus {
  border-color: var(--color-primary);
}

.filter-bar {
  padding: 0 16px 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.category-tabs {
  display: flex;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
  padding: 6px 0;
}

.category-tabs::-webkit-scrollbar {
  display: none;
}

.category-tabs :deep(.n-tag) {
  border-radius: var(--radius-full) !important;
  padding: 0 14px;
  height: 32px;
  font-size: 13px;
  transition: all var(--transition-normal);
}

.category-tabs :deep(.n-tag:hover) {
  transform: translateY(-1px);
}

.price-filter {
  display: flex;
  align-items: center;
  gap: 8px;
}

.price-input {
  width: 100px;
  padding: 6px 12px;
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-full);
  font-size: 13px;
  background: var(--color-bg-white);
  color: var(--color-text-primary);
  outline: none;
  transition: border-color 0.2s;
}

.price-input:focus {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px var(--color-primary-light);
}

.price-input::placeholder {
  color: var(--color-text-muted);
}

.price-sep {
  color: var(--color-text-muted);
  font-size: 14px;
}

.content-area {
  padding-top: 8px;
}

.item-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 16px;
  padding: 8px 16px 0;
}

.card-stagger-enter-active {
  transition: all 0.6s cubic-bezier(0.22, 1, 0.36, 1);
  transition-delay: var(--delay, 0s);
}

.card-stagger-enter-from {
  opacity: 0;
  transform: translateY(28px) scale(0.95);
}

.item-card {
  background: var(--color-bg-white);
  border-radius: var(--radius-xl);
  overflow: hidden;
  box-shadow: var(--shadow-card);
  cursor: pointer;
  transition: all 0.3s var(--spring-bounce);
}

.item-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-card-hover);
}

.item-card:active {
  transform: translateY(-2px);
}

.card-img-wrap {
  position: relative;
  width: 100%;
  aspect-ratio: 4 / 3;
  overflow: hidden;
  background: var(--color-bg-muted);
}

.card-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.4s var(--ease-out);
}

.item-card:hover .card-img {
  transform: scale(1.05);
}

.card-img-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-bg-muted);
}

.card-condition-badge {
  position: absolute;
  top: 10px;
  left: 10px;
  padding: 3px 10px;
  border-radius: var(--radius-full);
  font-size: 11px;
  font-weight: 600;
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}

.card-condition-badge.new {
  background: rgba(16, 185, 129, 0.9);
  color: #fff;
}

.card-condition-badge.like_new {
  background: rgba(59, 130, 246, 0.9);
  color: #fff;
}

.card-condition-badge.good {
  background: rgba(245, 158, 11, 0.9);
  color: #fff;
}

.card-condition-badge.fair {
  background: rgba(107, 114, 128, 0.9);
  color: #fff;
}

.card-img-count {
  position: absolute;
  bottom: 8px;
  right: 8px;
  display: flex;
  align-items: center;
  gap: 3px;
  padding: 2px 8px;
  border-radius: var(--radius-full);
  background: rgba(0, 0, 0, 0.55);
  color: #fff;
  font-size: 11px;
  font-weight: 500;
  backdrop-filter: blur(4px);
}

.card-body {
  padding: 14px 16px 16px;
}

.card-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--color-text-primary);
  margin: 0 0 8px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.card-price-row {
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin-bottom: 10px;
}

.card-price {
  font-size: 20px;
  font-weight: 700;
  color: var(--color-danger);
  font-variant-numeric: tabular-nums;
}

.card-original-price {
  font-size: 13px;
  color: var(--color-text-muted);
  text-decoration: line-through;
}

.card-negotiable {
  font-size: 10px;
  padding: 1px 6px;
  border-radius: var(--radius-sm);
  background: var(--color-accent-light);
  color: var(--color-accent);
  font-weight: 600;
  border: 1px solid rgba(245, 158, 11, 0.2);
}

.card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 10px;
  border-top: 1px solid var(--color-border);
}

.card-location {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: var(--color-text-muted);
}

.card-stats {
  display: flex;
  gap: 10px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 3px;
  font-size: 11px;
  color: var(--color-text-muted);
}

/* Skeleton */
.skeleton-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 16px;
  padding: 8px 16px 0;
}

.skeleton-card {
  background: var(--color-bg-white);
  border-radius: var(--radius-xl);
  overflow: hidden;
  box-shadow: var(--shadow-card);
}

.skeleton-img {
  width: 100%;
  aspect-ratio: 4 / 3;
  background: linear-gradient(110deg, var(--color-bg-muted) 25%, var(--color-bg-light) 37%, var(--color-bg-muted) 63%);
  background-size: 200% 100%;
  animation: shimmer 1.8s ease-in-out infinite;
}

.skeleton-body {
  padding: 14px 16px 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.skeleton-line {
  height: 14px;
  border-radius: 7px;
  background: linear-gradient(110deg, var(--color-bg-muted) 25%, var(--color-bg-light) 37%, var(--color-bg-muted) 63%);
  background-size: 200% 100%;
  animation: shimmer 1.8s ease-in-out infinite;
}

.skeleton-line.w80 { width: 80%; }
.skeleton-line.w50 { width: 50%; }
.skeleton-line.w40 { width: 40%; height: 10px; }

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* Empty state */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
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
  color: var(--color-text-secondary);
  margin: 0;
}

.empty-desc {
  font-size: 13px;
  color: var(--color-text-muted);
  margin: 0;
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
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-full);
  background: var(--color-bg-white);
  font-size: 13px;
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all 0.2s;
  font-weight: 500;
}

.empty-btn:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.empty-btn.primary {
  background: var(--color-primary);
  color: #fff;
  border-color: var(--color-primary);
}

.empty-btn.primary:hover {
  background: var(--color-primary-dark, #059669);
}

/* Loading */
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
  background: var(--color-primary);
  animation: pulse-dot 1.4s ease-in-out infinite;
  box-shadow: 0 0 8px rgba(16, 185, 129, 0.3);
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
  background: var(--color-bg-white);
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-full);
  font-size: 13px;
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all 0.3s var(--spring-bounce);
  font-weight: 500;
  box-shadow: var(--shadow-sm);
}

.load-more:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
  background: var(--color-primary-light);
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.load-more:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
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
  background: linear-gradient(90deg, transparent, var(--color-border), transparent);
}

.end-text {
  font-size: 12px;
  color: var(--color-text-muted);
  font-weight: 500;
  letter-spacing: 0.5px;
}

/* FAB */
.fab {
  position: fixed;
  bottom: 90px;
  right: 24px;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: linear-gradient(135deg, #10B981 0%, #059669 50%, #047857 100%);
  color: #fff;
  border: none;
  box-shadow: 0 4px 16px rgba(16, 185, 129, 0.35), 0 2px 6px rgba(16, 185, 129, 0.2);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 100;
  animation: fab-pulse 3s ease-in-out infinite;
}

@keyframes fab-pulse {
  0%, 100% { box-shadow: 0 4px 16px rgba(16, 185, 129, 0.35), 0 2px 6px rgba(16, 185, 129, 0.2), 0 0 0 0 rgba(16, 185, 129, 0.15); }
  50% { box-shadow: 0 4px 16px rgba(16, 185, 129, 0.35), 0 2px 6px rgba(16, 185, 129, 0.2), 0 0 0 8px rgba(16, 185, 129, 0); }
}

.fab:hover {
  transform: scale(1.12) rotate(90deg);
  box-shadow: 0 8px 28px rgba(16, 185, 129, 0.5), 0 4px 12px rgba(16, 185, 129, 0.3);
  animation: none;
}

.fab:active {
  transform: scale(0.95) rotate(90deg);
}

.fab:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 4px;
}

.fab-tooltip {
  position: absolute;
  right: calc(100% + 12px);
  background: var(--color-text-primary);
  backdrop-filter: blur(8px);
  color: var(--color-text-white);
  font-size: 12px;
  padding: 5px 12px;
  border-radius: var(--radius-md);
  white-space: nowrap;
  opacity: 0;
  pointer-events: none;
  transition: all 0.25s;
  transform: translateX(4px);
  font-weight: 500;
}

.fab:hover .fab-tooltip {
  opacity: 1;
  transform: translateX(0);
}

@media (prefers-reduced-motion: reduce) {
  .card-stagger-enter-active,
  .category-tab,
  .item-card,
  .card-img,
  .load-more,
  .fab,
  .fab-tooltip {
    transition-duration: 0.01ms !important;
    animation-duration: 0.01ms !important;
  }
  .empty-illustration,
  .pulse-dots i {
    animation: none;
  }
}

@media (max-width: 768px) {
  .search-sort-bar {
    flex-direction: column;
    gap: 8px;
    padding: 8px 12px 0;
  }

  .sort-select {
    align-self: flex-end;
  }

  .filter-bar {
    padding: 0 12px 10px;
  }

  .item-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
    padding: 8px 10px 0;
  }

  .category-tab {
    font-size: 12px;
    padding: 5px 10px;
  }

  .price-input {
    width: 80px;
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
</style>