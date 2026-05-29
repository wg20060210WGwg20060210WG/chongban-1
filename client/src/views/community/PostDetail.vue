<template>
  <div class="detail-page">
    <div v-if="postStore.loading && !post" class="detail-loading">
      <div class="loading-spinner"></div>
      <span class="loading-text">加载中...</span>
    </div>

    <template v-else-if="post">
      <div class="detail-layout">
        <div class="media-panel">
          <button class="close-btn" @click="goBack" title="关闭">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
          </button>

          <button class="slide-btn prev" v-if="post.images?.length > 1 && swiperIndex > 0" @click="prevSlide">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M15 18l-6-6 6-6" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </button>
          <div
            class="media-track"
            ref="swiperRef"
            :style="swiperTrackStyle"
            @touchstart="onTouchStart"
            @touchmove="onTouchMove"
            @touchend="onTouchEnd"
            @mousedown="onMouseDown"
            @mousemove="onMouseMove"
            @mouseup="onMouseUp"
            @mouseleave="onMouseUp"
          >
            <div v-for="(img, idx) in post.images" :key="idx" class="media-slide" @click="openPreview(idx)">
              <img :src="img" :alt="`图片${idx+1}`" loading="lazy" />
            </div>
          </div>
          <button class="slide-btn next" v-if="post.images?.length > 1 && swiperIndex < post.images.length - 1" @click="nextSlide">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M9 18l6-6-6-6" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </button>

          <div class="media-counter" v-if="post.images?.length > 1">{{ swiperIndex + 1 }}/{{ post.images.length }}</div>
          <div class="media-dots" v-if="post.images?.length > 1 && post.images.length <= 8">
            <i v-for="(_, idx) in post.images" :key="idx" class="dot" :class="{ active: swiperIndex === idx }"></i>
          </div>

          <div v-if="!post.images?.length" class="media-empty">
            <svg width="56" height="56" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="18" height="18" rx="2" stroke="#555" stroke-width="1.2"/><circle cx="8.5" cy="8.5" r="1.5" fill="#555"/><path d="M21 15l-5-5L5 21" stroke="#555" stroke-width="1.2" stroke-linecap="round"/></svg>
            <span class="empty-media-text">暂无图片</span>
          </div>
        </div>

        <div class="content-panel">
          <div class="panel-header">
            <div class="header-author">
              <div class="avatar-ring">
                <img v-if="post.authorId?.avatar" :src="post.authorId.avatar" class="header-av" @error="$event.target.style.display='none'" />
                <div v-else class="header-av-fb">{{ authorInitial }}</div>
              </div>
              <div class="author-info">
                <span class="header-name">{{ post.authorId?.username || '匿名用户' }}</span>
                <span class="header-time">{{ formatTime(post.createdAt) }}</span>
              </div>
              <button v-if="!isOwner && authStore.isLoggedIn" class="follow-btn" :class="{ followed: isFollowed }" @click="toggleFollow">
                <svg v-if="!isFollowed" width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/></svg>
                {{ isFollowed ? '已关注' : '关注' }}
              </button>
            </div>
            <button class="header-close" @click="goBack" title="关闭">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
            </button>
          </div>

          <div class="panel-scroll" ref="panelScrollRef">
            <div class="note-content">
              <h1 class="note-title" v-if="post.title">{{ post.title }}</h1>
              <p class="note-text">{{ post.content }}</p>
              <div class="note-tags" v-if="post.channel || post.topics?.length || post.petTag?.petName">
                <span v-if="post.channel" class="tag channel-tag" @click="filterByChannel(post.channel)">
                  📢 {{ post.channel }}
                </span>
                <span v-if="post.petTag?.petName" class="tag pet-tag" @click="searchTag(post.petTag.petName)">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" fill="currentColor" opacity="0.15"/><path d="M12 21a9 9 0 100-18 9 9 0 000 18z" stroke="currentColor" stroke-width="1.2"/></svg>
                  {{ post.petTag.petName }}
                </span>
                <span v-for="t in post.topics" :key="t" class="tag" @click="searchTag(t)">#{{ t }}</span>
              </div>
              <div class="note-meta">
                <span>{{ formatTime(post.createdAt) }}</span>
                <template v-if="post.location?.locationName">
                  <span class="meta-sep">·</span>
                  <span class="meta-location">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" stroke="currentColor" stroke-width="1.5"/><circle cx="12" cy="10" r="3" stroke="currentColor" stroke-width="1.5"/></svg>
                    {{ post.location.locationName }}
                  </span>
                </template>
                <span class="meta-sep">·</span>
                <span>{{ formatCount(post.stats?.viewCount) }} 浏览</span>
              </div>
            </div>

            <div class="interaction-bar">
              <button class="ibtn" :class="{ active: isLiked, animating: likeAnimating }" @click="handleLike">
                <div class="ibtn-icon-wrap">
                  <svg class="ibtn-icon heart" :class="{ filled: isLiked }" width="20" height="20" viewBox="0 0 24 24">
                    <path v-if="isLiked" d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" fill="#10B981" stroke="none"/>
                    <path v-else d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" fill="none" stroke="currentColor" stroke-width="1.5"/>
                  </svg>
                </div>
                <span class="ibtn-num">{{ formatCount(post.stats?.likeCount) }}</span>
              </button>
              <button class="ibtn" :class="{ active: isCollected }" @click="handleCollect">
                <div class="ibtn-icon-wrap">
                  <svg class="ibtn-icon star" :class="{ filled: isCollected }" width="20" height="20" viewBox="0 0 24 24">
                    <path v-if="isCollected" d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="#10B981" stroke="none"/>
                    <path v-else d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="none" stroke="currentColor" stroke-width="1.5"/>
                  </svg>
                </div>
                <span class="ibtn-num">{{ formatCount(post.stats?.collectCount) }}</span>
              </button>
              <button class="ibtn" @click="scrollToComment">
                <div class="ibtn-icon-wrap">
                  <svg class="ibtn-icon" width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></svg>
                </div>
                <span class="ibtn-num">{{ formatCount(post.stats?.commentCount) }}</span>
              </button>
              <button class="ibtn share-btn" @click="handleShare">
                <div class="ibtn-icon-wrap">
                  <svg class="ibtn-icon" width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><polyline points="16 6 12 2 8 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><line x1="12" y1="2" x2="12" y2="15" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
                </div>
                <span class="ibtn-num">分享</span>
              </button>
            </div>

            <div class="comment-section" id="comment-section">
              <div class="comment-title">
                <span class="comment-title-text">评论</span>
                <span class="comment-count">{{ totalCount }}</span>
              </div>

              <div class="reply-banner" v-if="replyTo">
                <div class="reply-banner-content">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M9 17l-5-5 5-5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M4 12h11a4 4 0 014 4v1" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                  <span>回复 <b>@{{ replyTo.username }}</b></span>
                </div>
                <button class="reply-cancel" @click="cancelReply">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
                </button>
              </div>

              <div class="comment-list" v-if="comments.length">
                <div v-for="c in comments" :key="c._id" class="c-item">
                  <div class="c-avatar-wrap">
                    <img v-if="getAuthor(c).avatar" :src="getAuthor(c).avatar" class="c-av" @error="$event.target.style.display='none'" />
                    <div v-else class="c-av-fb">{{ getAuthor(c).initial }}</div>
                  </div>
                  <div class="c-body">
                    <div class="c-head">
                      <span class="c-name">{{ getAuthor(c).name }}</span>
                      <span class="c-time">{{ formatTime(c.createdAt) }}</span>
                    </div>
                    <p class="c-text" :class="{ collapsed: isLongComment(c.content) && !isCommentExpanded(c._id) }">{{ c.content }}</p>
                    <button
                      v-if="isLongComment(c.content)"
                      class="expand-btn"
                      @click="toggleComment(c._id)"
                    >
                      {{ isCommentExpanded(c._id) ? '收起' : '展开全文' }}
                    </button>
                    <div class="c-actions">
                      <button class="c-act-btn" @click="startReply(c)">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></svg>
                        回复
                      </button>
                      <button v-if="isOwnerComment(c)" class="c-act-btn del" @click="handleDeleteComment(c._id)">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
                        删除
                      </button>
                    </div>

                    <div v-if="c.replies?.length" class="c-replies">
                      <div v-for="r in getVisibleReplies(c)" :key="r._id" class="c-reply">
                        <div class="c-reply-avatar-wrap">
                          <img v-if="getAuthor(r).avatar" :src="getAuthor(r).avatar" class="c-reply-av" @error="$event.target.style.display='none'" />
                          <div v-else class="c-reply-av-fb">{{ getAuthor(r).initial }}</div>
                        </div>
                        <div class="c-reply-body">
                          <div class="c-head">
                            <span class="c-name">{{ getAuthor(r).name }}</span>
                            <template v-if="r.replyToUserId?.username">
                              <span class="c-arrow">
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none"><path d="M9 18l6-6-6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                              </span>
                              <span class="c-target">@{{ r.replyToUserId.username }}</span>
                            </template>
                            <span class="c-time">{{ formatTime(r.createdAt) }}</span>
                          </div>
                          <p class="c-text" :class="{ collapsed: isLongComment(r.content) && !isCommentExpanded(r._id) }">{{ r.content }}</p>
                          <button
                            v-if="isLongComment(r.content)"
                            class="expand-btn reply-expand"
                            @click="toggleComment(r._id)"
                          >
                            {{ isCommentExpanded(r._id) ? '收起' : '展开' }}
                          </button>
                          <div class="c-actions">
                            <button class="c-act-btn" @click="startReply(c, r)">
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></svg>
                              回复
                            </button>
                            <button v-if="isOwnerComment(r)" class="c-act-btn del" @click="handleDeleteComment(r._id, c._id)">
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
                              删除
                            </button>
                          </div>
                        </div>
                      </div>
                      <button
                        v-if="getHiddenRepliesCount(c) > 0"
                        class="toggle-replies-btn"
                        @click="toggleReplies(c._id)"
                      >
                        展开 {{ getHiddenRepliesCount(c) }} 条回复
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M6 9l6 6 6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                      </button>
                      <button
                        v-if="isRepliesExpanded(c) && c.replies?.length > COLLAPSE_THRESHOLD"
                        class="toggle-replies-btn collapse"
                        @click="toggleReplies(c._id)"
                      >
                        收起回复
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M18 15l-6-6-6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div v-else-if="!postStore.commentLoading" class="empty-comment" @click="focusInput">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10z" stroke="#ddd" stroke-width="1.2" stroke-linejoin="round"/>
                  <path d="M8 9h8M8 13h4" stroke="#ddd" stroke-width="1.2" stroke-linecap="round"/>
                </svg>
                <p>还没有评论</p>
                <span>快来抢沙发吧</span>
              </div>

              <button
                v-if="postStore.hasMoreComments"
                class="load-more-cmt"
                :disabled="postStore.commentLoading"
                @click="loadMoreComments"
              >
                <span>{{ postStore.commentLoading ? '加载中...' : '查看更多评论' }}</span>
                <svg v-if="!postStore.commentLoading" width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M6 9l6 6 6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
              </button>
            </div>

            <div class="panel-bottom-spacer"></div>
          </div>

          <div class="xhs-input-area" :class="{ focused: inputFocused }">
            <div class="xhs-reply-hint" v-if="replyTo">
              <span class="xhs-reply-text">回复 <b>@{{ replyTo.username }}</b></span>
              <button class="xhs-reply-cancel" @click="cancelReply" tabindex="-1">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
              </button>
            </div>
            <div class="xhs-input-row">
              <textarea
                ref="commentTextarea"
                v-model="inputContent"
                :placeholder="replyTo ? `回复 @${replyTo.username}...` : '说点什么...'"
                class="xhs-textarea"
                rows="1"
                @focus="inputFocused = true"
                @blur="handleInputBlur"
                @keydown.enter.ctrl="submitComment"
                @keydown.enter.meta="submitComment"
              ></textarea>
              <div class="xhs-input-actions">
                <button
                  class="xhs-send-btn"
                  v-if="inputFocused"
                  :disabled="!inputContent.trim() || submitting"
                  @mousedown.prevent="submitComment"
                >
                  <span v-if="!submitting">发送</span>
                  <span v-else class="send-spinner"></span>
                </button>
                <button class="xhs-icon-btn" :class="{ active: isLiked, animating: likeAnimating }" @click="handleLike" tabindex="-1">
                  <svg width="20" height="20" viewBox="0 0 24 24">
                    <path v-if="isLiked" d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" fill="#10B981" stroke="none"/>
                    <path v-else d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" fill="none" stroke="currentColor" stroke-width="1.5"/>
                  </svg>
                </button>
                <button class="xhs-icon-btn" :class="{ active: isCollected }" @click="handleCollect" tabindex="-1">
                  <svg width="20" height="20" viewBox="0 0 24 24">
                    <path v-if="isCollected" d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="#10B981" stroke="none"/>
                    <path v-else d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="none" stroke="currentColor" stroke-width="1.5"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>

    <div v-else class="detail-empty">
      <svg width="80" height="80" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" stroke="#e5e5e5" stroke-width="1.2"/>
        <path d="M8 15s1.5 2 4 2 4-2 4-2" stroke="#ccc" stroke-width="1.2" stroke-linecap="round"/>
        <circle cx="9" cy="9.5" r="1" fill="#ccc"/>
        <circle cx="15" cy="9.5" r="1" fill="#ccc"/>
      </svg>
      <p>笔记不存在或已被删除</p>
      <button class="empty-btn" @click="goBack">返回社区</button>
    </div>

    <n-modal v-model:show="showPreview" :border-radius="4">
      <div class="preview-wrap">
        <img :src="post?.images?.[previewIndex]" alt="预览" />
        <button class="preview-close" @click="showPreview = false">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
        </button>
        <button v-if="post?.images?.length > 1 && previewIndex > 0" class="preview-nav left" @click.stop="previewIndex--">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M15 18l-6-6 6-6" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </button>
        <button v-if="post?.images?.length > 1 && previewIndex < post.images.length - 1" class="preview-nav right" @click.stop="previewIndex++">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M9 18l6-6-6-6" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </button>
        <div class="preview-counter" v-if="post?.images?.length > 1">{{ previewIndex + 1 }} / {{ post.images.length }}</div>
      </div>
    </n-modal>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { NModal } from 'naive-ui'
