<template>
  <div class="community-page">
    <div class="top-section">
      <div class="search-bar" :class="{ expanded: searchExpanded }">
        <div class="search-inner" @click="expandSearch">
          <svg class="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none">
            <circle cx="11" cy="11" r="7" stroke="currentColor" stroke-width="1.8"/>
            <path d="M16 16l4.5 4.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
          </svg>
          <input
            ref="searchInputRef"
            v-model="searchQuery"
            class="search-input"
            placeholder="搜索帖子、话题..."
            @keydown.enter="handleSearch"
            @blur="collapseSearch"
          />
          <button v-if="searchQuery" class="search-clear" @mousedown.prevent="clearSearch">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
          </button>
        </div>
      </div>

      <div class="tab-wrapper">
        <div class="tab-scroll" ref="tabScrollRef">
          <button
            v-for="cat in categories"
            :key="cat.value"
            class="cat-tab"
            :class="{ active: currentCat === cat.value }"

            @click="switchCategory(cat.value)"
          >
            <span class="tab-icon">{{ cat.icon }}</span>
            <span class="tab-label">{{ cat.label }}</span>
          </button>
        </div>
      </div>
    </div>

    <div class="content-area">
      <div class="waterfall" v-if="postStore.postList.length">
        <TransitionGroup name="card-stagger">
          <PostCard
            v-for="(post, index) in postStore.postList"
            :key="post._id"
            :post="post"
            :style="{ '--delay': Math.min(index * 0.06, 0.5) + 's' }"
            @click="goToDetail(post._id)"
            @channel-click="onChannelClick"
            @topic-click="onTopicClick"
          />
        </TransitionGroup>
      </div>

      <div v-else-if="postStore.loading" class="skeleton-grid">
        <div v-for="i in 8" :key="i" class="skeleton-card">
          <div class="skeleton-img"></div>
          <div class="skeleton-body">
            <div class="skeleton-line w80"></div>
            <div class="skeleton-line w60"></div>
          </div>
          <div class="skeleton-footer">
            <div class="skeleton-avatar"></div>
            <div class="skeleton-line w30"></div>
          </div>
        </div>
      </div>

      <div v-else class="empty-state">
        <div class="empty-illustration">
          <svg width="120" height="120" viewBox="0 0 120 120" fill="none">
            <circle cx="60" cy="60" r="50" fill="#f0fdf4" stroke="#bbf7d0" stroke-width="1.5"/>
            <ellipse cx="60" cy="72" rx="28" ry="20" fill="#fff" stroke="#d1d5db" stroke-width="1"/>
            <circle cx="48" cy="65" r="3" fill="#9ca3af"/>
            <circle cx="72" cy="65" r="3" fill="#9ca3af"/>
            <path d="M54 76c2 3 10 3 12 0" stroke="#9ca3af" stroke-width="1.5" stroke-linecap="round"/>
            <path d="M38 50c-4-12 8-22 22-22s26 10 22 22" fill="#fef3c7" stroke="#fbbf24" stroke-width="1"/>
            <circle cx="45" cy="38" r="4" fill="#fbbf24"/>
            <circle cx="75" cy="38" r="4" fill="#fbbf24"/>
            <path d="M55 42h10" stroke="#fbbf24" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
        </div>
        <h3 class="empty-title">还没有帖子</h3>
        <p class="empty-desc">快来分享你和毛孩子的故事吧</p>
        <button class="empty-action" @click="goToCreate">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
          发布第一篇帖子
        </button>
      </div>

      <div v-if="postStore.loading && postStore.postList.length" class="loading-indicator">
        <div class="pulse-dots">
          <i></i><i></i><i></i>
        </div>
      </div>

      <button
        v-if="postStore.hasMore && !postStore.loading"
        class="load-more"
        @click="loadMore"
      >
        <span>加载更多</span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
          <path d="M6 9l6 6 6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>

      <div v-if="!postStore.hasMore && postStore.postList.length" class="end-hint">
        <span class="end-line"></span>
        <span class="end-text">已经到底啦</span>
        <span class="end-line"></span>
      </div>
    </div>

    <button class="fab" @click="goToCreate" title="发布帖子">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path d="M12 5v14M5 12h14" stroke="#fff" stroke-width="2.5" stroke-linecap="round"/>
      </svg>
      <span class="fab-tooltip">发帖</span>
    </button>

    <Teleport to="body">
      <Transition name="detail-fade">
        <PostDetail
          v-if="showDetailModal && selectedPostId"
          :post-id="selectedPostId"
          class="detail-modal-overlay"
          @close="closeDetailModal"
        />
      </Transition>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { usePostStore } from '../../stores/post'
