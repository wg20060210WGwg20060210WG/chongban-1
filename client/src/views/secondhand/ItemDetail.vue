<template>
  <div class="item-detail-page">
    <!-- Loading -->
    <div v-if="store.loading && !item && !loadError" class="detail-loading">
      <div class="loading-spinner"></div>
      <span class="loading-text">加载中...</span>
    </div>

    <!-- Error -->
    <div v-else-if="loadError && !item" class="detail-error">
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="12" cy="12" r="10" stroke="var(--color-error)" stroke-width="1.5"/>
        <path d="M12 8v4M12 16h.01" stroke="var(--color-error)" stroke-width="2" stroke-linecap="round"/>
      </svg>
      <p class="error-text">{{ loadError }}</p>
      <n-button type="primary" round @click="retryLoad">重新加载</n-button>
    </div>

    <template v-else-if="item">
      <!-- Page Header -->
      <div class="page-header spring-anim">
        <n-button quaternary @click="goBack" class="back-btn">
          <template #icon><svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></template>
          返回
        </n-button>
        <div class="header-spacer"></div>
        <span v-if="item.viewCount > 0" class="heat-hint">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" stroke-width="1.5"/><circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="1.5"/></svg>
          {{ item.viewCount }} 次浏览
        </span>
        <n-tooltip trigger="hover">
          <template #trigger>
            <n-button quaternary @click="handleShare" class="share-btn-header">
              <template #icon><svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M7 17L17 7M17 7H7M17 7v10" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></template>
            </n-button>
          </template>
          分享商品
        </n-tooltip>
      </div>

      <!-- Item Hero Info -->
      <div class="item-hero spring-anim" style="animation-delay: 0.06s;">
        <div class="item-name-row">
          <h1 class="item-name">{{ item.title }}</h1>
          <span class="status-badge" :class="item.status">{{ statusMap[item.status] }}</span>
        </div>
        <div class="price-row">
          <span class="price-symbol">&yen;</span>
          <span class="price-value">{{ item.sellingPrice }}</span>
          <span v-if="item.originalPrice > item.sellingPrice" class="price-original">&yen;{{ item.originalPrice }}</span>
          <span v-if="item.isPriceNegotiable" class="price-negotiable">可议价</span>
        </div>
        <div class="item-tags">
          <span class="condition-tag" :class="item.condition">{{ conditionLabels[item.condition] }}</span>
          <span class="category-tag">{{ categoryLabels[item.category] }}</span>
          <span v-if="item.quantity > 1" class="quantity-tag">x{{ item.quantity }}</span>
        </div>
      </div>

      <!-- Stats Dashboard -->
      <div class="dashboard spring-anim" style="animation-delay: 0.08s;">
        <n-tooltip trigger="hover">
          <template #trigger>
            <div class="stat-card">
              <span class="stat-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" stroke-width="1.5"/><circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="1.5"/></svg></span>
              <div class="stat-value">{{ item.viewCount || 0 }}</div>
              <div class="stat-label">浏览</div>
            </div>
          </template>
          已有 {{ item.viewCount || 0 }} 位用户查看过该商品
        </n-tooltip>
        <n-tooltip trigger="hover">
          <template #trigger>
            <div class="stat-card">
              <span class="stat-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" stroke="currentColor" stroke-width="1.5"/></svg></span>
              <div class="stat-value">{{ item.favoriteCount || 0 }}</div>
              <div class="stat-label">收藏</div>
            </div>
          </template>
          已有 {{ item.favoriteCount || 0 }} 人收藏
        </n-tooltip>
        <n-tooltip trigger="hover">
          <template #trigger>
            <div class="stat-card">
              <span class="stat-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" stroke-width="1.5"/><path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg></span>
              <div class="stat-value">{{ formatDateShort(item.createdAt) }}</div>
              <div class="stat-label">发布日期</div>
            </div>
          </template>
          发布于 {{ formatDate(item.createdAt) }}
        </n-tooltip>
        <n-tooltip trigger="hover">
          <template #trigger>
            <div class="stat-card">
              <span class="stat-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" stroke="currentColor" stroke-width="1.5"/><circle cx="12" cy="10" r="3" stroke="currentColor" stroke-width="1.5"/></svg></span>
              <div class="stat-value city-value">{{ item.location?.city || '--' }}</div>
              <div class="stat-label">所在城市</div>
            </div>
          </template>
          商品位于 {{ item.location?.city || '未知' }}
        </n-tooltip>
      </div>

      <!-- Main Grid -->
      <div class="main-grid">
        <div class="main-left">
          <!-- 照片网格 -->
          <div class="info-card spring-anim photo-grid-card" style="animation-delay: 0.05s;" v-if="images.length > 0">
            <div class="section-header">
              <h3 class="section-title">
                <span class="title-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" stroke-width="1.5"/>
                    <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor"/>
                    <path d="M21 15l-5-5L5 21" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                  </svg>
                </span>
                商品图片
              </h3>
              <span class="photo-count">{{ images.length }}张</span>
            </div>
            <div class="photo-grid">
              <div v-for="(photo, idx) in images" :key="idx" class="photo-grid-item" @click="openPreview(idx)">
                <img :src="resolveFileUrl(photo)" :alt="`${item.title} 图片 ${idx+1}`" loading="lazy" />
              </div>
            </div>
          </div>

          <!-- 商品描述 -->
          <div class="info-card spring-anim" style="animation-delay: 0.1s;">
            <n-collapse :default-expanded-names="['description']">
              <n-collapse-item name="description">
                <template #header>
                  <h3 class="section-title">
                    <span class="title-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke="currentColor" stroke-width="1.5"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg></span>
                    商品描述
                  </h3>
                </template>
                <p v-if="item.description" class="desc-text">{{ item.description }}</p>
                <p v-else class="desc-empty">卖家暂未填写商品描述</p>
              </n-collapse-item>
            </n-collapse>
          </div>

          <!-- 交付方式 -->
          <div class="info-card spring-anim" style="animation-delay: 0.14s;">
            <n-collapse :default-expanded-names="['delivery']">
              <n-collapse-item name="delivery">
                <template #header>
                  <h3 class="section-title">
                    <span class="title-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="1" y="3" width="15" height="13" rx="2" stroke="currentColor" stroke-width="1.5"/><path d="M16 8h4l3 3v5h-7V8z" stroke="currentColor" stroke-width="1.5"/><circle cx="5.5" cy="18.5" r="2.5" stroke="currentColor" stroke-width="1.5"/><circle cx="18.5" cy="18.5" r="2.5" stroke="currentColor" stroke-width="1.5"/></svg></span>
                    交付方式
                  </h3>
                </template>
                <div class="delivery-grid">
                  <div v-if="item.deliveryMethods?.pickUp" class="delivery-item yes">
                    <span><svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 12l5 5L20 7" stroke="#10B981" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg></span>
                    <span>支持自提</span>
                  </div>
                  <div v-if="item.deliveryMethods?.shipping" class="delivery-item yes">
                    <span><svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 12l5 5L20 7" stroke="#10B981" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg></span>
                    <span>支持邮寄</span>
                    <span v-if="item.deliveryMethods.shippingFee > 0" class="shipping-fee">运费 &yen;{{ item.deliveryMethods.shippingFee }}</span>
                    <span v-else class="shipping-fee free">包邮</span>
                  </div>
                  <div v-if="!item.deliveryMethods?.pickUp && !item.deliveryMethods?.shipping" class="delivery-item">
                    <span><svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M18 6L6 18M6 6l12 12" stroke="#ef4444" stroke-width="2" stroke-linecap="round"/></svg></span>
                    <span>未设置交付方式</span>
                  </div>
                </div>
              </n-collapse-item>
            </n-collapse>
          </div>
        </div>

        <div class="main-right">
          <!-- 所在地区 -->
          <div v-if="item.location?.city" class="info-card spring-anim" style="animation-delay: 0.12s;">
            <div class="section-header">
              <h3 class="section-title">
                <span class="title-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" stroke="currentColor" stroke-width="1.5"/><circle cx="12" cy="10" r="3" stroke="currentColor" stroke-width="1.5"/></svg></span>
                所在地区
              </h3>
            </div>
            <p class="location-text">{{ item.location.city }}{{ item.location.district ? ' · ' + item.location.district : '' }}</p>
          </div>

          <!-- 卖家信息 -->
          <div class="info-card spring-anim seller-card-wrap" style="animation-delay: 0.16s;">
            <div class="section-header">
              <h3 class="section-title">
                <span class="title-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" stroke="currentColor" stroke-width="1.5"/><circle cx="12" cy="7" r="4" stroke="currentColor" stroke-width="1.5"/></svg></span>
                卖家信息
              </h3>
            </div>
            <div class="publisher-info">
              <div class="publisher-avatar-wrap">
                <img v-if="item.sellerId?.avatar" :src="resolveFileUrl(item.sellerId.avatar)" class="publisher-avatar" />
                <div v-else class="publisher-avatar-fb">{{ sellerInitial }}</div>
              </div>
              <div class="publisher-detail">
                <span class="publisher-name">
                  {{ item.sellerId?.nickname || item.sellerId?.username || '匿名用户' }}
                </span>
                <span class="publisher-time">发布于 {{ formatDate(item.createdAt) }}</span>
              </div>
            </div>
            <button v-if="!isOwner" class="contact-btn" @click="handleContact">
              <span><svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" stroke="currentColor" stroke-width="1.5"/></svg></span>
              联系卖家
            </button>
          </div>
        </div>
      </div>
    </template>

    <!-- Empty State -->
    <div v-else class="detail-empty spring-anim">
      <div class="empty-icon"><svg width="64" height="64" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="10" stroke="var(--color-text-muted)" stroke-width="1.5"/><path d="M8 15s1.5 2 4 2 4-2 4-2" stroke="var(--color-text-muted)" stroke-width="1.5" stroke-linecap="round"/><path d="M15 9l-6 6M9 9l6 6" stroke="var(--color-text-muted)" stroke-width="1.2" stroke-linecap="round"/></svg></div>
      <p>商品不存在或已下架</p>
      <n-button type="primary" round @click="goBack" class="empty-btn">返回列表</n-button>
    </div>

    <!-- Bottom Action -->
    <div class="bottom-action spring-anim" v-if="item">
      <template v-if="isOwner">
        <div class="action-row">
          <button class="action-btn secondary" @click="goToEdit">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="currentColor" stroke-width="1.5"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" stroke-width="1.5"/></svg>
            编辑
          </button>
          <button class="action-btn danger" @click="confirmRemove" :disabled="removing">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" stroke="currentColor" stroke-width="1.5"/></svg>
            下架
          </button>
        </div>
      </template>
      <template v-else>
        <div class="action-row">
          <button class="fav-btn" :class="{ active: isFavorited }" @click="toggleFavorite" :disabled="favLoading">
            <svg v-if="isFavorited" width="18" height="18" viewBox="0 0 24 24" fill="#F59E0B" stroke="#F59E0B" stroke-width="1.5" aria-hidden="true"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
            <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
          </button>
          <button class="action-btn primary buy-btn" @click="goToOrder" :disabled="item.status !== 'available'">
            <span class="btn-icon"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" stroke="currentColor" stroke-width="1.5"/><line x1="3" y1="6" x2="21" y2="6" stroke="currentColor" stroke-width="1.5"/><path d="M16 10a4 4 0 01-8 0" stroke="currentColor" stroke-width="1.5"/></svg></span>
            {{ item.status === 'available' ? '立即购买' : '已售出' }}
          </button>
        </div>
      </template>
    </div>

    <!-- 客服悬浮按钮 -->
    <div class="support-fab" @click="supportVisible = !supportVisible" v-if="item">
      <span><svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" stroke="currentColor" stroke-width="1.5"/></svg></span>
    </div>
    <transition name="fade">
      <div v-if="supportVisible" class="support-popup">
        <div class="support-popup-header">在线客服</div>
        <p class="support-popup-text">有商品问题？点击下方联系客服</p>
        <button @click="copySupportLink" class="support-popup-btn">联系客服</button>
      </div>
    </transition>

    <!-- 联系方式弹窗 -->
    <n-modal v-model:show="contactVisible" :border-radius="16" style="max-width: 380px;">
      <div class="contact-modal">
        <div class="contact-modal-header">
          <div class="contact-avatar-wrap">
            <img v-if="item?.sellerId?.avatar" :src="resolveFileUrl(item.sellerId.avatar)" class="contact-avatar" />
            <div v-else class="contact-avatar-fb">{{ sellerInitial }}</div>
          </div>
          <div class="contact-info">
            <span class="contact-name">{{ item?.sellerId?.nickname || item?.sellerId?.username || '匿名用户' }}</span>
            <span class="contact-role">卖家</span>
          </div>
        </div>
        <div class="contact-body">
          <div v-if="item?.sellerId?.phone" class="contact-phone-row">
            <span class="contact-phone-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="5" y="2" width="14" height="20" rx="2" stroke="currentColor" stroke-width="1.5"/><path d="M12 18h.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></span>
            <a :href="'tel:' + item.sellerId.phone" class="contact-phone">{{ item.sellerId.phone }}</a>
            <button class="copy-btn" @click="copyPhone">复制</button>
          </div>
          <p v-else class="contact-no-phone">该用户暂未公开联系方式</p>
          <p class="contact-tip">提示：请在合理时间联系，沟通时请说明来自宠伴平台</p>
        </div>
      </div>
    </n-modal>

    <!-- Photo Preview Modal -->
    <n-modal v-model:show="showPreview" :border-radius="4">
      <div class="preview-wrap">
        <img :src="resolveFileUrl(images[previewIndex])" alt="预览" />
        <button class="preview-close" @click="showPreview = false">
          <span>&times;</span>
        </button>
        <button v-if="images.length > 1 && previewIndex > 0" class="preview-nav left" @click.stop="previewIndex--">
          <span>&lsaquo;</span>
        </button>
        <button v-if="images.length > 1 && previewIndex < images.length - 1" class="preview-nav right" @click.stop="previewIndex++">
          <span>&rsaquo;</span>
        </button>
      </div>
    </n-modal>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { NModal, NButton, NTooltip, NCollapse, NCollapseItem, useMessage } from 'naive-ui'
