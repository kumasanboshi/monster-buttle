import { createServer } from 'http';
import { Server } from 'socket.io';
import { io as ioc, Socket as ClientSocket } from 'socket.io-client';
import { ConnectionManager } from '../src/ConnectionManager';
import { RoomManager } from '../src/RoomManager';
import { ClientEvents, ServerEvents, ErrorCode } from '../../shared/types/SocketEvents';
import { RoomStatus } from '../../shared/types/RoomTypes';
import type { AddressInfo } from 'net';

describe('ConnectionManager', () => {
  let httpServer: ReturnType<typeof createServer>;
  let ioServer: Server;
  let roomManager: RoomManager;
  let connectionManager: ConnectionManager;
  let port: number;

  beforeAll((done) => {
    httpServer = createServer();
    ioServer = new Server(httpServer, { cors: { origin: '*' } });
    roomManager = new RoomManager();
    connectionManager = new ConnectionManager(ioServer, roomManager);
    connectionManager.setupListeners();
    httpServer.listen(() => {
      port = (httpServer.address() as AddressInfo).port;
      done();
    });
  });

  afterAll((done) => {
    ioServer.close();
    httpServer.close(done);
  });

  beforeEach(() => {
    // RoomManagerをリセット（各テスト間の独立性を確保）
    roomManager = new RoomManager();
    connectionManager.setRoomManager(roomManager);
  });

  function createClient(): ClientSocket {
    return ioc(`http://localhost:${port}`, {
      transports: ['websocket'],
      forceNew: true,
    });
  }

  function waitForEvent<T>(socket: ClientSocket, event: string): Promise<T> {
    return new Promise((resolve) => {
      socket.once(event, (data: T) => resolve(data));
    });
  }

  function connectClient(): Promise<ClientSocket> {
    return new Promise((resolve) => {
      const client = createClient();
      client.on('connect', () => resolve(client));
    });
  }

  afterEach((done) => {
    // すべてのクライアントを切断
    const sockets = ioServer.sockets.sockets;
    for (const [, socket] of sockets) {
      socket.disconnect(true);
    }
    // 少し待ってからdone
    setTimeout(done, 50);
  });

  describe('接続管理', () => {
    it('クライアントが接続できる', async () => {
      const client = await connectClient();
      expect(client.connected).toBe(true);
      client.disconnect();
    });
  });

  describe('room:create', () => {
    it('部屋を作成してroom:createdイベントを受信する', async () => {
      const client = await connectClient();
      const promise = waitForEvent<any>(client, ServerEvents.ROOM_CREATED);
      client.emit(ClientEvents.ROOM_CREATE, {});
      const data = await promise;

      expect(data.roomId).toBeDefined();
      expect(data.roomInfo).toBeDefined();
      expect(data.roomInfo.status).toBe(RoomStatus.WAITING);
      client.disconnect();
    });

    it('パスワード付きで部屋を作成できる', async () => {
      const client = await connectClient();
      const promise = waitForEvent<any>(client, ServerEvents.ROOM_CREATED);
      client.emit(ClientEvents.ROOM_CREATE, { password: 'secret' });
      const data = await promise;

      expect(data.roomInfo.hasPassword).toBe(true);
      client.disconnect();
    });

    it('Socket.ioルームに参加する', async () => {
      const client = await connectClient();
      const promise = waitForEvent<any>(client, ServerEvents.ROOM_CREATED);
      client.emit(ClientEvents.ROOM_CREATE, {});
      const data = await promise;

      // サーバー側でSocket.ioルームに参加しているか確認
      const rooms = ioServer.sockets.adapter.rooms.get(data.roomId);
      expect(rooms).toBeDefined();
      expect(rooms!.size).toBe(1);
      client.disconnect();
    });
  });

  describe('room:join', () => {
    it('部屋に参加してroom:joinedイベントを受信する', async () => {
      const host = await connectClient();
      const createdPromise = waitForEvent<any>(host, ServerEvents.ROOM_CREATED);
      host.emit(ClientEvents.ROOM_CREATE, {});
      const created = await createdPromise;

      const guest = await connectClient();
      const joinedPromise = waitForEvent<any>(guest, ServerEvents.ROOM_JOINED);
      guest.emit(ClientEvents.ROOM_JOIN, { roomId: created.roomId });
      const joined = await joinedPromise;

      expect(joined.roomInfo).toBeDefined();
      expect(joined.playerNumber).toBe(2);
      expect(joined.roomInfo.status).toBe(RoomStatus.PLAYING);

      host.disconnect();
      guest.disconnect();
    });

    it('ホストにroom:opponent_joinedが通知される', async () => {
      const host = await connectClient();
      const createdPromise = waitForEvent<any>(host, ServerEvents.ROOM_CREATED);
      host.emit(ClientEvents.ROOM_CREATE, {});
      const created = await createdPromise;

      const opponentJoinedPromise = waitForEvent<any>(host, ServerEvents.ROOM_OPPONENT_JOINED);
      const guest = await connectClient();
      guest.emit(ClientEvents.ROOM_JOIN, { roomId: created.roomId });
      const opponentData = await opponentJoinedPromise;

      expect(opponentData.roomInfo).toBeDefined();
      expect(opponentData.roomInfo.guest).not.toBeNull();

      host.disconnect();
      guest.disconnect();
    });

    it('存在しない部屋に参加するとエラーを受信する', async () => {
      const client = await connectClient();
      const errorPromise = waitForEvent<any>(client, ServerEvents.ERROR);
      client.emit(ClientEvents.ROOM_JOIN, { roomId: 'nonexistent' });
      const error = await errorPromise;

      expect(error.code).toBe(ErrorCode.ROOM_NOT_FOUND);
      client.disconnect();
    });

    it('パスワードが間違っているとエラーを受信する', async () => {
      const host = await connectClient();
      const createdPromise = waitForEvent<any>(host, ServerEvents.ROOM_CREATED);
      host.emit(ClientEvents.ROOM_CREATE, { password: 'correct' });
      const created = await createdPromise;

      const guest = await connectClient();
      const errorPromise = waitForEvent<any>(guest, ServerEvents.ERROR);
      guest.emit(ClientEvents.ROOM_JOIN, { roomId: created.roomId, password: 'wrong' });
      const error = await errorPromise;

      expect(error.code).toBe(ErrorCode.WRONG_PASSWORD);

      host.disconnect();
      guest.disconnect();
    });
  });

  describe('room:leave', () => {
    it('ゲスト退出時にホストにroom:opponent_leftが通知される', async () => {
      const host = await connectClient();
      const createdPromise = waitForEvent<any>(host, ServerEvents.ROOM_CREATED);
      host.emit(ClientEvents.ROOM_CREATE, {});
      const created = await createdPromise;

      const guest = await connectClient();
      const joinedPromise = waitForEvent<any>(guest, ServerEvents.ROOM_JOINED);
      // ホスト側のopponent_joined待ち
      const opponentJoinedPromise = waitForEvent<any>(host, ServerEvents.ROOM_OPPONENT_JOINED);
      guest.emit(ClientEvents.ROOM_JOIN, { roomId: created.roomId });
      await joinedPromise;
      await opponentJoinedPromise;

      const opponentLeftPromise = waitForEvent<any>(host, ServerEvents.ROOM_OPPONENT_LEFT);
      guest.emit(ClientEvents.ROOM_LEAVE);
      const leftData = await opponentLeftPromise;

      expect(leftData.roomInfo).toBeDefined();
      expect(leftData.roomInfo.guest).toBeNull();
      expect(leftData.roomInfo.status).toBe(RoomStatus.WAITING);

      host.disconnect();
      guest.disconnect();
    });
  });

  describe('disconnect', () => {
    it('ゲストが切断するとホストにroom:opponent_leftが通知される', async () => {
      const host = await connectClient();
      const createdPromise = waitForEvent<any>(host, ServerEvents.ROOM_CREATED);
      host.emit(ClientEvents.ROOM_CREATE, {});
      const created = await createdPromise;

      const guest = await connectClient();
      const joinedPromise = waitForEvent<any>(guest, ServerEvents.ROOM_JOINED);
      const opponentJoinedPromise = waitForEvent<any>(host, ServerEvents.ROOM_OPPONENT_JOINED);
      guest.emit(ClientEvents.ROOM_JOIN, { roomId: created.roomId });
      await joinedPromise;
      await opponentJoinedPromise;

      const opponentLeftPromise = waitForEvent<any>(host, ServerEvents.ROOM_OPPONENT_LEFT);
      guest.disconnect();
      const leftData = await opponentLeftPromise;

      expect(leftData.roomInfo).toBeDefined();
      expect(leftData.roomInfo.guest).toBeNull();

      host.disconnect();
    });

    it('ホストが切断すると部屋が削除される', async () => {
      const host = await connectClient();
      const createdPromise = waitForEvent<any>(host, ServerEvents.ROOM_CREATED);
      host.emit(ClientEvents.ROOM_CREATE, {});
      const created = await createdPromise;

      host.disconnect();
      // 少し待って部屋が削除されることを確認
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(roomManager.getRoom(created.roomId)).toBeNull();
    });
  });

  describe('room:info', () => {
    it('部屋情報を取得できる', async () => {
      const host = await connectClient();
      const createdPromise = waitForEvent<any>(host, ServerEvents.ROOM_CREATED);
      host.emit(ClientEvents.ROOM_CREATE, {});
      const created = await createdPromise;

      const client = await connectClient();
      const infoPromise = waitForEvent<any>(client, ServerEvents.ROOM_INFO);
      client.emit(ClientEvents.ROOM_INFO, { roomId: created.roomId });
      const info = await infoPromise;

      expect(info.roomId).toBe(created.roomId);
      expect(info.status).toBe(RoomStatus.WAITING);

      host.disconnect();
      client.disconnect();
    });
  });
});
