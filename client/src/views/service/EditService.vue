<template>
  <div class="edit-page">
    <div class="page-header">
      <n-button quaternary @click="router.back()">
        <template #icon><svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></template>
        返回
      </n-button>
      <h2 class="header-title">编辑服务</h2>
      <div style="width:60px"></div>
    </div>

    <div v-if="pageLoading" class="loading-wrap">
      <div class="spinner"></div>
      <span class="loading-text">加载中...</span>
    </div>

    <template v-else>
      <n-form ref="formRef" :model="formData" :rules="rules" label-placement="top" class="publish-form">
        <!-- 基本信息 -->
        <div class="form-section">
          <h3 class="section-title">基本信息</h3>
          <n-form-item label="服务名称" path="serviceName">
            <n-input v-model:value="formData.serviceName" placeholder="如：专业猫咪洗澡" maxlength="100" show-count />
          </n-form-item>
          <n-form-item label="服务分类" path="category">
            <n-select v-model:value="formData.category" :options="categoryOptions" placeholder="选择分类" />
          </n-form-item>
          <n-form-item label="服务描述" path="description">
            <n-input v-model:value="formData.description" type="textarea" placeholder="详细描述您的服务内容" :rows="4" maxlength="2000" show-count />
          </n-form-item>
          <n-form-item label="适用宠物">
            <n-checkbox-group v-model:value="formData.applicablePets">
              <n-space>
                <n-checkbox value="cat" label="猫" /><n-checkbox value="dog" label="狗" />
                <n-checkbox value="rabbit" label="兔" /><n-checkbox value="bird" label="鸟" />
                <n-checkbox value="hamster" label="仓鼠" /><n-checkbox value="other" label="其他" />
              </n-space>
            </n-checkbox-group>
          </n-form-item>
        </div>

        <!-- 价格设置 -->
        <div class="form-section">
          <h3 class="section-title">价格设置</h3>
          <n-form-item label="定价方式" path="pricing.type">
            <n-radio-group v-model:value="formData.pricing.type">
              <n-space><n-radio value="fixed">固定价格</n-radio><n-radio value="range">价格区间</n-radio></n-space>
            </n-radio-group>
          </n-form-item>
          <n-form-item v-if="formData.pricing.type === 'fixed'" label="价格 (元)" path="pricing.price">
            <n-input-number v-model:value="formData.pricing.price" :min="0" placeholder="0" style="width:100%" />
          </n-form-item>
          <n-form-item v-if="formData.pricing.type === 'range'" label="价格区间 (元)">
            <n-space><n-input-number v-model:value="formData.pricing.priceMin" :min="0" placeholder="最低" /><span style="line-height:32px;color:#999">-</span><n-input-number v-model:value="formData.pricing.priceMax" :min="0" placeholder="最高" /></n-space>
          </n-form-item>
          <n-form-item label="计价单位">
            <n-input v-model:value="formData.pricing.unit" placeholder="次" style="width:120px" />
          </n-form-item>
        </div>

        <!-- 营业时间 -->
        <div class="form-section">
          <h3 class="section-title">营业时间</h3>
          <div v-for="(day, key) in dayLabels" :key="key" class="hours-row">
            <span class="day-label">{{ day }}</span>
            <n-switch v-model:value="formData.businessHours[key].closed" size="small" />
            <span class="closed-label" v-if="formData.businessHours[key].closed">休息</span>
            <template v-else>
              <n-time-picker v-model:value="formData.businessHours[key].openTs" format="HH:mm" :actions="['confirm']" style="width:100px" />
              <span style="color:#999">-</span>
              <n-time-picker v-model:value="formData.businessHours[key].closeTs" format="HH:mm" :actions="['confirm']" style="width:100px" />
            </template>
          </div>
        </div>

        <!-- 图片上传 -->
        <div class="form-section">
          <h3 class="section-title">服务图片</h3>
          <ImageUploader v-model="formData.images" :max="10" />
        </div>

        <!-- 地址信息 -->
        <div class="form-section">
          <h3 class="section-title">地址信息</h3>
          <n-form-item label="所在城市">
            <n-input v-model:value="formData.location.city" placeholder="如：北京" />
          </n-form-item>
          <n-form-item label="详细地址">
            <n-input v-model:value="formData.location.address" placeholder="街道门牌号" />
          </n-form-item>
          <n-form-item>
            <n-checkbox v-model:checked="formData.location.isHomeService">支持上门服务</n-checkbox>
          </n-form-item>
        </div>
      </n-form>

      <div class="bottom-bar">
        <n-button type="primary" size="large" strong :loading="submitting" class="submit-btn" @click="handleSubmit">
          保存修改
        </n-button>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useMessage } from 'naive-ui'
