<template>
  <div class="ai-doctor-page">
    <div class="page-header spring-enter">
      <div class="header-icon">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" fill="currentColor" opacity="0.15"/>
          <path d="M12 6v4m0 0v4m0-4h4m-4 0H8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="1.5" fill="none"/>
        </svg>
      </div>
      <div>
        <h1 class="page-title">AI 健康管家</h1>
        <p class="page-desc">智能宠物健康问诊，为您提供专业建议</p>
      </div>
    </div>

    <!-- 输入阶段 -->
    <div v-if="!result" class="consult-form spring-enter">
      <!-- 无宠物引导 -->
      <div v-if="!petsLoading && petOptions.length === 0" class="empty-pets card">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M4.5 9.5a2.5 2.5 0 115 0 2.5 2.5 0 01-5 0zm10 0a2.5 2.5 0 115 0 2.5 2.5 0 01-5 0zm-7.5 7c0-2.5 2-4.5 5-4.5s5 2 5 4.5" stroke="var(--color-primary)" stroke-width="1.5" stroke-linecap="round"/>
        </svg>
        <p class="empty-pets-text">还没有添加宠物</p>
        <n-button type="primary" size="small" @click="router.push('/pets')">去添加宠物</n-button>
      </div>

      <div v-else class="form-card card">
        <!-- 错误提示（靠近表单底部） -->
        <n-alert v-if="submitError" type="error" :show-icon="true" closable class="error-alert" @close="submitError = ''">
          <template #header><strong>问诊失败</strong></template>
          {{ submitError }}
        </n-alert>

        <div class="form-section">
          <label class="form-label">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill="currentColor"/>
            </svg>
            选择宠物 <span class="required">*</span>
          </label>
          <n-select
            v-model:value="form.petId"
            :options="petOptions"
            placeholder="请选择您的宠物"
            :loading="petsLoading"
            filterable
          />
          <p v-if="tried && !form.petId" class="field-error">请选择宠物</p>
        </div>

        <div class="form-section">
          <label class="form-label">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke="currentColor" stroke-width="1.5"/>
              <polyline points="14 2 14 8 20 8" stroke="currentColor" stroke-width="1.5"/>
              <line x1="16" y1="13" x2="8" y2="13" stroke="currentColor" stroke-width="1.5"/>
              <line x1="16" y1="17" x2="8" y2="17" stroke="currentColor" stroke-width="1.5"/>
            </svg>
            症状描述 <span class="required">*</span>
          </label>
          <n-input
            v-model:value="form.symptoms"
            type="textarea"
            placeholder="请详细描述宠物的症状，例如：食欲不振、呕吐、精神萎靡..."
            :rows="4"
            maxlength="2000"
            show-count
            @keydown.ctrl.enter="handleSubmit"
            @keydown.meta.enter="handleSubmit"
          />
          <p v-if="tried && !form.symptoms.trim()" class="field-error">请描述症状</p>
          <p v-if="!isMobile" class="form-hint">按 Ctrl+Enter 快速提交</p>
        </div>

        <div class="form-row">
          <div class="form-section half">
            <label class="form-label">持续时间</label>
            <n-input
              v-model:value="form.duration"
              placeholder="例如：2天"
              maxlength="100"
            />
          </div>
          <div class="form-section half">
            <label class="form-label">严重程度</label>
            <n-radio-group v-model:value="form.severity" name="severity">
              <n-space>
                <n-radio-button value="mild">轻微</n-radio-button>
                <n-radio-button value="moderate">中等</n-radio-button>
                <n-radio-button value="severe">严重</n-radio-button>
              </n-space>
            </n-radio-group>
          </div>
        </div>

        <div class="form-section">
          <label class="form-label">上传图片（可选）</label>
          <ImageUploader
            :max-count="3"
            :max-size="5"
            @change="handleImagesChange"
          />
        </div>

        <n-button
          type="primary"
          size="large"
          block
          :loading="aiStore.loading"
          @click="handleSubmit"
          class="submit-btn"
        >
          <template #icon>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" stroke="currentColor" stroke-width="1.5"/>
              <path d="M8 12l3 3 5-5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </template>
          开始 AI 问诊
        </n-button>

        <n-button
          quaternary
          block
          class="history-entry-btn"
          @click="goToHistory"
        >
          <template #icon>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.5"/>
              <path d="M12 7v5l3 3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </template>
          查看问诊历史
        </n-button>
      </div>
    </div>

    <!-- 结果阶段 -->
    <div v-if="result" class="consult-result" @click="skipTypewriter">
      <div class="result-header spring-enter">
        <n-button quaternary @click.stop="handleReset" class="back-btn" aria-label="重新问诊">
          <template #icon>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M1 4v6h6M23 20v-6h-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M20.49 9A9 9 0 005.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 013.51 15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </template>
          重新问诊
        </n-button>
        <n-tag :type="urgencyTagType" size="large" round>
          <template #icon>
            <svg v-if="urgencyIcon === 'alert'" width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <svg v-else-if="urgencyIcon === 'shield'" width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <svg v-else width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
              <line x1="12" y1="8" x2="12" y2="12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              <line x1="12" y1="16" x2="12.01" y2="16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
          </template>
          紧急程度：{{ urgencyLabel }}
        </n-tag>
      </div>

      <!-- 需要就医提示 -->
      <n-alert
        v-if="result.aiAnalysis.needsVet"
        type="warning"
        :show-icon="true"
        class="vet-alert spring-enter"
      >
        <template #header>
          <strong>建议尽快就医</strong>
        </template>
        AI 分析认为您的宠物可能需要专业兽医的诊治，请尽快带宠物前往宠物医院。
      </n-alert>

      <n-alert
        v-else
        type="success"
        :show-icon="true"
        class="vet-alert spring-enter"
      >
        <template #header>
          <strong>暂无紧急就医需求</strong>
        </template>
        以下建议仅供参考，如症状持续或加重，请及时就医。
      </n-alert>

      <!-- 可能疾病 -->
      <div v-if="result.aiAnalysis.possibleDiseases?.length" class="result-card card spring-enter spring-stagger-1">
        <h3 class="card-title">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M9 12h6m-3-3v6m-7 4h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
          可能的疾病
        </h3>
        <div v-for="(disease, idx) in result.aiAnalysis.possibleDiseases" :key="idx" class="disease-item">
          <div class="disease-header">
            <span class="disease-name">{{ disease.name }}</span>
            <span class="disease-prob">{{ disease.probability }}%</span>
          </div>
          <n-progress
            :percentage="disease.probability"
            :color="getProgressColor(disease.probability)"
            :show-indicator="false"
            :height="8"
            :border-radius="4"
          />
          <p v-if="disease.description" class="disease-desc">{{ disease.description }}</p>
        </div>
      </div>

      <!-- 建议（伪流式逐字渲染） -->
      <div class="result-card card spring-enter spring-stagger-2">
        <h3 class="card-title">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
          诊疗建议
        </h3>
        <p class="suggestion-text">
          {{ displayedSuggestion }}<span v-if="isTypingSuggestion" class="typing-cursor">|</span>
        </p>
      </div>

      <!-- 居家护理（伪流式逐字渲染） -->
      <div v-if="result.aiAnalysis.homeCareTips" class="result-card card spring-enter spring-stagger-3">
        <h3 class="card-title">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
          居家护理建议
        </h3>
        <p class="care-text">
          {{ displayedCareTips }}<span v-if="isTypingCareTips" class="typing-cursor">|</span>
        </p>
      </div>

      <!-- 操作按钮 -->
      <div class="result-actions spring-enter spring-stagger-4">
        <n-button type="primary" @click.stop="goToDetail(result.consultationId || result.consultation?._id)">
          查看详情
        </n-button>
        <n-button quaternary @click.stop="goToHistory">
          问诊历史
        </n-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { useMessage } from 'naive-ui'
