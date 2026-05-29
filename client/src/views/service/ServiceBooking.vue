<template>
  <div class="booking-page">
    <!-- 顶部 -->
    <div class="page-header">
      <n-button quaternary @click="router.back()">
        <template #icon><svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></template>
        返回
      </n-button>
      <h2 class="header-title">预约服务</h2>
      <div style="width:60px"></div>
    </div>

    <!-- 服务摘要 -->
    <div class="service-summary" v-if="service">
      <img v-if="service.images?.length" :src="resolveFileUrl(service.images[0])" class="summary-img" :alt="service.serviceName" />
      <div class="summary-info">
        <h3>{{ service.serviceName }}</h3>
        <span class="summary-price">¥{{ priceText }}/{{ service.pricing?.unit || '次' }}</span>
      </div>
    </div>

    <!-- 表单 -->
    <n-form ref="formRef" :model="formData" :rules="rules" label-placement="top" class="booking-form">
      <!-- 宠物信息 -->
      <div class="form-section">
        <h3 class="section-title">宠物信息</h3>
        <n-form-item label="宠物名称" path="petInfo.petName">
          <n-input v-model:value="formData.petInfo.petName" placeholder="请输入宠物名称" />
        </n-form-item>
        <n-form-item label="宠物种类" path="petInfo.species">
          <n-select v-model:value="formData.petInfo.species" :options="speciesOptions" placeholder="选择种类" />
        </n-form-item>
        <n-form-item label="品种">
          <n-input v-model:value="formData.petInfo.breed" placeholder="选填" />
        </n-form-item>
        <n-form-item label="体重 (kg)">
          <n-input-number v-model:value="formData.petInfo.weight" :min="0" placeholder="选填" style="width:100%" />
        </n-form-item>
        <n-form-item label="特殊需求">
          <n-input v-model:value="formData.petInfo.specialNeeds" type="textarea" placeholder="如过敏、性格等" :rows="2" />
        </n-form-item>
      </div>

      <!-- 预约时间 -->
      <div class="form-section">
        <h3 class="section-title">预约时间</h3>
        <n-form-item label="预约日期" path="appointment.date">
          <n-date-picker v-model:value="formData.appointment.date" type="date" :is-date-disabled="dateDisabled" style="width:100%" />
        </n-form-item>
        <n-form-item label="时间段" path="appointment.timeSlot">
          <n-select v-model:value="formData.appointment.timeSlot" :options="timeSlotOptions" placeholder="选择时间段" />
        </n-form-item>
      </div>

      <!-- 联系方式 -->
      <div class="form-section">
        <h3 class="section-title">联系方式</h3>
        <n-form-item label="联系人" path="contact.name">
          <n-input v-model:value="formData.contact.name" placeholder="请输入联系人姓名" />
        </n-form-item>
        <n-form-item label="联系电话" path="contact.phone">
          <n-input v-model:value="formData.contact.phone" placeholder="请输入手机号" />
        </n-form-item>
        <n-form-item label="地址" v-if="service?.location?.isHomeService">
          <n-input v-model:value="formData.contact.address" placeholder="上门服务地址" />
        </n-form-item>
      </div>

      <!-- 备注 -->
      <div class="form-section">
        <n-form-item label="备注">
          <n-input v-model:value="formData.customerNote" type="textarea" placeholder="其他需要告知商家的信息" :rows="3" />
        </n-form-item>
      </div>
    </n-form>

    <!-- 底部 -->
    <div class="bottom-bar">
      <div class="bar-price">
        <span class="bar-label">预估费用</span>
        <span class="bar-symbol">¥</span>
        <span class="bar-value">{{ priceText }}</span>
      </div>
      <n-button type="primary" size="large" strong :loading="submitting" class="submit-btn" @click="handleSubmit">
        提交预约
      </n-button>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useMessage } from 'naive-ui'
import { getServiceDetail, createOrder } from '../../api/service'
import { resolveFileUrl } from '../../utils/fileUrl'

const route = useRoute()
const router = useRouter()
const message = useMessage()

const service = ref(null)
const submitting = ref(false)
const formRef = ref(null)

const formData = reactive({
  petInfo: { petName: '', species: '', breed: '', weight: null, specialNeeds: '' },
  appointment: { date: null, timeSlot: '' },
  contact: { name: '', phone: '', address: '' },
  customerNote: ''
})

