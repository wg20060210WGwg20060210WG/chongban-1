import jwt from 'jsonwebtoken';

const userSockets = new Map();

const verifyToken = (token) => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded;
  } catch (error) {
    return null;
  }
};

export default (io) => {
  io.on('connection', (socket) => {
    console.log('客户端连接:', socket.id);

    socket.on('authenticate', ({ token }) => {
      if (!token) {
        socket.emit('auth_error', { message: '未提供认证令牌' });
        socket.disconnect(true);
        return;
      }

      const decoded = verifyToken(token);
      if (!decoded) {
        socket.emit('auth_error', { message: '无效的认证令牌' });
        socket.disconnect(true);
        return;
        
      }

      const userId = decoded.userId;
      socket.userId = userId;
      socket.join(`user_${userId}`);
      userSockets.set(userId.toString(), socket.id);
      socket.emit('authenticated', { userId });
      console.log(`用户 ${userId} 已认证 (WebSocket)`);
    });

    socket.on('disconnect', () => {
      if (socket.userId) {
        userSockets.delete(socket.userId.toString());
        console.log(`用户 ${socket.userId} 断开连接 (WebSocket)`);
      }
    });
  });

  return {
    emitToUser(userId, event, data) {
      const targetUserId = typeof userId === 'string' ? userId : userId.toString();
      io.to(`user_${targetUserId}`).emit(event, data);
    },

    emitToUsers(userIds, event, data) {
      userIds.forEach(userId => {
        const targetUserId = typeof userId === 'string' ? userId : userId.toString();
        io.to(`user_${targetUserId}`).emit(event, data);
      });
    },

    isUserOnline(userId) {
      return userSockets.has(userId.toString());
    }
  };
};