<template>
  <div class="my-applications-page">
    <div class="page-header">
      <button class="back-btn" @click="goBack">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M15 18l-6-6 6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </button>
      <h2 class="header-title">我的申请</h2>
      <div style="width:36px"></div>
    </div>

    <div class="filter-bar">
      <button
        v-for="f in statusFilters"
        :key="f.value"
        class="filter-tab"
        :class="{ active: currentFilter === f.value }"
        @click="switchFilter(f.value)"
      >{{ f.label }}</button>
    </div>

    <div class="content-body">
      <div v-if="loading" class="loading-wrap">
        <div class="pulse-dots"><i></i><i></i><i></i></div>
      </div>

      <div v-else-if="filteredList.length" class="app-list">
        <div v-for="app in filteredList" :key="app._id" class="app-card" @click="goToDetail(app.adoptionId?._id)">
          <div class="app-card-top">
            <div class="app-pet-img-wrap">
              <img v-if="app.adoptionId?.petInfo?.photos?.length" :src="app.adoptionId.petInfo.photos[0]" class="app-pet-img" />
              <div v-else class="app-pet-img-placeholder"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4.5 9.5a2.5 2.5 0 115 0 2.5 2.5 0 01-5 0zm10 0a2.5 2.5 0 115 0 2.5 2.5 0 01-5 0zm-7.5 7c0-2.5 2-4.5 5-4.5s5 2 5 4.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg></div>
            </div>
            <div class="app-info">
              <h3 class="app-pet-name">{{ app.adoptionId?.petInfo?.name || '宠物' }}</h3>
              <p class="app-time">申请于 {{ formatDate(app.createdAt) }}</p>
            </div>
            <span class="app-status-badge" :class="app.status">{{ statusLabelMap[app.status] }}</span>
          </div>
          <div class="app-card-body" v-if="app.applicantInfo?.reasonToAdopt">
            <p class="app-reason">{{ app.applicantInfo.reasonToAdopt }}</p>
          </div>
          <div class="app-card-footer" v-if="app.status === 'pending'">
            <button class="cancel-btn" @click.stop="handleCancel(app._id)">取消申请</button>
          </div>
          <div class="app-card-footer" v-if="app.status === 'rejected' && app.review?.reason">
            <p class="reject-reason">拒绝原因：{{ app.review.reason }}</p>
          </div>
        </div>
      </div>

      <div v-else class="empty-state">
        <div class="empty-illustration">
          <svg width="100" height="100" viewBox="0 0 120 120" fill="none">
            <circle cx="60" cy="60" r="50" fill="#f0fdf4" stroke="#bbf7d0" stroke-width="1.5"/>
            <path d="M40 55h40M40 65h28" stroke="#d1d5db" stroke-width="2" stroke-linecap="round"/>
            <path d="M35 45c0-8 6-15 14-15h22c8 0 14 7 14 15v20c0 8-6 15-14 15H49c-8 0-14-7-14-15V45z" fill="#fff" stroke="#e5e7eb" stroke-width="1.5"/>
            <circle cx="52" cy="55" r="2.5" fill="#9ca3af"/>
            <circle cx="68" cy="55" r="2.5" fill="#9ca3af"/>
          </svg>
        </div>
        <h3 class="empty-title">暂无申请记录</h3>
        <p class="empty-desc">去看看有没有心仪的毛孩子吧</p>
        <button class="empty-action" @click="goToAdoption">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" fill="currentColor"/></svg>
          浏览领养中心
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useDialog, useMessage } from 'naive-ui'
import { useAdoptionStore } from '../../stores/adoption'

const router = useRouter()
const adoptionStore = useAdoptionStore()
const dialog = useDialog()
const message = useMessage()

const loading = ref(false)
const currentFilter = ref('')

const statusFilters = [
  { value: '', label: '全部' },
  { value: 'pending', label: '待审核' },
  { value: 'approved', label: '已通过' },
  { value: 'rejected', label: '未通过' },
  { value: 'cancelled', label: '已取消' }
]

const statusLabelMap = {
  pending: '待审核',
  approved: '已通过',
  rejected: '未通过',
  cancelled: '已取消'
}

const filteredList = computed(() => {
  const list = adoptionStore.myApplications
  if (!currentFilter.value) return list
  return list.filter(app => app.status === currentFilter.value)
})

function formatDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}

function goBack() { router.back() }
function goToDetail(id) { if (id) router.push(`/adoption/${id}`) }
function goToAdoption() { router.push('/adoption') }

async function switchFilter(val) {
  currentFilter.value = val
  await fetchList()
}

async function fetchList() {
  loading.value = true
  await adoptionStore.fetchMyApplications()
  loading.value = false
}

async function handleCancel(id) {
  dialog.warning({
    title: '取消申请',
    content: '确定要取消这个申请吗？取消后无法恢复。',
    positiveText: '确认取消',
    negativeText: '再想想',
    onPositiveClick: async () => {
      try {
        await adoptionStore.cancelApp(id)
        message.success('申请已取消')
      } catch (err) {
        message.error(err.message || '取消失败')
      }
    }
  })
}

onMounted(() => { fetchList() })
</script>

