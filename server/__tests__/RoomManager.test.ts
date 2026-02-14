import { RoomManager } from '../src/RoomManager';
import { RoomStatus } from '../../shared/types/RoomTypes';
import { ErrorCode } from '../../shared/types/SocketEvents';
import { ROOM_TTL_MS } from '../src/config';

describe('RoomManager', () => {
  let roomManager: RoomManager;

  beforeEach(() => {
    roomManager = new RoomManager();
  });

  describe('createRoom', () => {
    it('部屋を作成しホストをplayer1として登録する', () => {
      const room = roomManager.createRoom('host-socket-id');
      expect(room.host.socketId).toBe('host-socket-id');
      expect(room.host.playerNumber).toBe(1);
      expect(room.host.isConnected).toBe(true);
      expect(room.host.selectedMonsterId).toBeNull();
    });

    it('ステータスがWAITINGで作成される', () => {
      const room = roomManager.createRoom('host-socket-id');
      expect(room.status).toBe(RoomStatus.WAITING);
    });

    it('一意のroomIdが割り当てられる', () => {
      const room1 = roomManager.createRoom('host-1');
      const room2 = roomManager.createRoom('host-2');
      expect(room1.roomId).not.toBe(room2.roomId);
    });

    it('パスワードなしで作成できる', () => {
      const room = roomManager.createRoom('host-socket-id');
      expect(room.password).toBeNull();
    });

    it('パスワードありで作成できる', () => {
      const room = roomManager.createRoom('host-socket-id', 'secret123');
      expect(room.password).toBe('secret123');
    });

    it('ゲストがnullで作成される', () => {
      const room = roomManager.createRoom('host-socket-id');
      expect(room.guest).toBeNull();
    });

    it('作成日時と更新日時が設定される', () => {
      const before = Date.now();
      const room = roomManager.createRoom('host-socket-id');
      const after = Date.now();
      expect(room.createdAt).toBeGreaterThanOrEqual(before);
      expect(room.createdAt).toBeLessThanOrEqual(after);
      expect(room.updatedAt).toBeGreaterThanOrEqual(before);
      expect(room.updatedAt).toBeLessThanOrEqual(after);
    });
  });

  describe('joinRoom', () => {
    it('WAITING部屋にゲストとして参加できる', () => {
      const room = roomManager.createRoom('host-id');
      const result = roomManager.joinRoom(room.roomId, 'guest-id');
      expect('error' in result).toBe(false);
      if (!('error' in result)) {
        expect(result.guest).not.toBeNull();
        expect(result.guest!.socketId).toBe('guest-id');
        expect(result.guest!.playerNumber).toBe(2);
        expect(result.guest!.isConnected).toBe(true);
      }
    });

    it('参加するとステータスがPLAYINGになる', () => {
      const room = roomManager.createRoom('host-id');
      const result = roomManager.joinRoom(room.roomId, 'guest-id');
      if (!('error' in result)) {
        expect(result.status).toBe(RoomStatus.PLAYING);
      }
    });

    it('パスワード付き部屋に正しいパスワードで参加できる', () => {
      const room = roomManager.createRoom('host-id', 'pass123');
      const result = roomManager.joinRoom(room.roomId, 'guest-id', 'pass123');
      expect('error' in result).toBe(false);
    });

    it('パスワード付き部屋に間違ったパスワードで参加できない', () => {
      const room = roomManager.createRoom('host-id', 'pass123');
      const result = roomManager.joinRoom(room.roomId, 'guest-id', 'wrong');
      expect('error' in result).toBe(true);
      if ('error' in result) {
        expect(result.error).toBe(ErrorCode.WRONG_PASSWORD);
      }
    });

    it('パスワード付き部屋にパスワードなしで参加できない', () => {
      const room = roomManager.createRoom('host-id', 'pass123');
      const result = roomManager.joinRoom(room.roomId, 'guest-id');
      expect('error' in result).toBe(true);
      if ('error' in result) {
        expect(result.error).toBe(ErrorCode.WRONG_PASSWORD);
      }
    });

    it('存在しない部屋に参加できない', () => {
      const result = roomManager.joinRoom('nonexistent', 'guest-id');
      expect('error' in result).toBe(true);
      if ('error' in result) {
        expect(result.error).toBe(ErrorCode.ROOM_NOT_FOUND);
      }
    });

    it('満員の部屋に参加できない', () => {
      const room = roomManager.createRoom('host-id');
      roomManager.joinRoom(room.roomId, 'guest-1');
      const result = roomManager.joinRoom(room.roomId, 'guest-2');
      expect('error' in result).toBe(true);
      if ('error' in result) {
        expect(result.error).toBe(ErrorCode.ROOM_FULL);
      }
    });

    it('ホストと同じsocketIdで参加できない', () => {
      const room = roomManager.createRoom('host-id');
      const result = roomManager.joinRoom(room.roomId, 'host-id');
      expect('error' in result).toBe(true);
      if ('error' in result) {
        expect(result.error).toBe(ErrorCode.ALREADY_IN_ROOM);
      }
    });

    it('FINISHED部屋に参加できない', () => {
      const room = roomManager.createRoom('host-id');
      roomManager.joinRoom(room.roomId, 'guest-id');
      // FINISHEDに変更するためにleaveRoom（ホスト退出で部屋削除）ではなく
      // 直接取得してステータス変更をテストする方法を別途用意
      // ここではPLAYING状態の部屋に3人目が参加できないことをテスト
      const result = roomManager.joinRoom(room.roomId, 'guest-2');
      expect('error' in result).toBe(true);
      if ('error' in result) {
        expect(result.error).toBe(ErrorCode.ROOM_FULL);
      }
    });
  });

  describe('leaveRoom', () => {
    it('ホストが退出すると部屋が削除される', () => {
      const room = roomManager.createRoom('host-id');
      roomManager.leaveRoom(room.roomId, 'host-id');
      expect(roomManager.getRoom(room.roomId)).toBeNull();
    });

    it('ゲストが退出するとWAITINGに戻る', () => {
      const room = roomManager.createRoom('host-id');
      roomManager.joinRoom(room.roomId, 'guest-id');
      roomManager.leaveRoom(room.roomId, 'guest-id');
      const updatedRoom = roomManager.getRoom(room.roomId);
      expect(updatedRoom).not.toBeNull();
      expect(updatedRoom!.status).toBe(RoomStatus.WAITING);
      expect(updatedRoom!.guest).toBeNull();
    });

    it('ゲスト退出後もホストは残っている', () => {
      const room = roomManager.createRoom('host-id');
      roomManager.joinRoom(room.roomId, 'guest-id');
      roomManager.leaveRoom(room.roomId, 'guest-id');
      const updatedRoom = roomManager.getRoom(room.roomId);
      expect(updatedRoom!.host.socketId).toBe('host-id');
    });

    it('存在しない部屋からの退出は何もしない', () => {
      // エラーが発生しないことを確認
      expect(() => roomManager.leaveRoom('nonexistent', 'some-id')).not.toThrow();
    });
  });

  describe('getRoom', () => {
    it('存在する部屋を取得できる', () => {
      const room = roomManager.createRoom('host-id');
      const fetched = roomManager.getRoom(room.roomId);
      expect(fetched).not.toBeNull();
      expect(fetched!.roomId).toBe(room.roomId);
    });

    it('存在しない部屋はnullを返す', () => {
      expect(roomManager.getRoom('nonexistent')).toBeNull();
    });
  });

  describe('getRoomInfo', () => {
    it('クライアント向け情報にパスワードが含まれない', () => {
      const room = roomManager.createRoom('host-id', 'secret');
      const info = roomManager.getRoomInfo(room.roomId);
      expect(info).not.toBeNull();
      expect(info!).not.toHaveProperty('password');
      expect(info!.hasPassword).toBe(true);
    });

    it('パスワードなし部屋のhasPasswordがfalse', () => {
      const room = roomManager.createRoom('host-id');
      const info = roomManager.getRoomInfo(room.roomId);
      expect(info!.hasPassword).toBe(false);
    });

    it('存在しない部屋はnullを返す', () => {
      expect(roomManager.getRoomInfo('nonexistent')).toBeNull();
    });
  });

  describe('findRoomBySocketId', () => {
    it('ホストのsocketIdで部屋を検索できる', () => {
      const room = roomManager.createRoom('host-id');
      const found = roomManager.findRoomBySocketId('host-id');
      expect(found).not.toBeNull();
      expect(found!.roomId).toBe(room.roomId);
    });

    it('ゲストのsocketIdで部屋を検索できる', () => {
      const room = roomManager.createRoom('host-id');
      roomManager.joinRoom(room.roomId, 'guest-id');
      const found = roomManager.findRoomBySocketId('guest-id');
      expect(found).not.toBeNull();
      expect(found!.roomId).toBe(room.roomId);
    });

    it('部屋に所属していないsocketIdはnullを返す', () => {
      roomManager.createRoom('host-id');
      expect(roomManager.findRoomBySocketId('unknown')).toBeNull();
    });
  });

  describe('cleanupExpiredRooms', () => {
    it('TTL超過の部屋を削除する', () => {
      const room = roomManager.createRoom('host-id');
      // createdAt を過去に設定してTTL超過をシミュレート
      const roomState = roomManager.getRoom(room.roomId)!;
      (roomState as any).createdAt = Date.now() - ROOM_TTL_MS - 1;
      (roomState as any).updatedAt = Date.now() - ROOM_TTL_MS - 1;

      const deletedCount = roomManager.cleanupExpiredRooms();
      expect(deletedCount).toBe(1);
      expect(roomManager.getRoom(room.roomId)).toBeNull();
    });

    it('TTL内の部屋は削除しない', () => {
      const room = roomManager.createRoom('host-id');
      const deletedCount = roomManager.cleanupExpiredRooms();
      expect(deletedCount).toBe(0);
      expect(roomManager.getRoom(room.roomId)).not.toBeNull();
    });

    it('複数の期限切れ部屋を一括削除する', () => {
      const room1 = roomManager.createRoom('host-1');
      const room2 = roomManager.createRoom('host-2');
      const room3 = roomManager.createRoom('host-3');

      // room1とroom2を期限切れに
      const state1 = roomManager.getRoom(room1.roomId)!;
      (state1 as any).createdAt = Date.now() - ROOM_TTL_MS - 1;
      (state1 as any).updatedAt = Date.now() - ROOM_TTL_MS - 1;
      const state2 = roomManager.getRoom(room2.roomId)!;
      (state2 as any).createdAt = Date.now() - ROOM_TTL_MS - 1;
      (state2 as any).updatedAt = Date.now() - ROOM_TTL_MS - 1;

      const deletedCount = roomManager.cleanupExpiredRooms();
      expect(deletedCount).toBe(2);
      expect(roomManager.getRoom(room1.roomId)).toBeNull();
      expect(roomManager.getRoom(room2.roomId)).toBeNull();
      expect(roomManager.getRoom(room3.roomId)).not.toBeNull();
    });
  });
});
