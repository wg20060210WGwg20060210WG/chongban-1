<template>
  <div class="consultation-detail-page">
    <div class="page-header spring-enter">
      <n-button quaternary @click="$router.back()" class="back-btn" aria-label="返回">
        <template #icon>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M19 12H5m0 0l7 7m-7-7l7-7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </template>
      </n-button>
      <h1 class="page-title">问诊详情</h1>
    </div>

    <!-- 错误提示 -->
    <n-alert v-if="loadError" type="error" :show-icon="true" closable class="error-alert spring-enter" @close="loadError = ''">
      <template #header><strong>加载失败</strong></template>
      {{ loadError }}
    </n-alert>

    <div v-if="aiStore.loading && !consultation" class="loading-wrap">
      <div class="skeleton-block" v-for="i in 3" :key="i">
        <div class="skeleton-line w40"></div>
        <div class="skeleton-line w80"></div>
        <div class="skeleton-line w60"></div>
      </div>
    </div>

    <template v-else-if="consultation">
      <!-- 问诊信息 -->
      <div class="info-card card spring-enter">
        <div class="info-row">
          <span class="info-label">宠物</span>
          <span class="info-value">{{ getPetName(consultation.petId) }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">问诊时间</span>
          <span class="info-value">{{ formatTime(consultation.createdAt) }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">严重程度</span>
          <n-tag :type="getSeverityType(consultation.severity)" size="small">
            {{ getSeverityLabel(consultation.severity) }}
          </n-tag>
        </div>
        <div v-if="consultation.duration" class="info-row">
          <span class="info-label">持续时间</span>
          <span class="info-value">{{ consultation.duration }}</span>
        </div>
      </div>

      <!-- 症状 -->
      <div class="detail-card card spring-enter spring-stagger-1">
        <h3 class="card-title">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke="currentColor" stroke-width="1.5"/>
            <polyline points="14 2 14 8 20 8" stroke="currentColor" stroke-width="1.5"/>
          </svg>
          症状描述
        </h3>
        <p class="symptoms-text">{{ consultation.symptoms }}</p>
      </div>

      <!-- 就医提示 -->
      <n-alert
        v-if="consultation.aiAnalysis?.needsVet"
        type="warning"
        :show-icon="true"
        class="vet-alert spring-enter spring-stagger-2"
      >
        <template #header><strong>建议尽快就医</strong></template>
        AI 分析认为您的宠物可能需要专业兽医的诊治。
      </n-alert>

      <n-alert
        v-else
        type="success"
        :show-icon="true"
        class="vet-alert spring-enter spring-stagger-2"
      >
        <template #header><strong>暂无紧急就医需求</strong></template>
        以下建议仅供参考，如症状持续或加重，请及时就医。
      </n-alert>

      <!-- 紧急程度 -->
      <div class="urgency-bar spring-enter spring-stagger-2">
        <span class="urgency-label">紧急程度</span>
        <n-tag :type="getUrgencyType(consultation.aiAnalysis?.urgency)" size="medium" round>
          {{ getUrgencyLabel(consultation.aiAnalysis?.urgency) }}
        </n-tag>
      </div>

      <!-- 可能疾病 -->
      <div v-if="consultation.aiAnalysis?.possibleDiseases?.length" class="detail-card card spring-enter spring-stagger-3">
        <h3 class="card-title">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M9 12h6m-3-3v6m-7 4h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
          可能的疾病
        </h3>
        <div v-for="(disease, idx) in consultation.aiAnalysis.possibleDiseases" :key="idx" class="disease-item">
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

      <!-- 建议 -->
      <div class="detail-card card spring-enter spring-stagger-4">
        <h3 class="card-title">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
          诊疗建议
        </h3>
        <p class="suggestion-text">{{ consultation.aiAnalysis?.suggestions }}</p>
      </div>

      <!-- 居家护理 -->
      <div v-if="consultation.aiAnalysis?.homeCareTips" class="detail-card card spring-enter spring-stagger-5">
        <h3 class="card-title">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
          居家护理建议
        </h3>
        <p class="care-text">{{ consultation.aiAnalysis.homeCareTips }}</p>
      </div>

      <!-- 反馈区域 -->
      <div class="feedback-card card spring-enter spring-stagger-6">
        <h3 class="card-title">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M14 9l-2 2m0 0l-2 2m2-2l2 2m-2-2l-2-2m-4 4a9 9 0 1118 0 9 9 0 01-18 0z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
          问诊反馈
        </h3>

        <div v-if="consultation.feedback?.isHelpful !== undefined" class="feedback-done">
          <n-tag type="success" size="medium">
            已提交反馈
          </n-tag>
          <p v-if="consultation.feedback.comment" class="feedback-comment">
            {{ consultation.feedback.comment }}
          </p>
        </div>

        <template v-else>
          <div class="feedback-row">
            <span class="feedback-label">这次问诊对您有帮助吗？</span>
            <n-space>
              <n-button
                :type="feedbackForm.isHelpful === true ? 'primary' : 'default'"
                size="small"
                :aria-pressed="feedbackForm.isHelpful === true"
                @click="feedbackForm.isHelpful = true"
              >
                有帮助
              </n-button>
              <n-button
                :type="feedbackForm.isHelpful === false ? 'error' : 'default'"
                size="small"
                :aria-pressed="feedbackForm.isHelpful === false"
                @click="feedbackForm.isHelpful = false"
              >
                没有帮助
              </n-button>
            </n-space>
          </div>

          <div class="feedback-section">
            <label class="form-label">补充评论（可选）</label>
            <n-input
              v-model:value="feedbackForm.comment"
              type="textarea"
              placeholder="您的反馈有助于我们改进 AI 问诊质量"
              :rows="3"
            />
          </div>

          <div class="feedback-section">
            <label class="form-label">实际诊断结果（可选）</label>
            <n-input
              v-model:value="feedbackForm.actualDiagnosis"
              placeholder="如果您已经带宠物就医，可以填写实际诊断"
            />
          </div>

          <n-button
            type="primary"
            block
            :loading="feedbackLoading"
            :disabled="feedbackForm.isHelpful === null"
            @click="handleSubmitFeedback"
            style="height: 44px;"
          >
            提交反馈
          </n-button>
        </template>
      </div>
    </template>

    <div v-else class="empty-state spring-enter">
      <div class="empty-icon">
        <svg width="64" height="64" viewBox="0 0 120 120" fill="none" aria-hidden="true">
          <circle cx="60" cy="60" r="50" fill="#f0fdf4" stroke="#bbf7d0" stroke-width="1.5"/>
          <ellipse cx="60" cy="72" rx="28" ry="20" fill="#fff" stroke="#d1d5db" stroke-width="1"/>
          <circle cx="48" cy="65" r="3" fill="#9ca3af"/>
          <circle cx="72" cy="65" r="3" fill="#9ca3af"/>
          <path d="M54 76c2 3 10 3 12 0" stroke="#9ca3af" stroke-width="1.5" stroke-linecap="round"/>
        </svg>
      </div>
      <h3 class="empty-title">未找到问诊记录</h3>
      <p class="empty-desc">该记录可能已被删除</p>
      <n-button type="primary" @click="$router.push('/ai')">去问诊</n-button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useMessage } from 'naive-ui'
import { useAiStore } from '../../stores/ai'
import { usePetStore } from '../../stores/pet'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/zh-cn'

dayjs.extend(relativeTime)
dayjs.locale('zh-cn')

const route = useRoute()
const router = useRouter()
const message = useMessage()
const aiStore = useAiStore()
const petStore = usePetStore()

const feedbackLoading = ref(false)
const loadError = ref('')
const feedbackForm = ref({
  isHelpful: null,
  comment: '',
  actualDiagnosis: ''
})

const consultation = computed(() => aiStore.currentConsultation)

function getPetName(petId) {
  if (!petId) return '未知宠物'
  const id = typeof petId === 'object' ? petId._id : petId
  const pet = (petStore.petList || []).find(p => p._id === id)
  if (pet) return pet.name
  if (typeof petId === 'object' && petId.name) return petId.name
  return '未知宠物'
}

function getSeverityType(severity) {
  const map = { mild: 'success', moderate: 'warning', severe: 'error' }
  return map[severity] || 'default'
}

function getSeverityLabel(severity) {
  const map = { mild: '轻微', moderate: '中等', severe: '严重' }
  return map[severity] || ''
}

function getUrgencyType(urgency) {
  const map = { low: 'success', medium: 'warning', high: 'error' }
  return map[urgency] || 'default'
}

function getUrgencyLabel(urgency) {
  const map = { low: '低风险', medium: '中等风险', high: '高风险' }
  return map[urgency] || '未知'
}

function getProgressColor(pct) {
  if (pct >= 70) return '#EF4444'
  if (pct >= 40) return '#F59E0B'
  return '#10B981'
}

function formatTime(t) {
  return dayjs(t).format('YYYY-MM-DD HH:mm')
}

async function handleSubmitFeedback() {
  if (feedbackForm.value.isHelpful === null) return
  feedbackLoading.value = true
  try {
    const data = {}
    if (feedbackForm.value.isHelpful !== null) data.isHelpful = feedbackForm.value.isHelpful
    if (feedbackForm.value.comment) data.comment = feedbackForm.value.comment
    if (feedbackForm.value.actualDiagnosis) data.actualDiagnosis = feedbackForm.value.actualDiagnosis
    await aiStore.sendFeedback(route.params.id, data)
    message.success('感谢您的反馈')
  } catch (err) {
    message.error(err.message || '提交失败')
  } finally {
    feedbackLoading.value = false
  }
}

onMounted(async () => {
  if (!petStore.petList?.length) {
    petStore.fetchMyPets()
  }
  try {
    await aiStore.fetchConsultationDetail(route.params.id)
  } catch (err) {
    loadError.value = err.message || '获取详情失败'
  }
})
</script>

<style scoped>
.consultation-detail-page {
  min-height: calc(100vh - 120px);
  padding: 20px 16px 40px;
  max-width: 680px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 20px;
}

.page-title {
  font-size: 20px;
  font-weight: 700;
  margin: 0;
  color: var(--color-text-primary);
}

.error-alert {
  margin-bottom: 16px;
}

/* Shimmer 加载骨架 */
.loading-wrap {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 20px 0;
}

.skeleton-block {
  background: #fff;
  border-radius: var(--radius-md);
  padding: 20px;
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

.skeleton-line.w40 { width: 40%; }
.skeleton-line.w80 { width: 80%; }
.skeleton-line.w60 { width: 60%; }

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

.info-card {
  padding: 16px;
  margin-bottom: 16px;
}

.info-card:hover {
  transform: none;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid var(--color-border-light);
}

.info-row:last-child {
  border-bottom: none;
}

.info-label {
  font-size: 14px;
  color: var(--color-text-secondary);
}

.info-value {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text-primary);
}

.vet-alert {
  margin-bottom: 16px;
}

.urgency-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: var(--color-bg-white);
  border-radius: var(--radius-md);
  margin-bottom: 16px;
  box-shadow: var(--shadow-card);
}

