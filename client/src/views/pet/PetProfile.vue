<template>
  <div class="pet-profile-page">
    <div class="page-header">
      <n-button quaternary @click="goBack" class="back-btn">
        <template #icon>←</template>
        返回
      </n-button>
    </div>

    <n-spin :show="loading">
      <div v-if="pet" class="profile-container">
        <div class="hero-card spring-anim">
          <div class="hero-avatar">
            <img v-if="pet?.avatar" :src="avatarUrl" class="avatar-img-hero" />
            <span v-else class="avatar-emoji-hero">{{ getDefaultAvatar(pet?.species) }}</span>
          </div>
          <div class="hero-info">
            <h1 class="hero-name">{{ pet?.name }}</h1>
            <div class="hero-tags">
              <span v-if="pet?.gender" class="gender-pill" :class="pet.gender">
                {{ pet.gender === 'male' ? '♂ 公' : '♀ 母' }}
              </span>
              <span class="species-tag">{{ getSpeciesText(pet?.species) }}</span>
              <span class="breed-tag" v-if="pet?.breed">{{ pet.breed }}</span>
              <span class="age-tag" v-if="pet?.birthday">{{ calculateAge(pet.birthday) }}</span>
              <span v-if="pet?.isNeutered" class="neutered-tag">✂️ 已绝育</span>
            </div>
          </div>
          <button class="hero-edit-btn" @click="goToEdit" title="编辑资料">
            ✏️
          </button>
        </div>

        <div class="dashboard spring-anim" style="animation-delay: 0.08s;">
          <div class="stat-card">
            <span class="stat-icon">⚖️</span>
            <div class="stat-value">{{ pet?.weight || '--' }}</div>
            <div class="stat-label">体重 (kg)</div>
          </div>
          <div class="stat-card">
            <span class="stat-icon">💉</span>
            <div class="stat-value">{{ vaccineCount }}</div>
            <div class="stat-label">疫苗记录</div>
          </div>
          <div class="stat-card">
            <span class="stat-icon">🐛</span>
            <div class="stat-value">{{ dewormingCount }}</div>
            <div class="stat-label">驱虫记录</div>
          </div>
          <div class="stat-card">
            <span class="stat-icon">📋</span>
            <div class="stat-value">{{ medicalCount }}</div>
            <div class="stat-label">病史记录</div>
          </div>
        </div>

        <div class="feature-islands spring-anim" style="animation-delay: 0.1s;">
          <button class="island-btn island-health" @click="goToHealthRecords">
            <span class="island-icon">💊</span>
            <span class="island-text">健康记录</span>
          </button>
          <button class="island-btn island-reminder" @click="goToHealthReminders">
            <span class="island-icon">🔔</span>
            <span class="island-text">健康提醒</span>
          </button>
        </div>

        <div class="main-grid">
          <div class="main-left">
            <div class="info-card spring-anim" style="animation-delay: 0.12s;">
              <div class="section-header">
                <h3 class="section-title">
                  <span class="title-icon">📊</span>
                  健康档案
                </h3>
                <n-button text type="primary" @click="goToHealthRecords">
                  管理全部 →
                </n-button>
              </div>
              <div class="info-rows">
                <div class="info-row">
                  <span class="info-icon">🎨</span>
                  <span class="info-label">毛色</span>
                  <span class="info-value" :class="{ 'placeholder': !pet?.color }">{{ pet?.color || '尚未填写，点击编辑添加' }}</span>
                </div>
                <div class="info-row">
                  <span class="info-icon">🎂</span>
                  <span class="info-label">生日</span>
                  <span class="info-value" :class="{ 'placeholder': !pet?.birthday }">{{ pet?.birthday ? formatDate(pet.birthday) : '尚未填写，点击编辑添加' }}</span>
                </div>
              </div>
              <div v-if="pet?.specialNeeds" class="special-needs">
                <p class="special-needs-title">📝 特殊需求/备注</p>
                <p class="special-needs-content">{{ pet.specialNeeds }}</p>
              </div>
              <div v-else class="special-needs-empty">
                <span class="hint-icon">💡</span>
                <span>可备注过敏信息、性格特点、喂药需求等</span>
              </div>
            </div>

            <div class="info-card spring-anim timeline-card" style="animation-delay: 0.18s;">
              <div class="section-header">
                <h3 class="section-title">
                  <span class="title-icon">🕐</span>
                  健康时间线
                </h3>
              </div>
              <div v-if="timeline.length > 0" class="timeline">
                <div
                  v-for="(item, idx) in timeline"
                  :key="idx"
                  class="timeline-item"
                  :class="[`type-${item.type}`, item.status]"
                >
                  <div class="timeline-dot">
                    <span>{{ item.icon }}</span>
                  </div>
                  <div class="timeline-line" v-if="idx < timeline.length - 1"></div>
                  <div class="timeline-content">
                    <div class="timeline-header">
                      <span class="timeline-title">{{ item.title }}</span>
                      <span class="timeline-status-tag" :class="item.status">
                        {{ item.statusLabel }}
                      </span>
                    </div>
                    <div class="timeline-date">{{ formatDate(item.date) }}</div>
                    <div class="timeline-details">
                      <div v-for="(detail, dIdx) in item.details" :key="dIdx" class="timeline-detail">
                        {{ detail }}
                      </div>
                    </div>
                    <div v-if="item.nextDate" class="timeline-next">
                      <span class="next-label">下次：</span>
                      <span class="next-date">{{ formatDate(item.nextDate) }}</span>
                      <span class="countdown" :class="getCountdownClass(item.nextDate)">
                        {{ getCountdownText(item.nextDate) }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <div v-else class="empty-timeline">
                <div class="empty-icon">🩺</div>
                <p class="empty-title">暂无健康记录</p>
                <p class="empty-desc">添加疫苗接种、驱虫和病史记录，追踪宠物健康状况</p>
                <n-button type="primary" size="small" @click="goToHealthRecords" class="empty-action">
                  + 添加第一条记录
                </n-button>
              </div>
            </div>
          </div>

          <div class="main-right">
            <div class="info-card spring-anim photo-card" style="animation-delay: 0.15s;">
              <div v-if="pet?.photos?.length > 0 && pet?.birthday" class="photo-cover">
                <img :src="resolveFileUrl(pet.photos[0])" alt="封面" class="cover-img" />
                <div class="cover-overlay">
                  <div class="cover-text">
                    <span class="cover-title">这是陪你度过的第</span>
                    <span class="cover-days">{{ getDaysAlive(pet.birthday) }}</span>
                    <span class="cover-unit">天</span>
                  </div>
                  <div class="cover-pet-name">{{ pet?.name }}</div>
                </div>
              </div>

              <div class="section-header">
                <h3 class="section-title">
                  <span class="title-icon">📸</span>
                  宠物相册
                </h3>
                <n-button text type="primary" @click="triggerPhotoInput">
                  + 上传
                </n-button>
              </div>
              <input
                ref="photoInputRef"
                type="file"
                accept="image/*"
                multiple
                style="display: none;"
                @change="handlePhotoUpload"
              />
              <div v-if="pet?.photos?.length > 0" class="photo-grid">
                <div v-for="(photo, idx) in pet.photos" :key="idx" class="photo-item">
                  <img :src="resolveFileUrl(photo)" :alt="`宠物照片${idx + 1}`" @click="previewPhoto(resolveFileUrl(photo), idx)" />
                  <button class="photo-delete-btn" @click.stop="handleDeletePhoto(photo)" title="删除照片">×</button>
                </div>
              </div>
              <div v-else class="empty-photos">
                <div class="empty-photo-area" @click="triggerPhotoInput">
                  <div class="empty-photo-icon">📷</div>
                  <p class="empty-photo-main">这一天还没记录，快来拍张照吧！</p>
                  <p class="empty-photo-hint">记录{{ pet?.name }}的每个成长瞬间~</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="delete-footer spring-anim" style="animation-delay: 0.25s;">
          <n-popconfirm
            title="确定要删除这个宠物吗？此操作不可恢复。"
            positive-text="确定删除"
            negative-text="取消"
            @positive-click="handleDelete"
          >
            <template #trigger>
              <button class="delete-footer-link">
                🗑️ 删除宠物
              </button>
            </template>
          </n-popconfirm>
        </div>
      </div>
    </n-spin>

    <n-modal v-model:show="previewVisible" :show-header="false" style="max-width: 480px;" class="photo-preview-modal">
      <div class="preview-container">
        <img :src="previewUrl" alt="预览" class="preview-img" />
        <div class="preview-info-card">
          <div class="preview-info-row">
            <span class="preview-label">📅 拍摄</span>
            <span class="preview-value">{{ formatDate(new Date()) }}</span>
          </div>
          <div class="preview-info-row" v-if="pet?.birthday">
            <span class="preview-label">🎂 日龄</span>
            <span class="preview-value">出生第{{ getDaysAlive(pet.birthday) }}天</span>
          </div>
          <div class="preview-info-row" v-if="pet?.weight">
            <span class="preview-label">⚖️ 体重</span>
            <span class="preview-value">{{ pet.weight }}kg</span>
          </div>
          <div class="preview-info-row" v-if="vaccineCount > 0">
            <span class="preview-label">💉 疫苗</span>
            <span class="preview-value">已接种{{ vaccineCount }}次</span>
          </div>
        </div>
        <button class="preview-close-btn" @click="previewVisible = false">×</button>
      </div>
    </n-modal>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute, onBeforeRouteUpdate } from 'vue-router'
