<template>
  <div class="my-posts-page">
    <div class="page-header">
      <button class="back-btn" @click="router.push('/profile')">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path d="M15 18l-6-6 6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
      <h1>我的帖子</h1>
      <button class="create-btn" @click="router.push('/community/create')">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
          <path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
        </svg>
        发帖
      </button>
    </div>

    <!-- 骨架屏 -->
    <div v-if="loading && !posts.length" class="skeleton-list">
      <div v-for="i in 4" :key="i" class="skeleton-card">
        <div class="skeleton-thumb"></div>
        <div class="skeleton-body">
          <div class="skeleton-line w70"></div>
          <div class="skeleton-line w90"></div>
          <div class="skeleton-line w40"></div>
        </div>
      </div>
    </div>

    <!-- 帖子列表 -->
    <div v-else-if="posts.length" class="post-list">
      <div v-for="post in posts" :key="post._id" class="post-card" @click="router.push(`/community/${post._id}`)">
        <div class="post-thumb" v-if="post.images?.length">
          <img :src="resolveFileUrl(post.images[0])" :alt="post.title" loading="lazy" />
          <span v-if="post.images.length > 1" class="multi-badge">{{ post.images.length }}图</span>
        </div>
        <div class="post-body">
          <h3 class="post-title">{{ post.title || post.content?.slice(0, 30) || '无标题' }}</h3>
          <p class="post-excerpt">{{ post.content?.slice(0, 80) }}{{ post.content?.length > 80 ? '...' : '' }}</p>
          <div class="post-footer">
            <div class="post-stats">
              <span class="stat">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                  <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" stroke="currentColor" stroke-width="1.5"/>
                </svg>
                {{ formatNum(post.stats?.likeCount) }}
              </span>
              <span class="stat">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                  <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>
                </svg>
                {{ formatNum(post.stats?.commentCount) }}
              </span>
            </div>
            <span class="post-time">{{ formatTime(post.createdAt) }}</span>
          </div>
        </div>
        <button class="delete-btn" @click.stop="handleDelete(post)" title="删除">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
      </div>

      <div v-if="loading" class="loading-more">
        <div class="spinner"></div>
        <span>加载中...</span>
      </div>

      <button v-else-if="hasMore" class="load-more-btn" @click="loadMore">加载更多</button>

      <div v-else class="end-hint">
        <span class="end-line"></span>
        <span class="end-text">没有更多了</span>
        <span class="end-line"></span>
      </div>
    </div>

    <!-- 空状态 -->
    <div v-else class="empty-state">
      <div class="empty-illustration">
        <svg width="120" height="120" viewBox="0 0 120 120" fill="none">
          <circle cx="60" cy="60" r="50" fill="#f0fdf4" stroke="#bbf7d0" stroke-width="1.5"/>
          <rect x="35" y="30" width="50" height="60" rx="6" fill="#fff" stroke="#d1d5db" stroke-width="1.2"/>
          <path d="M45 45h30M45 53h20M45 61h25" stroke="#e5e7eb" stroke-width="2" stroke-linecap="round"/>
          <circle cx="85" cy="80" r="16" fill="#10B981" stroke="#fff" stroke-width="2"/>
          <path d="M80 80h10M85 75v10" stroke="#fff" stroke-width="2.5" stroke-linecap="round"/>
        </svg>
      </div>
      <h3>还没有发过帖子</h3>
      <p>去社区分享你和毛孩子的故事吧</p>
      <button class="go-create-btn" @click="router.push('/community/create')">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
        </svg>
        发布第一篇帖子
      </button>
    </div>

    <!-- 删除确认弹窗 -->
    <n-modal v-model:show="showDeleteModal" preset="dialog" title="确认删除" positive-text="删除" negative-text="取消" @positive-click="confirmDelete">
      确定要删除这篇帖子吗？删除后无法恢复。
    </n-modal>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/auth'
