<template>
  <div class="health-reminders-page">
    <div class="page-header">
      <n-button quaternary @click="goBack" class="back-btn">
        <template #icon>←</template>
        返回
      </n-button>
      <h1>🔔 健康提醒</h1>
    </div>

    <div class="filter-bar spring-anim">
      <span class="filter-label">提醒范围：</span>
      <n-radio-group v-model:value="days" @update:value="loadReminders">
        <n-radio-button :value="7">7天内</n-radio-button>
        <n-radio-button :value="14">14天内</n-radio-button>
        <n-radio-button :value="30">30天内</n-radio-button>
        <n-radio-button :value="60">60天内</n-radio-button>
      </n-radio-group>
    </div>

    <n-spin :show="loading">
      <div v-if="reminders.length > 0" class="reminders-list">
        <div
          v-for="(item, idx) in reminders"
          :key="`${item.petId}-${item.type}-${idx}`"
          class="reminder-card spring-anim"
          :style="{ animationDelay: `${0.05 * idx}s` }"
        >
          <div class="reminder-left">
            <div class="reminder-pet-avatar">
              <img v-if="item.petAvatar" :src="resolveFileUrl(item.petAvatar)" class="pet-avatar-sm" />
              <span v-else class="pet-avatar-emoji">{{ getDefaultAvatar(item.petName) }}</span>
            </div>
            <div class="reminder-info">
              <div class="reminder-pet-name">{{ item.petName }}</div>
              <div class="reminder-title">
                <span class="reminder-type-icon">{{ item.type === 'vaccine' ? '💉' : '🐛' }}</span>
                {{ item.name || (item.type === 'vaccine' ? '疫苗' : '驱虫') }}
              </div>
              <div class="reminder-date">到期时间：{{ formatDate(item.date) }}</div>
            </div>
          </div>
          <div class="reminder-right">
            <div class="countdown" :class="getCountdownClass(item.date)">
              <span class="countdown-number">{{ getDaysLeft(item.date) }}</span>
              <span class="countdown-unit">天</span>
            </div>
            <n-button size="small" type="primary" @click="goToPetProfile(item.petId)">
              查看宠物
            </n-button>
          </div>
        </div>
      </div>

      <div v-else class="empty-state">
        <div class="empty-icon">🎉</div>
        <p class="empty-text">暂无健康提醒</p>
        <p class="empty-hint">在 {{ days }} 天内没有需要处理的疫苗或驱虫提醒</p>
      </div>
    </n-spin>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useMessage } from 'naive-ui'
import { getHealthReminders } from '../../api/pet'
import { resolveFileUrl } from '../../utils/fileUrl'

const router = useRouter()
const message = useMessage()

const loading = ref(false)
const days = ref(30)
const reminders = ref([])

onMounted(() => {
  loadReminders()
})

async function loadReminders() {
  loading.value = true
  try {
    const result = await getHealthReminders(days.value)
    reminders.value = result.data?.reminders || []
  } catch (error) {
    console.error('获取健康提醒失败:', error)
    message.error(error.message || '获取健康提醒失败')
  } finally {
    loading.value = false
  }
}

function getDaysLeft(date) {
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

function getDefaultAvatar() {
  return '🐾'
}

function formatDate(date) {
  if (!date) return ''
  const d = new Date(date)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function goBack() {
  router.back()
}

function goToPetProfile(petId) {
  router.push(`/pets/${petId}`)
}
</script>

<style scoped>
.health-reminders-page {
  padding: 8px 0;
}

.page-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 24px;
  animation: spring-slide-up 0.4s var(--spring-soft) both;
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

.spring-anim {
  animation: spring-pop 0.6s var(--spring-bounce) both;
}

.filter-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
  background: #fff;
  padding: 14px 18px;
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-card);
}

.filter-label {
  font-size: 14px;
  color: var(--color-text-secondary);
  font-weight: 500;
  flex-shrink: 0;
}

.reminders-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.reminder-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #fff;
  border-radius: var(--radius-lg);
  padding: 18px 20px;
  box-shadow: var(--shadow-card);
  transition: transform 0.4s var(--spring-bounce), box-shadow 0.3s;
}

.reminder-card:hover {
  transform: translateY(-3px);
  box-shadow: var(--shadow-hover);
}

.reminder-left {
  display: flex;
  align-items: center;
  gap: 14px;
}

.reminder-pet-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-primary-bg);
  flex-shrink: 0;
}

.pet-avatar-sm {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.pet-avatar-emoji {
  font-size: 24px;
}

.reminder-info {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.reminder-pet-name {
  font-size: 13px;
  color: var(--color-text-muted);
  font-weight: 500;
}

.reminder-title {
  font-size: 15px;
  color: var(--color-text-primary);
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 4px;
}

.reminder-type-icon {
  font-size: 16px;
}

.reminder-date {
  font-size: 13px;
  color: var(--color-text-secondary);
}

.reminder-right {
  display: flex;
  align-items: center;
  gap: 14px;
  flex-shrink: 0;
}

.countdown {
  display: flex;
  align-items: baseline;
  gap: 2px;
  padding: 6px 14px;
  border-radius: var(--radius-full);
  font-weight: 700;
}

.countdown-number {
  font-size: 22px;
  line-height: 1;
}

.countdown-unit {
  font-size: 12px;
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

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
  animation: spring-pop 0.6s var(--spring-bounce) both;
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 16px;
}

.empty-text {
  font-size: 18px;
  font-weight: 600;
  color: var(--color-text-primary);
  margin: 0 0 8px;
}

.empty-hint {
  font-size: 14px;
  color: var(--color-text-muted);
  margin: 0;
}

@media (max-width: 600px) {
  .filter-bar {
    flex-direction: column;
    align-items: flex-start;
  }

  .reminder-card {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .reminder-right {
    width: 100%;
    justify-content: space-between;
  }
}
</style>
