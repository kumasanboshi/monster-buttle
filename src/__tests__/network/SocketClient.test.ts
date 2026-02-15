/**
 * SocketClient テスト
 *
 * socket.io-clientをモックし、SocketClientのイベント連携をテストする。
 */

import { RoomInfo, RoomStatus } from '../../../shared/types/RoomTypes';
import { ErrorCode } from '../../../shared/types/SocketEvents';

// --- socket.io-client モック ---
const mockOn = jest.fn();
const mockEmit = jest.fn();
const mockDisconnect = jest.fn();
const mockConnected = { value: false };

const mockSocket = {
  on: mockOn,
  emit: mockEmit,
  disconnect: mockDisconnect,
  get connected() {
    return mockConnected.value;
  },
};

jest.mock('socket.io-client', () => ({
  io: jest.fn(() => mockSocket),
}));

import { io } from 'socket.io-client';
import { SocketClient, SocketClientCallbacks } from '../../network/SocketClient';

// テスト用ヘルパー: mockOnに登録されたハンドラを取得
function getHandler(eventName: string): (...args: unknown[]) => void {
  const call = mockOn.mock.calls.find(([name]: [string]) => name === eventName);
  if (!call) throw new Error(`Handler for '${eventName}' not found`);
  return call[1];
}

// テスト用のRoomInfo
function createTestRoomInfo(overrides: Partial<RoomInfo> = {}): RoomInfo {
  return {
    roomId: 'ABC123',
    status: RoomStatus.WAITING,
    hasPassword: false,
    host: {
      socketId: 'host-socket-id',
      playerNumber: 1,
      selectedMonsterId: null,
      isConnected: true,
    },
    guest: null,
    createdAt: Date.now(),
    ...overrides,
  };
}

