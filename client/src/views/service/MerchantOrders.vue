<template>
  <div class="merchant-orders">
    <div class="page-header">
      <n-button quaternary @click="router.back()">
        <template #icon><svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></template>
        返回
      </n-button>
      <h2 class="header-title">商家订单</h2>
      <div style="width:60px"></div>
    </div>

    <!-- 状态筛选 -->
    <div class="status-tabs">
      <button v-for="tab in statusTabs" :key="tab.value" class="status-tab" :class="{ active: currentStatus === tab.value }" @click="switchStatus(tab.value)">
        {{ tab.label }}
        <span v-if="tab.count > 0" class="tab-badge">{{ tab.count }}</span>
      </button>
    </div>

    <!-- 订单列表 -->
    <div class="order-list" v-if="orders.length">
      <div v-for="order in orders" :key="order._id" class="order-card" @click="router.push(`/services/orders/${order._id}`)">
        <div class="order-top">
          <span class="order-no">{{ order.orderNo }}</span>
          <span class="order-status" :class="order.status">{{ statusLabel(order.status) }}</span>
        </div>
        <div class="order-body">
          <div class="customer-info">
            <div class="customer-avatar">{{ order.customerId?.username?.[0] || 'U' }}</div>
            <div class="customer-detail">
              <span class="customer-name">{{ order.customerId?.username || '用户' }}</span>
              <span class="order-date">{{ formatDate(order.appointment?.date) }} {{ order.appointment?.timeSlot }}</span>
            </div>
          </div>
          <div class="order-price">
            <span class="price-symbol">¥</span>
            <span class="price-value">{{ order.pricing?.totalAmount || 0 }}</span>
          </div>
        </div>
        <div class="order-pet">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" stroke="#aaa" stroke-width="1.5"/><circle cx="8" cy="10" r="1.5" fill="#aaa"/><circle cx="16" cy="10" r="1.5" fill="#aaa"/><path d="M8 15c1.5 2 6.5 2 8 0" stroke="#aaa" stroke-width="1.5" stroke-linecap="round"/></svg>
          <span>{{ order.petInfo?.petName }} · {{ speciesLabel(order.petInfo?.species) }}</span>
        </div>
        <div class="order-actions" @click.stop>
          <n-button v-if="order.status === 'pending'" size="small" type="primary" @click="handleConfirm(order)">确认</n-button>
          <n-button v-if="order.status === 'confirmed'" size="small" type="primary" @click="handleStart(order)">开始服务</n-button>
          <n-button v-if="order.status === 'in_progress'" size="small" type="primary" @click="handleComplete(order)">完成</n-button>
          <n-button v-if="['pending','confirmed'].includes(order.status)" size="small" @click="handleCancel(order)">取消</n-button>
        </div>
      </div>
    </div>

    <div v-else-if="!loading" class="empty-state">
      <svg width="60" height="60" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="18" height="18" rx="3" stroke="#d1d5db" stroke-width="1.5"/><path d="M9 9h6M9 13h4" stroke="#d1d5db" stroke-width="1.5" stroke-linecap="round"/></svg>
      <h3>暂无订单</h3>
    </div>

    <div v-if="loading" class="loading-wrap"><div class="spinner"></div></div>
    <button v-if="hasMore && !loading && orders.length" class="load-more" @click="loadMore">加载更多</button>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useMessage } from 'naive-ui'
import { getMyOrders, confirmOrder, updateOrderStatus, cancelOrder } from '../../api/service'
import dayjs from 'dayjs'

const router = useRouter()
const message = useMessage()

const orders = ref([])
const loading = ref(false)
const currentStatus = ref('')
const page = ref(1)
const hasMore = ref(true)

const statusTabs = [
  { value: '', label: '全部', count: 0 },
  { value: 'pending', label: '待确认', count: 0 },
  { value: 'confirmed', label: '已确认', count: 0 },
  { value: 'in_progress', label: '服务中', count: 0 },
  { value: 'completed', label: '已完成', count: 0 }
]

const STATUS_LABELS = { pending: '待确认', confirmed: '已确认', in_progress: '服务中', completed: '已完成', cancelled: '已取消', refunded: '已退款' }
const SP_MAP = { cat: '猫', dog: '狗', rabbit: '兔', bird: '鸟', fish: '鱼', hamster: '仓鼠', other: '其他' }

function statusLabel(s) { return STATUS_LABELS[s] || s }
function speciesLabel(s) { return SP_MAP[s] || s }
function formatDate(d) { return d ? dayjs(d).format('MM月DD日') : '' }

