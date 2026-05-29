<template>
  <div class="xhs-card" @click="$emit('click')">
    <div class="card-cover" :class="{ 'has-multi': post.images?.length > 1, loaded: imgLoaded }">
      <div v-if="coverImage && !imgLoaded" class="cover-skeleton"></div>
      <img
        v-if="coverImage"
        :src="coverImage"
        :alt="post.title || '封面'"
        loading="lazy"
        @load="imgLoaded = true"
        @error="onImgError"
      />
      <div v-else class="cover-placeholder">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
          <rect x="3" y="3" width="18" height="18" rx="2" stroke="#ccc" stroke-width="1.2"/>
          <circle cx="8.5" cy="8.5" r="1.5" fill="#ccc"/>
          <path d="M21 15l-5-5L5 21" stroke="#ccc" stroke-width="1.2" stroke-linecap="round"/>
        </svg>
      </div>
      <span v-if="post.images?.length > 1" class="multi-badge">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
          <rect x="3" y="3" width="7" height="7" rx="1" stroke="#fff" stroke-width="1.5"/>
          <rect x="14" y="3" width="7" height="7" rx="1" stroke="#fff" stroke-width="1.5"/>
          <rect x="3" y="14" width="7" height="7" rx="1" stroke="#fff" stroke-width="1.5"/>
          <rect x="14" y="14" width="7" height="7" rx="1" stroke="#fff" stroke-width="1.5"/>
        </svg>
        {{ post.images.length }}
      </span>
      <div v-if="post.channel" class="channel-badge" @click.stop="$emit('channel-click', post.channel)">{{ post.channel }}</div>
      <div v-if="firstTopic" class="topic-badge" @click.stop="$emit('topic-click', firstTopic)">#{{ firstTopic }}</div>
    </div>

    <div class="card-body">
      <h3 class="card-title" v-if="post.title">{{ post.title }}</h3>
      <p class="card-desc" v-else>{{ post.content }}</p>
    </div>

    <div class="card-footer">
      <div class="card-author">
        <img v-if="authorAvatar" :src="authorAvatar" class="card-avatar" @error="avatarFailed = true" />
        <div v-else class="card-avatar-fb">{{ authorInitial }}</div>
        <span class="card-name">{{ authorName }}</span>
      </div>
      <button class="card-like" :class="{ liked: isLiked, animating: likeAnimating }" @click.stop="handleLike">
        <svg width="14" height="14" viewBox="0 0 24 24">
          <path v-if="isLiked" d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" fill="#10B981" stroke="none"/>
          <path v-else d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" fill="none" stroke="currentColor" stroke-width="1.5"/>
        </svg>
        <span>{{ likeDisplay }}</span>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { usePostStore } from '../../stores/post'
import { useAuthStore } from '../../stores/auth'

const props = defineProps({
  post: { type: Object, required: true }
})

defineEmits(['click', 'channel-click', 'topic-click'])

const router = useRouter()
const postStore = usePostStore()
const authStore = useAuthStore()
const cached = postStore.getCachedInteraction(props.post._id)
const isLiked = ref(cached?.isLiked || false)
const avatarFailed = ref(false)
const imgLoaded = ref(false)
const imgError = ref(false)
const likeAnimating = ref(false)

const authorName = computed(() => props.post.authorId?.username || '匿名用户')
const authorAvatar = computed(() => {
  if (avatarFailed.value) return ''
  return props.post.authorId?.avatar || ''
})
const authorInitial = computed(() => authorName.value.charAt(0).toUpperCase())

const coverImage = computed(() => {
  if (imgError.value) return ''
  return props.post.images?.[0] || ''
})

const firstTopic = computed(() => props.post.topics?.[0] || '')

const likeDisplay = computed(() => {
  const n = props.post.stats?.likeCount || 0
  if (n >= 10000) return (n / 10000).toFixed(1) + 'w'
  if (n >= 1000) return (n / 1000).toFixed(1) + 'k'
  return n || ''
})

function onImgError() {
  imgError.value = true
  imgLoaded.value = true
}

async function handleLike() {
  if (!authStore.isLoggedIn) { router.push('/login'); return }
  const prev = isLiked.value
  isLiked.value = !prev
  likeAnimating.value = true
  setTimeout(() => { likeAnimating.value = false }, 600)
  postStore.updatePostStats(props.post._id, 'likeCount', prev ? -1 : 1)
  try {
    const { action, stats } = await postStore.toggleLike('post', props.post._id)
    isLiked.value = action === 'created'
    if (stats) postStore.applyPostStatsFromServer(props.post._id, stats)
  } catch {
    isLiked.value = prev
    postStore.updatePostStats(props.post._id, 'likeCount', prev ? 1 : -1)
  }
}

onMounted(async () => {
  if (!authStore.isLoggedIn) return
  try {
    const status = await postStore.checkInteractionStatus('post', props.post._id)
    isLiked.value = status.isLiked
  } catch {}
})
</script>

