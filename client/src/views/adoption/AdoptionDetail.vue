<template>
  <div class="adoption-detail-page">
    <!-- Loading -->
    <div v-if="adoptionStore.loading && !adoption && !loadError" class="detail-loading">
      <div class="loading-spinner"></div>
      <span class="loading-text">加载中...</span>
    </div>

    <!-- Error Retry -->
    <div v-else-if="loadError && !adoption" class="detail-error">
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="12" cy="12" r="10" stroke="var(--color-error)" stroke-width="1.5"/>
        <path d="M12 8v4M12 16h.01" stroke="var(--color-error)" stroke-width="2" stroke-linecap="round"/>
      </svg>
      <p class="error-text">{{ loadError }}</p>
      <n-button type="primary" round @click="retryLoad">重新加载</n-button>
    </div>

    <template v-else-if="adoption">
      <!-- Page Header -->
      <div class="page-header spring-anim">
        <n-button quaternary @click="goBack" class="back-btn">
          <template #icon><svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></template>
          返回
        </n-button>
        <div class="header-spacer"></div>
        <span v-if="adoption.applicationCount > 0" class="heat-hint">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill="#f59e0b" stroke="#f59e0b" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg> 已有 {{ adoption.applicationCount }} 人申请
        </span>
        <n-tooltip trigger="hover">
          <template #trigger>
            <n-button quaternary @click="handleShare" class="share-btn-header">
              <template #icon><svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M7 17L17 7M17 7H7M17 7v10" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></template>
            </n-button>
          </template>
          分享领养信息
        </n-tooltip>
      </div>

      <!-- Hero Info -->
      <div class="pet-hero spring-anim" style="animation-delay: 0.06s;">
        <div class="pet-name-row">
          <h1 class="pet-name">{{ adoption.petInfo?.name || '未命名' }}</h1>
          <span class="status-badge" :class="adoption.status">{{ statusMap[adoption.status] }}</span>
        </div>
        <p class="pet-subtitle">
          {{ speciesLabelMap[adoption.petInfo?.species] || '未知品种' }}
          <template v-if="adoption.petInfo?.age"> · {{ adoption.petInfo.age }}岁</template>
          <template v-if="adoption.petInfo?.gender"> · {{ adoption.petInfo.gender === 'male' ? '公' : '母' }}</template>
          <template v-if="adoption.location?.city"> · {{ adoption.location.city }}</template>
        </p>
        <div class="pet-tags">
          <span class="gender-pill" :class="adoption.petInfo?.gender">
            {{ adoption.petInfo?.gender === 'male' ? '♂ 公' : '♀ 母' }}
          </span>
          <span class="species-tag">{{ speciesLabelMap[adoption.petInfo?.species] || '未知' }}</span>
          <span v-if="adoption.petInfo?.age" class="age-tag">{{ adoption.petInfo.age }}岁</span>
          <span v-if="adoption.petInfo?.isVaccinated" class="health-pill yes"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 12l5 5L20 7" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg> 已疫苗</span>
          <span v-if="adoption.petInfo?.isNeutered" class="health-pill yes"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="6" cy="6" r="3" stroke="currentColor" stroke-width="1.5"/><circle cx="18" cy="18" r="3" stroke="currentColor" stroke-width="1.5"/><path d="M20 4L4 20" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg> 已绝育</span>
        </div>
      </div>

      <!-- Stats Dashboard -->
      <div class="dashboard spring-anim" style="animation-delay: 0.08s;">
        <n-tooltip trigger="hover">
          <template #trigger>
            <div class="stat-card">
              <span class="stat-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" stroke-width="1.5"/><circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="1.5"/></svg></span>
              <div class="stat-value">{{ adoption.viewCount || 0 }}</div>
              <div class="stat-label">浏览</div>
            </div>
          </template>
          已有 {{ adoption.viewCount || 0 }} 位用户查看过该领养信息
        </n-tooltip>
        <n-tooltip trigger="hover">
          <template #trigger>
            <div class="stat-card">
              <span class="stat-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke="currentColor" stroke-width="1.5"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg></span>
              <div class="stat-value">{{ adoption.applicationCount || 0 }}</div>
              <div class="stat-label">申请</div>
            </div>
          </template>
          <template v-if="adoption.applicationCount">已有 {{ adoption.applicationCount }} 位用户提交申请</template>
          <template v-else>目前还没有人申请，你是第一个！</template>
        </n-tooltip>
        <n-tooltip trigger="hover">
          <template #trigger>
            <div class="stat-card">
              <span class="stat-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" stroke-width="1.5"/><path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg></span>
              <div class="stat-value">{{ formatDateShort(adoption.createdAt) }}</div>
              <div class="stat-label">发布日期</div>
            </div>
          </template>
          发布于 {{ formatDate(adoption.createdAt) }}，信息仍有效
        </n-tooltip>
        <n-tooltip trigger="hover">
          <template #trigger>
            <div class="stat-card">
              <span class="stat-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" stroke="currentColor" stroke-width="1.5"/><circle cx="12" cy="10" r="3" stroke="currentColor" stroke-width="1.5"/></svg></span>
              <div class="stat-value city-value">{{ adoption.location?.city || '--' }}</div>
              <div class="stat-label">所在城市</div>
            </div>
          </template>
          宠物当前位于 {{ adoption.location?.city || '未知' }}，需同城领养/自提
        </n-tooltip>
      </div>

      <!-- Main Grid -->
      <div class="main-grid">
        <div class="main-left">
          <!-- 照片网格 -->
          <div class="info-card spring-anim photo-grid-card" style="animation-delay: 0.05s;" v-if="photos.length > 0">
            <div class="section-header">
              <h3 class="section-title">
                <span class="title-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" stroke-width="1.5"/><circle cx="8.5" cy="8.5" r="1.5" fill="currentColor"/><path d="M21 15l-5-5L5 21" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg></span>
                相关照片
              </h3>
              <span class="photo-count">{{ photos.length }}张</span>
            </div>
            <div class="photo-grid">
              <div v-for="(photo, idx) in photos" :key="idx" class="photo-grid-item" @click="openPreview(idx)">
                <img :src="photo" :alt="`照片 ${idx+1}`" loading="lazy" />
              </div>
            </div>
          </div>
          <!-- 健康状况 -->
          <div class="info-card spring-anim" style="animation-delay: 0.1s;">
            <n-collapse :default-expanded-names="['health']">
              <n-collapse-item name="health">
                <template #header>
                  <h3 class="section-title">
                    <span class="title-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M22 12h-4l-3 9L9 3l-3 9H2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg></span>
                    健康状况
                  </h3>
                </template>
                <div class="health-grid">
                  <div class="health-item" :class="{ yes: adoption.petInfo?.isVaccinated }">
                    <span><svg v-if="adoption.petInfo?.isVaccinated" width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 12l5 5L20 7" stroke="#10B981" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg><svg v-else width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M18 6L6 18M6 6l12 12" stroke="#ef4444" stroke-width="2" stroke-linecap="round"/></svg></span>
                    <span>已疫苗</span>
                  </div>
                  <div class="health-item" :class="{ yes: adoption.petInfo?.isNeutered }">
                    <span><svg v-if="adoption.petInfo?.isNeutered" width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 12l5 5L20 7" stroke="#10B981" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg><svg v-else width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M18 6L6 18M6 6l12 12" stroke="#ef4444" stroke-width="2" stroke-linecap="round"/></svg></span>
                    <span>已绝育</span>
                  </div>
                  <div class="health-item yes" v-if="adoption.petInfo?.healthStatus">
                    <span><svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 12l5 5L20 7" stroke="#10B981" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg></span>
                    <span>{{ adoption.petInfo.healthStatus }}</span>
                  </div>
                  <div class="health-item" :class="{ yes: adoption.petInfo?.isDewormed }">
                    <span><svg v-if="adoption.petInfo?.isDewormed" width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 12l5 5L20 7" stroke="#10B981" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg><svg v-else width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M18 6L6 18M6 6l12 12" stroke="#ef4444" stroke-width="2" stroke-linecap="round"/></svg></span>
                    <span>已驱虫</span>
                  </div>
                </div>
                <p v-if="adoption.petInfo?.description" class="pet-desc">{{ adoption.petInfo.description }}</p>
              </n-collapse-item>
            </n-collapse>
          </div>

          <!-- 领养要求 -->
          <div class="info-card spring-anim" style="animation-delay: 0.14s;">
            <n-collapse :default-expanded-names="['requirements']">
              <n-collapse-item name="requirements">
                <template #header>
                  <h3 class="section-title">
                    <span class="title-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" stroke="currentColor" stroke-width="1.5"/></svg></span>
                    领养要求
                  </h3>
                </template>
                <div class="req-grid">
                  <div class="req-item" :class="{ yes: adoption.requirements?.hasExperience }">
                    <span class="req-icon"><svg v-if="adoption.requirements?.hasExperience" width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 12l5 5L20 7" stroke="#10B981" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg><svg v-else width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="2" stroke="var(--color-border)" stroke-width="1.5"/></svg></span>
                    <span>有养宠经验</span>
                  </div>
                  <div class="req-item" :class="{ yes: adoption.requirements?.hasSpace }">
                    <span class="req-icon"><svg v-if="adoption.requirements?.hasSpace" width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 12l5 5L20 7" stroke="#10B981" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg><svg v-else width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="2" stroke="var(--color-border)" stroke-width="1.5"/></svg></span>
                    <span>有足够活动空间</span>
                  </div>
                  <div class="req-item" :class="{ yes: adoption.requirements?.canAfford }">
                    <span class="req-icon"><svg v-if="adoption.requirements?.canAfford" width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 12l5 5L20 7" stroke="#10B981" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg><svg v-else width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="2" stroke="var(--color-border)" stroke-width="1.5"/></svg></span>
                    <span>能承担养护费用</span>
                  </div>
                  <div class="req-item" :class="{ yes: adoption.requirements?.agreeVisit }">
                    <span class="req-icon"><svg v-if="adoption.requirements?.agreeVisit" width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 12l5 5L20 7" stroke="#10B981" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg><svg v-else width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="2" stroke="var(--color-border)" stroke-width="1.5"/></svg></span>
                    <span>同意定期回访</span>
                  </div>
                </div>
                <p v-if="adoption.requirements?.otherRequirements" class="other-req">
                  {{ adoption.requirements.otherRequirements }}
                </p>
              </n-collapse-item>
            </n-collapse>
          </div>

          <!-- 领养流程 -->
          <div class="info-card spring-anim process-card" style="animation-delay: 0.16s;">
            <div class="section-header">
              <h3 class="section-title">
                <span class="title-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" stroke="currentColor" stroke-width="1.5"/></svg></span>
                领养流程
              </h3>
            </div>
            <div class="process-steps">
              <div v-for="(step, idx) in processSteps" :key="idx" class="process-step">
                <div class="step-number">{{ idx + 1 }}</div>
                <div class="step-label">{{ step }}</div>
                <div v-if="idx < processSteps.length - 1" class="step-arrow">›</div>
              </div>
            </div>
          </div>
        </div>

        <div class="main-right">
          <!-- 救助信息 -->
          <div v-if="hasRescueInfo" class="info-card spring-anim" style="animation-delay: 0.12s;">
            <n-collapse :default-expanded-names="['rescue']">
              <n-collapse-item name="rescue">
                <template #header>
                  <h3 class="section-title">
                    <span class="title-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="currentColor" stroke-width="1.5"/></svg></span>
                    救助信息
                  </h3>
                </template>
                <div class="info-rows">
                  <div v-if="adoption.rescueInfo?.rescueDate" class="info-row">
                    <span class="info-icon"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" stroke-width="1.5"/><path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg></span>
                    <span class="info-label">救助日期</span>
                    <span class="info-value">{{ formatDate(adoption.rescueInfo.rescueDate) }}</span>
                  </div>
                  <div v-if="adoption.rescueInfo?.rescueLocation" class="info-row">
                    <span class="info-icon"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" stroke="currentColor" stroke-width="1.5"/><circle cx="12" cy="10" r="3" stroke="currentColor" stroke-width="1.5"/></svg></span>
                    <span class="info-label">救助地点</span>
                    <span class="info-value">{{ adoption.rescueInfo.rescueLocation }}</span>
                  </div>
                  <div v-if="adoption.rescueInfo?.rescueReason" class="info-row">
                    <span class="info-icon"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" stroke="currentColor" stroke-width="1.5"/></svg></span>
                    <span class="info-label">救助原因</span>
                    <span class="info-value">{{ adoption.rescueInfo.rescueReason }}</span>
                  </div>
                </div>
              </n-collapse-item>
            </n-collapse>
          </div>

          <!-- 所在地区 -->
          <div v-if="adoption.location?.city" class="info-card spring-anim" style="animation-delay: 0.13s;">
            <div class="section-header">
              <h3 class="section-title">
                <span class="title-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" stroke="currentColor" stroke-width="1.5"/><circle cx="12" cy="10" r="3" stroke="currentColor" stroke-width="1.5"/></svg></span>
                所在地区
              </h3>
            </div>
            <p class="location-text">{{ adoption.location.city }}{{ adoption.location.district ? ' · ' + adoption.location.district : '' }}{{ adoption.location.address ? ' · ' + adoption.location.address : '' }}</p>
          </div>

          <!-- 发布者 -->
          <div class="info-card spring-anim publisher-card" style="animation-delay: 0.16s;">
            <div class="section-header">
              <h3 class="section-title">
                <span class="title-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" stroke="currentColor" stroke-width="1.5"/><circle cx="12" cy="10" r="3" stroke="currentColor" stroke-width="1.5"/></svg></span>
                发布者
              </h3>
            </div>
            <div class="publisher-info">
              <div class="publisher-avatar-wrap">
                <img v-if="adoption.publisherId?.avatar" :src="adoption.publisherId.avatar" class="publisher-avatar" />
                <div v-else class="publisher-avatar-fb">{{ publisherInitial }}</div>
              </div>
              <div class="publisher-detail">
                <span class="publisher-name">
                  {{ adoption.publisherId?.username || '匿名用户' }}
                  <span class="role-badge" :class="adoption.publisherId?.role">{{ publisherRole }}</span>
                </span>
                <span class="publisher-time">发布于 {{ formatDate(adoption.createdAt) }}</span>
              </div>
            </div>
            <button class="contact-btn" @click="handleContact">
              <span><svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" stroke="currentColor" stroke-width="1.5"/></svg></span> 联系TA
            </button>
          </div>
        </div>
      </div>
    </template>

    <!-- Empty State -->
    <div v-else class="detail-empty spring-anim">
      <div class="empty-icon"><svg width="64" height="64" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="10" stroke="var(--color-text-muted)" stroke-width="1.5"/><path d="M8 15s1.5 2 4 2 4-2 4-2" stroke="var(--color-text-muted)" stroke-width="1.5" stroke-linecap="round"/><path d="M15 9l-6 6M9 9l6 6" stroke="var(--color-text-muted)" stroke-width="1.2" stroke-linecap="round"/></svg></div>
      <p>领养信息不存在或已删除</p>
      <n-button type="primary" round @click="goBack" class="empty-btn">返回列表</n-button>
    </div>

    <!-- Bottom Action -->
    <div class="bottom-action spring-anim" v-if="adoption?.status === 'pending'">
      <div v-if="!isOwner" class="action-row">
        <button class="fav-btn" :class="{ active: isFavorited }" @click="toggleFavorite" :disabled="favLoading">
          <svg v-if="isFavorited" width="18" height="18" viewBox="0 0 24 24" fill="#F59E0B" stroke="#F59E0B" stroke-width="1.5" aria-hidden="true"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
          <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
        </button>
        <button v-if="hasApplied" class="apply-btn applied-btn" disabled>
          <span class="btn-icon"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="1.5"/><path d="M12 6v6l4 2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg></span>
          已提交申请，等待审核
        </button>
        <button v-else class="apply-btn" @click="goToApply">
          <span class="btn-icon"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" fill="#ef4444" stroke="#ef4444" stroke-width="1.5"/></svg></span>
          申请领养
        </button>
      </div>
      <button v-else class="apply-btn owner-btn" @click="viewApplications">
        <span class="btn-icon"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke="currentColor" stroke-width="1.5"/><circle cx="9" cy="7" r="4" stroke="currentColor" stroke-width="1.5"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" stroke="currentColor" stroke-width="1.5"/></svg></span>
        查看申请 ({{ adoption.applicationCount || 0 }})
      </button>
    </div>
    <div class="bottom-action spring-anim" v-else-if="adoption?.status === 'adopted'">
      <div class="adopted-banner">
        <span><svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 12l5 5L20 7" stroke="#10B981" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg></span>
        <span>已被领养</span>
      </div>
    </div>

    <!-- 客服悬浮按钮 -->
    <div class="support-fab" @click="supportVisible = !supportVisible" v-if="adoption">
      <span><svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" stroke="currentColor" stroke-width="1.5"/></svg></span>
    </div>
    <transition name="fade">
      <div v-if="supportVisible" class="support-popup">
        <div class="support-popup-header">在线客服</div>
        <p class="support-popup-text">有领养问题？点击下方联系客服</p>
        <button @click="copySupportLink" class="support-popup-btn">联系客服</button>
      </div>
    </transition>

    <!-- 联系方式弹窗 -->
    <n-modal v-model:show="contactVisible" :border-radius="16" style="max-width: 380px;">
      <div class="contact-modal">
        <div class="contact-modal-header">
          <div class="contact-avatar-wrap">
            <img v-if="adoption?.publisherId?.avatar" :src="adoption.publisherId.avatar" class="contact-avatar" />
            <div v-else class="contact-avatar-fb">{{ publisherInitial }}</div>
          </div>
          <div class="contact-info">
            <span class="contact-name">{{ adoption?.publisherId?.username || '匿名用户' }}</span>
            <span class="contact-role role-badge" :class="adoption?.publisherId?.role">{{ publisherRole }}</span>
          </div>
        </div>
        <div class="contact-body">
          <div v-if="adoption?.publisherId?.phone" class="contact-phone-row">
            <span class="contact-phone-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="5" y="2" width="14" height="20" rx="2" stroke="currentColor" stroke-width="1.5"/><path d="M12 18h.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></span>
            <a :href="'tel:' + adoption.publisherId.phone" class="contact-phone">{{ adoption.publisherId.phone }}</a>
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
        <img :src="photos[previewIndex]" alt="预览" />
        <button class="preview-close" @click="showPreview = false">
          <span>×</span>
        </button>
        <button v-if="photos.length > 1 && previewIndex > 0" class="preview-nav left" @click.stop="previewIndex--">
          <span>‹</span>
        </button>
        <button v-if="photos.length > 1 && previewIndex < photos.length - 1" class="preview-nav right" @click.stop="previewIndex++">
          <span>›</span>
        </button>
      </div>
    </n-modal>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { NModal, NButton, NTooltip, NCollapse, NCollapseItem, useMessage } from 'naive-ui'
