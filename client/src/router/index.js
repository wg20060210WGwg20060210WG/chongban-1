import { createRouter, createWebHistory } from 'vue-router'
import { STORAGE_KEYS } from '../utils/constants'
import storage from '../utils/storage'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/auth/Login.vue'),
    meta: { title: '登录', requiresAuth: false }
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('../views/auth/Register.vue'),
    meta: { title: '注册', requiresAuth: false }
  },
  {
    path: '/',
    redirect: '/home',
    component: () => import('../components/layout/MainLayout.vue'),
    children: [
      {
        path: 'home',
        name: 'Home',
        component: () => import('../views/home/Home.vue'),
        meta: { title: '首页', requiresAuth: false }
      },
      {
        path: 'community',
        name: 'Community',
        component: () => import('../views/community/PostList.vue'),
        meta: { title: '社区', requiresAuth: false }
      },
      {
        path: 'community/create',
        name: 'CreatePost',
        component: () => import('../views/community/CreatePost.vue'),
        meta: { title: '发布帖子', requiresAuth: true }
      },
      {
        path: 'community/:id',
        name: 'PostDetail',
        component: () => import('../views/community/PostDetail.vue'),
        meta: { title: '帖子详情', requiresAuth: false }
      },
      {
        path: 'adoption',
        name: 'Adoption',
        component: () => import('../views/adoption/AdoptionList.vue'),
        meta: { title: '领养', requiresAuth: false }
      },
      {
        path: 'adoption/publish',
        name: 'PublishAdoption',
        component: () => import('../views/adoption/PublishAdoption.vue'),
        meta: { title: '发布领养', requiresAuth: true }
      },
      {
        path: 'adoption/applications',
        name: 'MyApplications',
        component: () => import('../views/adoption/MyApplications.vue'),
        meta: { title: '我的申请', requiresAuth: true }
      },
      {
        path: 'adoption/my',
        name: 'MyAdoptions',
        component: () => import('../views/adoption/MyAdoptions.vue'),
        meta: { title: '我发布的领养', requiresAuth: true }
      },
      {
        path: 'adoption/:id/applications',
        name: 'AdoptionApplications',
        component: () => import('../views/adoption/AdoptionApplications.vue'),
        meta: { title: '申请管理', requiresAuth: true }
      },
      {
        path: 'adoption/:id',
        name: 'AdoptionDetail',
        component: () => import('../views/adoption/AdoptionDetail.vue'),
        meta: { title: '领养详情', requiresAuth: false }
      },
      {
        path: 'adoption/:id/apply',
        name: 'AdoptionApplication',
        component: () => import('../views/adoption/AdoptionApplication.vue'),
        meta: { title: '领养申请', requiresAuth: true }
      },
      {
        path: 'services',
        name: 'Services',
        component: () => import('../views/service/ServiceList.vue'),
        meta: { title: '服务', requiresAuth: false }
      },
      {
        path: 'services/orders',
        name: 'ServiceOrders',
        component: () => import('../views/service/OrderList.vue'),
        meta: { title: '我的订单', requiresAuth: true }
      },
      {
        path: 'services/orders/:id',
        name: 'ServiceOrderDetail',
        component: () => import('../views/service/OrderDetail.vue'),
        meta: { title: '订单详情', requiresAuth: true }
      },
      {
        path: 'services/:id/edit',
        name: 'EditService',
        component: () => import('../views/service/EditService.vue'),
        meta: { title: '编辑服务', requiresAuth: true }
      },
      {
        path: 'services/:id',
        name: 'ServiceDetail',
        component: () => import('../views/service/ServiceDetail.vue'),
        meta: { title: '服务详情', requiresAuth: false }
      },
      {
        path: 'services/:id/book',
        name: 'ServiceBooking',
        component: () => import('../views/service/ServiceBooking.vue'),
        meta: { title: '预约服务', requiresAuth: true }
      },
      {
        path: 'merchant',
        name: 'MerchantCenter',
        component: () => import('../views/service/MerchantCenter.vue'),
        meta: { title: '商家中心', requiresAuth: true }
      },
      {
        path: 'merchant/orders',
        name: 'MerchantOrders',
        component: () => import('../views/service/MerchantOrders.vue'),
        meta: { title: '商家订单', requiresAuth: true }
      },
      {
        path: 'merchant/services/publish',
        name: 'PublishService',
        component: () => import('../views/service/PublishService.vue'),
        meta: { title: '发布服务', requiresAuth: true }
      },
      {
        path: 'secondhand',
        name: 'SecondhandList',
        component: () => import('../views/secondhand/ItemList.vue'),
        meta: { title: '二手好物', requiresAuth: false }
      },
      {
        path: 'secondhand/publish',
        name: 'SecondhandPublish',
        component: () => import('../views/secondhand/PublishItem.vue'),
        meta: { title: '发布商品', requiresAuth: true }
      },
      {
        path: 'secondhand/my',
        name: 'SecondhandMyItems',
        component: () => import('../views/secondhand/MyItems.vue'),
        meta: { title: '我的商品', requiresAuth: true }
      },
      {
        path: 'secondhand/orders',
        name: 'SecondhandOrders',
        component: () => import('../views/secondhand/OrderList.vue'),
        meta: { title: '我的订单', requiresAuth: true }
      },
      {
        path: 'secondhand/orders/:id',
        name: 'SecondhandOrderDetail',
        component: () => import('../views/secondhand/OrderDetail.vue'),
        meta: { title: '订单详情', requiresAuth: true }
      },
      {
        path: 'secondhand/:id',
        name: 'SecondhandDetail',
        component: () => import('../views/secondhand/ItemDetail.vue'),
        meta: { title: '商品详情', requiresAuth: true }
      },
      {
        path: 'secondhand/:id/order',
        name: 'SecondhandOrderCreate',
        component: () => import('../views/secondhand/OrderCreate.vue'),
        meta: { title: '确认下单', requiresAuth: true }
      },
      {
        path: 'profile',
        name: 'Profile',
        component: () => import('../views/user/Profile.vue'),
        meta: { title: '个人中心', requiresAuth: true }
      },
      {
        path: 'settings',
        name: 'Settings',
        component: () => import('../views/user/Settings.vue'),
        meta: { title: '设置', requiresAuth: true }
      },
      {
        path: 'pets',
        name: 'Pets',
        component: () => import('../views/pet/PetList.vue'),
        meta: { title: '我的宠物', requiresAuth: true }
      },
      {
        path: 'pets/add',
        name: 'AddPet',
        component: () => import('../views/pet/AddPet.vue'),
        meta: { title: '添加宠物', requiresAuth: true }
      },
      {
        path: 'pets/:id',
        name: 'PetProfile',
        component: () => import('../views/pet/PetProfile.vue'),
        meta: { title: '宠物详情', requiresAuth: true }
      },
      {
        path: 'pets/:id/edit',
        name: 'EditPet',
        component: () => import('../views/pet/EditPet.vue'),
        meta: { title: '编辑宠物', requiresAuth: true }
      },
      {
        path: 'pets/:id/health',
        name: 'HealthRecords',
        component: () => import('../views/pet/HealthRecords.vue'),
        meta: { title: '健康记录', requiresAuth: true }
      },
      {
        path: 'pets/health-reminders',
        name: 'HealthReminders',
        component: () => import('../views/pet/HealthReminders.vue'),
        meta: { title: '健康提醒', requiresAuth: true }
      },
      {
        path: 'my-posts',
        name: 'MyPosts',
        component: () => import('../views/user/MyPosts.vue'),
        meta: { title: '我的帖子', requiresAuth: true }
      },
      {
        path: 'my-collections',
        name: 'MyCollections',
        component: () => import('../views/user/MyCollections.vue'),
        meta: { title: '我的收藏', requiresAuth: true }
      },
      {
        path: 'notifications',
        name: 'Notifications',
        component: () => import('../views/user/Notifications.vue'),
        meta: { title: '通知', requiresAuth: true }
      },
      {
        path: 'ai',
        name: 'AIChat',
        component: () => import('../views/ai/AIChat.vue'),
        meta: { title: 'AI 健康管家', requiresAuth: true }
      },
      {
        path: 'ai/conversation/:id',
        name: 'AIConversation',
        component: () => import('../views/ai/AIChat.vue'),
        meta: { title: 'AI 健康管家', requiresAuth: true }
      },
      {
        path: 'ai/history',
        name: 'ConsultationHistory',
        component: () => import('../views/ai/ConsultationHistory.vue'),
        meta: { title: '问诊历史', requiresAuth: true }
      },
      {
        path: 'ai/guide',
        name: 'PetGuide',
        component: () => import('../views/ai/PetGuide.vue'),
        meta: { title: 'AI 养宠指南', requiresAuth: true }
      },
      // 管理员路由
      {
        path: 'admin',
        name: 'AdminDashboard',
        component: () => import('../views/admin/Dashboard.vue'),
        meta: { title: '管理后台', requiresAuth: true, roles: ['admin'] }
      },
      {
        path: 'admin/users',
        name: 'AdminUsers',
        component: () => import('../views/admin/UserManagement.vue'),
        meta: { title: '用户管理', requiresAuth: true, roles: ['admin'] }
      },
      {
        path: 'admin/review',
        name: 'AdminReview',
        component: () => import('../views/admin/ContentReview.vue'),
        meta: { title: '内容审核', requiresAuth: true, roles: ['admin'] }
      },
      {
        path: 'admin/reports',
        name: 'AdminReports',
        component: () => import('../views/admin/ReportManagement.vue'),
        meta: { title: '举报管理', requiresAuth: true, roles: ['admin'] }
      },
      {
        path: 'admin/statistics',
        name: 'AdminStatistics',
        component: () => import('../views/admin/Statistics.vue'),
        meta: { title: '数据统计', requiresAuth: true, roles: ['admin'] }
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior() {
    return { top: 0 }
  }
})

const publicPaths = ['/login', '/register']

router.beforeEach((to, from, next) => {
  document.title = to.meta.title ? `${to.meta.title} - 宠伴` : '宠伴'

  const token = storage.get(STORAGE_KEYS.TOKEN)

  if (publicPaths.includes(to.path) && token) {
    next('/home')
    return
  }

  if (to.meta.requiresAuth === false) {
    next()
    return
  }

  if (to.meta.requiresAuth && !token) {
    next('/login')
    return
  }

  if (to.meta.roles) {
    const userInfo = storage.get(STORAGE_KEYS.USER_INFO)
    if (!to.meta.roles.includes(userInfo?.role)) {
      next('/home')
      return
    }
  }

  next()
})

export default router
