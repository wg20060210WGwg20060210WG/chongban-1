<template>
  <div class="order-detail-page">
    <div class="page-header">
      <button class="back-btn" @click="$router.back()" aria-label="返回">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M15 18l-6-6 6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
      </button>
      <h1 class="page-title">订单详情</h1>
      <div class="header-placeholder"></div>
    </div>

    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>加载中...</p>
    </div>

    <template v-else-if="order">
      <!-- Status Flow -->
      <div class="status-flow-section">
        <div class="status-flow">
          <div v-for="(step, idx) in statusSteps" :key="step.key" class="flow-step" :class="{ active: isStepActive(step.key), current: order.status === step.key }">
            <div class="step-dot">
              <svg v-if="isStepActive(step.key)" width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M8 12l3 3 5-5" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </div>
            <span class="step-label">{{ step.label }}</span>
            <div v-if="idx < statusSteps.length - 1" class="step-line" :class="{ active: isStepActive(statusSteps[idx + 1].key) }"></div>
          </div>
        </div>
        <p class="status-text" :class="order.status">{{ statusLabels[order.status] }}</p>
      </div>

      <!-- Item Info -->
      <div class="section">
        <h3 class="section-title">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" stroke="currentColor" stroke-width="1.5"/><line x1="3" y1="6" x2="21" y2="6" stroke="currentColor" stroke-width="1.5"/></svg>
          商品信息
        </h3>
        <div class="item-card" @click="goToItem">
          <div class="item-img-wrap">
            <img v-if="order.itemSnapshot?.images?.length" :src="resolveFileUrl(order.itemSnapshot.images[0])" :alt="order.itemSnapshot.title" class="item-img" />
            <div v-else class="item-img-placeholder"><svg width="28" height="28" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="18" height="18" rx="3" stroke="var(--color-border)" stroke-width="1.2"/></svg></div>
          </div>
          <div class="item-info">
            <h4>{{ order.itemSnapshot?.title || '商品' }}</h4>
            <p class="item-price">&yen;{{ order.itemSnapshot?.price }} x {{ order.itemSnapshot?.quantity || 1 }}</p>
          </div>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" class="item-arrow"><path d="M9 18l6-6-6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
        </div>
      </div>

      <!-- Cost -->
      <div class="section">
        <h3 class="section-title">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true"><line x1="12" y1="1" x2="12" y2="23" stroke="currentColor" stroke-width="1.5"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
          费用明细
        </h3>
        <div class="cost-row"><span class="cost-label">商品价格</span><span>&yen;{{ order.itemSnapshot?.price }} x {{ order.itemSnapshot?.quantity || 1 }}</span></div>
        <div class="cost-row" v-if="order.deliveryMethod === 'shipping' && order.itemSnapshot?.shippingFee">
          <span class="cost-label">运费</span><span>&yen;{{ order.itemSnapshot.shippingFee }}</span>
        </div>
        <div class="cost-divider"></div>
        <div class="cost-row total"><span class="cost-label">合计</span><span class="cost-total">&yen;{{ order.totalAmount }}</span></div>
      </div>

      <!-- Delivery -->
      <div class="section" v-if="order.deliveryMethod">
        <h3 class="section-title">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="1" y="3" width="15" height="13" rx="2" stroke="currentColor" stroke-width="1.5"/><path d="M16 8h4l3 3v5h-7V8z" stroke="currentColor" stroke-width="1.5"/></svg>
          配送信息
        </h3>
        <div class="info-row"><span class="info-label">配送方式</span><span>{{ order.deliveryMethod === 'pickup' ? '自提' : '邮寄' }}</span></div>
        <template v-if="order.deliveryMethod === 'shipping' && order.shippingInfo">
          <div class="info-row"><span class="info-label">收件人</span><span>{{ order.shippingInfo.recipientName }}</span></div>
          <div class="info-row"><span class="info-label">联系电话</span><span>{{ order.shippingInfo.phone }}</span></div>
          <div class="info-row"><span class="info-label">收件地址</span><span>{{ order.shippingInfo.address }}</span></div>
          <div class="info-row" v-if="order.shippingInfo.trackingNumber">
            <span class="info-label">物流单号</span><span class="tracking">{{ order.shippingInfo.trackingNumber }}</span>
          </div>
        </template>
      </div>

      <!-- Counterpart -->
      <div class="section">
        <h3 class="section-title">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" stroke="currentColor" stroke-width="1.5"/><circle cx="12" cy="7" r="4" stroke="currentColor" stroke-width="1.5"/></svg>
          {{ isBuyer ? '卖家信息' : '买家信息' }}
        </h3>
        <div class="info-row">
          <span class="info-label">昵称</span>
          <span>{{ counterpartName }}</span>
        </div>
      </div>

      <!-- Actions -->
      <div class="actions-section" v-if="availableActions.length">
        <button v-for="action in availableActions" :key="action.key" class="action-btn" :class="action.key" @click="handleAction(action.key)" :disabled="actionLoading">
          {{ action.label }}
        </button>
      </div>

      <!-- Messages -->
      <div class="section messages-section">
        <h3 class="section-title">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" stroke="currentColor" stroke-width="1.5"/></svg>
          订单留言
        </h3>
        <div class="messages-list" v-if="order.messages?.length">
          <div v-for="(msg, idx) in order.messages" :key="idx" class="message-item" :class="{ mine: isMyMessage(msg.senderId) }">
            <p class="message-content">{{ msg.content }}</p>
            <span class="message-time">{{ formatTime(msg.timestamp) }}</span>
          </div>
        </div>
        <p v-else class="no-messages">暂无留言</p>
        <div class="message-input-wrap">
          <input v-model="newMessage" type="text" class="message-input" placeholder="输入留言..." @keyup.enter="handleSendMessage" maxlength="500" />
          <button class="send-btn" @click="handleSendMessage" :disabled="!newMessage.trim() || sendingMessage">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </button>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useSecondhandStore } from '../../stores/secondhand'
