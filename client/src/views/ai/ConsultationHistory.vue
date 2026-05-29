<template>
  <div class="consultation-history-page">
    <!-- 页面头部 -->
    <div class="page-header spring-anim">
      <n-button quaternary @click="router.push('/ai')" class="back-btn" aria-label="返回">
        <template #icon>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M19 12H5m0 0l7 7m-7-7l7-7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </template>
      </n-button>
      <h1 class="page-title">问诊历史</h1>
      <n-button quaternary @click="router.push('/ai')" class="new-chat-btn">
        <template #icon>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
        </template>
        新建问诊
      </n-button>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-dashboard spring-anim" style="animation-delay: 0.06s;">
      <div class="stat-card">
        <div class="stat-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" stroke="currentColor" stroke-width="1.5"/>
          </svg>
        </div>
        <div class="stat-value">{{ totalStats.total }}</div>
        <div class="stat-label">总问诊</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon warning">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" stroke="currentColor" stroke-width="1.5"/>
            <path d="M12 9v4M12 17h.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
        </div>
        <div class="stat-value">{{ totalStats.needsVet }}</div>
        <div class="stat-label">需就医</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon success">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="1.5"/>
            <path d="M12 6v6l4 2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
        </div>
        <div class="stat-value">{{ totalStats.recent }}</div>
        <div class="stat-label">近7天</div>
      </div>
    </div>

    <!-- 筛选栏 -->
    <div class="filter-bar spring-anim" style="animation-delay: 0.1s;">
      <n-select
        v-model:value="filterPetId"
        :options="petFilterOptions"
        placeholder="全部宠物"
        clearable
        @update:value="handleFilterChange"
        style="width: 100%; max-width: 200px"
      />
    </div>

    <!-- 骨架屏 -->
    <div v-if="aiStore.loading && !list.length" class="loading-wrap">
      <div v-for="i in 4" :key="i" class="skeleton-card spring-anim" :style="{ animationDelay: `${0.1 + i * 0.05}s` }">
        <div class="skeleton-top">
          <div class="skeleton-avatar"></div>
          <div class="skeleton-line w40"></div>
        </div>
        <div class="skeleton-line w80"></div>
        <div class="skeleton-line w60"></div>
      </div>
    </div>

    <!-- 问诊列表 -->
    <n-spin :show="pageLoading" v-else-if="list.length">
      <div class="history-list">
        <div
          v-for="(item, idx) in list"
          :key="item._id"
          class="history-item card spring-anim"
          :style="{ animationDelay: `${0.12 + idx * 0.05}s` }"
          role="button"
          tabindex="0"
          :aria-label="`查看 ${getPetName(item.petId)} 的问诊记录`"
          @click="goToDetail(item._id)"
          @keydown.enter="goToDetail(item._id)"
        >
          <div class="item-top">
            <div class="pet-info">
              <div class="pet-avatar">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill="currentColor"/>
                </svg>
              </div>
              <span class="pet-name">{{ getPetName(item.petId) }}</span>
            </div>
            <div class="item-tags">
              <span class="urgency-badge" :class="item.aiAnalysis?.urgency">
                {{ getUrgencyLabel(item.aiAnalysis?.urgency) }}
              </span>
              <span v-if="item.aiAnalysis?.needsVet" class="vet-badge">需就医</span>
            </div>
          </div>
          <p class="item-symptoms">{{ item.symptoms }}</p>
          <div class="item-bottom">
            <n-tooltip trigger="hover" :delay="300">
              <template #trigger>
                <span class="item-time">{{ formatTime(item.createdAt) }}</span>
              </template>
              {{ formatFullTime(item.createdAt) }}
            </n-tooltip>
            <span class="item-severity">{{ getSeverityLabel(item.severity) }}</span>
          </div>
        </div>

        <div v-if="aiStore.pagination.totalPages > 1" class="pagination-wrap">
          <n-pagination
            v-model:page="currentPage"
            :page-count="aiStore.pagination.totalPages"
            @update:page="handlePageChange"
          />
        </div>
      </div>
    </n-spin>

    <!-- 空状态 -->
    <div v-else class="empty-state spring-anim" style="animation-delay: 0.15s;">
      <div class="empty-icon">
        <svg width="80" height="80" viewBox="0 0 120 120" fill="none" aria-hidden="true">
          <circle cx="60" cy="60" r="50" fill="#f0fdf4" stroke="#bbf7d0" stroke-width="1.5"/>
          <ellipse cx="60" cy="72" rx="28" ry="20" fill="#fff" stroke="#d1d5db" stroke-width="1"/>
          <circle cx="48" cy="65" r="3" fill="#9ca3af"/>
          <circle cx="72" cy="65" r="3" fill="#9ca3af"/>
          <path d="M54 76c2 3 10 3 12 0" stroke="#9ca3af" stroke-width="1.5" stroke-linecap="round"/>
          <path d="M38 50c-4-12 8-22 22-22s26 10 22 22" fill="#fef3c7" stroke="#fbbf24" stroke-width="1"/>
          <circle cx="45" cy="38" r="4" fill="#fbbf24"/>
          <circle cx="75" cy="38" r="4" fill="#fbbf24"/>
        </svg>
      </div>
      <h3 class="empty-title">暂无问诊记录</h3>
      <p class="empty-desc">为您的宠物进行首次 AI 问诊，获取专业健康建议</p>
      <n-button type="primary" strong size="large" @click="router.push('/ai')">开始问诊</n-button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAiStore } from '../../stores/ai'
