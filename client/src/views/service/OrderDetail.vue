<template>
  <div class="order-detail-page">
    <div class="page-header">
      <n-button quaternary @click="router.back()">
        <template #icon><svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></template>
        返回
      </n-button>
      <h2 class="header-title">订单详情</h2>
      <div style="width:60px"></div>
    </div>

    <!-- 加载 -->
    <div v-if="loading" class="loading-wrap"><div class="spinner"></div></div>

    <template v-else-if="order">
      <!-- 状态流转 -->
      <div class="section-card" v-if="!['cancelled','refunded'].includes(order.status)">
        <OrderStatusFlow :current="order.status" />
      </div>
      <div class="section-card status-banner" v-else>
        <span class="status-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="#ef4444" stroke-width="1.5"/><path d="M15 9l-6 6M9 9l6 6" stroke="#ef4444" stroke-width="2" stroke-linecap="round"/></svg>
        </span>
        <span class="status-text">{{ statusLabel(order.status) }}</span>
      </div>

      <!-- 服务信息 -->
      <div class="section-card">
        <h3 class="card-title">服务信息</h3>
        <div class="service-row" @click="router.push(`/services/${order.serviceId?._id}`)">
          <img v-if="order.serviceId?.images?.length" :src="resolveFileUrl(order.serviceId.images[0])" class="svc-img" />
          <div class="svc-info">
            <h4>{{ order.serviceId?.serviceName }}</h4>
            <span class="svc-cat">{{ categoryLabel(order.serviceId?.category) }}</span>
          </div>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M9 18l6-6-6-6" stroke="#ccc" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </div>
      </div>

      <!-- 预约信息 -->
      <div class="section-card">
        <h3 class="card-title">预约信息</h3>
        <div class="info-grid">
          <div class="info-row"><span class="label">预约日期</span><span class="value">{{ formatDate(order.appointment?.date) }}</span></div>
          <div class="info-row"><span class="label">时间段</span><span class="value">{{ order.appointment?.timeSlot }}</span></div>
          <div class="info-row"><span class="label">宠物</span><span class="value">{{ order.petInfo?.petName }} · {{ speciesLabel(order.petInfo?.species) }}</span></div>
          <div class="info-row" v-if="order.petInfo?.breed"><span class="label">品种</span><span class="value">{{ order.petInfo.breed }}</span></div>
          <div class="info-row" v-if="order.petInfo?.specialNeeds"><span class="label">特殊需求</span><span class="value">{{ order.petInfo.specialNeeds }}</span></div>
        </div>
      </div>

      <!-- 联系信息 -->
      <div class="section-card">
        <h3 class="card-title">联系信息</h3>
        <div class="info-grid">
          <div class="info-row"><span class="label">联系人</span><span class="value">{{ order.contact?.name }}</span></div>
          <div class="info-row"><span class="label">电话</span><span class="value">{{ order.contact?.phone }}</span></div>
          <div class="info-row" v-if="order.contact?.address"><span class="label">地址</span><span class="value">{{ order.contact.address }}</span></div>
          <div class="info-row" v-if="order.customerNote"><span class="label">备注</span><span class="value">{{ order.customerNote }}</span></div>
        </div>
      </div>

      <!-- 费用明细 -->
      <div class="section-card">
        <h3 class="card-title">费用明细</h3>
        <div class="info-grid">
          <div class="info-row"><span class="label">服务费</span><span class="value">¥{{ order.pricing?.servicePrice || 0 }}</span></div>
          <div class="info-row" v-if="order.pricing?.additionalFees"><span class="label">附加费</span><span class="value">¥{{ order.pricing.additionalFees }}</span></div>
          <div class="info-row" v-if="order.pricing?.discount"><span class="label">优惠</span><span class="value discount">-¥{{ order.pricing.discount }}</span></div>
          <div class="info-row total"><span class="label">合计</span><span class="value total-price">¥{{ order.pricing?.totalAmount || 0 }}</span></div>
        </div>
      </div>

      <!-- 支付信息 -->
      <div class="section-card" v-if="order.payment?.status === 'paid'">
        <h3 class="card-title">支付信息</h3>
        <div class="info-grid">
          <div class="info-row"><span class="label">支付方式</span><span class="value">{{ payMethodLabel(order.payment.method) }}</span></div>
          <div class="info-row"><span class="label">支付时间</span><span class="value">{{ formatDateTime(order.payment.paidAt) }}</span></div>
          <div class="info-row"><span class="label">交易号</span><span class="value">{{ order.payment.transactionId }}</span></div>
        </div>
      </div>

      <!-- 评价 -->
      <div class="section-card" v-if="order.review?.rating">
        <h3 class="card-title">我的评价</h3>
        <div class="review-content">
          <n-rate :value="order.review.rating" :count="5" readonly size="small" />
          <p class="review-text">{{ order.review.content }}</p>
          <span class="review-time">{{ formatDateTime(order.review.createdAt) }}</span>
        </div>
      </div>

      <!-- 订单信息 -->
      <div class="section-card">
        <h3 class="card-title">订单信息</h3>
        <div class="info-grid">
          <div class="info-row"><span class="label">订单号</span><span class="value">{{ order.orderNo }}</span></div>
          <div class="info-row"><span class="label">创建时间</span><span class="value">{{ formatDateTime(order.createdAt) }}</span></div>
        </div>
      </div>

      <!-- 底部操作 -->
      <div class="bottom-bar">
        <n-button v-if="order.status === 'pending'" @click="handleCancel">取消订单</n-button>
        <n-button v-if="order.status === 'pending' && order.payment?.status !== 'paid'" type="primary" @click="handlePay">模拟支付</n-button>
        <n-button v-if="order.status === 'completed' && !order.review?.rating" type="primary" @click="openReview">评价</n-button>
        <n-button v-if="['cancelled','refunded'].includes(order.status)" type="primary" @click="router.push('/services')">重新预约</n-button>
      </div>
    </template>

    <!-- 评价弹窗 -->
    <n-modal v-model:show="showReview" preset="card" title="评价服务" style="max-width:480px;">
      <n-form>
        <n-form-item label="评分"><n-rate v-model:value="reviewForm.rating" :count="5" /></n-form-item>
        <n-form-item label="评价内容"><n-input v-model:value="reviewForm.content" type="textarea" placeholder="分享您的服务体验" :rows="4" /></n-form-item>
      </n-form>
      <template #action>
        <n-button @click="showReview = false">取消</n-button>
        <n-button type="primary" :loading="reviewLoading" @click="submitReview">提交</n-button>
      </template>
    </n-modal>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useMessage } from 'naive-ui'
