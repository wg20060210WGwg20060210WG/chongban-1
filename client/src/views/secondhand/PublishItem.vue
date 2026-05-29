<template>
  <div class="publish-page">
    <div class="page-header">
      <button class="back-btn" @click="goBack" aria-label="返回">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M15 18l-6-6 6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
      </button>
      <h1 class="page-title">{{ isEdit ? '编辑商品' : '发布商品' }}</h1>
      <div class="header-placeholder"></div>
    </div>

    <!-- Step bar -->
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

    <!-- Success Overlay -->
    <Transition name="fade">
      <div v-if="showSuccess" class="success-overlay">
        <div class="success-content">
          <div class="success-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="var(--color-primary)" stroke-width="2"/><path d="M8 12l3 3 5-5" stroke="var(--color-primary)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </div>
          <h3>{{ isEdit ? '修改成功' : '发布成功' }}</h3>
          <p>{{ isEdit ? '商品信息已更新' : '您的商品已成功上架' }}</p>
        </div>
      </div>
    </Transition>

    <form class="publish-form" @submit.prevent="handleSubmit">
      <!-- Images -->
      <div class="form-section" ref="section0">
        <div class="section-header">
          <div class="section-icon-wrap" style="background: rgba(16,185,129,0.1); color: #10B981;">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="3" stroke="currentColor" stroke-width="1.5"/><circle cx="8.5" cy="8.5" r="1.5" fill="currentColor"/><path d="M21 15l-5-5L5 21" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
          </div>
          <div>
            <h2 class="section-title">商品图片</h2>
            <p class="section-desc">{{ form.images.length }}/10 · 第一张为封面</p>
          </div>
        </div>
        <ImageUploader v-model="form.images" :max="10" />
        <p class="image-tip">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="1.5"/><path d="M12 8v4M12 16h.01" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
          清晰的实物照片能提高成交率，建议拍摄多角度
        </p>
      </div>

      <!-- Basic Info -->
      <div class="form-section" ref="section1">
        <div class="section-header">
          <div class="section-icon-wrap" style="background: rgba(59,130,246,0.1); color: #3B82F6;">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke="currentColor" stroke-width="1.5"/><path d="M14 2v6h6" stroke="currentColor" stroke-width="1.5"/></svg>
          </div>
          <div>
            <h2 class="section-title">基本信息</h2>
            <p class="section-desc">填写商品基本资料</p>
          </div>
        </div>

        <label class="field-label required" for="publish-category">商品分类</label>
        <select id="publish-category" v-model="form.category" class="field-select" :class="{ error: errors.category }" @blur="validateField('category')">
          <option value="">请选择分类</option>
          <option v-for="(label, key) in categoryLabels" :key="key" :value="key">{{ label }}</option>
        </select>
        <p v-if="errors.category" class="field-error" role="alert">{{ errors.category }}</p>

        <label class="field-label required" for="publish-title">商品标题</label>
        <input id="publish-title" v-model="form.title" type="text" class="field-input" :class="{ error: errors.title }" placeholder="品牌 + 商品名 + 关键特征" maxlength="100" @blur="validateField('title')" />
        <div class="field-meta">
          <p v-if="errors.title" class="field-error" role="alert">{{ errors.title }}</p>
          <p class="field-count">{{ form.title.length }}/100</p>
        </div>

        <label class="field-label" for="publish-desc">商品描述</label>
        <textarea id="publish-desc" v-model="form.description" class="field-textarea" placeholder="描述使用情况、购买渠道、转手原因等，越详细越容易卖出" maxlength="2000" rows="4"></textarea>
        <p class="field-count">{{ (form.description || '').length }}/2000</p>

        <label class="field-label required">商品成色</label>
        <div class="condition-cards">
          <button
            v-for="(item, key) in conditionOptions"
            :key="key"
            type="button"
            class="condition-card"
            :class="{ active: form.condition === key }"
            @click="form.condition = key"
          >
            <span class="condition-icon" v-html="item.icon"></span>
            <span class="condition-name">{{ item.label }}</span>
            <span class="condition-desc">{{ item.desc }}</span>
          </button>
        </div>
        <p v-if="errors.condition" class="field-error" role="alert">{{ errors.condition }}</p>

        <label class="field-label" for="publish-quantity">数量</label>
        <input id="publish-quantity" v-model.number="form.quantity" type="number" class="field-input short" min="1" placeholder="1" />
      </div>

      <!-- Price -->
      <div class="form-section" ref="section2">
        <div class="section-header">
          <div class="section-icon-wrap" style="background: rgba(245,158,11,0.1); color: #D97706;">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><line x1="12" y1="1" x2="12" y2="23" stroke="currentColor" stroke-width="1.5"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
          </div>
          <div>
            <h2 class="section-title">价格信息</h2>
            <p class="section-desc">设置合理的售价</p>
          </div>
          <span v-if="discountPercent > 0" class="discount-badge">省{{ discountPercent }}%</span>
        </div>

        <div class="price-row">
          <div class="price-field">
            <label class="field-label required" for="publish-original">原价 (¥)</label>
            <input id="publish-original" v-model.number="form.originalPrice" type="number" class="field-input" :class="{ error: errors.originalPrice }" min="0" step="0.01" placeholder="0.00" @blur="validateField('originalPrice')" />
          </div>
          <div class="price-arrow">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" stroke="var(--color-text-muted)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </div>
          <div class="price-field">
            <label class="field-label required" for="publish-selling">售价 (¥)</label>
            <input id="publish-selling" v-model.number="form.sellingPrice" type="number" class="field-input" :class="{ error: errors.sellingPrice }" min="0" step="0.01" placeholder="0.00" @blur="validateField('sellingPrice')" />
          </div>
        </div>
        <div class="price-errors">
          <p v-if="errors.originalPrice" class="field-error" role="alert">{{ errors.originalPrice }}</p>
          <p v-if="errors.sellingPrice" class="field-error" role="alert">{{ errors.sellingPrice }}</p>
          <p v-if="priceWarning" class="field-warning" role="alert">{{ priceWarning }}</p>
        </div>

        <div class="switch-row">
          <div class="switch-label">
            <label class="field-label no-margin" for="publish-negotiable">可议价</label>
            <span class="switch-hint">买家可与您协商价格</span>
          </div>
          <n-switch id="publish-negotiable" v-model:value="form.isPriceNegotiable" />
        </div>
      </div>

      <!-- Delivery -->
      <div class="form-section" ref="section3">
        <div class="section-header">
          <div class="section-icon-wrap" style="background: rgba(236,72,153,0.1); color: #EC4899;">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="1" y="3" width="15" height="13" rx="2" stroke="currentColor" stroke-width="1.5"/><path d="M16 8h4l3 3v5h-7V8z" stroke="currentColor" stroke-width="1.5"/><circle cx="5.5" cy="18.5" r="2.5" stroke="currentColor" stroke-width="1.5"/><circle cx="18.5" cy="18.5" r="2.5" stroke="currentColor" stroke-width="1.5"/></svg>
          </div>
          <div>
            <h2 class="section-title">交付方式</h2>
            <p class="section-desc">至少选择一种</p>
          </div>
        </div>

        <div class="delivery-cards">
          <button
            type="button"
            class="delivery-card"
            :class="{ active: form.deliveryMethods.pickUp }"
            @click="form.deliveryMethods.pickUp = !form.deliveryMethods.pickUp"
          >
            <div class="delivery-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" stroke="currentColor" stroke-width="1.5"/><polyline points="9,22 9,12 15,12 15,22" stroke="currentColor" stroke-width="1.5"/></svg>
            </div>
            <span class="delivery-name">自提</span>
            <span class="delivery-desc">当面交易更放心</span>
            <span class="delivery-check" v-if="form.deliveryMethods.pickUp">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" fill="var(--color-primary)"/><path d="M8 12l3 3 5-5" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </span>
          </button>
          <button
            type="button"
            class="delivery-card"
            :class="{ active: form.deliveryMethods.shipping }"
            @click="form.deliveryMethods.shipping = !form.deliveryMethods.shipping"
          >
            <div class="delivery-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><rect x="1" y="3" width="15" height="13" rx="2" stroke="currentColor" stroke-width="1.5"/><path d="M16 8h4l3 3v5h-7V8z" stroke="currentColor" stroke-width="1.5"/><circle cx="5.5" cy="18.5" r="2.5" stroke="currentColor" stroke-width="1.5"/><circle cx="18.5" cy="18.5" r="2.5" stroke="currentColor" stroke-width="1.5"/></svg>
            </div>
            <span class="delivery-name">邮寄</span>
            <span class="delivery-desc">快递送达</span>
            <span class="delivery-check" v-if="form.deliveryMethods.shipping">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" fill="var(--color-primary)"/><path d="M8 12l3 3 5-5" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </span>
          </button>
        </div>
        <p v-if="errors.delivery" class="field-error" role="alert">{{ errors.delivery }}</p>

        <div v-if="form.deliveryMethods.shipping" class="shipping-fee-row">
          <label class="field-label" for="publish-shipping-fee">运费 (¥)</label>
          <input id="publish-shipping-fee" v-model.number="form.deliveryMethods.shippingFee" type="number" class="field-input short" min="0" step="0.01" placeholder="0 表示包邮" />
          <span class="fee-hint" v-if="form.deliveryMethods.shippingFee > 0">买家需支付 ¥{{ form.deliveryMethods.shippingFee }} 运费</span>
          <span class="fee-hint free" v-else-if="form.deliveryMethods.shippingFee === 0 && form.deliveryMethods.shipping">包邮</span>
        </div>
      </div>

      <!-- Location -->
      <div class="form-section" ref="section4">
        <div class="section-header">
          <div class="section-icon-wrap" style="background: rgba(139,92,246,0.1); color: #8B5CF6;">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" stroke="currentColor" stroke-width="1.5"/><circle cx="12" cy="10" r="3" stroke="currentColor" stroke-width="1.5"/></svg>
          </div>
          <div>
            <h2 class="section-title">所在地区</h2>
            <p class="section-desc">方便同城买家找到你</p>
          </div>
        </div>

        <div class="location-row">
          <div class="location-field">
            <label class="field-label" for="publish-city">城市</label>
            <input id="publish-city" v-model="form.location.city" type="text" class="field-input" placeholder="如：北京" />
          </div>
          <div class="location-field">
            <label class="field-label" for="publish-district">区县</label>
            <input id="publish-district" v-model="form.location.district" type="text" class="field-input" placeholder="如：朝阳区" />
          </div>
        </div>
      </div>

      <!-- Seller Tips -->
      <div class="tips-section">
        <div class="tips-header">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
          <span>发布小贴士</span>
        </div>
        <ul class="tips-list">
          <li>定价参考同类商品，合理定价更容易出手</li>
          <li>如实描述商品状况，避免售后纠纷</li>
          <li>及时回复买家咨询，提高成交机会</li>
        </ul>
      </div>

      <!-- Submit -->
      <div class="submit-area">
        <button type="submit" class="submit-btn" :disabled="submitting">
          <span v-if="submitting" class="btn-spinner"></span>
          {{ submitting ? '提交中...' : (isEdit ? '保存修改' : '发布商品') }}
        </button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { NSwitch } from 'naive-ui'