import { useAdoptionStore } from '../../stores/adoption'
import { useAuthStore } from '../../stores/auth'
import { getMyApplications } from '../../api/adoption'
import { checkInteraction, toggleInteraction } from '../../api/interaction'

const router = useRouter()
const route = useRoute()
const adoptionStore = useAdoptionStore()
const authStore = useAuthStore()
const message = useMessage()

const showPreview = ref(false)
const previewIndex = ref(0)

const hasApplied = ref(false)
const isFavorited = ref(false)
const favLoading = ref(false)
const supportVisible = ref(false)
const loadError = ref(null)
const contactVisible = ref(false)

const adoption = computed(() => adoptionStore.currentAdoption)
const photos = computed(() => adoption.value?.petInfo?.photos || [])
const publisherInitial = computed(() => {
  const name = adoption.value?.publisherId?.username || '匿'
  return name.charAt(0).toUpperCase()
})
const isOwner = computed(() => {
  if (!adoption.value || !authStore.userInfo) return false
  return adoption.value.publisherId?._id === authStore.userInfo._id
})
const hasRescueInfo = computed(() => {
  const r = adoption.value?.rescueInfo
  return r && (r.rescueDate || r.rescueLocation || r.rescueReason)
})

const statusMap = { pending: '可领养', adopted: '已领养', closed: '已关闭' }
const speciesLabelMap = { cat: '猫咪', dog: '狗狗', rabbit: '兔兔', bird: '鸟鸟', fish: '鱼鱼', hamster: '仓鼠', other: '其他' }
const roleMap = { user: '个人用户', rescuer: '救助者', admin: '管理员', merchant: '机构认证' }

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



