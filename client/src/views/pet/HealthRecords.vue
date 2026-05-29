<template>
  <div class="health-records-page">
    <div class="page-header">
      <n-button quaternary @click="goBack" class="back-btn">
        <template #icon>←</template>
        返回
      </n-button>
      <h1>{{ petName }} - 健康记录</h1>
    </div>

    <n-spin :show="pageLoading">
      <div class="records-container">
        <n-tabs type="line" v-model:value="activeTab">
          <n-tab-pane name="vaccines" tab="疫苗记录">
            <div class="record-section">
              <div class="section-header">
                <h3>疫苗记录</h3>
                <n-button type="primary" size="small" @click="openAddModal('vaccine')">
                  + 添加疫苗
                </n-button>
              </div>
              <div v-if="vaccines.length > 0" class="record-list">
                <div v-for="vac in vaccines" :key="vac._id" class="record-item">
                  <div class="record-info">
                    <div class="record-title">{{ vac.name }}</div>
                    <div class="record-meta">
                      <span>接种日期：{{ formatDate(vac.date) }}</span>
                      <span v-if="vac.hospital">医院：{{ vac.hospital }}</span>
                      <span v-if="vac.nextDate">下次接种：{{ formatDate(vac.nextDate) }}</span>
                    </div>
                  </div>
                  <n-popconfirm
                    title="确定删除这条疫苗记录？"
                    positive-text="确定"
                    negative-text="取消"
                    @positive-click="handleDeleteRecord('vaccine', vac._id)"
                  >
                    <template #trigger>
                      <n-button text type="error" size="small" class="delete-btn">删除</n-button>
                    </template>
                  </n-popconfirm>
                </div>
              </div>
              <div v-else class="empty-records">
                <p>暂无疫苗记录</p>
                <p class="empty-hint">点击上方按钮添加第一条疫苗记录</p>
              </div>
            </div>
          </n-tab-pane>

          <n-tab-pane name="dewormings" tab="驱虫记录">
            <div class="record-section">
              <div class="section-header">
                <h3>驱虫记录</h3>
                <n-button type="primary" size="small" @click="openAddModal('deworming')">
                  + 添加驱虫
                </n-button>
              </div>
              <div v-if="dewormings.length > 0" class="record-list">
                <div v-for="dew in dewormings" :key="dew._id" class="record-item">
                  <div class="record-info">
                    <div class="record-title">{{ dew.type === 'internal' ? '体内驱虫' : '体外驱虫' }}</div>
                    <div class="record-meta">
                      <span>驱虫日期：{{ formatDate(dew.date) }}</span>
                      <span v-if="dew.medicine">药物：{{ dew.medicine }}</span>
                      <span v-if="dew.nextDate">下次驱虫：{{ formatDate(dew.nextDate) }}</span>
                    </div>
                  </div>
                  <n-popconfirm
                    title="确定删除这条驱虫记录？"
                    positive-text="确定"
                    negative-text="取消"
                    @positive-click="handleDeleteRecord('deworming', dew._id)"
                  >
                    <template #trigger>
                      <n-button text type="error" size="small" class="delete-btn">删除</n-button>
                    </template>
                  </n-popconfirm>
                </div>
              </div>
              <div v-else class="empty-records">
                <p>暂无驱虫记录</p>
                <p class="empty-hint">点击上方按钮添加第一条驱虫记录</p>
              </div>
            </div>
          </n-tab-pane>

          <n-tab-pane name="medical" tab="病史记录">
            <div class="record-section">
              <div class="section-header">
                <h3>病史记录</h3>
                <n-button type="primary" size="small" @click="openAddModal('medical')">
                  + 添加病历
                </n-button>
              </div>
              <div v-if="medicalHistory.length > 0" class="record-list">
                <div v-for="med in medicalHistory" :key="med._id" class="record-item">
                  <div class="record-info">
                    <div class="record-title">{{ med.diagnosis }}</div>
                    <div class="record-meta">
                      <span>就诊日期：{{ formatDate(med.date) }}</span>
                      <span v-if="med.treatment">治疗：{{ med.treatment }}</span>
                      <span v-if="med.hospital">医院：{{ med.hospital }}</span>
                    </div>
                  </div>
                  <n-popconfirm
                    title="确定删除这条病历记录？"
                    positive-text="确定"
                    negative-text="取消"
                    @positive-click="handleDeleteRecord('medical', med._id)"
                  >
                    <template #trigger>
                      <n-button text type="error" size="small" class="delete-btn">删除</n-button>
                    </template>
                  </n-popconfirm>
                </div>
              </div>
              <div v-else class="empty-records">
                <p>暂无病史记录</p>
                <p class="empty-hint">点击上方按钮添加第一条病历记录</p>
              </div>
            </div>
          </n-tab-pane>
        </n-tabs>
      </div>
    </n-spin>

    <n-modal v-model:show="showModal" preset="card" :title="modalTitle" style="max-width: 500px;">
      <n-form ref="modalFormRef" :model="modalForm" :rules="modalRules" label-placement="top">
        <template v-if="currentType === 'vaccine'">
          <n-form-item label="疫苗名称" path="name">
            <n-input v-model:value="modalForm.name" placeholder="例如：狂犬疫苗" />
          </n-form-item>
          <n-form-item label="接种日期" path="date">
            <n-date-picker v-model:value="modalForm.date" type="date" placeholder="选择日期" style="width: 100%;" />
          </n-form-item>
          <n-form-item label="下次接种日期">
            <n-date-picker v-model:value="modalForm.nextDate" type="date" placeholder="选择日期" style="width: 100%;" />
          </n-form-item>
          <n-form-item label="接种医院">
            <n-input v-model:value="modalForm.hospital" placeholder="例如：XX宠物医院" />
          </n-form-item>
        </template>

        <template v-if="currentType === 'deworming'">
          <n-form-item label="驱虫类型" path="type">
            <n-select v-model:value="modalForm.type" :options="dewormingTypeOptions" placeholder="选择类型" />
          </n-form-item>
          <n-form-item label="驱虫日期" path="date">
            <n-date-picker v-model:value="modalForm.date" type="date" placeholder="选择日期" style="width: 100%;" />
          </n-form-item>
          <n-form-item label="下次驱虫日期">
            <n-date-picker v-model:value="modalForm.nextDate" type="date" placeholder="选择日期" style="width: 100%;" />
          </n-form-item>
          <n-form-item label="使用药物">
            <n-input v-model:value="modalForm.medicine" placeholder="例如：福来恩" />
          </n-form-item>
        </template>

        <template v-if="currentType === 'medical'">
          <n-form-item label="就诊日期" path="date">
            <n-date-picker v-model:value="modalForm.date" type="date" placeholder="选择日期" style="width: 100%;" />
          </n-form-item>
          <n-form-item label="诊断结果" path="diagnosis">
            <n-input v-model:value="modalForm.diagnosis" placeholder="例如：皮肤真菌感染" />
          </n-form-item>
          <n-form-item label="治疗方案">
            <n-input v-model:value="modalForm.treatment" type="textarea" placeholder="治疗方案描述" :rows="2" />
          </n-form-item>
          <n-form-item label="就诊医院">
            <n-input v-model:value="modalForm.hospital" placeholder="例如：XX宠物医院" />
          </n-form-item>
        </template>
      </n-form>

      <template #action>
        <n-button @click="showModal = false">取消</n-button>
        <n-button type="primary" :loading="submitting" @click="handleSubmitRecord">确定</n-button>
      </template>
    </n-modal>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useMessage } from 'naive-ui'
