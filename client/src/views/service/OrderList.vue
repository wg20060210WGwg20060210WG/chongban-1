<template>
  <div class="order-list-page">
    <div class="page-header">
      <n-button quaternary @click="router.back()">
        <template #icon><svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></template>
        返回
      </n-button>
      <h2 class="header-title">我的订单</h2>
      <div style="width:60px"></div>
    </div>

    <!-- 状态筛选 -->
    <div class="status-tabs">
      <button
        v-for="tab in statusTabs" :key="tab.value"
        class="status-tab" :class="{ active: currentStatus === tab.value }"
        @click="switchStatus(tab.value)"
      >{{ tab.label }}</button>
    </div>

    <!-- 订单列表 -->
    <div class="order-list" v-if="serviceStore.orderList.length">
      <div
        v-for="order in serviceStore.orderList" :key="order._id"
        class="order-card" @click="router.push(`/services/orders/${order._id}`)"
      >
        <div class="order-top">
          <span class="order-no">订单号: {{ order.orderNo }}</span>
          <span class="order-status" :class="order.status">{{ statusLabel(order.status) }}</span>
        </div>
        <div class="order-body">
          <img v-if="order.serviceId?.images?.length" :src="resolveFileUrl(order.serviceId.images[0])" class="order-img" :alt="order.serviceId?.serviceName" />
          <div class="order-info">
            <h3 class="order-title">{{ order.serviceId?.serviceName || '服务' }}</h3>
            <p class="order-date">{{ formatDate(order.appointment?.date) }} {{ order.appointment?.timeSlot }}</p>
            <p class="order-pet">{{ order.petInfo?.petName }} · {{ speciesLabel(order.petInfo?.species) }}</p>
          </div>
          <div class="order-price">
            <span class="price-symbol">¥</span>
            <span class="price-value">{{ order.pricing?.totalAmount || 0 }}</span>
          </div>
        </div>
        <div class="order-actions" @click.stop>
          <n-button v-if="order.status === 'pending'" size="small" @click="handleCancel(order)">取消订单</n-button>
          <n-button v-if="order.status === 'pending' && order.payment?.status !== 'paid'" size="small" type="primary" @click="handlePay(order)">模拟支付</n-button>
          <n-button v-if="order.status === 'completed' && !order.review?.rating" size="small" type="primary" @click="openReview(order)">评价</n-button>
        </div>
      </div>
    </div>

    <!-- 空状态 -->
    <div v-else-if="!serviceStore.orderLoading" class="empty-state">
      <svg width="80" height="80" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <rect x="3" y="3" width="18" height="18" rx="3" stroke="#d1d5db" stroke-width="1.5"/>
        <path d="M9 9h6M9 13h4" stroke="#d1d5db" stroke-width="1.5" stroke-linecap="round"/>
      </svg>
      <h3>暂无订单</h3>
      <p>去预约一个服务吧</p>
    </div>

    <!-- 加载 -->
    <div v-if="serviceStore.orderLoading" class="loading-indicator">
      <div class="pulse-dots"><i></i><i></i><i></i></div>
    </div>

    <!-- 加载更多 -->
    <button v-if="serviceStore.orderHasMore && !serviceStore.orderLoading && serviceStore.orderList.length" class="load-more" @click="loadMore">
      加载更多
    </button>

    <!-- 评价弹窗 -->
    <n-modal v-model:show="showReview" preset="card" title="评价服务" style="max-width: 480px;">
      <n-form>
        <n-form-item label="评分">
          <n-rate v-model:value="reviewForm.rating" :count="5" />
        </n-form-item>
        <n-form-item label="评价内容">
          <n-input v-model:value="reviewForm.content" type="textarea" placeholder="分享您的服务体验" :rows="4" />
        </n-form-item>
      </n-form>
      <template #action>
        <n-button @click="showReview = false">取消</n-button>
        <n-button type="primary" :loading="reviewLoading" @click="submitReview">提交评价</n-button>
      </template>
    </n-modal>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useMessage } from 'naive-ui'
import { useServiceStore } from '../../stores/service'
import { cancelOrder, simulatePayment, reviewOrder } from '../../api/service'
import { resolveFileUrl } from '../../utils/fileUrl'
import dayjs from 'dayjs'

const router = useRouter()
const message = useMessage()
const serviceStore = useServiceStore()

const currentStatus = ref('')
const showReview = ref(false)
const reviewLoading = ref(false)
const reviewTarget = ref(null)
const reviewForm = reactive({ rating: 5, content: '' })

const statusTabs = [
  { value: '', label: '全部' },
  { value: 'pending', label: '待确认' },
  { value: 'confirmed', label: '已确认' },
  { value: 'in_progress', label: '服务中' },
  { value: 'completed', label: '已完成' },
  { value: 'cancelled', label: '已取消' }
]

const STATUS_LABELS = {
  pending: '待确认', confirmed: '已确认', in_progress: '服务中',
  completed: '已完成', cancelled: '已取消', refunded: '已退款'
}

const SP_MAP = { cat: '猫', dog: '狗', rabbit: '兔', bird: '鸟', fish: '鱼', hamster: '仓鼠', other: '其他' }

function statusLabel(s) { return STATUS_LABELS[s] || s }
function speciesLabel(s) { return SP_MAP[s] || s }
function formatDate(d) { return d ? dayjs(d).format('MM月DD日') : '' }

function switchStatus(val) {
  currentStatus.value = val
  serviceStore.fetchMyOrders({ status: val }, true)
}

