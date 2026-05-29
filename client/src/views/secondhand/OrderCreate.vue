<template>
  <div class="order-create-page">
    <div class="page-header">
      <button class="back-btn" @click="$router.back()" aria-label="返回">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M15 18l-6-6 6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
      </button>
      <h1 class="page-title">确认下单</h1>
      <div class="header-placeholder"></div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>加载中...</p>
    </div>

    <template v-else-if="item">
      <!-- Item Summary -->
      <div class="item-summary">
        <div class="summary-img-wrap">
          <img v-if="item.images?.length" :src="resolveFileUrl(item.images[0])" :alt="item.title" class="summary-img" />
          <div v-else class="summary-img-placeholder">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="18" height="18" rx="3" stroke="var(--color-border)" stroke-width="1.2"/></svg>
          </div>
        </div>
        <div class="summary-info">
          <h3 class="summary-title">{{ item.title }}</h3>
          <p class="summary-condition">{{ conditionLabels[item.condition] }}</p>
          <p class="summary-price">&yen;{{ item.sellingPrice }}</p>
        </div>
      </div>

      <!-- Quantity -->
      <div class="form-section">
        <label class="field-label">购买数量</label>
        <div class="quantity-control">
          <button class="qty-btn" @click="quantity = Math.max(1, quantity - 1)" :disabled="quantity <= 1">-</button>
          <span class="qty-value">{{ quantity }}</span>
          <button class="qty-btn" @click="quantity = Math.min(item.quantity || 99, quantity + 1)" :disabled="quantity >= (item.quantity || 99)">+</button>
        </div>
        <p class="field-hint" v-if="item.quantity > 1">库存: {{ item.quantity }}</p>
      </div>

      <!-- Delivery -->
      <div class="form-section">
        <h3 class="section-title">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="1" y="3" width="15" height="13" rx="2" stroke="currentColor" stroke-width="1.5"/><path d="M16 8h4l3 3v5h-7V8z" stroke="currentColor" stroke-width="1.5"/><circle cx="5.5" cy="18.5" r="2.5" stroke="currentColor" stroke-width="1.5"/><circle cx="18.5" cy="18.5" r="2.5" stroke="currentColor" stroke-width="1.5"/></svg>
          配送方式
        </h3>
        <div class="delivery-options">
          <button v-if="item.deliveryMethods?.pickUp" class="delivery-btn" :class="{ active: deliveryMethod === 'pickup' }" @click="deliveryMethod = 'pickup'">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" stroke="currentColor" stroke-width="1.5"/><circle cx="12" cy="10" r="3" stroke="currentColor" stroke-width="1.5"/></svg>
            自提
          </button>
          <button v-if="item.deliveryMethods?.shipping" class="delivery-btn" :class="{ active: deliveryMethod === 'shipping' }" @click="deliveryMethod = 'shipping'">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><rect x="1" y="3" width="15" height="13" rx="2" stroke="currentColor" stroke-width="1.5"/><path d="M16 8h4l3 3v5h-7V8z" stroke="currentColor" stroke-width="1.5"/></svg>
            邮寄
            <span v-if="item.deliveryMethods.shippingFee > 0" class="fee-tag">&yen;{{ item.deliveryMethods.shippingFee }}</span>
            <span v-else class="fee-tag free">包邮</span>
          </button>
        </div>
        <p v-if="errors.delivery" class="field-error">{{ errors.delivery }}</p>
      </div>

      <!-- Shipping Info -->
      <div v-if="deliveryMethod === 'shipping'" class="form-section">
        <h3 class="section-title">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" stroke="currentColor" stroke-width="1.5"/><circle cx="12" cy="10" r="3" stroke="currentColor" stroke-width="1.5"/></svg>
          收件信息
        </h3>
        <label class="field-label required">收件人</label>
        <input v-model="shippingInfo.recipientName" type="text" class="field-input" :class="{ error: errors.recipientName }" placeholder="请输入收件人姓名" @blur="validateShipping('recipientName')" />
        <p v-if="errors.recipientName" class="field-error">{{ errors.recipientName }}</p>

        <label class="field-label required">联系电话</label>
        <input v-model="shippingInfo.phone" type="tel" class="field-input" :class="{ error: errors.phone }" placeholder="请输入手机号" @blur="validateShipping('phone')" />
        <p v-if="errors.phone" class="field-error">{{ errors.phone }}</p>

        <label class="field-label required">收件地址</label>
        <textarea v-model="shippingInfo.address" class="field-textarea" :class="{ error: errors.address }" placeholder="请输入详细地址" rows="2" @blur="validateShipping('address')"></textarea>
        <p v-if="errors.address" class="field-error">{{ errors.address }}</p>
      </div>

      <!-- Message -->
      <div class="form-section">
        <label class="field-label">给卖家留言（可选）</label>
        <textarea v-model="message" class="field-textarea" placeholder="有什么想跟卖家说的..." rows="2" maxlength="500"></textarea>
      </div>

      <!-- Cost Summary -->
      <div class="cost-section">
        <div class="cost-row">
          <span class="cost-label">商品价格</span>
          <span class="cost-value">&yen;{{ item.sellingPrice }} x {{ quantity }}</span>
        </div>
        <div class="cost-row" v-if="deliveryMethod === 'shipping' && item.deliveryMethods?.shippingFee > 0">
          <span class="cost-label">运费</span>
          <span class="cost-value">&yen;{{ item.deliveryMethods.shippingFee }}</span>
        </div>
        <div class="cost-divider"></div>
        <div class="cost-row total">
          <span class="cost-label">合计</span>
          <span class="cost-total">&yen;{{ totalPrice }}</span>
        </div>
      </div>

      <!-- Submit -->
      <div class="submit-area">
        <button class="submit-btn" @click="handleSubmit" :disabled="submitting">
          <span v-if="submitting" class="btn-spinner"></span>
          {{ submitting ? '提交中...' : '确认下单' }}
        </button>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useSecondhandStore } from '../../stores/secondhand'
