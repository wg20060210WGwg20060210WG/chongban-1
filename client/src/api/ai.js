import request from './index'
import { API_BASE_URL, STORAGE_KEYS } from '../utils/constants'
import storage from '../utils/storage'

// ========== 对话式API（新） ==========

// 对话管理
export const createConversation = (data) => {
  return request.post('/ai/conversations', data)
}

export const getConversations = (params) => {
  return request.get('/ai/conversations', { params })
}

export const getConversationDetail = (id) => {
  return request.get(`/ai/conversations/${id}`)
}

export const deleteConversation = (id) => {
  return request.delete(`/ai/conversations/${id}`)
}

// 消息管理
export const getMessages = (conversationId, params) => {
  return request.get(`/ai/conversations/${conversationId}/messages`, { params })
}

// 发送消息（非流式）
export const sendMessage = (conversationId, data) => {
  return request.post(`/ai/conversations/${conversationId}/messages`, data)
}

// 发送消息（SSE流式）- 直接用 fetch + ReadableStream
export const sendMessageStream = async (conversationId, data, { onChunk, onDone, onError }) => {
  const token = storage.get(STORAGE_KEYS.TOKEN) || ''
  try {
    const url = `${API_BASE_URL}/ai/conversations/${conversationId}/messages/stream`
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(data)
    })

    if (!response.ok) {
      const err = await response.json().catch(() => ({ message: '请求失败' }))
      throw new Error(err.message || '请求失败')
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const event = JSON.parse(line.slice(6))
            if (event.type === 'chunk') {
              onChunk?.(event.content)
            } else if (event.type === 'done') {
              onDone?.(event)
            } else if (event.type === 'error') {
              onError?.(new Error(event.message))
            }
          } catch (e) {
            // 忽略解析错误
          }
        }
      }
    }
  } catch (err) {
    onError?.(err)
  }
}

// ========== 旧版API（保留兼容） ==========

export const consult = (data) => {
  return request.post('/ai/consult', data)
}

export const getConsultations = (params) => {
  return request.get('/ai/consultations', { params })
}

export const getGuide = (data) => {
  return request.post('/ai/guide', data)
}

export const submitFeedback = (consultationId, data) => {
  return request.post(`/ai/consultations/${consultationId}/feedback`, data)
}

export const getConsultationDetail = (consultationId) => {
  return request.get(`/ai/consultations/${consultationId}`)
}