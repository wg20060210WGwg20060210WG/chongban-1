<template>
  <div class="edit-pet-page">
    <div class="page-header">
      <n-button quaternary @click="goBack" class="back-btn">
        <template #icon>←</template>
        返回
      </n-button>
      <h1>编辑宠物</h1>
    </div>

    <n-spin :show="pageLoading">
      <div class="form-container">
        <div class="avatar-upload-section">
          <div class="avatar-wrapper" @click="triggerAvatarInput">
            <img
              v-if="formData.avatar"
              :src="avatarDisplayUrl"
              class="avatar-img"
            />
            <n-avatar v-else :size="120" round>
              <span style="font-size: 48px;">{{ getDefaultAvatar(formData.species) }}</span>
            </n-avatar>
            <div class="avatar-overlay">
              <span>📷</span>
            </div>
          </div>
          <input
            ref="avatarInputRef"
            type="file"
            accept="image/*"
            style="display: none;"
            @change="handleAvatarChange"
          />
          <p class="avatar-hint">点击更换头像</p>
        </div>

        <div class="form-section">
          <div class="section-title">
            <span class="section-icon">📋</span>
            基本信息
          </div>

          <div class="form-field">
            <label class="field-label required">宠物名字</label>
            <n-input v-model:value="formData.name" placeholder="给毛孩子起个名字" size="large" />
          </div>

          <div class="form-field">
            <label class="field-label required">宠物类型</label>
            <div class="species-grid">
              <button
                v-for="opt in speciesOptions"
                :key="opt.value"
                class="species-btn"
                :class="{ active: formData.species === opt.value }"
                @click="formData.species = opt.value"
                type="button"
              >
                <span class="species-icon">{{ opt.icon }}</span>
                <span class="species-name">{{ opt.label }}</span>
              </button>
            </div>
          </div>

          <div class="form-field">
            <label class="field-label">品种</label>
            <n-input v-model:value="formData.breed" placeholder="例如：金毛、布偶猫" size="large" />
          </div>

          <div class="form-field">
            <label class="field-label required">性别</label>
            <div class="pill-group">
              <button
                class="pill-btn male-pill"
                :class="{ active: formData.gender === 'male' }"
                @click="formData.gender = 'male'"
                type="button"
              >
                ♂ 公
              </button>
              <button
                class="pill-btn female-pill"
                :class="{ active: formData.gender === 'female' }"
                @click="formData.gender = 'female'"
                type="button"
              >
                ♀ 母
              </button>
            </div>
          </div>

          <div class="form-row">
            <div class="form-field flex-1">
              <label class="field-label">生日</label>
              <n-date-picker
                v-model:value="formData.birthday"
                type="date"
                placeholder="选择生日"
                clearable
                size="large"
                style="width: 100%;"
              />
              <span v-if="calculatedAge" class="age-hint">
                🎂 {{ calculatedAge }}
              </span>
            </div>
            <div class="form-field flex-1">
              <label class="field-label">体重</label>
              <n-input-number
                v-model:value="formData.weight"
                :min="0"
                :step="0.1"
                placeholder="输入体重"
                size="large"
                style="width: 100%;"
              >
                <template #suffix>kg</template>
              </n-input-number>
            </div>
          </div>
        </div>

        <div class="form-section">
          <div class="section-title">
            <span class="section-icon">🎨</span>
            外观特征
          </div>

          <div class="form-field">
            <label class="field-label">毛色</label>
            <div class="color-pills">
              <button
                v-for="c in colorOptions"
                :key="c"
                class="pill-btn color-pill"
                :class="{ active: formData.color === c }"
                @click="formData.color = c"
                type="button"
              >
                {{ c }}
              </button>
            </div>
            <n-input
              v-model:value="formData.color"
              placeholder="或输入其他毛色"
              size="small"
              class="color-custom-input"
            />
          </div>
        </div>

        <div class="form-section">
          <div class="section-title">
            <span class="section-icon">🏥</span>
            健康信息
          </div>

          <div class="form-field">
            <label class="field-label">绝育状态</label>
            <div class="pill-group triple">
              <button
                class="pill-btn neuter-pill"
                :class="{ active: formData.isNeutered === true }"
                @click="formData.isNeutered = true"
                type="button"
              >
                ✂️ 已绝育
              </button>
              <button
                class="pill-btn neuter-pill"
                :class="{ active: formData.isNeutered === false }"
                @click="formData.isNeutered = false"
                type="button"
              >
                未绝育
              </button>
            </div>
          </div>
        </div>

        <div class="form-section">
          <div class="section-title">
            <span class="section-icon">📝</span>
            其他信息
          </div>

          <div class="form-field">
            <label class="field-label">特殊需求/备注</label>
            <n-input
              v-model:value="formData.specialNeeds"
              type="textarea"
              placeholder="记录宠物的特殊需求、习性等，例如：对鸡肉过敏、不爱剪指甲..."
              :rows="3"
              size="large"
            />
          </div>
        </div>

        <div class="form-actions">
          <n-button size="large" @click="goBack" class="cancel-btn">取消</n-button>
          <n-button type="primary" strong size="large" :loading="loading" @click="handleUpdatePet" class="submit-btn">
            保存修改
          </n-button>
        </div>
      </div>
    </n-spin>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { usePetStore } from '../../stores/pet'
