import { Server as SocketIOServer } from 'socket.io';
import { Server as HttpServer } from 'http';
import session from 'express-session';
import connectPgSimple from 'connect-pg-simple';
import { authenticateSocket } from './auth';
import { registerMessageHandlers } from './handlers/messages';

const PgStore = connectPgSimple(session);

export function setupSocketIO(server: HttpServer, sessionMiddleware: any) {
  const io = new SocketIOServer(server, {
    cors: {
      origin: process.env.NODE_ENV === 'production'
        ? process.env.FRONTEND_URL || false
        : ['http://localhost:3000', 'http://localhost:5000'],
      credentials: true,
    },
    path: '/socket.io',
  });

  // Wrap Express session middleware for Socket.IO
  io.engine.use(sessionMiddleware);

  // Authentication middleware
  io.use(authenticateSocket);

  // Handle new connections
  io.on('connection', (socket) => {
    const userId = socket.data.userId;
    console.log(`[Socket.IO] User connected: ${userId}`);

    // Join user to their personal room for receiving messages
    socket.join(`user:${userId}`);

    // Register message handlers
    registerMessageHandlers(io, socket);

    // Handle user online status
    io.emit('user:online', { userId });

    socket.on('disconnect', () => {
      console.log(`[Socket.IO] User disconnected: ${userId}`);
      io.emit('user:offline', { userId });
    });
  });

  console.log('✅ Socket.IO server initialized');
  return io;
}
