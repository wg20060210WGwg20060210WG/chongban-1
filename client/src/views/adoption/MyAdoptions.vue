<template>
  <div class="my-adoptions-page">
    <div class="page-header">
      <button class="back-btn" @click="router.back()">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M15 18l-6-6 6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </button>
      <h2 class="header-title">我发布的领养</h2>
      <button class="publish-btn" @click="router.push('/adoption/publish')">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/></svg>
      </button>
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

      <div v-else-if="filteredList.length" class="adoption-list">
        <div v-for="item in filteredList" :key="item._id" class="adoption-card">
          <div class="card-top" @click="goToDetail(item._id)">
            <div class="card-img-wrap">
              <img v-if="item.petInfo?.photos?.length" :src="item.petInfo.photos[0]" class="card-img" />
              <div v-else class="card-img-placeholder">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="var(--color-border)" stroke-width="1.2"/></svg>
              </div>
            </div>
            <div class="card-info">
              <h3 class="card-name">{{ item.petInfo?.name || '未命名' }}</h3>
              <p class="card-meta">{{ speciesLabelMap[item.petInfo?.species] || '其他' }} · {{ item.location?.city || '未知城市' }}</p>
              <p class="card-time">发布于 {{ formatDate(item.createdAt) }}</p>
            </div>
            <span class="card-status" :class="item.status">{{ statusLabelMap[item.status] }}</span>
          </div>
          <div class="card-stats-row">
            <span class="card-stat">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" stroke-width="1.5"/><circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="1.5"/></svg>
              {{ item.viewCount || 0 }} 浏览
            </span>
            <span class="card-stat">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke="currentColor" stroke-width="1.5"/><circle cx="8.5" cy="7" r="4" stroke="currentColor" stroke-width="1.5"/></svg>
              {{ item.applicationCount || 0 }} 申请
            </span>
          </div>
          <div class="card-actions">
            <button class="action-btn" @click="goToDetail(item._id)">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" stroke-width="1.5"/><circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="1.5"/></svg>
              查看详情
            </button>
            <button v-if="item.applicationCount > 0" class="action-btn primary" @click="goToApplications(item._id)">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke="currentColor" stroke-width="1.5"/><circle cx="8.5" cy="7" r="4" stroke="currentColor" stroke-width="1.5"/></svg>
              查看申请
            </button>
            <button v-if="item.status === 'pending'" class="action-btn danger" @click="handleClose(item)">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
              关闭
            </button>
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
        <h3 class="empty-title">{{ currentFilter ? '没有' + statusLabelMap[currentFilter] + '的领养' : '还没有发布领养' }}</h3>
        <p class="empty-desc">{{ currentFilter ? '换个筛选条件试试' : '发布一个领养信息，帮助毛孩子找到新家' }}</p>
        <button v-if="!currentFilter" class="empty-action" @click="router.push('/adoption/publish')">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/></svg>
          发布领养
        </button>
      </div>
    </div>

    <!-- Close Confirmation Modal -->
    <n-modal v-model:show="closeModalVisible" :border-radius="16" style="max-width: 400px;">
      <div class="modal-content">
        <h3 class="modal-title">确认关闭</h3>
        <p class="modal-desc">关闭后该领养信息将不再显示，已有申请将保留。确认关闭？</p>
        <div class="modal-actions">
          <n-button @click="closeModalVisible = false" size="large">取消</n-button>
          <n-button type="error" strong size="large" :loading="closing" @click="confirmClose">确认关闭</n-button>
        </div>
      </div>
    </n-modal>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { NModal, NButton, useMessage } from 'naive-ui'
import { useAdoptionStore } from '../../stores/adoption'

const router = useRouter()
const adoptionStore = useAdoptionStore()
const message = useMessage()

const loading = ref(false)
const closing = ref(false)
const currentFilter = ref('')
const closeModalVisible = ref(false)
let closeTarget = null

const statusFilters = [
  { value: '', label: '全部' },
  { value: 'pending', label: '可领养' },
  { value: 'adopted', label: '已领养' },
  { value: 'closed', label: '已关闭' }
]

const statusLabelMap = {
  pending: '可领养',
  adopted: '已领养',
  closed: '已关闭'
}

const speciesLabelMap = {
  cat: '猫咪', dog: '狗狗', rabbit: '兔兔',
  bird: '鸟鸟', fish: '鱼鱼', hamster: '仓鼠', other: '其他'
}

const filteredList = computed(() => {
  const list = adoptionStore.myAdoptions
  if (!currentFilter.value) return list
  return list.filter(item => item.status === currentFilter.value)
})

function formatDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}

function goToDetail(id) { router.push(`/adoption/${id}`) }
function goToApplications(id) { router.push(`/adoption/${id}/applications`) }

async function switchFilter(val) {
  currentFilter.value = val
}

function handleClose(item) {
  closeTarget = item
  closeModalVisible.value = true
}

