<template>
  <div class="ai-chat-page">
    <!-- 左侧栏 -->
    <aside class="sidebar" :class="{ open: sidebarOpen }">
      <div class="sidebar-header">
        <h2 class="sidebar-title">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" fill="currentColor" opacity="0.15"/>
            <path d="M12 6v4m0 0v4m0-4h4m-4 0H8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
          AI 健康管家
        </h2>
        <button class="sidebar-close" @click="sidebarOpen = false" aria-label="关闭侧边栏">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
        </button>
      </div>

      <button class="new-chat-btn" @click="handleNewChat">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
        新建对话
      </button>

      <!-- 养宠指南快捷入口 -->
      <div class="guide-shortcuts">
        <span class="guide-label">养宠指南</span>
        <div class="guide-tags">
          <button
            v-for="g in guideTypes"
            :key="g.value"
            class="guide-tag"
            :style="{ '--tag-color': g.color }"
            @click="handleGuideShortcut(g.value)"
          >
            {{ g.icon }} {{ g.label }}
          </button>
        </div>
      </div>

      <!-- 对话列表 -->
      <div class="conversation-list">
        <div v-if="loading && !conversations.length" class="sidebar-loading">
          <div class="loading-spinner small"></div>
        </div>

        <div v-else-if="!conversations.length" class="sidebar-empty">
          <p>暂无对话记录</p>
        </div>

        <template v-else>
          <div v-for="group in groupedConversations" :key="group.label" class="conv-group">
            <span class="group-label">{{ group.label }}</span>
            <div
              v-for="conv in group.items"
              :key="conv._id"
              class="conv-item"
              :class="{ active: currentConversation?._id === conv._id }"
              role="button"
              tabindex="0"
              @click="handleSelectConversation(conv._id)"
              @keydown.enter="handleSelectConversation(conv._id)"
            >
              <div class="conv-icon">
                {{ conv.type === 'guide' ? '📖' : '🩺' }}
              </div>
              <div class="conv-info">
                <span class="conv-title">{{ conv.title || '新对话' }}</span>
                <span class="conv-time">{{ formatTime(conv.lastMessageAt) }}</span>
              </div>
              <button
                class="conv-delete"
                @click.stop="handleDeleteConversation(conv._id)"
                aria-label="删除对话"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                </svg>
              </button>
            </div>
          </div>
        </template>
      </div>
    </aside>

    <!-- 遮罩层（移动端） -->
    <div class="sidebar-overlay" :class="{ visible: sidebarOpen }" @click="sidebarOpen = false"></div>

    <!-- 右侧对话区 -->
    <main class="chat-main">
      <!-- 对话头部 -->
      <header class="chat-header">
        <button class="menu-btn" @click="sidebarOpen = true" aria-label="打开侧边栏">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M3 12h18M3 6h18M3 18h18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
        </button>
        <div class="chat-header-info">
          <h1 class="chat-title">
            {{ currentConversation?.title || 'AI 健康管家' }}
          </h1>
          <span v-if="currentConversation?.petId" class="chat-pet">
            {{ currentConversation.petId.name }}
          </span>
        </div>
        <button v-if="currentConversation" class="header-action" @click="handleNewChat" aria-label="新建对话">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
        </button>
      </header>

      <!-- 消息区域 -->
      <div ref="messagesContainer" class="messages-container" @scroll="handleScroll">
        <!-- 欢迎消息（无对话时） -->
        <div v-if="!currentConversation && !messages.length" class="welcome-section">
          <div class="welcome-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" fill="var(--color-primary)" opacity="0.15"/>
              <path d="M12 6v4m0 0v4m0-4h4m-4 0H8" stroke="var(--color-primary)" stroke-width="2" stroke-linecap="round"/>
            </svg>
          </div>
          <h2 class="welcome-title">你好，我是AI健康管家</h2>
          <p class="welcome-desc">我可以帮你分析宠物健康问题、提供养宠建议。选择一只宠物，描述你的问题吧！</p>

          <div class="quick-starters">
            <button
              v-for="starter in quickStarters"
              :key="starter.text"
              class="starter-card"
              @click="handleQuickStart(starter)"
            >
              <span class="starter-icon">{{ starter.icon }}</span>
              <span class="starter-text">{{ starter.text }}</span>
            </button>
          </div>
        </div>

        <!-- 消息列表 -->
        <div v-else class="messages-list">
          <div
            v-for="msg in messages"
            :key="msg._id"
            class="message-item"
            :class="[msg.role, { streaming: msg.isStreaming, error: msg.isError }]"
          >
            <!-- 系统消息 -->
            <template v-if="msg.role === 'system'">
              <div class="system-message">
                <p>{{ msg.content }}</p>
              </div>
            </template>

            <!-- 用户消息 -->
            <template v-else-if="msg.role === 'user'">
              <div class="message-bubble user-bubble">
                <p class="message-text">{{ msg.content }}</p>
                <span class="message-time">{{ formatTime(msg.createdAt) }}</span>
              </div>
            </template>

            <!-- AI消息 -->
            <template v-else>
              <div class="message-avatar">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" fill="var(--color-primary)" opacity="0.2"/>
                  <path d="M12 6v4m0 0v4m0-4h4m-4 0H8" stroke="var(--color-primary)" stroke-width="2" stroke-linecap="round"/>
                </svg>
              </div>
              <div class="message-content">
                <!-- 问诊结果卡片 -->
                <div v-if="msg.metadata?.possibleDiseases?.length" class="result-card">
                  <div v-if="msg.metadata.urgency === 'high'" class="vet-alert">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" fill="#EF4444" opacity="0.15" stroke="#EF4444" stroke-width="1.5"/>
                      <path d="M12 9v4M12 17h.01" stroke="#EF4444" stroke-width="2" stroke-linecap="round"/>
                    </svg>
                    <span>建议尽快就医</span>
                  </div>

                  <div class="diseases-section">
                    <h4 class="section-label">可能的疾病</h4>
                    <div v-for="disease in msg.metadata.possibleDiseases" :key="disease.name" class="disease-item">
                      <div class="disease-header">
                        <span class="disease-name">{{ disease.name }}</span>
                        <span class="disease-prob">{{ disease.probability }}%</span>
                      </div>
                      <div class="prob-bar">
                        <div class="prob-fill" :style="{ width: disease.probability + '%' }"></div>
                      </div>
                      <p class="disease-desc">{{ disease.description }}</p>
                    </div>
                  </div>

                  <div v-if="msg.metadata.suggestions" class="suggestions-section">
                    <h4 class="section-label">综合建议</h4>
                    <p class="suggestions-text">{{ msg.metadata.suggestions }}</p>
                  </div>

                  <div v-if="msg.metadata.homeCareTips" class="care-section">
                    <h4 class="section-label">居家护理</h4>
                    <p class="care-text">{{ msg.metadata.homeCareTips }}</p>
                  </div>
                </div>

                <!-- 普通文本消息 -->
                <div v-else class="ai-text-bubble">
                  <div class="message-text" v-html="formatMessage(msg.content)"></div>
                  <span v-if="msg.isStreaming" class="typing-cursor">|</span>
                </div>

                <span class="message-time">{{ formatTime(msg.createdAt) }}</span>
              </div>
            </template>
          </div>
        </div>
      </div>

      <!-- 输入区域 -->
      <div class="input-area">
        <!-- 宠物选择器 -->
        <div v-if="!currentConversation" class="pet-selector">
          <select v-model="selectedPetId" class="pet-select">
            <option value="">选择宠物（可选）</option>
            <option v-for="pet in petOptions" :key="pet.value" :value="pet.value">
              {{ pet.label }}
            </option>
          </select>
        </div>

        <div class="input-row">
          <textarea
            ref="inputRef"
            v-model="inputText"
            class="message-input"
            :placeholder="isStreaming ? 'AI正在回复中...' : '描述宠物的症状或问题...'"
            :disabled="isStreaming"
            rows="1"
            @keydown.enter.exact.prevent="handleSend"
            @input="autoResize"
          ></textarea>
          <button
            class="send-btn"
            :class="{ active: inputText.trim() && !isStreaming }"
            :disabled="!inputText.trim() || isStreaming"
            @click="handleSend"
          >
            <svg v-if="!isStreaming" width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <div v-else class="loading-spinner small"></div>
          </button>
        </div>

        <p class="input-hint">按 Enter 发送，Shift+Enter 换行</p>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useRoute, useRouter } from 'vue-router'
