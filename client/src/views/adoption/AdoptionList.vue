<template>
  <div class="adoption-page">
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
            placeholder="搜索宠物名/品种..."
            @input="onSearchInput"
          />
          <button v-if="searchQuery" class="search-clear" @click="clearSearch" aria-label="清除搜索">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
          </button>
        </div>
        <select v-model="currentSort" class="sort-select" @change="onSortChange" aria-label="排序方式">
          <option value="latest">最新发布</option>
          <option value="popular">最多浏览</option>
          <option value="applications">最多申请</option>
        </select>
      </div>

      <div class="filter-bar">
        <div class="species-tabs" role="tablist" aria-label="物种筛选">
          <button
            v-for="sp in speciesOptions"
            :key="sp.value"
            class="species-tab"
            :class="{ active: currentSpecies === sp.value }"
            role="tab"
            :aria-selected="currentSpecies === sp.value"
            @click="switchSpecies(sp.value)"
          >
            <span class="tab-icon"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path :d="sp.svg" fill="currentColor"/></svg></span>
            <span class="tab-label">{{ sp.label }}</span>
          </button>
        </div>
        <div class="status-tabs" role="tablist" aria-label="状态筛选">
          <button
            v-for="st in statusOptions"
            :key="st.value"
            class="status-tab"
            :class="{ active: currentStatus === st.value }"
            role="tab"
            :aria-selected="currentStatus === st.value"
            @click="switchStatus(st.value)"
          >
            {{ st.label }}
          </button>
        </div>
      </div>
    </div>

    <div class="content-area">
      <div class="adoption-grid" v-if="adoptionStore.adoptionList.length">
        <TransitionGroup name="card-stagger">
          <div
            v-for="(item, index) in adoptionStore.adoptionList"
            :key="item._id"
            class="adoption-card"
            :style="{ '--delay': Math.min(index * 0.06, 0.5) + 's' }"
            @click="goToDetail(item._id)"
            role="article"
            :aria-label="item.petInfo?.name || '未命名宠物'"
          >
            <div class="card-img-wrap">
              <img
                v-if="item.petInfo?.photos?.length"
                :src="item.petInfo.photos[0]"
                :alt="item.petInfo.name || '宠物照片'"
                class="card-img"
                loading="lazy"
              />
              <div v-else class="card-img-placeholder">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <circle cx="12" cy="12" r="10" stroke="var(--color-border)" stroke-width="1.2" />
                  <path d="M8 14s1.5 2 4 2 4-2 4-2" stroke="var(--color-text-muted)" stroke-width="1.2" stroke-linecap="round" />
                  <circle cx="9" cy="10" r="1" fill="var(--color-text-muted)" />
                  <circle cx="15" cy="10" r="1" fill="var(--color-text-muted)" />
                </svg>
              </div>
              <span class="card-status-badge" :class="item.status">
                {{ statusMap[item.status] || item.status }}
              </span>
            </div>
            <div class="card-body">
              <h3 class="card-name">{{ item.petInfo?.name || '未命名' }}</h3>
              <div class="card-meta">
                <span class="meta-tag"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path :d="speciesIconSvg[item.petInfo?.species] || speciesIconSvg.other" fill="currentColor"/></svg> {{ speciesLabelMap[item.petInfo?.species] || '其他' }}</span>
                <span v-if="item.petInfo?.gender" class="meta-tag gender" :class="item.petInfo.gender">
                  {{ item.petInfo.gender === 'male' ? '♂ 公' : '♀ 母' }}
                </span>
                <span v-if="item.petInfo?.age" class="meta-tag">{{ item.petInfo.age }}岁</span>
              </div>
              <div class="card-health" v-if="item.petInfo?.isVaccinated || item.petInfo?.isNeutered">
                <span v-if="item.petInfo.isVaccinated" class="health-tag vaccinated">已疫苗</span>
                <span v-if="item.petInfo.isNeutered" class="health-tag neutered">已绝育</span>
              </div>
              <div class="card-footer">
                <div class="card-location" v-if="item.location?.city">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" stroke="currentColor" stroke-width="1.5" />
                    <circle cx="12" cy="10" r="3" stroke="currentColor" stroke-width="1.5" />
                  </svg>
                  {{ item.location.city }}{{ item.location.district ? ' · ' + item.location.district : '' }}
                </div>
                <div class="card-stats">
                  <span class="stat-item">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" stroke-width="1.5"/><circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="1.5"/></svg>
                    {{ item.viewCount || 0 }}
                  </span>
                  <span class="stat-item">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke="currentColor" stroke-width="1.5"/><circle cx="8.5" cy="7" r="4" stroke="currentColor" stroke-width="1.5"/><path d="M20 8v6M23 11h-6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
                    {{ item.applicationCount || 0 }}申请
                  </span>
                </div>
              </div>
            </div>
          </div>
        </TransitionGroup>
      </div>

      <div v-else-if="adoptionStore.loading" class="skeleton-grid">
        <div v-for="i in 6" :key="i" class="skeleton-card">
          <div class="skeleton-img"></div>
          <div class="skeleton-body">
            <div class="skeleton-line w60"></div>
            <div class="skeleton-line w80"></div>
            <div class="skeleton-line w40"></div>
          </div>
        </div>
      </div>

      <div v-else class="empty-state">
        <div class="empty-illustration">
          <svg width="120" height="120" viewBox="0 0 120 120" fill="none" aria-hidden="true">
            <circle cx="60" cy="60" r="50" fill="var(--color-primary-light)" stroke="var(--color-primary-border)" stroke-width="1.5" />
            <path d="M40 65c0-11 9-20 20-20s20 9 20 20" fill="var(--color-bg-white)" stroke="var(--color-border)" stroke-width="1.5" />
            <circle cx="52" cy="62" r="3" fill="var(--color-text-muted)" />
            <circle cx="68" cy="62" r="3" fill="var(--color-text-muted)" />
            <path d="M56 72c2 3 6 3 8 0" stroke="var(--color-text-muted)" stroke-width="1.5" stroke-linecap="round" />
            <path d="M35 55c-2-8 5-15 13-15h24c8 0 15 7 13 15" fill="var(--color-warning-light)" stroke="var(--color-warning)" stroke-width="1" />
          </svg>
        </div>
        <h3 class="empty-title">暂无领养信息</h3>
        <p class="empty-desc">还没有符合条件的领养，换个筛选条件试试</p>
        <div class="empty-actions">
          <button v-if="searchQuery || currentSpecies || currentStatus !== 'pending'" class="empty-btn" @click="clearAllFilters">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
            清除筛选
          </button>
          <button class="empty-btn primary" @click="goToPublish">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/></svg>
            发布领养
          </button>
        </div>
      </div>

      <div v-if="adoptionStore.loading && adoptionStore.adoptionList.length" class="loading-indicator">
        <div class="pulse-dots">
          <i></i><i></i><i></i>
        </div>
      </div>

      <button
        v-if="adoptionStore.hasMore && !adoptionStore.loading"
        class="load-more"
        @click="loadMore"
        aria-label="加载更多领养信息"
      >
        <span>加载更多</span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M6 9l6 6 6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </button>

      <div v-if="!adoptionStore.hasMore && adoptionStore.adoptionList.length" class="end-hint">
        <span class="end-line"></span>
        <span class="end-text">已经到底啦</span>
        <span class="end-line"></span>
      </div>
    </div>

    <button class="fab" @click="goToPublish" aria-label="发布领养">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M12 5v14M5 12h14" stroke="#fff" stroke-width="2.5" stroke-linecap="round" />
      </svg>
      <span class="fab-tooltip">发布领养</span>
    </button>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAdoptionStore } from '../../stores/adoption'

