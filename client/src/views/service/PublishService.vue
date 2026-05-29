<template>
  <div class="publish-service-page">
    <!-- 提交成功动画 -->
    <transition name="fade">
      <div v-if="submitSuccess" class="success-overlay">
        <div class="success-content">
          <div class="success-icon">
            <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
              <circle cx="32" cy="32" r="30" stroke="#10B981" stroke-width="3" fill="rgba(16,185,129,0.08)"/>
              <path d="M20 33l8 8 16-18" stroke="#10B981" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="check-path"/>
            </svg>
          </div>
          <h3 class="success-title">发布成功</h3>
          <p class="success-desc">服务已上线，等待客户预约</p>
        </div>
      </div>
    </transition>

    <div class="page-header">
      <button class="back-btn" @click="goBack" aria-label="返回">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M15 18l-6-6 6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </button>
      <h1 class="page-title">发布服务</h1>
      <div style="width:36px"></div>
    </div>

    <!-- 步骤进度条 -->
    <div class="step-bar">
      <div v-for="(step, idx) in steps" :key="idx" class="step-item" :class="{ active: currentStep === idx, done: currentStep > idx }" @click="scrollToSection(idx)">
        <div class="step-dot">
          <svg v-if="currentStep > idx" width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M5 13l4 4L19 7" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
          <span v-else>{{ idx + 1 }}</span>
        </div>
        <span class="step-label">{{ step.label }}</span>
      </div>
      <div class="step-line"><div class="step-line-fill" :style="{ width: stepProgress }"></div></div>
    </div>

    <!-- 草稿提示 -->
    <transition name="fade">
      <div v-if="hasDraft" class="draft-banner">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" fill="#10B981"/></svg>
        <span>已恢复上次草稿</span>
        <button class="draft-clear" @click="clearDraft">清除</button>
      </div>
    </transition>

    <div class="form-container">
      <!-- 服务照片 -->
      <div class="form-section" ref="section0">
        <div class="section-header">
          <div class="section-icon-wrap" style="background: rgba(16,185,129,0.1); color: #10B981;">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" stroke-width="1.8"/><circle cx="8.5" cy="8.5" r="1.5" fill="currentColor"/><path d="M21 15l-5-5L5 21" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
          </div>
          <div>
            <h2 class="section-title">服务照片</h2>
            <p class="section-hint">上传清晰照片，提升转化率</p>
          </div>
        </div>
        <div class="form-field">
          <ImageUploader v-model="formData.images" :max="10" />
        </div>
      </div>

      <!-- 基本信息 -->
      <div class="form-section" ref="section1">
        <div class="section-header">
          <div class="section-icon-wrap" style="background: rgba(59,130,246,0.1); color: #3B82F6;">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M4.5 9.5a2.5 2.5 0 115 0 2.5 2.5 0 01-5 0zm10 0a2.5 2.5 0 115 0 2.5 2.5 0 01-5 0zm-7.5 7c0-2.5 2-4.5 5-4.5s5 2 5 4.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
          </div>
          <div>
            <h2 class="section-title">基本信息</h2>
            <p class="section-hint">填写服务的基本资料</p>
          </div>
        </div>
        <div class="form-field">
          <label class="field-label required" for="svc-name">服务名称</label>
          <n-input id="svc-name" v-model:value="formData.serviceName" placeholder="如：专业猫咪洗澡" maxlength="100" show-count size="large" />
        </div>
        <div class="form-field">
          <label class="field-label required" for="svc-category">服务分类</label>
          <n-select id="svc-category" v-model:value="formData.category" :options="categoryOptions" placeholder="选择分类" size="large" />
        </div>
        <div class="form-field">
          <label class="field-label required" for="svc-desc">服务描述</label>
          <n-input id="svc-desc" v-model:value="formData.description" type="textarea" placeholder="详细描述您的服务内容、优势、经验等" :rows="4" maxlength="2000" show-count size="large" />
        </div>
        <div class="form-field">
          <label class="field-label">适用宠物</label>
          <div class="species-grid" role="group" aria-label="选择适用宠物">
            <button v-for="opt in petOptions" :key="opt.value" class="species-btn" :class="{ active: formData.applicablePets.includes(opt.value) }" :aria-pressed="formData.applicablePets.includes(opt.value)" @click="togglePet(opt.value)" type="button">
              <span class="species-icon"><svg width="28" height="28" viewBox="0 0 24 24" fill="none"><path :d="opt.svg" fill="currentColor"/></svg></span>
              <span class="species-name">{{ opt.label }}</span>
            </button>
          </div>
        </div>
      </div>

      <!-- 价格设置 -->
      <div class="form-section" ref="section2">
        <div class="section-header">
          <div class="section-icon-wrap" style="background: rgba(245,158,11,0.1); color: #D97706;">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </div>
          <div>
            <h2 class="section-title">价格设置</h2>
            <p class="section-hint">设置合理的定价</p>
          </div>
        </div>
        <div class="form-field">
          <label class="field-label required">定价方式</label>
          <div class="pill-group" role="radiogroup" aria-label="选择定价方式">
            <button class="pill-btn price-pill" :class="{ active: formData.pricing.type === 'fixed' }" :aria-pressed="formData.pricing.type === 'fixed'" @click="formData.pricing.type = 'fixed'" type="button">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
              固定价格
            </button>
            <button class="pill-btn price-pill" :class="{ active: formData.pricing.type === 'range' }" :aria-pressed="formData.pricing.type === 'range'" @click="formData.pricing.type = 'range'" type="button">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M8 7l4-4 4 4M8 17l4 4 4-4M4 12h16" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
              价格区间
            </button>
          </div>
        </div>
        <div v-if="formData.pricing.type === 'fixed'" class="form-field">
          <label class="field-label required" for="price-fixed">价格（元）</label>
          <n-input-number id="price-fixed" v-model:value="formData.pricing.price" :min="0" placeholder="0" size="large" style="width:100%" />
        </div>
        <div v-if="formData.pricing.type === 'range'" class="form-field">
          <label class="field-label required">价格区间（元）</label>
          <div class="form-row">
            <n-input-number v-model:value="formData.pricing.priceMin" :min="0" placeholder="最低" size="large" style="flex:1" />
            <span class="range-sep">—</span>
            <n-input-number v-model:value="formData.pricing.priceMax" :min="0" placeholder="最高" size="large" style="flex:1" />
          </div>
        </div>
        <div class="form-field">
          <label class="field-label" for="price-unit">计价单位</label>
          <n-input id="price-unit" v-model:value="formData.pricing.unit" placeholder="次" size="large" style="width:120px" />
        </div>
      </div>

      <!-- 营业时间 -->
      <div class="form-section" ref="section3">
        <div class="section-header">
          <div class="section-icon-wrap" style="background: rgba(139,92,246,0.1); color: #8B5CF6;">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="1.8"/><path d="M12 6v6l4 2" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </div>
          <div>
            <h2 class="section-title">营业时间</h2>
            <p class="section-hint">设置每周的服务时间</p>
          </div>
        </div>
        <div class="hours-list">
          <div v-for="(day, key) in dayLabels" :key="key" class="hours-row" :class="{ 'is-closed': formData.businessHours[key].closed }">
            <span class="day-name">{{ day }}</span>
            <n-switch v-model:value="formData.businessHours[key].closed" size="small" />
            <div class="hours-right">
              <span v-if="formData.businessHours[key].closed" class="closed-badge">休息</span>
              <template v-else>
                <n-time-picker v-model:value="formData.businessHours[key].openTs" format="HH:mm" :actions="['confirm']" style="width:100px" />
                <span class="time-sep">—</span>
                <n-time-picker v-model:value="formData.businessHours[key].closeTs" format="HH:mm" :actions="['confirm']" style="width:100px" />
              </template>
            </div>
          </div>
        </div>
      </div>

      <!-- 地址信息 -->
      <div class="form-section" ref="section4">
        <div class="section-header">
          <div class="section-icon-wrap" style="background: rgba(236,72,153,0.1); color: #EC4899;">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" stroke="currentColor" stroke-width="1.8"/><circle cx="12" cy="10" r="3" stroke="currentColor" stroke-width="1.8"/></svg>
          </div>
          <div>
            <h2 class="section-title">地址信息</h2>
            <p class="section-hint">方便客户找到你</p>
          </div>
        </div>
        <div class="form-row">
          <div class="form-field flex-1">
            <label class="field-label" for="loc-city">所在城市</label>
            <n-input id="loc-city" v-model:value="formData.location.city" placeholder="如：北京" size="large" />
          </div>
        </div>
        <div class="form-field">
          <label class="field-label" for="loc-address">详细地址</label>
          <n-input id="loc-address" v-model:value="formData.location.address" placeholder="街道门牌号（选填）" size="large" />
        </div>
        <div class="toggle-row">
          <div class="toggle-item" :class="{ checked: formData.location.isHomeService }" @click="formData.location.isHomeService = !formData.location.isHomeService">
            <div class="toggle-content">
              <span class="toggle-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" stroke="currentColor" stroke-width="1.8"/><path d="M9 22V12h6v10" stroke="currentColor" stroke-width="1.8"/></svg>
              </span>
              <span class="toggle-label">支持上门服务</span>
            </div>
            <n-switch v-model:value="formData.location.isHomeService" @click.stop />
          </div>
        </div>
      </div>

      <!-- 提交操作 -->
      <div class="form-actions">
        <button class="cancel-btn" @click="goBack">取消</button>
        <button class="submit-btn" :class="{ loading: submitting }" :disabled="submitting" @click="handleSubmit">
          <span v-if="submitting" class="spinner"></span>
          <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 12l5 5L20 7" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
          {{ submitting ? '发布中...' : '发布服务' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useMessage } from 'naive-ui'
import { createService } from '../../api/service'
import ImageUploader from '../../components/common/ImageUploader.vue'

const router = useRouter()
const message = useMessage()

const submitting = ref(false)
const submitSuccess = ref(false)
const currentStep = ref(0)
const hasDraft = ref(false)
let observer = null
let saveTimer = null

const DRAFT_KEY = 'pet_service_draft'

const steps = [
  { label: '照片', key: 'photo' },
  { label: '信息', key: 'info' },
  { label: '价格', key: 'pricing' },
  { label: '时间', key: 'hours' },
  { label: '地址', key: 'location' }
]

const stepProgress = computed(() => {
  const map = { 0: '0%', 1: '25%', 2: '50%', 3: '75%', 4: '100%' }
  return map[currentStep.value] || '0%'
})

const section0 = ref(null)
const section1 = ref(null)
const section2 = ref(null)
const section3 = ref(null)
const section4 = ref(null)

const categoryOptions = [
  { label: '美容洗护', value: 'grooming' },
  { label: '寄养', value: 'boarding' },
  { label: '遛狗', value: 'walking' },
  { label: '训练', value: 'training' },
  { label: '摄影', value: 'photography' },
  { label: '殡葬', value: 'funeral' }
]

const dayLabels = {
  monday: '周一', tuesday: '周二', wednesday: '周三',
  thursday: '周四', friday: '周五', saturday: '周六', sunday: '周日'
}

const petOptions = [
  { label: '猫', value: 'cat', svg: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z' },
  { label: '狗', value: 'dog', svg: 'M4.5 9.5a2.5 2.5 0 115 0 2.5 2.5 0 01-5 0zm10 0a2.5 2.5 0 115 0 2.5 2.5 0 01-5 0zm-7.5 7c0-2.5 2-4.5 5-4.5s5 2 5 4.5' },
  { label: '兔', value: 'rabbit', svg: 'M12 2C8 2 5 5 5 9c0 2 1 4 2 5v1h10v-1c1-1 2-3 2-5 0-4-3-7-7-7zM9 18h6v2H9v-2z' },
  { label: '鸟', value: 'bird', svg: 'M18 2c-2 0-4 2-4 4l-8 8-2-2-2 2 4 4 2-2 8-8c2 0 4-2 4-4V2h-4z' },
  { label: '仓鼠', value: 'hamster', svg: 'M9 8a2 2 0 114 0 2 2 0 01-4 0zm6 0a2 2 0 114 0 2 2 0 01-4 0zM12 18c-4 0-7-2-7-4s3-4 7-4 7 2 7 4-3 4-7 4z' },
  { label: '其他', value: 'other', svg: 'M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z' }
]

function makeTime(h, m) {
  const d = new Date(); d.setHours(h, m, 0, 0); return d.getTime()
}
function makeDay() {
  return { closed: false, openTs: makeTime(9, 0), closeTs: makeTime(18, 0) }
}

const formData = reactive({
  serviceName: '', category: '', description: '',
  applicablePets: ['cat', 'dog'],
  pricing: { type: 'fixed', price: null, priceMin: null, priceMax: null, unit: '次' },
  businessHours: {
    monday: makeDay(), tuesday: makeDay(), wednesday: makeDay(),
    thursday: makeDay(), friday: makeDay(), saturday: makeDay(), sunday: makeDay()
  },
  images: [],
  location: { city: '', address: '', isHomeService: false }
})

function togglePet(value) {
  const idx = formData.applicablePets.indexOf(value)
  if (idx >= 0) formData.applicablePets.splice(idx, 1)
  else formData.applicablePets.push(value)
}

function scrollToSection(idx) {
  const refs = [section0, section1, section2, section3, section4]
  refs[idx]?.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

function goBack() { router.back() }

// 草稿保存（debounce 2s）
function saveDraft() {
  clearTimeout(saveTimer)
  saveTimer = setTimeout(() => {
    try {
      const draft = { form: JSON.parse(JSON.stringify(formData)), savedAt: Date.now() }
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draft))
    } catch {}
  }, 2000)
}

function restoreDraft() {
  try {
    const raw = localStorage.getItem(DRAFT_KEY)
    if (!raw) return false
    const draft = JSON.parse(raw)
    if (!draft.form) return false
    if (draft.savedAt && Date.now() - draft.savedAt > 7 * 24 * 60 * 60 * 1000) {
      localStorage.removeItem(DRAFT_KEY); return false
    }
    formData.serviceName = draft.form.serviceName || ''
    formData.category = draft.form.category || ''
    formData.description = draft.form.description || ''
    formData.applicablePets = draft.form.applicablePets || ['cat', 'dog']
    Object.assign(formData.pricing, draft.form.pricing || {})
    Object.assign(formData.location, draft.form.location || {})
    if (draft.form.businessHours) {
      for (const [k, v] of Object.entries(draft.form.businessHours)) {
        if (formData.businessHours[k]) Object.assign(formData.businessHours[k], v)
      }
    }
    if (draft.form.images?.length) formData.images = draft.form.images
    return true
  } catch { return false }
}

function clearDraft() {
  localStorage.removeItem(DRAFT_KEY)
  hasDraft.value = false
}

watch(formData, saveDraft, { deep: true })

function formatTime(ts) {
  if (!ts) return '09:00'
  const d = new Date(ts)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

async function handleSubmit() {
  if (!formData.serviceName.trim()) { message.warning('请输入服务名称'); scrollToSection(1); return }
  if (!formData.category) { message.warning('请选择服务分类'); scrollToSection(1); return }
  if (!formData.description.trim()) { message.warning('请输入服务描述'); scrollToSection(1); return }
  if (!formData.location.city.trim()) { message.warning('请输入所在城市'); scrollToSection(4); return }
  if (formData.pricing.type === 'fixed' && formData.pricing.price == null) { message.warning('请输入价格'); scrollToSection(2); return }
  if (formData.pricing.type === 'range') {
    if (formData.pricing.priceMin == null) { message.warning('请输入最低价格'); scrollToSection(2); return }
    if (formData.pricing.priceMax != null && formData.pricing.priceMax < formData.pricing.priceMin) { message.warning('最高价格不能低于最低价格'); scrollToSection(2); return }
  }

  submitting.value = true
  try {
    const data = new FormData()
    data.append('serviceName', formData.serviceName)
    data.append('category', formData.category)
    data.append('description', formData.description)
    data.append('applicablePets', JSON.stringify(formData.applicablePets))
    data.append('pricing', JSON.stringify({
      type: formData.pricing.type, price: formData.pricing.price,
      priceMin: formData.pricing.priceMin, priceMax: formData.pricing.priceMax,
      unit: formData.pricing.unit || '次'
    }))
    const bh = {}
    for (const [k, v] of Object.entries(formData.businessHours)) {
      bh[k] = { open: formatTime(v.openTs), close: formatTime(v.closeTs), closed: v.closed }
    }
    data.append('businessHours', JSON.stringify(bh))
    data.append('location', JSON.stringify(formData.location))
    formData.images.forEach(url => data.append('existingImages', url))

    const res = await createService(data)
    clearDraft()
    submitSuccess.value = true
    setTimeout(() => {
      const newId = res.data?.service?._id
      router.replace(newId ? `/services/${newId}` : '/merchant')
    }, 1800)
  } catch (e) { message.error(e.message || '发布失败') }
  finally { submitting.value = false }
}

function setupObserver() {
  const sections = [section0.value, section1.value, section2.value, section3.value, section4.value].filter(Boolean)
  if (!sections.length) return
  observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        const idx = sections.indexOf(entry.target)
        if (idx !== -1) currentStep.value = idx
      }
    }
  }, { rootMargin: '-40% 0px -50% 0px' })
  sections.forEach(el => observer.observe(el))
}