import { useMessage } from 'naive-ui'
import { useAiStore } from '../../stores/ai'
import { usePetStore } from '../../stores/pet'

const route = useRoute()
const router = useRouter()
const message = useMessage()
const aiStore = useAiStore()
const petStore = usePetStore()

// 响应式解构 store
const { conversations, currentConversation, messages, isStreaming, loading } = storeToRefs(aiStore)

// 状态
const sidebarOpen = ref(false)
const inputText = ref('')
const selectedPetId = ref('')
const messagesContainer = ref(null)
const inputRef = ref(null)

const petOptions = computed(() => {
  return (petStore.petList || []).map(pet => ({
    value: pet._id,
    label: `${pet.name}（${pet.species === 'cat' ? '猫' : pet.species === 'dog' ? '狗' : '其他'}）`
  }))
})

const guideTypes = [
  { value: 'feeding', label: '喂养', icon: '🍖', color: '#F59E0B' },
  { value: 'training', label: '训练', icon: '🎾', color: '#3B82F6' },
  { value: 'health', label: '健康', icon: '💊', color: '#10B981' },
  { value: 'behavior', label: '行为', icon: '🐾', color: '#8B5CF6' }
]

const quickStarters = [
  { icon: '🐱', text: '我的猫最近食欲不振' },
  { icon: '🐶', text: '狗狗一直挠痒痒怎么办' },
  { icon: '💊', text: '宠物疫苗接种时间表' },
  { icon: '🍖', text: '幼犬应该怎么喂养' }
]