async function confirmClose() {
  if (!closeTarget) return
  closing.value = true
  try {
    await adoptionStore.removeAdoption(closeTarget._id)
    closeTarget.status = 'closed'
    closeModalVisible.value = false
    message.success('领养信息已关闭')
  } catch (err) {
    message.error(err.message || '操作失败')
  } finally {
    closing.value = false
  }
}

async function fetchList() {
  loading.value = true
  await adoptionStore.fetchMyAdoptions()
  loading.value = false
}

onMounted(() => { fetchList() })
</script>

<style scoped>
.my-adoptions-page {
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

.publish-btn {
  width: 36px; height: 36px; border: none; background: var(--color-primary-light);
  color: var(--color-primary); cursor: pointer; display: flex; align-items: center;
  justify-content: center; border-radius: 50%; transition: all 0.25s;
}
.publish-btn:hover { background: var(--color-primary); color: #fff; }

.filter-bar {
  display: flex; gap: 8px; padding: 10px 16px;
  overflow-x: auto; -webkit-overflow-scrolling: touch; scrollbar-width: none;
}
.filter-bar::-webkit-scrollbar { display: none; }

.filter-tab {
  flex-shrink: 0; padding: 6px 16px; border: 1.5px solid var(--color-border);
  border-radius: 18px; background: var(--color-bg-white); font-size: 13px;
  color: var(--color-text-muted); cursor: pointer; transition: all 0.3s; font-weight: 500;
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

.adoption-list { display: flex; flex-direction: column; gap: 12px; }

.adoption-card {
  background: var(--color-bg-white); border-radius: 16px;
  border: 1px solid rgba(0,0,0,0.04); box-shadow: 0 2px 8px rgba(0,0,0,0.03);
  overflow: hidden; transition: all 0.3s;
}
.adoption-card:hover { box-shadow: 0 6px 20px rgba(0,0,0,0.06); }

.card-top { display: flex; align-items: flex-start; gap: 12px; padding: 16px; cursor: pointer; }
.card-top:hover { background: rgba(16,185,129,0.02); }

.card-img-wrap {
  width: 56px; height: 56px; border-radius: 12px; overflow: hidden; flex-shrink: 0;
  background: var(--color-bg-light);
}
.card-img { width: 100%; height: 100%; object-fit: cover; }
.card-img-placeholder {
  width: 100%; height: 100%; display: flex; align-items: center; justify-content: center;
  background: var(--color-bg-muted);
}

.card-info { flex: 1; min-width: 0; }
.card-name { font-size: 15px; font-weight: 700; color: var(--color-text-primary); margin: 0 0 3px; }
.card-meta { font-size: 12px; color: var(--color-text-muted); margin: 0 0 2px; }
.card-time { font-size: 11px; color: var(--color-text-muted); margin: 0; opacity: 0.7; }

.card-status {
  flex-shrink: 0; padding: 3px 10px; border-radius: 10px; font-size: 11px; font-weight: 600;
}
.card-status.pending { background: rgba(16,185,129,0.1); color: #059669; }
.card-status.adopted { background: rgba(59,130,246,0.1); color: #2563eb; }
.card-status.closed { background: rgba(107,114,128,0.1); color: #6b7280; }

.card-stats-row {
  display: flex; gap: 16px; padding: 0 16px 12px;
}
.card-stat {
  display: flex; align-items: center; gap: 4px;
  font-size: 12px; color: var(--color-text-muted);
}

.card-actions {
  display: flex; gap: 8px; padding: 10px 16px; border-top: 1px solid var(--color-border);
}
.action-btn {
  flex: 1; display: flex; align-items: center; justify-content: center; gap: 4px;
  padding: 8px 0; border: 1.5px solid var(--color-border); border-radius: 12px;
  background: var(--color-bg-white); font-size: 12px; color: var(--color-text-muted);
  cursor: pointer; transition: all 0.2s; font-weight: 500;
}
.action-btn:hover { border-color: var(--color-primary); color: var(--color-primary); }
.action-btn.primary { border-color: rgba(16,185,129,0.3); color: #059669; background: rgba(16,185,129,0.04); }
.action-btn.primary:hover { background: rgba(16,185,129,0.1); border-color: #10B981; }
.action-btn.danger { border-color: rgba(239,68,68,0.2); color: #ef4444; }
.action-btn.danger:hover { background: rgba(239,68,68,0.06); border-color: #ef4444; }

/* Empty */
.empty-state {
  display: flex; flex-direction: column; align-items: center;
  justify-content: center; padding: 80px 20px 60px; gap: 14px;
}
.empty-illustration {
  margin-bottom: 12px; animation: float 3.5s ease-in-out infinite;
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

/* Modal */
.modal-content { padding: 24px; background: #fff; border-radius: 16px; }
.modal-title { font-size: 18px; font-weight: 700; margin: 0 0 8px; color: var(--color-text-primary); }
.modal-desc { font-size: 13px; color: var(--color-text-muted); margin: 0 0 16px; line-height: 1.6; }
.modal-actions { display: flex; gap: 10px; justify-content: flex-end; }

@media (max-width: 768px) {
  .content-body { padding: 4px 12px; }
  .filter-bar { padding: 8px 12px; }
}
</style>