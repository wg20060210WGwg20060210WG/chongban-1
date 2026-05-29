<template>
  <div class="order-list-page">
    <div class="page-header">
      <button class="back-btn" @click="$router.back()" aria-label="返回">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M15 18l-6-6 6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
      </button>
      <h1 class="page-title">我的订单</h1>
      <div class="header-placeholder"></div>
    </div>

    <!-- Role Tabs -->
    <div class="role-tabs">
      <button class="role-tab" :class="{ active: currentRole === 'buyer' }" @click="switchRole('buyer')">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" stroke="currentColor" stroke-width="1.5"/><line x1="3" y1="6" x2="21" y2="6" stroke="currentColor" stroke-width="1.5"/><path d="M16 10a4 4 0 01-8 0" stroke="currentColor" stroke-width="1.5"/></svg>
        我买到的
      </button>
      <button class="role-tab" :class="{ active: currentRole === 'seller' }" @click="switchRole('seller')">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" stroke="currentColor" stroke-width="1.5"/><circle cx="12" cy="7" r="4" stroke="currentColor" stroke-width="1.5"/></svg>
        我卖出的
      </button>
    </div>

    <!-- Status Tabs -->
    <div class="status-tabs">
      <button v-for="tab in statusTabs" :key="tab.value" class="status-tab" :class="{ active: currentStatus === tab.value }" @click="switchStatus(tab.value)">
        {{ tab.label }}
      </button>
    </div>

    <!-- Orders -->
    <div class="orders-list">
      <TransitionGroup name="card-stagger">
        <div v-for="(order, index) in orders" :key="order._id" class="order-card" :style="{ '--delay': Math.min(index * 0.06, 0.5) + 's' }" @click="goToDetail(order._id)">
          <div class="order-header">
            <span class="order-no">{{ order.orderNo }}</span>
            <span class="order-status" :class="order.status">{{ statusLabels[order.status] }}</span>
          </div>
          <div class="order-body">
            <div class="order-img-wrap">
              <img v-if="order.itemSnapshot?.images?.length" :src="resolveFileUrl(order.itemSnapshot.images[0])" :alt="order.itemSnapshot.title" class="order-img" loading="lazy" />
              <div v-else class="order-img-placeholder">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="18" height="18" rx="3" stroke="var(--color-border)" stroke-width="1.2"/></svg>
              </div>
            </div>
            <div class="order-info">
              <h3 class="order-title">{{ order.itemSnapshot?.title || '商品' }}</h3>
              <p class="order-qty">x{{ order.itemSnapshot?.quantity || 1 }}</p>
            </div>
            <div class="order-price">&yen;{{ order.totalAmount }}</div>
          </div>
          <div class="order-actions" @click.stop>
            <button v-if="currentRole === 'buyer' && order.status === 'pending'" class="action-btn cancel" @click="handleCancel(order._id)">取消订单</button>
            <button v-if="currentRole === 'buyer' && order.status === 'shipped'" class="action-btn confirm" @click="handleConfirm(order._id)">确认收货</button>
            <button v-if="currentRole === 'seller' && order.status === 'pending'" class="action-btn confirm" @click="handleMarkPaid(order._id)">标记已付款</button>
            <button v-if="currentRole === 'seller' && order.status === 'paid'" class="action-btn confirm" @click="handleShip(order._id)">发货</button>
            <button class="action-btn detail" @click="goToDetail(order._id)">查看详情</button>
          </div>
        </div>
      </TransitionGroup>

      <!-- Loading -->
      <div v-if="loading && !orders.length" class="skeleton-list">
        <div v-for="i in 3" :key="i" class="skeleton-card">
          <div class="skeleton-header"></div>
          <div class="skeleton-body">
            <div class="skeleton-img"></div>
            <div class="skeleton-lines"><div class="skeleton-line w80"></div><div class="skeleton-line w50"></div></div>
          </div>
        </div>
      </div>

      <!-- Empty -->
      <div v-else-if="!orders.length && !loading" class="empty-state">
        <svg width="80" height="80" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" stroke="var(--color-border)" stroke-width="1.2"/>
          <line x1="3" y1="6" x2="21" y2="6" stroke="var(--color-border)" stroke-width="1.2"/>
          <path d="M16 10a4 4 0 01-8 0" stroke="var(--color-text-muted)" stroke-width="1.2"/>
        </svg>
        <h3>暂无订单</h3>
        <p>{{ currentRole === 'buyer' ? '还没有购买过商品' : '还没有卖出过商品' }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useSecondhandStore } from '../../stores/secondhand'
import { SECONDHAND_ORDER_STATUS_LABELS } from '../../utils/constants'
import { resolveFileUrl } from '../../utils/fileUrl'