// 按日期分组对话
const groupedConversations = computed(() => {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterday = new Date(today.getTime() - 86400000)
  const weekAgo = new Date(today.getTime() - 7 * 86400000)

  const groups = {
    today: { label: '今天', items: [] },
    yesterday: { label: '昨天', items: [] },
    week: { label: '本周', items: [] },
    older: { label: '更早', items: [] }
  }

  for (const conv of conversations.value) {
    const date = new Date(conv.lastMessageAt)
    if (date >= today) {
      groups.today.items.push(conv)
    } else if (date >= yesterday) {
      groups.yesterday.items.push(conv)
    } else if (date >= weekAgo) {
      groups.week.items.push(conv)
    } else {
      groups.older.items.push(conv)
    }
  }

  return Object.values(groups).filter(g => g.items.length > 0)
})

// 方法
function formatTime(dateStr) {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now - date
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)

  if (diffMins < 1) return '刚刚'
  if (diffMins < 60) return `${diffMins}分钟前`
  if (diffHours < 24) return `${diffHours}小时前`

  const isToday = date.toDateString() === now.toDateString()
  if (isToday) {
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
  }

  return `${date.getMonth() + 1}/${date.getDate()}`
}

function formatMessage(text) {
  if (!text) return ''
  // 简单的换行处理
  return text.replace(/\n/g, '<br>')
}

function autoResize(e) {
  const textarea = e.target
  textarea.style.height = 'auto'
  textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px'
}

function scrollToBottom() {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
    }
  })
}

async function handleNewChat() {
  selectedPetId.value = ''
  try {
    await aiStore.createNewConversation({
      type: 'consultation',
      petId: selectedPetId.value || undefined
    })
    sidebarOpen.value = false
    inputRef.value?.focus()
  } catch (err) {
    message.error(err.message || '创建对话失败')
  }
}

async function handleSelectConversation(id) {
  try {
    await aiStore.switchConversation(id)
    sidebarOpen.value = false
    scrollToBottom()
  } catch (err) {
    message.error(err.message || '加载对话失败')
  }
}

async function handleDeleteConversation(id) {
  if (confirm('确定删除这个对话吗？')) {
    try {
      await aiStore.removeConversation(id)
      message.success('对话已删除')
    } catch (err) {
      message.error(err.message || '删除失败')
    }
  }
}

async function handleGuideShortcut(type) {
  try {
    const conv = await aiStore.createNewConversation({
      type: 'guide',
      title: `${guideTypes.find(g => g.value === type)?.label || '养宠'}指南`
    })

    await aiStore.sendMessage(conv._id, {
      content: `请给我一份${guideTypes.find(g => g.value === type)?.label || ''}指南`,
      guideType: type,
      petId: selectedPetId.value || undefined
    })

    sidebarOpen.value = false
    scrollToBottom()
  } catch (err) {
    message.error(err.message || '获取指南失败')
  }
}

function handleQuickStart(starter) {
  inputText.value = starter.text
  handleSend()
}