const router = useRouter()
const adoptionStore = useAdoptionStore()

// SVG icon paths (Lucide-style) replacing emoji
const speciesOptions = [
  { value: '', label: '全部', svg: '<path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>' },
  { value: 'cat', label: '猫咪', svg: '<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>' },
  { value: 'dog', label: '狗狗', svg: '<circle cx="12" cy="8" r="4"/><path d="M12 14c-4 0-8 2-8 4v2h16v-2c0-2-4-4-8-4z"/>' },
  { value: 'rabbit', label: '兔兔', svg: '<path d="M12 2C8 2 5 5 5 9c0 2 1 4 2 5v1h10v-1c1-1 2-3 2-5 0-4-3-7-7-7zM9 18h6v2H9v-2z"/>' },
  { value: 'bird', label: '鸟鸟', svg: '<path d="M18 2c-2 0-4 2-4 4l-8 8-2-2-2 2 4 4 2-2 8-8c2 0 4-2 4-4V2h-4z"/>' },
  { value: 'hamster', label: '仓鼠', svg: '<circle cx="9" cy="10" r="2"/><circle cx="15" cy="10" r="2"/><path d="M12 16c-2 0-4-1-4-3s2-4 4-4 4 2 4 4-2 3-4 3z"/>' },
  { value: 'other', label: '其他', svg: '<path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>' }
]