const router = useRouter()
const store = useSecondhandStore()

const statusLabels = SECONDHAND_ORDER_STATUS_LABELS

const currentRole = ref('buyer')
const currentStatus = ref('')
const loading = ref(false)
const orders = ref([])

const statusTabs = [
  { value: '', label: '全部' },
  { value: 'pending', label: '待付款' },
  { value: 'paid', label: '已付款' },
  { value: 'shipped', label: '已发货' },
  { value: 'completed', label: '已完成' },
  { value: 'cancelled', label: '已取消' }
]

async function fetchOrders() {
  loading.value = true
  try {
    const params = { role: currentRole.value }
    if (currentStatus.value) params.status = currentStatus.value
    const res = await store.fetchMyOrders(params)
    orders.value = store.myOrders
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

function switchRole(role) {
  currentRole.value = role
  fetchOrders()
}

function switchStatus(status) {
  currentStatus.value = status
  fetchOrders()
}

function goToDetail(id) {
  router.push(`/secondhand/orders/${id}`)
}

async function handleCancel(id) {
  if (!confirm('确定要取消此订单吗？')) return
  try {
    await store.buyerCancelOrder(id)
    orders.value = orders.value.map(o => o._id === id ? { ...o, status: 'cancelled' } : o)
  } catch (e) { alert(e.message || '操作失败') }
}

async function handleConfirm(id) {
  if (!confirm('确认已收到商品？')) return
  try {
    await store.buyerConfirmReceipt(id)
    orders.value = orders.value.map(o => o._id === id ? { ...o, status: 'completed' } : o)
  } catch (e) { alert(e.message || '操作失败') }
}

async function handleMarkPaid(id) {
  if (!confirm('确认买家已付款？')) return
  try {
    await store.markAsPaid(id)
    orders.value = orders.value.map(o => o._id === id ? { ...o, status: 'paid' } : o)
  } catch (e) { alert(e.message || '操作失败') }
}

async function handleShip(id) {
  const tracking = prompt('请输入物流单号（可选）')
  try {
    await store.markAsShipped(id, tracking ? { trackingNumber: tracking } : {})
    orders.value = orders.value.map(o => o._id === id ? { ...o, status: 'shipped' } : o)
  } catch (e) { alert(e.message || '操作失败') }
}

onMounted(() => { fetchOrders() })
</script>

<style scoped>
.order-list-page { min-height: calc(100vh - 120px); background: var(--color-bg); }

.page-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 12px 16px; background: var(--color-bg-white);
  border-bottom: 1px solid var(--color-border-light); position: sticky; top: 0; z-index: 20;
}
.back-btn { width: 36px; height: 36px; border: none; background: none; cursor: pointer; display: flex; align-items: center; justify-content: center; border-radius: 50%; color: var(--color-text-primary); transition: background 0.2s; }
.back-btn:hover { background: var(--color-bg-muted); }
.page-title { font-size: 17px; font-weight: 700; margin: 0; }
.header-placeholder { width: 36px; }

.role-tabs {
  display: flex; background: var(--color-bg-white); border-bottom: 1px solid var(--color-border-light);
}
.role-tab {
  flex: 1; display: flex; align-items: center; justify-content: center; gap: 6px;
  padding: 12px 0; border: none; background: none; font-size: 14px; font-weight: 500;
  color: var(--color-text-muted); cursor: pointer; transition: all 0.2s;
  border-bottom: 2px solid transparent;
}
.role-tab:hover { color: var(--color-text-secondary); }
.role-tab.active { color: var(--color-primary); border-bottom-color: var(--color-primary); font-weight: 600; }

.status-tabs {
  display: flex; gap: 6px; padding: 12px 16px; overflow-x: auto; scrollbar-width: none;
  background: var(--color-bg-white); border-bottom: 1px solid var(--color-border-light);
}
.status-tabs::-webkit-scrollbar { display: none; }
.status-tab {
  flex-shrink: 0; padding: 5px 14px; border: 1.5px solid var(--color-border); border-radius: var(--radius-full);
  background: var(--color-bg-white); font-size: 12px; color: var(--color-text-muted); cursor: pointer;
  transition: all 0.25s; font-weight: 500;
}
.status-tab:hover { border-color: var(--color-primary); color: var(--color-primary); }
.status-tab.active { background: var(--color-primary); color: #fff; border-color: var(--color-primary); }

.orders-list { padding: 12px 16px; }

.card-stagger-enter-active { transition: all 0.6s cubic-bezier(0.22, 1, 0.36, 1); transition-delay: var(--delay, 0s); }
.card-stagger-enter-from { opacity: 0; transform: translateY(20px); }

.order-card {
  background: var(--color-bg-white); border-radius: var(--radius-md); margin-bottom: 12px;
  box-shadow: var(--shadow-card); overflow: hidden; cursor: pointer;
  transition: all 0.3s var(--spring-bounce);
}
.order-card:hover { transform: translateY(-2px); box-shadow: var(--shadow-card-hover); }

.order-header {
  display: flex; justify-content: space-between; align-items: center;
  padding: 10px 16px; border-bottom: 1px solid var(--color-border-light);
}
.order-no { font-size: 12px; color: var(--color-text-muted); font-variant-numeric: tabular-nums; }
.order-status {
  font-size: 12px; font-weight: 600; padding: 2px 10px; border-radius: var(--radius-full);
}
.order-status.pending { background: rgba(245, 158, 11, 0.1); color: #D97706; }
.order-status.paid { background: rgba(59, 130, 246, 0.1); color: #2563EB; }
.order-status.shipped { background: rgba(139, 92, 246, 0.1); color: #7C3AED; }
.order-status.completed { background: rgba(16, 185, 129, 0.1); color: #059669; }
.order-status.cancelled { background: rgba(107, 114, 128, 0.1); color: #4B5563; }

.order-body { display: flex; gap: 12px; padding: 12px 16px; align-items: center; }
.order-img-wrap { width: 64px; height: 64px; border-radius: var(--radius-sm); overflow: hidden; flex-shrink: 0; }
.order-img { width: 100%; height: 100%; object-fit: cover; }
.order-img-placeholder { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; background: var(--color-bg-muted); }
.order-info { flex: 1; min-width: 0; }
.order-title { font-size: 14px; font-weight: 600; margin: 0 0 4px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.order-qty { font-size: 12px; color: var(--color-text-muted); margin: 0; }
.order-price { font-size: 18px; font-weight: 700; color: var(--color-danger); font-variant-numeric: tabular-nums; }

.order-actions {
  display: flex; gap: 8px; justify-content: flex-end; padding: 10px 16px;
  border-top: 1px solid var(--color-border-light);
}
.action-btn {
  padding: 6px 14px; border-radius: var(--radius-full); font-size: 12px; font-weight: 500;
  cursor: pointer; transition: all 0.2s; border: 1.5px solid var(--color-border);
  background: var(--color-bg-white); color: var(--color-text-secondary);
}
.action-btn:hover { border-color: var(--color-primary); color: var(--color-primary); }
.action-btn.confirm { background: var(--color-primary); color: #fff; border-color: var(--color-primary); }
.action-btn.confirm:hover { background: var(--color-primary-dark, #059669); }
.action-btn.cancel { border-color: rgba(239, 68, 68, 0.3); color: var(--color-danger); }
.action-btn.cancel:hover { background: rgba(239, 68, 68, 0.05); }

/* Skeleton */
.skeleton-list {}
.skeleton-card { background: var(--color-bg-white); border-radius: var(--radius-md); margin-bottom: 12px; overflow: hidden; }
.skeleton-header { height: 40px; background: linear-gradient(110deg, var(--color-bg-muted) 25%, var(--color-bg-light) 37%, var(--color-bg-muted) 63%); background-size: 200% 100%; animation: shimmer 1.8s ease-in-out infinite; }
.skeleton-body { display: flex; gap: 12px; padding: 12px 16px; }
.skeleton-img { width: 64px; height: 64px; border-radius: var(--radius-sm); background: linear-gradient(110deg, var(--color-bg-muted) 25%, var(--color-bg-light) 37%, var(--color-bg-muted) 63%); background-size: 200% 100%; animation: shimmer 1.8s ease-in-out infinite; }
.skeleton-lines { flex: 1; display: flex; flex-direction: column; gap: 8px; justify-content: center; }
.skeleton-line { height: 12px; border-radius: 6px; background: linear-gradient(110deg, var(--color-bg-muted) 25%, var(--color-bg-light) 37%, var(--color-bg-muted) 63%); background-size: 200% 100%; animation: shimmer 1.8s ease-in-out infinite; }
.skeleton-line.w80 { width: 80%; }
.skeleton-line.w50 { width: 50%; }
@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

/* Empty */
.empty-state { display: flex; flex-direction: column; align-items: center; padding: 80px 20px; gap: 12px; }
.empty-state h3 { font-size: 18px; font-weight: 700; margin: 0; color: var(--color-text-secondary); }
.empty-state p { font-size: 13px; color: var(--color-text-muted); margin: 0; }

@media (max-width: 768px) {
  .order-body { padding: 10px 12px; }
  .order-actions { padding: 8px 12px; }
}
</style>