import { usePostStore } from '../../stores/post'
import { useAuthStore } from '../../stores/auth'
import { getPostById } from '../../api/post'
import { getPostComments } from '../../api/comment'

const props = defineProps({
  postId: { type: String, default: '' }
})

const emit = defineEmits(['close'])

const router = useRouter()
const route = useRoute()
const postStore = usePostStore()
const authStore = useAuthStore()

const isModal = computed(() => !!props.postId)
const activePostId = computed(() => props.postId || route.params.id)

const showPreview = ref(false)
const previewIndex = ref(0)
const initCache = postStore.getCachedInteraction(activePostId.value)
const isLiked = ref(initCache?.isLiked || false)
const isCollected = ref(initCache?.isCollected || false)
const isFollowed = ref(false)
const likeAnimating = ref(false)
const swiperIndex = ref(0)
const swiperRef = ref(null)
const inputFocused = ref(false)
const inputContent = ref('')
const submitting = ref(false)
const replyTo = ref(null)
const replyToComment = ref(null)
const commentTextarea = ref(null)
const panelScrollRef = ref(null)
const expandedReplies = ref({})
const expandedComments = ref({})
let pollTimer = null
let touchStartX = 0
let touchMoveX = 0
let mouseDown = false
let mouseStartX = 0
let dragged = false