import { useMessage } from 'naive-ui'
import { getPosts, deletePost } from '../../api/post'
import { resolveFileUrl } from '../../utils/fileUrl'

const router = useRouter()
const authStore = useAuthStore()
const message = useMessage()

const posts = ref([])
const loading = ref(false)
const page = ref(1)
const hasMore = ref(false)
const showDeleteModal = ref(false)
const deleteTarget = ref(null)

function formatNum(n) {
  if (!n || n <= 0) return '0'
  if (n >= 10000) return (n / 10000).toFixed(1) + 'w'
  if (n >= 1000) return (n / 1000).toFixed(1) + 'k'
  return String(n)
}

function formatTime(d) {
  if (!d) return ''
  const diff = Date.now() - new Date(d).getTime()
  const m = Math.floor(diff / 60000)
  const h = Math.floor(diff / 3600000)
  const dy = Math.floor(diff / 86400000)
  if (m < 1) return '刚刚'
  if (m < 60) return `${m}分钟前`
  if (h < 24) return `${h}小时前`
  if (dy < 7) return `${dy}天前`
  const dt = new Date(d)
  return `${dt.getMonth() + 1}月${dt.getDate()}日`
}

async function fetchMyPosts(append = false) {
  if (loading.value) return
  loading.value = true
  try {
    const currentPage = append ? page.value + 1 : 1
    const res = await getPosts({
      page: currentPage,
      pageSize: 10,
      sortBy: 'latest',
      authorId: authStore.userInfo?._id
    })
    const data = res.data
    if (append) {
      posts.value.push(...data.list)
    } else {
      posts.value = data.list
    }
    page.value = currentPage
    hasMore.value = currentPage < data.pagination.totalPages
  } catch (err) {
    console.error('获取帖子失败:', err)
  } finally {
    loading.value = false
  }
}

function loadMore() {
  fetchMyPosts(true)
}

function handleDelete(post) {
  deleteTarget.value = post
  showDeleteModal.value = true
}

async function confirmDelete() {
  if (!deleteTarget.value) return
  try {
    await deletePost(deleteTarget.value._id)
    posts.value = posts.value.filter(p => p._id !== deleteTarget.value._id)
    message.success('帖子已删除')
  } catch (e) {
    message.error(e.message || '删除失败')
  } finally {
    deleteTarget.value = null
    showDeleteModal.value = false
  }
}

onMounted(() => fetchMyPosts())
</script>

<style scoped>
.my-posts-page {
  padding: 0 0 40px;
  max-width: 720px;
  margin: 0 auto;
  animation: fade-in 0.4s ease;
}

@keyframes fade-in {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
}

.page-header {
  display: flex;
  align-items: center;
  padding: 16px;
  gap: 12px;
  position: sticky;
  top: 0;
  z-index: 10;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(16px);
  border-bottom: 1px solid rgba(0, 0, 0, 0.04);
}

.back-btn {
  width: 36px;
  height: 36px;
  border-radius: 12px;
  border: none;
  background: #f5f5f5;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #555;
  transition: all 0.2s;
}

.back-btn:hover {
  background: #eee;
  color: #10B981;
}

.page-header h1 {
  flex: 1;
  font-size: 18px;
  font-weight: 700;
  color: var(--color-text-primary);
  margin: 0;
}

.create-btn {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 7px 16px;
  border-radius: 20px;
  border: none;
  background: linear-gradient(135deg, #10B981, #059669);
  color: #fff;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.25s;
  box-shadow: 0 2px 8px rgba(16, 185, 129, 0.3);
}

.create-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 14px rgba(16, 185, 129, 0.4);
}

/* 帖子卡片 */
.post-list {
  padding: 8px 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.post-card {
  display: flex;
  gap: 14px;
  background: #fff;
  border-radius: 14px;
  padding: 14px;
  box-shadow: 0 1px 6px rgba(0, 0, 0, 0.04);
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
}

.post-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.08);
}