async function handleSend() {
  const text = inputText.value.trim()
  if (!text || isStreaming.value) return

  // 如果没有对话，先创建
  if (!currentConversation.value) {
    try {
      await aiStore.createNewConversation({
        type: 'consultation',
        petId: selectedPetId.value || undefined,
        title: text.substring(0, 30) + (text.length > 30 ? '...' : '')
      })
    } catch (err) {
      message.error(err.message || '创建对话失败')
      return
    }
  }

  inputText.value = ''
  // 重置textarea高度
  if (inputRef.value) {
    inputRef.value.style.height = 'auto'
  }

  try {
    await aiStore.sendMessage(currentConversation.value._id, {
      content: text,
      petId: selectedPetId.value || currentConversation.value?.petId?._id || undefined
    })
    scrollToBottom()
  } catch (err) {
    message.error(err.message || '发送失败，请重试')
  }
}

function handleScroll() {
  // 可以添加加载更多逻辑
}

// 生命周期
onMounted(async () => {
  // 加载宠物列表
  try {
    await petStore.fetchMyPets()
  } catch (e) {
    // 忽略
  }

  // 加载对话列表
  await aiStore.fetchConversations()

  // 如果路由有id参数，切换到该对话
  const convId = route.params.id
  if (convId) {
    await aiStore.switchConversation(convId)
    scrollToBottom()
  }
})

// 监听消息变化，自动滚动
watch(
  () => messages.value.length,
  () => scrollToBottom(),
  { flush: 'post' }
)
</script>