import { getServiceDetail, updateService } from '../../api/service'
import ImageUploader from '../../components/common/ImageUploader.vue'

const route = useRoute()
const router = useRouter()
const message = useMessage()

const formRef = ref(null)
const submitting = ref(false)
const pageLoading = ref(true)

const serviceId = route.params.id

const categoryOptions = [
  { label: '美容洗护', value: 'grooming' }, { label: '寄养', value: 'boarding' },
  { label: '遛狗', value: 'walking' }, { label: '训练', value: 'training' },
  { label: '摄影', value: 'photography' }, { label: '殡葬', value: 'funeral' }
]

const dayLabels = { monday: '周一', tuesday: '周二', wednesday: '周三', thursday: '周四', friday: '周五', saturday: '周六', sunday: '周日' }

function makeDay() { return { open: '09:00', close: '18:00', closed: false, openTs: Date.now(), closeTs: Date.now() } }

function timeToTs(str) {
  if (!str) return Date.now()
  const [h, m] = str.split(':').map(Number)
  const d = new Date(); d.setHours(h, m, 0, 0); return d.getTime()
}

const formData = reactive({
  serviceName: '', category: '', description: '',
  applicablePets: ['cat', 'dog'],
  pricing: { type: 'fixed', price: null, priceMin: null, priceMax: null, unit: '次' },
  businessHours: { monday: makeDay(), tuesday: makeDay(), wednesday: makeDay(), thursday: makeDay(), friday: makeDay(), saturday: makeDay(), sunday: makeDay() },
  images: [],
  location: { city: '', address: '', isHomeService: false }
})


const rules = {
  serviceName: { required: true, message: '请输入服务名称', trigger: ['blur'] },
  category: { required: true, message: '请选择分类', trigger: ['change'] },
  description: { required: true, message: '请输入服务描述', trigger: ['blur'] },
  'pricing.type': { required: true, trigger: ['change'] }
}


