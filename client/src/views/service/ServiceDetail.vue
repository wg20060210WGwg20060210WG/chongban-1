<template>
  <div class="service-detail-page">
    <!-- Loading -->
    <div v-if="loading && !service && !loadError" class="detail-loading">
      <div class="loading-spinner"></div>
      <span class="loading-text">加载中...</span>
    </div>

    <!-- Error -->
    <div v-else-if="loadError && !service" class="detail-error">
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="12" cy="12" r="10" stroke="var(--color-error)" stroke-width="1.5"/>
        <path d="M12 8v4M12 16h.01" stroke="var(--color-error)" stroke-width="2" stroke-linecap="round"/>
      </svg>
      <p class="error-text">{{ loadError }}</p>
      <n-button type="primary" round @click="retryLoad">重新加载</n-button>
    </div>

    <template v-else-if="service">
      <!-- Page Header -->
      <div class="page-header spring-anim">
        <n-button quaternary @click="goBack" class="back-btn">
          <template #icon><svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></template>
          返回
        </n-button>
        <div class="header-spacer"></div>
        <span v-if="service.stats?.orderCount > 0" class="heat-hint">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" stroke="currentColor" stroke-width="1.5"/></svg>
          已完成 {{ service.stats.orderCount }} 单
        </span>
        <n-tooltip trigger="hover">
          <template #trigger>
            <n-button quaternary @click="handleShare" class="share-btn-header">
              <template #icon><svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M7 17L17 7M17 7H7M17 7v10" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></template>
            </n-button>
          </template>
          分享服务
        </n-tooltip>
        <template v-if="isOwner">
          <n-tooltip trigger="hover">
            <template #trigger>
              <n-button quaternary @click="goToEdit" class="edit-btn-header">
                <template #icon><svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" stroke-width="2"/></svg></template>
              </n-button>
            </template>
            编辑服务
          </n-tooltip>
          <n-popconfirm @positive-click="handleDelete" positive-text="确认下架" negative-text="取消">
            <template #trigger>
              <n-button quaternary type="error" class="delete-btn-header">
                <template #icon><svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></template>
              </n-button>
            </template>
            确认下架此服务？
          </n-popconfirm>
        </template>
      </div>

      <!-- Service Hero Info -->
      <div class="service-hero spring-anim" style="animation-delay: 0.06s;">
        <div class="hero-badges">
          <span class="category-badge" :class="service.category">{{ categoryLabel }}</span>
          <span v-if="service.location?.isHomeService" class="home-badge">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" stroke="currentColor" stroke-width="1.5"/><path d="M9 22V12h6v10" stroke="currentColor" stroke-width="1.5"/></svg>
            上门服务
          </span>
        </div>
        <h1 class="service-name">{{ service.serviceName }}</h1>
        <div class="price-row">
          <span class="price-symbol">&yen;</span>
          <span class="price-value">{{ priceText }}</span>
          <span class="price-unit">/{{ service.pricing?.unit || '次' }}</span>
        </div>
      </div>

      <!-- Stats Dashboard -->
      <div class="dashboard spring-anim" style="animation-delay: 0.08s;">
        <n-tooltip trigger="hover">
          <template #trigger>
            <div class="stat-card clickable" @click="goToReviews">
              <span class="stat-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="#f59e0b" stroke="#f59e0b" stroke-width="1.5"/></svg></span>
              <div class="stat-value">{{ service.stats?.rating?.toFixed(1) || '--' }}</div>
              <div class="stat-label">评分{{ service.stats?.reviewCount ? `(${service.stats.reviewCount}条)` : '' }}</div>
              <span v-if="service.stats?.reviewCount" class="stat-link">查看评价 ›</span>
            </div>
          </template>
          {{ service.stats?.reviewCount ? `点击查看 ${service.stats.reviewCount} 条评价` : '暂无评价' }}
        </n-tooltip>
        <n-tooltip trigger="hover">
          <template #trigger>
            <div class="stat-card">
              <span class="stat-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" stroke="currentColor" stroke-width="1.5"/></svg></span>
              <div class="stat-value">{{ service.stats?.orderCount || 0 }}</div>
              <div class="stat-label">已完成订单</div>
            </div>
          </template>
          已完成 {{ service.stats?.orderCount || 0 }} 笔订单
        </n-tooltip>
        <n-tooltip trigger="hover">
          <template #trigger>
            <div class="stat-card">
              <span class="stat-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" stroke-width="1.5"/><path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg></span>
              <div class="stat-value">{{ formatDateShort(service.createdAt) }}</div>
              <div class="stat-label">入驻日期</div>
            </div>
          </template>
          入驻于 {{ formatDate(service.createdAt) }}
        </n-tooltip>
        <n-tooltip trigger="hover">
          <template #trigger>
            <div class="stat-card">
              <span class="stat-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" stroke="currentColor" stroke-width="1.5"/><circle cx="12" cy="10" r="3" stroke="currentColor" stroke-width="1.5"/></svg></span>
              <div class="stat-value city-value">{{ service.location?.city || '--' }}</div>
              <div class="stat-label">所在城市</div>
            </div>
          </template>
          服务位于 {{ service.location?.city || '未知' }}
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
                服务图片
              </h3>
              <span class="photo-count">{{ images.length }}张</span>
            </div>
            <div class="photo-grid">
              <div v-for="(photo, idx) in images" :key="idx" class="photo-grid-item" @click="openPreview(idx)">
                <img :src="resolveFileUrl(photo)" :alt="`${service.serviceName} 图片 ${idx+1}`" loading="lazy" />
              </div>
            </div>
          </div>

          <!-- 服务介绍 -->
          <div class="info-card spring-anim" style="animation-delay: 0.1s;">
            <n-collapse :default-expanded-names="['description']">
              <n-collapse-item name="description">
                <template #header>
                  <h3 class="section-title">
                    <span class="title-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke="currentColor" stroke-width="1.5"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg></span>
                    服务介绍
                  </h3>
                </template>
                <p v-if="service.description" class="desc-text">{{ service.description }}</p>
                <p v-else class="desc-empty">商家暂未填写服务介绍</p>
              </n-collapse-item>
            </n-collapse>
          </div>

          <!-- 营业时间 -->
          <div class="info-card spring-anim" style="animation-delay: 0.12s;" v-if="service.businessHours">
            <h3 class="section-title" style="margin-bottom:10px;">
              <span class="title-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="1.5"/><path d="M12 6v6l4 2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg></span>
              营业时间
            </h3>
            <div class="hours-compact">
              <span v-for="(day, key) in dayLabels" :key="key" class="hour-chip" :class="{ closed: service.businessHours[key]?.closed, today: isToday(key) }">
                <b>{{ day }}</b>
                {{ service.businessHours[key]?.closed ? '休息' : service.businessHours[key]?.open + '-' + service.businessHours[key]?.close }}
              </span>
            </div>
          </div>
        </div>

        <div class="main-right">
          <!-- 所在地区 -->
          <div v-if="service.location?.city || service.location?.address" class="info-card spring-anim" style="animation-delay: 0.12s;">
            <div class="section-header">
              <h3 class="section-title">
                <span class="title-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" stroke="currentColor" stroke-width="1.5"/><circle cx="12" cy="10" r="3" stroke="currentColor" stroke-width="1.5"/></svg></span>
                服务地址
              </h3>
            </div>
            <p class="location-text">{{ service.location?.city }}{{ service.location?.district ? ' · ' + service.location.district : '' }}{{ service.location?.address ? ' · ' + service.location.address : '' }}</p>
          </div>

          <!-- 商家信息 -->
          <div class="info-card spring-anim merchant-card-wrap" style="animation-delay: 0.16s;">
            <div class="section-header">
              <h3 class="section-title">
                <span class="title-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" stroke="currentColor" stroke-width="1.5"/><circle cx="12" cy="7" r="4" stroke="currentColor" stroke-width="1.5"/></svg></span>
                商家信息
              </h3>
            </div>
            <div class="publisher-info">
              <div class="publisher-avatar-wrap">
                <img v-if="service.merchantId?.avatar" :src="resolveFileUrl(service.merchantId.avatar)" class="publisher-avatar" />
                <div v-else class="publisher-avatar-fb">{{ merchantInitial }}</div>
              </div>
              <div class="publisher-detail">
                <span class="publisher-name">
                  {{ service.merchantId?.username || '匿名商家' }}
                  <span class="role-badge">服务商家</span>
                </span>
                <span class="publisher-time">入驻于 {{ formatDate(service.createdAt) }}</span>
              </div>
            </div>
            <button class="contact-btn" @click="handleContact">
              <span><svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" stroke="currentColor" stroke-width="1.5"/></svg></span>
              联系商家
            </button>
          </div>
        </div>
      </div>
    </template>

    <!-- Empty State -->
    <div v-else class="detail-empty spring-anim">
      <div class="empty-icon"><svg width="64" height="64" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="10" stroke="var(--color-text-muted)" stroke-width="1.5"/><path d="M8 15s1.5 2 4 2 4-2 4-2" stroke="var(--color-text-muted)" stroke-width="1.5" stroke-linecap="round"/><path d="M15 9l-6 6M9 9l6 6" stroke="var(--color-text-muted)" stroke-width="1.2" stroke-linecap="round"/></svg></div>
      <p>服务不存在或已下架</p>
      <n-button type="primary" round @click="goBack" class="empty-btn">返回列表</n-button>
    </div>

    <!-- Bottom Action -->
    <div class="bottom-action spring-anim" v-if="service">
      <div class="bar-price">
        <span class="bar-symbol">&yen;</span>
        <span class="bar-value">{{ priceText }}</span>
        <span class="bar-unit">/{{ service.pricing?.unit || '次' }}</span>
      </div>
      <div class="bar-actions">
        <n-button size="large" round class="call-btn" @click="handleCall" v-if="service.merchantId?.phone">
          <template #icon>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" stroke="currentColor" stroke-width="1.5"/></svg>
          </template>
          电话
        </n-button>
        <n-button type="primary" size="large" strong round class="book-btn" @click="goToBooking">
          立即预约
        </n-button>
      </div>
    </div>

    <!-- 客服悬浮按钮 -->
    <div class="support-fab" @click="supportVisible = !supportVisible" v-if="service">
      <span><svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" stroke="currentColor" stroke-width="1.5"/></svg></span>
    </div>
    <transition name="fade">
      <div v-if="supportVisible" class="support-popup">
        <div class="support-popup-header">在线客服</div>
        <p class="support-popup-text">有服务问题？点击下方联系客服</p>
        <button @click="copySupportLink" class="support-popup-btn">联系客服</button>
      </div>
    </transition>

    <!-- 联系方式弹窗 -->
    <n-modal v-model:show="contactVisible" :border-radius="16" style="max-width: 380px;">
      <div class="contact-modal">
        <div class="contact-modal-header">
          <div class="contact-avatar-wrap">
            <img v-if="service?.merchantId?.avatar" :src="resolveFileUrl(service.merchantId.avatar)" class="contact-avatar" />
            <div v-else class="contact-avatar-fb">{{ merchantInitial }}</div>
          </div>
          <div class="contact-info">
            <span class="contact-name">{{ service?.merchantId?.username || '匿名商家' }}</span>
            <span class="contact-role">服务商家</span>
          </div>
        </div>
        <div class="contact-body">
          <div v-if="service?.merchantId?.phone" class="contact-phone-row">
            <span class="contact-phone-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="5" y="2" width="14" height="20" rx="2" stroke="currentColor" stroke-width="1.5"/><path d="M12 18h.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></span>
            <a :href="'tel:' + service.merchantId.phone" class="contact-phone">{{ service.merchantId.phone }}</a>
            <button class="copy-btn" @click="copyPhone">复制</button>
          </div>
          <p v-else class="contact-no-phone">该商家暂未公开联系方式</p>
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

    <!-- 评价列表抽屉 -->
    <n-drawer v-model:show="reviewsVisible" :width="420" placement="right" :trap-focus="false">
      <n-drawer-content :native-scrollbar="false">
        <template #header>
          <div class="drawer-header">
            <span class="drawer-title">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="#f59e0b" stroke="#f59e0b" stroke-width="1.5"/>
              </svg>
              用户评价
            </span>
            <span class="drawer-count" v-if="reviewsTotal > 0">{{ reviewsTotal }}条</span>
          </div>
        </template>

        <!-- 加载中 -->
        <div v-if="reviewsLoading && reviews.length === 0" class="reviews-loading">
          <n-spin size="medium" />
          <span>加载评价中...</span>
        </div>

        <!-- 空状态 -->
        <n-empty v-else-if="!reviewsLoading && reviews.length === 0" description="暂无评价" class="reviews-empty" />

        <!-- 评价列表 -->
        <div v-else class="reviews-list">
          <div v-for="(item, idx) in reviews" :key="item._id" class="review-card" :style="{ animationDelay: `${idx * 0.04}s` }">
            <div class="review-header">
              <div class="review-user">
                <img v-if="item.user?.avatar" :src="resolveFileUrl(item.user.avatar)" class="review-avatar" />
                <div v-else class="review-avatar-fb">{{ (item.user?.username || '匿')[0].toUpperCase() }}</div>
                <div class="review-user-info">
                  <span class="review-username">{{ item.user?.username || '匿名用户' }}</span>
                  <span class="review-date">{{ formatReviewDate(item.createdAt) }}</span>
                </div>
              </div>
              <div class="review-stars">
                <svg v-for="s in 5" :key="s" width="14" height="14" viewBox="0 0 24 24" :class="s <= item.rating ? 'star-filled' : 'star-empty'">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                    :fill="s <= item.rating ? '#f59e0b' : 'none'"
                    :stroke="s <= item.rating ? '#f59e0b' : '#d1d5db'" stroke-width="1.5" />
                </svg>
              </div>
            </div>
            <p v-if="item.content" class="review-content">{{ item.content }}</p>
            <p v-else class="review-no-content">用户未填写文字评价</p>
            <div v-if="item.images?.length" class="review-images">
              <img v-for="(img, i) in item.images" :key="i" :src="resolveFileUrl(img)" class="review-img" @click="openPreview(i)" />
            </div>
            <div v-if="item.petName" class="review-pet">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill="currentColor" opacity="0.15"/>
                <circle cx="9" cy="10" r="2" stroke="currentColor" stroke-width="1.5" fill="none"/>
                <circle cx="15" cy="10" r="2" stroke="currentColor" stroke-width="1.5" fill="none"/>
                <circle cx="12" cy="14" r="2" stroke="currentColor" stroke-width="1.5" fill="none"/>
                <circle cx="7" cy="7" r="1.5" stroke="currentColor" stroke-width="1.5" fill="none"/>
                <circle cx="17" cy="7" r="1.5" stroke="currentColor" stroke-width="1.5" fill="none"/>
              </svg>
              <span>{{ item.petName }}</span>
            </div>
          </div>

          <!-- 加载更多 -->
          <div v-if="reviews.length < reviewsTotal" class="reviews-load-more">
            <n-button quaternary size="small" :loading="reviewsLoading" @click="loadMoreReviews">
              加载更多评价
            </n-button>
          </div>
          <div v-else-if="reviews.length > 0" class="reviews-end">
            — 已展示全部评价 —
          </div>
        </div>
      </n-drawer-content>
    </n-drawer>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { NModal, NButton, NTooltip, NCollapse, NCollapseItem, NPopconfirm, NDrawer, NDrawerContent, NSpin, NEmpty, NRate, useMessage } from 'naive-ui'