const rules = {
  'petInfo.petName': { required: true, message: '请输入宠物名称', trigger: ['blur'] },
  'petInfo.species': { required: true, message: '请选择宠物种类', trigger: ['change'] },
  'appointment.date': { required: true, type: 'number', message: '请选择预约日期', trigger: ['change'] },
  'appointment.timeSlot': { required: true, message: '请选择时间段', trigger: ['change'] },
  'contact.name': { required: true, message: '请输入联系人', trigger: ['blur'] },
  'contact.phone': { required: true, message: '请输入联系电话', trigger: ['blur'] }
}

const speciesOptions = [
  { label: '猫', value: 'cat' }, { label: '狗', value: 'dog' },
  { label: '兔', value: 'rabbit' }, { label: '鸟', value: 'bird' },
  { label: '鱼', value: 'fish' }, { label: '仓鼠', value: 'hamster' },
  { label: '其他', value: 'other' }
]

const timeSlotOptions = [
  { label: '09:00 - 10:00', value: '09:00-10:00' },
  { label: '10:00 - 11:00', value: '10:00-11:00' },
  { label: '11:00 - 12:00', value: '11:00-12:00' },
  { label: '13:00 - 14:00', value: '13:00-14:00' },
  { label: '14:00 - 15:00', value: '14:00-15:00' },
  { label: '15:00 - 16:00', value: '15:00-16:00' },
  { label: '16:00 - 17:00', value: '16:00-17:00' },
  { label: '17:00 - 18:00', value: '17:00-18:00' }
]

const priceText = computed(() => {
  const p = service.value?.pricing
  if (!p) return '面议'
  if (p.type === 'range' && p.priceMin != null && p.priceMax != null) return `${p.priceMin}-${p.priceMax}`
  if (p.price != null) return p.price.toString()
  return '面议'
})

function dateDisabled(ts) {
  return ts < Date.now() - 86400000
}

async function handleSubmit() {
  try { await formRef.value?.validate() } catch { return }
  submitting.value = true
  try {
    const data = {
      serviceId: route.params.id,
      petInfo: { ...formData.petInfo },
      appointment: {
        date: new Date(formData.appointment.date).toISOString(),
        timeSlot: formData.appointment.timeSlot
      },
      contact: { ...formData.contact },
      customerNote: formData.customerNote
    }
    const res = await createOrder(data)
    message.success('预约成功！')
    router.replace(`/services/orders/${res.data.order._id}`)
  } catch (e) {
    message.error(e.message || '预约失败')
  } finally {
    submitting.value = false
  }
}

onMounted(async () => {
  try {
    const res = await getServiceDetail(route.params.id)
    service.value = res.data.service
  } catch { message.error('获取服务信息失败') }
})
</script>

<style scoped>
.booking-page {
  min-height: 100vh;
  padding-bottom: 90px;
  background: #f8faf9;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  position: sticky;
  top: 0;
  z-index: 20;
  background: rgba(255,255,255,0.9);
  backdrop-filter: blur(16px);
}

.header-title { font-size: 17px; font-weight: 700; color: #1a1a2e; margin: 0; }

.service-summary {
  display: flex;
  gap: 12px;
  margin: 12px 16px;
  padding: 14px;
  background: #fff;
  border-radius: 14px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.03);
}

.summary-img { width: 72px; height: 72px; border-radius: 10px; object-fit: cover; }
.summary-info { display: flex; flex-direction: column; justify-content: center; gap: 6px; }
.summary-info h3 { font-size: 15px; font-weight: 700; color: #1a1a2e; margin: 0; }
.summary-price { font-size: 16px; font-weight: 700; color: #ef4444; }

.booking-form { padding: 0 16px; }

.form-section {
  background: #fff;
  border-radius: 14px;
  padding: 18px;
  margin-bottom: 12px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.03);
}

.section-title { font-size: 15px; font-weight: 700; color: #1a1a2e; margin: 0 0 14px; }

.bottom-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 20px;
  background: rgba(255,255,255,0.95);
  backdrop-filter: blur(16px);
  border-top: 1px solid rgba(0,0,0,0.05);
  z-index: 100;
}

.bar-label { font-size: 12px; color: #999; display: block; margin-bottom: 2px; }
.bar-price { display: flex; flex-wrap: wrap; align-items: baseline; }
.bar-symbol { font-size: 14px; font-weight: 700; color: #ef4444; }
.bar-value { font-size: 24px; font-weight: 800; color: #ef4444; letter-spacing: -0.5px; }

.submit-btn {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  border: none;
  border-radius: 14px;
  height: 48px;
  padding: 0 36px;
  font-size: 16px;
  font-weight: 700;
  box-shadow: 0 4px 16px rgba(16,185,129,0.35);
}
</style>