import { usePetStore } from '../../stores/pet'
import { useMessage } from 'naive-ui'
import { getPetById, deletePet, uploadPetPhotos, deletePetPhoto } from '../../api/pet'
import { resolveFileUrl } from '../../utils/fileUrl'

const router = useRouter()
const route = useRoute()
const message = useMessage()
const petStore = usePetStore()

const loading = ref(false)
const photoInputRef = ref(null)
const previewVisible = ref(false)
const previewUrl = ref('')

const pet = computed(() => petStore.currentPet)

const avatarUrl = computed(() => {
  if (!pet.value?.avatar) return ''
  const sep = pet.value.avatar.includes('?') ? '&' : '?'
  return `${pet.value.avatar}${sep}v=${Date.now()}`
})

const vaccineCount = computed(() => pet.value?.healthRecords?.vaccines?.length || 0)
const dewormingCount = computed(() => pet.value?.healthRecords?.dewormings?.length || 0)
const medicalCount = computed(() => pet.value?.healthRecords?.medicalHistory?.length || 0)

const timeline = computed(() => {
  if (!pet.value?.healthRecords) return []
  const items = []
  const vaccines = pet.value.healthRecords.vaccines || []
  const dewormings = pet.value.healthRecords.dewormings || []
  const medicals = pet.value.healthRecords.medicalHistory || []
  const now = new Date()

  vaccines.forEach(v => {
    const nextDate = v.nextDate ? new Date(v.nextDate) : null
    items.push({
      type: 'vaccine',
      icon: '💉',
      title: v.name || '疫苗接种',
      date: v.date,
      details: [
        v.hospital ? `🏥 ${v.hospital}` : null
      ].filter(Boolean),
      nextDate: v.nextDate,
      status: !v.date ? 'pending' : nextDate && nextDate < now ? 'overdue' : 'done',
      statusLabel: !v.date ? '待接种' : '已接种',
      sortDate: v.date || v.nextDate || now
    })
  })

  dewormings.forEach(d => {
    const nextDate = d.nextDate ? new Date(d.nextDate) : null
    items.push({
      type: 'deworming',
      icon: '🐛',
      title: d.type === 'internal' ? '体内驱虫' : d.type === 'external' ? '体外驱虫' : '驱虫',
      date: d.date,
      details: [
        d.medicine ? `💊 ${d.medicine}` : null
      ].filter(Boolean),
      nextDate: d.nextDate,
      status: !d.date ? 'pending' : nextDate && nextDate < now ? 'overdue' : 'done',
      statusLabel: !d.date ? '待驱虫' : '已完成',
      sortDate: d.date || d.nextDate || now
    })
  })

  medicals.forEach(m => {
    items.push({
      type: 'medical',
      icon: '📋',
      title: m.diagnosis || '病史记录',
      date: m.date,
      details: [
        m.treatment ? `💊 ${m.treatment}` : null,
        m.hospital ? `🏥 ${m.hospital}` : null
      ].filter(Boolean),
      nextDate: null,
      status: 'done',
      statusLabel: '已就诊',
      sortDate: m.date || now
    })
  })

  items.sort((a, b) => new Date(b.sortDate) - new Date(a.sortDate))
  return items
})