const processSteps = ['提交申请', '发布者审核', '沟通确认', '上门看宠', '签订协议', '接宠回家']

const publisherRole = computed(() => {
  const role = adoption.value?.publisherId?.role
  return roleMap[role] || '个人用户'
})

async function toggleFavorite() {
  if (!authStore.isLoggedIn) {
    router.push({ path: '/login', query: { redirect: route.fullPath } })
    return
  }
  favLoading.value = true
  try {
    await toggleInteraction({ targetType: 'adoption', targetId: route.params.id, type: 'favorite' })
    isFavorited.value = !isFavorited.value
    message.success(isFavorited.value ? '已收藏' : '已取消收藏')
  } catch { message.error('操作失败') }
  finally { favLoading.value = false }
}

async function checkStatus() {
  if (!authStore.isLoggedIn || !route.params.id) return
  try {
    const [favRes, appRes] = await Promise.all([
      checkInteraction('adoption', route.params.id),
      getMyApplications({ pageSize: 100 })
    ])
    isFavorited.value = favRes.data?.isFavorited || favRes.data?.interacted || false
    const apps = appRes.data?.list || appRes.data || []
    hasApplied.value = apps.some(app => app.adoptionId === route.params.id || app.adoptionId?._id === route.params.id)
  } catch {}
}