import { useAiStore } from '../../stores/ai'
import { usePetStore } from '../../stores/pet'
import ImageUploader from '../../components/common/ImageUploader.vue'

const router = useRouter()
const message = useMessage()
const aiStore = useAiStore()
const petStore = usePetStore()

const petsLoading = ref(false)
const result = ref(null)
const submitError = ref('')
const tried = ref(false)

const isMobile = computed(() => {
  if (typeof navigator === 'undefined') return false
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
})

// 伪流式状态
const displayedSuggestion = ref('')
const displayedCareTips = ref('')
const isTypingSuggestion = ref(false)
const isTypingCareTips = ref(false)
let suggestionTimer = null
let careTipsTimer = null

const form = ref({
  petId: null,
  symptoms: '',
  duration: '',
  severity: 'moderate',
  images: []
})

const petOptions = computed(() => {
  return (petStore.petList || []).map(pet => ({
    label: pet.name + (pet.species ? ` (${pet.species})` : ''),
    value: pet._id
  }))
})

const urgencyLabel = computed(() => {
  if (!result.value) return ''
  const map = { low: '低', medium: '中等', high: '高' }
  return map[result.value.aiAnalysis.urgency] || '中等'
})

const urgencyTagType = computed(() => {
  if (!result.value) return 'default'
  const map = { low: 'success', medium: 'warning', high: 'error' }
  return map[result.value.aiAnalysis.urgency] || 'warning'
})