function loadMore() {
  serviceStore.fetchMyOrders({ status: currentStatus.value })
}

async function handleCancel(order) {
  try {
    await cancelOrder(order._id)
    message.success('订单已取消')
    serviceStore.fetchMyOrders({ status: currentStatus.value }, true)
  } catch (e) { message.error(e.message || '取消失败') }
}

async function handlePay(order) {
  try {
    await simulatePayment(order._id, { method: 'wechat' })
    message.success('支付成功')
    serviceStore.fetchMyOrders({ status: currentStatus.value }, true)
  } catch (e) { message.error(e.message || '支付失败') }
}

function openReview(order) {
  reviewTarget.value = order
  reviewForm.rating = 5
  reviewForm.content = ''
  showReview.value = true
}

async function submitReview() {
  if (!reviewForm.content.trim()) { message.warning('请输入评价内容'); return }
  reviewLoading.value = true
  try {
    await reviewOrder(reviewTarget.value._id, { rating: reviewForm.rating, content: reviewForm.content })
    message.success('评价成功')
    showReview.value = false
    serviceStore.fetchMyOrders({ status: currentStatus.value }, true)
  } catch (e) { message.error(e.message || '评价失败') }
  finally { reviewLoading.value = false }
}

onMounted(() => { serviceStore.fetchMyOrders({}, true) })
</script>

<style scoped>
.order-list-page { min-height: 100vh; background: #f8faf9; padding-bottom: 20px; }

.page-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 12px 16px; position: sticky; top: 0; z-index: 20;
  background: rgba(255,255,255,0.9); backdrop-filter: blur(16px);
}
.header-title { font-size: 17px; font-weight: 700; color: #1a1a2e; margin: 0; }

.status-tabs {
  display: flex; gap: 0; padding: 0 16px 12px; overflow-x: auto;
  scrollbar-width: none; -webkit-overflow-scrolling: touch;
}
.status-tabs::-webkit-scrollbar { display: none; }
.status-tab {
  flex-shrink: 0; padding: 8px 16px; border: none; background: none;
  font-size: 13px; color: #999; cursor: pointer; border-bottom: 2px solid transparent;
  transition: all 0.2s; font-weight: 500;
}
.status-tab.active { color: #10b981; border-bottom-color: #10b981; font-weight: 600; }

.order-list { padding: 0 16px; display: flex; flex-direction: column; gap: 12px; }

.order-card {
  background: #fff; border-radius: 14px; padding: 16px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.03); cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}
.order-card:hover { transform: translateY(-2px); box-shadow: 0 4px 16px rgba(0,0,0,0.06); }

.order-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
.order-no { font-size: 12px; color: #aaa; }
.order-status {
  font-size: 12px; font-weight: 600; padding: 3px 10px; border-radius: 10px;
  background: #f0fdf4; color: #059669;
}
.order-status.pending { background: #fef3c7; color: #d97706; }
.order-status.cancelled { background: #f3f4f6; color: #9ca3af; }
.order-status.completed { background: #f0fdf4; color: #059669; }
.order-status.confirmed { background: #eff6ff; color: #3b82f6; }
.order-status.in_progress { background: #faf5ff; color: #8b5cf6; }

.order-body { display: flex; gap: 12px; align-items: center; }
.order-img { width: 64px; height: 64px; border-radius: 10px; object-fit: cover; flex-shrink: 0; }
.order-info { flex: 1; min-width: 0; }
.order-title { font-size: 14px; font-weight: 600; color: #1a1a2e; margin: 0 0 4px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.order-date { font-size: 12px; color: #888; margin: 0 0 2px; }
.order-pet { font-size: 12px; color: #aaa; margin: 0; }
.order-price { display: flex; align-items: baseline; flex-shrink: 0; }
.price-symbol { font-size: 12px; font-weight: 600; color: #ef4444; }
.price-value { font-size: 18px; font-weight: 800; color: #ef4444; }

.order-actions { display: flex; gap: 8px; justify-content: flex-end; margin-top: 12px; padding-top: 12px; border-top: 1px solid #f3f4f6; }

.empty-state { display: flex; flex-direction: column; align-items: center; padding: 80px 20px; gap: 12px; }
.empty-state h3 { font-size: 16px; font-weight: 600; color: #444; margin: 0; }
.empty-state p { font-size: 13px; color: #aaa; margin: 0; }

.loading-indicator { display: flex; justify-content: center; padding: 32px; }
.pulse-dots { display: flex; gap: 8px; }
.pulse-dots i { width: 8px; height: 8px; border-radius: 50%; background: #10b981; animation: pulse-dot 1.4s ease-in-out infinite; }
.pulse-dots i:nth-child(2) { animation-delay: 0.2s; }
.pulse-dots i:nth-child(3) { animation-delay: 0.4s; }
@keyframes pulse-dot { 0%,80%,100% { transform: scale(0.6); opacity: 0.4; } 40% { transform: scale(1.1); opacity: 1; } }

.load-more {
  display: block; margin: 20px auto; padding: 10px 28px;
  background: #fff; border: 1.5px solid #e8e8e8; border-radius: 24px;
  font-size: 13px; color: #777; cursor: pointer; transition: all 0.3s;
}
.load-more:hover { border-color: #10b981; color: #10b981; }

@media (max-width: 768px) {
  .order-card { padding: 12px; }
  .order-img { width: 56px; height: 56px; }
}
</style>