function getDaysAlive(birthday) {
  if (!birthday) return 0
  const birth = new Date(birthday)
  const now = new Date()
  const diff = now.getTime() - birth.getTime()
  return Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)))
}

function calculateAge(birthday) {
  if (!birthday) return ''
  const birth = new Date(birthday)
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
}

function getDaysLeft(date) {
  if (!date) return 0
  const now = new Date()
  const target = new Date(date)
  const diff = target.getTime() - now.getTime()
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
}

function getCountdownClass(date) {
  const daysLeft = getDaysLeft(date)
  if (daysLeft <= 3) return 'urgent'
  if (daysLeft <= 7) return 'warning'
  return 'safe'
}

function getCountdownText(date) {
  const daysLeft = getDaysLeft(date)
  if (daysLeft === 0) return '今天到期'
  if (daysLeft === 1) return '明天到期'
  return `还有${daysLeft}天`
}

onMounted(() => {
  petStore.setCurrentPet(null)
  loadPetDetail()
})

onBeforeRouteUpdate((to) => {
  if (to.name === 'PetProfile') {
    loadPetDetail()
  }
})

async function loadPetDetail() {
  loading.value = true
  try {
    const result = await getPetById(route.params.id)
    const petData = result.data.pet || result.data
    petStore.setCurrentPet(petData)
  } catch (error) {
    console.error('获取宠物详情失败:', error)
    message.error(error.message || '获取失败')
  } finally {
    loading.value = false
  }
}

