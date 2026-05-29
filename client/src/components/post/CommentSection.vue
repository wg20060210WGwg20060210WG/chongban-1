<template>
  <div class="comment-section">
    <div class="comment-header">
      <span class="comment-title">💬 评论 ({{ totalCount }})</span>
    </div>

    <div class="comment-input-area">
      <div class="input-wrapper">
        <textarea
          v-model="inputContent"
          :placeholder="replyTo ? `回复 @${replyTo.username}...` : '说点什么吧...'"
          class="comment-textarea"
          rows="2"
          @keydown.enter.ctrl="submitComment"
          @keydown.enter.meta="submitComment"
        ></textarea>
        <div class="input-actions">
          <button
            v-if="replyTo"
            class="cancel-reply-btn"
            @click="cancelReply"
          >取消回复</button>
          <button
            class="submit-btn"
            :disabled="!inputContent.trim() || submitting"
            @click="submitComment"
          >{{ submitting ? '发送中...' : '发送' }}</button>
        </div>
      </div>
    </div>

    <div class="comment-list" v-if="comments.length">
      <div
        v-for="comment in comments"
        :key="comment._id"
        class="comment-item"
      >
        <div class="comment-main">
          <div class="comment-avatar-col">
            <img
              v-if="getAuthor(comment).avatar"
              :src="getAuthor(comment).avatar"
              class="comment-avatar"
              @error="$event.target.style.display='none'"
            />
            <div v-else class="comment-avatar-fallback">{{ getAuthor(comment).initial }}</div>
          </div>
          <div class="comment-body">
            <div class="comment-meta">
              <span class="comment-author">{{ getAuthor(comment).name }}</span>
              <span class="comment-time">{{ formatTime(comment.createdAt) }}</span>
              <button
                v-if="isOwner(comment)"
                class="delete-btn"
                @click="handleDelete(comment._id)"
              >删除</button>
            </div>
            <p class="comment-text">{{ comment.content }}</p>
            <div class="comment-actions">
              <button class="reply-btn" @click="startReply(comment)">
                回复
              </button>
              <span v-if="comment.replyCount > 0" class="reply-count">
                {{ comment.replyCount }}条回复
              </span>
            </div>

            <div
              v-if="comment.replies?.length"
              class="replies-list"
            >
              <div
                v-for="reply in comment.replies"
                :key="reply._id"
                class="reply-item"
              >
                <div class="reply-avatar-col">
                  <img
                    v-if="getAuthor(reply).avatar"
                    :src="getAuthor(reply).avatar"
                    class="reply-avatar"
                    @error="$event.target.style.display='none'"
                  />
                  <div v-else class="reply-avatar-fallback">{{ getAuthor(reply).initial }}</div>
                </div>
                <div class="reply-body">
                  <div class="comment-meta">
                    <span class="comment-author">{{ getAuthor(reply).name }}</span>
                    <template v-if="reply.replyToUserId?.username">
                      <span class="reply-arrow">→</span>
                      <span class="reply-target">@{{ reply.replyToUserId.username }}</span>
                    </template>
                    <span class="comment-time">{{ formatTime(reply.createdAt) }}</span>
                    <button
                      v-if="isOwner(reply)"
                      class="delete-btn"
                      @click="handleDelete(reply._id, comment._id)"
                    >删除</button>
                  </div>
                  <p class="comment-text">{{ reply.content }}</p>
                  <div class="comment-actions">
                    <button class="reply-btn" @click="startReply(comment, reply)">
                      回复
                    </button>
                  </div>
                </div>
              </div>

              <button
                v-if="comment.replyCount > (comment.replies?.length || 0)"
                class="load-more-replies"
                @click="loadMoreReplies(comment)"
              >展开更多回复</button>
            </div>
          </div>
        </div>
      </div>

      <button
        v-if="hasMore"
        class="load-more-btn"
        :disabled="loading"
        @click="$emit('load-more')"
      >{{ loading ? '加载中...' : '加载更多评论' }}</button>
    </div>

    <div v-else-if="!loading" class="empty-comments">
      <span class="empty-icon">💬</span>
      <p>还没有评论，快来抢沙发吧！</p>
    </div>

    <div v-if="loading && !comments.length" class="loading-comments">
      <div class="loading-spinner"></div>
      <span>加载评论中...</span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { usePostStore } from '../../stores/post'
