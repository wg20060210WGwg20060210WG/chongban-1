<template>
  <div class="apply-page">
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
          <h3 class="success-title">申请已提交</h3>
          <p class="success-desc">请等待发布者审核，保持电话畅通</p>
        </div>
      </div>
    </transition>

    <div class="page-header">
      <button class="back-btn" @click="goBack" aria-label="返回">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M15 18l-6-6 6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </button>
      <h1 class="page-title">领养申请</h1>
      <div style="width:36px"></div>
    </div>

    <!-- 宠物摘要卡片 -->
    <div class="pet-hero" v-if="adoption">
      <div class="pet-hero-img-wrap">
        <img v-if="adoption.petInfo?.photos?.length" :src="adoption.petInfo.photos[0]" class="pet-hero-img" :alt="adoption.petInfo?.name" />
        <div v-else class="pet-hero-img-fb">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none"><path d="M4.5 9.5a2.5 2.5 0 115 0 2.5 2.5 0 01-5 0zm10 0a2.5 2.5 0 115 0 2.5 2.5 0 01-5 0zm-7.5 7c0-2.5 2-4.5 5-4.5s5 2 5 4.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
        </div>
      </div>
      <div class="pet-hero-info">
        <div class="pet-hero-name">{{ adoption.petInfo?.name }}</div>
        <div class="pet-hero-meta">
          <span class="pet-tag">{{ speciesLabelMap[adoption.petInfo?.species] }}</span>
          <span class="pet-tag">{{ adoption.petInfo?.gender === 'male' ? '公' : '母' }}</span>
          <span class="pet-tag" v-if="adoption.petInfo?.age">{{ adoption.petInfo.age }}岁</span>
        </div>
      </div>
      <span class="pet-status-badge">可领养</span>
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

    <!-- 表单区域 -->
    <div class="form-container">
      <!-- 个人信息 -->
      <div class="form-section" ref="section0">
        <div class="section-header">
          <div class="section-icon-wrap" style="background: rgba(16,185,129,0.1); color: #10B981;">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </div>
          <div>
            <h2 class="section-title">个人信息</h2>
            <p class="section-hint">让发布者了解你</p>
          </div>
        </div>
        <div class="form-field">
          <label class="field-label required">真实姓名</label>
          <n-input v-model:value="form.applicantInfo.realName" placeholder="请输入真实姓名" size="large" />
        </div>
        <div class="form-row">
          <div class="form-field flex-1">
            <label class="field-label">年龄</label>
            <n-input-number v-model:value="form.applicantInfo.age" :min="18" :max="100" placeholder="18" size="large" style="width: 100%;" />
          </div>
          <div class="form-field flex-1">
            <label class="field-label">职业</label>
            <n-input v-model:value="form.applicantInfo.occupation" placeholder="如：上班族" size="large" />
          </div>
        </div>
        <div class="form-field">
          <label class="field-label required">联系电话</label>
          <n-input v-model:value="form.applicantInfo.phone" placeholder="手机号码" size="large" maxlength="11" />
        </div>
        <div class="form-field">
          <label class="field-label">居住地址</label>
          <n-input v-model:value="form.applicantInfo.address" placeholder="详细地址" size="large" />
        </div>
      </div>

      <!-- 养宠条件 -->
      <div class="form-section" ref="section1">
        <div class="section-header">
          <div class="section-icon-wrap" style="background: rgba(59,130,246,0.1); color: #3B82F6;">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M3 9.5L12 4l9 5.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M9 21V12h6v9" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </div>
          <div>
            <h2 class="section-title">养宠条件</h2>
            <p class="section-hint">帮助发布者评估匹配度</p>
          </div>
        </div>
        <div class="form-field">
          <label class="field-label">住房类型</label>
          <n-select v-model:value="form.applicantInfo.housingType" :options="housingOptions" placeholder="请选择" size="large" />
        </div>
        <div class="toggle-row">
          <div class="toggle-item" :class="{ checked: form.applicantInfo.hasExperience }" @click="form.applicantInfo.hasExperience = !form.applicantInfo.hasExperience">
            <div class="toggle-content">
              <span class="toggle-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" fill="currentColor"/></svg>
              </span>
              <span class="toggle-label">有养宠经验</span>
            </div>
            <n-switch v-model:value="form.applicantInfo.hasExperience" @click.stop />
          </div>
          <div class="toggle-item" :class="{ checked: form.applicantInfo.familyAgreement }" @click="form.applicantInfo.familyAgreement = !form.applicantInfo.familyAgreement">
            <div class="toggle-content">
              <span class="toggle-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" fill="currentColor"/></svg>
              </span>
              <span class="toggle-label">家人同意领养</span>
            </div>
            <n-switch v-model:value="form.applicantInfo.familyAgreement" @click.stop />
          </div>
        </div>
        <div class="form-field" style="margin-top: 14px;">
          <label class="field-label">目前养宠情况</label>
          <n-input v-model:value="form.applicantInfo.currentPets" placeholder="如：已有一只2岁英短" size="large" />
        </div>
      </div>

      <!-- 申请理由 -->
      <div class="form-section" ref="section2">
        <div class="section-header">
          <div class="section-icon-wrap" style="background: rgba(236,72,153,0.1); color: #EC4899;">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </div>
          <div>
            <h2 class="section-title">申请理由</h2>
            <p class="section-hint">真诚的表达会增加通过几率</p>
          </div>
        </div>
        <div class="form-field">
          <label class="field-label required">为什么想领养它？</label>
          <n-input
            v-model:value="form.applicantInfo.reasonToAdopt"
            type="textarea"
            placeholder="说说你想领养的原因，以及你打算怎么照顾它..."
            :rows="4"
            size="large"
            maxlength="500"
            show-count
          />
        </div>
      </div>
    </div>

    <!-- 底部固定操作栏 -->
    <div class="bottom-bar">
      <n-button size="large" @click="goBack" class="cancel-btn">取消</n-button>
      <n-button type="primary" strong size="large" :loading="submitting" @click="handleSubmit" class="submit-btn">
        提交申请
      </n-button>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { NInput, NInputNumber, NSelect, NSwitch, NButton, useMessage } from 'naive-ui'