function goBack() {
  router.push('/pets')
}

function goToEdit() {
  router.push(`/pets/${route.params.id}/edit`)
}

function goToHealthRecords() {
  router.push(`/pets/${route.params.id}/health`)
}

function goToHealthReminders() {
  router.push('/pets/health-reminders')
}

async function handleDelete() {
  try {
    await deletePet(route.params.id)
    petStore.removePetFromList(route.params.id)
    message.success('删除成功')
    router.push('/pets')
  } catch (error) {
    console.error('删除宠物失败:', error)
    message.error(error.message || '删除失败')
  }
}

function triggerPhotoInput() {
  photoInputRef.value?.click()
}

async function handlePhotoUpload(event) {
  const files = event.target.files
  if (!files || files.length === 0) return
  const maxSize = 5 * 1024 * 1024
  for (const file of files) {
    if (!file.type.startsWith('image/')) {
      message.error('只能上传图片文件')
      event.target.value = ''
      return
    }
    if (file.size > maxSize) {
      message.error('图片大小不能超过5MB')
      event.target.value = ''
      return
    }
  }
  const formData = new window.FormData()
  for (const file of files) {
    formData.append('photos', file)
  }
  try {
    const result = await uploadPetPhotos(route.params.id, formData)
    const updatedPet = result.data?.updatedPet || result.data?.pet
    if (updatedPet) {
      petStore.setCurrentPet(updatedPet)
      petStore.updatePetInList(route.params.id, { photos: updatedPet.photos })
    } else {
      await loadPetDetail()
    }
    message.success('照片上传成功')
  } catch (error) {
    console.error('上传照片失败:', error)
    message.error(error.message || '照片上传失败')
  }
  event.target.value = ''
}

function previewPhoto(url) {
  previewUrl.value = url
  previewVisible.value = true
}

async function handleDeletePhoto(photoUrl) {
  try {
    await deletePetPhoto(route.params.id, photoUrl)
    await loadPetDetail()
    message.success('照片删除成功')
  } catch (error) {
    console.error('删除照片失败:', error)
    message.error('照片删除失败')
  }
}

function getDefaultAvatar(species) {
  const map = { dog: '🐕', cat: '🐱', rabbit: '🐰', bird: '🐦', fish: '🐟', hamster: '🐹' }
  return map[species] || '🐾'
}

function getSpeciesText(species) {
  const map = { dog: '狗', cat: '猫', rabbit: '兔子', bird: '鸟', fish: '鱼', hamster: '仓鼠', other: '其他' }
  return map[species] || species || '未知'
}

function formatDate(date) {
  if (!date) return ''
  const d = new Date(date)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
</script>

<style scoped>
.pet-profile-page {
  padding: 8px 0;
}

.page-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
  animation: spring-slide-up 0.4s var(--spring-soft) both;
}

.back-btn {
  color: var(--color-primary);
}

.spring-anim {
  animation: spring-pop 0.6s var(--spring-bounce) both;
}