import { usePetStore } from '../../stores/pet'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/zh-cn'

dayjs.extend(relativeTime)
dayjs.locale('zh-cn')

const router = useRouter()
const aiStore = useAiStore()
const petStore = usePetStore()

const filterPetId = ref(null)
const currentPage = ref(1)
const pageLoading = ref(false)

const list = computed(() => aiStore.consultations)

// 统计数据
const totalStats = computed(() => {
  const consultations = aiStore.consultations || []
  const now = new Date()
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

  return {
    total: consultations.length,
    needsVet: consultations.filter(c => c.aiAnalysis?.needsVet).length,
    recent: consultations.filter(c => new Date(c.createdAt) >= weekAgo).length
  }
})

const petFilterOptions = computed(() => {
  return (petStore.petList || []).map(pet => ({
    label: pet.name,
    value: pet._id
  }))
})

function getPetName(petId) {
  if (!petId) return '未知宠物'
  const id = typeof petId === 'object' ? petId._id : petId
  const pet = (petStore.petList || []).find(p => p._id === id)
  if (pet) return pet.name
  if (typeof petId === 'object' && petId.name) return petId.name
  return '未知宠物'
}

function getUrgencyLabel(urgency) {
  const map = { low: '低风险', medium: '中等', high: '高风险' }
  return map[urgency] || '未知'
}

function getSeverityLabel(severity) {
  const map = { mild: '轻微', moderate: '中等', severe: '严重' }
  return map[severity] || ''
}

function formatTime(t) {
  return dayjs(t).fromNow()
}

function formatFullTime(t) {
  return dayjs(t).format('YYYY-MM-DD HH:mm')
}

function goToDetail(id) {
  router.push(`/ai/conversation/${id}`)
}

async function handleFilterChange() {
  currentPage.value = 1
  await loadList()
}

async function handlePageChange(page) {
  currentPage.value = page
  pageLoading.value = true
  try {
    await loadList()
  } finally {
    pageLoading.value = false
  }
}

async function loadList() {
  const params = { page: currentPage.value, pageSize: 10 }
  if (filterPetId.value) params.petId = filterPetId.value
  try {
    await aiStore.fetchConsultations(params)
  } catch (err) {
    // 错误已在store中处理
  }
}

onMounted(async () => {
  if (!petStore.petList?.length) {
    await petStore.fetchMyPets()
  }
  await loadList()
})
</script>

<style scoped>
.consultation-history-page {
  min-height: calc(100vh - 120px);
  padding: 20px 16px 40px;
  max-width: 680px;
  margin: 0 auto;
}

/* 页面头部 */
.page-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 20px;
}

.page-title {
  font-size: 20px;
  font-weight: 700;
  margin: 0;
  color: var(--color-text-primary);
  flex: 1;
}

.new-chat-btn {
  margin-left: auto;
}

/* 统计卡片 */
.stats-dashboard {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 20px;
}