import { useSecondhandStore } from '../../stores/secondhand'
import { useAuthStore } from '../../stores/auth'
import { checkInteraction, toggleInteraction } from '../../api/interaction'
import { ITEM_CONDITION_LABELS, SECONDHAND_CATEGORY_LABELS } from '../../utils/constants'
import { resolveFileUrl } from '../../utils/fileUrl'

const route = useRoute()
const router = useRouter()
const store = useSecondhandStore()
const authStore = useAuthStore()
const message = useMessage()

const showPreview = ref(false)
const previewIndex = ref(0)
const isFavorited = ref(false)
const favLoading = ref(false)
const supportVisible = ref(false)
const loadError = ref(null)
const contactVisible = ref(false)
const removing = ref(false)

const conditionLabels = ITEM_CONDITION_LABELS
const categoryLabels = SECONDHAND_CATEGORY_LABELS

const item = computed(() => store.currentItem)
const images = computed(() => item.value?.images || [])
const sellerInitial = computed(() => {
  const name = item.value?.sellerId?.nickname || item.value?.sellerId?.username || '匿'
  return name.charAt(0).toUpperCase()
})
const isOwner = computed(() => {
  const userId = authStore.userInfo?._id || authStore.userInfo?.id
  const sellerId = item.value?.sellerId?._id || item.value?.sellerId
  return userId && sellerId && String(userId) === String(sellerId)
})