import { useSecondhandStore } from '../../stores/secondhand'
import { SECONDHAND_CATEGORY_LABELS, ITEM_CONDITION_LABELS } from '../../utils/constants'
import ImageUploader from '../../components/common/ImageUploader.vue'

const route = useRoute()
const router = useRouter()
const store = useSecondhandStore()

const categoryLabels = SECONDHAND_CATEGORY_LABELS
const conditionLabels = ITEM_CONDITION_LABELS

const section0 = ref(null)
const section1 = ref(null)
const section2 = ref(null)
const section3 = ref(null)
const section4 = ref(null)
const currentStep = ref(0)
let observer = null

const steps = [
  { label: '图片', key: 'photo' },
  { label: '信息', key: 'info' },
  { label: '价格', key: 'price' },
  { label: '交付', key: 'delivery' },
  { label: '地区', key: 'location' }
]

const stepProgress = computed(() => {
  if (currentStep.value === 0) return '0%'
  if (currentStep.value === 1) return '25%'
  if (currentStep.value === 2) return '50%'
  if (currentStep.value === 3) return '75%'
  return '100%'
})

function scrollToSection(idx) {
  const refs = [section0, section1, section2, section3, section4]
  refs[idx]?.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
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

const conditionOptions = {
  new: {
    label: '全新',
    desc: '未拆封或未使用',
    icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" stroke="currentColor" stroke-width="1.5" fill="none"/></svg>'
  },
  like_new: {
    label: '几乎全新',
    desc: '仅短暂使用',
    icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17l-5-5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>'
  },
  good: {
    label: '良好',
    desc: '有正常使用痕迹',
    icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="1.5"/><path d="M8 14s1.5 2 4 2 4-2 4-2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><line x1="9" y1="9" x2="9.01" y2="9" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><line x1="15" y1="9" x2="15.01" y2="9" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>'
  },
  fair: {
    label: '一般',
    desc: '有明显使用痕迹',
    icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>'
  }
}

const isEdit = computed(() => !!route.query.id)
const submitting = ref(false)
const showSuccess = ref(false)

const form = reactive({
  images: [],
  category: '',
  title: '',
  description: '',
  condition: '',
  quantity: 1,
  originalPrice: null,
  sellingPrice: null,
  isPriceNegotiable: false,
  deliveryMethods: {
    pickUp: false,
    shipping: false,
    shippingFee: 0
  },
  location: {
    city: '',
    district: ''
  }
})

const errors = reactive({
  category: '',
  title: '',
  condition: '',
  originalPrice: '',
  sellingPrice: '',
  delivery: ''
})

// Completion percent
const completionPercent = computed(() => {
  let total = 0
  if (form.images.length > 0) total += 20
  if (form.category) total += 15
  if (form.title.trim()) total += 15
  if (form.condition) total += 10
  if (form.originalPrice !== null && form.originalPrice > 0) total += 10
  if (form.sellingPrice !== null && form.sellingPrice > 0) total += 10
  if (form.deliveryMethods.pickUp || form.deliveryMethods.shipping) total += 10
  if (form.location.city) total += 5
  if (form.description && form.description.length > 10) total += 5
  return Math.min(total, 100)
})

// Discount percent
const discountPercent = computed(() => {
  if (!form.originalPrice || !form.sellingPrice || form.sellingPrice >= form.originalPrice) return 0
  return Math.round((1 - form.sellingPrice / form.originalPrice) * 100)
})

// Price warning
const priceWarning = computed(() => {
  if (form.originalPrice && form.sellingPrice && form.sellingPrice > form.originalPrice) {
    return '售价高于原价，请确认是否正确'
  }
  return ''
})

function validateField(field) {
  errors[field] = ''
  if (field === 'title' && !form.title.trim()) errors.title = '请输入商品标题'
  if (field === 'category' && !form.category) errors.category = '请选择分类'
  if (field === 'originalPrice' && (form.originalPrice === null || form.originalPrice < 0)) errors.originalPrice = '请输入原价'
  if (field === 'sellingPrice' && (form.sellingPrice === null || form.sellingPrice < 0)) errors.sellingPrice = '请输入售价'
}

function validate() {
  let valid = true
  const firstErrorField = ref(null)
  errors.category = ''
  errors.title = ''
  errors.condition = ''
  errors.originalPrice = ''
  errors.sellingPrice = ''
  errors.delivery = ''

  if (!form.category) { errors.category = '请选择分类'; valid = false; if (!firstErrorField.value) firstErrorField.value = 'category' }
  if (!form.title.trim()) { errors.title = '请输入商品标题'; valid = false; if (!firstErrorField.value) firstErrorField.value = 'title' }
  if (!form.condition) { errors.condition = '请选择成色'; valid = false; if (!firstErrorField.value) firstErrorField.value = 'condition' }
  if (form.originalPrice === null || form.originalPrice < 0) { errors.originalPrice = '请输入原价'; valid = false; if (!firstErrorField.value) firstErrorField.value = 'originalPrice' }
  if (form.sellingPrice === null || form.sellingPrice < 0) { errors.sellingPrice = '请输入售价'; valid = false; if (!firstErrorField.value) firstErrorField.value = 'sellingPrice' }
  if (!form.deliveryMethods.pickUp && !form.deliveryMethods.shipping) { errors.delivery = '至少选择一种交付方式'; valid = false; if (!firstErrorField.value) firstErrorField.value = 'delivery' }

  // Focus first error field
  if (firstErrorField.value) {
    const el = document.getElementById('publish-' + firstErrorField.value) || document.querySelector('.condition-cards')
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  return valid
}

async function handleSubmit() {
  if (!validate()) return
  submitting.value = true
  try {
    const fd = new FormData()
    fd.append('category', form.category)
    fd.append('title', form.title)
    if (form.description) fd.append('description', form.description)
    fd.append('condition', form.condition)
    fd.append('quantity', form.quantity)
    fd.append('originalPrice', form.originalPrice)
    fd.append('sellingPrice', form.sellingPrice)
    fd.append('isPriceNegotiable', form.isPriceNegotiable)
    fd.append('deliveryMethods[pickUp]', form.deliveryMethods.pickUp)
    fd.append('deliveryMethods[shipping]', form.deliveryMethods.shipping)
    if (form.deliveryMethods.shipping) fd.append('deliveryMethods[shippingFee]', form.deliveryMethods.shippingFee || 0)
    if (form.location.city) fd.append('location[city]', form.location.city)
    if (form.location.district) fd.append('location[district]', form.location.district)

    // Images: send existing URLs as-is, new files separately
    form.images.forEach(img => {
      if (img instanceof File) {
        fd.append('images', img)
      } else {
        fd.append('existingImages', img)
      }
    })

    if (isEdit.value) {
      await store.editItem(route.query.id, fd)
    } else {
      await store.publishItem(fd)
    }
    showSuccess.value = true
    setTimeout(() => {
      router.push('/secondhand/my')
    }, 1500)
  } catch (e) {
    alert(e.message || '提交失败')
  } finally {
    submitting.value = false
  }
}

function goBack() {
  router.back()
}

async function loadEditData() {
  if (!isEdit.value) return
  const item = await store.fetchItemDetail(route.query.id)
  if (item) {
    form.images = item.images || []
    form.category = item.category || ''
    form.title = item.title || ''
    form.description = item.description || ''
    form.condition = item.condition || ''
    form.quantity = item.quantity || 1
    form.originalPrice = item.originalPrice
    form.sellingPrice = item.sellingPrice
    form.isPriceNegotiable = item.isPriceNegotiable || false
    form.deliveryMethods.pickUp = item.deliveryMethods?.pickUp || false
    form.deliveryMethods.shipping = item.deliveryMethods?.shipping || false
    form.deliveryMethods.shippingFee = item.deliveryMethods?.shippingFee || 0
    form.location.city = item.location?.city || ''
    form.location.district = item.location?.district || ''
  }
}

onMounted(() => {
  loadEditData()
  setTimeout(setupObserver, 100)
})

onUnmounted(() => {
  observer?.disconnect()
})
</script>

<style scoped>
.publish-page {
  min-height: calc(100vh - 120px);
  padding-bottom: 100px;
  background: var(--color-bg);
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: var(--color-bg-white);
  border-bottom: 1px solid var(--color-border-light);
  position: sticky;
  top: 0;
  z-index: 20;
}

.back-btn {
  width: 44px;
  height: 44px;
  border: none;
  background: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  color: var(--color-text-primary);
  transition: background 0.2s;
}

.back-btn:hover { background: var(--color-bg-muted); }
.back-btn:active { transform: scale(0.92); }

.page-title {
  font-size: 17px;
  font-weight: 700;
  margin: 0;
}

.header-placeholder { width: 44px; }

/* Step bar */
.step-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 12px 16px 0;
  padding: 14px 20px;
  background: var(--color-bg-white, #fff);
  border-radius: 14px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.04);
  position: relative;
}
.step-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  z-index: 1;
  cursor: pointer;
  transition: all 0.3s;
}
.step-dot {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 700;
  background: var(--color-bg-light);
  color: var(--color-text-muted);
  border: 2px solid var(--color-border);
  transition: all 0.3s;
}
.step-item.active .step-dot {
  background: var(--color-primary);
  color: #fff;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 4px rgba(16,185,129,0.15);
}
.step-item.done .step-dot {
  background: var(--color-primary);
  color: #fff;
  border-color: var(--color-primary);
}
.step-label {
  font-size: 11px;
  font-weight: 500;
  color: var(--color-text-muted);
}
.step-item.active .step-label {
  color: var(--color-primary);
  font-weight: 600;
}
.step-item.done .step-label {
  color: var(--color-primary);
}
.step-line {
  position: absolute;
  left: 50px;
  right: 50px;
  top: 50%;
  height: 2px;
  background: var(--color-border);
  transform: translateY(-8px);
  z-index: 0;
}
.step-line-fill {
  height: 100%;
  background: var(--color-primary);
  transition: width 0.4s ease;
  border-radius: 1px;
}