function formatTime(ts) {
  if (!ts) return '09:00'
  const d = new Date(ts)
  return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`
}

async function loadService() {
  pageLoading.value = true
  try {
    const res = await getServiceDetail(serviceId)
    const svc = res.data.service
    if (!svc) { message.error('服务不存在'); router.replace('/merchant'); return }

    formData.serviceName = svc.serviceName || ''
    formData.category = svc.category || ''
    formData.description = svc.description || ''
    formData.applicablePets = svc.applicablePets || ['cat', 'dog']

    if (svc.pricing) {
      formData.pricing.type = svc.pricing.type || 'fixed'
      formData.pricing.price = svc.pricing.price ?? null
      formData.pricing.priceMin = svc.pricing.priceMin ?? null
      formData.pricing.priceMax = svc.pricing.priceMax ?? null
      formData.pricing.unit = svc.pricing.unit || '次'
    }

    if (svc.businessHours) {
      for (const key of Object.keys(dayLabels)) {
        const bh = svc.businessHours[key]
        if (bh) {
          formData.businessHours[key].closed = bh.closed || false
          formData.businessHours[key].open = bh.open || '09:00'
          formData.businessHours[key].close = bh.close || '18:00'
          formData.businessHours[key].openTs = timeToTs(bh.open)
          formData.businessHours[key].closeTs = timeToTs(bh.close)
        }
      }
    }

    if (svc.location) {
      formData.location.city = svc.location.city || ''
      formData.location.address = svc.location.address || ''
      formData.location.isHomeService = svc.location.isHomeService || false
    }

    formData.images = [...(svc.images || [])]
  } catch (e) {
    message.error(e.message || '加载失败')
    router.replace('/merchant')
  } finally {
    pageLoading.value = false
  }
}

async function handleSubmit() {
  try { await formRef.value?.validate() } catch { return }
  submitting.value = true
  try {
    const data = new FormData()
    data.append('serviceName', formData.serviceName)
    data.append('category', formData.category)
    data.append('description', formData.description)
    data.append('applicablePets', JSON.stringify(formData.applicablePets))
    data.append('pricing', JSON.stringify({
      type: formData.pricing.type,
      price: formData.pricing.price,
      priceMin: formData.pricing.priceMin,
      priceMax: formData.pricing.priceMax,
      unit: formData.pricing.unit || '次'
    }))
    const bh = {}
    for (const [k, v] of Object.entries(formData.businessHours)) {
      bh[k] = { open: formatTime(v.openTs), close: formatTime(v.closeTs), closed: v.closed }
    }
    data.append('businessHours', JSON.stringify(bh))
    data.append('location', JSON.stringify(formData.location))
    formData.images.forEach(url => data.append('existingImages', url))

    await updateService(serviceId, data)
    message.success('修改已保存！')
    router.replace(`/services/${serviceId}`)
  } catch (e) { message.error(e.message || '保存失败') }
  finally { submitting.value = false }
}

onMounted(loadService)
</script>

<style scoped>
.edit-page { min-height: 100vh; background: #f8faf9; padding-bottom: 80px; }
.page-header { display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; position: sticky; top: 0; z-index: 20; background: rgba(255,255,255,0.9); backdrop-filter: blur(16px); }
.header-title { font-size: 17px; font-weight: 700; color: #1a1a2e; margin: 0; }

.loading-wrap { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 60vh; gap: 14px; }
.spinner { width: 30px; height: 30px; border: 2.5px solid #e5e7eb; border-top-color: #10b981; border-radius: 50%; animation: spin 0.7s linear infinite; }
.loading-text { font-size: 13px; color: #9ca3af; }
@keyframes spin { to { transform: rotate(360deg); } }

.publish-form { padding: 0 16px; }
.form-section { background: #fff; border-radius: 14px; padding: 18px; margin-bottom: 12px; box-shadow: 0 1px 4px rgba(0,0,0,0.03); }
.section-title { font-size: 15px; font-weight: 700; color: #1a1a2e; margin: 0 0 14px; }

.hours-row { display: flex; align-items: center; gap: 10px; padding: 8px 0; border-bottom: 1px solid #f5f5f5; }
.hours-row:last-child { border-bottom: none; }
.day-label { width: 36px; font-size: 13px; font-weight: 500; color: #555; flex-shrink: 0; }
.closed-label { font-size: 13px; color: #bbb; }

.bottom-bar { position: fixed; bottom: 0; left: 0; right: 0; padding: 12px 20px; background: rgba(255,255,255,0.95); backdrop-filter: blur(16px); border-top: 1px solid rgba(0,0,0,0.05); z-index: 100; }
.submit-btn { width: 100%; background: linear-gradient(135deg, #10b981, #059669); border: none; border-radius: 14px; height: 48px; font-size: 16px; font-weight: 700; box-shadow: 0 4px 16px rgba(16,185,129,0.35); }

@media (max-width: 768px) { .form-section { margin: 8px 12px; padding: 14px; } .hours-row { flex-wrap: wrap; } }
</style>