import { useMessage } from 'naive-ui'
import { getPetById, updatePet, uploadPetAvatar } from '../../api/pet'

const router = useRouter()
const route = useRoute()
const message = useMessage()
const petStore = usePetStore()

const formRef = ref(null)
const avatarInputRef = ref(null)
const loading = ref(false)
const pageLoading = ref(false)
const avatarVersion = ref(0)
const petId = computed(() => route.params.id)

const formData = reactive({
  name: '',
  species: null,
  breed: '',
  gender: null,
  birthday: null,
  weight: null,
  color: '',
  isNeutered: false,
  specialNeeds: '',
  avatar: ''
})

const avatarDisplayUrl = computed(() => {
  if (!formData.avatar) return ''
  const sep = formData.avatar.includes('?') ? '&' : '?'
  return `${formData.avatar}${sep}v=${avatarVersion.value}`
})

const calculatedAge = computed(() => {
  if (!formData.birthday) return ''
  const birth = new Date(formData.birthday)
  const now = new Date()
  const diffMs = now - birth
  if (diffMs < 0) return '刚出生'
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  if (days < 30) return `${days}天`
  const months = Math.floor(days / 30)
  if (months < 12) return `${months}个月`
  const years = Math.floor(months / 12)
  const remainMonths = months % 12
  if (remainMonths === 0) return `${years}岁`
  return `${years}岁${remainMonths}个月`
})

const speciesOptions = [
  { label: '猫', value: 'cat', icon: '🐱' },
  { label: '狗', value: 'dog', icon: '🐕' },
  { label: '兔子', value: 'rabbit', icon: '🐰' },
  { label: '鸟', value: 'bird', icon: '🐦' },
  { label: '鱼', value: 'fish', icon: '🐟' },
  { label: '仓鼠', value: 'hamster', icon: '🐹' },
  { label: '其他', value: 'other', icon: '🐾' }
]

const colorOptions = [
  '白色', '黑色', '灰色', '棕色', '金色',
  '橘色', '蓝灰', '花色', '虎斑', '三花'
]

onMounted(() => {
  loadPetData()
})

watch(() => route.params.id, () => {
  loadPetData()
})

async function loadPetData() {
  pageLoading.value = true
  try {
    const result = await getPetById(petId)
    const pet = result.data.pet || result.data
    formData.name = pet.name || ''
    formData.species = pet.species || null
    formData.breed = pet.breed || ''
    formData.gender = pet.gender || null
    formData.birthday = pet.birthday ? new Date(pet.birthday).getTime() : null
    formData.weight = pet.weight || null
    formData.color = pet.color || ''
    formData.isNeutered = pet.isNeutered || false
    formData.specialNeeds = pet.specialNeeds || ''
    formData.avatar = pet.avatar || ''
    petStore.setCurrentPet(pet)
    petStore.updatePetInList(petId, pet)
  } catch (error) {
    console.error('获取宠物信息失败:', error)
    message.error('获取宠物信息失败')
    router.push('/pets')
  } finally {
    pageLoading.value = false
  }
}

