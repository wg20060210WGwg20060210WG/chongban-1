<template>
  <div class="home-page">
    <div class="hero-section">
      <h1 class="hero-title">欢迎来到宠伴</h1>
      <p class="hero-desc">宠物一站式服务平台</p>
    </div>
    <div class="feature-grid">
      <router-link to="/pets" class="feature-card">
        <div class="feature-icon green">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill="currentColor"/>
          </svg>
        </div>
        <h3>宠物档案</h3>
        <p>管理宠物健康记录</p>
      </router-link>

      <router-link to="/community" class="feature-card">
        <div class="feature-icon blue">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" fill="currentColor"/>
          </svg>
        </div>
        <h3>社区互动</h3>
        <p>分享养宠日常</p>
      </router-link>

      <router-link to="/adoption" class="feature-card">
        <div class="feature-icon orange">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke="currentColor" stroke-width="1.5"/>
            <circle cx="8.5" cy="7" r="4" stroke="currentColor" stroke-width="1.5"/>
            <path d="M20 8v6M23 11h-6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
        </div>
        <h3>领养救助</h3>
        <p>给毛孩子一个家</p>
      </router-link>

      <router-link to="/secondhand" class="feature-card">
        <div class="feature-icon purple">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" fill="currentColor"/>
            <line x1="3" y1="6" x2="21" y2="6" stroke="#fff" stroke-width="1.5"/>
            <path d="M16 10a4 4 0 01-8 0" stroke="#fff" stroke-width="1.5"/>
          </svg>
        </div>
        <h3>二手好物</h3>
        <p>闲置宠物用品交易</p>
      </router-link>

      <router-link to="/services" class="feature-card">
        <div class="feature-icon teal">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <rect x="3" y="3" width="18" height="18" rx="3" fill="currentColor"/>
            <path d="M9 12l2 2 4-4" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
        <h3>服务预约</h3>
        <p>美容寄养一站搞定</p>
      </router-link>

      <router-link to="/ai" class="feature-card">
        <div class="feature-icon violet">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.5"/>
            <path d="M12 7v4m0 0v4m0-4h4m-4 0H8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
        </div>
        <h3>AI 健康管家</h3>
        <p>智能问诊与养宠指南</p>
      </router-link>
    </div>
  </div>
</template>

<script setup>
</script>

<style scoped>
.home-page {
  min-height: calc(100vh - 120px);
  padding: 0 16px 40px;
  background: linear-gradient(180deg, var(--color-primary-light) 0%, var(--color-bg) 40%);
}

.hero-section {
  text-align: center;
  padding: 48px 0 32px;
}

.hero-title {
  font-size: 28px;
  font-weight: 800;
  color: var(--color-text-primary);
  margin: 0 0 8px;
}

.hero-desc {
  font-size: 15px;
  color: var(--color-text-secondary);
  margin: 0;
}

.feature-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 16px;
  max-width: 800px;
  margin: 0 auto;
}

.feature-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 28px 16px;
  background: var(--color-bg-white);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-card);
  text-decoration: none;
  color: inherit;
  transition: all 0.3s var(--spring-bounce);
  cursor: pointer;
}

.feature-card:hover {
  transform: translateY(-6px);
  box-shadow: var(--shadow-hover);
}

.feature-icon {
  width: 56px;
  height: 56px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
}

.feature-icon.green { background: linear-gradient(135deg, #10B981, #059669); }
.feature-icon.blue { background: linear-gradient(135deg, #3B82F6, #2563EB); }
.feature-icon.orange { background: linear-gradient(135deg, #F59E0B, #D97706); }
.feature-icon.purple { background: linear-gradient(135deg, #8B5CF6, #7C3AED); }
.feature-icon.teal { background: linear-gradient(135deg, #14B8A6, #0D9488); }
.feature-icon.violet { background: linear-gradient(135deg, #7C3AED, #6D28D9); }

.feature-card h3 {
  font-size: 16px;
  font-weight: 700;
  margin: 0;
  color: var(--color-text-primary);
}

.feature-card p {
  font-size: 12px;
  color: var(--color-text-muted);
  margin: 0;
  text-align: center;
}

@media (max-width: 768px) {
  .feature-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }
  .feature-card {
    padding: 20px 12px;
  }
  .feature-icon {
    width: 48px;
    height: 48px;
    border-radius: 14px;
  }
}
</style>