import { useServiceStore } from '../../stores/service'
import { useAuthStore } from '../../stores/auth'
import { getServiceReviews } from '../../api/service'
import { resolveFileUrl } from '../../utils/fileUrl'

const route = useRoute()
const router = useRouter()
const serviceStore = useServiceStore()
const authStore = useAuthStore()
const message = useMessage()

const service = ref(null)
const loading = ref(false)
const loadError = ref('')
const showPreview = ref(false)
const previewIndex = ref(0)
const supportVisible = ref(false)
const contactVisible = ref(false)
const descExpanded = ref(false)

// 评价弹窗
const reviewsVisible = ref(false)
const reviews = ref([])
const reviewsLoading = ref(false)
const reviewsTotal = ref(0)
const reviewsPage = ref(1)

const CATEGORY_MAP = {
  grooming: '美容洗护', boarding: '寄养', walking: '遛狗',
  training: '训练', photography: '摄影', funeral: '殡葬'
}

const dayLabels = {
  monday: '周一', tuesday: '周二', wednesday: '周三',
  thursday: '周四', friday: '周五', saturday: '周六', sunday: '周日'
}

const DAY_KEYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
const SP_MAP = { cat: '猫', dog: '狗', rabbit: '兔', bird: '鸟', fish: '鱼', hamster: '仓鼠', other: '其他' }