import { useAuthStore } from '../../stores/auth'
import { SECONDHAND_ORDER_STATUS_LABELS } from '../../utils/constants'
import { resolveFileUrl } from '../../utils/fileUrl'

const route = useRoute()
const router = useRouter()
const store = useSecondhandStore()
const authStore = useAuthStore()

const statusLabels = SECONDHAND_ORDER_STATUS_LABELS
const statusSteps = [
  { key: 'pending', label: '待付款' },
  { key: 'paid', label: '已付款' },
  { key: 'shipped', label: '已发货' },
  { key: 'completed', label: '已完成' }
]

const loading = ref(true)
const order = ref(null)
const actionLoading = ref(false)
const newMessage = ref('')
const sendingMessage = ref(false)

const userId = computed(() => String(authStore.userInfo?._id || authStore.userInfo?.id || ''))
const isBuyer = computed(() => {
  const buyerId = String(order.value?.buyerId?._id || order.value?.buyerId || '')
  return userId.value === buyerId
})
const isSeller = computed(() => {
  const sellerId = String(order.value?.sellerId?._id || order.value?.sellerId || '')
  return userId.value === sellerId
})
const counterpartName = computed(() => {
  if (isBuyer.value) {
    return order.value?.sellerId?.nickname || '卖家'
  }
  return order.value?.buyerId?.nickname || '买家'
})

const statusOrder = ['pending', 'paid', 'shipped', 'completed']
function isStepActive(stepKey) {
  const currentIdx = statusOrder.indexOf(order.value?.status)
  const stepIdx = statusOrder.indexOf(stepKey)
  return stepIdx <= currentIdx
}

const availableActions = computed(() => {
  if (!order.value) return []
  const s = order.value.status
  const actions = []
  if (isBuyer.value && s === 'pending') actions.push({ key: 'cancel', label: '取消订单' })
  if (isBuyer.value && s === 'shipped') actions.push({ key: 'confirm', label: '确认收货' })
  if (isSeller.value && s === 'pending') actions.push({ key: 'markPaid', label: '标记已付款' })
  if (isSeller.value && s === 'paid') actions.push({ key: 'ship', label: '发货' })
  return actions
})