.hero-card {
  background: linear-gradient(135deg, #10B981, #059669);
  border-radius: var(--radius-xl);
  padding: 32px 28px;
  color: white;
  display: flex;
  align-items: center;
  gap: 24px;
  box-shadow: 0 12px 32px rgba(16, 185, 129, 0.3);
  position: relative;
  overflow: hidden;
  margin-bottom: 16px;
}

.hero-card::before {
  content: '';
  position: absolute;
  top: -40%;
  right: -10%;
  width: 200px;
  height: 200px;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 50%;
  pointer-events: none;
}

.hero-card::after {
  content: '';
  position: absolute;
  bottom: -30%;
  left: -8%;
  width: 140px;
  height: 140px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 50%;
  pointer-events: none;
}

.hero-avatar {
  width: 110px;
  height: 110px;
  border-radius: 50%;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  animation: spring-bounce-in 0.7s var(--spring-bounce) both;
  animation-delay: 0.1s;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
}

.avatar-img-hero {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.avatar-emoji-hero {
  font-size: 46px;
  line-height: 1;
}

.hero-info {
  flex: 1;
  min-width: 0;
}

.hero-name {
  font-size: 28px;
  font-weight: 800;
  margin: 0 0 10px;
  letter-spacing: 0.5px;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.hero-tags {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  align-items: center;
}

.gender-pill {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  padding: 5px 16px;
  border-radius: var(--radius-full);
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.5px;
  backdrop-filter: blur(8px);
  border: 1.5px solid rgba(255, 255, 255, 0.25);
}

.gender-pill.male {
  background: linear-gradient(135deg, rgba(96, 165, 250, 0.45), rgba(59, 130, 246, 0.35));
  color: #fff;
  border-color: rgba(147, 197, 253, 0.5);
}

.gender-pill.female {
  background: linear-gradient(135deg, rgba(244, 114, 182, 0.45), rgba(168, 85, 247, 0.35));
  color: #fff;
  border-color: rgba(251, 182, 206, 0.5);
}

.species-tag,
.breed-tag,
.age-tag {
  background: rgba(255, 255, 255, 0.2);
  padding: 5px 14px;
  border-radius: var(--radius-full);
  font-size: 12px;
  font-weight: 500;
  backdrop-filter: blur(4px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.neutered-tag {
  background: linear-gradient(135deg, rgba(251, 191, 36, 0.35), rgba(245, 158, 11, 0.25));
  padding: 5px 14px;
  border-radius: var(--radius-full);
  font-size: 12px;
  font-weight: 700;
  backdrop-filter: blur(4px);
  border: 1.5px solid rgba(253, 224, 71, 0.4);
  letter-spacing: 0.3px;
}

.dashboard {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin-bottom: 20px;
}

.stat-card {
  background: #fff;
  border-radius: var(--radius-lg);
  padding: 20px 16px;
  text-align: center;
  box-shadow: var(--shadow-card);
  transition: transform 0.4s var(--spring-bounce);
}

.stat-card:hover {
  transform: translateY(-4px);
}

.stat-icon {
  font-size: 28px;
  display: block;
  margin-bottom: 6px;
}

.stat-value {
  font-size: 28px;
  font-weight: 800;
  color: var(--color-text-primary);
  line-height: 1.1;
}

.stat-label {
  font-size: 12px;
  color: var(--color-text-muted);
  margin-top: 4px;
  font-weight: 500;
}

.main-grid {
  display: grid;
  grid-template-columns: 1fr 360px;
  gap: 20px;
  align-items: start;
}

.main-left {
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-width: 0;
}

.main-right {
  display: flex;
  flex-direction: column;
  gap: 16px;
  position: sticky;
  top: 20px;
}

.info-card {
  background: #fff;
  border-radius: var(--radius-lg);
  padding: 22px;
  box-shadow: var(--shadow-card);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.section-title {
  font-size: 16px;
  color: var(--color-text-primary);
  margin: 0 0 16px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 6px;
}

.section-header .section-title {
  margin-bottom: 0;
}

.title-icon {
  font-size: 18px;
}

.info-rows {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.info-row {
  display: flex;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid var(--color-border-light);
}

.info-row:last-child {
  border-bottom: none;
}

.info-icon {
  font-size: 18px;
  width: 32px;
  flex-shrink: 0;
  text-align: center;
}

.info-label {
  font-size: 14px;
  color: var(--color-text-muted);
  width: 60px;
  flex-shrink: 0;
  font-weight: 500;
}

.info-value {
  font-size: 14px;
  color: var(--color-text-primary);
  font-weight: 500;
  flex: 1;
}

.info-value.placeholder {
  color: var(--color-text-muted);
  font-style: italic;
  font-weight: 400;
}

.special-needs {
  margin-top: 16px;
  padding: 14px;
  background: var(--color-primary-bg);
  border-radius: var(--radius-sm);
  border-left: 3px solid var(--color-primary);
}

.special-needs-title {
  margin: 0 0 6px;
  font-weight: 600;
  color: var(--color-text-primary);
  font-size: 14px;
}

.special-needs-content {
  margin: 0;
  color: var(--color-text-secondary);
  font-size: 14px;
}

.special-needs-empty {
  margin-top: 16px;
  padding: 12px 14px;
  background: var(--color-bg);
  border-radius: var(--radius-sm);
  color: var(--color-text-muted);
  font-size: 13px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.hint-icon {
  font-size: 16px;
}

.timeline-card {
  padding-bottom: 8px;
}

.timeline {
  position: relative;
  margin-top: 8px;
}

.timeline-item {
  display: flex;
  position: relative;
  padding-bottom: 20px;
}

.timeline-item:last-child {
  padding-bottom: 0;
}

.timeline-dot {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  flex-shrink: 0;
  position: relative;
  z-index: 1;
}

.type-vaccine .timeline-dot {
  background: #ECFDF5;
  border: 2px solid #10B981;
}

.type-deworming .timeline-dot {
  background: #EFF6FF;
  border: 2px solid #3B82F6;
}

.type-medical .timeline-dot {
  background: #FEF3C7;
  border: 2px solid #F59E0B;
}

.timeline-line {
  position: absolute;
  left: 17px;
  top: 38px;
  bottom: 0;
  width: 2px;
  background: var(--color-border-light);
}

.timeline-content {
  flex: 1;
  margin-left: 12px;
  background: var(--color-bg);
  border-radius: var(--radius-sm);
  padding: 12px 14px;
  min-width: 0;
}

.timeline-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 4px;
}

.timeline-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text-primary);
}

.timeline-status-tag {
  font-size: 11px;
  padding: 2px 10px;
  border-radius: var(--radius-full);
  font-weight: 600;
  flex-shrink: 0;
}

.timeline-status-tag.done {
  background: #ECFDF5;
  color: #059669;
}

.timeline-status-tag.overdue {
  background: #FEF2F2;
  color: #EF4444;
}

.timeline-status-tag.pending {
  background: #FFFBEB;
  color: #D97706;
}

.timeline-date {
  font-size: 12px;
  color: var(--color-text-muted);
  margin-bottom: 6px;
}

.timeline-details {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.timeline-detail {
  font-size: 13px;
  color: var(--color-text-secondary);
}

.timeline-next {
  margin-top: 8px;
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
}

.next-label {
  color: var(--color-text-muted);
}

.next-date {
  color: var(--color-text-primary);
  font-weight: 500;
}

.countdown {
  font-size: 11px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: var(--radius-full);
}

.countdown.urgent {
  background: #FEF2F2;
  color: #EF4444;
}

.countdown.warning {
  background: #FFFBEB;
  color: #F59E0B;
}

.countdown.safe {
  background: #ECFDF5;
  color: #10B981;
}

.empty-timeline {
  text-align: center;
  padding: 40px 20px;
}

.empty-timeline .empty-icon {
  font-size: 48px;
  margin-bottom: 12px;
}

.empty-timeline .empty-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--color-text-primary);
  margin: 0 0 6px;
}

.empty-timeline .empty-desc {
  font-size: 13px;
  color: var(--color-text-muted);
  margin: 0 0 16px;
}

.empty-action {
  border-radius: var(--radius-full);
}

.photo-card {
  padding: 0;
  overflow: hidden;
}

.photo-cover {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 9;
  overflow: hidden;
}

.cover-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.cover-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 20px 18px 14px;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.7) 0%, rgba(0, 0, 0, 0.3) 60%, transparent 100%);
  color: #fff;
}

.cover-text {
  display: flex;
  align-items: baseline;
  gap: 4px;
}

.cover-title {
  font-size: 13px;
  opacity: 0.9;
  font-weight: 400;
}

.cover-days {
  font-size: 32px;
  font-weight: 800;
  line-height: 1;
  margin: 0 2px;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.cover-unit {
  font-size: 14px;
  opacity: 0.9;
  font-weight: 500;
}

.cover-pet-name {
  font-size: 12px;
  opacity: 0.7;
  margin-top: 4px;
}

.photo-card .section-header {
  padding: 16px 22px 12px;
}

.photo-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
  padding: 0 22px 22px;
}

.photo-item {
  position: relative;
  aspect-ratio: 4 / 5;
  border-radius: 16px;
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.4s var(--spring-bounce);
}

.photo-item:hover {
  transform: scale(1.04);
}

.photo-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.photo-delete-btn {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.5);
  color: #fff;
  border: none;
  font-size: 18px;
  line-height: 1;
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.2s, transform 0.2s var(--spring-bounce);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  backdrop-filter: blur(4px);
}

