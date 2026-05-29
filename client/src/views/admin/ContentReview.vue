<template>
  <div class="content-review">
    <h2 class="page-title">内容审核</h2>

    <n-spin :show="loading">
      <div v-if="posts.length === 0 && !loading" class="empty-state">
        <n-empty description="暂无需要审核的帖子" />
      </div>

      <div v-else class="post-list">
        <div v-for="post in posts" :key="post._id" class="review-card">
          <div class="card-header">
            <div class="author-info">
              <span class="author-name">{{ post.authorId?.username || '未知用户' }}</span>
              <n-tag :type="post.status === 'published' ? 'success' : 'warning'" size="small">
                {{ post.status === 'published' ? '已发布' : '已隐藏' }}
              </n-tag>
            </div>
            <span class="post-time">{{ new Date(post.createdAt).toLocaleString('zh-CN') }}</span>
          </div>
          <div class="card-body">
            <h3 v-if="post.title" class="post-title">{{ post.title }}</h3>
            <p class="post-content">{{ post.content }}</p>
            <div v-if="post.images?.length" class="post-images">
              <img v-for="(img, i) in post.images.slice(0, 3)" :key="i" :src="resolveFileUrl(img)" class="preview-img" />
              <span v-if="post.images.length > 3" class="more-images">+{{ post.images.length - 3 }}</span>
            </div>
          </div>
          <div class="card-actions">
            <n-button v-if="post.status !== 'published'" type="success" size="small" @click="handleReview(post._id, 'published')">
              通过发布
            </n-button>
            <n-button v-if="post.status !== 'hidden'" type="warning" size="small" @click="handleReview(post._id, 'hidden')">
              隐藏帖子
            </n-button>
          </div>
        </div>
      </div>

      <div v-if="pagination.totalPages > 1" class="pagination-wrap">
        <n-pagination v-model:page="page" :page-count="pagination.totalPages" @update:page="loadPosts" />
      </div>
    </n-spin>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useMessage } from 'naive-ui'
import { getPosts } from '../../api/post'
import { reviewPost } from '../../api/admin'
import { resolveFileUrl } from '../../utils/fileUrl'

const message = useMessage()
const loading = ref(false)
const posts = ref([])
const page = ref(1)
const pagination = ref({ page: 1, pageSize: 20, total: 0, totalPages: 0 })

async function loadPosts() {
  loading.value = true
  try {
    const res = await getPosts({ page: page.value, pageSize: 20, status: 'hidden' })
    posts.value = res.data?.list || []
    if (res.data?.pagination) pagination.value = res.data.pagination
  } catch {
    message.error('加载帖子失败')
  } finally {
    loading.value = false
  }
}

async function handleReview(postId, status) {
  try {
    await reviewPost(postId, { status })
    message.success(status === 'published' ? '帖子已发布' : '帖子已隐藏')
    loadPosts()
  } catch (e) {
    message.error(e.message || '操作失败')
  }
}

onMounted(() => loadPosts())
</script>

<style scoped>
.content-review {
  max-width: 900px;
  margin: 0 auto;
  padding: 24px 20px;
  animation: fade-in 0.4s ease;
}

@keyframes fade-in {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
}

.page-title {
  font-size: 24px;
  font-weight: 700;
  color: #1a1a2e;
  margin: 0 0 24px;
}

.empty-state {
  padding: 80px 0;
  text-align: center;
}

.review-card {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.author-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.author-name {
  font-weight: 600;
  color: #1a1a2e;
}

.post-time {
  font-size: 12px;
  color: #999;
}

.post-title {
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 8px;
  color: #1a1a2e;
}

.post-content {
  font-size: 14px;
  color: #555;
  line-height: 1.6;
  margin: 0 0 12px;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.post-images {
  display: flex;
  gap: 8px;
  align-items: center;
}

.preview-img {
  width: 80px;
  height: 80px;
  object-fit: cover;
  border-radius: 8px;
}

.more-images {
  font-size: 12px;
  color: #999;
}

.card-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #f0f0f0;
}

.pagination-wrap {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}
</style>