<style scoped>
.ai-chat-page {
  display: flex;
  height: calc(100vh - 60px);
  background: var(--color-bg, #F0FDF4);
  overflow: hidden;
}

/* ========== 左侧栏 ========== */
.sidebar {
  width: 280px;
  background: var(--color-bg-white, #fff);
  border-right: 1px solid var(--color-border, #E5E7EB);
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
}

.sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 16px 12px;
  border-bottom: 1px solid var(--color-border-light, #f3f4f6);
}

.sidebar-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 700;
  color: var(--color-text-primary, #1F2937);
  margin: 0;
}

.sidebar-title svg {
  color: var(--color-primary, #10B981);
}

.sidebar-close {
  display: none;
  background: none;
  border: none;
  padding: 4px;
  cursor: pointer;
  color: var(--color-text-muted, #9CA3AF);
  border-radius: 6px;
}

.new-chat-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin: 12px 16px;
  padding: 10px;
  background: linear-gradient(135deg, var(--color-primary, #10B981), var(--color-primary-dark, #059669));
  color: #fff;
  border: none;
  border-radius: var(--radius-md, 14px);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.new-chat-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
}

.guide-shortcuts {
  padding: 12px 16px;
  border-bottom: 1px solid var(--color-border-light, #f3f4f6);
}

.guide-label {
  font-size: 12px;
  color: var(--color-text-muted, #9CA3AF);
  font-weight: 500;
}

.guide-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 8px;
}

.guide-tag {
  padding: 4px 10px;
  background: color-mix(in srgb, var(--tag-color) 10%, transparent);
  color: var(--tag-color);
  border: 1px solid color-mix(in srgb, var(--tag-color) 20%, transparent);
  border-radius: var(--radius-full, 9999px);
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.guide-tag:hover {
  background: color-mix(in srgb, var(--tag-color) 20%, transparent);
}

.conversation-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.conv-group {
  margin-bottom: 8px;
}

.group-label {
  display: block;
  padding: 8px 8px 4px;
  font-size: 11px;
  color: var(--color-text-muted, #9CA3AF);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.conv-item {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 10px;
  background: none;
  border: none;
  border-radius: var(--radius-sm, 10px);
  cursor: pointer;
  transition: all 0.2s;
  text-align: left;
}

.conv-item:hover {
  background: var(--color-bg, #F0FDF4);
}

.conv-item.active {
  background: var(--color-primary-bg, #ECFDF5);
}

.conv-icon {
  font-size: 20px;
  flex-shrink: 0;
}

.conv-info {
  flex: 1;
  min-width: 0;
}

.conv-title {
  display: block;
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text-primary, #1F2937);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.conv-time {
  display: block;
  font-size: 11px;
  color: var(--color-text-muted, #9CA3AF);
  margin-top: 2px;
}

.conv-delete {
  background: none;
  border: none;
  padding: 4px;
  cursor: pointer;
  color: var(--color-text-muted, #9CA3AF);
  border-radius: 4px;
  opacity: 0;
  transition: all 0.2s;
}

.conv-item:hover .conv-delete {
  opacity: 1;
}

.conv-delete:hover {
  color: var(--color-danger, #EF4444);
  background: rgba(239, 68, 68, 0.1);
}

.sidebar-loading,
.sidebar-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32px 16px;
  color: var(--color-text-muted, #9CA3AF);
  font-size: 13px;
}

/* ========== 遮罩层 ========== */
.sidebar-overlay {
  display: none;
}

/* ========== 右侧对话区 ========== */
.chat-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.chat-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 20px;
  background: var(--color-bg-white, #fff);
  border-bottom: 1px solid var(--color-border-light, #f3f4f6);
}

.menu-btn {
  display: none;
  background: none;
  border: none;
  padding: 6px;
  cursor: pointer;
  color: var(--color-text-secondary, #6B7280);
  border-radius: 6px;
}

.chat-header-info {
  flex: 1;
}

.chat-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--color-text-primary, #1F2937);
  margin: 0;
}

.chat-pet {
  font-size: 12px;
  color: var(--color-primary, #10B981);
  font-weight: 500;
}

.header-action {
  background: none;
  border: none;
  padding: 6px;
  cursor: pointer;
  color: var(--color-text-muted, #9CA3AF);
  border-radius: 6px;
  transition: all 0.2s;
}

.header-action:hover {
  color: var(--color-primary, #10B981);
  background: var(--color-primary-bg, #ECFDF5);
}

/* ========== 消息区域 ========== */
.messages-container {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}

.welcome-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100%;
  text-align: center;
  padding: 40px 20px;
}

.welcome-icon {
  margin-bottom: 16px;
}

.welcome-title {
  font-size: 24px;
  font-weight: 700;
  color: var(--color-text-primary, #1F2937);
  margin: 0 0 8px;
}

.welcome-desc {
  font-size: 14px;
  color: var(--color-text-secondary, #6B7280);
  margin: 0 0 32px;
  max-width: 400px;
}

.quick-starters {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  max-width: 500px;
  width: 100%;
}

.starter-card {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px;
  background: var(--color-bg-white, #fff);
  border: 1px solid var(--color-border, #E5E7EB);
  border-radius: var(--radius-md, 14px);
  cursor: pointer;
  transition: all 0.2s;
  text-align: left;
}

.starter-card:hover {
  border-color: var(--color-primary, #10B981);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.starter-icon {
  font-size: 24px;
}

.starter-text {
  font-size: 13px;
  color: var(--color-text-primary, #1F2937);
  font-weight: 500;
}

/* ========== 消息样式 ========== */
.messages-list {
  max-width: 800px;
  margin: 0 auto;
  width: 100%;
}

.message-item {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
  animation: fadeInUp 0.3s ease-out;
}

.message-item.user {
  flex-direction: row-reverse;
}

.system-message {
  text-align: center;
  padding: 8px 16px;
  margin: 0 auto;
}

.system-message p {
  font-size: 12px;
  color: var(--color-text-muted, #9CA3AF);
  margin: 0;
}

.message-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: var(--color-primary-bg, #ECFDF5);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.user-bubble {
  background: linear-gradient(135deg, var(--color-primary, #10B981), var(--color-primary-dark, #059669));
  color: #fff;
  padding: 12px 16px;
  border-radius: 18px 18px 4px 18px;
  max-width: 70%;
}

.ai-text-bubble {
  background: var(--color-bg-white, #fff);
  border: 1px solid var(--color-border-light, #f3f4f6);
  padding: 12px 16px;
  border-radius: 18px 18px 18px 4px;
  max-width: 85%;
  position: relative;
}

.message-text {
  font-size: 14px;
  line-height: 1.6;
  margin: 0;
  word-break: break-word;
}

.user-bubble .message-text {
  color: #fff;
}

.typing-cursor {
  display: inline-block;
  animation: blink 1s infinite;
  color: var(--color-primary, #10B981);
  font-weight: bold;
}

.message-time {
  display: block;
  font-size: 11px;
  color: var(--color-text-muted, #9CA3AF);
  margin-top: 4px;
}

.user-bubble .message-time {
  color: rgba(255, 255, 255, 0.7);
}

/* ========== 结果卡片 ========== */
.result-card {
  background: var(--color-bg-white, #fff);
  border: 1px solid var(--color-border-light, #f3f4f6);
  border-radius: 18px 18px 18px 4px;
  padding: 16px;
  max-width: 85%;
}

.vet-alert {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  background: rgba(239, 68, 68, 0.08);
  border-radius: var(--radius-sm, 10px);
  margin-bottom: 12px;
  font-size: 13px;
  font-weight: 600;
  color: #EF4444;
}

.section-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--color-text-muted, #9CA3AF);
  margin: 0 0 8px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.disease-item {
  margin-bottom: 12px;
}

.disease-item:last-child {
  margin-bottom: 0;
}

.disease-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.disease-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text-primary, #1F2937);
}

.disease-prob {
  font-size: 13px;
  font-weight: 700;
  color: var(--color-primary, #10B981);
}

.prob-bar {
  height: 6px;
  background: var(--color-border-light, #f3f4f6);
  border-radius: 3px;
  overflow: hidden;
  margin-bottom: 4px;
}

.prob-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--color-primary, #10B981), var(--color-primary-light, #34D399));
  border-radius: 3px;
  transition: width 0.5s ease-out;
}

.disease-desc {
  font-size: 12px;
  color: var(--color-text-secondary, #6B7280);
  margin: 0;
}

.suggestions-section,
.care-section {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid var(--color-border-light, #f3f4f6);
}

.suggestions-text,
.care-text {
  font-size: 13px;
  color: var(--color-text-primary, #1F2937);
  line-height: 1.6;
  margin: 0;
  white-space: pre-wrap;
}

/* ========== 输入区域 ========== */
.input-area {
  padding: 16px 20px;
  background: var(--color-bg-white, #fff);
  border-top: 1px solid var(--color-border-light, #f3f4f6);
}

.pet-selector {
  margin-bottom: 8px;
}

.pet-select {
  width: 100%;
  max-width: 200px;
  padding: 6px 10px;
  border: 1px solid var(--color-border, #E5E7EB);
  border-radius: var(--radius-sm, 10px);
  font-size: 13px;
  color: var(--color-text-primary, #1F2937);
  background: var(--color-bg-white, #fff);
  cursor: pointer;
}

.input-row {
  display: flex;
  align-items: flex-end;
  gap: 10px;
  max-width: 800px;
  margin: 0 auto;
}

.message-input {
  flex: 1;
  padding: 10px 14px;
  border: 1px solid var(--color-border, #E5E7EB);
  border-radius: var(--radius-md, 14px);
  font-size: 14px;
  line-height: 1.5;
  color: var(--color-text-primary, #1F2937);
  background: var(--color-bg-white, #fff);
  resize: none;
  min-height: 42px;
  max-height: 120px;
  transition: border-color 0.2s;
}

.message-input:focus {
  outline: none;
  border-color: var(--color-primary, #10B981);
  box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
}

.message-input:disabled {
  background: var(--color-bg, #F0FDF4);
  cursor: not-allowed;
}

.send-btn {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  background: var(--color-border, #E5E7EB);
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  flex-shrink: 0;
}

.send-btn.active {
  background: linear-gradient(135deg, var(--color-primary, #10B981), var(--color-primary-dark, #059669));
  color: #fff;
}

.send-btn.active:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
}

.send-btn:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.input-hint {
  font-size: 11px;
  color: var(--color-text-muted, #9CA3AF);
  margin: 6px 0 0;
  text-align: center;
}

/* ========== 动画 ========== */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}

.loading-spinner {
  width: 20px;
  height: 20px;
  border: 2px solid var(--color-border, #E5E7EB);
  border-top-color: var(--color-primary, #10B981);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.loading-spinner.small {
  width: 16px;
  height: 16px;
  border-width: 2px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* ========== 响应式 ========== */
@media (max-width: 768px) {
  .sidebar {
    position: fixed;
    left: 0;
    top: 0;
    bottom: 0;
    z-index: 100;
    transform: translateX(-100%);
    transition: transform 0.3s var(--spring-bounce, cubic-bezier(0.34, 1.56, 0.64, 1));
  }

  .sidebar.open {
    transform: translateX(0);
  }

  .sidebar-close {
    display: block;
  }

  .sidebar-overlay {
    display: block;
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.4);
    z-index: 99;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.3s;
  }

  .sidebar-overlay.visible {
    opacity: 1;
    pointer-events: auto;
  }

  .menu-btn {
    display: block;
  }

  .quick-starters {
    grid-template-columns: 1fr;
  }

  .user-bubble,
  .ai-text-bubble,
  .result-card {
    max-width: 90%;
  }
}
</style>