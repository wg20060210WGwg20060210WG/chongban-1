<template>
  <div class="pet-guide-page">
    <!-- 页面头部 -->
    <div class="page-header spring-anim">
      <n-button quaternary @click="router.push('/ai')" class="back-btn" aria-label="返回">
        <template #icon>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M19 12H5m0 0l7 7m-7-7l7-7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </template>
      </n-button>
      <h1 class="page-title">AI 养宠指南</h1>
    </div>

    <!-- 选择区域 -->
    <div class="guide-form spring-anim" style="animation-delay: 0.06s;">
      <div class="form-section">
        <label class="form-label">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill="currentColor"/>
          </svg>
          选择宠物
          <span class="required-dot">*</span>
        </label>
        <div v-if="!petsLoading && petOptions.length === 0" class="empty-pets-hint">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle cx="12" cy="12" r="10" stroke="#F59E0B" stroke-width="1.5"/>
            <path d="M12 8v4m0 4h.01" stroke="#F59E0B" stroke-width="2" stroke-linecap="round"/>
          </svg>
          <span>还没有添加宠物，<router-link to="/pets" class="link-primary">去添加</router-link></span>
        </div>
        <n-select
          v-else
          v-model:value="selectedPetId"
          :options="petOptions"
          placeholder="请选择您的宠物"
          :loading="petsLoading"
          filterable
        />
      </div>

      <div class="form-section">
        <label class="form-label">选择指南类型</label>
        <div class="guide-types">
          <div
            v-for="type in guideTypes"
            :key="type.value"
            class="guide-type-card spring-anim"
            :style="{ animationDelay: `${0.1 + guideTypes.indexOf(type) * 0.05}s` }"
            :class="{ active: selectedType === type.value }"
            role="button"
            tabindex="0"
            :aria-label="`${type.label} - ${type.desc}`"
            :aria-pressed="selectedType === type.value"
            @click="selectedType = type.value"
            @keydown.enter="selectedType = type.value"
            @keydown.space.prevent="selectedType = type.value"
          >
            <div class="type-icon" :style="{ background: type.gradient }">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path :d="type.iconPath" stroke="#fff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
            <span class="type-label">{{ type.label }}</span>
            <span class="type-desc">{{ type.desc }}</span>
          </div>
        </div>
      </div>

      <n-button
        type="primary"
        size="large"
        block
        :loading="aiStore.loading"
        :disabled="!selectedPetId || !selectedType"
        @click="handleFetchGuide"
        class="submit-btn"
      >
        生成养宠指南
      </n-button>
    </div>

    <!-- 指南结果 -->
    <div v-if="aiStore.petGuide" ref="resultRef" class="guide-result spring-anim" style="animation-delay: 0.15s;">
      <div class="result-card card">
        <div class="result-header">
          <h3 class="result-title">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
            {{ getTypeLabel(selectedType) }}指南
          </h3>
          <n-button quaternary size="small" @click="handleCopy" aria-label="复制指南内容">
            <template #icon>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <rect x="9" y="9" width="13" height="13" rx="2" stroke="currentColor" stroke-width="1.5"/>
                <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" stroke="currentColor" stroke-width="1.5"/>
              </svg>
            </template>
            复制
          </n-button>
        </div>
        <div class="guide-content" v-html="renderGuide(aiStore.petGuide)"></div>
      </div>
    </div>

    <!-- 加载骨架 -->
    <div v-if="aiStore.loading" class="skeleton-wrap spring-anim" style="animation-delay: 0.15s;">
      <div v-for="i in 3" :key="i" class="skeleton-card" :style="{ animationDelay: `${0.15 + i * 0.05}s` }">
        <div class="skeleton-line w80"></div>
        <div class="skeleton-line w60"></div>
        <div class="skeleton-line w90"></div>
      </div>
    </div>

    <!-- 空状态引导 -->
    <div v-if="!aiStore.loading && !aiStore.petGuide && !fetchError" class="guide-hint spring-anim" style="animation-delay: 0.2s;">
      <div class="hint-icon">
        <svg width="56" height="56" viewBox="0 0 120 120" fill="none" aria-hidden="true">
          <circle cx="60" cy="60" r="50" fill="#f0fdf4" stroke="#bbf7d0" stroke-width="1.5"/>
          <path d="M45 75c3-20 27-20 30 0" stroke="#10B981" stroke-width="2" stroke-linecap="round" fill="none"/>
          <path d="M60 40v12m-6-6h12" stroke="#10B981" stroke-width="2" stroke-linecap="round"/>
        </svg>
      </div>
      <p class="hint-text">选择宠物和指南类型，为您生成个性化养宠指南</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useMessage } from 'naive-ui'
import { useAiStore } from '../../stores/ai'
import { usePetStore } from '../../stores/pet'