const post = computed(() => postStore.currentPost)
const comments = computed(() => postStore.comments)
const totalCount = computed(() => post.value?.stats?.commentCount || 0)
const authorInitial = computed(() => {
  const name = post.value?.authorId?.username || '匿'
  return name.charAt(0).toUpperCase()
})
const isOwner = computed(() => {
  if (!post.value || !authStore.userInfo) return false
  return post.value.authorId?._id === authStore.userInfo._id
})
const swiperTrackStyle = computed(() => ({
  transform: `translateX(-${swiperIndex.value * 100}%)`
}))
const currentUserId = computed(() => authStore.userInfo?._id)

function getAuthor(c) {
  const a = c.authorId
  if (typeof a === 'object' && a !== null) {
    return { name: a.username || '匿名用户', avatar: a.avatar || '', initial: (a.username || '匿').charAt(0).toUpperCase() }
  }
  return { name: '匿名用户', avatar: '', initial: '匿' }
}
function isOwnerComment(c) {
  const a = c.authorId
  const aid = typeof a === 'object' ? a?._id : a
  return aid === currentUserId.value
}
const COLLAPSE_THRESHOLD = 3
function getVisibleReplies(comment) {
  const replies = comment.replies || []
  if (replies.length <= COLLAPSE_THRESHOLD) return replies
  if (expandedReplies.value[comment._id]) return replies
  return replies.slice(0, COLLAPSE_THRESHOLD)
}
function isRepliesExpanded(comment) {
  return !!expandedReplies.value[comment._id]
}
function toggleReplies(commentId) {
  expandedReplies.value[commentId] = !expandedReplies.value[commentId]
}
function getHiddenRepliesCount(comment) {
  const replies = comment.replies || []
  if (replies.length <= COLLAPSE_THRESHOLD) return 0
  if (expandedReplies.value[comment._id]) return 0
  return replies.length - COLLAPSE_THRESHOLD
}
const LONG_TEXT_LINES = 4
function isLongComment(text) {
  if (!text) return false
  const lines = text.split('\n')
  if (lines.length > LONG_TEXT_LINES) return true
  if (text.length > 120) return true
  return false
}
function isCommentExpanded(commentId) {
  return !!expandedComments.value[commentId]
}
function toggleComment(commentId) {
  expandedComments.value[commentId] = !expandedComments.value[commentId]
}
function formatCount(num) {
  if (!num || num <= 0) return '0'
  if (num >= 10000) return (num / 10000).toFixed(1) + 'w'
  if (num >= 1000) return (num / 1000).toFixed(1) + 'k'
  return String(num)
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
  return `${dt.getMonth()+1}月${dt.getDate()}日`
}
function prevSlide() {
  if (swiperIndex.value > 0) swiperIndex.value--
}
function nextSlide() {
  const len = post.value?.images?.length || 0
  if (swiperIndex.value < len - 1) swiperIndex.value++
}
function onTouchStart(e) { touchStartX = e.touches[0].clientX }
function onTouchMove(e) { touchMoveX = e.touches[0].clientX }
function onTouchEnd() {
  const diff = touchStartX - touchMoveX
  if (Math.abs(diff) > 50) {
    dragged = true
    if (diff > 0) nextSlide()
    else prevSlide()
  }
  touchStartX = 0
  touchMoveX = 0
}
function onMouseDown(e) { mouseDown = true; mouseStartX = e.clientX; dragged = false }
function onMouseMove(e) {
  if (mouseDown) {
    touchMoveX = e.clientX
    if (Math.abs(mouseStartX - e.clientX) > 10) dragged = true
  }
}
function onMouseUp(e) {
  if (!mouseDown) return
  mouseDown = false
  const diff = mouseStartX - (e.clientX || mouseStartX)
  if (Math.abs(diff) > 50) {
    if (diff > 0) nextSlide()
    else prevSlide()
  }
  touchMoveX = 0
}
function openPreview(idx) {
  if (dragged) { dragged = false; return }
  previewIndex.value = idx
  showPreview.value = true
}
function goBack() {
  if (isModal.value) {
    emit('close')
  } else {
    router.push('/community')
  }
}
function searchTag(tag) {
  if (isModal.value) {
    emit('close')
  } else {
    router.push({ path: '/community', query: { tag } })
  }
}