const urgencyIcon = computed(() => {
  if (!result.value) return 'info'
  const map = { low: 'shield', medium: 'info', high: 'alert' }
  return map[result.value.aiAnalysis.urgency] || 'info'
})

function getProgressColor(pct) {
  if (pct >= 70) return '#EF4444'
  if (pct >= 40) return '#F59E0B'
  return '#10B981'
}

function handleImagesChange(files) {
  form.value.images = files
}

// 伪流式逐字渲染（动态速度：长文本更快）
function typewriterEffect(text, displayRef, typingRef) {
  return new Promise(resolve => {
    if (!text) { resolve(); return }
    const speed = text.length > 300 ? 10 : text.length > 100 ? 18 : 25
    let i = 0
    displayRef.value = ''
    typingRef.value = true
    const timer = setInterval(() => {
      if (i < text.length) {
        displayRef.value += text[i]
        i++
      } else {
        clearInterval(timer)
        typingRef.value = false
        resolve()
      }
    }, speed)
    if (typingRef === isTypingSuggestion) suggestionTimer = timer
    else careTipsTimer = timer
  })
}

function stopTypewriters() {
  if (suggestionTimer) { clearInterval(suggestionTimer); suggestionTimer = null }
  if (careTipsTimer) { clearInterval(careTipsTimer); careTipsTimer = null }
  isTypingSuggestion.value = false
  isTypingCareTips.value = false
}

// 点击跳过动画
function skipTypewriter() {
  if (!isTypingSuggestion.value && !isTypingCareTips.value) return
  stopTypewriters()
  if (result.value?.aiAnalysis) {
    displayedSuggestion.value = result.value.aiAnalysis.suggestions || ''
    displayedCareTips.value = result.value.aiAnalysis.homeCareTips || ''
  }
}

async function handleSubmit() {
  if (aiStore.loading) return
  tried.value = true
  submitError.value = ''

  if (!form.value.petId || !form.value.symptoms.trim()) {
    return
  }

  try {
    const data = await aiStore.submitConsultation({
      petId: form.value.petId,
      symptoms: form.value.symptoms,
      duration: form.value.duration || undefined,
      severity: form.value.severity,
      images: form.value.images
    })
    result.value = data
    message.success('问诊完成')
    tried.value = false

    // 串行伪流式：诊疗建议完成后，再启动居家护理
    if (data.aiAnalysis) {
      typewriterEffect(data.aiAnalysis.suggestions, displayedSuggestion, isTypingSuggestion)
        .then(() => {
          typewriterEffect(data.aiAnalysis.homeCareTips, displayedCareTips, isTypingCareTips)
        })
    }
  } catch (err) {
    const msg = err.message || '问诊失败'
    submitError.value = msg
    message.error(msg)
  }
}

function handleReset() {
  stopTypewriters()
  result.value = null
  displayedSuggestion.value = ''
  displayedCareTips.value = ''
  submitError.value = ''
  tried.value = false
  aiStore.resetConsultation()
}

function goToDetail(id) {
  if (id) router.push(`/ai/consultation/${id}`)
}

function goToHistory() {
  router.push('/ai/consultation-history')
}

onMounted(async () => {
  petsLoading.value = true
  try {
    await petStore.fetchMyPets()
  } finally {
    petsLoading.value = false
  }
})

