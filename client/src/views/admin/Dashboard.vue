<template>
  <div class="admin-dashboard">
    <h2 class="page-title">管理后台</h2>

    <n-spin :show="loading">
      <!-- 数据卡片 -->
      <div class="stats-cards">
        <div class="stat-card card-blue">
          <div class="stat-icon">👥</div>
          <div class="stat-info">
            <span class="stat-value">{{ stats.users?.total || 0 }}</span>
            <span class="stat-label">用户总数</span>
          </div>
          <div class="stat-sub">今日新增 {{ stats.users?.newToday || 0 }}</div>
        </div>
        <div class="stat-card card-green">
          <div class="stat-icon">📝</div>
          <div class="stat-info">
            <span class="stat-value">{{ stats.posts?.total || 0 }}</span>
            <span class="stat-label">帖子总数</span>
          </div>
          <div class="stat-sub">今日新增 {{ stats.posts?.newToday || 0 }}</div>
        </div>
        <div class="stat-card card-orange">
          <div class="stat-icon">🛒</div>
          <div class="stat-info">
            <span class="stat-value">{{ (stats.orders?.service?.total || 0) + (stats.orders?.secondhand?.total || 0) }}</span>
            <span class="stat-label">订单总数</span>
          </div>
          <div class="stat-sub">待处理 {{ (stats.orders?.service?.pending || 0) + (stats.orders?.secondhand?.pending || 0) }}</div>
        </div>
        <div class="stat-card card-pink">
          <div class="stat-icon">🐾</div>
          <div class="stat-info">
            <span class="stat-value">{{ stats.adoptions?.total || 0 }}</span>
            <span class="stat-label">领养信息</span>
          </div>
          <div class="stat-sub">待审核 {{ stats.adoptions?.pendingApplications || 0 }}</div>
        </div>
      </div>

      <!-- 快捷操作 -->
      <div class="quick-actions">
        <n-button type="primary" @click="router.push('/admin/users')">用户管理</n-button>
        <n-button type="info" @click="router.push('/admin/review')">内容审核</n-button>
        <n-button type="warning" @click="router.push('/admin/reports')">举报管理</n-button>
        <n-button type="success" @click="router.push('/admin/statistics')">数据统计</n-button>
      </div>

      <!-- 图表区域 -->
      <div class="charts-row">
        <div class="chart-card">
          <h3>订单分布</h3>
          <div ref="orderChartRef" class="chart-container"></div>
        </div>
        <div class="chart-card">
          <h3>平台概览</h3>
          <div ref="overviewChartRef" class="chart-container"></div>
        </div>
      </div>
    </n-spin>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { useMessage } from 'naive-ui'
import { useAdminStore } from '../../stores/admin'
import * as echarts from 'echarts'

const router = useRouter()
const message = useMessage()
const adminStore = useAdminStore()

const loading = ref(false)
const stats = ref({})
const orderChartRef = ref(null)
const overviewChartRef = ref(null)
let orderChart = null
let overviewChart = null

async function loadStats() {
  loading.value = true
  try {
    const data = await adminStore.fetchStatistics()
    stats.value = data || {}
    await nextTick()
    renderCharts()
  } catch (e) {
    message.error('加载统计数据失败')
  } finally {
    loading.value = false
  }
}

function renderCharts() {
  // 订单分布饼图
  if (orderChartRef.value) {
    orderChart = echarts.init(orderChartRef.value)
    orderChart.setOption({
      tooltip: { trigger: 'item' },
      legend: { bottom: 0 },
      series: [{
        type: 'pie',
        radius: ['40%', '65%'],
        label: { show: true, formatter: '{b}: {c}' },
        data: [
          { value: stats.value.orders?.service?.total || 0, name: '服务订单', itemStyle: { color: '#10B981' } },
          { value: stats.value.orders?.secondhand?.total || 0, name: '二手订单', itemStyle: { color: '#F59E0B' } },
          { value: stats.value.adoptions?.total || 0, name: '领养信息', itemStyle: { color: '#EC4899' } }
        ]
      }]
    })
  }

  // 平台概览柱状图
  if (overviewChartRef.value) {
    overviewChart = echarts.init(overviewChartRef.value)
    overviewChart.setOption({
      tooltip: { trigger: 'axis' },
      xAxis: {
        type: 'category',
        data: ['用户', '帖子', '服务订单', '二手订单', '领养'],
        axisLabel: { fontSize: 12 }
      },
      yAxis: { type: 'value' },
      series: [{
        type: 'bar',
        barWidth: '50%',
        data: [
          { value: stats.value.users?.total || 0, itemStyle: { color: '#3B82F6' } },
          { value: stats.value.posts?.total || 0, itemStyle: { color: '#10B981' } },
          { value: stats.value.orders?.service?.total || 0, itemStyle: { color: '#8B5CF6' } },
          { value: stats.value.orders?.secondhand?.total || 0, itemStyle: { color: '#F59E0B' } },
          { value: stats.value.adoptions?.total || 0, itemStyle: { color: '#EC4899' } }
        ]
      }]
    })
  }
}

function handleResize() {
  orderChart?.resize()
  overviewChart?.resize()
}

onMounted(() => {
  loadStats()
  window.addEventListener('resize', handleResize)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  orderChart?.dispose()
  overviewChart?.dispose()
})
</script>

<style scoped>
.admin-dashboard {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px 20px;
  animation: fade-in 0.4s ease;
}

@keyframes fade-in {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
}

.page-title {
  font-size: 24px;
  font-weight: 700;
  color: #1a1a2e;
  margin: 0 0 24px;
}

.stats-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card {
  background: #fff;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
  position: relative;
  overflow: hidden;
}

.stat-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
}

.card-blue::before { background: linear-gradient(90deg, #3B82F6, #60A5FA); }
.card-green::before { background: linear-gradient(90deg, #10B981, #34D399); }
.card-orange::before { background: linear-gradient(90deg, #F59E0B, #FBBF24); }
.card-pink::before { background: linear-gradient(90deg, #EC4899, #F472B6); }

.stat-icon {
  font-size: 28px;
  margin-bottom: 12px;
}

.stat-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: #1a1a2e;
}

.stat-label {
  font-size: 13px;
  color: #888;
}

.stat-sub {
  margin-top: 8px;
  font-size: 12px;
  color: #999;
}

.quick-actions {
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
}

.charts-row {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.chart-card {
  background: #fff;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
}

.chart-card h3 {
  font-size: 16px;
  font-weight: 600;
  color: #1a1a2e;
  margin: 0 0 16px;
}

.chart-container {
  width: 100%;
  height: 300px;
}

@media (max-width: 768px) {
  .stats-cards {
    grid-template-columns: repeat(2, 1fr);
  }
  .charts-row {
    grid-template-columns: 1fr;
  }
}
</style>