const categoryLabel = computed(() => CATEGORY_MAP[service.value?.category] || '其他')
const priceText = computed(() => {
  const p = service.value?.pricing
  if (!p) return '面议'
  if (p.type === 'range' && p.priceMin != null && p.priceMax != null) return `${p.priceMin}-${p.priceMax}`
  if (p.price != null) return p.price.toString()
  return '面议'
})

const isOwner = computed(() => {
  const uid = authStore.userInfo?._id || authStore.userInfo?.id
  const mid = service.value?.merchantId?._id || service.value?.merchantId
  return uid && mid && String(uid) === String(mid)
})

function goToEdit() {
  router.push(`/services/${route.params.id}/edit`)
}

async function handleDelete() {
  try {
    await serviceStore.deleteServiceAction(route.params.id)
    message.success('服务已下架')
    router.replace('/merchant')
  } catch (e) { message.error(e.message || '操作失败') }
}

const images = computed(() => service.value?.images || [])
const merchantInitial = computed(() => {
  const name = service.value?.merchantId?.username || '匿'
  return name.charAt(0).toUpperCase()
})

function isToday(key) {
  return DAY_KEYS[new Date().getDay()] === key
}

function petLabel(key) { return SP_MAP[key] || key }

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

function openPreview(idx) { previewIndex.value = idx; showPreview.value = true }
function goBack() {
  if (window.history.length > 1) router.back()
  else router.push('/services')
}
function goToBooking() {
  router.push(`/services/${route.params.id}/book`)
}
function handleShare() {
  const url = window.location.href
  const title = service.value?.serviceName || '服务'
  if (navigator.share) {
    navigator.share({ title, url }).catch(() => {})
  } else {
    navigator.clipboard.writeText(url).then(() => {
      message.success('链接已复制到剪贴板')
    }).catch(() => { message.error('复制失败，请手动复制') })
  }
}
function handleCall() {
  const phone = service.value?.merchantId?.phone
  if (phone) window.location.href = `tel:${phone}`
}
function copySupportLink() {
  supportVisible.value = false
  navigator.clipboard.writeText(window.location.href).then(() => {
    message.success('链接已复制，请发送给客服')
  }).catch(() => { message.error('复制失败') })
}
function handleContact() {
  contactVisible.value = true
}
async function goToReviews() {
  const id = route.params.id
  if (!id) return
  reviewsVisible.value = true
  reviewsLoading.value = true
  reviewsPage.value = 1
  reviews.value = []
  reviewsTotal.value = 0
  try {
    const res = await getServiceReviews(id, { page: 1, pageSize: 10 })
    const data = res.data
    reviews.value = data.list || []
    reviewsTotal.value = data.pagination?.total || 0
  } catch (e) {
    message.error('加载评价失败')
  } finally {
    reviewsLoading.value = false
  }
}