/* Section header with icon wrap */
.section-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.section-icon-wrap {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.section-title {
  font-size: 15px;
  font-weight: 700;
  margin: 0;
  color: var(--color-text-primary);
}

.section-desc {
  font-size: 12px;
  color: var(--color-text-muted);
  margin: 2px 0 0;
}

.section-hint {
  font-size: 12px;
  color: var(--color-text-muted);
  margin-left: auto;
}
.success-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
}

.success-content {
  background: var(--color-bg-white);
  border-radius: var(--radius-xl);
  padding: 40px 48px;
  text-align: center;
  animation: spring-pop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.success-icon { margin-bottom: 16px; }

.success-content h3 {
  font-size: 20px;
  font-weight: 700;
  margin: 0 0 8px;
  color: var(--color-text-primary);
}

.success-content p {
  font-size: 14px;
  color: var(--color-text-muted);
  margin: 0;
}

@keyframes spring-pop {
  0% { transform: scale(0.6); opacity: 0; }
  100% { transform: scale(1); opacity: 1; }
}

.fade-enter-active { transition: opacity 0.3s; }
.fade-leave-active { transition: opacity 0.2s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

/* Form */
.publish-form {
  padding: 0 0 20px;
}

.form-section {
  background: var(--color-bg-white);
  padding: 20px;
  margin-top: 8px;
  border-radius: 16px;
  border-left: 3px solid transparent;
  transition: border-color 0.3s;
}

.form-section:nth-child(2) { border-left-color: #10B981; }
.form-section:nth-child(3) { border-left-color: #3B82F6; }
.form-section:nth-child(4) { border-left-color: #D97706; }
.form-section:nth-child(5) { border-left-color: #EC4899; }
.form-section:nth-child(6) { border-left-color: #8B5CF6; }

.discount-badge {
  margin-left: auto;
  padding: 2px 10px;
  border-radius: var(--radius-full);
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(239, 68, 68, 0.15));
  color: var(--color-danger);
  font-size: 12px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

.field-label {
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text-primary);
  margin: 16px 0 6px;
}

.field-label.no-margin { margin: 0; }

.field-label.required::after {
  content: ' *';
  color: var(--color-danger);
}

.field-input, .field-select, .field-textarea {
  width: 100%;
  padding: 12px 14px;
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: 14px;
  background: var(--color-bg-white);
  color: var(--color-text-primary);
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.field-input:focus, .field-select:focus, .field-textarea:focus {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.12);
}

.field-input.error, .field-select.error {
  border-color: var(--color-danger);
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
}

.field-input.short { max-width: 200px; }

.field-textarea {
  resize: vertical;
  min-height: 80px;
  line-height: 1.6;
}

.field-select {
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L5 5L9 1' stroke='%23999' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 12px center;
  cursor: pointer;
}

.field-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.field-error {
  font-size: 12px;
  color: var(--color-danger);
  margin: 4px 0 0;
}

.field-warning {
  font-size: 12px;
  color: var(--color-warning, #f59e0b);
  margin: 4px 0 0;
}

.field-count {
  font-size: 11px;
  color: var(--color-text-muted);
  margin: 4px 0 0;
  text-align: right;
}

.image-tip {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--color-text-muted);
  margin: 10px 0 0;
  padding: 8px 12px;
  background: var(--color-bg-muted);
  border-radius: var(--radius-md);
}

/* Condition cards */
.condition-cards {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
  margin-top: 8px;
}

.condition-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 14px 8px;
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-bg-white);
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.22, 1, 0.36, 1);
  position: relative;
}

.condition-card:hover {
  border-color: var(--color-primary);
  background: rgba(16, 185, 129, 0.03);
}

.condition-card:active {
  transform: scale(0.97);
}

.condition-card.active {
  border-color: var(--color-primary);
  background: rgba(16, 185, 129, 0.06);
  box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.12);
}

.condition-card.active .condition-icon {
  color: var(--color-primary);
}

.condition-icon {
  color: var(--color-text-muted);
  transition: color 0.2s;
}

.condition-card.active .condition-icon {
  color: var(--color-primary);
}

.condition-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text-primary);
}