describe('SocketClient', () => {
  let client: SocketClient;
  let callbacks: Required<SocketClientCallbacks>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockConnected.value = false;
    callbacks = {
      onConnect: jest.fn(),
      onDisconnect: jest.fn(),
      onRoomCreated: jest.fn(),
      onRoomJoined: jest.fn(),
      onOpponentJoined: jest.fn(),
      onOpponentLeft: jest.fn(),
      onError: jest.fn(),
    };
    client = new SocketClient();
  });

  describe('connect', () => {
    it('socket.io-clientのioを呼びサーバーに接続すること', () => {
      client.connect('http://localhost:3001', callbacks);

      expect(io).toHaveBeenCalledWith('http://localhost:3001', {
        transports: ['websocket'],
      });
    });

    it('サーバーイベントのリスナーを登録すること', () => {
      client.connect('http://localhost:3001', callbacks);

      const registeredEvents = mockOn.mock.calls.map(([name]: [string]) => name);
      expect(registeredEvents).toContain('connect');
      expect(registeredEvents).toContain('disconnect');
      expect(registeredEvents).toContain('room:created');
      expect(registeredEvents).toContain('room:joined');
      expect(registeredEvents).toContain('room:opponent_joined');
      expect(registeredEvents).toContain('room:opponent_left');
      expect(registeredEvents).toContain('error');
    });

    it('connectイベントでonConnectコールバックを呼ぶこと', () => {
      client.connect('http://localhost:3001', callbacks);
      const handler = getHandler('connect');
      handler();

      expect(callbacks.onConnect).toHaveBeenCalled();
    });

    it('disconnectイベントでonDisconnectコールバックを呼ぶこと', () => {
      client.connect('http://localhost:3001', callbacks);
      const handler = getHandler('disconnect');
      handler('io server disconnect');

      expect(callbacks.onDisconnect).toHaveBeenCalledWith('io server disconnect');
    });
  });

  describe('disconnect', () => {
    it('接続中にdisconnectを呼ぶとソケットを切断すること', () => {
      client.connect('http://localhost:3001', callbacks);
      client.disconnect();

      expect(mockDisconnect).toHaveBeenCalled();
    });

    it('未接続でdisconnectを呼んでもエラーにならないこと', () => {
      expect(() => client.disconnect()).not.toThrow();
    });
  });

  describe('isConnected', () => {
    it('未接続時はfalseを返すこと', () => {
      expect(client.isConnected()).toBe(false);
    });

    it('接続中はsocket.connectedの値を返すこと', () => {
      client.connect('http://localhost:3001', callbacks);
      mockConnected.value = true;

      expect(client.isConnected()).toBe(true);
    });
  });

  describe('createRoom', () => {
    beforeEach(() => {
      client.connect('http://localhost:3001', callbacks);
    });

    it('room:createイベントをemitすること（パスワードなし）', () => {
      client.createRoom();

      expect(mockEmit).toHaveBeenCalledWith('room:create', {});
    });

    it('room:createイベントをemitすること（パスワードあり）', () => {
      client.createRoom('secret123');

      expect(mockEmit).toHaveBeenCalledWith('room:create', { password: 'secret123' });
    });

    it('room:createdイベントでonRoomCreatedコールバックを呼ぶこと', () => {
      const roomInfo = createTestRoomInfo();

      const handler = getHandler('room:created');
      handler({ roomId: 'ABC123', roomInfo });

      expect(callbacks.onRoomCreated).toHaveBeenCalledWith('ABC123', roomInfo);
    });

    it('未接続でcreateRoomを呼んでもエラーにならないこと', () => {
      const newClient = new SocketClient();
      expect(() => newClient.createRoom()).not.toThrow();
    });
  });

  describe('joinRoom', () => {
    beforeEach(() => {
      client.connect('http://localhost:3001', callbacks);
    });

    it('room:joinイベントをemitすること（パスワードなし）', () => {
      client.joinRoom('ABC123');

      expect(mockEmit).toHaveBeenCalledWith('room:join', { roomId: 'ABC123' });
    });

    it('room:joinイベントをemitすること（パスワードあり）', () => {
      client.joinRoom('ABC123', 'secret123');

      expect(mockEmit).toHaveBeenCalledWith('room:join', {
        roomId: 'ABC123',
        password: 'secret123',
      });
    });

    it('room:joinedイベントでonRoomJoinedコールバックを呼ぶこと', () => {
      const roomInfo = createTestRoomInfo();

      const handler = getHandler('room:joined');
      handler({ roomInfo, playerNumber: 2 });

      expect(callbacks.onRoomJoined).toHaveBeenCalledWith(roomInfo, 2);
    });

    it('未接続でjoinRoomを呼んでもエラーにならないこと', () => {
      const newClient = new SocketClient();
      expect(() => newClient.joinRoom('ABC123')).not.toThrow();
    });
  });

  describe('leaveRoom', () => {
    beforeEach(() => {
      client.connect('http://localhost:3001', callbacks);
    });

    it('room:leaveイベントをemitすること', () => {
      client.leaveRoom();

      expect(mockEmit).toHaveBeenCalledWith('room:leave');
    });

    it('未接続でleaveRoomを呼んでもエラーにならないこと', () => {
      const newClient = new SocketClient();
      expect(() => newClient.leaveRoom()).not.toThrow();
    });
  });

  describe('相手プレイヤーのイベント', () => {
    beforeEach(() => {
      client.connect('http://localhost:3001', callbacks);
    });

    it('room:opponent_joinedイベントでonOpponentJoinedコールバックを呼ぶこと', () => {
      const roomInfo = createTestRoomInfo({
        guest: {
          socketId: 'guest-socket-id',
          playerNumber: 2,
          selectedMonsterId: null,
          isConnected: true,
        },
      });

      const handler = getHandler('room:opponent_joined');
      handler({ roomInfo });

      expect(callbacks.onOpponentJoined).toHaveBeenCalledWith(roomInfo);
    });

    it('room:opponent_leftイベントでonOpponentLeftコールバックを呼ぶこと', () => {
      const roomInfo = createTestRoomInfo();

      const handler = getHandler('room:opponent_left');
      handler({ roomInfo });

      expect(callbacks.onOpponentLeft).toHaveBeenCalledWith(roomInfo);
    });
  });

  describe('エラーハンドリング', () => {
    beforeEach(() => {
      client.connect('http://localhost:3001', callbacks);
    });

    it('errorイベントでonErrorコールバックを呼ぶこと', () => {
      const handler = getHandler('error');
      handler({ code: ErrorCode.ROOM_NOT_FOUND, message: '部屋が見つかりません' });

      expect(callbacks.onError).toHaveBeenCalledWith(
        ErrorCode.ROOM_NOT_FOUND,
        '部屋が見つかりません'
      );
    });

    it('全ErrorCodeが正しくコールバックに渡されること', () => {
      const handler = getHandler('error');

      handler({ code: ErrorCode.ROOM_FULL, message: '部屋が満員です' });
      expect(callbacks.onError).toHaveBeenCalledWith(ErrorCode.ROOM_FULL, '部屋が満員です');

      handler({ code: ErrorCode.WRONG_PASSWORD, message: 'パスワードが違います' });
      expect(callbacks.onError).toHaveBeenCalledWith(
        ErrorCode.WRONG_PASSWORD,
        'パスワードが違います'
      );
    });
  });
});