const router = useRouter()
const message = useMessage()
const aiStore = useAiStore()
const petStore = usePetStore()

const resultRef = ref(null)
const petsLoading = ref(false)
const selectedPetId = ref(null)
const selectedType = ref(null)
const fetchError = ref('')

const guideTypes = [
  {
    value: 'feeding',
    label: '喂养',
    desc: '饮食搭配与营养',
    gradient: 'linear-gradient(135deg, #10B981, #059669)',
    iconPath: 'M3 3h18v18H3zM12 8v8m-4-4h8'
  },
  {
    value: 'training',
    label: '训练',
    desc: '行为训练与社交',
    gradient: 'linear-gradient(135deg, #3B82F6, #2563EB)',
    iconPath: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z'
  },
  {
    value: 'health',
    label: '健康',
    desc: '疾病预防与护理',
    gradient: 'linear-gradient(135deg, #F59E0B, #D97706)',
    iconPath: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z'
  },
  {
    value: 'behavior',
    label: '行为',
    desc: '心理与行为解读',
    gradient: 'linear-gradient(135deg, #8B5CF6, #7C3AED)',
    iconPath: 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z'
  }
]

const petOptions = computed(() => {
  return (petStore.petList || []).map(pet => ({
    label: pet.name + (pet.species ? ` (${pet.species})` : ''),
    value: pet._id
  }))
})

function getTypeLabel(type) {
  return guideTypes.find(t => t.value === type)?.label || ''
}

function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function renderGuide(text) {
  if (!text) return ''
  let html = escapeHtml(text)
  // 标题: ### xxx
  html = html.replace(/^### (.+)$/gm, '<h4 class="guide-h4">$1</h4>')
  html = html.replace(/^## (.+)$/gm, '<h3 class="guide-h3">$1</h3>')
  // 粗体和斜体
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>')
  // 无序列表: - xxx
  html = html.replace(/^- (.+)$/gm, '<li class="guide-li">$1</li>')
  html = html.replace(/(<li class="guide-li">.*<\/li>\n?)+/g, '<ul class="guide-ul">$&</ul>')
  // 有序列表: 1. xxx
  html = html.replace(/^\d+\. (.+)$/gm, '<li class="guide-oli">$1</li>')
  html = html.replace(/(<li class="guide-oli">.*<\/li>\n?)+/g, '<ol class="guide-ol">$&</ol>')
  // 换行
  html = html.replace(/\n/g, '<br>')
  // 清理多余的 <br> 在块级元素前后
  html = html.replace(/<br>(<\/?(?:h[34]|ul|ol|li))/g, '$1')
  html = html.replace(/(<\/(?:h[34]|ul|ol|li)>)<br>/g, '$1')
  return html
}

async function handleFetchGuide() {
  if (!selectedPetId.value || !selectedType.value) return
  fetchError.value = ''
  try {
    await aiStore.fetchGuide({
      petId: selectedPetId.value,
      type: selectedType.value
    })
    await nextTick()
    if (resultRef.value) {
      resultRef.value.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  } catch (err) {
    const msg = err.message || '获取指南失败'
    fetchError.value = msg
    message.error(msg)
  }
}

function handleCopy() {
  if (!aiStore.petGuide) {
    message.warning('暂无指南内容可复制')
    return
  }
  if (navigator.clipboard) {
    navigator.clipboard.writeText(aiStore.petGuide)
      .then(() => message.success('已复制到剪贴板'))
      .catch(() => fallbackCopy(aiStore.petGuide))
  } else {
    fallbackCopy(aiStore.petGuide)
  }
}

function fallbackCopy(text) {
  const ta = document.createElement('textarea')
  ta.value = text
  ta.style.cssText = 'position:fixed;left:-9999px;opacity:0'
  document.body.appendChild(ta)
  ta.select()
  try {
    document.execCommand('copy')
    message.success('已复制到剪贴板')
  } catch {
    message.error('复制失败，请长按手动复制')
  } finally {
    document.body.removeChild(ta)
  }
}

onMounted(async () => {
  aiStore.resetGuide()
  petsLoading.value = true
  try {
    await petStore.fetchMyPets()
  } finally {
    petsLoading.value = false
  }
})
</script>

<style scoped>
.pet-guide-page {
  min-height: calc(100vh - 120px);
  padding: 20px 16px 40px;
  max-width: 680px;
  margin: 0 auto;
}

/* 页面头部 */
.page-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 24px;
}

.page-title {
  font-size: 20px;
  font-weight: 700;
  margin: 0;
  color: var(--color-text-primary);
}

/* 表单区域 */
.form-section {
  margin-bottom: 24px;
}

.form-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text-primary);
  margin-bottom: 12px;
}