import { getOrderDetail, cancelOrder, simulatePayment, reviewOrder } from '../../api/service'
import { resolveFileUrl } from '../../utils/fileUrl'
import OrderStatusFlow from '../../components/service/OrderStatusFlow.vue'
import dayjs from 'dayjs'

const route = useRoute()
const router = useRouter()
const message = useMessage()

const order = ref(null)
const loading = ref(false)
const showReview = ref(false)
const reviewLoading = ref(false)
const reviewForm = reactive({ rating: 5, content: '' })

const STATUS_LABELS = { pending: '待确认', confirmed: '已确认', in_progress: '服务中', completed: '已完成', cancelled: '已取消', refunded: '已退款' }
const CAT_MAP = { grooming: '美容洗护', boarding: '寄养', walking: '遛狗', training: '训练', photography: '摄影', funeral: '殡葬' }
const SP_MAP = { cat: '猫', dog: '狗', rabbit: '兔', bird: '鸟', fish: '鱼', hamster: '仓鼠', other: '其他' }
const PAY_MAP = { wechat: '微信支付', alipay: '支付宝', balance: '余额支付' }

function statusLabel(s) { return STATUS_LABELS[s] || s }
function categoryLabel(c) { return CAT_MAP[c] || '其他' }
function speciesLabel(s) { return SP_MAP[s] || s }
function payMethodLabel(m) { return PAY_MAP[m] || m }
function formatDate(d) { return d ? dayjs(d).format('YYYY年MM月DD日') : '' }
function formatDateTime(d) { return d ? dayjs(d).format('YYYY-MM-DD HH:mm') : '' }