.urgency-label {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text-primary);
}

.detail-card {
  padding: 20px;
  margin-bottom: 16px;
}

.detail-card:hover {
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

.symptoms-text {
  font-size: 15px;
  line-height: 1.7;
  color: var(--color-text-primary);
  margin: 0;
  white-space: pre-wrap;
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

.feedback-card {
  padding: 20px;
  margin-top: 8px;
}

.feedback-card:hover {
  transform: none;
}

.feedback-done {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.feedback-comment {
  font-size: 14px;
  color: var(--color-text-secondary);
  margin: 0;
}

.feedback-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  flex-wrap: wrap;
  gap: 8px;
}

.feedback-label {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text-primary);
}

.feedback-section {
  margin-bottom: 16px;
}

.form-label {
  display: block;
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text-primary);
  margin-bottom: 6px;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
  padding: 60px 0;
}

.empty-icon {
  animation: float 3.5s ease-in-out infinite;
  filter: drop-shadow(0 8px 20px rgba(16, 185, 129, 0.1));
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

.empty-title {
  font-size: 18px;
  font-weight: 700;
  color: var(--color-text-primary);
  margin: 0;
}

.empty-desc {
  font-size: 13px;
  color: var(--color-text-muted);
  margin: 0;
}

@media (max-width: 480px) {
  .feedback-row {
    flex-direction: column;
    align-items: flex-start;
  }
}

@media (prefers-reduced-motion: reduce) {
  .spring-enter,
  [class*="spring-stagger"] {
    animation: none !important;
    opacity: 1 !important;
    transform: none !important;
  }
  .empty-icon {
    animation: none !important;
  }
  .skeleton-block .skeleton-line {
    animation: none !important;
  }
}
</style>