<template>
  <div class="main-layout">
    <AppHeader />
    <main class="main-content">
      <router-view v-slot="{ Component }">
        <transition name="page-fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>
    <AppFooter />
    <AppTabBar />
  </div>
</template>

<script setup>
import AppHeader from './AppHeader.vue'
import AppFooter from './AppFooter.vue'
import AppTabBar from './AppTabBar.vue'
</script>

<style scoped>
.main-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.main-content {
  flex: 1;
  padding: 24px 20px;
  max-width: 1400px;
  width: 100%;
  margin: 0 auto;
}

.page-fade-enter-active,
.page-fade-leave-active {
  transition: opacity 0.3s ease, transform 0.35s var(--spring-bounce);
}

.page-fade-enter-from {
  opacity: 0;
  transform: translateY(20px) scale(0.98);
}

.page-fade-leave-to {
  opacity: 0;
  transform: translateY(-10px) scale(0.98);
}

@media (max-width: 768px) {
  .main-content {
    padding: 16px 12px 80px;
  }
}
</style>