function filterByChannel(channel) {
  if (isModal.value) {
    emit('close', { filterChannel: channel })
  } else {
    router.push({ path: '/community', query: { channel } })
  }
}
function scrollToComment() {
  const el = document.getElementById('comment-section')
  if (!el) return
  if (panelScrollRef.value) {
    const container = panelScrollRef.value
    const top = el.offsetTop - container.offsetTop
    container.scrollTo({ top, behavior: 'smooth' })
  } else {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}
function focusInput() {
  commentTextarea.value?.focus()
}
function startReply(c, r = null) {
  replyToComment.value = c
  replyTo.value = r
    ? { id: r.authorId?._id || r.authorId, username: r.authorId?.username || '用户' }
    : { id: c.authorId?._id || c.authorId, username: c.authorId?.username || '用户' }
  nextTick(() => { commentTextarea.value?.focus() })
}
function cancelReply() { replyTo.value = null; replyToComment.value = null }
function handleInputBlur(e) {
  setTimeout(() => {
    const active = document.activeElement
    const area = commentTextarea.value?.closest('.xhs-input-area')
    if (!area || !area.contains(active)) {
      inputFocused.value = false
    }
  }, 150)
}
async function submitComment() {
  if (!inputContent.value.trim() || submitting.value) return
  if (!authStore.isLoggedIn) { router.push('/login'); return }
  submitting.value = true
  try {
    const data = {
      postId: post.value._id,
      content: inputContent.value.trim(),
      _authorInfo: { _id: currentUserId.value, username: authStore.userInfo?.username, avatar: authStore.userInfo?.avatar }
    }
    if (replyTo.value && replyToComment.value) {
      data.parentId = replyToComment.value._id
      data.replyToUserId = replyTo.value.id
    }
    await postStore.addComment(data)
    inputContent.value = ''
    replyTo.value = null
    replyToComment.value = null
    inputFocused.value = false
  } catch (e) { console.error('评论失败:', e) }
  finally { submitting.value = false }
}
async function handleDeleteComment(id, pid) {
  try { await postStore.removeComment(id, pid) } catch (e) { console.error('删除失败:', e) }
}
async function handleLike() {
  if (!authStore.isLoggedIn) { router.push('/login'); return }
  const pid = activePostId.value
  const prev = isLiked.value
  isLiked.value = !prev
  postStore.updatePostStats(pid, 'likeCount', prev ? -1 : 1)
  if (!prev) { likeAnimating.value = true; setTimeout(() => { likeAnimating.value = false }, 600) }
  try {
    const { action, stats } = await postStore.toggleLike('post', pid)
    isLiked.value = action === 'created'
    if (stats) postStore.applyPostStatsFromServer(pid, stats)
  } catch {
    isLiked.value = prev
    postStore.updatePostStats(pid, 'likeCount', prev ? 1 : -1)
  }
}
async function handleCollect() {
  if (!authStore.isLoggedIn) { router.push('/login'); return }
  const pid = activePostId.value
  const prev = isCollected.value
  isCollected.value = !prev
  postStore.updatePostStats(pid, 'collectCount', prev ? -1 : 1)
  try {
    const { action, stats } = await postStore.toggleCollect('post', pid)
    isCollected.value = action === 'created'
    if (stats) postStore.applyPostStatsFromServer(pid, stats)
  } catch {
    isCollected.value = prev
    postStore.updatePostStats(pid, 'collectCount', prev ? 1 : -1)
  }
}
function handleShare() {
  if (navigator.share) {
    navigator.share({ title: post.value?.title || '宠伴社区', url: window.location.href }).catch(() => {})
  } else {
    navigator.clipboard?.writeText(window.location.href)
  }
}
function toggleFollow() {
  isFollowed.value = !isFollowed.value
}
function loadMoreComments() { postStore.fetchComments(activePostId.value, true) }

async function loadPostData() {
  const id = activePostId.value
  await postStore.fetchPostById(id)
  await postStore.fetchComments(id)
  if (authStore.isLoggedIn) {
    try {
      const s = await postStore.checkInteractionStatus('post', id)
      isLiked.value = s.isLiked
      isCollected.value = s.isCollected
    } catch {}
  }
}

function startPolling() {
  stopPolling()
  pollTimer = setInterval(async () => {
    const id = activePostId.value
    if (!id) return
    try {
      const res = await getPostById(id)
      const latest = res.data.post
      if (latest?.stats && postStore.currentPost) postStore.currentPost.stats = latest.stats
    } catch {}
    try {
      const res = await getPostComments(id, { page: 1, pageSize: postStore.commentPagination.pageSize || 10 })
      const data = res.data
      if (data?.list && Array.isArray(data.list)) {
        const existingIds = new Set(postStore.comments.map(c => c._id))
        const newComments = data.list.filter(c => !existingIds.has(c._id))
        if (newComments.length > 0) {
          postStore.comments.unshift(...newComments)
          if (data.pagination) {
            postStore.commentPagination.total = data.pagination.total
          }
        }
      }
    } catch {}
  }, 10000)
}

function stopPolling() {
  if (pollTimer) { clearInterval(pollTimer); pollTimer = null }
}

watch(() => props.postId, async (newId) => {
  if (newId) {
    swiperIndex.value = 0
    expandedReplies.value = {}
    expandedComments.value = {}
    replyTo.value = null
    replyToComment.value = null
    inputFocused.value = false
    inputContent.value = ''
    await loadPostData()
    startPolling()
  }
})

onMounted(async () => {
  await loadPostData()
  startPolling()
})
onUnmounted(() => {
  stopPolling()
  if (!isModal.value) {
    postStore.currentPost = null
    postStore.comments = []
  }
})
</script>

<style scoped>
.detail-page {
  height: 100vh;
  background: rgba(0, 0, 0, 0.65);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
}

.detail-layout {
  display: flex;
  width: 100%;
  height: 90vh;
  max-width: 900px;
  background: #fff;
  border-radius: 16px;
  overflow: hidden;
  box-shadow:
    0 24px 80px rgba(0, 0, 0, 0.25),
    0 8px 24px rgba(0, 0, 0, 0.1),
    0 0 0 1px rgba(255, 255, 255, 0.08);
}

.media-panel {
  position: relative;
  width: 50%;
  min-width: 0;
  height: 100%;
  background: #000;
  display: flex;
  align-items: stretch;
  overflow: hidden;
  user-select: none;
}

.close-btn {
  position: absolute;
  top: 12px;
  left: 12px;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(0, 0, 0, 0.35);
  backdrop-filter: blur(14px) saturate(1.5);
  -webkit-backdrop-filter: blur(14px) saturate(1.5);
  color: #fff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 15;
  opacity: 0;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.media-panel:hover .close-btn {
  opacity: 1;
}

.close-btn:hover {
  background: rgba(0, 0, 0, 0.55);
  transform: scale(1.12) rotate(90deg);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
}

.media-track {
  display: flex;
  width: 100%;
  height: 100%;
  transition: transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  will-change: transform;
  cursor: grab;
}

.media-track:active {
  cursor: grabbing;
}

.media-slide {
  flex: 0 0 100%;
  width: 100%;
  height: 100%;
}

.media-slide img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.slide-btn {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 34px;
  height: 34px;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(0, 0, 0, 0.35);
  backdrop-filter: blur(14px) saturate(1.5);
  -webkit-backdrop-filter: blur(14px) saturate(1.5);
  color: #fff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
  opacity: 0;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
}

.media-panel:hover .slide-btn {
  opacity: 1;
}

.slide-btn:hover {
  background: rgba(0, 0, 0, 0.55);
  transform: translateY(-50%) scale(1.12);
  box-shadow: 0 4px 18px rgba(0, 0, 0, 0.25);
}

.slide-btn.prev {
  left: 12px;
}

.slide-btn.next {
  right: 12px;
}

.media-counter {
  position: absolute;
  bottom: 14px;
  right: 14px;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(14px) saturate(1.5);
  -webkit-backdrop-filter: blur(14px) saturate(1.5);
  color: #fff;
  font-size: 11px;
  padding: 4px 12px;
  border-radius: 12px;
  font-weight: 500;
  border: 1px solid rgba(255, 255, 255, 0.08);
  letter-spacing: 0.4px;
}

.media-dots {
  position: absolute;
  bottom: 14px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 5px;
}

.dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.3);
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.dot.active {
  width: 18px;
  border-radius: 2.5px;
  background: #fff;
  box-shadow: 0 0 8px rgba(255, 255, 255, 0.3);
}

.media-empty {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  background: #1a1a1a;
}

.empty-media-text {
  font-size: 12px;
  color: #555;
}

.content-panel {
  width: 400px;
  min-width: 400px;
  display: flex;
  flex-direction: column;
  border-left: 1px solid rgba(0, 0, 0, 0.04);
  position: relative;
  background: #fff;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 18px;
  border-bottom: 1px solid #f5f5f5;
  flex-shrink: 0;
}

.header-author {
  display: flex;
  align-items: center;
  gap: 10px;
}

.avatar-ring {
  padding: 2px;
  border-radius: 50%;
  background: linear-gradient(135deg, #10B981, #34d399, #6ee7b7);
  box-shadow: 0 2px 8px rgba(16, 185, 129, 0.2);
}

.header-av {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #fff;
}

.header-av-fb {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: linear-gradient(135deg, #10B981, #059669);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 700;
  border: 2px solid #fff;
  box-shadow: 0 3px 10px rgba(16, 185, 129, 0.25);
}

.author-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.header-name {
  font-size: 14px;
  font-weight: 700;
  color: #1a1a2e;
  letter-spacing: 0.2px;
}

.header-time {
  font-size: 11px;
  color: #c5c5c5;
}

.follow-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 16px;
  border-radius: 18px;
  border: none;
  background: linear-gradient(135deg, #10B981 0%, #059669 100%);
  color: #fff;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
  box-shadow: 0 2px 10px rgba(16, 185, 129, 0.3);
  letter-spacing: 0.3px;
}

.follow-btn:hover {
  transform: scale(1.06);
  box-shadow: 0 4px 16px rgba(16, 185, 129, 0.4);
}

.follow-btn.followed {
  border: 1.5px solid #e8e8e8;
  background: #fff;
  color: #bbb;
  box-shadow: none;
}

.follow-btn.followed:hover {
  border-color: rgba(16, 185, 129, 0.3);
  color: #10B981;
  transform: scale(1.06);
  box-shadow: 0 2px 8px rgba(16, 185, 129, 0.1);
}

.header-close {
  width: 34px;
  height: 34px;
  border: none;
  background: none;
  color: #bbb;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.header-close:hover {
  background: #f5f5f5;
  color: #555;
  transform: scale(1.1);
}

.panel-scroll {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  -webkit-overflow-scrolling: touch;
}

.panel-scroll::-webkit-scrollbar {
  width: 0;
}

.note-content {
  padding: 18px 18px 0;
}

.note-title {
  font-size: 17px;
  font-weight: 800;
  color: #1a1a2e;
  margin: 0 0 10px;
  line-height: 1.5;
  letter-spacing: 0.3px;
  padding-left: 14px;
  border-left: 3px solid transparent;
  border-image: linear-gradient(180deg, #10B981, #059669) 1;
  border-image-slice: 0 0 0 3;
}

.note-text {
  font-size: 14px;
  line-height: 1.75;
  color: #444;
  margin: 0;
  white-space: pre-wrap;
  word-break: break-word;
}

.note-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 12px;
}

.tag {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-size: 12px;
  color: #10B981;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  font-weight: 600;
  padding: 3px 8px;
  background: rgba(16, 185, 129, 0.06);
  border-radius: 8px;
  border: 1px solid rgba(16, 185, 129, 0.08);
}

.tag:hover {
  background: rgba(16, 185, 129, 0.12);
  border-color: rgba(16, 185, 129, 0.2);
  transform: translateY(-2px);
  box-shadow: 0 3px 10px rgba(16, 185, 129, 0.12);
}

.pet-tag {
  color: #f59e0b;
  background: rgba(245, 158, 11, 0.06);
  border-color: rgba(245, 158, 11, 0.08);
}

.pet-tag:hover {
  background: rgba(245, 158, 11, 0.12);
  border-color: rgba(245, 158, 11, 0.2);
}

.channel-tag {
  color: #8b5cf6;
  background: rgba(139, 92, 246, 0.06);
  border-color: rgba(139, 92, 246, 0.08);
  font-weight: 600;
}

.channel-tag:hover {
  background: rgba(139, 92, 246, 0.12);
  border-color: rgba(139, 92, 246, 0.2);
}

.note-meta {
  margin-top: 14px;
  font-size: 12px;
  color: #bbb;
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.meta-sep {
  color: #e0e0e0;
}

.meta-location {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  color: #999;
}

.interaction-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 18px 22px;
  border-bottom: 1px solid #f5f5f5;
}

.ibtn {
  position: relative;
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 9px 16px;
  background: none;
  border: none;
  cursor: pointer;
  color: #bbb;
  border-radius: 22px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  font-weight: 500;
}

.ibtn:hover {
  color: #10B981;
  background: rgba(16, 185, 129, 0.06);
}

.ibtn.active {
  color: #10B981;
  background: rgba(16, 185, 129, 0.1);
  box-shadow: 0 2px 8px rgba(16, 185, 129, 0.12);
}

.ibtn-icon-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
}

.ibtn-num {
  font-size: 12px;
  color: #bbb;
  font-weight: 500;
}

.ibtn.active .ibtn-num {
  color: #10B981;
}

.ibtn.animating .heart {
  animation: heart-pop 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes heart-pop {
  0% { transform: scale(1); }
  20% { transform: scale(1.4); }
  40% { transform: scale(0.85); }
  60% { transform: scale(1.2); }
  80% { transform: scale(0.95); }
  100% { transform: scale(1); }
}

.share-btn {
  margin-left: auto;
}

.comment-section {
  padding: 18px 22px 0;
}

.comment-title {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 18px;
  padding-bottom: 16px;
  border-bottom: 1px solid #f5f5f5;
  position: relative;
}

.comment-title::after {
  content: '';
  position: absolute;
  bottom: -1px;
  left: 0;
  width: 48px;
  height: 2px;
  background: linear-gradient(90deg, #10B981, #059669);
  border-radius: 1px;
}

.comment-title-text {
  font-size: 15px;
  font-weight: 700;
  color: #1a1a2e;
  letter-spacing: 0.2px;
}

.comment-count {
  font-size: 12px;
  color: #bbb;
  font-weight: 600;
  background: #f5f5f5;
  padding: 2px 10px;
  border-radius: 12px;
}

.reply-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.06), rgba(16, 185, 129, 0.02));
  border: 1px solid rgba(16, 185, 129, 0.12);
  border-radius: 10px;
  padding: 10px 14px;
  margin-bottom: 14px;
  font-size: 13px;
  color: #555;
}

.reply-banner-content {
  display: flex;
  align-items: center;
  gap: 6px;
}

.reply-banner b {
  color: #10B981;
}

.reply-cancel {
  background: none;
  border: none;
  color: #999;
  cursor: pointer;
  padding: 2px;
  display: flex;
  align-items: center;
  border-radius: 50%;
  transition: all 0.2s;
}

.reply-cancel:hover {
  background: rgba(0,0,0,0.05);
  color: #666;
}

.comment-list {
  display: flex;
  flex-direction: column;
}

.c-item {
  display: flex;
  gap: 12px;
  padding: 16px 0;
  border-bottom: 1px solid #f8f8f8;
  transition: background 0.25s;
}

.c-item:last-child {
  border-bottom: none;
}

.c-item:hover {
  background: rgba(0, 0, 0, 0.01);
}

.c-avatar-wrap {
  flex-shrink: 0;
}

.c-av {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  object-fit: cover;
}

.c-av-fb {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: linear-gradient(135deg, #10B981, #059669);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 600;
}

.c-body {
  flex: 1;
  min-width: 0;
}

.c-head {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 6px;
  flex-wrap: wrap;
}

.c-name {
  font-size: 13px;
  font-weight: 600;
  color: #333;
}

.c-time {
  font-size: 11px;
  color: #ccc;
}

.c-arrow {
  color: #ddd;
  display: flex;
  align-items: center;
}

.c-target {
  font-size: 12px;
  color: #10B981;
  font-weight: 500;
}

.c-text {
  font-size: 14px;
  line-height: 1.7;
  color: #333;
  margin: 0;
  word-break: break-word;
}

.c-text.collapsed {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.expand-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: none;
  border: none;
  font-size: 12px;
  color: #10B981;
  cursor: pointer;
  padding: 2px 0;
  margin-top: 2px;
  font-weight: 500;
  transition: all 0.2s;
}

.expand-btn:hover {
  color: #059669;
}

.expand-btn.reply-expand {
  font-size: 11px;
}

.toggle-replies-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  background: none;
  border: none;
  font-size: 12px;
  color: #10B981;
  cursor: pointer;
  padding: 6px 0;
  font-weight: 500;
  transition: all 0.2s;
}

.toggle-replies-btn:hover {
  color: #059669;
}

.toggle-replies-btn.collapse {
  color: #999;
}

.toggle-replies-btn.collapse:hover {
  color: #666;
}

.c-actions {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-top: 8px;
}

.c-act-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: none;
  border: none;
  font-size: 12px;
  cursor: pointer;
  padding: 4px 0;
  color: #ccc;
  transition: color 0.2s;
}