import { getPosts } from '../../api/post'
import PostCard from '../../components/post/PostCard.vue'
import PostDetail from './PostDetail.vue'

const router = useRouter()
const route = useRoute()
const postStore = usePostStore()

const showDetailModal = ref(false)
const selectedPostId = ref('')

let pollTimer = null

const categories = [
  { value: 'all', label: '推荐', icon: '✨' },
  { value: '猫咪日常', label: '猫咪', icon: '🐱' },
  { value: '狗狗日常', label: '狗狗', icon: '🐶' },
  { value: '萌宠瞬间', label: '萌宠日常', icon: '🐾' },
  { value: '养宠心得', label: '养宠攻略', icon: '📖' },
  { value: '求助问答', label: '求助问答', icon: '❓' },
  { value: '宠物健康', label: '宠物健康', icon: '💊' },
  { value: '宠物美食', label: '宠物美食', icon: '🍖' },
  { value: '遛弯日记', label: '遛弯日记', icon: '🚶' }
]

const currentCat = ref('all')
const tabScrollRef = ref(null)
const searchExpanded = ref(false)
const searchQuery = ref('')
const searchInputRef = ref(null)

function expandSearch() {
  searchExpanded.value = true
  nextTick(() => searchInputRef.value?.focus())
}

function collapseSearch() {
  if (!searchQuery.value) searchExpanded.value = false
}

function clearSearch() {
  searchQuery.value = ''
  searchExpanded.value = false
}

function handleSearch() {
  if (!searchQuery.value.trim()) return
  postStore.setFilter('keyword', searchQuery.value.trim())
  postStore.clearPosts()
  postStore.fetchPosts()
}

function switchCategory(cat) {
  currentCat.value = cat
  if (cat === 'all') {
    postStore.setFilter('channel', '')
  } else {
    postStore.setFilter('channel', cat)
  }
  postStore.clearPosts()
  postStore.fetchPosts()
}

function onChannelClick(channel) {
  currentCat.value = channel
  postStore.setFilter('channel', channel)
  postStore.clearPosts()
  postStore.fetchPosts()
}

function onTopicClick(topic) {
  postStore.setFilter('keyword', '#' + topic)
  postStore.clearPosts()
  postStore.fetchPosts()
}

function loadMore() {
  postStore.fetchPosts(true)
}

function goToDetail(id) {
  selectedPostId.value = id
  showDetailModal.value = true
  document.body.style.overflow = 'hidden'
  document.addEventListener('keydown', onModalKeydown)
}

function closeDetailModal(payload) {
  showDetailModal.value = false
  selectedPostId.value = ''
  postStore.currentPost = null
  postStore.comments = []
  document.body.style.overflow = ''
  document.removeEventListener('keydown', onModalKeydown)

  if (payload?.filterChannel) {
    const ch = payload.filterChannel
    currentCat.value = ch
    postStore.setFilter('channel', ch)
    postStore.clearPosts()
    postStore.fetchPosts()
  }
}

function onModalKeydown(e) {
  if (e.key === 'Escape') closeDetailModal()
}

function goToCreate() {
  router.push('/community/create')
}

