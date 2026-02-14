import { createServer } from 'http';
import { Server } from 'socket.io';
import { RoomManager } from './RoomManager';
import { ConnectionManager } from './ConnectionManager';
import { PORT, CORS_ORIGIN, CLEANUP_INTERVAL_MS } from './config';

const httpServer = createServer();

const io = new Server(httpServer, {
  cors: {
    origin: CORS_ORIGIN,
    methods: ['GET', 'POST'],
  },
});

const roomManager = new RoomManager();
const connectionManager = new ConnectionManager(io, roomManager);
connectionManager.setupListeners();

// 期限切れ部屋の定期クリーンアップ
setInterval(() => {
  const deleted = roomManager.cleanupExpiredRooms();
  if (deleted > 0) {
    console.log(`Cleaned up ${deleted} expired room(s)`);
  }
}, CLEANUP_INTERVAL_MS);

httpServer.listen(PORT, () => {
  console.log(`Monster Battle Server running on port ${PORT}`);
});
