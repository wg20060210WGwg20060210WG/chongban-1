# 宠伴 - 宠物社区平台

一个面向宠物主人的综合性社区平台，提供宠物管理、社区互动、领养服务、二手交易和服务预约等功能。

## 功能特性

- **用户系统** - 注册、登录、个人资料管理
- **宠物管理** - 宠物档案、健康记录、健康提醒
- **社区互动** - 发帖、评论、点赞、收藏
- **领养服务** - 发布领养信息、申请领养、领养管理
- **二手交易** - 宠物用品交易、订单管理
- **服务预约** - 宠物服务发布、预约、订单管理
- **AI 助手** - AI 宠物医生、智能问诊
- **管理后台** - 用户管理、内容审核、数据统计

## 技术栈

### 前端
- Vue 3 + Vite
- Naive UI 组件库
- Pinia 状态管理
- Vue Router 路由
- Socket.io-client 实时通信
- Echarts 数据可视化

### 后端
- Node.js + Express
- MongoDB + Mongoose
- JWT 身份认证
- Socket.io 实时通信
- Multer 文件上传

## 项目结构

```
chongban-1/
├── client/              # 前端项目
│   ├── src/
│   │   ├── api/         # API 接口
│   │   ├── assets/      # 静态资源
│   │   ├── components/  # 公共组件
│   │   ├── router/      # 路由配置
│   │   ├── stores/      # Pinia 状态管理
│   │   ├── utils/       # 工具函数
│   │   └── views/       # 页面视图
│   └── ...
├── server/              # 后端项目
│   ├── src/
│   │   ├── config/      # 配置文件
│   │   ├── controllers/ # 控制器
│   │   ├── middleware/  # 中间件
│   │   ├── models/      # 数据模型
│   │   ├── routes/      # 路由定义
│   │   ├── services/    # 业务服务
│   │   ├── sockets/     # WebSocket 处理
│   │   └── utils/       # 工具函数
│   └── ...
└── ...
```

## 快速开始

### 环境要求
- Node.js >= 20.19.0
- MongoDB

### 安装与运行

**1. 克隆项目**
```bash
git clone https://github.com/wg20060210WGwg20060210WG/chongban-1.git
cd chongban-1
```

**2. 启动后端**
```bash
cd server
npm install
# 配置 .env 文件
npm run dev
```

**3. 启动前端**
```bash
cd client
npm install
npm run dev
```

### 环境变量配置

在 `server/src/` 目录下创建 `.env` 文件：

```env
PORT=3000
MONGO_URL=mongodb://localhost:27017/chongban
NODE_ENV=development
JWT_SECRET=your_jwt_secret
MIMO_API_KEY=your_api_key
MIMO_API_URL=your_api_url
MIMO_MODEL=your_model
```

## 许可证

ISC