async function loadMoreReviews() {
  if (reviewsLoading.value) return
  reviewsLoading.value = true
  reviewsPage.value++
  try {
    const res = await getServiceReviews(route.params.id, { page: reviewsPage.value, pageSize: 10 })
    const data = res.data
    reviews.value.push(...(data.list || []))
  } catch (e) {
    reviewsPage.value--
  } finally {
    reviewsLoading.value = false
  }
}

function renderStars(rating) {
  return Array.from({ length: 5 }, (_, i) => i < rating ? 'filled' : 'empty')
}

function formatReviewDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  const now = new Date()
  const diffMs = now - d
  const diffDays = Math.floor(diffMs / 86400000)
  if (diffDays === 0) return '今天'
  if (diffDays === 1) return '昨天'
  if (diffDays < 30) return `${diffDays}天前`
  return `${d.getMonth() + 1}月${d.getDate()}日`
}
function copyPhone() {
  const phone = service.value?.merchantId?.phone
  if (!phone) return
  navigator.clipboard.writeText(phone).then(() => {
    message.success('手机号已复制')
  }).catch(() => { message.error('复制失败，请手动复制') })
}

async function retryLoad() {
  loadError.value = ''
  await loadService()
}

async function loadService() {
  loading.value = true
  loadError.value = ''
  try {
    const result = await serviceStore.fetchServiceDetail(route.params.id)
    service.value = result
  } catch (e) {
    loadError.value = e.message || '加载失败'
  } finally {
    loading.value = false
  }
}