.post-thumb {
  width: 100px;
  height: 80px;
  border-radius: 10px;
  overflow: hidden;
  flex-shrink: 0;
  position: relative;
}

.post-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.multi-badge {
  position: absolute;
  bottom: 4px;
  right: 4px;
  padding: 2px 7px;
  border-radius: 8px;
  background: rgba(0, 0, 0, 0.55);
  color: #fff;
  font-size: 10px;
  font-weight: 500;
}

.post-body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.post-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--color-text-primary);
  margin: 0 0 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.post-excerpt {
  font-size: 13px;
  color: var(--color-text-secondary);
  margin: 0;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.post-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 6px;
}

.post-stats {
  display: flex;
  gap: 12px;
}

.stat {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: var(--color-text-muted);
}

.post-time {
  font-size: 11px;
  color: #ccc;
}

.delete-btn {
  position: absolute;
  top: 10px;
  right: 10px;
  width: 30px;
  height: 30px;
  border-radius: 8px;
  border: none;
  background: transparent;
  color: #ccc;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  opacity: 0;
  transition: all 0.2s;
}

.post-card:hover .delete-btn {
  opacity: 1;
}

.delete-btn:hover {
  background: rgba(239, 68, 68, 0.08);
  color: #ef4444;
}

/* 骨架屏 */
.skeleton-list {
  padding: 8px 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.skeleton-card {
  display: flex;
  gap: 14px;
  background: #fff;
  border-radius: 14px;
  padding: 14px;
}

.skeleton-thumb {
  width: 100px;
  height: 80px;
  border-radius: 10px;
  background: linear-gradient(110deg, #f5f5f5 25%, #ececec 37%, #f5f5f5 63%);
  background-size: 200% 100%;
  animation: shimmer 1.8s ease-in-out infinite;
}

.skeleton-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 10px;
  justify-content: center;
}

.skeleton-line {
  height: 14px;
  border-radius: 7px;
  background: linear-gradient(110deg, #f5f5f5 25%, #ececec 37%, #f5f5f5 63%);
  background-size: 200% 100%;
  animation: shimmer 1.8s ease-in-out infinite;
}

.skeleton-line.w70 { width: 70%; }
.skeleton-line.w90 { width: 90%; }
.skeleton-line.w40 { width: 40%; height: 10px; }

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* 加载更多 */
.loading-more {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 24px;
  color: var(--color-text-muted);
  font-size: 13px;
}

.spinner {
  width: 18px;
  height: 18px;
  border: 2px solid #eee;
  border-top-color: #10B981;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.load-more-btn {
  display: block;
  width: 180px;
  margin: 16px auto;
  padding: 10px 0;
  background: #fff;
  border: 1.5px solid #e8e8e8;
  border-radius: 22px;
  color: #777;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.25s;
}

.load-more-btn:hover {
  border-color: #10B981;
  color: #10B981;
}

.end-hint {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 24px;
}

.end-line {
  width: 40px;
  height: 1px;
  background: linear-gradient(90deg, transparent, #e0e0e0, transparent);
}

.end-text {
  font-size: 12px;
  color: #d0d0d0;
}

/* 空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 60px 20px;
  animation: fade-in 0.5s ease;
}

.empty-illustration {
  margin-bottom: 20px;
  animation: float 3.5s ease-in-out infinite;
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
}

.empty-state h3 {
  font-size: 18px;
  font-weight: 700;
  color: var(--color-text-primary);
  margin: 0 0 8px;
}

.empty-state p {
  font-size: 14px;
  color: var(--color-text-muted);
  margin: 0 0 24px;
}

.go-create-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 28px;
  border-radius: 24px;
  border: none;
  background: linear-gradient(135deg, #10B981, #059669);
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 4px 16px rgba(16, 185, 129, 0.3);
}

.go-create-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(16, 185, 129, 0.4);
}
</style>