function triggerAvatarInput() {
  avatarInputRef.value?.click()
}

async function handleAvatarChange(event) {
  const file = event.target.files?.[0]
  if (!file) return

  if (!file.type.startsWith('image/')) {
    message.error('请选择图片文件')
    return
  }
  if (file.size > 5 * 1024 * 1024) {
    message.error('图片大小不能超过5MB')
    return
  }

  const fd = new window.FormData()
  fd.append('avatar', file)

  try {
    const result = await uploadPetAvatar(petId, fd)
    const updatedPet = result.data?.pet || result.data
    if (updatedPet) {
      formData.avatar = updatedPet.avatar || ''
      avatarVersion.value++
      petStore.setCurrentPet(updatedPet)
      petStore.updatePetInList(petId, updatedPet)
      message.success('头像更新成功')
    } else {
      await loadPetData()
      message.success('头像更新成功')
    }
  } catch (error) {
    console.error('上传头像失败:', error)
    message.error('头像上传失败')
  }

  event.target.value = ''
}

function goBack() {
  router.push(`/pets/${petId}`)
}

async function handleUpdatePet() {
  if (!formData.name?.trim()) {
    message.warning('请输入宠物名字')
    return
  }
  if (!formData.species) {
    message.warning('请选择宠物类型')
    return
  }
  if (!formData.gender) {
    message.warning('请选择性别')
    return
  }

  loading.value = true
  try {
    const petData = {
      name: formData.name,
      species: formData.species,
      breed: formData.breed,
      gender: formData.gender,
      weight: formData.weight,
      color: formData.color,
      isNeutered: formData.isNeutered,
      specialNeeds: formData.specialNeeds
    }

    if (formData.birthday) {
      petData.birthday = new Date(formData.birthday).toISOString()
    }

    const result = await updatePet(petId, petData)
    const updatedPet = result.data?.updatePet || result.data?.pet || result.data
    petStore.updatePetInList(petId, updatedPet)
    petStore.setCurrentPet(updatedPet)
    message.success('修改成功！')
    router.push(`/pets/${petId}`)
  } catch (error) {
    console.error('更新宠物失败:', error)
    message.error(error.message || '修改失败，请稍后再试')
  } finally {
    loading.value = false
  }
}

function getDefaultAvatar(species) {
  const map = {
    dog: '🐕', cat: '🐱', rabbit: '🐰',
    bird: '🐦', fish: '🐟', hamster: '🐹'
  }
  return map[species] || '🐾'
}
</script>

<style scoped>
.edit-pet-page {
  padding: 8px 0;
  max-width: 680px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 24px;
  animation: spring-slide-up 0.4s var(--spring-soft) both;
}

.page-header h1 {
  font-size: 22px;
  font-weight: 700;
  color: var(--color-text-primary);
  margin: 0;
}

.back-btn {
  color: var(--color-primary);
}

.form-container {
  background: #fff;
  border-radius: var(--radius-lg);
  padding: 0;
  box-shadow: var(--shadow-card);
  overflow: hidden;
}

.avatar-upload-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 28px 24px 20px;
  background: linear-gradient(135deg, #ECFDF5, #F0FDF4);
  border-bottom: 1px solid var(--color-border-light);
}

.avatar-wrapper {
  position: relative;
  cursor: pointer;
  border-radius: 50%;
  overflow: hidden;
  width: 110px;
  height: 110px;
  box-shadow: 0 4px 20px rgba(16, 185, 129, 0.2);
  transition: transform 0.3s var(--spring-bounce);
}

.avatar-wrapper:hover {
  transform: scale(1.06);
}

.avatar-img {
  width: 110px;
  height: 110px;
  border-radius: 50%;
  object-fit: cover;
  display: block;
}

.avatar-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.25s;
  border-radius: 50%;
}

.avatar-wrapper:hover .avatar-overlay {
  opacity: 1;
}

