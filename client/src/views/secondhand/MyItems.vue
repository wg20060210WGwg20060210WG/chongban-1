<template>
  <div class="my-items-page">
    <div class="page-header">
      <button class="back-btn" @click="$router.back()" aria-label="返回">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M15 18l-6-6 6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
      </button>
      <h1 class="page-title">我的商品</h1>
      <button class="header-action" @click="$router.push('/secondhand/publish')" aria-label="发布商品">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
      </button>
    </div>

    <div class="status-tabs" role="tablist">
      <button v-for="tab in statusTabs" :key="tab.value" class="status-tab" :class="{ active: currentStatus === tab.value }" role="tab" :aria-selected="currentStatus === tab.value" @click="switchStatus(tab.value)">
        {{ tab.label }}
      </button>
    </div>

    <div class="items-list">
      <TransitionGroup name="card-stagger">
        <div v-for="(item, index) in filteredItems" :key="item._id" class="item-card" :style="{ '--delay': Math.min(index * 0.06, 0.5) + 's' }">
          <div class="item-img-wrap" @click="goToDetail(item._id)">
            <img v-if="item.images?.length" :src="resolveFileUrl(item.images[0])" :alt="item.title" class="item-img" loading="lazy" />
            <div v-else class="item-img-placeholder">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="18" height="18" rx="3" stroke="var(--color-border)" stroke-width="1.2"/></svg>
            </div>
            <span class="status-badge" :class="item.status">{{ statusLabels[item.status] }}</span>
          </div>
          <div class="item-body" @click="goToDetail(item._id)">
            <h3 class="item-title">{{ item.title }}</h3>
            <div class="item-price-row">
              <span class="item-price">&yen;{{ item.sellingPrice }}</span>
              <span v-if="item.originalPrice > item.sellingPrice" class="item-original">&yen;{{ item.originalPrice }}</span>
            </div>
            <div class="item-meta">
              <span>{{ conditionLabels[item.condition] }}</span>
              <span>{{ formatTime(item.createdAt) }}</span>
            </div>
          </div>
          <div class="item-actions">
            <button v-if="item.status !== 'sold' && item.status !== 'removed'" class="action-btn edit" @click="goToEdit(item._id)">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="currentColor" stroke-width="1.5"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" stroke-width="1.5"/></svg>
              编辑
            </button>
            <button v-if="item.status === 'available'" class="action-btn remove" @click="confirmRemove(item._id)" :disabled="removingId === item._id">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" stroke="currentColor" stroke-width="1.5"/></svg>
              下架
            </button>
          </div>
        </div>
      </TransitionGroup>

      <!-- Loading -->
      <div v-if="store.loading && !items.length" class="skeleton-list">
        <div v-for="i in 3" :key="i" class="skeleton-card">
          <div class="skeleton-img"></div>
          <div class="skeleton-body">
            <div class="skeleton-line w80"></div>
            <div class="skeleton-line w50"></div>
          </div>
        </div>
      </div>

      <!-- Empty -->
      <div v-else-if="!filteredItems.length" class="empty-state">
        <svg width="80" height="80" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <rect x="3" y="3" width="18" height="18" rx="3" stroke="var(--color-border)" stroke-width="1.2"/>
          <path d="M12 8v4M12 16h.01" stroke="var(--color-text-muted)" stroke-width="2" stroke-linecap="round"/>
        </svg>
        <h3>暂无商品</h3>
        <p>{{ currentStatus ? '该状态下没有商品' : '还没有发布过商品' }}</p>
        <button class="empty-btn" @click="$router.push('/secondhand/publish')">发布商品</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useSecondhandStore } from '../../stores/secondhand'
import { ITEM_CONDITION_LABELS, ITEM_STATUS_LABELS } from '../../utils/constants'
import { resolveFileUrl } from '../../utils/fileUrl'

const router = useRouter()
const store = useSecondhandStore()

const conditionLabels = ITEM_CONDITION_LABELS
const statusLabels = ITEM_STATUS_LABELS

const currentStatus = ref('')
const removingId = ref(null)
const items = ref([])

const statusTabs = [
  { value: '', label: '全部' },
  { value: 'available', label: '在售' },
  { value: 'reserved', label: '已预留' },
  { value: 'sold', label: '已售出' },
  { value: 'removed', label: '已下架' }
]

const filteredItems = computed(() => {
  if (!currentStatus.value) return items.value
  return items.value.filter(i => i.status === currentStatus.value)
})

function switchStatus(val) {
  currentStatus.value = val
}

function formatTime(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return `${d.getMonth() + 1}月${d.getDate()}日`
}

function goToDetail(id) {
  router.push(`/secondhand/${id}`)
}

function goToEdit(id) {
  router.push({ path: '/secondhand/publish', query: { id } })
}

async function confirmRemove(id) {
  if (!confirm('确定要下架此商品吗？')) return
  removingId.value = id
  try {
    await store.removeItem(id)
    items.value = items.value.map(i => i._id === id ? { ...i, status: 'removed' } : i)
  } catch (e) {
    alert(e.message || '下架失败')
  } finally {
    removingId.value = null
  }
}

onMounted(async () => {
  const res = await store.fetchMyItems()
  items.value = store.myItems
})
</script>

