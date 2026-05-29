import './env.js';
import app from './app.js';
import connectDB from './config/db.js';
import mongoose from 'mongoose';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import setupNotificationSocket from './sockets/notification.js';

const PORT=process.env.PORT || 3000;

// 启动服务器的异步函数
const startServer = async () => {
  // 先连接数据库
  await connectDB();

  // 创建 HTTP 服务器并集成 Socket.IO
  const server = http.createServer(app);
  
  const io = new SocketIOServer(server, {
    cors: {
      origin: process.env.CLIENT_URL || '*',
      methods: ['GET', 'POST']
    }
  });
  
  global.notificationSocket = setupNotificationSocket(io);

  // 启动服务器
  server.listen(PORT, () => {
    console.log(`🚀 宠伴后端服务启动成功`);
    console.log(`📍 服务地址: http://localhost:${PORT}`);
    console.log(`🌍 环境: ${process.env.NODE_ENV || 'development'}`);
    console.log(`⏰ 启动时间: ${new Date().toLocaleString()}`);
  })

  //优雅关闭服务器处理
  const gracefulShutdown=async ()=>{
    console.log('🛑 收到关闭信号，正在优雅关闭服务器...');

    // 关闭数据库连接
    await mongoose.connection.close();
    console.log('🔌 数据库连接已关闭');

    server.close((err)=>{
      if(err){
        console.error('关闭服务器时出错:',err);
        process.exit(1);
      }

      console.log('✅ 服务器已成功关闭');
      process.exit(0);
    })

    setTimeout(()=>{
      console.log('❌ 强制关闭服务器');
      process.exit(1);
    },10000)
  }

  //监听进程关闭信号
  process.on('SIGTERM',gracefulShutdown);
  process.on('SIGINT',gracefulShutdown);

  return server;
}

//未捕获异常处理
process.on('uncaughtException',(error)=>{
  console.error('未捕获的异常:',error);
  process.exit(1);
});

//未处理的Promise拒绝处理
process.on('unhandledRejection',(reason,promise)=>{
  console.error('未处理的Promise拒绝:',reason);
  process.exit(1);
});

// 启动服务器
startServer();