<style scoped>
.my-applications-page {
  min-height: 100vh;
  background: var(--color-bg, #f8faf9);
  padding-bottom: 40px;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: rgba(255,255,255,0.92);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  position: sticky;
  top: 0;
  z-index: 20;
  border-bottom: 1px solid rgba(0,0,0,0.04);
}

.back-btn {
  width: 36px; height: 36px; border: none; background: none; color: var(--color-text-muted);
  cursor: pointer; display: flex; align-items: center; justify-content: center;
  border-radius: 50%; transition: all 0.25s;
}
.back-btn:hover { background: var(--color-bg-light); color: var(--color-primary); }

.header-title { font-size: 16px; font-weight: 700; color: var(--color-text-primary); margin: 0; }

.filter-bar {
  display: flex;
  gap: 8px;
  padding: 10px 16px;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
}
.filter-bar::-webkit-scrollbar { display: none; }

.filter-tab {
  flex-shrink: 0;
  padding: 6px 16px;
  border: 1.5px solid var(--color-border);
  border-radius: 18px;
  background: var(--color-bg-white);
  font-size: 13px;
  color: var(--color-text-muted);
  cursor: pointer;
  transition: all 0.3s;
  font-weight: 500;
}

.filter-tab:hover { border-color: rgba(16,185,129,0.3); color: #10B981; }
.filter-tab.active {
  border-color: #10B981; color: #10B981;
  background: rgba(16,185,129,0.06); font-weight: 600;
}

.content-body { padding: 4px 16px; }

.loading-wrap { display: flex; justify-content: center; padding: 60px 0; }

.pulse-dots { display: flex; gap: 8px; align-items: center; }
.pulse-dots i {
  width: 8px; height: 8px; border-radius: 50%;
  background: linear-gradient(135deg, #10B981, #059669);
  animation: pulse-dot 1.4s ease-in-out infinite;
  box-shadow: 0 0 8px rgba(16,185,129,0.3);
}
.pulse-dots i:nth-child(2) { animation-delay: 0.2s; }
.pulse-dots i:nth-child(3) { animation-delay: 0.4s; }
@keyframes pulse-dot {
  0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
  40% { transform: scale(1.1); opacity: 1; }
}

.app-list { display: flex; flex-direction: column; gap: 12px; }

.app-card {
  background: var(--color-bg-white);
  border-radius: 16px;
  padding: 16px;
  border: 1px solid rgba(0,0,0,0.04);
  box-shadow: 0 2px 8px rgba(0,0,0,0.03);
  cursor: pointer;
  transition: all 0.3s;
}

.app-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0,0,0,0.06);
}

.app-card-top { display: flex; align-items: center; gap: 12px; }

.app-pet-img-wrap {
  width: 48px; height: 48px; border-radius: 12px; overflow: hidden; flex-shrink: 0;
  background: var(--color-bg-light);
}
.app-pet-img { width: 100%; height: 100%; object-fit: cover; }
.app-pet-img-placeholder {
  width: 100%; height: 100%; display: flex; align-items: center;
  justify-content: center; font-size: 20px; background: var(--color-primary-bg);
}

.app-info { flex: 1; min-width: 0; }
.app-pet-name { font-size: 15px; font-weight: 700; color: var(--color-text-primary); margin: 0 0 3px; }
.app-time { font-size: 12px; color: var(--color-text-muted); margin: 0; }

.app-status-badge {
  flex-shrink: 0;
  padding: 3px 10px;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 600;
}

.app-status-badge.pending { background: rgba(245,158,11,0.1); color: #d97706; }
.app-status-badge.approved { background: rgba(16,185,129,0.1); color: #059669; }
.app-status-badge.rejected { background: rgba(239,68,68,0.1); color: #ef4444; }
.app-status-badge.cancelled { background: rgba(107,114,128,0.1); color: #6b7280; }

.app-card-body { margin-top: 10px; padding-top: 10px; border-top: 1px solid var(--color-border); }

.app-reason {
  font-size: 13px; color: var(--color-text-muted); line-height: 1.6; margin: 0;
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
}

.app-card-footer { margin-top: 10px; padding-top: 10px; border-top: 1px solid var(--color-border); }

.cancel-btn {
  padding: 6px 16px; border: 1.5px solid var(--color-border); border-radius: 16px;
  background: var(--color-bg-white); font-size: 12px; color: var(--color-text-muted); cursor: pointer;
  transition: all 0.3s; font-weight: 500;
}
.cancel-btn:hover { border-color: var(--color-danger); color: var(--color-danger); }

.reject-reason { font-size: 12px; color: var(--color-danger); margin: 0; }

/* Empty */
.empty-state {
  display: flex; flex-direction: column; align-items: center;
  justify-content: center; padding: 80px 20px 60px; gap: 14px;
}

.empty-illustration {
  margin-bottom: 12px;
  animation: float 3.5s ease-in-out infinite;
  filter: drop-shadow(0 8px 20px rgba(16,185,129,0.1));
}
@keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }

.empty-title { font-size: 18px; font-weight: 700; color: var(--color-text-secondary); margin: 0; }
.empty-desc { font-size: 13px; color: var(--color-text-muted); margin: 0; }

.empty-action {
  display: flex; align-items: center; gap: 8px; margin-top: 16px;
  padding: 12px 28px; background: linear-gradient(135deg, var(--color-primary), var(--color-primary-dark, #059669));
  color: #fff; border: none; border-radius: 28px; font-size: 14px; font-weight: 600;
  cursor: pointer; transition: all 0.35s;
  box-shadow: var(--shadow-primary, 0 4px 16px rgba(16,185,129,0.3));
}
.empty-action:hover { transform: translateY(-3px); box-shadow: 0 8px 28px rgba(16,185,129,0.4); }

@media (max-width: 768px) {
  .content-body { padding: 4px 12px; }
  .filter-bar { padding: 8px 12px; }
}
</style>