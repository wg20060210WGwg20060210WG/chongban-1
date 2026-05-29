<template>
  <div class="collections-page">
    <div class="page-header">
      <n-button quaternary @click="router.back()" class="back-btn">
        <template #icon><svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></template>
        返回
      </n-button>
      <h1>我的收藏</h1>
    </div>

    <div v-if="loading && !posts.length" class="skeleton-list">
      <div v-for="i in 4" :key="i" class="skeleton-card">
        <div class="skeleton-img"></div>
        <div class="skeleton-body">
          <div class="skeleton-line w80"></div>
          <div class="skeleton-line w60"></div>
        </div>
      </div>
    </div>

    <div v-else-if="posts.length" class="post-list">
      <div v-for="post in posts" :key="post._id" class="post-item" @click="goToDetail(post._id)">
        <div class="post-cover" v-if="post.images?.length">
          <img :src="resolveFileUrl(post.images[0])" :alt="post.title" />
        </div>
        <div class="post-info">
          <h3 class="post-title">{{ post.title || '无标题' }}</h3>
          <p class="post-excerpt">{{ post.content?.slice(0, 80) }}{{ post.content?.length > 80 ? '...' : '' }}</p>
          <div class="post-meta">
            <span class="meta-author">{{ post.authorId?.username || '匿名' }}</span>
            <span class="meta-stats">
              <span><svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" fill="#ef4444"/></svg> {{ post.stats?.likeCount || 0 }}</span>
              <span><svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" stroke="currentColor" stroke-width="1.5"/></svg> {{ post.stats?.commentCount || 0 }}</span>
            </span>
          </div>
        </div>
      </div>

      <div v-if="hasMore" class="load-more">
        <n-button quaternary :loading="loading" @click="loadMore">加载更多</n-button>
      </div>
    </div>

    <div v-else class="empty-state">
      <div class="empty-icon"><svg width="64" height="64" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="var(--color-warning, #f59e0b)" stroke="var(--color-warning, #f59e0b)" stroke-width="1"/></svg></div>
      <h3>还没有收藏</h3>
      <p>去社区看看有没有喜欢的帖子吧</p>
      <n-button type="primary" @click="router.push('/community')">去社区逛逛</n-button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getPosts } from '../../api/post'
import { resolveFileUrl } from '../../utils/fileUrl'

const router = useRouter()

const posts = ref([])
const loading = ref(false)
const page = ref(1)
const hasMore = ref(true)

async function fetchCollections(loadMore = false) {
  if (loading.value) return
  loading.value = true
  try {
    if (!loadMore) {
      page.value = 1
      posts.value = []
    }
    // 后端需支持 collected 过滤参数，当前先拉取全部帖子
    const res = await getPosts({ page: page.value, pageSize: 10, sortBy: 'latest', type: 'collected' })
    const data = res.data
    const list = data?.list || []
    if (loadMore) {
      posts.value.push(...list)
    } else {
      posts.value = list
    }
    const pagination = data?.pagination
    if (pagination) {
      hasMore.value = pagination.page < pagination.totalPages
    } else {
      hasMore.value = list.length >= 10
    }
  } catch (e) {
    console.error('获取收藏失败:', e)
  } finally {
    loading.value = false
  }
}

function loadMore() {
  page.value++
  fetchCollections(true)
}

function goToDetail(id) {
  router.push(`/community/${id}`)
}

onMounted(() => fetchCollections())
</script>

<style scoped>
.collections-page {
  padding: 8px 0;
  max-width: 800px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 24px;
}

.page-header h1 {
  font-size: 24px;
  font-weight: 700;
  color: var(--color-text-primary);
  margin: 0;
}

.post-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.post-item {
  display: flex;
  gap: 14px;
  background: #fff;
  border-radius: var(--radius-md);
  padding: 14px;
  box-shadow: var(--shadow-card);
  cursor: pointer;
  transition: all 0.25s;
}

.post-item:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.post-cover {
  width: 100px;
  height: 80px;
  border-radius: 10px;
  overflow: hidden;
  flex-shrink: 0;
}

.post-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.post-info {
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
  margin: 0 0 6px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.post-excerpt {
  font-size: 13px;
  color: var(--color-text-secondary);
  margin: 0 0 8px;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.post-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 12px;
  color: var(--color-text-muted);
}

.meta-stats {
  display: flex;
  gap: 10px;
}

.empty-state {
  text-align: center;
  padding: 80px 20px;
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 16px;
}

.empty-state h3 {
  font-size: 18px;
  color: var(--color-text-primary);
  margin: 0 0 8px;
}

.empty-state p {
  color: var(--color-text-muted);
  font-size: 14px;
  margin: 0 0 20px;
}

.load-more {
  text-align: center;
  padding: 20px;
}

.skeleton-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.skeleton-card {
  display: flex;
  gap: 14px;
  background: #fff;
  border-radius: var(--radius-md);
  padding: 14px;
}

.skeleton-img {
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

.skeleton-line.w80 { width: 80%; }
.skeleton-line.w60 { width: 60%; }

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
</style>