.photo-item:hover .photo-delete-btn {
  opacity: 1;
}

.photo-delete-btn:hover {
  background: #EF4444;
  transform: scale(1.15);
}

.empty-photos {
  padding: 0 22px 22px;
}

.empty-photo-area {
  border: 2px dashed var(--color-border);
  border-radius: 16px;
  padding: 36px 20px;
  text-align: center;
  cursor: pointer;
  transition: border-color 0.3s, background 0.3s;
}

.empty-photo-area:hover {
  border-color: var(--color-primary);
  background: var(--color-primary-bg);
}

.empty-photo-icon {
  font-size: 44px;
  margin-bottom: 10px;
}

.empty-photo-main {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text-primary);
  margin: 0 0 4px;
}

.empty-photo-hint {
  font-size: 12px;
  color: var(--color-text-muted);
  margin: 0;
}

.hero-edit-btn {
  position: absolute;
  top: 16px;
  right: 16px;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  border: 1.5px solid rgba(255, 255, 255, 0.3);
  color: #fff;
  font-size: 18px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(8px);
  transition: background 0.3s, transform 0.3s var(--spring-bounce);
  z-index: 2;
}

.hero-edit-btn:hover {
  background: rgba(255, 255, 255, 0.35);
  transform: scale(1.1);
}