import { useAuthStore } from '../../stores/auth'
import { getPostComments } from '../../api/comment'

const props = defineProps({
  postId: { type: String, required: true },
  comments: { type: Array, default: () => [] },
  totalCount: { type: Number, default: 0 },
  hasMore: { type: Boolean, default: false },
  loading: { type: Boolean, default: false }
})

const emit = defineEmits(['load-more', 'commented'])

const postStore = usePostStore()
const authStore = useAuthStore()

const inputContent = ref('')
const submitting = ref(false)
const replyTo = ref(null)
const replyToComment = ref(null)

const currentUserId = computed(() => authStore.userInfo?._id)

function getAuthor(comment) {
  const author = comment.authorId
  if (typeof author === 'object' && author !== null) {
    return {
      name: author.username || '匿名用户',
      avatar: author.avatar || '',
      initial: (author.username || '匿').charAt(0).toUpperCase()
    }
  }
  return { name: '匿名用户', avatar: '', initial: '匿' }
}

function isOwner(comment) {
  const author = comment.authorId
  const authorId = typeof author === 'object' ? author?._id : author
  return authorId === currentUserId.value
}

function formatTime(dateStr) {
  if (!dateStr) return ''
  const now = Date.now()
  const date = new Date(dateStr)
  const diff = now - date.getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`
  if (hours < 24) return `${hours}小时前`
  if (days < 7) return `${days}天前`

  const month = date.getMonth() + 1
  const day = date.getDate()
  return `${month}月${day}日`
}

function startReply(comment, reply = null) {
  replyToComment.value = comment
  replyTo.value = reply
    ? { id: reply.authorId?._id || reply.authorId, username: reply.authorId?.username || '用户' }
    : { id: comment.authorId?._id || comment.authorId, username: comment.authorId?.username || '用户' }
  inputContent.value = ''
}

function cancelReply() {
  replyTo.value = null
  replyToComment.value = null
}

async function submitComment() {
  if (!inputContent.value.trim() || submitting.value) return
  if (!authStore.isLoggedIn) {
    window.location.href = '/login'
    return
  }

  submitting.value = true
  try {
    const data = {
      postId: props.postId,
      content: inputContent.value.trim(),
      _authorInfo: {
        _id: currentUserId.value,
        username: authStore.userInfo?.username,
        avatar: authStore.userInfo?.avatar
      }
    }

    if (replyTo.value && replyToComment.value) {
      data.parentId = replyToComment.value._id
      data.replyToUserId = replyTo.value.id
    }

    await postStore.addComment(data)
    inputContent.value = ''
    replyTo.value = null
    replyToComment.value = null
    emit('commented')
  } catch (err) {
    console.error('评论失败:', err)
  } finally {
    submitting.value = false
  }
}

async function handleDelete(commentId, parentId = null) {
  try {
    await postStore.removeComment(commentId, parentId)
  } catch (err) {
    console.error('删除失败:', err)
  }
}

async function loadMoreReplies(comment) {
  try {
    const res = await getPostComments(props.postId, { page: 1, pageSize: 50 })
    const allComments = res.data.list
    const updated = allComments.find(c => c._id === comment._id)
    if (updated && updated.replies) {
      comment.replies = updated.replies
    }
  } catch {
    // silent
  }
}
</script>

<style scoped>
.comment-section {
  margin-top: 8px;
}

.comment-header {
  margin-bottom: 16px;
}

.comment-title {
  font-size: 16px;
  font-weight: 600;
  color: #1a1a2e;
}

.comment-input-area {
  margin-bottom: 20px;
}

.input-wrapper {
  background: #f8f9fa;
  border-radius: 12px;
  padding: 12px;
}

.comment-textarea {
  width: 100%;
  border: none;
  background: transparent;
  resize: none;
  font-size: 14px;
  line-height: 1.6;
  color: #333;
  outline: none;
  font-family: inherit;
}

.comment-textarea::placeholder {
  color: #b0b0c0;
}

.input-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 8px;
}

.cancel-reply-btn {
  background: none;
  border: 1px solid #ddd;
  color: #666;
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 13px;
  cursor: pointer;
}

.submit-btn {
  background: linear-gradient(135deg, #10B981, #059669);
  color: #fff;
  border: none;
  padding: 6px 18px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: opacity 0.2s;
}

.submit-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.comment-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.comment-item {
  padding: 14px 0;
  border-bottom: 1px solid #f0f0f5;
}

.comment-item:last-child {
  border-bottom: none;
}

.comment-main {
  display: flex;
  gap: 12px;
}

.comment-avatar-col {
  flex-shrink: 0;
}

.comment-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  object-fit: cover;
}

.comment-avatar-fallback {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: linear-gradient(135deg, #10B981, #059669);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 600;
}

.comment-body {
  flex: 1;
  min-width: 0;
}

.comment-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
  flex-wrap: wrap;
}

.comment-author {
  font-size: 14px;
  font-weight: 600;
  color: #1a1a2e;
}

.comment-time {
  font-size: 12px;
  color: #b0b0c0;
}

.reply-arrow {
  font-size: 12px;
  color: #ccc;
}

.reply-target {
  font-size: 12px;
  color: #10B981;
}

.delete-btn {
  background: none;
  border: none;
  color: #ef4444;
  font-size: 12px;
  cursor: pointer;
  padding: 2px 6px;
  border-radius: 4px;
  margin-left: auto;
  opacity: 0.6;
  transition: opacity 0.2s;
}

.delete-btn:hover {
  opacity: 1;
}

.comment-text {
  font-size: 14px;
  line-height: 1.6;
  color: #444;
  margin: 0;
  word-break: break-word;
}

.comment-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 6px;
}

.reply-btn {
  background: none;
  border: none;
  color: #888;
  font-size: 12px;
  cursor: pointer;
  padding: 2px 0;
}

.reply-btn:hover {
  color: #10B981;
}

.reply-count {
  font-size: 12px;
  color: #10B981;
}

.replies-list {
  margin-top: 10px;
  padding-left: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.reply-item {
  display: flex;
  gap: 10px;
  padding: 8px 12px;
  background: #f8f9fa;
  border-radius: 10px;
}

.reply-avatar-col {
  flex-shrink: 0;
}

.reply-avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  object-fit: cover;
}

.reply-avatar-fallback {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: linear-gradient(135deg, #10B981, #059669);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 600;
}

.reply-body {
  flex: 1;
  min-width: 0;
}

.load-more-replies {
  background: none;
  border: none;
  color: #10B981;
  font-size: 13px;
  cursor: pointer;
  padding: 6px 0;
  text-align: left;
}

.load-more-btn {
  background: #f8f9fa;
  border: 1px solid #e8e8ed;
  color: #666;
  padding: 10px 20px;
  border-radius: 20px;
  font-size: 13px;
  cursor: pointer;
  margin-top: 12px;
  transition: all 0.2s;
}

.load-more-btn:hover {
  background: #f0f0f5;
}

.empty-comments {
  text-align: center;
  padding: 30px 20px;
  color: #b0b0c0;
}

.empty-comments .empty-icon {
  font-size: 32px;
  display: block;
  margin-bottom: 8px;
}

.empty-comments p {
  font-size: 14px;
  margin: 0;
}

.loading-comments {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 30px;
  color: #888;
  font-size: 14px;
}

.loading-spinner {
  width: 20px;
  height: 20px;
  border: 2px solid #e8e8ed;
  border-top-color: #10B981;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
