import mongoose from 'mongoose';
import 'dotenv/config';

const MONGO_URL = process.env.MONGO_URL || 'mongodb://localhost:27017/chongban-1';

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(MONGO_URL, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000
    });

    console.log(`✅ MongoDB连接成功: ${conn.connection.host}`);
    console.log(`📦 数据库名称: ${conn.connection.name}`);

    await cleanupPhoneField(conn.connection.db);

    return conn;
  } catch (error) {
    console.error('❌ MongoDB连接失败:', error.message);
    process.exit(1);
  }
};

async function cleanupPhoneField(db) {
  try {
    const users = db.collection('users');
    const result = await users.updateMany(
      { phone: '' },
      { $unset: { phone: '' } }
    );
    if (result.modifiedCount > 0) {
      console.log(`🧹 已清理 ${result.modifiedCount} 个用户的空手机号字段`);
    }
    try {
      await users.dropIndex('phone_1');
      console.log('🔄 已删除旧的 phone 索引，Mongoose 将自动重建');
    } catch (e) {
      if (e.codeName !== 'IndexNotFound') {
        console.warn('索引清理提示:', e.message);
      }
    }
  } catch (error) {
    console.warn('⚠️  手机号字段清理跳过:', error.message);
  }
}

// 数据库连接事件监听
mongoose.connection.on('disconnected', () => {
  console.log('⚠️  MongoDB连接已断开');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ MongoDB连接错误:', err);
});

mongoose.connection.on('reconnected', () => {
  console.log('🔄 MongoDB重新连接成功');
});

export default connectDB;