.hero-edit-btn:active {
  transform: scale(0.9);
}

.feature-islands {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 20px;
}

.island-btn {
  border: none;
  border-radius: 16px;
  padding: 18px 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  cursor: pointer;
  font-size: 15px;
  font-weight: 700;
  letter-spacing: 0.3px;
  transition: transform 0.35s var(--spring-bounce), box-shadow 0.3s;
}

.island-btn:hover {
  transform: translateY(-4px) scale(1.03);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
}

.island-btn:active {
  transform: scale(0.96);
}

.island-icon {
  font-size: 22px;
  line-height: 1;
}

.island-health {
  background: linear-gradient(135deg, #E8F5E9, #C8E6C9);
  color: #2E7D32;
}

.island-reminder {
  background: linear-gradient(135deg, #FFF3E0, #FFE0B2);
  color: #EF6C00;
}

.delete-footer {
  text-align: center;
  padding: 24px 0 8px;
}

.delete-footer-link {
  background: none;
  border: none;
  color: #9CA3AF;
  font-size: 13px;
  cursor: pointer;
  padding: 8px 16px;
  border-radius: 8px;
  transition: color 0.2s, background 0.2s;
}

.delete-footer-link:hover {
  color: #EF4444;
  background: #FEF2F2;
}

.preview-container {
  position: relative;
}

.preview-img {
  width: 100%;
  border-radius: 12px;
  display: block;
}

.preview-info-card {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.75) 0%, rgba(0, 0, 0, 0.4) 70%, transparent 100%);
  padding: 24px 16px 14px;
  border-radius: 0 0 12px 12px;
  display: flex;
  flex-wrap: wrap;
  gap: 6px 16px;
}

.preview-info-row {
  display: flex;
  align-items: center;
  gap: 4px;
}

.preview-label {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.7);
}

.preview-value {
  font-size: 12px;
  color: #fff;
  font-weight: 600;
}

.preview-close-btn {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.5);
  color: #fff;
  border: none;
  font-size: 20px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(4px);
  transition: background 0.2s;
}

.preview-close-btn:hover {
  background: rgba(0, 0, 0, 0.75);
}

@media (max-width: 900px) {
  .main-grid {
    grid-template-columns: 1fr;
  }

  .main-right {
    position: static;
  }
}

@media (max-width: 600px) {
  .hero-card {
    flex-direction: column;
    text-align: center;
    padding: 24px 16px;
  }

  .hero-tags {
    justify-content: center;
  }

  .dashboard {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