const statusMap = { available: '在售', sold: '已售', reserved: '预留', removed: '已下架' }

function formatDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}

function formatDateShort(dateStr) {
  if (!dateStr) return '--'
  const d = new Date(dateStr)
  return `${d.getMonth()+1}/${d.getDate()}`
}

async function toggleFavorite() {
  if (!authStore.isLoggedIn) {
    router.push({ path: '/login', query: { redirect: route.fullPath } })
    return
  }
  favLoading.value = true
  try {
    await toggleInteraction({ targetType: 'secondhand_item', targetId: route.params.id, type: 'collect' })
    isFavorited.value = !isFavorited.value
    message.success(isFavorited.value ? '已收藏' : '已取消收藏')
  } catch { message.error('操作失败') }
  finally { favLoading.value = false }
}

async function checkStatus() {
  if (!authStore.isLoggedIn || !route.params.id) return
  try {
    const res = await checkInteraction('secondhand_item', route.params.id)
    isFavorited.value = res.data?.isFavorited || res.data?.interacted || false
  } catch {}
}

function openPreview(idx) { previewIndex.value = idx; showPreview.value = true }
function goBack() {
  if (window.history.length > 1) router.back()
  else router.push('/secondhand')
}
function goToEdit() {
  router.push({ path: '/secondhand/publish', query: { id: item.value._id } })
}
function goToOrder() {
  router.push(`/secondhand/${item.value._id}/order`)
}
function handleShare() {
  const url = window.location.href
  const title = item.value?.title || '二手商品'
  if (navigator.share) {
    navigator.share({ title, url }).catch(() => {})
  } else {
    navigator.clipboard.writeText(url).then(() => {
      message.success('链接已复制到剪贴板')
    }).catch(() => {
      message.error('复制失败，请手动复制')
    })
  }
}
function copySupportLink() {
  supportVisible.value = false
  navigator.clipboard.writeText(window.location.href).then(() => {
    message.success('链接已复制，请发送给客服')
  }).catch(() => { message.error('复制失败') })
}
function handleContact() {
  if (!authStore.isLoggedIn) {
    router.push({ path: '/login', query: { redirect: route.fullPath } })
    return
  }
  contactVisible.value = true
}
function copyPhone() {
  const phone = item.value?.sellerId?.phone
  if (!phone) return
  navigator.clipboard.writeText(phone).then(() => {
    message.success('手机号已复制')
  }).catch(() => { message.error('复制失败，请手动复制') })
}
async function confirmRemove() {
  if (!confirm('确定要下架此商品吗？')) return
  removing.value = true
  try {
    await store.removeItem(item.value._id)
    router.push('/secondhand/my')
  } catch (e) { message.error(e.message || '下架失败') }
  finally { removing.value = false }
}