async function loadOrder() {
  loading.value = true
  try {
    const res = await getOrderDetail(route.params.id)
    order.value = res.data.order
  } catch (e) { message.error(e.message || '加载失败') }
  finally { loading.value = false }
}

async function handleCancel() {
  try { await cancelOrder(order.value._id); message.success('已取消'); loadOrder() }
  catch (e) { message.error(e.message) }
}

async function handlePay() {
  try { await simulatePayment(order.value._id, { method: 'wechat' }); message.success('支付成功'); loadOrder() }
  catch (e) { message.error(e.message) }
}

function openReview() { reviewForm.rating = 5; reviewForm.content = ''; showReview.value = true }

async function submitReview() {
  if (!reviewForm.content.trim()) { message.warning('请输入评价'); return }
  reviewLoading.value = true
  try { await reviewOrder(order.value._id, reviewForm); message.success('评价成功'); showReview.value = false; loadOrder() }
  catch (e) { message.error(e.message) }
  finally { reviewLoading.value = false }
}

onMounted(loadOrder)
</script>

<style scoped>
.order-detail-page { min-height: 100vh; background: #f8faf9; padding-bottom: 80px; }
.page-header { display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; position: sticky; top: 0; z-index: 20; background: rgba(255,255,255,0.9); backdrop-filter: blur(16px); }
.header-title { font-size: 17px; font-weight: 700; color: #1a1a2e; margin: 0; }

.loading-wrap { display: flex; justify-content: center; padding: 80px; }
.spinner { width: 36px; height: 36px; border: 3px solid #e8e8ef; border-top-color: #10b981; border-radius: 50%; animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

.section-card { background: #fff; margin: 12px 16px; border-radius: 14px; padding: 18px; box-shadow: 0 1px 4px rgba(0,0,0,0.03); }
.card-title { font-size: 15px; font-weight: 700; color: #1a1a2e; margin: 0 0 14px; }

.status-banner { display: flex; align-items: center; gap: 10px; }
.status-text { font-size: 16px; font-weight: 700; color: #ef4444; }

.service-row { display: flex; align-items: center; gap: 12px; cursor: pointer; }
.svc-img { width: 56px; height: 56px; border-radius: 10px; object-fit: cover; flex-shrink: 0; }
.svc-info { flex: 1; }
.svc-info h4 { font-size: 14px; font-weight: 600; color: #1a1a2e; margin: 0 0 4px; }
.svc-cat { font-size: 12px; color: #aaa; }

.info-grid { display: flex; flex-direction: column; gap: 10px; }
.info-row { display: flex; justify-content: space-between; align-items: center; }
.info-row .label { font-size: 13px; color: #999; }
.info-row .value { font-size: 13px; color: #333; font-weight: 500; text-align: right; max-width: 60%; word-break: break-all; }
.info-row .value.discount { color: #10b981; }
.info-row.total { padding-top: 10px; border-top: 1px solid #f3f4f6; }
.info-row.total .label { font-weight: 600; color: #333; }
.total-price { font-size: 18px; font-weight: 800; color: #ef4444; }

.review-content { display: flex; flex-direction: column; gap: 8px; }
.review-text { font-size: 14px; color: #555; line-height: 1.6; margin: 0; }
.review-time { font-size: 12px; color: #bbb; }

.bottom-bar { position: fixed; bottom: 0; left: 0; right: 0; display: flex; gap: 12px; justify-content: flex-end; padding: 12px 20px; background: rgba(255,255,255,0.95); backdrop-filter: blur(16px); border-top: 1px solid rgba(0,0,0,0.05); z-index: 100; }

@media (max-width: 768px) {
  .section-card { margin: 8px 12px; padding: 14px; }
}
</style>