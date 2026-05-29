<template>
  <div class="merchant-center">
    <div class="page-header">
      <n-button quaternary @click="router.back()">
        <template #icon><svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></template>
        返回
      </n-button>
      <h2 class="header-title">商家中心</h2>
      <n-button quaternary @click="router.push('/merchant/services/publish')">
        <template #icon><svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></template>
      </n-button>
    </div>

    <!-- 快捷入口 -->
    <div class="quick-grid">
      <div class="quick-item" @click="router.push('/merchant/services/publish')">
        <div class="quick-icon green"><svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></div>
        <span>发布服务</span>
      </div>
      <div class="quick-item" @click="router.push('/merchant/orders')">
        <div class="quick-icon blue"><svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg></div>
        <span>订单管理</span>
      </div>
      <div class="quick-item" @click="router.push('/services/orders')">
        <div class="quick-icon purple"><svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg></div>
        <span>我的订单</span>
      </div>
    </div>

    <!-- 我的服务 -->
    <div class="section">
      <div class="section-header">
        <h3>我的服务</h3>
        <span class="count">{{ services.length }}个</span>
      </div>
      <div v-if="loading" class="loading-wrap"><div class="spinner"></div></div>
      <div v-else-if="services.length" class="service-list">
        <div v-for="svc in services" :key="svc._id" class="svc-card">
          <img v-if="svc.images?.length" :src="resolveFileUrl(svc.images[0])" class="svc-img" />
          <div class="svc-placeholder" v-else>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="18" height="18" rx="3" stroke="#ccc" stroke-width="1.5"/></svg>
          </div>
          <div class="svc-info">
            <h4>{{ svc.serviceName }}</h4>
            <span class="svc-status" :class="svc.status">{{ statusLabel(svc.status) }}</span>
            <span class="svc-stats">{{ svc.stats?.orderCount || 0 }}单 · {{ svc.stats?.rating?.toFixed(1) || '0.0' }}分</span>
          </div>
          <div class="svc-actions">
            <n-button size="tiny" @click="router.push(`/services/${svc._id}`)">查看</n-button>
            <n-button size="tiny" type="info" @click="router.push(`/services/${svc._id}/edit`)">编辑</n-button>
            <n-button size="tiny" :type="svc.status === 'active' ? 'warning' : 'success'" @click="toggleStatus(svc)">
              {{ svc.status === 'active' ? '下架' : '上架' }}
            </n-button>
          </div>
        </div>
      </div>
      <div v-else class="empty-hint">
        <p>还没有发布服务</p>
        <n-button type="primary" size="small" @click="router.push('/merchant/services/publish')">去发布</n-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useMessage } from 'naive-ui'
import { getMyServices, deleteService } from '../../api/service'
import { resolveFileUrl } from '../../utils/fileUrl'

const router = useRouter()
const message = useMessage()
const services = ref([])
const loading = ref(false)

const STATUS_LABELS = { active: '上架中', inactive: '已下架', reviewing: '审核中' }
function statusLabel(s) { return STATUS_LABELS[s] || s }

async function loadServices() {
  loading.value = true
  try {
    const res = await getMyServices()
    services.value = res.data.list || []
  } catch {} finally { loading.value = false }
}

async function toggleStatus(svc) {
  try {
    await deleteService(svc._id)
    message.success(svc.status === 'active' ? '已下架' : '已上架')
    loadServices()
  } catch (e) { message.error(e.message) }
}

onMounted(loadServices)
</script>

<style scoped>
.merchant-center { min-height: 100vh; background: #f8faf9; padding-bottom: 20px; }
.page-header { display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; position: sticky; top: 0; z-index: 20; background: rgba(255,255,255,0.9); backdrop-filter: blur(16px); }
.header-title { font-size: 17px; font-weight: 700; color: #1a1a2e; margin: 0; }

.quick-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; padding: 16px; }
.quick-item { display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 18px 12px; background: #fff; border-radius: 14px; cursor: pointer; transition: all 0.2s; box-shadow: 0 1px 4px rgba(0,0,0,0.03); }
.quick-item:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.06); }
.quick-item span { font-size: 13px; font-weight: 500; color: #555; }
.quick-icon { width: 44px; height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center; }
.quick-icon.green { background: rgba(16,185,129,0.1); color: #10b981; }
.quick-icon.blue { background: rgba(59,130,246,0.1); color: #3b82f6; }
.quick-icon.purple { background: rgba(139,92,246,0.1); color: #8b5cf6; }

.section { margin: 0 16px 16px; background: #fff; border-radius: 14px; padding: 18px; box-shadow: 0 1px 4px rgba(0,0,0,0.03); }
.section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; }
.section-header h3 { font-size: 15px; font-weight: 700; color: #1a1a2e; margin: 0; }
.count { font-size: 12px; color: #aaa; }

.service-list { display: flex; flex-direction: column; gap: 12px; }
.svc-card { display: flex; align-items: center; gap: 12px; padding: 12px; background: #f8faf9; border-radius: 12px; }
.svc-img { width: 52px; height: 52px; border-radius: 8px; object-fit: cover; flex-shrink: 0; }
.svc-placeholder { width: 52px; height: 52px; border-radius: 8px; background: #f0f0f0; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.svc-info { flex: 1; min-width: 0; }
.svc-info h4 { font-size: 14px; font-weight: 600; color: #1a1a2e; margin: 0 0 4px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.svc-status { font-size: 11px; padding: 2px 8px; border-radius: 8px; font-weight: 600; }
.svc-status.active { background: #f0fdf4; color: #059669; }
.svc-status.inactive { background: #f3f4f6; color: #9ca3af; }
.svc-status.reviewing { background: #fef3c7; color: #d97706; }
.svc-stats { font-size: 12px; color: #aaa; margin-left: 8px; }
.svc-actions { display: flex; gap: 6px; flex-shrink: 0; }

.empty-hint { text-align: center; padding: 24px; }
.empty-hint p { font-size: 13px; color: #aaa; margin: 0 0 12px; }

.loading-wrap { display: flex; justify-content: center; padding: 24px; }
.spinner { width: 28px; height: 28px; border: 3px solid #e8e8ef; border-top-color: #10b981; border-radius: 50%; animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
</style>