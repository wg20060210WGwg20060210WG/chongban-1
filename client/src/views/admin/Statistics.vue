<template>
  <div class="statistics-page">
    <h2 class="page-title">数据统计</h2>

    <n-spin :show="loading">
      <!-- 概览卡片 -->
      <div class="overview-cards">
        <div class="overview-card">
          <div class="ov-label">用户总数</div>
          <div class="ov-value">{{ stats.users?.total || 0 }}</div>
          <div class="ov-sub">今日新增 {{ stats.users?.newToday || 0 }} · 活跃 {{ stats.users?.active || 0 }}</div>
        </div>
        <div class="overview-card">
          <div class="ov-label">帖子总数</div>
          <div class="ov-value">{{ stats.posts?.total || 0 }}</div>
          <div class="ov-sub">今日新增 {{ stats.posts?.newToday || 0 }}</div>
        </div>
        <div class="overview-card">
          <div class="ov-label">服务订单</div>
          <div class="ov-value">{{ stats.orders?.service?.total || 0 }}</div>
          <div class="ov-sub">待处理 {{ stats.orders?.service?.pending || 0 }}</div>
        </div>
        <div class="overview-card">
          <div class="ov-label">二手订单</div>
          <div class="ov-value">{{ stats.orders?.secondhand?.total || 0 }}</div>
          <div class="ov-sub">待处理 {{ stats.orders?.secondhand?.pending || 0 }}</div>
        </div>
        <div class="overview-card">
          <div class="ov-label">领养信息</div>
          <div class="ov-value">{{ stats.adoptions?.total || 0 }}</div>
          <div class="ov-sub">待审核 {{ stats.adoptions?.pendingApplications || 0 }}</div>
        </div>
      </div>

      <!-- 图表 -->
      <div class="charts-grid">
        <div class="chart-card">
          <h3>用户统计</h3>
          <div ref="userChartRef" class="chart-box"></div>
        </div>
        <div class="chart-card">
          <h3>订单统计</h3>
          <div ref="orderChartRef" class="chart-box"></div>
        </div>
        <div class="chart-card full-width">
          <h3>平台全景</h3>
          <div ref="fullChartRef" class="chart-box"></div>
        </div>
      </div>
    </n-spin>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick, onBeforeUnmount } from 'vue'
import { useMessage } from 'naive-ui'
import { useAdminStore } from '../../stores/admin'
import * as echarts from 'echarts'

const message = useMessage()
const adminStore = useAdminStore()

const loading = ref(false)
const stats = ref({})
const userChartRef = ref(null)
const orderChartRef = ref(null)
const fullChartRef = ref(null)
let charts = []

async function loadStats() {
  loading.value = true
  try {
    const data = await adminStore.fetchStatistics()
    stats.value = data || {}
    await nextTick()
    renderCharts()
  } catch {
    message.error('加载统计数据失败')
  } finally {
    loading.value = false
  }
}

function renderCharts() {
  charts.forEach(c => c.dispose())
  charts = []

  // 用户统计 - 饼图
  if (userChartRef.value) {
    const chart = echarts.init(userChartRef.value)
    charts.push(chart)
    chart.setOption({
      tooltip: { trigger: 'item' },
      legend: { bottom: 0 },
      series: [{
        type: 'pie',
        radius: ['35%', '60%'],
        data: [
          { value: stats.value.users?.active || 0, name: '活跃用户', itemStyle: { color: '#10B981' } },
          { value: (stats.value.users?.total || 0) - (stats.value.users?.active || 0), name: '其他', itemStyle: { color: '#E5E7EB' } }
        ],
        label: { formatter: '{b}\n{c}人' }
      }]
    })
  }

  // 订单统计 - 饼图
  if (orderChartRef.value) {
    const chart = echarts.init(orderChartRef.value)
    charts.push(chart)
    chart.setOption({
      tooltip: { trigger: 'item' },
      legend: { bottom: 0 },
      series: [{
        type: 'pie',
        radius: ['35%', '60%'],
        data: [
          { value: stats.value.orders?.service?.total || 0, name: '服务订单', itemStyle: { color: '#8B5CF6' } },
          { value: stats.value.orders?.secondhand?.total || 0, name: '二手订单', itemStyle: { color: '#F59E0B' } },
          { value: stats.value.adoptions?.total || 0, name: '领养信息', itemStyle: { color: '#EC4899' } }
        ],
        label: { formatter: '{b}\n{c}' }
      }]
    })
  }

  // 全景柱状图
  if (fullChartRef.value) {
    const chart = echarts.init(fullChartRef.value)
    charts.push(chart)
    chart.setOption({
      tooltip: { trigger: 'axis' },
      xAxis: {
        type: 'category',
        data: ['用户', '帖子', '服务订单', '二手订单', '领养']
      },
      yAxis: { type: 'value' },
      series: [{
        type: 'bar',
        barWidth: '40%',
        data: [
          { value: stats.value.users?.total || 0, itemStyle: { color: '#3B82F6' } },
          { value: stats.value.posts?.total || 0, itemStyle: { color: '#10B981' } },
          { value: stats.value.orders?.service?.total || 0, itemStyle: { color: '#8B5CF6' } },
          { value: stats.value.orders?.secondhand?.total || 0, itemStyle: { color: '#F59E0B' } },
          { value: stats.value.adoptions?.total || 0, itemStyle: { color: '#EC4899' } }
        ],
        label: { show: true, position: 'top' }
      }]
    })
  }
}

function handleResize() {
  charts.forEach(c => c.resize())
}

onMounted(() => {
  loadStats()
  window.addEventListener('resize', handleResize)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  charts.forEach(c => c.dispose())
})
</script>

<style scoped>
.statistics-page {
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

.overview-cards {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 12px;
  margin-bottom: 24px;
}

.overview-card {
  background: #fff;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
  text-align: center;
}

.ov-label { font-size: 12px; color: #888; margin-bottom: 6px; }
.ov-value { font-size: 26px; font-weight: 700; color: #1a1a2e; }
.ov-sub { font-size: 11px; color: #aaa; margin-top: 6px; }

.charts-grid {
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

.chart-card.full-width {
  grid-column: 1 / -1;
}

.chart-card h3 {
  font-size: 16px;
  font-weight: 600;
  color: #1a1a2e;
  margin: 0 0 16px;
}

.chart-box {
  width: 100%;
  height: 280px;
}

@media (max-width: 768px) {
  .overview-cards { grid-template-columns: repeat(2, 1fr); }
  .charts-grid { grid-template-columns: 1fr; }
}
</style>