async function loadOrders(reset = false) {
  if (loading.value) return
  if (reset) { page.value = 1; orders.value = []; hasMore.value = true }
  if (!hasMore.value) return
  loading.value = true
  try {
    const params = { role: 'merchant', page: page.value, pageSize: 10 }
    if (currentStatus.value) params.status = currentStatus.value
    const res = await getMyOrders(params)
    const data = res.data
    if (reset) orders.value = data.list || []
    else orders.value.push(...(data.list || []))
    hasMore.value = orders.value.length < (data.total || 0)
    if (hasMore.value) page.value++
  } catch {} finally { loading.value = false }
}

function switchStatus(val) { currentStatus.value = val; loadOrders(true) }
function loadMore() { loadOrders() }

async function handleConfirm(order) {
  try { await confirmOrder(order._id); message.success('已确认'); loadOrders(true) }
  catch (e) { message.error(e.message) }
}

async function handleStart(order) {
  try { await updateOrderStatus(order._id, { status: 'in_progress' }); message.success('已开始'); loadOrders(true) }
  catch (e) { message.error(e.message) }
}

async function handleComplete(order) {
  try { await updateOrderStatus(order._id, { status: 'completed' }); message.success('已完成'); loadOrders(true) }
  catch (e) { message.error(e.message) }
}

async function handleCancel(order) {
  try { await cancelOrder(order._id); message.success('已取消'); loadOrders(true) }
  catch (e) { message.error(e.message) }
}

onMounted(() => loadOrders(true))
</script>

<style scoped>
.merchant-orders { min-height: 100vh; background: #f8faf9; padding-bottom: 20px; }
.page-header { display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; position: sticky; top: 0; z-index: 20; background: rgba(255,255,255,0.9); backdrop-filter: blur(16px); }
.header-title { font-size: 17px; font-weight: 700; color: #1a1a2e; margin: 0; }

.status-tabs { display: flex; gap: 0; padding: 0 16px 12px; overflow-x: auto; scrollbar-width: none; }
.status-tabs::-webkit-scrollbar { display: none; }
.status-tab { flex-shrink: 0; padding: 8px 14px; border: none; background: none; font-size: 13px; color: #999; cursor: pointer; border-bottom: 2px solid transparent; transition: all 0.2s; font-weight: 500; display: flex; align-items: center; gap: 4px; }
.status-tab.active { color: #10b981; border-bottom-color: #10b981; font-weight: 600; }
.tab-badge { font-size: 10px; background: #ef4444; color: #fff; padding: 1px 5px; border-radius: 8px; min-width: 16px; text-align: center; }

.order-list { padding: 0 16px; display: flex; flex-direction: column; gap: 12px; }
.order-card { background: #fff; border-radius: 14px; padding: 16px; box-shadow: 0 1px 4px rgba(0,0,0,0.03); cursor: pointer; transition: all 0.2s; }
.order-card:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.06); }

.order-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
.order-no { font-size: 12px; color: #aaa; }
.order-status { font-size: 12px; font-weight: 600; padding: 3px 10px; border-radius: 10px; }
.order-status.pending { background: #fef3c7; color: #d97706; }
.order-status.confirmed { background: #eff6ff; color: #3b82f6; }
.order-status.in_progress { background: #faf5ff; color: #8b5cf6; }
.order-status.completed { background: #f0fdf4; color: #059669; }
.order-status.cancelled { background: #f3f4f6; color: #9ca3af; }

.order-body { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
.customer-info { display: flex; align-items: center; gap: 10px; }
.customer-avatar { width: 36px; height: 36px; border-radius: 50%; background: #f0f5f3; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: 700; color: #10b981; }
.customer-detail { display: flex; flex-direction: column; gap: 2px; }
.customer-name { font-size: 14px; font-weight: 600; color: #1a1a2e; }
.order-date { font-size: 12px; color: #999; }
.order-price { display: flex; align-items: baseline; }
.price-symbol { font-size: 12px; font-weight: 600; color: #ef4444; }
.price-value { font-size: 18px; font-weight: 800; color: #ef4444; }

.order-pet { display: flex; align-items: center; gap: 6px; font-size: 12px; color: #999; margin-bottom: 10px; }

.order-actions { display: flex; gap: 8px; justify-content: flex-end; padding-top: 10px; border-top: 1px solid #f3f4f6; }

.empty-state { display: flex; flex-direction: column; align-items: center; padding: 60px 20px; gap: 12px; }
.empty-state h3 { font-size: 15px; color: #999; margin: 0; }

.loading-wrap { display: flex; justify-content: center; padding: 32px; }
.spinner { width: 28px; height: 28px; border: 3px solid #e8e8ef; border-top-color: #10b981; border-radius: 50%; animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

.load-more { display: block; margin: 20px auto; padding: 10px 28px; background: #fff; border: 1.5px solid #e8e8e8; border-radius: 24px; font-size: 13px; color: #777; cursor: pointer; transition: all 0.3s; }
.load-more:hover { border-color: #10b981; color: #10b981; }

@media (max-width: 768px) { .order-card { padding: 12px; } }
</style>