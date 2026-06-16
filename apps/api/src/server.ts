import { createServer } from 'http';
import { Server as SocketServer } from 'socket.io';
import jwt from 'jsonwebtoken';
import { createApp } from './app.js';
import { config } from './config/index.js';
import { logger } from './config/logger.js';
import { prisma } from './config/database.js';
import { closeRedis } from './config/redis.js';
import { startEmailScheduler, stopEmailScheduler } from './services/email/emailScheduler.service.js';
import './services/email/emailNotification.service.js';

const app = createApp();
const httpServer = createServer(app);

const io = new SocketServer(httpServer, {
  cors: { origin: config.CORS_ORIGIN, credentials: true },
  path: '/ws',
});

io.use((socket, next) => {
  const token = socket.handshake.auth.token as string;
  if (!token) return next(new Error('Authentication required'));

  try {
    const payload = jwt.verify(token, config.JWT_SECRET) as { sub: string };
    socket.data.userId = payload.sub;
    next();
  } catch {
    next(new Error('Invalid token'));
  }
});

io.on('connection', (socket) => {
  const userId = socket.data.userId as string;
  socket.join(`user:${userId}`);
  logger.debug(`WebSocket connected: ${userId}`);

  socket.on('presence:update', (data: { status: string }) => {
    socket.broadcast.emit('presence:update', { userId, status: data.status });
  });

  socket.on('disconnect', () => {
    logger.debug(`WebSocket disconnected: ${userId}`);
  });
});

export { io };

async function main() {
  startEmailScheduler();
  httpServer.listen(config.PORT, () => {
    logger.info(`Htask API running on port ${config.PORT}`);
    logger.info(`Swagger docs: http://localhost:${config.PORT}/api/docs`);
  });
}

async function shutdown() {
  logger.info('Shutting down...');
  stopEmailScheduler();
  httpServer.close();
  await prisma.$disconnect();
  await closeRedis();
  process.exit(0);
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

main().catch((err) => {
  logger.error('Failed to start server', { error: err });
  process.exit(1);
});