const statusOptions = [
  { value: 'pending', label: '可领养' },
  { value: 'adopted', label: '已领养' },
  { value: '', label: '全部' }
]

const statusMap = {
  pending: '可领养',
  adopted: '已领养',
  closed: '已关闭'
}

const speciesLabelMap = {
  cat: '猫咪', dog: '狗狗', rabbit: '兔兔',
  bird: '鸟鸟', fish: '鱼鱼', hamster: '仓鼠', other: '其他'
}

// SVG icon paths for card species badge
const speciesIconSvg = {
  cat: '<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>',
  dog: '<circle cx="9" cy="10" r="2"/><circle cx="15" cy="10" r="2"/><path d="M12 18c-4 0-7-2-7-4s3-4 7-4 7 2 7 4-3 4-7 4z"/>',
  rabbit: '<path d="M12 2C8 2 5 5 5 9c0 2 1 4 2 5v1h10v-1c1-1 2-3 2-5 0-4-3-7-7-7zM9 18h6v2H9v-2z"/>',
  bird: '<path d="M18 2c-2 0-4 2-4 4l-8 8-2-2-2 2 4 4 2-2 8-8c2 0 4-2 4-4V2h-4z"/>',
  fish: '<path d="M12 4c-4 0-8 4-8 8s4 8 8 8 8-4 8-8-4-8-8-8zm0 2c1 0 2 1 2 2s-1 2-2 2-2-1-2-2 1-2 2-2z"/><path d="M20 12l2-2-2-2"/>',
  hamster: '<circle cx="9" cy="10" r="2"/><circle cx="15" cy="10" r="2"/><path d="M12 16c-2 0-4-1-4-3s2-4 4-4 4 2 4 4-2 3-4 3z"/>',
  other: '<path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>'
}

const currentSpecies = ref('')
const currentStatus = ref('pending')
const searchQuery = ref('')
const currentSort = ref('latest')

let searchTimer = null
function onSearchInput() {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    adoptionStore.setFilter('keyword', searchQuery.value)
    adoptionStore.clearList()
    adoptionStore.fetchAdoptions()
  }, 400)
}
function clearSearch() {
  searchQuery.value = ''
  adoptionStore.setFilter('keyword', '')
  adoptionStore.clearList()
  adoptionStore.fetchAdoptions()
}
function onSortChange() {
  adoptionStore.setFilter('sort', currentSort.value)
  adoptionStore.clearList()
  adoptionStore.fetchAdoptions()
}
function clearAllFilters() {
  searchQuery.value = ''
  currentSpecies.value = ''
  currentStatus.value = 'pending'
  currentSort.value = 'latest'
  adoptionStore.setFilter('keyword', '')
  adoptionStore.setFilter('species', '')
  adoptionStore.setFilter('status', 'pending')
  adoptionStore.setFilter('sort', 'latest')
  adoptionStore.clearList()
  adoptionStore.fetchAdoptions()
}

function switchSpecies(sp) {
  currentSpecies.value = sp
  adoptionStore.setFilter('species', sp)
  adoptionStore.clearList()
  adoptionStore.fetchAdoptions()
}

function switchStatus(st) {
  currentStatus.value = st
  adoptionStore.setFilter('status', st)
  adoptionStore.clearList()
  adoptionStore.fetchAdoptions()
}

function loadMore() {
  adoptionStore.fetchAdoptions(true)
}

function goToDetail(id) {
  router.push(`/adoption/${id}`)
}

function goToPublish() {
  router.push('/adoption/publish')
}

onMounted(() => {
  adoptionStore.setFilter('status', 'pending')
  adoptionStore.clearList()
  adoptionStore.fetchAdoptions()
})

onUnmounted(() => {
  adoptionStore.clearList()
})
</script>

