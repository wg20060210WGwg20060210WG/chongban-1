<template>
  <div class="user-management">
    <h2 class="page-title">用户管理</h2>

    <!-- 筛选栏 -->
    <div class="filter-bar">
      <n-input v-model:value="keyword" placeholder="搜索用户名/邮箱/手机号" clearable style="width: 260px" @clear="handleSearch" @keyup.enter="handleSearch" />
      <n-select v-model:value="roleFilter" placeholder="角色筛选" clearable style="width: 140px" :options="roleOptions" @update:value="handleSearch" />
      <n-select v-model:value="statusFilter" placeholder="状态筛选" clearable style="width: 140px" :options="statusOptions" @update:value="handleSearch" />
      <n-button type="primary" @click="handleSearch">搜索</n-button>
    </div>

    <!-- 用户表格 -->
    <n-data-table :columns="columns" :data="adminStore.users" :loading="adminStore.usersLoading" :bordered="false" striped />
    <div class="pagination-wrap">
      <n-pagination v-model:page="page" :page-count="adminStore.usersPagination.totalPages" @update:page="handlePageChange" />
    </div>

    <!-- 封禁弹窗 -->
    <n-modal v-model:show="showBanModal" preset="dialog" :title="banTarget?.status === 'banned' ? '解封用户' : '封禁用户'" positive-text="确认" negative-text="取消" @positive-click="confirmBan">
      <template v-if="banTarget?.status !== 'banned'">
        <n-input v-model:value="banReason" type="textarea" placeholder="封禁原因（可选）" :rows="3" />
        <div style="margin-top: 12px">
          <n-input-number v-model:value="banDuration" placeholder="封禁时长（秒，留空为永久）" :min="0" style="width: 100%" />
        </div>
      </template>
      <template v-else>
        <p>确定要解封用户 <strong>{{ banTarget?.username }}</strong> 吗？</p>
      </template>
    </n-modal>
  </div>
</template>

<script setup>
import { ref, h, onMounted } from 'vue'
import { NButton, NTag, useMessage } from 'naive-ui'
import { useAdminStore } from '../../stores/admin'

const message = useMessage()
const adminStore = useAdminStore()

const keyword = ref('')
const roleFilter = ref(null)
const statusFilter = ref(null)
const page = ref(1)
const showBanModal = ref(false)
const banTarget = ref(null)
const banReason = ref('')
const banDuration = ref(null)

const roleOptions = [
  { label: '普通用户', value: 'user' },
  { label: '服务商家', value: 'merchant' },
  { label: '救助发起人', value: 'rescuer' },
  { label: '管理员', value: 'admin' }
]

const statusOptions = [
  { label: '正常', value: 'active' },
  { label: '已封禁', value: 'banned' }
]

const roleMap = { user: '普通用户', merchant: '服务商家', rescuer: '救助发起人', admin: '管理员' }
const roleTypeMap = { user: 'default', merchant: 'info', rescuer: 'warning', admin: 'error' }

const columns = [
  { title: '用户名', key: 'username', width: 120 },
  { title: '邮箱', key: 'email', width: 180 },
  { title: '手机号', key: 'phone', width: 130, render: (row) => row.phone || '-' },
  {
    title: '角色', key: 'role', width: 110,
    render: (row) => h(NTag, { type: roleTypeMap[row.role] || 'default', size: 'small' }, { default: () => roleMap[row.role] || row.role })
  },
  {
    title: '状态', key: 'status', width: 90,
    render: (row) => h(NTag, { type: row.status === 'active' ? 'success' : 'error', size: 'small' }, { default: () => row.status === 'active' ? '正常' : '已封禁' })
  },
  {
    title: '注册时间', key: 'createdAt', width: 170,
    render: (row) => new Date(row.createdAt).toLocaleString('zh-CN')
  },
  {
    title: '操作', key: 'actions', width: 100, fixed: 'right',
    render: (row) => {
      if (row.role === 'admin') return null
      return h(NButton, {
        size: 'small', type: row.status === 'banned' ? 'success' : 'error', quaternary: true,
        onClick: () => openBanModal(row)
      }, { default: () => row.status === 'banned' ? '解封' : '封禁' })
    }
  }
]

function handleSearch() {
  page.value = 1
  loadUsers()
}

function handlePageChange(p) {
  page.value = p
  loadUsers()
}

async function loadUsers() {
  const params = { page: page.value }
  if (keyword.value) params.keyword = keyword.value
  if (roleFilter.value) params.role = roleFilter.value
  if (statusFilter.value) params.status = statusFilter.value
  try {
    await adminStore.fetchUsers(params)
  } catch {
    message.error('获取用户列表失败')
  }
}

function openBanModal(user) {
  banTarget.value = user
  banReason.value = ''
  banDuration.value = null
  showBanModal.value = true
}

async function confirmBan() {
  try {
    const data = banTarget.value.status === 'banned' ? {} : { reason: banReason.value, duration: banDuration.value }
    const res = await adminStore.toggleBanUser(banTarget.value._id, data)
    message.success(res.message || '操作成功')
    showBanModal.value = false
  } catch (e) {
    message.error(e.message || '操作失败')
  }
}

onMounted(() => loadUsers())
</script>

<style scoped>
.user-management {
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

.filter-bar {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.pagination-wrap {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}
</style>