onBeforeUnmount(() => {
  stopTypewriters()
})
</script>

<style scoped>
.ai-doctor-page {
  min-height: calc(100vh - 120px);
  padding: 20px 16px 40px;
  max-width: 680px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
}

.header-icon {
  width: 56px;
  height: 56px;
  border-radius: 16px;
  background: linear-gradient(135deg, #10B981, #059669);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.page-title {
  font-size: 24px;
  font-weight: 800;
  margin: 0;
  color: var(--color-text-primary);
}

.page-desc {
  font-size: 14px;
  color: var(--color-text-secondary);
  margin: 4px 0 0;
}

/* 空宠物引导 */
.empty-pets {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 48px 24px;
  text-align: center;
}

.empty-pets-text {
  font-size: 15px;
  color: var(--color-text-secondary);
  margin: 0;
}

.error-alert {
  margin-bottom: 16px;
}

.field-error {
  font-size: 12px;
  color: #EF4444;
  margin: 6px 0 0;
}

.form-card {
  padding: 24px;
}

.form-section {
  margin-bottom: 20px;
}

.form-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text-primary);
  margin-bottom: 8px;
}

.required {
  color: #EF4444;
}

.form-hint {
  font-size: 12px;
  color: var(--color-text-muted);
  margin: 6px 0 0;
}

.form-row {
  display: flex;
  gap: 16px;
}

.form-section.half {
  flex: 1;
}

.submit-btn {
  margin-top: 8px;
  height: 48px;
  font-size: 16px;
  font-weight: 600;
  background: linear-gradient(135deg, #10B981, #059669);
  border: none;
  box-shadow: 0 4px 16px rgba(16, 185, 129, 0.3);
}

.submit-btn:hover:not(:disabled) {
  box-shadow: 0 6px 20px rgba(16, 185, 129, 0.4);
}

/* 结果区域 */
.result-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.vet-alert {
  margin-bottom: 16px;
}

.result-card {
  margin-bottom: 16px;
  padding: 20px;
}

.result-card:hover {
  transform: none;
}

.card-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 700;
  color: var(--color-text-primary);
  margin: 0 0 16px;
}

.disease-item {
  margin-bottom: 16px;
}

.disease-item:last-child {
  margin-bottom: 0;
}

.disease-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.disease-name {
  font-size: 15px;
  font-weight: 600;
  color: var(--color-text-primary);
}

.disease-prob {
  font-size: 14px;
  font-weight: 700;
  color: var(--color-primary);
  font-variant-numeric: tabular-nums;
}

.disease-desc {
  font-size: 13px;
  color: var(--color-text-secondary);
  margin: 6px 0 0;
  line-height: 1.5;
}

.suggestion-text,
.care-text {
  font-size: 15px;
  line-height: 1.7;
  color: var(--color-text-primary);
  margin: 0;
  white-space: pre-wrap;
}

.typing-cursor {
  display: inline-block;
  color: var(--color-primary);
  font-weight: 300;
  animation: blink 0.8s step-end infinite;
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}

.history-entry-btn {
  margin-top: 8px;
  height: 44px;
  font-size: 14px;
  color: var(--color-primary);
  transform: none !important;
  transition: opacity 0.15s !important;
}

.history-entry-btn:active {
  opacity: 0.7;
  transform: none !important;
}

.result-actions {
  display: flex;
  gap: 12px;
  margin-top: 24px;
}

.result-actions .n-button {
  flex: 1;
  height: 44px;
  transform: none !important;
  transition: opacity 0.15s, box-shadow 0.2s !important;
}

.result-actions .n-button:active {
  opacity: 0.8;
  transform: none !important;
}

@media (prefers-reduced-motion: reduce) {
  .spring-enter,
  [class*="spring-stagger"] {
    animation: none !important;
    opacity: 1 !important;
    transform: none !important;
  }
  .typing-cursor {
    animation: none !important;
  }
  .empty-pets svg {
    animation: none !important;
  }
}

@media (max-width: 480px) {
  .form-row {
    flex-direction: column;
    gap: 0;
  }

  .page-header {
    gap: 12px;
  }

  .header-icon {
    width: 48px;
    height: 48px;
    border-radius: 14px;
  }

  .page-title {
    font-size: 20px;
  }
}
</style>