.c-act-btn:hover {
  color: #999;
}

.c-act-btn.del {
  color: #ddd;
}

.c-act-btn.del:hover {
  color: #ef4444;
}

.c-replies {
  margin-top: 14px;
  background: linear-gradient(135deg, #f9faf9, #f5f8f7);
  border-radius: 12px;
  padding: 12px 14px;
  border: 1px solid rgba(0, 0, 0, 0.03);
  border-left: 3px solid rgba(16, 185, 129, 0.2);
}

.c-reply {
  display: flex;
  gap: 10px;
  padding: 12px 0;
}

.c-reply + .c-reply {
  border-top: 1px solid rgba(0, 0, 0, 0.04);
}

.c-reply-avatar-wrap {
  flex-shrink: 0;
}

.c-reply-av {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  object-fit: cover;
}

.c-reply-av-fb {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: linear-gradient(135deg, #10B981, #059669);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: 600;
}

.c-reply-body {
  flex: 1;
  min-width: 0;
}

.empty-comment {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 52px 0;
  gap: 12px;
  cursor: pointer;
  transition: opacity 0.25s;
}

.empty-comment:hover {
  opacity: 0.7;
}

.empty-comment p {
  font-size: 15px;
  color: #aaa;
  margin: 0;
  font-weight: 600;
}

.empty-comment span {
  font-size: 12px;
  color: #d0d0d0;
}

.load-more-cmt {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  background: #f5f7f6;
  border: 1px solid rgba(0, 0, 0, 0.03);
  color: #777;
  padding: 13px;
  border-radius: 12px;
  font-size: 13px;
  cursor: pointer;
  margin-top: 16px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  font-weight: 600;
}

.load-more-cmt:hover {
  background: #eef4f1;
  color: #10B981;
  border-color: rgba(16, 185, 129, 0.15);
  transform: translateY(-1px);
}

.panel-bottom-spacer {
  height: 16px;
}

.xhs-input-area {
  flex-shrink: 0;
  background: #fff;
  border-top: 1px solid rgba(0, 0, 0, 0.05);
  padding: 10px 16px calc(10px + env(safe-area-inset-bottom, 0px));
  transition: padding 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.xhs-input-area.focused {
  padding: 12px 16px calc(12px + env(safe-area-inset-bottom, 0px));
}

.xhs-reply-hint {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.06), rgba(16, 185, 129, 0.02));
  border: 1px solid rgba(16, 185, 129, 0.12);
  border-radius: 10px;
  padding: 8px 12px;
  margin-bottom: 8px;
  font-size: 13px;
  color: #555;
  animation: slideDown 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes slideDown {
  from { opacity: 0; transform: translateY(-6px); }
  to { opacity: 1; transform: translateY(0); }
}

.xhs-reply-text b {
  color: #10B981;
}

.xhs-reply-cancel {
  background: none;
  border: none;
  color: #999;
  cursor: pointer;
  padding: 2px;
  display: flex;
  align-items: center;
  border-radius: 50%;
  transition: all 0.2s;
}

.xhs-reply-cancel:hover {
  background: rgba(0,0,0,0.05);
  color: #666;
}

.xhs-input-row {
  display: flex;
  align-items: flex-end;
  gap: 10px;
}

.xhs-textarea {
  flex: 1;
  border: 1.5px solid transparent;
  background: #f5f7f6;
  border-radius: 22px;
  padding: 9px 16px;
  font-size: 13px;
  line-height: 1.5;
  color: #333;
  outline: none;
  resize: none;
  font-family: inherit;
  height: 38px;
  max-height: 38px;
  overflow: hidden;
  transition:
    height 0.3s cubic-bezier(0.4, 0, 0.2, 1),
    max-height 0.3s cubic-bezier(0.4, 0, 0.2, 1),
    border-color 0.3s cubic-bezier(0.4, 0, 0.2, 1),
    background 0.3s cubic-bezier(0.4, 0, 0.2, 1),
    box-shadow 0.3s cubic-bezier(0.4, 0, 0.2, 1),
    border-radius 0.3s cubic-bezier(0.4, 0, 0.2, 1),
    padding 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.xhs-textarea::placeholder {
  color: #bbb;
}

.xhs-input-area.focused .xhs-textarea {
  height: 72px;
  max-height: 120px;
  border-radius: 16px;
  background: #fff;
  border-color: rgba(16, 185, 129, 0.3);
  box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.06);
  padding: 10px 14px;
  overflow-y: auto;
}

.xhs-input-area.focused .xhs-textarea:focus {
  border-color: rgba(16, 185, 129, 0.5);
  box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.08), 0 2px 12px rgba(16, 185, 129, 0.06);
}

.xhs-textarea::-webkit-scrollbar {
  width: 4px;
}

.xhs-textarea::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.1);
  border-radius: 2px;
}