import { ITEM_CONDITION_LABELS } from '../../utils/constants'
import { resolveFileUrl } from '../../utils/fileUrl'

const route = useRoute()
const router = useRouter()
const store = useSecondhandStore()

const conditionLabels = ITEM_CONDITION_LABELS

const loading = ref(true)
const item = ref(null)
const quantity = ref(1)
const deliveryMethod = ref('')
const message = ref('')
const submitting = ref(false)

const shippingInfo = reactive({
  recipientName: '',
  phone: '',
  address: ''
})

const errors = reactive({
  delivery: '',
  recipientName: '',
  phone: '',
  address: ''
})

const totalPrice = computed(() => {
  if (!item.value) return 0
  let total = item.value.sellingPrice * quantity.value
  if (deliveryMethod.value === 'shipping' && item.value.deliveryMethods?.shippingFee > 0) {
    total += item.value.deliveryMethods.shippingFee
  }
  return total.toFixed(2)
})

function validateShipping(field) {
  errors[field] = ''
  if (field === 'recipientName' && !shippingInfo.recipientName.trim()) errors.recipientName = '请输入收件人'
  if (field === 'phone' && !shippingInfo.phone.trim()) errors.phone = '请输入联系电话'
  if (field === 'address' && !shippingInfo.address.trim()) errors.address = '请输入收件地址'
}

function validate() {
  let valid = true
  errors.delivery = ''
  errors.recipientName = ''
  errors.phone = ''
  errors.address = ''

  if (!deliveryMethod.value) { errors.delivery = '请选择配送方式'; valid = false }
  if (deliveryMethod.value === 'shipping') {
    if (!shippingInfo.recipientName.trim()) { errors.recipientName = '请输入收件人'; valid = false }
    if (!shippingInfo.phone.trim()) { errors.phone = '请输入联系电话'; valid = false }
    if (!shippingInfo.address.trim()) { errors.address = '请输入收件地址'; valid = false }
  }
  return valid
}

async function handleSubmit() {
  if (!validate()) return
  submitting.value = true
  try {
    const data = {
      itemId: item.value._id,
      quantity: quantity.value,
      deliveryMethod: deliveryMethod.value,
      message: message.value || undefined
    }
    if (deliveryMethod.value === 'shipping') {
      data.shippingInfo = { ...shippingInfo }
    }
    const order = await store.placeOrder(data)
    router.replace(`/secondhand/orders/${order._id}`)
  } catch (e) {
    alert(e.message || '下单失败')
  } finally {
    submitting.value = false
  }
}