async function retryLoad() {
  loadError.value = null
  await loadDetail()
}

async function loadDetail() {
  const id = route.params.id
  if (id) {
    const result = await store.fetchItemDetail(id)
    if (!result && store.error) loadError.value = store.error
    else await checkStatus()
  }
}

onMounted(loadDetail)
</script>

<style scoped>
@keyframes spring-pop {
  0% { opacity: 0; transform: translateY(24px) scale(0.97); }
  50% { opacity: 1; transform: translateY(-4px) scale(1.005); }
  75% { transform: translateY(2px) scale(0.998); }
  100% { transform: translateY(0) scale(1); }
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.spring-anim {
  animation: spring-pop 0.6s var(--spring-bounce) both;
}

.item-detail-page {
  padding: 8px 0 100px;
  min-height: 100vh;
}

/* Loading */
.detail-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  gap: 14px;
}

.detail-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  gap: 16px;
  padding: 20px;
  text-align: center;
}

.error-text {
  font-size: 14px;
  color: var(--color-text-muted);
  margin: 0;
  max-width: 300px;
}

.loading-spinner {
  width: 30px;
  height: 30px;
  border: 2.5px solid var(--color-border);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

.loading-text { font-size: 13px; color: var(--color-text-muted); }

/* Page Header */
.page-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.header-spacer { flex: 1; }

.heat-hint {
  font-size: 12px;
  color: var(--color-warning);
  font-weight: 600;
  white-space: nowrap;
  display: flex;
  align-items: center;
  gap: 4px;
}

.back-btn,
.share-btn-header {
  color: var(--color-primary);
}

.back-btn:hover {
  background: var(--color-primary-light);
}

/* Item Name Row */
.item-name-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
}

