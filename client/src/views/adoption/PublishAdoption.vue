<template>
  <div class="publish-adoption-page">
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
          <p class="success-desc">领养信息已发布，等待有缘人申请</p>
        </div>
      </div>
    </transition>

    <div class="page-header">
      <button class="back-btn" @click="goBack" aria-label="返回">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M15 18l-6-6 6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </button>
      <h1 class="page-title">发布领养</h1>
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
      <!-- 宠物照片 -->
      <div class="form-section" ref="section0">
        <div class="section-header">
          <div class="section-icon-wrap" style="background: rgba(16,185,129,0.1); color: #10B981;">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" stroke-width="1.8"/><circle cx="8.5" cy="8.5" r="1.5" fill="currentColor"/><path d="M21 15l-5-5L5 21" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
          </div>
          <div>
            <h2 class="section-title">宠物照片</h2>
            <p class="section-hint">上传清晰照片，增加曝光率</p>
          </div>
        </div>
        <div class="form-field">
          <ImageUploader v-model="photoUrls" :max="6" />
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
            <p class="section-hint">填写宠物的基本资料</p>
          </div>
        </div>

        <div class="form-field">
          <label class="field-label required" for="pet-name">宠物名字</label>
          <n-input id="pet-name" v-model:value="form.petInfo.name" placeholder="给它起个名字" size="large" maxlength="20" />
        </div>

        <div class="form-field">
          <label class="field-label required">物种</label>
          <div class="species-grid" role="radiogroup" aria-label="选择物种">
            <button
              v-for="opt in speciesOptions"
              :key="opt.value"
              class="species-btn"
              :class="{ active: form.petInfo.species === opt.value }"
              :aria-pressed="form.petInfo.species === opt.value"
              @click="form.petInfo.species = opt.value"
              type="button"
            >
              <span class="species-icon"><svg width="28" height="28" viewBox="0 0 24 24" fill="none"><path :d="opt.svg" fill="currentColor"/></svg></span>
              <span class="species-name">{{ opt.label }}</span>
            </button>
          </div>
        </div>

        <div class="form-field">
          <label class="field-label required">性别</label>
          <div class="pill-group" role="radiogroup" aria-label="选择性别">
            <button
              class="pill-btn male-pill"
              :class="{ active: form.petInfo.gender === 'male' }"
              :aria-pressed="form.petInfo.gender === 'male'"
              @click="form.petInfo.gender = 'male'"
              type="button"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="10" cy="14" r="5" stroke="currentColor" stroke-width="2"/><path d="M19 5l-5.4 5.4M19 5h-5M19 5v5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
              公
            </button>
            <button
              class="pill-btn female-pill"
              :class="{ active: form.petInfo.gender === 'female' }"
              :aria-pressed="form.petInfo.gender === 'female'"
              @click="form.petInfo.gender = 'female'"
              type="button"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="9" r="5" stroke="currentColor" stroke-width="2"/><path d="M12 14v5M9 17h6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
              母
            </button>
          </div>
        </div>

        <div class="form-row">
          <div class="form-field flex-1">
            <label class="field-label" for="pet-breed">品种</label>
            <n-input id="pet-breed" v-model:value="form.petInfo.breed" placeholder="如：英短、金毛" size="large" />
          </div>
          <div class="form-field flex-1">
            <label class="field-label" for="pet-age">年龄（岁）</label>
            <n-input-number id="pet-age" v-model:value="form.petInfo.age" :min="0" :max="30" placeholder="0" size="large" style="width: 100%;" />
          </div>
        </div>

        <div class="form-field">
          <label class="field-label" for="pet-health">健康状态</label>
          <n-input id="pet-health" v-model:value="form.petInfo.healthStatus" placeholder="如：健康、轻微皮肤病" size="large" />
        </div>

        <div class="form-field">
          <label class="field-label" for="pet-desc">描述</label>
          <n-input
            id="pet-desc"
            v-model:value="form.petInfo.description"
            type="textarea"
            placeholder="介绍一下它的性格、习惯、故事..."
            :rows="3"
            size="large"
            maxlength="500"
            show-count
          />
        </div>
      </div>

      <!-- 健康信息 -->
      <div class="form-section" ref="section2">
        <div class="section-header">
          <div class="section-icon-wrap" style="background: rgba(236,72,153,0.1); color: #EC4899;">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M22 12h-4l-3 9L9 3l-3 9H2" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </div>
          <div>
            <h2 class="section-title">健康信息</h2>
            <p class="section-hint">健康信息有助于提高领养成功率</p>
          </div>
        </div>
        <div class="toggle-row">
          <div class="toggle-item" :class="{ checked: form.petInfo.isVaccinated }" @click="form.petInfo.isVaccinated = !form.petInfo.isVaccinated">
            <div class="toggle-content">
              <span class="toggle-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" fill="currentColor"/></svg></span>
              <span class="toggle-label">已接种疫苗</span>
            </div>
            <n-switch v-model:value="form.petInfo.isVaccinated" @click.stop />
          </div>
          <div class="toggle-item" :class="{ checked: form.petInfo.isNeutered }" @click="form.petInfo.isNeutered = !form.petInfo.isNeutered">
            <div class="toggle-content">
              <span class="toggle-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" fill="currentColor"/></svg></span>
              <span class="toggle-label">已绝育</span>
            </div>
            <n-switch v-model:value="form.petInfo.isNeutered" @click.stop />
          </div>
        </div>
      </div>

      <!-- 领养要求 -->
      <div class="form-section" ref="section3">
        <div class="section-header">
          <div class="section-icon-wrap" style="background: rgba(245,158,11,0.1); color: #D97706;">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" stroke="currentColor" stroke-width="1.8"/></svg>
          </div>
          <div>
            <h2 class="section-title">领养要求</h2>
            <p class="section-hint">设置领养条件，筛选合适申请人</p>
          </div>
        </div>
        <div class="toggle-row">
          <div class="toggle-item" v-for="req in requirementOptions" :key="req.key" :class="{ checked: form.requirements[req.key] }" @click="form.requirements[req.key] = !form.requirements[req.key]">
            <div class="toggle-content">
              <span class="toggle-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" fill="currentColor"/></svg></span>
              <span class="toggle-label">{{ req.label }}</span>
            </div>
            <n-switch v-model:value="form.requirements[req.key]" @click.stop />
          </div>
        </div>
        <div class="form-field" style="margin-top: 14px;">
          <label class="field-label" for="other-req">其他要求</label>
          <n-input id="other-req" v-model:value="form.requirements.otherRequirements" type="textarea" placeholder="还有什么补充要求..." :rows="2" size="large" />
        </div>
      </div>

      <!-- 所在地区 -->
      <div class="form-section" ref="section4">
        <div class="section-header">
          <div class="section-icon-wrap" style="background: rgba(139,92,246,0.1); color: #8B5CF6;">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" stroke="currentColor" stroke-width="1.8"/><circle cx="12" cy="10" r="3" stroke="currentColor" stroke-width="1.8"/></svg>
          </div>
          <div>
            <h2 class="section-title">所在地区</h2>
            <p class="section-hint">方便同城领养人找到你</p>
          </div>
        </div>
        <div class="form-row">
          <div class="form-field flex-1">
            <label class="field-label required" for="loc-city">城市</label>
            <n-input id="loc-city" v-model:value="form.location.city" placeholder="如：北京" size="large" />
          </div>
          <div class="form-field flex-1">
            <label class="field-label" for="loc-district">区/县</label>
            <n-input id="loc-district" v-model:value="form.location.district" placeholder="如：朝阳区" size="large" />
          </div>
        </div>
        <div class="form-field">
          <label class="field-label" for="loc-address">详细地址</label>
          <n-input id="loc-address" v-model:value="form.location.address" placeholder="具体地址（选填）" size="large" />
        </div>
      </div>

      <!-- 救助信息 -->
      <div class="form-section" ref="section5">
        <div class="section-header">
          <div class="section-icon-wrap" style="background: rgba(16,185,129,0.1); color: #10B981;">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="currentColor" stroke-width="1.8"/></svg>
          </div>
          <div>
            <h2 class="section-title">救助信息</h2>
            <p class="section-hint">选填，讲述救助故事</p>
          </div>
        </div>
        <div class="form-field">
          <label class="field-label" for="rescue-date">救助日期</label>
          <n-date-picker id="rescue-date" v-model:value="form.rescueInfo.rescueDate" type="date" placeholder="选择日期" size="large" style="width: 100%;" clearable />
        </div>
        <div class="form-field">
          <label class="field-label" for="rescue-location">救助地点</label>
          <n-input id="rescue-location" v-model:value="form.rescueInfo.rescueLocation" placeholder="在哪里发现的" size="large" />
        </div>
        <div class="form-field">
          <label class="field-label" for="rescue-reason">救助原因</label>
          <n-input id="rescue-reason" v-model:value="form.rescueInfo.rescueReason" type="textarea" placeholder="简述救助原因" :rows="2" size="large" />
        </div>
      </div>

      <div class="form-actions">
        <button class="cancel-btn" @click="goBack">取消</button>
        <button class="submit-btn" :class="{ loading: submitting }" :disabled="submitting" @click="handleSubmit">
          <span v-if="submitting" class="spinner"></span>
          <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 12l5 5L20 7" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
          {{ submitting ? '发布中...' : '发布领养' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useMessage } from 'naive-ui'
import { useAdoptionStore } from '../../stores/adoption'
import ImageUploader from '../../components/common/ImageUploader.vue'

const router = useRouter()
const message = useMessage()
const adoptionStore = useAdoptionStore()

const submitting = ref(false)
const submitSuccess = ref(false)
const photoUrls = ref([])
const currentStep = ref(0)
const hasDraft = ref(false)
let observer = null
let saveTimer = null

const DRAFT_KEY = 'pet_adoption_draft'

const steps = [
  { label: '照片', key: 'photo' },
  { label: '信息', key: 'info' },
  { label: '健康', key: 'health' },
  { label: '要求', key: 'req' },
  { label: '地区', key: 'location' }
]

const stepProgress = computed(() => {
  if (currentStep.value === 0) return '0%'
  if (currentStep.value === 1) return '25%'
  if (currentStep.value === 2) return '50%'
  if (currentStep.value === 3) return '75%'
  return '100%'
})

const section0 = ref(null)
const section1 = ref(null)
const section2 = ref(null)
const section3 = ref(null)
const section4 = ref(null)
const section5 = ref(null)

const form = reactive({
  petInfo: {
    name: '',
    species: '',
    breed: '',
    age: 0,
    gender: '',
    description: '',
    isVaccinated: false,
    isNeutered: false,
    healthStatus: '健康'
  },
  rescueInfo: {
    rescueDate: null,
    rescueLocation: '',
    rescueReason: ''
  },
  requirements: {
    hasExperience: false,
    hasSpace: false,
    canAfford: false,
    agreeVisit: false,
    otherRequirements: ''
  },
  location: {
    city: '',
    district: '',
    address: ''
  }
})

const speciesOptions = [
  { label: '猫', value: 'cat', svg: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z' },
  { label: '狗', value: 'dog', svg: 'M4.5 9.5a2.5 2.5 0 115 0 2.5 2.5 0 01-5 0zm10 0a2.5 2.5 0 115 0 2.5 2.5 0 01-5 0zm-7.5 7c0-2.5 2-4.5 5-4.5s5 2 5 4.5' },
  { label: '兔子', value: 'rabbit', svg: 'M12 2C8 2 5 5 5 9c0 2 1 4 2 5v1h10v-1c1-1 2-3 2-5 0-4-3-7-7-7zM9 18h6v2H9v-2z' },
  { label: '鸟', value: 'bird', svg: 'M18 2c-2 0-4 2-4 4l-8 8-2-2-2 2 4 4 2-2 8-8c2 0 4-2 4-4V2h-4z' },
  { label: '鱼', value: 'fish', svg: 'M12 4c-4 0-8 4-8 8s4 8 8 8 8-4 8-8-4-8-8-8zm0 2c1 0 2 1 2 2s-1 2-2 2-2-1-2-2 1-2 2-2z' },
  { label: '仓鼠', value: 'hamster', svg: 'M9 8a2 2 0 114 0 2 2 0 01-4 0zm6 0a2 2 0 114 0 2 2 0 01-4 0zM12 18c-4 0-7-2-7-4s3-4 7-4 7 2 7 4-3 4-7 4z' },
  { label: '其他', value: 'other', svg: 'M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z' }
]

const requirementOptions = [
  { key: 'hasExperience', label: '有养宠经验' },
  { key: 'hasSpace', label: '有足够的活动空间' },
  { key: 'canAfford', label: '能承担日常养护费用' },
  { key: 'agreeVisit', label: '同意定期回访' }
]

function scrollToSection(idx) {
  const refs = [section0, section1, section2, section3, section4, section5]
  refs[idx]?.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

function goBack() {
  router.back()
}

// 草稿保存（debounce 2s）
function saveDraft() {
  clearTimeout(saveTimer)
  saveTimer = setTimeout(() => {
    try {
      const draft = {
        form: JSON.parse(JSON.stringify(form)),
        photoUrls: [...photoUrls.value],
        savedAt: Date.now()
      }
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
    // 超过 7 天的草稿丢弃
    if (draft.savedAt && Date.now() - draft.savedAt > 7 * 24 * 60 * 60 * 1000) {
      localStorage.removeItem(DRAFT_KEY)
      return false
    }
    Object.assign(form.petInfo, draft.form.petInfo || {})
    Object.assign(form.rescueInfo, draft.form.rescueInfo || {})
    Object.assign(form.requirements, draft.form.requirements || {})
    Object.assign(form.location, draft.form.location || {})
    if (draft.photoUrls?.length) photoUrls.value = draft.photoUrls
    return true
  } catch {
    return false
  }
}

function clearDraft() {
  localStorage.removeItem(DRAFT_KEY)
  hasDraft.value = false
}

// 监听表单变化自动保存
watch(form, saveDraft, { deep: true })
watch(photoUrls, saveDraft, { deep: true })

async function handleSubmit() {
  if (!form.petInfo.name.trim()) { message.warning('请输入宠物名字'); scrollToSection(1); return }
  if (!form.petInfo.species) { message.warning('请选择物种'); scrollToSection(1); return }
  if (!form.petInfo.gender) { message.warning('请选择性别'); scrollToSection(1); return }
  if (!form.location.city.trim()) { message.warning('请输入所在城市'); scrollToSection(4); return }

  submitting.value = true
  try {
    const data = {
      petInfo: {
        ...form.petInfo,
        photos: [...photoUrls.value]
      },
      requirements: { ...form.requirements },
      location: {
        ...form.location,
        ...(form.location.city ? { type: 'Point', coordinates: [] } : {})
      }
    }

    const hasRescue = form.rescueInfo.rescueDate || form.rescueInfo.rescueLocation || form.rescueInfo.rescueReason
    if (hasRescue) {
      data.rescueInfo = {
        ...form.rescueInfo,
        rescueDate: form.rescueInfo.rescueDate ? new Date(form.rescueInfo.rescueDate).toISOString() : undefined
      }
    }

    await adoptionStore.publishAdoption(data)
    clearDraft()
    submitSuccess.value = true
    setTimeout(() => {
      router.push('/adoption')
    }, 1800)
  } catch (err) {
    message.error(err.message || '发布失败，请重试')
  } finally {
    submitting.value = false
  }
}

function setupObserver() {
  const sections = [section0.value, section1.value, section2.value, section3.value, section4.value, section5.value].filter(Boolean)
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
.publish-adoption-page {
  padding: 0 0 100px;
  max-width: 680px;
  margin: 0 auto;
  min-height: 100vh;
  background: var(--color-bg, #f8faf9);
}

/* Success Overlay */
.success-overlay {
  position: fixed; inset: 0; z-index: 9999;
  background: rgba(255,255,255,0.95);
  backdrop-filter: blur(20px);
  display: flex; align-items: center; justify-content: center;
}
.success-content { text-align: center; }
.success-icon { margin-bottom: 20px; }
.check-path {
  stroke-dasharray: 50; stroke-dashoffset: 50;
  animation: draw-check 0.6s 0.3s ease forwards;
}
@keyframes draw-check { to { stroke-dashoffset: 0; } }
.success-title { font-size: 22px; font-weight: 700; color: var(--color-text-primary); margin: 0 0 8px; }
.success-desc { font-size: 14px; color: var(--color-text-muted); margin: 0; }
.fade-enter-active { transition: opacity 0.3s; }
.fade-leave-active { transition: opacity 0.3s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

/* Header */
.page-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 12px 16px;
  background: rgba(255,255,255,0.92);
  backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);
  position: sticky; top: 0; z-index: 20;
  border-bottom: 1px solid rgba(0,0,0,0.04);
}
.back-btn {
  width: 36px; height: 36px; border: none; background: none; color: #555;
  cursor: pointer; display: flex; align-items: center; justify-content: center;
  border-radius: 50%; transition: all 0.25s;
}
.back-btn:hover { background: var(--color-bg-light); color: var(--color-primary); }
.page-title { font-size: 16px; font-weight: 700; color: var(--color-text-primary); margin: 0; }

/* Step Bar */
.step-bar {
  display: flex; align-items: center; justify-content: space-between;
  margin: 12px 16px 0; padding: 14px 20px;
  background: var(--color-bg-white, #fff); border-radius: 14px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.04);
  position: relative;
}
.step-item {
  display: flex; flex-direction: column; align-items: center; gap: 6px;
  z-index: 1; cursor: pointer; transition: all 0.3s;
}
.step-dot {
  width: 28px; height: 28px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 12px; font-weight: 700;
  background: var(--color-bg-light); color: var(--color-text-muted);
  border: 2px solid var(--color-border); transition: all 0.3s;
}
.step-item.active .step-dot {
  background: var(--color-primary); color: #fff; border-color: var(--color-primary);
  box-shadow: 0 0 0 4px rgba(16,185,129,0.15);
}
.step-item.done .step-dot {
  background: var(--color-primary); color: #fff; border-color: var(--color-primary);
}
.step-label { font-size: 11px; font-weight: 500; color: var(--color-text-muted); }
.step-item.active .step-label { color: var(--color-primary); font-weight: 600; }
.step-item.done .step-label { color: var(--color-primary); }
.step-line {
  position: absolute; left: 50px; right: 50px; top: 50%;
  height: 2px; background: var(--color-border); transform: translateY(-8px);
  z-index: 0;
}
.step-line-fill {
  height: 100%; background: var(--color-primary); transition: width 0.4s ease;
  border-radius: 1px;
}

/* Draft Banner */
.draft-banner {
  display: flex; align-items: center; gap: 8px;
  margin: 10px 16px 0; padding: 10px 16px;
  background: rgba(16,185,129,0.06); border: 1px solid rgba(16,185,129,0.15);
  border-radius: 12px; font-size: 13px; color: var(--color-primary);
  font-weight: 500;
}
.draft-clear {
  margin-left: auto; background: none; border: none; color: var(--color-text-muted);
  font-size: 12px; cursor: pointer; font-weight: 500; text-decoration: underline;
}

/* Form */
.form-container { margin: 12px 16px; }
.form-section {
  background: var(--color-bg-white, #fff); border-radius: 16px;
  padding: 20px; margin-bottom: 12px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.04);
  border-left: 3px solid transparent;
  transition: border-color 0.3s;
}
.form-section:nth-child(1) { border-left-color: #10B981; }
.form-section:nth-child(2) { border-left-color: #3B82F6; }
.form-section:nth-child(3) { border-left-color: #EC4899; }
.form-section:nth-child(4) { border-left-color: #D97706; }
.form-section:nth-child(5) { border-left-color: #8B5CF6; }
.form-section:nth-child(6) { border-left-color: #10B981; }

.section-header { display: flex; align-items: center; gap: 12px; margin-bottom: 18px; }
.section-icon-wrap {
  width: 36px; height: 36px; border-radius: 10px;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.section-title { font-size: 15px; font-weight: 700; color: var(--color-text-primary); margin: 0; }
.section-hint { font-size: 12px; color: var(--color-text-muted); margin: 2px 0 0; }

.form-field { margin-bottom: 16px; }
.form-field:last-child { margin-bottom: 0; }
.field-label { display: block; font-size: 13px; font-weight: 600; color: var(--color-text-secondary); margin-bottom: 8px; }
.field-label.required::before { content: '*'; color: #EF4444; margin-right: 4px; }
.form-row { display: flex; gap: 16px; }
.flex-1 { flex: 1; }

/* Species grid */
.species-grid {
  display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px;
}
.species-btn {
  border: 2px solid var(--color-border-light);
  border-radius: var(--radius-lg);
  background: var(--color-bg-white); padding: 12px 8px;
  display: flex; flex-direction: column; align-items: center; gap: 4px;
  cursor: pointer; transition: all 0.25s var(--spring-bounce, cubic-bezier(0.34, 1.56, 0.64, 1));
  min-height: 60px;
}
.species-btn:hover {
  border-color: var(--color-primary); background: var(--color-primary-light);
  transform: translateY(-2px);
}
.species-btn:focus-visible { outline: 2px solid var(--color-primary); outline-offset: 2px; }
.species-btn.active {
  border-color: var(--color-primary); background: var(--color-primary-light);
  box-shadow: 0 0 0 1px var(--color-primary);
}
.species-icon {
  width: 28px; height: 28px; display: flex; align-items: center; justify-content: center;
  color: var(--color-text-muted);
}
.species-btn.active .species-icon { color: var(--color-primary); }
.species-btn.active .species-icon { animation: icon-bounce 0.5s cubic-bezier(0.34, 1.56, 0.64, 1); }
@keyframes icon-bounce {
  0% { transform: scale(1); }
  50% { transform: scale(1.3); }
  100% { transform: scale(1); }
}
.species-name { font-size: 12px; font-weight: 600; color: var(--color-text-secondary); }
.species-btn.active .species-name { color: var(--color-primary); }

/* Pill group */
.pill-group { display: flex; gap: 10px; }
.pill-btn {
  display: flex; align-items: center; gap: 6px;
  border: 2px solid var(--color-border-light);
  border-radius: var(--radius-full); background: var(--color-bg-white);
  padding: 10px 24px; font-size: 14px; font-weight: 600;
  cursor: pointer; transition: all 0.25s var(--spring-bounce, cubic-bezier(0.34, 1.56, 0.64, 1));
  color: var(--color-text-secondary); min-height: 44px;
}
.pill-btn:hover { transform: translateY(-2px); }
.pill-btn:focus-visible { outline: 2px solid var(--color-primary); outline-offset: 2px; }
.male-pill:hover, .male-pill.active {
  border-color: var(--color-blue, #60A5FA); background: var(--color-blue-light, #EFF6FF); color: var(--color-blue, #2563EB);
}
.female-pill:hover, .female-pill.active {
  border-color: var(--color-pink, #F472B6); background: var(--color-pink-light, #FDF2F8); color: var(--color-pink, #DB2777);
}

/* Toggle row */
.toggle-row { display: flex; flex-direction: column; gap: 10px; }
.toggle-item {
  display: flex; align-items: center; justify-content: space-between;
  padding: 12px 14px; background: var(--color-bg); border-radius: 12px;
  cursor: pointer; transition: all 0.25s; border: 1px solid transparent;
}
.toggle-item:hover { border-color: rgba(16,185,129,0.2); }
.toggle-item.checked { background: rgba(16,185,129,0.06); border-color: rgba(16,185,129,0.15); }
.toggle-content { display: flex; align-items: center; gap: 10px; }
.toggle-icon { color: var(--color-text-muted); display: flex; }
.toggle-item.checked .toggle-icon { color: var(--color-primary); }
.toggle-label { font-size: 14px; color: var(--color-text-primary); font-weight: 500; }

/* Actions */
.form-actions {
  display: flex; gap: 12px; justify-content: flex-end;
  padding: 20px 24px;
  background: var(--color-bg-white, #fff); border-radius: 16px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.04);
}
.cancel-btn {
  padding: 0 28px; height: 44px; border-radius: 12px; border: 1.5px solid var(--color-border);
  background: var(--color-bg-white); font-size: 14px; color: var(--color-text-muted);
  cursor: pointer; font-weight: 500; transition: all 0.25s;
}
.cancel-btn:hover { border-color: var(--color-primary); color: var(--color-primary); }
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
  .page-header, .species-btn, .pill-btn, .submit-btn, .step-item {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
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
}
</style>