function isMyMessage(senderId) {
  return String(senderId?._id || senderId) === userId.value
}

function formatTime(ts) {
  if (!ts) return ''
  const d = new Date(ts)
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

function goToItem() {
  const itemId = order.value?.itemId?._id || order.value?.itemId
  if (itemId) router.push(`/secondhand/${itemId}`)
}

async function handleAction(action) {
  actionLoading.value = true
  try {
    let updated
    if (action === 'cancel') {
      if (!confirm('确定取消订单？')) { actionLoading.value = false; return }
      updated = await store.buyerCancelOrder(order.value._id)
    } else if (action === 'confirm') {
      if (!confirm('确认已收到商品？')) { actionLoading.value = false; return }
      updated = await store.buyerConfirmReceipt(order.value._id)
    } else if (action === 'markPaid') {
      if (!confirm('确认买家已付款？')) { actionLoading.value = false; return }
      updated = await store.markAsPaid(order.value._id)
    } else if (action === 'ship') {
      const tracking = prompt('请输入物流单号（可选）')
      updated = await store.markAsShipped(order.value._id, tracking ? { trackingNumber: tracking } : {})
    }
    if (updated) order.value = updated
    else await loadOrder()
  } catch (e) { alert(e.message || '操作失败') }
  finally { actionLoading.value = false }
}

async function handleSendMessage() {
  if (!newMessage.value.trim()) return
  sendingMessage.value = true
  try {
    await store.sendOrderMessage(order.value._id, newMessage.value.trim())
    // Reload to get updated messages
    await loadOrder()
    newMessage.value = ''
  } catch (e) { alert(e.message || '发送失败') }
  finally { sendingMessage.value = false }
}

async function loadOrder() {
  try {
    const data = await store.fetchOrderDetail(route.params.id)
    order.value = data
  } catch (e) { console.error(e) }
  finally { loading.value = false }
}

onMounted(() => { loadOrder() })
</script>

<style scoped>
.order-detail-page { min-height: calc(100vh - 120px); padding-bottom: 20px; background: var(--color-bg); }

.page-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 12px 16px; background: var(--color-bg-white);
  border-bottom: 1px solid var(--color-border-light); position: sticky; top: 0; z-index: 20;
}
.back-btn { width: 36px; height: 36px; border: none; background: none; cursor: pointer; display: flex; align-items: center; justify-content: center; border-radius: 50%; color: var(--color-text-primary); transition: background 0.2s; }
.back-btn:hover { background: var(--color-bg-muted); }
.page-title { font-size: 17px; font-weight: 700; margin: 0; }
.header-placeholder { width: 36px; }