function openPreview(idx) { previewIndex.value = idx; showPreview.value = true }
function goBack() {
  if (window.history.length > 1) {
    router.back()
  } else {
    router.push('/adoption')
  }
}
function goToApply() {
  if (!authStore.isLoggedIn) {
    router.push({ path: '/login', query: { redirect: route.fullPath } })
    return
  }
  router.push(`/adoption/${route.params.id}/apply`)
}
function viewApplications() { router.push(`/adoption/${route.params.id}/applications`) }
function handleShare() {
  const url = window.location.href
  const title = adoption.value?.petInfo?.name || '领养信息'
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
  const url = window.location.href
  navigator.clipboard.writeText(url).then(() => {
    message.success('链接已复制，请发送给客服')
  }).catch(() => {
    message.error('复制失败')
  })
}
function handleContact() {
  if (!authStore.isLoggedIn) {
    router.push({ path: '/login', query: { redirect: route.fullPath } })
    return
  }
  contactVisible.value = true
}
function copyPhone() {
  const phone = adoption.value?.publisherId?.phone
  if (!phone) return
  navigator.clipboard.writeText(phone).then(() => {
    message.success('手机号已复制')
  }).catch(() => {
    message.error('复制失败，请手动复制')
  })
}

async function retryLoad() {
  loadError.value = null
  const id = route.params.id
  if (id) {
    const result = await adoptionStore.fetchAdoptionDetail(id)
    if (!result) loadError.value = adoptionStore.error || '加载失败，请重试'
    else await checkStatus()
  }
}