.xhs-input-actions {
  display: flex;
  align-items: center;
  gap: 2px;
  flex-shrink: 0;
  padding-bottom: 2px;
}

.xhs-send-btn {
  background: linear-gradient(135deg, #10B981 0%, #059669 100%);
  color: #fff;
  border: none;
  padding: 8px 18px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 34px;
  box-shadow: 0 2px 8px rgba(16, 185, 129, 0.3);
  letter-spacing: 0.3px;
  animation: fadeIn 0.2s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: scale(0.9); }
  to { opacity: 1; transform: scale(1); }
}

.xhs-send-btn:hover:not(:disabled) {
  transform: scale(1.04);
  box-shadow: 0 4px 14px rgba(16, 185, 129, 0.4);
}

.xhs-send-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.send-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255,255,255,0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

.xhs-icon-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  background: none;
  border: none;
  cursor: pointer;
  color: #bbb;
  border-radius: 50%;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  flex-shrink: 0;
}

.xhs-icon-btn:hover {
  color: #10B981;
  background: rgba(16, 185, 129, 0.08);
  transform: scale(1.1);
}

.xhs-icon-btn.active {
  color: #10B981;
}

.xhs-icon-btn.animating svg {
  animation: heart-pop 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.detail-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100vh;
  gap: 14px;
  background: linear-gradient(145deg, #f5f5f5, #eee);
}

.loading-spinner {
  width: 30px;
  height: 30px;
  border: 2.5px solid #eee;
  border-top-color: #10B981;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
  box-shadow: 0 0 12px rgba(16, 185, 129, 0.15);
}

.loading-text {
  font-size: 13px;
  color: #c0c0c0;
  font-weight: 500;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.detail-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100vh;
  gap: 18px;
  background: linear-gradient(145deg, #f5f5f5, #eee);
}

.detail-empty p {
  color: #aaa;
  font-size: 15px;
  margin: 0;
  font-weight: 600;
}

.empty-btn {
  background: linear-gradient(135deg, #10B981 0%, #059669 100%);
  color: #fff;
  border: none;
  padding: 12px 30px;
  border-radius: 28px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 16px rgba(16, 185, 129, 0.3);
  letter-spacing: 0.3px;
}

.empty-btn:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 28px rgba(16, 185, 129, 0.4);
}

.preview-wrap {
  position: relative;
  max-width: 95vw;
  max-height: 90vh;
}

.preview-wrap img {
  max-width: 100%;
  max-height: 85vh;
  object-fit: contain;
  display: block;
  border-radius: 8px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

.preview-close {
  position: absolute;
  top: 14px;
  right: 14px;
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.55);
  backdrop-filter: blur(12px) saturate(1.5);
  -webkit-backdrop-filter: blur(12px) saturate(1.5);
  color: #fff;
  border: 1px solid rgba(255, 255, 255, 0.1);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.preview-nav {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(12px) saturate(1.5);
  -webkit-backdrop-filter: blur(12px) saturate(1.5);
  color: #fff;
  border: 1px solid rgba(255, 255, 255, 0.1);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.preview-nav.left { left: 18px; }
.preview-nav.right { right: 18px; }

.preview-nav:hover {
  background: rgba(0, 0, 0, 0.65);
  transform: translateY(-50%) scale(1.12);
  box-shadow: 0 4px 18px rgba(0, 0, 0, 0.3);
}

.preview-close:hover {
  background: rgba(0, 0, 0, 0.75);
  transform: scale(1.12) rotate(90deg);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
}

.preview-counter {
  position: absolute;
  bottom: 14px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.55);
  backdrop-filter: blur(12px) saturate(1.5);
  -webkit-backdrop-filter: blur(12px) saturate(1.5);
  color: #fff;
  font-size: 12px;
  padding: 5px 16px;
  border-radius: 14px;
  font-weight: 500;
  border: 1px solid rgba(255, 255, 255, 0.08);
  letter-spacing: 0.3px;
}

@media (max-width: 1024px) {
  .detail-page {
    padding: 24px;
  }

  .detail-layout {
    max-width: 100%;
    height: 85vh;
  }

  .content-panel {
    width: 340px;
    min-width: 340px;
  }
}

@media (max-width: 768px) {
  .detail-page {
    background: #fff;
    align-items: flex-start;
    justify-content: flex-start;
    padding: 0;
  }

  .detail-layout {
    flex-direction: column;
    max-width: 100%;
    height: auto;
    min-height: 100vh;
    border-radius: 0;
  }

  .media-panel {
    width: 100%;
    max-height: 70vh;
  }

  .media-slide {
    aspect-ratio: 3 / 4;
  }

  .media-slide img {
    max-height: 70vh;
    object-fit: contain;
  }

  .slide-btn {
    opacity: 1;
    width: 32px;
    height: 32px;
  }

  .close-btn {
    opacity: 1;
  }

  .content-panel {
    width: 100%;
    min-width: 100%;
    border-left: none;
    min-height: 30vh;
  }

  .panel-header {
    position: sticky;
    top: 0;
    background: #fff;
    z-index: 5;
    padding: 12px 16px;
  }

  .header-close {
    display: none;
  }

  .avatar-ring {
    padding: 1.5px;
  }

  .header-av, .header-av-fb {
    width: 32px;
    height: 32px;
    font-size: 13px;
  }

  .note-content {
    padding: 16px 16px 0;
  }

  .interaction-bar {
    padding: 10px 16px;
    gap: 4px;
    position: sticky;
    bottom: 0;
    background: rgba(255, 255, 255, 0.92);
    backdrop-filter: blur(16px) saturate(1.8);
    -webkit-backdrop-filter: blur(16px) saturate(1.8);
    border-top: 1px solid rgba(0, 0, 0, 0.04);
    border-bottom: none;
    z-index: 5;
  }

  .ibtn {
    padding: 6px 12px;
    gap: 4px;
  }

  .ibtn-num {
    font-size: 12px;
  }

  .comment-section {
    padding: 12px 16px 0;
  }

  .xhs-input-area {
    padding: 8px 12px calc(8px + env(safe-area-inset-bottom, 0px));
  }

  .xhs-input-area.focused {
    padding: 10px 12px calc(10px + env(safe-area-inset-bottom, 0px));
  }

  .xhs-textarea {
    font-size: 14px;
    padding: 8px 14px;
  }
}
</style>