/* Status Badge */
.status-badge {
  display: inline-block;
  padding: 5px 14px;
  border-radius: var(--radius-full);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.3px;
  vertical-align: middle;
}

.status-badge.available { background: rgba(16,185,129,0.15); color: #10B981; animation: badge-pulse 2s ease-in-out infinite; }
.status-badge.sold { background: rgba(107,114,128,0.15); color: #6b7280; }
.status-badge.reserved { background: rgba(245,158,11,0.15); color: #f59e0b; }
.status-badge.removed { background: rgba(239,68,68,0.15); color: #ef4444; }

@keyframes badge-pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(16,185,129,0.2); }
  50% { box-shadow: 0 0 0 6px rgba(16,185,129,0); }
}

/* Photo Grid Card */
.photo-grid-card {
  padding: 0;
  overflow: hidden;
}
.photo-grid-card .section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px 12px;
}
.photo-count {
  font-size: 12px;
  color: var(--color-text-muted);
  font-weight: 500;
}
.photo-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 3px;
  padding: 0 3px 3px;
}
.photo-grid-item {
  aspect-ratio: 1;
  overflow: hidden;
  cursor: pointer;
  border-radius: 6px;
}
.photo-grid-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  transition: transform 0.3s;
}
.photo-grid-item:hover img {
  transform: scale(1.05);
}

/* Item Hero Info */
.item-hero {
  padding: 0 4px;
  margin-bottom: 16px;
}

.item-name {
  font-size: 26px;
  font-weight: 800;
  color: var(--color-text-primary);
  margin: 0 0 8px;
  letter-spacing: 0.5px;
}

.price-row {
  display: flex;
  align-items: baseline;
  gap: 6px;
  margin-bottom: 12px;
}

.price-symbol {
  font-size: 16px;
  font-weight: 700;
  color: var(--color-error);
}

.price-value {
  font-size: 28px;
  font-weight: 800;
  color: var(--color-error);
  font-variant-numeric: tabular-nums;
}

.price-original {
  font-size: 14px;
  color: var(--color-text-muted);
  text-decoration: line-through;
  margin-left: 4px;
}