import { getPetById, addHealthRecord, deleteHealthRecord } from '../../api/pet'

const router = useRouter()
const route = useRoute()
const message = useMessage()

const petId = computed(() => route.params.id)
const pageLoading = ref(false)
const showModal = ref(false)
const submitting = ref(false)
const activeTab = ref(route.query.tab || 'vaccines')
const currentType = ref('')
const modalFormRef = ref(null)

const petData = ref(null)
const petName = computed(() => petData.value?.name || '宠物')

const vaccines = computed(() => petData.value?.healthRecords?.vaccines || [])
const dewormings = computed(() => petData.value?.healthRecords?.dewormings || [])
const medicalHistory = computed(() => petData.value?.healthRecords?.medicalHistory || [])

const dewormingTypeOptions = [
  { label: '体内驱虫', value: 'internal' },
  { label: '体外驱虫', value: 'external' }
]

const modalForm = reactive({
  name: '',
  date: null,
  nextDate: null,
  hospital: '',
  type: null,
  medicine: '',
  diagnosis: '',
  treatment: ''
})

const modalTitle = computed(() => {
  const map = {
    vaccine: '添加疫苗记录',
    deworming: '添加驱虫记录',
    medical: '添加病历记录'
  }
  return map[currentType.value] || '添加记录'
})

const modalRules = computed(() => {
  if (currentType.value === 'vaccine') {
    return {
      name: { required: true, trigger: ['blur', 'input'], message: '请输入疫苗名称' },
      date: { required: true, type: 'number', trigger: 'change', message: '请选择接种日期' }
    }
  }
  if (currentType.value === 'deworming') {
    return {
      type: { required: true, trigger: 'change', message: '请选择驱虫类型' },
      date: { required: true, type: 'number', trigger: 'change', message: '请选择驱虫日期' }
    }
  }
  if (currentType.value === 'medical') {
    return {
      date: { required: true, type: 'number', trigger: 'change', message: '请选择就诊日期' },
      diagnosis: { required: true, trigger: ['blur', 'input'], message: '请输入诊断结果' }
    }
  }
  return {}
})