<style scoped>
.xhs-card {
  break-inside: avoid;
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  margin-bottom: 10px;
  border: 1px solid rgba(0, 0, 0, 0.04);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04), 0 4px 12px rgba(0, 0, 0, 0.02);
  position: relative;
}

.xhs-card::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 12px;
  opacity: 0;
  transition: opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  pointer-events: none;
  box-shadow: 0 8px 32px rgba(16, 185, 129, 0.12), 0 2px 8px rgba(0, 0, 0, 0.06);
}

.xhs-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.08), 0 4px 12px rgba(0, 0, 0, 0.04);
  border-color: rgba(16, 185, 129, 0.15);
}

.xhs-card:hover::after {
  opacity: 1;
}

.card-cover {
  position: relative;
  width: 100%;
  overflow: hidden;
  background: #f5f5f5;
}

.card-cover img {
  width: 100%;
  display: block;
  object-fit: cover;
  transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.4s ease, filter 0.4s;
  opacity: 0;
  filter: brightness(0.98);
}

.card-cover.loaded img {
  opacity: 1;
}

.xhs-card:hover .card-cover img {
  transform: scale(1.06);
  filter: brightness(1.02) saturate(1.05);
}

.cover-skeleton {
  position: absolute;
  inset: 0;
  background: linear-gradient(110deg, #f0f0f0 25%, #eaeaea 37%, #f0f0f0 63%);
  background-size: 200% 100%;
  animation: shimmer 1.5s ease-in-out infinite;
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

.cover-placeholder {
  width: 100%;
  aspect-ratio: 3 / 4;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(150deg, #f8faf9, #f0f5f3, #eef4f1);
}

.multi-badge {
  position: absolute;
  top: 6px;
  right: 6px;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(10px) saturate(1.5);
  -webkit-backdrop-filter: blur(10px) saturate(1.5);
  color: #fff;
  font-size: 10px;
  padding: 2px 8px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  gap: 3px;
  font-weight: 500;
  border: 1px solid rgba(255, 255, 255, 0.1);
  letter-spacing: 0.2px;
}

.topic-badge {
  position: absolute;
  bottom: 6px;
  left: 6px;
  background: rgba(16, 185, 129, 0.85);
  backdrop-filter: blur(10px) saturate(1.5);
  -webkit-backdrop-filter: blur(10px) saturate(1.5);
  color: #fff;
  font-size: 9px;
  padding: 2px 8px;
  border-radius: 10px;
  font-weight: 600;
  letter-spacing: 0.2px;
  border: 1px solid rgba(255, 255, 255, 0.15);
  box-shadow: 0 2px 8px rgba(16, 185, 129, 0.25);
  cursor: pointer;
  transition: all 0.2s ease;
}

.topic-badge:hover {
  background: rgba(16, 185, 129, 1);
  transform: scale(1.05);
}

.channel-badge {
  position: absolute;
  top: 6px;
  left: 6px;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(10px) saturate(1.5);
  -webkit-backdrop-filter: blur(10px) saturate(1.5);
  color: #fff;
  font-size: 9px;
  padding: 2px 8px;
  border-radius: 10px;
  font-weight: 500;
  border: 1px solid rgba(255, 255, 255, 0.1);
  letter-spacing: 0.2px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.channel-badge:hover {
  background: rgba(0, 0, 0, 0.7);
  transform: scale(1.05);
}

.card-body {
  padding: 10px 10px 0;
}

.card-title {
  font-size: 12.5px;
  font-weight: 700;
  color: #1a1a2e;
  margin: 0;
  line-height: 1.55;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  word-break: break-word;
  letter-spacing: 0.1px;
}

.card-desc {
  font-size: 11px;
  color: #999;
  margin: 0;
  line-height: 1.55;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  word-break: break-word;
}

.card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 10px 10px;
}

.card-author {
  display: flex;
  align-items: center;
  gap: 7px;
  min-width: 0;
}

.card-avatar {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
  border: 1.5px solid rgba(16, 185, 129, 0.15);
  padding: 1px;
}

.card-avatar-fb {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: linear-gradient(135deg, #10B981, #059669);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 8px;
  font-weight: 700;
  flex-shrink: 0;
  box-shadow: 0 2px 6px rgba(16, 185, 129, 0.25);
}

.card-name {
  font-size: 11px;
  color: #aaa;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: 500;
}

.card-like {
  display: flex;
  align-items: center;
  gap: 3px;
  background: none;
  border: none;
  cursor: pointer;
  padding: 3px 6px;
  color: #bbb;
  font-size: 11px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  flex-shrink: 0;
  border-radius: 10px;
  font-weight: 500;
}

.card-like.liked {
  color: #10B981;
  background: rgba(16, 185, 129, 0.06);
}

.card-like:hover {
  color: #10B981;
  background: rgba(16, 185, 129, 0.08);
}

.card-like.animating svg {
  animation: heart-pop 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes heart-pop {
  0% { transform: scale(1); }
  20% { transform: scale(1.4); }
  40% { transform: scale(0.8); }
  60% { transform: scale(1.2); }
  80% { transform: scale(0.95); }
  100% { transform: scale(1); }
}
</style>