.price-negotiable {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: var(--radius-sm);
  background: var(--color-warning-light, #FFFBEB);
  color: var(--color-warning, #D97706);
  font-weight: 600;
  border: 1px solid rgba(245, 158, 11, 0.2);
}

.item-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.condition-tag {
  padding: 5px 14px;
  border-radius: var(--radius-full);
  font-size: 12px;
  font-weight: 600;
}

.condition-tag.new { background: rgba(16,185,129,0.1); color: #059669; border: 1px solid rgba(16,185,129,0.15); }
.condition-tag.like_new { background: rgba(59,130,246,0.1); color: #2563EB; border: 1px solid rgba(59,130,246,0.15); }
.condition-tag.good { background: rgba(245,158,11,0.1); color: #D97706; border: 1px solid rgba(245,158,11,0.15); }
.condition-tag.fair { background: rgba(107,114,128,0.1); color: #4B5563; border: 1px solid rgba(107,114,128,0.15); }

.category-tag {
  background: var(--color-primary-light);
  color: var(--color-primary);
  padding: 5px 14px;
  border-radius: var(--radius-full);
  font-size: 12px;
  font-weight: 600;
  border: 1px solid var(--color-primary-border, rgba(16,185,129,0.15));
}

.quantity-tag {
  background: var(--color-secondary-bg, #F3F4F6);
  color: var(--color-secondary, #6B7280);
  padding: 5px 14px;
  border-radius: var(--radius-full);
  font-size: 12px;
  font-weight: 600;
}

/* Stats Dashboard */
.dashboard {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin-bottom: 20px;
}

.stat-card {
  background: var(--color-bg-white, #fff);
  border-radius: var(--radius-lg);
  padding: 18px 14px;
  text-align: center;
  box-shadow: var(--shadow-card, 0 1px 3px rgba(0,0,0,0.06));
  transition: transform 0.4s var(--spring-bounce);
  border-left: 3px solid transparent;
}

.stat-card:hover {
  transform: translateY(-4px);
}

.stat-card:nth-child(2),
.stat-card:nth-child(4) {
  border-left-color: var(--color-primary);
  background: linear-gradient(135deg, rgba(16,185,129,0.03) 0%, var(--color-bg-white, #fff) 100%);
}

.stat-icon {
  font-size: 24px;
  display: block;
  margin-bottom: 4px;
}

.stat-value {
  font-size: 24px;
  font-weight: 800;
  color: var(--color-text-primary);
  line-height: 1.1;
}

.stat-value.city-value {
  font-size: 16px;
}

.stat-label {
  font-size: 12px;
  color: var(--color-text-muted);
  margin-top: 4px;
  font-weight: 500;
}

/* Main Grid */
.main-grid {
  display: grid;
  grid-template-columns: 1fr 360px;
  gap: 20px;
  align-items: start;
}

.main-left,
.main-right {
  display: flex;
  flex-direction: column;
  gap: 20px;
  min-width: 0;
}

.main-right {
  position: sticky;
  top: 20px;
}

/* Info Card */
.info-card {
  background: var(--color-bg-white, #fff);
  border-radius: var(--radius-lg);
  padding: 16px 18px;
  box-shadow: var(--shadow-card, 0 1px 3px rgba(0,0,0,0.06));
}

.info-card :deep(.n-collapse) {
  --n-border-radius: 0;
}

.info-card :deep(.n-collapse-item__header) {
  padding: 0;
  min-height: auto;
  font-size: inherit;
}

.info-card :deep(.n-collapse-item__content-inner) {
  padding-top: 8px;
}

.info-card :deep(.n-collapse-item) {
  border: none;
}

.info-card :deep(.n-collapse-item__content-inner) {
  padding-bottom: 0;
}

.info-card :deep(.section-title) {
  margin: 0;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.section-title {
  font-size: 16px;
  color: var(--color-text-primary);
  margin: 0;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
}

.title-icon {
  font-size: 18px;
}

/* Description */
.desc-text {
  font-size: 14px;
  line-height: 1.7;
  color: var(--color-text-secondary);
  margin: 0;
  white-space: pre-wrap;
}

.desc-empty {
  font-size: 14px;
  color: var(--color-text-muted);
  margin: 0;
  font-style: italic;
}

/* Delivery */
.delivery-grid {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.delivery-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: var(--color-text-muted);
  padding: 8px 0;
}

.delivery-item.yes { color: var(--color-text-primary); font-weight: 500; }

.shipping-fee {
  font-size: 12px;
  padding: 2px 8px;
  border-radius: var(--radius-sm);
  background: rgba(245, 158, 11, 0.1);
  color: #D97706;
  font-weight: 600;
}

.shipping-fee.free {
  background: rgba(16, 185, 129, 0.1);
  color: #059669;
}

/* Location */
.location-text {
  font-size: 14px;
  color: var(--color-text-secondary);
  margin: 0;
  line-height: 1.6;
}

/* Publisher / Seller */
.publisher-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.publisher-avatar-wrap {
  padding: 2px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--color-primary), var(--color-primary-dark, #059669));
}

.publisher-avatar {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid var(--color-bg-white, #fff);
  display: block;
}

.publisher-avatar-fb {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--color-primary), var(--color-primary-dark, #059669));
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 17px;
  font-weight: 700;
  border: 2px solid var(--color-bg-white, #fff);
}

.publisher-detail { display: flex; flex-direction: column; gap: 2px; }
.publisher-name { font-size: 14px; font-weight: 600; color: var(--color-text-primary); display: flex; align-items: center; gap: 6px; }
.publisher-time { font-size: 12px; color: var(--color-text-muted); }

.contact-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  width: 100%;
  margin-top: 14px;
  padding: 10px;
  border: 1.5px solid var(--color-primary);
  border-radius: var(--radius-lg);
  background: var(--color-primary-light);
  color: var(--color-primary);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
}

.contact-btn:hover {
  background: var(--color-primary);
  color: #fff;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(16,185,129,0.25);
}

/* Empty State */
.detail-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 70vh;
  gap: 16px;
}

.empty-icon { font-size: 64px; }
.detail-empty p { color: var(--color-text-muted); font-size: 16px; margin: 0; font-weight: 600; }

.empty-btn {
  border-radius: var(--radius-full);
  box-shadow: var(--shadow-primary);
}

/* Bottom Action */
.bottom-action {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 12px 20px calc(12px + env(safe-area-inset-bottom, 0px));
  background: var(--color-bg-white, #fff);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border-top: 1px solid rgba(0,0,0,0.04);
  z-index: 30;
}

.action-row {
  display: flex;
  gap: 10px;
  align-items: center;
}

.fav-btn {
  width: 48px;
  height: 48px;
  flex-shrink: 0;
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-xl);
  background: var(--color-bg-white, #fff);
  font-size: 22px;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-muted);
}

.fav-btn.active {
  border-color: #F59E0B;
  color: #F59E0B;
  background: #FFFBEB;
}

.fav-btn:hover {
  border-color: #F59E0B;
  transform: translateY(-1px);
}

.buy-btn {
  flex: 1;
}

.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 14px;
  border: none;
  border-radius: var(--radius-xl);
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.35s var(--spring-bounce);
  letter-spacing: 0.5px;
}

.action-btn:active { transform: translateY(0); }

.action-btn.primary {
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark, #059669) 100%);
  color: #fff;
  box-shadow: var(--shadow-primary, 0 4px 12px rgba(16,185,129,0.3));
}

.action-btn.primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 28px rgba(16, 185, 129, 0.4);
}

.action-btn.primary:disabled {
  background: var(--color-bg-light);
  color: var(--color-text-muted);
  cursor: not-allowed;
  box-shadow: none;
}

.action-btn.secondary {
  flex: 1;
  background: var(--color-bg-light);
  color: var(--color-text-primary);
  border: 1.5px solid var(--color-border);
}

.action-btn.secondary:hover {
  background: var(--color-border-light, #f0f0f0);
}

.action-btn.danger {
  flex: 1;
  background: rgba(239,68,68,0.1);
  color: var(--color-error);
  border: 1.5px solid rgba(239,68,68,0.2);
}

.action-btn.danger:hover:not(:disabled) {
  background: rgba(239,68,68,0.2);
}

.action-btn.danger:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-icon { font-size: 18px; }

/* Support FAB */
.support-fab {
  position: fixed;
  bottom: 90px;
  right: 16px;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: var(--color-primary);
  color: #fff;
  font-size: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 4px 16px rgba(16,185,129,0.35);
  z-index: 25;
  transition: all 0.3s;
}

.support-fab:hover {
  transform: scale(1.1);
  box-shadow: 0 6px 24px rgba(16,185,129,0.45);
}

.support-popup {
  position: fixed;
  bottom: 148px;
  right: 16px;
  width: 220px;
  background: var(--color-bg-white, #fff);
  border-radius: var(--radius-lg);
  box-shadow: 0 8px 32px rgba(0,0,0,0.15);
  padding: 16px;
  z-index: 25;
}

.support-popup-header {
  font-size: 15px;
  font-weight: 700;
  color: var(--color-text-primary);
  margin-bottom: 6px;
}

.support-popup-text {
  font-size: 13px;
  color: var(--color-text-muted);
  margin: 0 0 12px;
  line-height: 1.5;
}

.support-popup-btn {
  display: block;
  text-align: center;
  padding: 8px;
  border-radius: var(--radius-md);
  background: var(--color-primary);
  color: #fff;
  font-size: 13px;
  font-weight: 600;
  text-decoration: none;
  transition: all 0.2s;
  border: none;
  cursor: pointer;
  width: 100%;
}

.support-popup-btn:hover {
  background: var(--color-primary-dark, #059669);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s, transform 0.25s;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(8px);
}

/* Preview Modal */
.preview-wrap { position: relative; max-width: 95vw; max-height: 90vh; }

.preview-wrap img {
  max-width: 100%;
  max-height: 85vh;
  object-fit: contain;
  display: block;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.3);
}

.preview-close {
  position: absolute; top: 14px; right: 14px;
  width: 38px; height: 38px; border-radius: 50%;
  background: rgba(0,0,0,0.55); backdrop-filter: blur(12px);
  color: #fff; border: 1px solid rgba(255,255,255,0.1);
  cursor: pointer; display: flex; align-items: center; justify-content: center;
  font-size: 22px;
  transition: all 0.3s;
}

.preview-close:hover { background: rgba(0,0,0,0.75); transform: scale(1.12) rotate(90deg); }

.preview-nav {
  position: absolute; top: 50%; transform: translateY(-50%);
  width: 44px; height: 44px; border-radius: 50%;
  background: rgba(0,0,0,0.4); backdrop-filter: blur(12px);
  color: #fff; border: 1px solid rgba(255,255,255,0.1);
  cursor: pointer; display: flex; align-items: center; justify-content: center;
  font-size: 24px;
  transition: all 0.3s;
}

.preview-nav.left { left: 18px; }
.preview-nav.right { right: 18px; }
.preview-nav:hover { background: rgba(0,0,0,0.65); transform: translateY(-50%) scale(1.12); }

/* Contact Modal */
.contact-modal { padding: 0; background: #fff; border-radius: 16px; overflow: hidden; }
.contact-modal-header {
  display: flex; align-items: center; gap: 14px;
  padding: 24px 24px 16px; background: linear-gradient(135deg, #fff7ed 0%, #fef3c7 100%);
}
.contact-avatar-wrap { width: 52px; height: 52px; border-radius: 50%; overflow: hidden; flex-shrink: 0; border: 2px solid #fff; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
.contact-avatar { width: 100%; height: 100%; object-fit: cover; }
.contact-avatar-fb { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; font-size: 22px; font-weight: 700; color: var(--color-primary); background: var(--color-primary-bg, #ecfdf5); }
.contact-info { display: flex; flex-direction: column; gap: 4px; }
.contact-name { font-size: 16px; font-weight: 700; color: var(--color-text-primary); }
.contact-role { font-size: 12px; color: var(--color-text-muted); }
.contact-body { padding: 20px 24px 24px; }
.contact-phone-row {
  display: flex; align-items: center; gap: 10px;
  background: var(--color-bg, #f9fafb); border-radius: 12px; padding: 14px 16px;
}
.contact-phone-icon { font-size: 20px; }
.contact-phone { font-size: 18px; font-weight: 700; color: var(--color-primary); text-decoration: none; flex: 1; letter-spacing: 0.5px; }
.contact-phone:hover { text-decoration: underline; }
.copy-btn {
  padding: 6px 16px; border: 1.5px solid var(--color-primary); border-radius: 16px;
  background: transparent; font-size: 12px; color: var(--color-primary);
  cursor: pointer; font-weight: 600; transition: all 0.2s;
}
.copy-btn:hover { background: var(--color-primary); color: #fff; }
.contact-no-phone { font-size: 14px; color: var(--color-text-muted); text-align: center; padding: 16px 0; }
.contact-tip { font-size: 12px; color: var(--color-text-muted); margin: 14px 0 0; line-height: 1.6; }

/* Responsive */
@media (max-width: 900px) {
  .main-grid {
    grid-template-columns: 1fr;
  }

  .main-right {
    position: static;
  }
}

@media (max-width: 600px) {
  .dashboard {
    grid-template-columns: repeat(2, 1fr);
  }

  .item-name { font-size: 22px; }
  .info-card { padding: 14px 16px; }
  .stat-value { font-size: 20px; }
  .stat-value.city-value { font-size: 14px; }
}
</style>