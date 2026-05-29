<template>
  <div class="app-tabbar">
    <router-link
      v-for="item in tabItems"
      :key="item.path"
      :to="item.path"
      class="tab-item"
      :class="{ active: isActive(item.path) }"
    >
      <span class="tab-icon">{{ item.icon }}</span>
      <span class="tab-label">{{ item.label }}</span>
    </router-link>
  </div>
</template>

<script setup>
// import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

const tabItems = [
  { path: '/home', label: '首页', icon: '🏠' },
  { path: '/community', label: '社区', icon: '💬' },
  { path: '/adoption', label: '领养', icon: '🐾' },
  { path: '/secondhand', label: '二手', icon: '🛒' },
  { path: '/profile', label: '我的', icon: '👤' }
]

function isActive(path) {
  return route.path === path
}
</script>

<style scoped>
.app-tabbar {
  display: none;
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: #fff;
  box-shadow: 0 -2px 12px rgba(0, 0, 0, 0.08);
  height: 60px;
  align-items: center;
  justify-content: space-around;
  z-index: 1000;
}

@media (max-width: 768px) {
  .app-tabbar {
    display: flex;
  }
}

.tab-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  text-decoration: none;
  color: var(--color-text-muted);
  transition: color var(--transition-fast);
}

.tab-item.active {
  color: var(--color-primary);
}

.tab-icon {
  font-size: 22px;
  margin-bottom: 4px;
}

.tab-label {
  font-size: 12px;
  font-weight: 500;
}

.tab-item.active .tab-label {
  font-weight: 600;
}
</style>