onMounted(async () => {
  const id = route.params.id
  if (id) {
    const result = await adoptionStore.fetchAdoptionDetail(id)
    if (!result && adoptionStore.error) loadError.value = adoptionStore.error
    else await checkStatus()
  }
})
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

.adoption-detail-page {
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

/* Error Retry */
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
}

.back-btn,
.share-btn-header {
  color: var(--color-primary);
}

.back-btn:hover {
  background: var(--color-primary-light);
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

.status-badge.pending { background: rgba(16,185,129,0.15); color: #10B981; animation: badge-pulse 2s ease-in-out infinite; }
.status-badge.adopted { background: rgba(107,114,128,0.15); color: #6b7280; }
.status-badge.closed { background: rgba(239,68,68,0.15); color: #ef4444; }

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

/* Pet Hero Info */
.pet-hero {
  padding: 0 4px;
  margin-bottom: 16px;
}

.pet-name-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 4px;
}

.pet-name {
  font-size: 26px;
  font-weight: 800;
  color: var(--color-text-primary);
  margin: 0;
  letter-spacing: 0.5px;
}

.pet-subtitle {
  font-size: 14px;
  color: var(--color-text-muted);
  margin: 0 0 12px;
  font-weight: 500;
  letter-spacing: 0.3px;
}

.pet-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.gender-pill {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  padding: 5px 16px;
  border-radius: var(--radius-full);
  font-size: 13px;
  font-weight: 700;
}

.gender-pill.male {
  background: var(--color-blue-light);
  color: var(--color-blue);
  border: 1.5px solid var(--color-blue-border, rgba(59,130,246,0.2));
}

.gender-pill.female {
  background: var(--color-pink-light);
  color: var(--color-pink);
  border: 1.5px solid var(--color-pink-border, rgba(236,72,153,0.2));
}

.species-tag,
.age-tag {
  background: var(--color-primary-light);
  color: var(--color-primary);
  padding: 5px 14px;
  border-radius: var(--radius-full);
  font-size: 12px;
  font-weight: 600;
  border: 1px solid var(--color-primary-border, rgba(16,185,129,0.15));
}

.age-tag {
  background: var(--color-warning-light, #FFFBEB);
  color: var(--color-warning, #D97706);
  border-color: var(--color-warning-border, rgba(245,158,11,0.15));
}

.health-pill {
  padding: 5px 14px;
  border-radius: var(--radius-full);
  font-size: 12px;
  font-weight: 600;
}

.health-pill.yes {
  background: var(--color-success-light);
  color: var(--color-success);
  border: 1px solid var(--color-success-border, rgba(16,185,129,0.15));
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
  box-shadow: var(--shadow-card);
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
  padding: 22px;
  box-shadow: var(--shadow-card);
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

/* Process Steps */
.process-steps {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.process-step {
  display: flex;
  align-items: center;
  gap: 6px;
}

.step-number {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: var(--color-primary);
  color: #fff;
  font-size: 12px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.step-label {
  font-size: 13px;
  color: var(--color-text-primary);
  font-weight: 500;
  white-space: nowrap;
}

.step-arrow {
  font-size: 18px;
  color: var(--color-text-muted);
  margin: 0 2px;
  user-select: none;
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

/* Health Grid */
.health-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.health-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: var(--color-text-muted);
  padding: 8px 14px;
  border-radius: 12px;
  background: var(--color-bg-light);
}

.health-item.yes {
  color: var(--color-success);
  background: var(--color-success-light);
}

.pet-desc {
  font-size: 14px;
  line-height: 1.7;
  color: var(--color-text-secondary);
  margin: 14px 0 0;
  padding-top: 14px;
  border-top: 1px solid var(--color-border);
}

/* Requirements */
.req-grid {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.req-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: var(--color-text-muted);
  padding: 8px 0;
  transition: color 0.3s;
}

.req-item.yes { color: var(--color-text-primary); font-weight: 500; }

.req-icon { font-size: 14px; }

.other-req {
  font-size: 13px;
  color: var(--color-text-muted);
  line-height: 1.6;
  margin: 14px 0 0;
  padding-top: 14px;
  border-top: 1px solid var(--color-border);
}

/* Info Rows */
.info-rows {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.info-row {
  display: flex;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid var(--color-border-light, rgba(0,0,0,0.04));
}

.info-row:last-child { border-bottom: none; }

.info-icon {
  font-size: 18px;
  width: 32px;
  flex-shrink: 0;
  text-align: center;
}

.info-label {
  font-size: 14px;
  color: var(--color-text-muted);
  width: 70px;
  flex-shrink: 0;
  font-weight: 500;
}

.info-value {
  font-size: 14px;
  color: var(--color-text-primary);
  font-weight: 500;
  flex: 1;
}

/* Location */
.location-text {
  font-size: 14px;
  color: var(--color-text-secondary);
  margin: 0;
  line-height: 1.6;
}

/* Publisher */
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
  background: var(--color-primary-light);
  color: var(--color-primary);
  border: 1px solid var(--color-primary-border, rgba(16,185,129,0.15));
  white-space: nowrap;
}

.role-badge.rescuer,
.role-badge.admin {
  background: var(--color-blue-light, #EFF6FF);
  color: var(--color-blue, #3B82F6);
  border-color: var(--color-blue-border, rgba(59,130,246,0.15));
}

.role-badge.merchant {
  background: var(--color-warning-light, #FFFBEB);
  color: var(--color-warning, #D97706);
  border-color: var(--color-warning-border, rgba(245,158,11,0.15));
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
  padding: 12px 20px calc(12px + env(safe-area-inset-bottom, 0px));
  background: var(--color-bg-white, #fff);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border-top: 1px solid rgba(0,0,0,0.04);
  z-index: 30;
}

.apply-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 14px;
  border: none;
  border-radius: var(--radius-xl);
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark, #059669) 100%);
  color: #fff;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.35s var(--spring-bounce);
  box-shadow: var(--shadow-primary);
  letter-spacing: 0.5px;
}

.apply-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 28px rgba(16, 185, 129, 0.4);
}

.apply-btn:active { transform: translateY(0); }

.apply-btn:disabled,
.applied-btn {
  background: var(--color-bg-light);
  color: var(--color-text-muted);
  cursor: not-allowed;
  box-shadow: none;
}

.applied-btn:hover {
  transform: none;
  box-shadow: none;
}

.btn-icon { font-size: 18px; }

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

.owner-btn {
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark, #059669) 100%);
}

.adopted-banner {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 14px;
  border-radius: var(--radius-xl);
  background: var(--color-success-light);
  border: 1px solid var(--color-success-border, rgba(16,185,129,0.15));
  color: var(--color-success);
  font-size: 15px;
  font-weight: 600;
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

  .pet-name { font-size: 22px; }
  .info-card { padding: 16px; }
  .stat-value { font-size: 20px; }
  .stat-value.city-value { font-size: 14px; }
}

/* Contact Modal */
.contact-modal { padding: 0; background: #fff; border-radius: 16px; overflow: hidden; }
.contact-modal-header {
  display: flex; align-items: center; gap: 14px;
  padding: 24px 24px 16px; background: linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%);
}
.contact-avatar-wrap { width: 52px; height: 52px; border-radius: 50%; overflow: hidden; flex-shrink: 0; border: 2px solid #fff; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
.contact-avatar { width: 100%; height: 100%; object-fit: cover; }
.contact-avatar-fb { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; font-size: 22px; font-weight: 700; color: var(--color-primary); background: var(--color-primary-bg); }
.contact-info { display: flex; flex-direction: column; gap: 4px; }
.contact-name { font-size: 16px; font-weight: 700; color: var(--color-text-primary); }
.contact-body { padding: 20px 24px 24px; }
.contact-phone-row {
  display: flex; align-items: center; gap: 10px;
  background: var(--color-bg); border-radius: 12px; padding: 14px 16px;
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
</style>