/* 指南类型卡片 */
.guide-types {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.guide-type-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 20px 12px;
  background: var(--color-bg-white);
  border-radius: var(--radius-lg, 20px);
  box-shadow: var(--shadow-card);
  cursor: pointer;
  transition: all 0.3s var(--spring-bounce, cubic-bezier(0.34, 1.56, 0.64, 1));
  border: 2px solid transparent;
  opacity: 0.7;
}

.guide-type-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-hover);
  opacity: 0.9;
}

.guide-type-card:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

.guide-type-card.active {
  opacity: 1;
  border-color: var(--color-primary);
  background: var(--color-primary-bg);
  box-shadow: 0 0 0 2px var(--color-primary), var(--shadow-card);
}

.type-icon {
  width: 52px;
  height: 52px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.type-label {
  font-size: 16px;
  font-weight: 700;
  color: var(--color-text-primary);
}

.type-desc {
  font-size: 12px;
  color: var(--color-text-muted);
  text-align: center;
}

/* 提交按钮 */
.submit-btn {
  height: 48px;
  font-size: 16px;
  font-weight: 600;
  background: linear-gradient(135deg, var(--color-primary), var(--color-primary-dark));
  border: none;
  box-shadow: 0 4px 16px rgba(16, 185, 129, 0.3);
  transition: all 0.3s;
}

.submit-btn:hover:not(:disabled) {
  box-shadow: 0 6px 20px rgba(16, 185, 129, 0.4);
  transform: translateY(-2px);
}

.submit-btn:active:not(:disabled) {
  transform: translateY(0);
}

/* 指南结果 */
.guide-result {
  margin-top: 24px;
}

.result-card {
  padding: 24px;
  transition: transform 0.3s var(--spring-bounce, cubic-bezier(0.34, 1.56, 0.64, 1));
}

.result-card:hover {
  transform: translateY(-4px);
}

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.result-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 18px;
  font-weight: 700;
  margin: 0;
  color: var(--color-text-primary);
}

.result-title svg {
  color: var(--color-primary);
}

/* 指南内容 */
.guide-content {
  font-size: 15px;
  line-height: 1.8;
  color: var(--color-text-primary);
  word-break: break-word;
  overflow-wrap: break-word;
}

.guide-content :deep(strong) {
  font-weight: 700;
  color: var(--color-primary-dark);
}

.guide-content :deep(em) {
  font-style: italic;
  color: var(--color-text-secondary);
}

.guide-content :deep(.guide-h3) {
  font-size: 17px;
  font-weight: 700;
  margin: 20px 0 8px;
  color: var(--color-text-primary);
  padding-bottom: 8px;
  border-bottom: 1px solid var(--color-border-light, #f3f4f6);
}

.guide-content :deep(.guide-h4) {
  font-size: 15px;
  font-weight: 700;
  margin: 16px 0 6px;
  color: var(--color-text-primary);
}

.guide-content :deep(.guide-ul),
.guide-content :deep(.guide-ol) {
  padding-left: 20px;
  margin: 8px 0;
}

.guide-content :deep(.guide-li),
.guide-content :deep(.guide-oli) {
  margin-bottom: 6px;
  line-height: 1.7;
  word-break: break-word;
  overflow-wrap: break-word;
}

/* 空宠物提示 */
.empty-pets-hint {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 14px 16px;
  background: #FFFBEB;
  border: 1px solid #FDE68A;
  border-radius: var(--radius-md, 14px);
  font-size: 14px;
  color: #92400E;
}

.empty-pets-hint .link-primary {
  color: var(--color-primary);
  font-weight: 600;
  text-decoration: underline;
}

.required-dot {
  color: #EF4444;
  margin-left: 2px;
}

/* 骨架屏 */
.skeleton-wrap {
  margin-top: 24px;
}

.skeleton-card {
  background: var(--color-bg-white, #fff);
  border-radius: var(--radius-md, 14px);
  padding: 20px;
  margin-bottom: 12px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  box-shadow: var(--shadow-card);
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
.skeleton-line.w90 { width: 90%; }

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* 空状态 */
.guide-hint {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 40px 20px;
  text-align: center;
}

.hint-icon {
  animation: float 3.5s ease-in-out infinite;
  filter: drop-shadow(0 8px 20px rgba(16, 185, 129, 0.1));
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

.hint-text {
  font-size: 14px;
  color: var(--color-text-muted);
  margin: 0;
  max-width: 280px;
}

@media (max-width: 480px) {
  .guide-types {
    grid-template-columns: repeat(2, 1fr);
    gap: 8px;
  }

  .guide-type-card {
    padding: 16px 8px;
  }

  .type-icon {
    width: 44px;
    height: 44px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .spring-anim {
    animation: none !important;
    opacity: 1 !important;
    transform: none !important;
  }
  .hint-icon {
    animation: none !important;
  }
  .skeleton-line {
    animation: none !important;
  }
}
</style>