.condition-desc {
  font-size: 11px;
  color: var(--color-text-muted);
}

/* Price */
.price-row {
  display: flex;
  align-items: flex-end;
  gap: 12px;
}

.price-field {
  flex: 1;
}

.price-arrow {
  padding-bottom: 12px;
  flex-shrink: 0;
}

.price-errors {
  min-height: 20px;
}

/* Switch row */
.switch-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 0;
  border-top: 1px solid var(--color-border-light);
  margin-top: 12px;
}

.switch-label {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.switch-hint {
  font-size: 12px;
  color: var(--color-text-muted);
}

/* Delivery cards */
.delivery-cards {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
  margin-top: 8px;
}

.delivery-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 18px 12px;
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-bg-white);
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.22, 1, 0.36, 1);
  position: relative;
}

.delivery-card:hover {
  border-color: var(--color-primary);
}

.delivery-card:active {
  transform: scale(0.97);
}

.delivery-card.active {
  border-color: var(--color-primary);
  background: rgba(16, 185, 129, 0.06);
  box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.12);
}

.delivery-icon {
  color: var(--color-text-muted);
  transition: color 0.2s;
}

.delivery-card.active .delivery-icon {
  color: var(--color-primary);
}

.delivery-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text-primary);
}

.delivery-desc {
  font-size: 11px;
  color: var(--color-text-muted);
}