.stat-card {
  background: var(--color-bg-white, #fff);
  border-radius: var(--radius-lg, 20px);
  padding: 16px;
  text-align: center;
  box-shadow: var(--shadow-card);
  transition: transform 0.3s var(--spring-bounce, cubic-bezier(0.34, 1.56, 0.64, 1));
}

.stat-card:hover {
  transform: translateY(-4px);
}

.stat-icon {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: var(--color-primary-bg, #ECFDF5);
  color: var(--color-primary, #10B981);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 8px;
}

.stat-icon.warning {
  background: rgba(245, 158, 11, 0.1);
  color: #F59E0B;
}

.stat-icon.success {
  background: var(--color-primary-bg, #ECFDF5);
  color: var(--color-primary, #10B981);
}

.stat-value {
  font-size: 24px;
  font-weight: 800;
  color: var(--color-text-primary, #1F2937);
  margin-bottom: 2px;
}

.stat-label {
  font-size: 12px;
  color: var(--color-text-muted, #9CA3AF);
  font-weight: 500;
}

/* 筛选栏 */
.filter-bar {
  margin-bottom: 20px;
}

/* 骨架屏 */
.loading-wrap {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.skeleton-card {
  background: var(--color-bg-white, #fff);
  border-radius: var(--radius-md, 14px);
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  box-shadow: var(--shadow-card);
}

.skeleton-top {
  display: flex;
  align-items: center;
  gap: 10px;
}

.skeleton-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: linear-gradient(110deg, #f5f5f5 25%, #ececec 37%, #f5f5f5 63%);
  background-size: 200% 100%;
  animation: shimmer 1.8s ease-in-out infinite;
}

.skeleton-line {
  height: 12px;
  border-radius: 6px;
  background: linear-gradient(110deg, #f5f5f5 25%, #ececec 37%, #f5f5f5 63%);
  background-size: 200% 100%;
  animation: shimmer 1.8s ease-in-out infinite;
}

.skeleton-line.w40 { width: 40%; }
.skeleton-line.w80 { width: 80%; }
.skeleton-line.w60 { width: 60%; }

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* 问诊列表 */
.history-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.history-item {
  padding: 16px;
  cursor: pointer;
  transition: transform 0.3s var(--spring-bounce, cubic-bezier(0.34, 1.56, 0.64, 1)), box-shadow 0.3s;
}

.history-item:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-hover);
}

.history-item:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

.item-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.pet-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.pet-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--color-primary-bg);
  color: var(--color-primary);
  display: flex;
  align-items: center;
  justify-content: center;
}

.pet-name {
  font-size: 15px;
  font-weight: 600;
  color: var(--color-text-primary);
}

.item-tags {
  display: flex;
  gap: 6px;
}

.urgency-badge {
  padding: 3px 10px;
  border-radius: var(--radius-full, 9999px);
  font-size: 11px;
  font-weight: 600;
}

.urgency-badge.low {
  background: rgba(16, 185, 129, 0.1);
  color: #10B981;
}

.urgency-badge.medium {
  background: rgba(245, 158, 11, 0.1);
  color: #F59E0B;
}

.urgency-badge.high {
  background: rgba(239, 68, 68, 0.1);
  color: #EF4444;
}

.vet-badge {
  padding: 3px 10px;
  border-radius: var(--radius-full, 9999px);
  font-size: 11px;
  font-weight: 600;
  background: rgba(239, 68, 68, 0.1);
  color: #EF4444;
}

.item-symptoms {
  font-size: 14px;
  color: var(--color-text-secondary);
  margin: 0 0 8px;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.item-bottom {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.item-time {
  font-size: 12px;
  color: var(--color-text-muted);
  cursor: help;
  border-bottom: 1px dashed var(--color-text-muted);
}

.item-severity {
  font-size: 12px;
  color: var(--color-text-muted);
}

.pagination-wrap {
  display: flex;
  justify-content: center;
  margin-top: 24px;
}

/* 空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
  padding: 60px 0;
}

.empty-icon {
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
  color: var(--color-text-primary);
  margin: 0;
}

.empty-desc {
  font-size: 13px;
  color: var(--color-text-muted);
  margin: 0;
}

@media (prefers-reduced-motion: reduce) {
  .spring-anim {
    animation: none !important;
    opacity: 1 !important;
    transform: none !important;
  }
  .empty-icon {
    animation: none !important;
  }
  .skeleton-avatar,
  .skeleton-line {
    animation: none !important;
  }
}

@media (max-width: 600px) {
  .stats-dashboard {
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
  }

  .stat-card {
    padding: 12px 8px;
  }

  .stat-value {
    font-size: 20px;
  }
}
</style>