onMounted(() => {
  window.scrollTo(0, 0)
  loadPetData()
})

watch(() => route.params.id, () => {
  loadPetData()
})

async function loadPetData() {
  pageLoading.value = true
  try {
    const result = await getPetById(petId)
    petData.value = result.data.pet || result.data
  } catch (error) {
    console.error('获取宠物信息失败:', error)
    message.error('获取宠物信息失败')
  } finally {
    pageLoading.value = false
  }
}

function resetModalForm() {
  modalForm.name = ''
  modalForm.date = null
  modalForm.nextDate = null
  modalForm.hospital = ''
  modalForm.type = null
  modalForm.medicine = ''
  modalForm.diagnosis = ''
  modalForm.treatment = ''
}

function openAddModal(type) {
  currentType.value = type
  resetModalForm()
  showModal.value = true
}

async function handleSubmitRecord() {
  try {
    await modalFormRef.value?.validate()
  } catch {
    return
  }

  submitting.value = true
  try {
    let record = {}

    if (currentType.value === 'vaccine') {
      record = {
        name: modalForm.name,
        date: new Date(modalForm.date).toISOString(),
        hospital: modalForm.hospital || undefined
      }
      if (modalForm.nextDate) {
        record.nextDate = new Date(modalForm.nextDate).toISOString()
      }
    } else if (currentType.value === 'deworming') {
      record = {
        type: modalForm.type,
        date: new Date(modalForm.date).toISOString(),
        medicine: modalForm.medicine || undefined
      }
      if (modalForm.nextDate) {
        record.nextDate = new Date(modalForm.nextDate).toISOString()
      }
    } else if (currentType.value === 'medical') {
      record = {
        date: new Date(modalForm.date).toISOString(),
        diagnosis: modalForm.diagnosis,
        treatment: modalForm.treatment || undefined,
        hospital: modalForm.hospital || undefined
      }
    }

    const result = await addHealthRecord(petId, {
      type: currentType.value,
      record
    })

    const updatedPet = result.data?.updatePet || result.data?.pet || result.data
    if (updatedPet) {
      petData.value = updatedPet
    } else {
      await loadPetData()
    }

    message.success('记录添加成功')
    showModal.value = false
  } catch (error) {
    console.error('添加记录失败:', error)
    message.error(error.message || '添加失败')
  } finally {
    submitting.value = false
  }
}

async function handleDeleteRecord(type, recordId) {
  try {
    const result = await deleteHealthRecord(petId, type, recordId)
    const updatedPet = result.data?.pet || result.data
    if (updatedPet) {
      petData.value = updatedPet
    } else {
      await loadPetData()
    }
    message.success('记录已删除')
  } catch (error) {
    console.error('删除记录失败:', error)
    message.error(error.message || '删除失败')
  }
}

function goBack() {
  router.push(`/pets/${petId}`)
}

function formatDate(date) {
  if (!date) return ''
  const d = new Date(date)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
</script>

<style scoped>
.health-records-page {
  padding: 8px 0;
  max-width: 800px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 24px;
}

.page-header h1 {
  font-size: 24px;
  font-weight: 700;
  color: var(--color-text-primary);
  margin: 0;
}

.back-btn {
  color: var(--color-primary);
}

.records-container {
  background: #fff;
  border-radius: var(--radius-md);
  padding: 20px;
  box-shadow: var(--shadow-md);
}

.record-section {
  padding-top: 8px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.section-header h3 {
  font-size: 15px;
  font-weight: 600;
  color: var(--color-text-primary);
  margin: 0;
}

.section-header :deep(.n-button) {
  border-radius: var(--radius-sm);
}

.record-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.record-item {
  background: var(--color-bg);
  padding: 14px 16px;
  border-radius: var(--radius-sm);
  border-left: 3px solid var(--color-primary);
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.record-info {
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex: 1;
}

.record-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--color-text-primary);
}

.record-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  font-size: 13px;
  color: var(--color-text-secondary);
}

.delete-btn {
  flex-shrink: 0;
  margin-left: 12px;
}

.empty-records {
  text-align: center;
  padding: 40px 0;
  color: var(--color-text-muted);
}

.empty-records p {
  margin: 4px 0;
  font-size: 14px;
}

.empty-hint {
  font-size: 12px;
  color: var(--color-text-muted);
}
</style>