.delivery-check {
  position: absolute;
  top: 8px;
  right: 8px;
}

.shipping-fee-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 0 0;
  flex-wrap: wrap;
}

.shipping-fee-row .field-input { max-width: 140px; }
.shipping-fee-row .field-label { margin: 0; }

.fee-hint {
  font-size: 12px;
  color: var(--color-text-muted);
}

.fee-hint.free {
  color: var(--color-primary);
  font-weight: 600;
}

/* Location */
.location-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

/* Tips */
.tips-section {
  margin: 12px 16px 0;
  padding: 14px 16px;
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.06), rgba(245, 158, 11, 0.02));
  border: 1px solid rgba(245, 158, 11, 0.15);
  border-radius: var(--radius-lg);
}

.tips-header {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 600;
  color: var(--color-warning, #f59e0b);
  margin-bottom: 8px;
}

.tips-list {
  margin: 0;
  padding: 0 0 0 18px;
  list-style: disc;
}

.tips-list li {
  font-size: 12px;
  color: var(--color-text-secondary);
  line-height: 1.8;
}

/* Submit */
.submit-area {
  padding: 20px 16px;
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: var(--color-bg-white);
  border-top: 1px solid var(--color-border);
  z-index: 40;
}

.submit-btn {
  width: 100%;
  padding: 14px 0;
  border: none;
  border-radius: var(--radius-full);
  background: linear-gradient(135deg, #10B981, #059669);
  color: #fff;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.22, 1, 0.36, 1);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  box-shadow: 0 4px 16px rgba(16, 185, 129, 0.3);
}

.submit-btn:hover:not(:disabled) {
  box-shadow: 0 6px 24px rgba(16, 185, 129, 0.4);
  transform: translateY(-1px);
}

.submit-btn:active:not(:disabled) {
  transform: scale(0.98);
}

.submit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-spinner {
  width: 18px;
  height: 18px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

@keyframes spin { to { transform: rotate(360deg); } }

@media (prefers-reduced-motion: reduce) {
  .step-bar,
  .step-item,
  .step-dot,
  .step-line-fill,
  .condition-card,
  .delivery-card,
  .submit-btn,
  .back-btn {
    transition-duration: 0.01ms !important;
  }
  .success-content {
    animation: none;
  }
}

@media (max-width: 768px) {
  .form-section { padding: 16px; }
  .submit-area { padding: 16px 12px; }
  .price-row { flex-direction: column; gap: 0; }
  .price-arrow { display: none; }
  .location-row { grid-template-columns: 1fr; }
  .condition-cards { grid-template-columns: repeat(2, 1fr); }
  .step-label { font-size: 10px; }
  .step-dot { width: 24px; height: 24px; font-size: 11px; }
  .step-line { left: 40px; right: 40px; }
}
</style>