<template>
  <div class="adoption-applications-page">
    <div class="page-header">
      <button class="back-btn" @click="router.back()" aria-label="返回">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M15 18l-6-6 6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </button>
      <div class="header-center">
        <h2 class="header-title">申请管理</h2>
        <span class="header-sub" v-if="adoption">{{ adoption.petInfo?.name || '宠物' }} · {{ applications.length }} 份申请</span>
      </div>
      <div style="width:36px"></div>
    </div>

    <!-- 统计概览卡片 -->
    <div class="stats-grid">
      <div class="stat-card" :class="{ active: currentFilter === 'pending' }" @click="currentFilter = currentFilter === 'pending' ? '' : 'pending'">
        <div class="stat-num pending-num">{{ countByStatus('pending') }}</div>
        <div class="stat-label">待审核</div>
      </div>
      <div class="stat-card" :class="{ active: currentFilter === 'approved' }" @click="currentFilter = currentFilter === 'approved' ? '' : 'approved'">
        <div class="stat-num approved-num">{{ countByStatus('approved') }}</div>
        <div class="stat-label">已通过</div>
      </div>
      <div class="stat-card" :class="{ active: currentFilter === 'rejected' }" @click="currentFilter = currentFilter === 'rejected' ? '' : 'rejected'">
        <div class="stat-num rejected-num">{{ countByStatus('rejected') }}</div>
        <div class="stat-label">未通过</div>
      </div>
    </div>

    <div class="filter-bar">
      <button
        v-for="f in statusFilters"
        :key="f.value"
        class="filter-tab"
        :class="{ active: currentFilter === f.value, highlight: f.value === 'pending' && countByStatus('pending') > 0 }"
        @click="currentFilter = f.value"
      >
        {{ f.label }}
        <span class="filter-count" v-if="f.value && countByStatus(f.value) > 0">{{ countByStatus(f.value) }}</span>
      </button>
    </div>

    <div class="content-body">
      <div v-if="loading" class="loading-wrap">
        <div class="pulse-dots"><i></i><i></i><i></i></div>
      </div>

      <div v-else-if="filteredList.length" class="app-list">
        <div v-for="app in filteredList" :key="app._id" class="app-card" :class="[app.status, { 'is-new': isNew(app) }]">
          <div class="app-card-top" @click="toggleExpand(app._id)">
            <div class="app-avatar-wrap">
              <img v-if="app.applicantId?.avatar" :src="app.applicantId.avatar" class="app-avatar" :alt="app.applicantInfo?.realName" />
              <div v-else class="app-avatar-fb">{{ (app.applicantInfo?.realName || '?').charAt(0) }}</div>
              <span v-if="isNew(app)" class="new-badge">新</span>
            </div>
            <div class="app-info">
              <div class="app-name-row">
                <h3 class="app-name">{{ app.applicantInfo?.realName || '匿名用户' }}</h3>
                <span class="app-meta-tag" v-if="app.applicantInfo?.age">{{ app.applicantInfo.age }}岁</span>
                <span class="app-meta-tag" v-if="app.applicantInfo?.occupation">{{ app.applicantInfo.occupation }}</span>
              </div>
              <p class="app-reason-preview" v-if="app.applicantInfo?.reasonToAdopt">{{ app.applicantInfo.reasonToAdopt.slice(0, 50) }}{{ app.applicantInfo.reasonToAdopt.length > 50 ? '...' : '' }}</p>
              <p class="app-time">申请于 {{ formatDate(app.createdAt) }}</p>
            </div>
            <div class="app-card-right">
              <span class="app-status-badge" :class="app.status">{{ statusLabelMap[app.status] }}</span>
              <span class="expand-arrow" :class="{ open: expandedId === app._id }">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M9 18l6-6-6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
              </span>
            </div>
          </div>

          <!-- 快速操作按钮（仅待审核，收起状态也显示） -->
          <div v-if="app.status === 'pending' && expandedId !== app._id" class="quick-actions">
            <button class="quick-reject" @click.stop="showRejectDialog(app)" aria-label="拒绝">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
              拒绝
            </button>
            <button class="quick-approve" @click.stop="handleApprove(app)" aria-label="通过">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M5 13l4 4L19 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
              通过
            </button>
          </div>

          <transition name="slide">
            <div v-if="expandedId === app._id" class="app-detail">
              <div class="detail-grid">
                <div class="detail-item" v-if="app.applicantInfo?.age">
                  <span class="detail-label">年龄</span>
                  <span class="detail-value">{{ app.applicantInfo.age }}岁</span>
                </div>
                <div class="detail-item" v-if="app.applicantInfo?.occupation">
                  <span class="detail-label">职业</span>
                  <span class="detail-value">{{ app.applicantInfo.occupation }}</span>
                </div>
                <div class="detail-item" v-if="app.applicantInfo?.phone">
                  <span class="detail-label">电话</span>
                  <a class="detail-value link" :href="'tel:' + app.applicantInfo.phone">{{ app.applicantInfo.phone }}</a>
                </div>
                <div class="detail-item" v-if="app.applicantInfo?.address">
                  <span class="detail-label">地址</span>
                  <span class="detail-value">{{ app.applicantInfo.address }}</span>
                </div>
                <div class="detail-item" v-if="app.applicantInfo?.housingType">
                  <span class="detail-label">住房</span>
                  <span class="detail-value">{{ housingMap[app.applicantInfo.housingType] || app.applicantInfo.housingType }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">养宠经验</span>
                  <span class="detail-value">{{ app.applicantInfo?.hasExperience ? '有' : '无' }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">家人同意</span>
                  <span class="detail-value">{{ app.applicantInfo?.familyAgreement ? '是' : '否' }}</span>
                </div>
                <div class="detail-item" v-if="app.applicantInfo?.currentPets">
                  <span class="detail-label">当前宠物</span>
                  <span class="detail-value">{{ app.applicantInfo.currentPets }}</span>
                </div>
              </div>
              <div class="detail-reason" v-if="app.applicantInfo?.reasonToAdopt">
                <span class="detail-label">申请理由</span>
                <p class="reason-text">{{ app.applicantInfo.reasonToAdopt }}</p>
              </div>

              <div v-if="app.status === 'rejected' && app.review?.reason" class="reject-info">
                <span class="reject-label">拒绝原因</span>
                <p class="reject-text">{{ app.review.reason }}</p>
              </div>

              <div v-if="app.status === 'pending'" class="action-row">
                <button class="reject-btn" @click="showRejectDialog(app)">拒绝</button>
                <button class="approve-btn" @click="handleApprove(app)">通过</button>
              </div>

              <!-- 已通过：回访记录 -->
              <div v-if="app.status === 'approved'" class="followup-section">
                <div class="followup-header">
                  <span class="followup-title">回访记录</span>
                  <button class="followup-add-btn" @click="showFollowUpModal(app)">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
                    添加回访
                  </button>
                </div>
                <div v-if="app.followUps?.length" class="followup-list">
                  <div v-for="(fu, idx) in app.followUps" :key="idx" class="followup-item">
                    <div class="followup-meta">
                      <span class="followup-date">{{ formatDate(fu.date) }}</span>
                    </div>
                    <p v-if="fu.description" class="followup-desc">{{ fu.description }}</p>
                    <div v-if="fu.photos?.length" class="followup-photos">
                      <img v-for="(photo, pi) in fu.photos" :key="pi" :src="photo" class="followup-photo" alt="回访照片" />
                    </div>
                  </div>
                </div>
                <p v-else class="followup-empty">暂无回访记录</p>
              </div>
            </div>
          </transition>
        </div>
      </div>

      <div v-else class="empty-state">
        <div class="empty-icon">
          <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
            <rect x="12" y="8" width="40" height="48" rx="4" stroke="#d1d5db" stroke-width="2" fill="#f9fafb"/>
            <path d="M20 20h24M20 28h18M20 36h20" stroke="#e5e7eb" stroke-width="2" stroke-linecap="round"/>
            <circle cx="48" cy="48" r="12" fill="#f0fdf4" stroke="#86efac" stroke-width="2"/>
            <path d="M44 48h8M48 44v8" stroke="#22c55e" stroke-width="2" stroke-linecap="round"/>
          </svg>
        </div>
        <h3 class="empty-title">暂无{{ currentFilter ? statusLabelMap[currentFilter] : '' }}申请</h3>
        <p class="empty-desc">{{ emptyDesc }}</p>
      </div>
    </div>

    <!-- Reject Dialog -->
    <n-modal v-model:show="rejectModalVisible" :border-radius="16" style="max-width: 400px;">
      <div class="reject-modal">
        <h3 class="reject-modal-title">拒绝申请</h3>
        <p class="reject-modal-desc">请填写拒绝原因，方便申请人了解</p>
        <div class="reject-presets">
          <button
            v-for="preset in rejectPresets"
            :key="preset"
            class="preset-chip"
            :class="{ active: rejectReason === preset }"
            @click="rejectReason = preset"
          >{{ preset }}</button>
        </div>
        <n-input
          v-model:value="rejectReason"
          type="textarea"
          placeholder="输入拒绝原因（可选）"
          :rows="3"
          size="large"
        />
        <div class="reject-modal-actions">
          <n-button @click="rejectModalVisible = false" size="large">取消</n-button>
          <n-button type="error" strong size="large" :loading="reviewing" @click="handleReject">确认拒绝</n-button>
        </div>
      </div>
    </n-modal>

    <!-- Approve Confirmation Modal -->
    <n-modal v-model:show="approveModalVisible" :border-radius="16" style="max-width: 400px;">
      <div class="reject-modal">
        <h3 class="reject-modal-title">确认通过申请</h3>
        <p class="reject-modal-desc">通过后将自动拒绝其他待审核申请，确认继续？</p>
        <div class="reject-modal-actions">
          <n-button @click="approveModalVisible = false" size="large">取消</n-button>
          <n-button type="success" strong size="large" :loading="reviewing" @click="confirmApprove">确认通过</n-button>
        </div>
      </div>
    </n-modal>

    <!-- Follow-Up Modal -->
    <n-modal v-model:show="followUpModalVisible" :border-radius="16" style="max-width: 420px;">
      <div class="followup-modal">
        <h3 class="followup-modal-title">添加回访记录</h3>
        <p class="followup-modal-desc">记录宠物的近况，方便跟踪领养效果</p>
        <div class="form-field">
          <label class="field-label">回访描述</label>
          <n-input v-model:value="followUpForm.description" type="textarea" placeholder="宠物近况如何？领养人照顾得怎样？" :rows="3" size="large" />
        </div>
        <div class="form-field">
          <label class="field-label">回访照片（选填）</label>
          <ImageUploader v-model="followUpForm.photos" :max="3" />
        </div>
        <div class="followup-modal-actions">
          <n-button @click="followUpModalVisible = false" size="large">取消</n-button>
          <n-button type="success" strong size="large" :loading="followUpLoading" @click="submitFollowUp">提交回访</n-button>
        </div>
      </div>
    </n-modal>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { NModal, NInput, NButton, useMessage } from 'naive-ui'
import { useAdoptionStore } from '../../stores/adoption'
import { onSocket, offSocket } from '../../utils/websocket'
import ImageUploader from '../../components/common/ImageUploader.vue'

const router = useRouter()
const route = useRoute()
const message = useMessage()
const adoptionStore = useAdoptionStore()

const loading = ref(false)
const currentFilter = ref('')
const expandedId = ref(null)
const rejectModalVisible = ref(false)
const rejectReason = ref('')
const reviewing = ref(false)
const approveModalVisible = ref(false)
const followUpModalVisible = ref(false)
const followUpLoading = ref(false)
const followUpForm = ref({ description: '', photos: [] })
let approveTarget = null
let rejectTarget = null
let followUpTarget = null

const rejectPresets = ['经验不足', '居住条件不符', '工作时间不适合养宠', '已有宠物过多', '年龄不符', '其他']

const adoption = computed(() => adoptionStore.currentAdoption)
const applications = computed(() => adoptionStore.adoptionApplications)

const statusFilters = [
  { value: '', label: '全部' },
  { value: 'pending', label: '待审核' },
  { value: 'approved', label: '已通过' },
  { value: 'rejected', label: '未通过' }
]

const statusLabelMap = {
  pending: '待审核',
  approved: '已通过',
  rejected: '未通过',
  cancelled: '已取消'
}

const housingMap = {
  own: '自有住房',
  rent: '租房',
  dorm: '宿舍',
  other: '其他'
}

const filteredList = computed(() => {
  const list = applications.value || []
  if (!currentFilter.value) return list
  return list.filter(app => app.status === currentFilter.value)
})

const emptyDesc = computed(() => {
  if (!currentFilter.value) return '分享领养信息，让更多人看到你的宠物'
  if (currentFilter.value === 'pending') return '所有申请都已处理完毕'
  if (currentFilter.value === 'approved') return '还没有通过任何申请'
  return '没有被拒绝的申请，太棒了'
})

function countByStatus(status) {
  return (applications.value || []).filter(app => app.status === status).length
}

function isNew(app) {
  if (!app.createdAt) return false
  return Date.now() - new Date(app.createdAt).getTime() < 24 * 60 * 60 * 1000
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function toggleExpand(id) {
  expandedId.value = expandedId.value === id ? null : id
}

async function handleApprove(app) {
  approveTarget = app
  approveModalVisible.value = true
}

async function confirmApprove() {
  if (!approveTarget) return
  reviewing.value = true
  try {
    await adoptionStore.reviewApp(approveTarget._id, { result: 'approved' })
    approveTarget.status = 'approved'
    approveModalVisible.value = false
    message.success('已通过申请')
  } catch (err) {
    message.error(err.message || '操作失败')
  } finally {
    reviewing.value = false
  }
}

function showRejectDialog(app) {
  rejectTarget = app
  rejectReason.value = ''
  rejectModalVisible.value = true
}

async function handleReject() {
  if (!rejectTarget) return
  reviewing.value = true
  try {
    await adoptionStore.reviewApp(rejectTarget._id, { result: 'rejected', reason: rejectReason.value })
    rejectTarget.status = 'rejected'
    if (rejectReason.value) {
      rejectTarget.review = { ...(rejectTarget.review || {}), reason: rejectReason.value }
    }
    rejectModalVisible.value = false
    message.success('已拒绝申请')
  } catch (err) {
    message.error(err.message || '操作失败')
  } finally {
    reviewing.value = false
  }
}

function showFollowUpModal(app) {
  followUpTarget = app
  followUpForm.value = { description: '', photos: [] }
  followUpModalVisible.value = true
}

async function submitFollowUp() {
  if (!followUpTarget) return
  if (!followUpForm.value.description.trim()) {
    message.warning('请填写回访描述')
    return
  }
  followUpLoading.value = true
  try {
    const result = await adoptionStore.submitFollowUp(followUpTarget._id, {
      description: followUpForm.value.description,
      photos: followUpForm.value.photos
    })
    if (!followUpTarget.followUps) followUpTarget.followUps = []
    followUpTarget.followUps.push(result)
    followUpModalVisible.value = false
    message.success('回访记录已添加')
  } catch (err) {
    message.error(err.message || '添加失败')
  } finally {
    followUpLoading.value = false
  }
}

onMounted(async () => {
  const id = route.params.id
  if (id) {
    loading.value = true
    await Promise.all([
      adoptionStore.fetchAdoptionDetail(id),
      adoptionStore.fetchAdoptionApplications(id)
    ])
    loading.value = false
  }
})

// 监听实时通知，匹配当前领养发布时自动刷新申请列表
function handleNotification(data) {
  const id = route.params.id
  if (data?.type === 'adoption' && data?.adoptionId === id) {
    adoptionStore.fetchAdoptionApplications(id)
  }
}
onSocket('notification', handleNotification)
onUnmounted(() => {
  offSocket('notification', handleNotification)
})
</script>

<style scoped>
.adoption-applications-page {
  min-height: 100vh;
  background: var(--color-bg, #f8faf9);
  padding-bottom: 40px;
}

.page-header {
  display: flex; align-items: center; justify-content: space-between;
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
.header-center { text-align: center; flex: 1; }
.header-title { font-size: 16px; font-weight: 700; color: var(--color-text-primary); margin: 0; }
.header-sub { font-size: 12px; color: var(--color-text-muted); }

/* Stats Grid */
.stats-grid {
  display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px;
  padding: 14px 16px 6px;
}
.stat-card {
  background: var(--color-bg-white, #fff); border-radius: 14px;
  padding: 14px 12px; text-align: center;
  box-shadow: 0 1px 4px rgba(0,0,0,0.04);
  cursor: pointer; transition: all 0.3s;
  border: 1.5px solid transparent;
}
.stat-card:hover { border-color: rgba(16,185,129,0.15); }
.stat-card.active { border-color: var(--color-primary); background: rgba(16,185,129,0.04); }
.stat-num { font-size: 26px; font-weight: 800; line-height: 1.1; margin-bottom: 4px; }
.pending-num { color: #d97706; }
.approved-num { color: #059669; }
.rejected-num { color: #9ca3af; }
.stat-label { font-size: 12px; color: var(--color-text-muted); font-weight: 500; }

/* Filter Bar */
.filter-bar {
  display: flex; gap: 8px; padding: 10px 16px;
  overflow-x: auto; -webkit-overflow-scrolling: touch; scrollbar-width: none;
}
.filter-bar::-webkit-scrollbar { display: none; }
.filter-tab {
  flex-shrink: 0; padding: 6px 14px; border: 1.5px solid var(--color-border);
  border-radius: 18px; background: var(--color-bg-white); font-size: 13px;
  color: var(--color-text-muted); cursor: pointer; transition: all 0.3s; font-weight: 500;
  display: flex; align-items: center; gap: 5px;
}
.filter-tab:hover { border-color: rgba(16,185,129,0.3); color: #10B981; }
.filter-tab.active {
  border-color: #10B981; color: #10B981;
  background: rgba(16,185,129,0.06); font-weight: 600;
}
.filter-tab.highlight { border-color: rgba(245,158,11,0.3); }
.filter-tab.highlight.active { border-color: #d97706; color: #d97706; background: rgba(245,158,11,0.06); }
.filter-count {
  display: inline-flex; align-items: center; justify-content: center;
  min-width: 18px; height: 18px; padding: 0 5px;
  border-radius: 9px; font-size: 11px; font-weight: 700;
  background: var(--color-bg-light); color: var(--color-text-muted);
}
.filter-tab.active .filter-count { background: rgba(16,185,129,0.15); color: #10B981; }

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
  background: var(--color-bg-white, #fff); border-radius: 16px;
  border: 1px solid rgba(0,0,0,0.04); box-shadow: 0 2px 8px rgba(0,0,0,0.03);
  overflow: hidden; transition: all 0.3s; position: relative;
}
/* Card hover enhanced for pending */

.app-card-top {
  display: flex; align-items: flex-start; gap: 12px;
  padding: 16px 16px 16px 20px; cursor: pointer;
}
.app-card-top:hover { background: rgba(16,185,129,0.02); }

.app-avatar-wrap {
  width: 44px; height: 44px; border-radius: 50%; overflow: hidden; flex-shrink: 0;
  background: var(--color-bg-light); position: relative;
}
.app-avatar { width: 100%; height: 100%; object-fit: cover; }
.app-avatar-fb {
  width: 100%; height: 100%; display: flex; align-items: center; justify-content: center;
  font-size: 18px; font-weight: 600; color: var(--color-primary); background: var(--color-primary-bg);
}
.new-badge {
  position: absolute; top: -2px; right: -2px;
  width: 16px; height: 16px; border-radius: 50%;
  background: #f59e0b; color: #fff; font-size: 9px; font-weight: 700;
  display: flex; align-items: center; justify-content: center;
  border: 1.5px solid #fff;
}

.app-info { flex: 1; min-width: 0; }
.app-name-row { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; margin-bottom: 3px; }
.app-name { font-size: 15px; font-weight: 700; color: var(--color-text-primary); margin: 0; }
.app-meta-tag {
  padding: 1px 8px; border-radius: 8px; font-size: 11px; font-weight: 500;
  background: var(--color-bg-light); color: var(--color-text-muted);
}
.app-reason-preview {
  font-size: 12px; color: var(--color-text-muted); margin: 0 0 3px;
  line-height: 1.5; overflow: hidden; display: -webkit-box;
  -webkit-line-clamp: 2; -webkit-box-orient: vertical;
}
.app-time { font-size: 11px; color: var(--color-text-muted); margin: 0; opacity: 0.7; }

.app-card-right { display: flex; flex-direction: column; align-items: flex-end; gap: 6px; flex-shrink: 0; }
.app-status-badge {
  padding: 3px 10px; border-radius: 10px; font-size: 11px; font-weight: 600;
}
.app-status-badge.pending { background: rgba(245,158,11,0.1); color: #d97706; }
.app-status-badge.approved { background: rgba(16,185,129,0.1); color: #059669; }
.app-status-badge.rejected { background: rgba(239,68,68,0.1); color: #ef4444; }
.app-status-badge.cancelled { background: rgba(107,114,128,0.1); color: #6b7280; }

.expand-arrow {
  color: var(--color-text-muted); transition: transform 0.3s;
  display: flex; opacity: 0.5;
}
.expand-arrow.open { transform: rotate(90deg); }

/* Quick Actions */
.quick-actions {
  display: flex; gap: 8px; justify-content: flex-end;
  padding: 0 20px 14px; border-top: 1px solid var(--color-border);
  padding-top: 12px; margin-top: 0;
}
.quick-reject, .quick-approve {
  display: flex; align-items: center; gap: 4px;
  padding: 6px 14px; border-radius: 16px; font-size: 12px; font-weight: 600;
  cursor: pointer; transition: all 0.25s; border: 1.5px solid;
}
.quick-reject {
  border-color: rgba(239,68,68,0.25); color: #ef4444; background: rgba(239,68,68,0.04);
}
.quick-reject:hover { background: rgba(239,68,68,0.1); border-color: rgba(239,68,68,0.4); }
.quick-approve {
  border-color: rgba(16,185,129,0.25); color: #059669; background: rgba(16,185,129,0.04);
}
.quick-approve:hover { background: rgba(16,185,129,0.1); border-color: rgba(16,185,129,0.4); }

/* Expanded Detail */
.app-detail {
  padding: 0 20px 16px; border-top: 1px solid var(--color-border);
  animation: slide-down 0.25s ease;
}
@keyframes slide-down {
  from { opacity: 0; transform: translateY(-8px); }
  to { opacity: 1; transform: translateY(0); }
}
.slide-enter-active { animation: slide-down 0.25s ease; }
.slide-leave-active { animation: slide-down 0.2s ease reverse; }

.detail-grid {
  display: grid; grid-template-columns: 1fr 1fr; gap: 12px; padding-top: 14px;
}
.detail-item { display: flex; flex-direction: column; gap: 2px; }
.detail-label { font-size: 11px; color: var(--color-text-muted); font-weight: 500; }
.detail-value { font-size: 13px; color: var(--color-text-primary); font-weight: 500; }
.detail-value.link { color: var(--color-primary); text-decoration: none; }
.detail-value.link:hover { text-decoration: underline; }

.detail-reason { margin-top: 14px; padding-top: 14px; border-top: 1px solid var(--color-border); }
.reason-text {
  font-size: 13px; color: var(--color-text-secondary); line-height: 1.7;
  margin: 4px 0 0; background: var(--color-bg); padding: 10px 14px;
  border-radius: var(--radius-sm);
}

.reject-info {
  margin-top: 12px; padding: 10px 14px; background: rgba(239,68,68,0.05);
  border-radius: var(--radius-sm); border-left: 3px solid var(--color-danger);
}
.reject-label { font-size: 11px; color: var(--color-danger); font-weight: 600; }
.reject-text { font-size: 13px; color: var(--color-text-secondary); margin: 4px 0 0; }

.action-row {
  display: flex; gap: 10px; justify-content: flex-end;
  margin-top: 16px; padding-top: 14px; border-top: 1px solid var(--color-border);
}
.reject-btn {
  padding: 8px 20px; border: 1.5px solid var(--color-border); border-radius: 20px;
  background: var(--color-bg-white); font-size: 13px; color: var(--color-text-muted);
  cursor: pointer; transition: all 0.3s; font-weight: 600;
}
.reject-btn:hover { border-color: var(--color-danger); color: var(--color-danger); }
.approve-btn {
  padding: 8px 24px; border: none; border-radius: 20px;
  background: linear-gradient(135deg, #10B981, #059669);
  font-size: 13px; color: #fff; cursor: pointer; transition: all 0.3s;
  font-weight: 600; box-shadow: 0 4px 12px rgba(16,185,129,0.3);
}
.approve-btn:hover { box-shadow: 0 6px 16px rgba(16,185,129,0.4); }

/* Empty */
.empty-state {
  display: flex; flex-direction: column; align-items: center;
  justify-content: center; padding: 80px 20px; gap: 12px;
}
.empty-icon { margin-bottom: 8px; opacity: 0.6; }
.empty-title { font-size: 16px; font-weight: 700; color: var(--color-text-secondary); margin: 0; }
.empty-desc { font-size: 13px; color: var(--color-text-muted); margin: 0; text-align: center; }

/* Reject Modal */
.reject-modal { padding: 24px; background: #fff; border-radius: 16px; }
.reject-modal-title { font-size: 18px; font-weight: 700; margin: 0 0 8px; color: var(--color-text-primary); }
.reject-modal-desc { font-size: 13px; color: var(--color-text-muted); margin: 0 0 16px; }
.reject-modal-actions { display: flex; gap: 10px; justify-content: flex-end; margin-top: 16px; }

.reject-presets { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 12px; }
.preset-chip {
  padding: 5px 14px; border: 1.5px solid var(--color-border); border-radius: 18px;
  background: var(--color-bg-white); font-size: 12px; color: var(--color-text-muted);
  cursor: pointer; transition: all 0.2s; font-weight: 500;
}
.preset-chip:hover { border-color: var(--color-primary); color: var(--color-primary); }
.preset-chip.active { border-color: var(--color-primary); color: var(--color-primary); background: rgba(16,185,129,0.06); }

/* Follow-Up Section */
.followup-section {
  margin-top: 14px; padding-top: 14px; border-top: 1px solid var(--color-border);
}
.followup-header {
  display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;
}
.followup-title { font-size: 13px; font-weight: 700; color: var(--color-text-primary); }
.followup-add-btn {
  display: flex; align-items: center; gap: 4px;
  padding: 5px 12px; border-radius: 14px; font-size: 12px; font-weight: 600;
  cursor: pointer; transition: all 0.25s;
  border: 1.5px solid rgba(16,185,129,0.3); color: #059669; background: rgba(16,185,129,0.04);
}
.followup-add-btn:hover { background: rgba(16,185,129,0.1); border-color: #10B981; }
.followup-list { display: flex; flex-direction: column; gap: 10px; }
.followup-item {
  padding: 10px 12px; background: var(--color-bg); border-radius: 10px;
  border-left: 3px solid var(--color-primary);
}
.followup-meta { margin-bottom: 4px; }
.followup-date { font-size: 11px; color: var(--color-text-muted); font-weight: 500; }
.followup-desc { font-size: 13px; color: var(--color-text-secondary); margin: 0; line-height: 1.6; }
.followup-photos { display: flex; gap: 6px; margin-top: 8px; flex-wrap: wrap; }
.followup-photo { width: 56px; height: 56px; border-radius: 8px; object-fit: cover; }
.followup-empty { font-size: 12px; color: var(--color-text-muted); margin: 0; opacity: 0.7; }

/* Follow-Up Modal */
.followup-modal { padding: 24px; background: #fff; border-radius: 16px; }
.followup-modal-title { font-size: 18px; font-weight: 700; margin: 0 0 8px; color: var(--color-text-primary); }
.followup-modal-desc { font-size: 13px; color: var(--color-text-muted); margin: 0 0 16px; }
.followup-modal-actions { display: flex; gap: 10px; justify-content: flex-end; margin-top: 16px; }
.followup-modal .form-field { margin-bottom: 14px; }
.followup-modal .field-label { display: block; font-size: 13px; font-weight: 600; color: var(--color-text-secondary); margin-bottom: 6px; }

@media (max-width: 768px) {
  .content-body { padding: 4px 12px; }
  .filter-bar { padding: 8px 12px; }
  .detail-grid { grid-template-columns: 1fr; }
}
</style>