onMounted(() => {
  postStore.clearPosts()
  postStore.fetchPosts()

  pollTimer = setInterval(async () => {
    try {
      const params = {
        page: 1,
        pageSize: postStore.pagination.pageSize,
        sortBy: postStore.filters.sortBy
      }
      const res = await getPosts(params)
      const latestList = res.data.list
      for (const latest of latestList) {
        const existing = postStore.postList.find(p => p._id === latest._id)
        if (existing && latest.stats) {
          existing.stats = latest.stats
        }
      }
    } catch {}
  }, 30000)
})

onUnmounted(() => {
  if (pollTimer) { clearInterval(pollTimer); pollTimer = null }
  postStore.clearPosts()
})


</script>

<style scoped>
.community-page {
  min-height: calc(100vh - 120px);
  padding: 0 0 40px;
  background: linear-gradient(180deg, #f8faf9 0%, #f0f5f3 50%, #f8faf9 100%);
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

.search-bar {
  padding: 14px 16px 6px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.search-inner {
  display: flex;
  align-items: center;
  gap: 10px;
  background: #f5f7f6;
  border-radius: 24px;
  padding: 10px 16px;
  cursor: text;
  transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1.5px solid transparent;
}

.search-bar.expanded .search-inner {
  background: #fff;
  border-color: #e0e0e0;
}

.search-icon {
  color: #bbb;
  flex-shrink: 0;
  transition: all 0.3s;
}

.search-bar.expanded .search-icon {
  color: #999;
  filter: none;
}

.search-bar.expanded .search-inner:focus-within {
  border-color: rgba(16, 185, 129, 0.5);
  box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.15);
}

.search-input:focus {
  border-color: transparent !important;
  box-shadow: none !important;
}

.search-input {
  flex: 1;
  border: none;
  background: none;
  font-size: 14px;
  color: #333;
  outline: none;
  font-weight: 400;
}

.search-input::placeholder {
  color: #c5c5c5;
}

.search-clear {
  background: none;
  border: none;
  color: #aaa;
  cursor: pointer;
  padding: 3px;
  display: flex;
  align-items: center;
  border-radius: 50%;
  transition: all 0.25s;
}

.search-clear:hover {
  background: rgba(0, 0, 0, 0.05);
  color: #666;
  transform: scale(1.1);
}

.tab-wrapper {
  position: relative;
}

.tab-scroll {
  display: flex;
  gap: 6px;
  padding: 8px 16px 14px;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
  position: relative;
}

.tab-scroll::-webkit-scrollbar {
  display: none;
}

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
  transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
  white-space: nowrap;
  position: relative;
  z-index: 1;
  font-weight: 500;
}

.cat-tab:hover {
  color: #666;
  background: rgba(16, 185, 129, 0.06);
  border-color: rgba(16, 185, 129, 0.1);
}

.cat-tab.active {
  color: #fff;
  background: linear-gradient(135deg, #10B981 0%, #059669 50%, #047857 100%);
  font-weight: 600;
  box-shadow: 0 3px 12px rgba(16, 185, 129, 0.35), 0 1px 4px rgba(16, 185, 129, 0.2);
  border-color: transparent;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.tab-icon {
  font-size: 14px;
  line-height: 1;
}

.cat-tab.active .tab-icon {
  animation: icon-bounce 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes icon-bounce {
  0% { transform: scale(1); }
  50% { transform: scale(1.35); }
  100% { transform: scale(1); }
}

.content-area {
  padding-top: 4px;
}

.waterfall {
  column-count: 4;
  column-gap: 12px;
  padding: 10px 12px 0;
}

.card-stagger-enter-active {
  transition: all 0.6s cubic-bezier(0.22, 1, 0.36, 1);
  transition-delay: var(--delay, 0s);
}

.card-stagger-enter-from {
  opacity: 0;
  transform: translateY(28px) scale(0.95);
}

.card-stagger-leave-active {
  transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
}

.card-stagger-leave-to {
  opacity: 0;
  transform: scale(0.92);
}

.skeleton-grid {
  column-count: 4;
  column-gap: 12px;
  padding: 10px 12px 0;
}

.skeleton-card {
  break-inside: avoid;
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  margin-bottom: 10px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04), 0 4px 12px rgba(0, 0, 0, 0.02);
}

.skeleton-img {
  width: 100%;
  aspect-ratio: 3 / 4;
  background: linear-gradient(110deg, #f5f5f5 25%, #ececec 37%, #f5f5f5 63%);
  background-size: 200% 100%;
  animation: shimmer 1.8s ease-in-out infinite;
}

.skeleton-body {
  padding: 10px 12px 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.skeleton-footer {
  padding: 10px 12px 12px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.skeleton-avatar {
  width: 22px;
  height: 22px;
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

.skeleton-line.w80 { width: 80%; }
.skeleton-line.w60 { width: 60%; }
.skeleton-line.w30 { width: 40%; height: 10px; }

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

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
  color: #444;
  margin: 0;
  letter-spacing: 0.3px;
}

.empty-desc {
  font-size: 13px;
  color: #b0b0b0;
  margin: 0;
}

.empty-action {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 16px;
  padding: 12px 28px;
  background: linear-gradient(135deg, #10B981 0%, #059669 50%, #047857 100%);
  color: #fff;
  border: none;
  border-radius: 28px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 16px rgba(16, 185, 129, 0.3), 0 2px 6px rgba(16, 185, 129, 0.2);
  letter-spacing: 0.3px;
}

.empty-action:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 28px rgba(16, 185, 129, 0.4), 0 4px 12px rgba(16, 185, 129, 0.25);
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
  background: linear-gradient(135deg, #10B981, #059669);
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
  background: #fff;
  border: 1.5px solid #e8e8e8;
  border-radius: 28px;
  font-size: 13px;
  color: #777;
  cursor: pointer;
  transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
  font-weight: 500;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.03);
}

.load-more:hover {
  border-color: #10B981;
  color: #10B981;
  background: rgba(16, 185, 129, 0.04);
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(16, 185, 129, 0.12);
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
  letter-spacing: 0.5px;
}

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
  box-shadow:
    0 4px 16px rgba(16, 185, 129, 0.35),
    0 2px 6px rgba(16, 185, 129, 0.2),
    0 0 0 0 rgba(16, 185, 129, 0);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
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

.fab-tooltip {
  position: absolute;
  right: calc(100% + 12px);
  background: rgba(0, 0, 0, 0.78);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  color: #fff;
  font-size: 12px;
  padding: 5px 12px;
  border-radius: 8px;
  white-space: nowrap;
  opacity: 0;
  pointer-events: none;
  transition: all 0.25s;
  transform: translateX(4px);
  font-weight: 500;
  letter-spacing: 0.3px;
}

.fab:hover .fab-tooltip {
  opacity: 1;
  transform: translateX(0);
}

.detail-modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 2000;
}

.detail-fade-enter-active {
  transition: opacity 0.35s cubic-bezier(0.4, 0, 0.2, 1);
}

.detail-fade-leave-active {
  transition: opacity 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.detail-fade-enter-from,
.detail-fade-leave-to {
  opacity: 0;
}

@media (max-width: 1024px) {
  .waterfall, .skeleton-grid {
    column-count: 3;
  }
}

@media (max-width: 768px) {
  .community-page {
    background: linear-gradient(180deg, #f8faf9 0%, #f5f8f7 100%);
  }

  .waterfall, .skeleton-grid {
    column-count: 2;
    column-gap: 10px;
    padding: 10px 10px 0;
  }

  .search-bar {
    padding: 10px 12px 4px;
  }

  .tab-scroll {
    padding: 6px 12px 12px;
    gap: 4px;
  }

  .cat-tab {
    font-size: 12px;
    padding: 6px 12px;
  }

  .tab-icon {
    font-size: 12px;
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