<style scoped>
.adoption-page {
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

.filter-bar {
  padding: 0 16px 12px;
}

/* Search and Sort Bar */
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
  padding: 8px 36px 8px 36px;
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

.search-clear {
  position: absolute;
  right: 8px;
  background: none;
  border: none;
  cursor: pointer;
  color: var(--color-text-muted);
  padding: 4px;
  display: flex;
  align-items: center;
  border-radius: 50%;
  transition: color 0.2s;
}

.search-clear:hover {
  color: var(--color-text-primary);
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

/* Species tabs */
.species-tabs {
  display: flex;
  gap: 6px;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
  padding: 6px 0;
}

.species-tabs::-webkit-scrollbar {
  display: none;
}

.species-tab {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 14px;
  min-height: 36px;
  border: 1.5px solid transparent;
  border-radius: var(--radius-full);
  background: var(--color-bg-muted);
  font-size: 13px;
  color: var(--color-text-muted);
  cursor: pointer;
  transition: all 0.25s var(--spring-bounce);
  white-space: nowrap;
  font-weight: 500;
}

.species-tab:hover {
  color: var(--color-text-secondary);
  background: var(--color-primary-light);
  border-color: var(--color-primary-border);
}

.species-tab:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

.species-tab.active {
  color: var(--color-text-white);
  background: var(--color-primary);
  font-weight: 600;
  box-shadow: var(--shadow-primary);
  border-color: transparent;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.species-tab.active .tab-icon {
  animation: icon-bounce 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes icon-bounce {
  0% { transform: scale(1); }
  50% { transform: scale(1.35); }
  100% { transform: scale(1); }
}

.tab-icon {
  font-size: 14px;
  line-height: 1;
  flex-shrink: 0;
}

/* Status tabs */
.status-tabs {
  display: flex;
  gap: 8px;
  padding: 4px 0;
}

.status-tab {
  padding: 5px 14px;
  min-height: 32px;
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-full);
  background: var(--color-bg-white);
  font-size: 12px;
  color: var(--color-text-muted);
  cursor: pointer;
  transition: all 0.25s var(--ease-out);
  font-weight: 500;
}

.status-tab:hover {
  border-color: var(--color-primary-border);
  color: var(--color-primary);
}

.status-tab:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

.status-tab.active {
  border-color: var(--color-primary);
  color: var(--color-primary);
  background: var(--color-primary-light);
  font-weight: 600;
}

/* Content area */
.content-area {
  padding-top: 8px;
}

.adoption-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 16px;
  padding: 8px 16px 0;
}

/* Card stagger animation */
.card-stagger-enter-active {
  transition: all 0.6s cubic-bezier(0.22, 1, 0.36, 1);
  transition-delay: var(--delay, 0s);
}

.card-stagger-enter-from {
  opacity: 0;
  transform: translateY(28px) scale(0.95);
}

/* Adoption card */
.adoption-card {
  background: var(--color-bg-white);
  border-radius: var(--radius-xl);
  overflow: hidden;
  box-shadow: var(--shadow-card);
  cursor: pointer;
  transition: all 0.3s var(--spring-bounce);
}

.adoption-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-card-hover);
}

.adoption-card:active {
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

.adoption-card:hover .card-img {
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

.card-status-badge {
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

.card-status-badge.pending {
  background: rgba(16, 185, 129, 0.9);
  color: #fff;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.15);
}

.card-status-badge.adopted {
  background: var(--color-gray-500);
  color: var(--color-text-white);
}

.card-status-badge.closed {
  background: var(--color-error);
  color: var(--color-text-white);
}

.card-body {
  padding: 14px 16px 16px;
}

.card-name {
  font-size: 16px;
  font-weight: 700;
  color: var(--color-text-primary);
  margin: 0 0 8px;
  letter-spacing: 0.2px;
}

.card-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 8px;
}

.meta-tag {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: var(--radius-sm);
  background: var(--color-primary-light);
  color: var(--color-primary);
  font-weight: 500;
  border: 1px solid var(--color-primary-border);
}

.meta-tag.gender.male {
  background: var(--color-blue-light);
  color: var(--color-blue);
  border-color: var(--color-blue-border);
}

.meta-tag.gender.female {
  background: var(--color-pink-light);
  color: var(--color-pink);
  border-color: var(--color-pink-border);
}

.card-health {
  display: flex;
  gap: 6px;
  margin-bottom: 10px;
}

.health-tag {
  font-size: 10px;
  padding: 2px 6px;
  border-radius: var(--radius-sm);
  font-weight: 600;
}

.health-tag.vaccinated {
  background: var(--color-success-light);
  color: var(--color-success);
}

.health-tag.neutered {
  background: var(--color-warning-light);
  color: var(--color-warning);
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

/* Skeleton loading */
.skeleton-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
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

.skeleton-line.w60 { width: 60%; }
.skeleton-line.w80 { width: 80%; }
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

/* Loading dots */
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

/* Load more */
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

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .card-stagger-enter-active,
  .species-tab,
  .status-tab,
  .adoption-card,
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

/* Mobile responsive */
@media (max-width: 768px) {
  .search-sort-bar {
    flex-direction: column;
    gap: 8px;
    padding: 8px 12px 0;
  }

  .sort-select {
    align-self: flex-end;
  }

  .adoption-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
    padding: 8px 10px 0;
  }

  .filter-bar {
    padding: 0 12px 10px;
  }

  .species-tab {
    font-size: 12px;
    padding: 5px 10px;
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