import { useAdoptionStore } from '../../stores/adoption'

const router = useRouter()
const route = useRoute()
const message = useMessage()
const adoptionStore = useAdoptionStore()

const submitting = ref(false)
const submitSuccess = ref(false)
const adoption = ref(null)
const currentStep = ref(0)
let observer = null

const speciesLabelMap = { cat: '猫咪', dog: '狗狗', rabbit: '兔兔', bird: '鸟鸟', fish: '鱼鱼', hamster: '仓鼠', other: '其他' }

const steps = [
  { label: '个人信息', key: 'personal' },
  { label: '养宠条件', key: 'condition' },
  { label: '申请理由', key: 'reason' }
]

const housingOptions = [
  { label: '自有住房', value: 'own' },
  { label: '租房', value: 'rent' },
  { label: '宿舍', value: 'dorm' },
  { label: '其他', value: 'other' }
]

const stepProgress = computed(() => {
  if (currentStep.value === 0) return '0%'
  if (currentStep.value === 1) return '50%'
  return '100%'
})

const section0 = ref(null)
const section1 = ref(null)
const section2 = ref(null)

const form = reactive({
  applicantInfo: {
    realName: '',
    age: null,
    occupation: '',
    phone: '',
    address: '',
    housingType: null,
    hasExperience: false,
    currentPets: '',
    familyAgreement: false,
    reasonToAdopt: ''
  }
})

function goBack() { router.back() }