onMounted(async () => {
  try {
    const data = await store.fetchItemDetail(route.params.id)
    item.value = data
    // Auto-select delivery method
    if (data.deliveryMethods?.pickUp) deliveryMethod.value = 'pickup'
    else if (data.deliveryMethods?.shipping) deliveryMethod.value = 'shipping'
  } catch (e) {
    alert('商品信息加载失败')
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.order-create-page {
  min-height: calc(100vh - 120px);
  padding-bottom: 100px;
  background: var(--color-bg);
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: var(--color-bg-white);
  border-bottom: 1px solid var(--color-border-light);
  position: sticky;
  top: 0;
  z-index: 20;
}

.back-btn { width: 36px; height: 36px; border: none; background: none; cursor: pointer; display: flex; align-items: center; justify-content: center; border-radius: 50%; color: var(--color-text-primary); transition: background 0.2s; }
.back-btn:hover { background: var(--color-bg-muted); }
.page-title { font-size: 17px; font-weight: 700; margin: 0; }
.header-placeholder { width: 36px; }

.loading-state { display: flex; flex-direction: column; align-items: center; padding: 120px 20px; gap: 16px; }
.spinner { width: 36px; height: 36px; border: 3px solid var(--color-border); border-top-color: var(--color-primary); border-radius: 50%; animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

/* Item Summary */
.item-summary {
  display: flex;
  gap: 12px;
  background: var(--color-bg-white);
  padding: 16px;
  margin-top: 8px;
}

.summary-img-wrap { width: 80px; height: 80px; border-radius: var(--radius-sm); overflow: hidden; flex-shrink: 0; }
.summary-img { width: 100%; height: 100%; object-fit: cover; }
.summary-img-placeholder { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; background: var(--color-bg-muted); }

.summary-info { flex: 1; display: flex; flex-direction: column; justify-content: center; gap: 4px; }
.summary-title { font-size: 15px; font-weight: 600; margin: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.summary-condition { font-size: 12px; color: var(--color-text-muted); margin: 0; }
.summary-price { font-size: 20px; font-weight: 700; color: var(--color-danger); margin: 0; }

/* Form Sections */
.form-section {
  background: var(--color-bg-white);
  padding: 16px 20px;
  margin-top: 8px;
}

.section-title { display: flex; align-items: center; gap: 8px; font-size: 15px; font-weight: 600; margin: 0 0 12px; }

.field-label { display: block; font-size: 13px; font-weight: 600; color: var(--color-text-primary); margin: 14px 0 6px; }
.field-label.no-margin { margin: 0; }
.field-label.required::after { content: ' *'; color: var(--color-danger); }

.field-input, .field-textarea {
  width: 100%;
  padding: 10px 14px;
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: 14px;
  background: var(--color-bg-white);
  color: var(--color-text-primary);
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.field-input:focus, .field-textarea:focus { border-color: var(--color-primary); box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.15); }
.field-input.error, .field-textarea.error { border-color: var(--color-danger); }
.field-textarea { resize: vertical; min-height: 60px; line-height: 1.6; }
.field-error { font-size: 12px; color: var(--color-danger); margin: 4px 0 0; }
.field-hint { font-size: 12px; color: var(--color-text-muted); margin: 4px 0 0; }

/* Quantity */
.quantity-control {
  display: flex;
  align-items: center;
  gap: 0;
  margin-top: 8px;
  width: fit-content;
}

.qty-btn {
  width: 36px;
  height: 36px;
  border: 1.5px solid var(--color-border);
  background: var(--color-bg-white);
  font-size: 18px;
  color: var(--color-text-primary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.qty-btn:first-child { border-radius: var(--radius-sm) 0 0 var(--radius-sm); }
.qty-btn:last-child { border-radius: 0 var(--radius-sm) var(--radius-sm) 0; }
.qty-btn:hover:not(:disabled) { border-color: var(--color-primary); color: var(--color-primary); }
.qty-btn:disabled { opacity: 0.4; cursor: not-allowed; }

.qty-value {
  width: 48px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-top: 1.5px solid var(--color-border);
  border-bottom: 1.5px solid var(--color-border);
  font-size: 16px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

/* Delivery */
.delivery-options { display: flex; gap: 10px; margin-top: 8px; }

.delivery-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 18px;
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-bg-white);
  font-size: 14px;
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all 0.25s var(--spring-bounce);
  font-weight: 500;
}

.delivery-btn:hover { border-color: var(--color-primary); color: var(--color-primary); }
.delivery-btn.active { border-color: var(--color-primary); color: var(--color-primary); background: var(--color-primary-light); }

.fee-tag {
  font-size: 11px;
  padding: 1px 6px;
  border-radius: var(--radius-sm);
  background: rgba(245, 158, 11, 0.1);
  color: #D97706;
}

.fee-tag.free { background: rgba(16, 185, 129, 0.1); color: #059669; }

/* Cost */
.cost-section {
  background: var(--color-bg-white);
  padding: 16px 20px;
  margin-top: 8px;
}

.cost-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 0;
}

.cost-label { font-size: 14px; color: var(--color-text-secondary); }
.cost-value { font-size: 14px; color: var(--color-text-primary); font-variant-numeric: tabular-nums; }
.cost-divider { height: 1px; background: var(--color-border); margin: 8px 0; }
.cost-row.total .cost-label { font-size: 16px; font-weight: 600; color: var(--color-text-primary); }
.cost-total { font-size: 22px; font-weight: 800; color: var(--color-danger); font-variant-numeric: tabular-nums; }

/* Submit */
.submit-area {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 12px 16px;
  background: var(--color-bg-white);
  border-top: 1px solid var(--color-border);
  z-index: 40;
}

.submit-btn {
  width: 100%;
  padding: 14px 0;
  border: none;
  border-radius: var(--radius-full);
  background: linear-gradient(135deg, #10B981, #059669);
  color: #fff;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  box-shadow: 0 4px 16px rgba(16, 185, 129, 0.3);
  transition: all 0.25s var(--spring-bounce);
}

.submit-btn:hover:not(:disabled) { box-shadow: 0 6px 24px rgba(16, 185, 129, 0.4); transform: translateY(-1px); }
.submit-btn:active:not(:disabled) { transform: scale(0.98); }
.submit-btn:disabled { opacity: 0.6; cursor: not-allowed; }

.btn-spinner { width: 18px; height: 18px; border: 2px solid rgba(255, 255, 255, 0.3); border-top-color: #fff; border-radius: 50%; animation: spin 0.7s linear infinite; }

@media (max-width: 768px) {
  .form-section, .cost-section { padding: 14px 16px; }
  .submit-area { padding: 10px 12px; }
}
</style>