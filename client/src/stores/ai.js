import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  createConversation,
  getConversations,
  getConversationDetail,
  deleteConversation,
  getMessages,
  sendMessageStream,
  // 旧版
  consult,
  getConsultations,
  getGuide,
  submitFeedback
} from '../api/ai'

export const useAiStore = defineStore('ai', () => {
  // ========== 对话式状态（新） ==========
  const conversations = ref([])
  const currentConversation = ref(null)
  const messages = ref([])
  const isStreaming = ref(false)
  const streamingContent = ref('')

  // ========== 旧版状态 ==========
  const consultations = ref([])
  const currentConsultation = ref(null)
  const petGuide = ref('')
  const loading = ref(false)
  const error = ref(null)

  const pagination = ref({
    page: 1,
    pageSize: 10,
    total: 0,
    totalPages: 0
  })

  // ========== 对话式Actions（新） ==========

  // 创建对话
  async function createNewConversation(data) {
    loading.value = true
    error.value = null
    try {
      const res = await createConversation(data)
      const payload = res.data || res
      const conversation = payload.conversation || payload
      conversations.value.unshift(conversation)
      currentConversation.value = conversation
      messages.value = []
      return conversation
    } catch (err) {
      error.value = err.message || '创建对话失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  // 获取对话列表
  async function fetchConversations(params = {}) {
    loading.value = true
    error.value = null
    try {
      const res = await getConversations(params)
      const payload = res.data || res
      conversations.value = payload.list || payload.conversations || payload.data || []
      if (payload.pagination) {
        pagination.value = { ...pagination.value, ...payload.pagination }
      }
      return conversations.value
    } catch (err) {
      error.value = err.message || '获取对话列表失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  // 获取对话详情
  async function fetchConversationDetail(id) {
    loading.value = true
    error.value = null
    try {
      const res = await getConversationDetail(id)
      const payload = res.data || res
      currentConversation.value = payload.conversation || payload
      return currentConversation.value
    } catch (err) {
      error.value = err.message || '获取对话详情失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  // 获取消息历史
  async function fetchMessages(conversationId, params = {}) {
    loading.value = true
    error.value = null
    try {
      const res = await getMessages(conversationId, params)
      const payload = res.data || res
      messages.value = payload.list || payload.messages || payload.data || []
      return messages.value
    } catch (err) {
      error.value = err.message || '获取消息失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  // 发送消息（SSE流式）
  async function sendMessage(conversationId, data) {
    isStreaming.value = true
    streamingContent.value = ''
    error.value = null

    // 先添加用户消息到本地
    const userMessage = {
      _id: 'temp-' + Date.now(),
      conversationId,
      role: 'user',
      content: data.content,
      contentType: 'text',
      metadata: data,
      createdAt: new Date().toISOString()
    }
    messages.value.push(userMessage)

    // 添加AI消息占位
    const aiMessage = {
      _id: 'streaming-' + Date.now(),
      conversationId,
      role: 'assistant',
      content: '',
      contentType: 'card',
      metadata: {},
      createdAt: new Date().toISOString(),
      isStreaming: true
    }
    messages.value.push(aiMessage)

    try {
      const event = await new Promise((resolve, reject) => {
        sendMessageStream(conversationId, data, {
          onChunk: (chunk) => {
            streamingContent.value += chunk
            const lastMsg = messages.value[messages.value.length - 1]
            if (lastMsg && lastMsg.role === 'assistant') {
              lastMsg.content = streamingContent.value
            }
          },
          onDone: (evt) => {
            resolve(evt)
          },
          onError: (err) => {
            reject(err)
          }
        })
      })

      // 完成，替换临时消息为真实消息
      const lastMsg = messages.value[messages.value.length - 1]
      if (lastMsg && lastMsg.role === 'assistant') {
        lastMsg._id = event.messageId || lastMsg._id
        lastMsg.metadata = event.metadata || {}
        lastMsg.isStreaming = false
      }
      isStreaming.value = false
      streamingContent.value = ''
      updateConversationInList(conversationId, data.content)
      return event
    } catch (err) {
      // 移除失败的AI消息
      const lastMsg = messages.value[messages.value.length - 1]
      if (lastMsg && lastMsg.role === 'assistant' && lastMsg.isStreaming) {
        lastMsg.content = '抱歉，AI回复失败：' + (err.message || '未知错误')
        lastMsg.isStreaming = false
        lastMsg.isError = true
      }
      isStreaming.value = false
      streamingContent.value = ''
      error.value = err.message || '发送失败'
      throw err
    }
  }

  // 更新对话列表中的对话
  function updateConversationInList(conversationId, lastMessage) {
    const idx = conversations.value.findIndex(c => c._id === conversationId)
    if (idx >= 0) {
      conversations.value[idx].lastMessageAt = new Date().toISOString()
      conversations.value[idx].messageCount = (conversations.value[idx].messageCount || 0) + 2
      // 移到最前面
      const conv = conversations.value.splice(idx, 1)[0]
      conversations.value.unshift(conv)
    }
  }

  // 删除对话
  async function removeConversation(id) {
    try {
      await deleteConversation(id)
      conversations.value = conversations.value.filter(c => c._id !== id)
      if (currentConversation.value?._id === id) {
        currentConversation.value = null
        messages.value = []
      }
    } catch (err) {
      error.value = err.message || '删除失败'
      throw err
    }
  }

  // 切换对话
  async function switchConversation(id) {
    if (currentConversation.value?._id === id) return
    currentConversation.value = null
    messages.value = []
    await fetchConversationDetail(id)
    await fetchMessages(id)
  }

  // ========== 旧版Actions ==========

  async function submitConsultation(data) {
    loading.value = true
    error.value = null
    try {
      const res = await consult(data)
      const payload = res.data || res
      currentConsultation.value = payload.consultation || payload
      return payload
    } catch (err) {
      error.value = err.message || '问诊失败，请稍后重试'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function fetchConsultations(params = {}) {
    loading.value = true
    error.value = null
    try {
      const queryParams = {
        page: params.page || pagination.value.page,
        pageSize: params.pageSize || pagination.value.pageSize,
        ...(params.petId && { petId: params.petId })
      }
      const res = await getConsultations(queryParams)
      const payload = res.data || res
      consultations.value = payload.list || payload.consultations || payload.data || []
      if (payload.pagination) {
        pagination.value = { ...pagination.value, ...payload.pagination }
      }
      return consultations.value
    } catch (err) {
      error.value = err.message || '获取问诊历史失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function fetchGuide(data) {
    loading.value = true
    error.value = null
    try {
      const res = await getGuide(data)
      const payload = res.data || res
      petGuide.value = payload.guide || payload
      return petGuide.value
    } catch (err) {
      error.value = err.message || '获取指南失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function sendFeedback(consultationId, data) {
    try {
      const res = await submitFeedback(consultationId, data)
      return res.data || res
    } catch (err) {
      error.value = err.message || '提交反馈失败'
      throw err
    }
  }

  function resetConsultation() {
    currentConsultation.value = null
    error.value = null
  }

  function resetGuide() {
    petGuide.value = ''
    error.value = null
  }

  return {
    // 对话式状态
    conversations,
    currentConversation,
    messages,
    isStreaming,
    streamingContent,
    // 对话式Actions
    createNewConversation,
    fetchConversations,
    fetchConversationDetail,
    fetchMessages,
    sendMessage,
    removeConversation,
    switchConversation,
    // 旧版状态
    consultations,
    currentConsultation,
    petGuide,
    loading,
    error,
    pagination,
    // 旧版Actions
    submitConsultation,
    fetchConsultations,
    fetchGuide,
    sendFeedback,
    resetConsultation,
    resetGuide
  }
})