function scrollToSection(idx) {
  const refs = [section0, section1, section2]
  refs[idx]?.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

async function handleSubmit() {
  if (!form.applicantInfo.realName.trim()) { message.warning('请输入真实姓名'); return }
  if (!form.applicantInfo.phone.trim()) { message.warning('请输入联系电话'); return }
  if (!form.applicantInfo.reasonToAdopt.trim()) { message.warning('请填写申请理由'); return }

  submitting.value = true
  try {
    await adoptionStore.submitApplication(route.params.id, { applicantInfo: { ...form.applicantInfo } })
    submitSuccess.value = true
    setTimeout(() => {
      router.push(`/adoption/${route.params.id}`)
    }, 1800)
  } catch (err) {
    message.error(err.message || '提交失败，请重试')
  } finally {
    submitting.value = false
  }
}

function setupObserver() {
  const sections = [section0.value, section1.value, section2.value].filter(Boolean)
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

onMounted(async () => {
  const id = route.params.id
  if (id) {
    adoption.value = await adoptionStore.fetchAdoptionDetail(id)
  }
  setTimeout(setupObserver, 100)
})

onUnmounted(() => { observer?.disconnect() })
</script>

<style scoped>
.apply-page {
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
  display: flex; align-items: center; gap: 12px;
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
.page-title { font-size: 16px; font-weight: 700; color: var(--color-text-primary); margin: 0; flex: 1; text-align: center; }

/* Pet Hero Card */
.pet-hero {
  display: flex; align-items: center; gap: 14px;
  margin: 12px 16px; padding: 16px;
  background: linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 50%, #f0fdf4 100%);
  border-radius: 16px; border: 1px solid rgba(16,185,129,0.12);
  position: relative;
}
.pet-hero-img-wrap {
  width: 72px; height: 72px; border-radius: 16px; overflow: hidden; flex-shrink: 0;
  box-shadow: 0 4px 12px rgba(0,0,0,0.08);
}
.pet-hero-img { width: 100%; height: 100%; object-fit: cover; }
.pet-hero-img-fb {
  width: 100%; height: 100%; display: flex; align-items: center; justify-content: center;
  background: var(--color-primary-bg); color: var(--color-primary);
}
.pet-hero-info { flex: 1; min-width: 0; }
.pet-hero-name { font-size: 18px; font-weight: 700; color: var(--color-text-primary); margin-bottom: 6px; }
.pet-hero-meta { display: flex; gap: 6px; flex-wrap: wrap; }
.pet-tag {
  padding: 2px 10px; border-radius: 12px; font-size: 12px; font-weight: 500;
  background: rgba(16,185,129,0.1); color: #059669;
}
.pet-status-badge {
  position: absolute; top: 12px; right: 12px;
  padding: 3px 10px; border-radius: 10px; font-size: 11px; font-weight: 600;
  background: rgba(16,185,129,0.12); color: #059669;
}

/* Step Bar */
.step-bar {
  display: flex; align-items: center; justify-content: space-between;
  margin: 16px 16px 0; padding: 14px 20px;
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
  position: absolute; left: 60px; right: 60px; top: 50%;
  height: 2px; background: var(--color-border); transform: translateY(-8px);
  z-index: 0;
}
.step-line-fill {
  height: 100%; background: var(--color-primary); transition: width 0.4s ease;
  border-radius: 1px;
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

/* Toggle */
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

/* Bottom Bar */
.bottom-bar {
  position: fixed; bottom: 0; left: 0; right: 0;
  display: flex; gap: 12px; justify-content: flex-end;
  padding: 14px 20px;
  padding-bottom: calc(14px + env(safe-area-inset-bottom));
  background: rgba(255,255,255,0.92);
  backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);
  border-top: 1px solid rgba(0,0,0,0.06);
  z-index: 20;
}
.cancel-btn {
  padding: 0 28px; height: 44px; border-radius: 12px;
  font-weight: 500;
}
.submit-btn {
  background: linear-gradient(135deg, #10B981, #059669); border: none;
  padding: 0 36px; height: 44px; border-radius: 12px;
  font-weight: 600; box-shadow: 0 4px 16px rgba(16,185,129,0.3);
  transition: all 0.3s;
}
.submit-btn:hover { box-shadow: 0 6px 20px rgba(16,185,129,0.4); transform: translateY(-1px); }

@media (max-width: 500px) {
  .form-row { flex-direction: column; gap: 0; }
  .step-label { font-size: 10px; }
}
</style>