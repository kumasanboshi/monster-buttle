import { RoomState, RoomStatus, RoomPlayer, RoomInfo } from '../../shared/types/RoomTypes';
import { ErrorCode } from '../../shared/types/SocketEvents';
import { generateRoomId } from './utils/idGenerator';
import { ROOM_TTL_MS } from './config';

type JoinResult = RoomState | { error: ErrorCode };

/**
 * 部屋管理クラス
 *
 * Socket.io非依存の純粋なロジック。部屋の作成・参加・退出・検索を管理する。
 */
export class RoomManager {
  private rooms: Map<string, RoomState> = new Map();

  /**
   * 部屋を作成する
   */
  createRoom(hostSocketId: string, password?: string): RoomState {
    const roomId = this.generateUniqueRoomId();
    const now = Date.now();

    const host: RoomPlayer = {
      socketId: hostSocketId,
      playerNumber: 1,
      selectedMonsterId: null,
      isConnected: true,
    };

    const room: RoomState = {
      roomId,
      status: RoomStatus.WAITING,
      password: password ?? null,
      host,
      guest: null,
      createdAt: now,
      updatedAt: now,
    };

    this.rooms.set(roomId, room);
    return room;
  }

  /**
   * 部屋に参加する
   */
  joinRoom(roomId: string, guestSocketId: string, password?: string): JoinResult {
    const room = this.rooms.get(roomId);

    if (!room) {
      return { error: ErrorCode.ROOM_NOT_FOUND };
    }

    if (room.host.socketId === guestSocketId) {
      return { error: ErrorCode.ALREADY_IN_ROOM };
    }

    if (room.guest !== null) {
      return { error: ErrorCode.ROOM_FULL };
    }

    if (room.status !== RoomStatus.WAITING) {
      return { error: ErrorCode.ROOM_FULL };
    }

    if (room.password !== null && room.password !== password) {
      return { error: ErrorCode.WRONG_PASSWORD };
    }

    const guest: RoomPlayer = {
      socketId: guestSocketId,
      playerNumber: 2,
      selectedMonsterId: null,
      isConnected: true,
    };

    room.guest = guest;
    room.status = RoomStatus.PLAYING;
    room.updatedAt = Date.now();

    return room;
  }

  /**
   * 部屋から退出する
   */
  leaveRoom(roomId: string, socketId: string): void {
    const room = this.rooms.get(roomId);
    if (!room) return;

    if (room.host.socketId === socketId) {
      // ホスト退出 → 部屋削除
      this.rooms.delete(roomId);
    } else if (room.guest?.socketId === socketId) {
      // ゲスト退出 → WAITINGに戻す
      room.guest = null;
      room.status = RoomStatus.WAITING;
      room.updatedAt = Date.now();
    }
  }

  /**
   * 部屋を取得する
   */
  getRoom(roomId: string): RoomState | null {
    return this.rooms.get(roomId) ?? null;
  }

  /**
   * クライアント向けの部屋情報を取得する（パスワード除外）
   */
  getRoomInfo(roomId: string): RoomInfo | null {
    const room = this.rooms.get(roomId);
    if (!room) return null;

    return {
      roomId: room.roomId,
      status: room.status,
      hasPassword: room.password !== null,
      host: room.host,
      guest: room.guest,
      createdAt: room.createdAt,
    };
  }

  /**
   * socketIdから所属部屋を検索する
   */
  findRoomBySocketId(socketId: string): RoomState | null {
    for (const room of this.rooms.values()) {
      if (room.host.socketId === socketId) return room;
      if (room.guest?.socketId === socketId) return room;
    }
    return null;
  }

  /**
   * 期限切れ部屋を削除する
   *
   * @returns 削除された部屋数
   */
  cleanupExpiredRooms(): number {
    const now = Date.now();
    let deletedCount = 0;

    for (const [roomId, room] of this.rooms.entries()) {
      if (now - room.updatedAt > ROOM_TTL_MS) {
        this.rooms.delete(roomId);
        deletedCount++;
      }
    }

    return deletedCount;
  }

  private generateUniqueRoomId(): string {
    let roomId: string;
    do {
      roomId = generateRoomId();
    } while (this.rooms.has(roomId));
    return roomId;
  }
}