<style scoped>
.my-items-page {
  min-height: calc(100vh - 120px);
  background: var(--color-bg);
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: var(--color-bg-white);
  border-bottom: 1px solid var(--color-border-light);
  position: sticky;
  top: 0;
  z-index: 20;
}

.back-btn, .header-action {
  width: 36px;
  height: 36px;
  border: none;
  background: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  color: var(--color-text-primary);
  transition: background 0.2s;
}

.back-btn:hover, .header-action:hover { background: var(--color-bg-muted); }

.page-title { font-size: 17px; font-weight: 700; margin: 0; }

.status-tabs {
  display: flex;
  gap: 6px;
  padding: 12px 16px;
  overflow-x: auto;
  scrollbar-width: none;
  background: var(--color-bg-white);
  border-bottom: 1px solid var(--color-border-light);
}

.status-tabs::-webkit-scrollbar { display: none; }

.status-tab {
  flex-shrink: 0;
  padding: 6px 16px;
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-full);
  background: var(--color-bg-white);
  font-size: 13px;
  color: var(--color-text-muted);
  cursor: pointer;
  transition: all 0.25s;
  font-weight: 500;
}

.status-tab:hover { border-color: var(--color-primary); color: var(--color-primary); }

.status-tab.active {
  background: var(--color-primary);
  color: #fff;
  border-color: var(--color-primary);
}

.items-list { padding: 12px 16px; }

.card-stagger-enter-active {
  transition: all 0.6s cubic-bezier(0.22, 1, 0.36, 1);
  transition-delay: var(--delay, 0s);
}

.card-stagger-enter-from {
  opacity: 0;
  transform: translateY(20px) scale(0.97);
}

.item-card {
  display: flex;
  gap: 12px;
  background: var(--color-bg-white);
  border-radius: var(--radius-md);
  padding: 12px;
  margin-bottom: 10px;
  box-shadow: var(--shadow-card);
  transition: all 0.3s var(--spring-bounce);
}

.item-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-card-hover);
}

.item-img-wrap {
  position: relative;
  width: 100px;
  height: 100px;
  border-radius: var(--radius-sm);
  overflow: hidden;
  flex-shrink: 0;
  cursor: pointer;
}

.item-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.item-img-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-bg-muted);
}

.status-badge {
  position: absolute;
  top: 6px;
  left: 6px;
  padding: 2px 8px;
  border-radius: var(--radius-full);
  font-size: 10px;
  font-weight: 600;
  backdrop-filter: blur(8px);
}

.status-badge.available { background: rgba(16, 185, 129, 0.9); color: #fff; }
.status-badge.reserved { background: rgba(245, 158, 11, 0.9); color: #fff; }
.status-badge.sold { background: rgba(107, 114, 128, 0.9); color: #fff; }
.status-badge.removed { background: rgba(239, 68, 68, 0.9); color: #fff; }

.item-body {
  flex: 1;
  min-width: 0;
  cursor: pointer;
}

.item-title {
  font-size: 15px;
  font-weight: 600;
  margin: 0 0 6px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.item-price-row {
  display: flex;
  align-items: baseline;
  gap: 6px;
  margin-bottom: 6px;
}

.item-price {
  font-size: 18px;
  font-weight: 700;
  color: var(--color-danger);
}

.item-original {
  font-size: 12px;
  color: var(--color-text-muted);
  text-decoration: line-through;
}

.item-meta {
  display: flex;
  gap: 10px;
  font-size: 12px;
  color: var(--color-text-muted);
}

.item-actions {
  display: flex;
  flex-direction: column;
  gap: 6px;
  justify-content: center;
  flex-shrink: 0;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-full);
  background: var(--color-bg-white);
  font-size: 12px;
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all 0.2s;
  font-weight: 500;
  white-space: nowrap;
}

.action-btn:hover { border-color: var(--color-primary); color: var(--color-primary); }
.action-btn.remove:hover { border-color: var(--color-danger); color: var(--color-danger); }
.action-btn:disabled { opacity: 0.5; cursor: not-allowed; }

/* Skeleton */
.skeleton-list { padding: 0; }

.skeleton-card {
  display: flex;
  gap: 12px;
  background: var(--color-bg-white);
  border-radius: var(--radius-md);
  padding: 12px;
  margin-bottom: 10px;
}

.skeleton-img {
  width: 100px;
  height: 100px;
  border-radius: var(--radius-sm);
  background: linear-gradient(110deg, var(--color-bg-muted) 25%, var(--color-bg-light) 37%, var(--color-bg-muted) 63%);
  background-size: 200% 100%;
  animation: shimmer 1.8s ease-in-out infinite;
}

.skeleton-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 8px 0;
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

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* Empty */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 80px 20px;
  gap: 12px;
}

.empty-state h3 { font-size: 18px; font-weight: 700; margin: 0; color: var(--color-text-secondary); }
.empty-state p { font-size: 13px; color: var(--color-text-muted); margin: 0; }

.empty-btn {
  padding: 10px 24px;
  border: none;
  border-radius: var(--radius-full);
  background: var(--color-primary);
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  margin-top: 8px;
}

@media (max-width: 768px) {
  .item-img-wrap { width: 80px; height: 80px; }
  .item-title { font-size: 14px; }
  .item-price { font-size: 16px; }
}
</style>