onMounted(loadService)
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

.service-detail-page {
  padding: 8px 0 100px;
  background: #F0FDF4;
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
  color: var(--color-primary);
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

/* Service Hero Info */
.service-hero {
  padding: 0 4px;
  margin-bottom: 16px;
}

.hero-badges {
  display: flex;
  gap: 8px;
  margin-bottom: 10px;
  flex-wrap: wrap;
}

.category-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: rgba(16,185,129,0.1);
  color: #059669;
  font-size: 12px;
  font-weight: 600;
  padding: 5px 14px;
  border-radius: var(--radius-full);
  border: 1px solid rgba(16,185,129,0.15);
}

.home-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: rgba(99,102,241,0.1);
  color: #6366f1;
  font-size: 12px;
  font-weight: 600;
  padding: 5px 14px;
  border-radius: var(--radius-full);
  border: 1px solid rgba(99,102,241,0.15);
}

.service-name {
  font-size: 26px;
  font-weight: 800;
  color: var(--color-text-primary);
  margin: 0 0 8px;
  letter-spacing: 0.5px;
  line-height: 1.3;
}

.price-row {
  display: flex;
  align-items: baseline;
  gap: 4px;
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

.price-unit {
  font-size: 14px;
  color: var(--color-text-muted);
  margin-left: 2px;
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

.stat-card.clickable {
  cursor: pointer;
}

.stat-card.clickable:hover {
  box-shadow: 0 4px 16px rgba(0,0,0,0.1);
}

.stat-link {
  display: block;
  font-size: 11px;
  color: var(--color-primary);
  margin-top: 6px;
  font-weight: 600;
  letter-spacing: 0.3px;
}

.stat-card:nth-child(1),
.stat-card:nth-child(3) {
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
  padding: 22px;
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
  padding-top: 12px;
}

.info-card :deep(.n-collapse-item) {
  border: none;
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

/* Pet Tags */
.pet-tags {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.pet-tag {
  background: var(--color-bg-light, #f9fafb);
  color: var(--color-text-secondary, #555);
  font-size: 13px;
  font-weight: 500;
  padding: 6px 14px;
  border-radius: var(--radius-full);
}

/* Business Hours Compact */
.hours-compact {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.hour-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: var(--color-primary);
  background: rgba(16,185,129,0.08);
  border: 1px solid rgba(16,185,129,0.12);
  padding: 4px 10px;
  border-radius: 6px;
  white-space: nowrap;
  font-weight: 500;
}

.hour-chip b {
  font-weight: 600;
  color: var(--color-primary);
}

.hour-chip.closed {
  color: var(--color-text-muted);
  background: var(--color-bg-light, #f9fafb);
  border-color: transparent;
  opacity: 0.65;
  font-weight: 400;
}

.hour-chip.closed b {
  color: var(--color-text-muted);
}

.hour-chip.today {
  background: rgba(16,185,129,0.15);
  color: var(--color-primary);
  font-weight: 700;
  border: 1.5px solid rgba(16,185,129,0.3);
  box-shadow: 0 0 0 1px rgba(16,185,129,0.1);
}

.hour-chip.today b {
  color: var(--color-primary);
}

.hour-chip.today.closed {
  background: var(--color-bg-light, #f9fafb);
  color: var(--color-text-muted);
  border-color: transparent;
  box-shadow: none;
  font-weight: 400;
}

.hour-chip.today.closed b {
  color: var(--color-text-muted);
}

/* Location */
.location-text {
  font-size: 14px;
  color: var(--color-text-secondary);
  margin: 0;
  line-height: 1.6;
}

/* Publisher / Merchant */
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

.role-badge {
  font-size: 10px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: var(--radius-full);
  background: var(--color-warning-light, #FFFBEB);
  color: var(--color-warning, #D97706);
  border: 1px solid var(--color-warning-border, rgba(245,158,11,0.15));
  white-space: nowrap;
}

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
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 20px calc(12px + env(safe-area-inset-bottom, 0px));
  background: rgba(255,255,255,0.95);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border-top: 1px solid rgba(0,0,0,0.04);
  z-index: 30;
}

.bar-price { display: flex; align-items: baseline; }
.bar-symbol { font-size: 14px; font-weight: 700; color: var(--color-error); }
.bar-value { font-size: 24px; font-weight: 800; color: var(--color-error); letter-spacing: -0.5px; }
.bar-unit { font-size: 12px; color: var(--color-text-muted); margin-left: 2px; }

.bar-actions { display: flex; gap: 10px; }

.call-btn {
  height: 44px;
  padding: 0 20px;
  font-size: 14px;
  font-weight: 600;
  border: 1.5px solid var(--color-border);
  color: var(--color-text-secondary, #555);
  background: #fff;
  transition: all 0.25s;
}

.call-btn:active { transform: scale(0.96); background: #f9fafb; }

.book-btn {
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark, #059669) 100%);
  border: none;
  height: 44px;
  padding: 0 32px;
  font-size: 15px;
  font-weight: 700;
  box-shadow: 0 4px 16px rgba(16,185,129,0.3);
  transition: all 0.25s;
}

.book-btn:active { transform: scale(0.96); }

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
  padding: 24px 24px 16px; background: linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%);
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

  .service-name { font-size: 22px; }
  .info-card { padding: 16px; }
  .stat-value { font-size: 20px; }
  .stat-value.city-value { font-size: 14px; }

  .hour-row.today {
    margin: 0 -16px;
    padding: 8px 16px;
  }
}

/* Review Drawer */
.drawer-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.drawer-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 700;
  color: var(--color-text-primary);
}

.drawer-count {
  font-size: 12px;
  color: var(--color-text-muted);
  background: var(--color-bg-light, #f3f4f6);
  padding: 2px 10px;
  border-radius: 10px;
  font-weight: 500;
}

.reviews-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 60px 0;
  color: var(--color-text-muted);
  font-size: 13px;
}

.reviews-empty {
  padding: 80px 0;
}

.reviews-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 4px 0;
}

.review-card {
  background: var(--color-bg-white, #fff);
  border: 1px solid rgba(0, 0, 0, 0.04);
  border-radius: 14px;
  padding: 16px;
  animation: review-fade-in 0.35s ease both;
}

@keyframes review-fade-in {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.review-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}

.review-user {
  display: flex;
  align-items: center;
  gap: 10px;
}

.review-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #fff;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
}

.review-avatar-fb {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--color-primary), var(--color-primary-dark, #059669));
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 700;
  flex-shrink: 0;
}

.review-user-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.review-username {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text-primary);
}

.review-date {
  font-size: 11px;
  color: var(--color-text-muted);
}

.review-stars {
  display: flex;
  gap: 2px;
}

.star-filled {
  color: #f59e0b;
}

.star-empty {
  color: #d1d5db;
}

.review-content {
  font-size: 13px;
  line-height: 1.65;
  color: var(--color-text-secondary, #374151);
  margin: 0;
  word-break: break-word;
}

.review-no-content {
  font-size: 12px;
  color: var(--color-text-muted);
  margin: 0;
  font-style: italic;
}

.review-images {
  display: flex;
  gap: 6px;
  margin-top: 10px;
  flex-wrap: wrap;
}

.review-img {
  width: 64px;
  height: 64px;
  border-radius: 8px;
  object-fit: cover;
  cursor: pointer;
  border: 1px solid rgba(0, 0, 0, 0.05);
  transition: transform 0.2s;
}

.review-img:hover {
  transform: scale(1.08);
}

.review-pet {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin-top: 8px;
  font-size: 11px;
  color: var(--color-primary);
  background: rgba(16, 185, 129, 0.06);
  padding: 3px 10px;
  border-radius: 8px;
  font-weight: 500;
}

.reviews-load-more {
  text-align: center;
  padding: 8px 0 16px;
}

.reviews-end {
  text-align: center;
  font-size: 12px;
  color: var(--color-text-muted);
  padding: 12px 0 20px;
}
</style>