.loading-state { display: flex; flex-direction: column; align-items: center; padding: 120px 20px; gap: 16px; }
.spinner { width: 36px; height: 36px; border: 3px solid var(--color-border); border-top-color: var(--color-primary); border-radius: 50%; animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

/* Status Flow */
.status-flow-section {
  background: linear-gradient(135deg, #10B981, #059669);
  padding: 24px 20px 20px;
}
.status-flow { display: flex; align-items: flex-start; justify-content: space-between; position: relative; }
.flow-step { display: flex; flex-direction: column; align-items: center; gap: 6px; position: relative; z-index: 1; flex: 1; }
.step-dot {
  width: 28px; height: 28px; border-radius: 50%; background: rgba(255, 255, 255, 0.3);
  display: flex; align-items: center; justify-content: center;
  transition: all 0.3s;
}
.flow-step.active .step-dot { background: #fff; }
.flow-step.current .step-dot { box-shadow: 0 0 0 4px rgba(255, 255, 255, 0.3); }
.step-label { font-size: 11px; color: rgba(255, 255, 255, 0.7); font-weight: 500; }
.flow-step.active .step-label { color: #fff; font-weight: 600; }
.step-line {
  position: absolute; top: 14px; left: calc(50% + 14px); width: calc(100% - 28px); height: 2px;
  background: rgba(255, 255, 255, 0.3); z-index: 0;
}
.step-line.active { background: #fff; }
.status-text { text-align: center; margin: 14px 0 0; font-size: 14px; color: rgba(255, 255, 255, 0.9); font-weight: 500; }

/* Sections */
.section { background: var(--color-bg-white); padding: 16px 20px; margin-top: 8px; }
.section-title { display: flex; align-items: center; gap: 8px; font-size: 15px; font-weight: 600; margin: 0 0 12px; }

/* Item Card */
.item-card { display: flex; gap: 12px; align-items: center; cursor: pointer; padding: 8px; border-radius: var(--radius-md); transition: background 0.2s; }
.item-card:hover { background: var(--color-bg-muted); }
.item-img-wrap { width: 56px; height: 56px; border-radius: var(--radius-sm); overflow: hidden; flex-shrink: 0; }
.item-img { width: 100%; height: 100%; object-fit: cover; }
.item-img-placeholder { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; background: var(--color-bg-muted); }
.item-info { flex: 1; min-width: 0; }
.item-info h4 { font-size: 14px; font-weight: 600; margin: 0 0 4px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.item-price { font-size: 14px; color: var(--color-danger); margin: 0; font-weight: 600; }
.item-arrow { color: var(--color-text-muted); flex-shrink: 0; }

/* Cost */
.cost-row { display: flex; justify-content: space-between; padding: 4px 0; font-size: 14px; }
.cost-label { color: var(--color-text-secondary); }
.cost-divider { height: 1px; background: var(--color-border); margin: 8px 0; }
.cost-row.total .cost-label { font-weight: 600; color: var(--color-text-primary); }
.cost-total { font-size: 20px; font-weight: 800; color: var(--color-danger); }

/* Info */
.info-row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 14px; }
.info-label { color: var(--color-text-secondary); }
.tracking { color: var(--color-primary); font-weight: 500; }

/* Actions */
.actions-section {
  display: flex; gap: 10px; padding: 16px 20px; margin-top: 8px;
  background: var(--color-bg-white);
}
.action-btn {
  flex: 1; padding: 12px 0; border-radius: var(--radius-full); font-size: 14px; font-weight: 600;
  cursor: pointer; border: none; transition: all 0.25s var(--spring-bounce);
}
.action-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.action-btn.cancel { background: rgba(239, 68, 68, 0.1); color: var(--color-danger); border: 1.5px solid rgba(239, 68, 68, 0.2); }
.action-btn.confirm, .action-btn.markPaid, .action-btn.ship {
  background: linear-gradient(135deg, #10B981, #059669); color: #fff;
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
}

/* Messages */
.messages-section { padding-bottom: 20px; }
.messages-list { max-height: 300px; overflow-y: auto; margin-bottom: 12px; }
.message-item {
  padding: 10px 14px; margin-bottom: 8px; border-radius: var(--radius-md);
  background: var(--color-bg-muted); max-width: 80%;
}
.message-item.mine { margin-left: auto; background: var(--color-primary-light); }
.message-content { font-size: 14px; margin: 0; line-height: 1.5; word-break: break-all; }
.message-time { font-size: 11px; color: var(--color-text-muted); margin-top: 4px; display: block; }
.no-messages { font-size: 13px; color: var(--color-text-muted); text-align: center; padding: 16px 0; margin: 0; }

.message-input-wrap { display: flex; gap: 8px; }
.message-input {
  flex: 1; padding: 10px 14px; border: 1.5px solid var(--color-border); border-radius: var(--radius-full);
  font-size: 14px; outline: none; transition: border-color 0.2s;
}
.message-input:focus { border-color: var(--color-primary); box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.15); }
.send-btn {
  width: 44px; height: 44px; border-radius: 50%; border: none;
  background: var(--color-primary); color: #fff; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: all 0.25s; flex-shrink: 0;
}
.send-btn:hover:not(:disabled) { background: var(--color-primary-dark, #059669); }
.send-btn:disabled { opacity: 0.4; cursor: not-allowed; }

@media (max-width: 768px) {
  .section, .actions-section { padding: 14px 16px; }
  .status-flow-section { padding: 20px 16px 16px; }
}
</style>