onMounted(() => {
  hasDraft.value = restoreDraft()
  setTimeout(setupObserver, 100)
})

onUnmounted(() => {
  observer?.disconnect()
  clearTimeout(saveTimer)
})
</script>

<style scoped>
.publish-service-page {
  padding: 0 0 100px;
  max-width: 680px;
  margin: 0 auto;
  min-height: 100vh;
  background: var(--color-bg, #f8faf9);
}

/* Success Overlay */
.success-overlay {
  position: fixed; inset: 0; z-index: 9999;
  background: rgba(255,255,255,0.95); backdrop-filter: blur(20px);
  display: flex; align-items: center; justify-content: center;
}
.success-content { text-align: center; }
.success-icon { margin-bottom: 20px; }
.check-path {
  stroke-dasharray: 50; stroke-dashoffset: 50;
  animation: draw-check 0.6s 0.3s ease forwards;
}
@keyframes draw-check { to { stroke-dashoffset: 0; } }
.success-title { font-size: 22px; font-weight: 700; color: var(--color-text-primary, #1a1a2e); margin: 0 0 8px; }
.success-desc { font-size: 14px; color: var(--color-text-muted, #888); margin: 0; }
.fade-enter-active { transition: opacity 0.3s; }
.fade-leave-active { transition: opacity 0.3s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

/* Header */
.page-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 12px 16px;
  background: rgba(255,255,255,0.92); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);
  position: sticky; top: 0; z-index: 20;
  border-bottom: 1px solid rgba(0,0,0,0.04);
}
.back-btn {
  width: 36px; height: 36px; border: none; background: none; color: #555;
  cursor: pointer; display: flex; align-items: center; justify-content: center;
  border-radius: 50%; transition: all 0.25s;
}
.back-btn:hover { background: var(--color-bg-light, #f0f0f0); color: var(--color-primary, #10B981); }
.page-title { font-size: 16px; font-weight: 700; color: var(--color-text-primary, #1a1a2e); margin: 0; }

/* Step Bar */
.step-bar {
  display: flex; align-items: center; justify-content: space-between;
  margin: 12px 16px 0; padding: 14px 20px;
  background: var(--color-bg-white, #fff); border-radius: 14px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.04); position: relative;
}
.step-item {
  display: flex; flex-direction: column; align-items: center; gap: 6px;
  z-index: 1; cursor: pointer; transition: all 0.3s;
}
.step-dot {
  width: 28px; height: 28px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 12px; font-weight: 700;
  background: var(--color-bg-light, #f0f0f0); color: var(--color-text-muted, #888);
  border: 2px solid var(--color-border, #e5e5e5); transition: all 0.3s;
}
.step-item.active .step-dot {
  background: var(--color-primary, #10B981); color: #fff; border-color: var(--color-primary, #10B981);
  box-shadow: 0 0 0 4px rgba(16,185,129,0.15);
}
.step-item.done .step-dot {
  background: var(--color-primary, #10B981); color: #fff; border-color: var(--color-primary, #10B981);
}
.step-label { font-size: 11px; font-weight: 500; color: var(--color-text-muted, #888); }
.step-item.active .step-label { color: var(--color-primary, #10B981); font-weight: 600; }
.step-item.done .step-label { color: var(--color-primary, #10B981); }
.step-line {
  position: absolute; left: 50px; right: 50px; top: 50%;
  height: 2px; background: var(--color-border, #e5e5e5); transform: translateY(-8px); z-index: 0;
}
.step-line-fill {
  height: 100%; background: var(--color-primary, #10B981); transition: width 0.4s ease; border-radius: 1px;
}

/* Draft Banner */
.draft-banner {
  display: flex; align-items: center; gap: 8px;
  margin: 10px 16px 0; padding: 10px 16px;
  background: rgba(16,185,129,0.06); border: 1px solid rgba(16,185,129,0.15);
  border-radius: 12px; font-size: 13px; color: var(--color-primary, #10B981); font-weight: 500;
}
.draft-clear {
  margin-left: auto; background: none; border: none; color: var(--color-text-muted, #888);
  font-size: 12px; cursor: pointer; font-weight: 500; text-decoration: underline;
}

/* Form */
.form-container { margin: 12px 16px; }
.form-section {
  background: var(--color-bg-white, #fff); border-radius: 16px;
  padding: 20px; margin-bottom: 12px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.04);
  border-left: 3px solid transparent; transition: border-color 0.3s;
}
.form-section:nth-child(1) { border-left-color: #10B981; }
.form-section:nth-child(2) { border-left-color: #3B82F6; }
.form-section:nth-child(3) { border-left-color: #D97706; }
.form-section:nth-child(4) { border-left-color: #8B5CF6; }
.form-section:nth-child(5) { border-left-color: #EC4899; }

.section-header { display: flex; align-items: center; gap: 12px; margin-bottom: 18px; }
.section-icon-wrap {
  width: 36px; height: 36px; border-radius: 10px;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.section-title { font-size: 15px; font-weight: 700; color: var(--color-text-primary, #1a1a2e); margin: 0; }
.section-hint { font-size: 12px; color: var(--color-text-muted, #888); margin: 2px 0 0; }

.form-field { margin-bottom: 16px; }
.form-field:last-child { margin-bottom: 0; }
.field-label { display: block; font-size: 13px; font-weight: 600; color: var(--color-text-secondary, #555); margin-bottom: 8px; }
.field-label.required::before { content: '*'; color: #EF4444; margin-right: 4px; }
.form-row { display: flex; gap: 16px; align-items: flex-end; }
.flex-1 { flex: 1; }
.range-sep { line-height: 34px; color: var(--color-text-muted, #888); font-weight: 500; flex-shrink: 0; }

/* Species Grid */
.species-grid {
  display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px;
}
.species-btn {
  border: 2px solid var(--color-border-light, #f0f0f0);
  border-radius: var(--radius-lg, 12px); background: var(--color-bg-white, #fff);
  padding: 12px 8px; display: flex; flex-direction: column; align-items: center; gap: 4px;
  cursor: pointer; transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1); min-height: 60px;
}
.species-btn:hover {
  border-color: var(--color-primary, #10B981); background: var(--color-primary-light, rgba(16,185,129,0.06));
  transform: translateY(-2px);
}
.species-btn:focus-visible { outline: 2px solid var(--color-primary, #10B981); outline-offset: 2px; }
.species-btn.active {
  border-color: var(--color-primary, #10B981); background: var(--color-primary-light, rgba(16,185,129,0.06));
  box-shadow: 0 0 0 1px var(--color-primary, #10B981);
}
.species-icon { width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; color: var(--color-text-muted, #888); }
.species-btn.active .species-icon { color: var(--color-primary, #10B981); animation: icon-bounce 0.5s cubic-bezier(0.34, 1.56, 0.64, 1); }
@keyframes icon-bounce { 0% { transform: scale(1); } 50% { transform: scale(1.3); } 100% { transform: scale(1); } }
.species-name { font-size: 12px; font-weight: 600; color: var(--color-text-secondary, #555); }
.species-btn.active .species-name { color: var(--color-primary, #10B981); }

/* Pill Group */
.pill-group { display: flex; gap: 10px; }
.pill-btn {
  display: flex; align-items: center; gap: 6px;
  border: 2px solid var(--color-border-light, #f0f0f0);
  border-radius: var(--radius-full, 999px); background: var(--color-bg-white, #fff);
  padding: 10px 24px; font-size: 14px; font-weight: 600;
  cursor: pointer; transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
  color: var(--color-text-secondary, #555); min-height: 44px;
}
.pill-btn:hover { transform: translateY(-2px); }
.pill-btn:focus-visible { outline: 2px solid var(--color-primary, #10B981); outline-offset: 2px; }
.price-pill:hover, .price-pill.active {
  border-color: var(--color-primary, #10B981);
  background: var(--color-primary-light, rgba(16,185,129,0.06));
  color: var(--color-primary, #10B981);
}

/* Toggle Row */
.toggle-row { display: flex; flex-direction: column; gap: 10px; margin-top: 8px; }
.toggle-item {
  display: flex; align-items: center; justify-content: space-between;
  padding: 12px 14px; background: var(--color-bg, #f8faf9); border-radius: 12px;
  cursor: pointer; transition: all 0.25s; border: 1px solid transparent;
}
.toggle-item:hover { border-color: rgba(16,185,129,0.2); }
.toggle-item.checked { background: rgba(16,185,129,0.06); border-color: rgba(16,185,129,0.15); }
.toggle-content { display: flex; align-items: center; gap: 10px; }
.toggle-icon { color: var(--color-text-muted, #888); display: flex; }
.toggle-item.checked .toggle-icon { color: var(--color-primary, #10B981); }
.toggle-label { font-size: 14px; color: var(--color-text-primary, #1a1a2e); font-weight: 500; }

/* Hours List */
.hours-list { display: flex; flex-direction: column; gap: 8px; }
.hours-row {
  display: flex; align-items: center; gap: 12px;
  padding: 10px 14px; background: var(--color-bg, #f8faf9); border-radius: 12px;
  transition: all 0.25s; border: 1px solid transparent;
}
.hours-row:hover { border-color: rgba(139,92,246,0.15); }
.hours-row.is-closed { opacity: 0.6; }
.day-name { font-size: 14px; font-weight: 600; color: var(--color-text-primary, #1a1a2e); width: 36px; flex-shrink: 0; }
.hours-right { display: flex; align-items: center; gap: 8px; margin-left: auto; }
.closed-badge {
  font-size: 12px; font-weight: 600; color: var(--color-text-muted, #888);
  background: rgba(0,0,0,0.04); padding: 4px 12px; border-radius: 20px;
}
.time-sep { color: var(--color-text-muted, #888); font-weight: 500; }

/* Actions */
.form-actions {
  display: flex; gap: 12px; justify-content: flex-end;
  padding: 20px 24px; margin-top: 4px;
  background: var(--color-bg-white, #fff); border-radius: 16px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.04);
}
.cancel-btn {
  padding: 0 28px; height: 44px; border-radius: 12px; border: 1.5px solid var(--color-border, #e5e5e5);
  background: var(--color-bg-white, #fff); font-size: 14px; color: var(--color-text-muted, #888);
  cursor: pointer; font-weight: 500; transition: all 0.25s;
}
.cancel-btn:hover { border-color: var(--color-primary, #10B981); color: var(--color-primary, #10B981); }
.submit-btn {
  display: flex; align-items: center; gap: 8px;
  background: linear-gradient(135deg, #10B981, #059669);
  border: none; padding: 0 36px; height: 44px; border-radius: 12px;
  font-size: 14px; color: #fff; cursor: pointer; font-weight: 600;
  box-shadow: 0 4px 16px rgba(16,185,129,0.3); transition: all 0.3s;
}
.submit-btn:hover { box-shadow: 0 6px 20px rgba(16,185,129,0.4); transform: translateY(-1px); }
.submit-btn:disabled { opacity: 0.7; cursor: not-allowed; transform: none; }
.spinner {
  width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.3);
  border-top-color: #fff; border-radius: 50%; animation: spin 0.6s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .back-btn, .species-btn, .pill-btn, .submit-btn, .step-item, .toggle-item {
    animation-duration: 0.01ms !important; transition-duration: 0.01ms !important;
  }
  .check-path { animation: none; stroke-dashoffset: 0; }
  .spinner { animation: none; }
}

/* Mobile responsive */
@media (max-width: 500px) {
  .species-grid { grid-template-columns: repeat(3, 1fr); }
  .form-row { flex-direction: column; gap: 0; }
  .pill-btn { padding: 8px 16px; font-size: 13px; }
  .step-label { font-size: 10px; }
  .hours-row { flex-wrap: wrap; }
  .hours-right { margin-left: 0; width: 100%; }
  .form-actions { flex-direction: column; }
  .cancel-btn, .submit-btn { width: 100%; justify-content: center; }
}
</style>