.avatar-overlay span {
  font-size: 32px;
}

.avatar-hint {
  margin-top: 10px;
  color: var(--color-text-muted);
  font-size: 13px;
}

.form-section {
  padding: 20px 24px;
  border-bottom: 1px solid var(--color-border-light);
}

.form-section:last-of-type {
  border-bottom: none;
}

.section-title {
  font-size: 15px;
  font-weight: 700;
  color: var(--color-text-primary);
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.section-icon {
  font-size: 18px;
}

.form-field {
  margin-bottom: 16px;
}

.form-field:last-child {
  margin-bottom: 0;
}

.field-label {
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text-secondary);
  margin-bottom: 8px;
}

.field-label.required::before {
  content: '*';
  color: #EF4444;
  margin-right: 4px;
}

.form-row {
  display: flex;
  gap: 16px;
}

.flex-1 {
  flex: 1;
}

.species-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
}

.species-btn {
  border: 2px solid var(--color-border-light);
  border-radius: 14px;
  background: #fff;
  padding: 12px 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  transition: all 0.25s var(--spring-bounce);
}

.species-btn:hover {
  border-color: var(--color-primary);
  background: var(--color-primary-bg);
  transform: translateY(-2px);
}

.species-btn.active {
  border-color: var(--color-primary);
  background: var(--color-primary-bg);
  box-shadow: 0 0 0 1px var(--color-primary);
}

.species-icon {
  font-size: 28px;
  line-height: 1;
}

.species-name {
  font-size: 12px;
  font-weight: 600;
  color: var(--color-text-secondary);
}

.species-btn.active .species-name {
  color: var(--color-primary);
}

.pill-group {
  display: flex;
  gap: 10px;
}

.pill-group.triple {
  gap: 10px;
}

.pill-btn {
  border: 2px solid var(--color-border-light);
  border-radius: var(--radius-full);
  background: #fff;
  padding: 10px 24px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.25s var(--spring-bounce);
  color: var(--color-text-secondary);
}

.pill-btn:hover {
  transform: translateY(-2px);
}

.male-pill:hover,
.male-pill.active {
  border-color: #60A5FA;
  background: #EFF6FF;
  color: #2563EB;
}

.female-pill:hover,
.female-pill.active {
  border-color: #F472B6;
  background: #FDF2F8;
  color: #DB2777;
}

.neuter-pill.active {
  border-color: var(--color-primary);
  background: var(--color-primary-bg);
  color: var(--color-primary);
}

.color-pills {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 10px;
}

.color-pill {
  padding: 6px 16px;
  font-size: 13px;
  font-weight: 500;
  border-width: 1.5px;
}

.color-pill:hover,
.color-pill.active {
  border-color: var(--color-primary);
  background: var(--color-primary-bg);
  color: var(--color-primary);
}

.color-custom-input {
  margin-top: 4px;
}

.age-hint {
  display: inline-block;
  margin-top: 6px;
  font-size: 13px;
  color: var(--color-primary);
  font-weight: 600;
  background: var(--color-primary-bg);
  padding: 3px 12px;
  border-radius: var(--radius-full);
}

.form-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  padding: 20px 24px;
  background: var(--color-bg);
  border-top: 1px solid var(--color-border-light);
}

.cancel-btn {
  padding: 0 28px;
  height: 42px;
  border-radius: var(--radius-sm);
}

.submit-btn {
  background: linear-gradient(135deg, #10B981, #059669);
  border: none;
  padding: 0 36px;
  height: 42px;
  border-radius: var(--radius-sm);
  font-weight: 600;
  box-shadow: 0 4px 16px rgba(16, 185, 129, 0.3);
}

.submit-btn:hover {
  box-shadow: 0 6px 20px rgba(16, 185, 129, 0.4);
}

@media (max-width: 500px) {
  .species-grid {
    grid-template-columns: repeat(3, 1fr);
  }

  .form-row {
    flex-direction: column;
    gap: 0;
  }

  .pill-btn {
    padding: 8px 16px;
    font-size: 13px;
  }
}
</style>
