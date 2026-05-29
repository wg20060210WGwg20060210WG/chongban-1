import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { getPosts, getPostById, createPost, deletePost } from '../api/post'
import { getPostComments, createComment, deleteComment } from '../api/comment'
import { toggleInteraction, toggleFollow, checkInteraction } from '../api/interaction'

export const usePostStore = defineStore('post', () => {
  const postList = ref([])
  const currentPost = ref(null)
  const comments = ref([])
  const loading = ref(false)
  const commentLoading = ref(false)
  const error = ref(null)

  const interactionCache = {}

  const pagination = ref({
    page: 1,
    pageSize: 10,
    total: 0,
    totalPages: 0
  })

  const commentPagination = ref({
    page: 1,
    pageSize: 20,
    total: 0,
    totalPages: 0
  })

  const filters = ref({
    sortBy: 'latest',
    type: '',
    channel: '',
    topic: '',
    keyword: ''
  })

  const hasMore = computed(() => pagination.value.page < pagination.value.totalPages)
  const hasMoreComments = computed(() => commentPagination.value.page < commentPagination.value.totalPages)

  async function fetchPosts(append = false) {
    loading.value = true
    error.value = null
    try {
      const params = {
        page: append ? pagination.value.page + 1 : 1,
        pageSize: pagination.value.pageSize,
        sortBy: filters.value.sortBy
      }
      if (filters.value.type) params.type = filters.value.type
      if (filters.value.channel) params.channel = filters.value.channel
      if (filters.value.topic) params.topic = filters.value.topic
      if (filters.value.keyword) params.keyword = filters.value.keyword

      const res = await getPosts(params)
      const data = res.data

      if (append) {
        postList.value = [...postList.value, ...data.list]
      } else {
        postList.value = data.list
      }

      pagination.value = data.pagination
    } catch (err) {
      error.value = err.message || '获取帖子列表失败'
    } finally {
      loading.value = false
    }
  }

  async function fetchPostById(id) {
    loading.value = true
    error.value = null
    try {
      const res = await getPostById(id)
      currentPost.value = res.data.post
      return res.data.post
    } catch (err) {
      error.value = err.message || '获取帖子详情失败'
      return null
    } finally {
      loading.value = false
    }
  }

  async function publishPost(data) {
    const res = await createPost(data)
    return res.data.post
  }

  async function removePost(id) {
    await deletePost(id)
    postList.value = postList.value.filter(p => p._id !== id)
    if (currentPost.value?._id === id) {
      currentPost.value = null
    }
  }

  async function fetchComments(postId, append = false) {
    commentLoading.value = true
    try {
      const params = {
        page: append ? commentPagination.value.page + 1 : 1,
        pageSize: commentPagination.value.pageSize
      }
      const res = await getPostComments(postId, params)
      const data = res.data

      if (append) {
        comments.value = [...comments.value, ...data.list]
      } else {
        comments.value = data.list
      }

      commentPagination.value = data.pagination
    } catch (err) {
      console.error('获取评论失败:', err)
    } finally {
      commentLoading.value = false
    }
  }

  async function addComment(data) {
    const res = await createComment(data)
    const newComment = res.data.comment
    newComment.authorId = data._authorInfo || newComment.authorId
    newComment.replies = []
    newComment.replyCount = 0

    if (data.parentId) {
      const parentIdx = comments.value.findIndex(c => c._id === data.parentId)
      if (parentIdx !== -1) {
        if (!comments.value[parentIdx].replies) {
          comments.value[parentIdx].replies = []
        }
        comments.value[parentIdx].replies.push(newComment)
        comments.value[parentIdx].replyCount = (comments.value[parentIdx].replyCount || 0) + 1
      }
    } else {
      comments.value.unshift(newComment)
      commentPagination.value.total++
    }

    const postStats = res.data.postStats || null
    if (currentPost.value) {
      if (postStats?.stats) {
        currentPost.value.stats = { ...currentPost.value.stats, ...postStats.stats }
      } else {
        currentPost.value.stats.commentCount = (currentPost.value.stats.commentCount || 0) + 1
      }
    }

    return { comment: newComment, postStats }
  }

  async function removeComment(commentId, parentId = null) {
    await deleteComment(commentId)

    if (parentId) {
      const parentIdx = comments.value.findIndex(c => c._id === parentId)
      if (parentIdx !== -1) {
        comments.value[parentIdx].replies = (comments.value[parentIdx].replies || []).filter(
          r => r._id !== commentId
        )
        comments.value[parentIdx].replyCount = Math.max(0, (comments.value[parentIdx].replyCount || 1) - 1)
      }
    } else {
      comments.value = comments.value.filter(c => c._id !== commentId)
      commentPagination.value.total = Math.max(0, commentPagination.value.total - 1)
    }

    if (currentPost.value) {
      currentPost.value.stats.commentCount = Math.max(0, (currentPost.value.stats.commentCount || 1) - 1)
    }
  }

  async function toggleLike(targetType, targetId) {
    const res = await toggleInteraction({ type: 'like', targetType, targetId })
    const action = res.data.action
    if (targetType === 'post') {
      if (!interactionCache[targetId]) interactionCache[targetId] = {}
      interactionCache[targetId].isLiked = action === 'created'
    }
    return { action, stats: res.data.postStats?.stats || null }
  }

  async function toggleCollect(targetType, targetId) {
    const res = await toggleInteraction({ type: 'collect', targetType, targetId })
    const action = res.data.action
    if (targetType === 'post') {
      if (!interactionCache[targetId]) interactionCache[targetId] = {}
      interactionCache[targetId].isCollected = action === 'created'
    }
    return { action, stats: res.data.postStats?.stats || null }
  }

  async function toggleFollowUser(userId) {
    const res = await toggleFollow(userId)
    return res.data.action
  }

  async function checkInteractionStatus(targetType, targetId) {
    try {
      const res = await checkInteraction(targetType, targetId)
      if (targetType === 'post') {
        interactionCache[targetId] = { ...(interactionCache[targetId] || {}), ...res.data }
      }
      return res.data
    } catch {
      return interactionCache[targetId] || { isLiked: false, isCollected: false }
    }
  }

  function getCachedInteraction(targetId) {
    return interactionCache[targetId] || null
  }

  function setSortBy(sortBy) {
    filters.value.sortBy = sortBy
  }

  function setFilter(key, value) {
    filters.value[key] = value
  }

  function applyPostStatsFromServer(postId, stats) {
    if (!stats) return
    const listPost = postList.value.find(p => p._id === postId)
    if (listPost) {
      listPost.stats = { ...listPost.stats, ...stats }
    }
    if (currentPost.value?._id === postId) {
      currentPost.value.stats = { ...currentPost.value.stats, ...stats }
    }
  }

  function updatePostStats(postId, field, delta) {
    const post = postList.value.find(p => p._id === postId)
    if (post) {
      post.stats[field] = Math.max(0, (post.stats[field] || 0) + delta)
    }
    if (currentPost.value?._id === postId) {
      currentPost.value.stats[field] = Math.max(0, (currentPost.value.stats[field] || 0) + delta)
    }
  }

  function clearPosts() {
    postList.value = []
    currentPost.value = null
    comments.value = []
    pagination.value = { page: 1, pageSize: 10, total: 0, totalPages: 0 }
    commentPagination.value = { page: 1, pageSize: 20, total: 0, totalPages: 0 }
    error.value = null
  }

  return {
    postList,
    currentPost,
    comments,
    loading,
    commentLoading,
    error,
    pagination,
    commentPagination,
    filters,
    hasMore,
    hasMoreComments,
    fetchPosts,
    fetchPostById,
    publishPost,
    removePost,
    fetchComments,
    addComment,
    removeComment,
    toggleLike,
    toggleCollect,
    toggleFollowUser,
    checkInteractionStatus,
    getCachedInteraction,
    setSortBy,
    setFilter,
    applyPostStatsFromServer,
    updatePostStats,
    clearPosts
  }
})
