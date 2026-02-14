import { Server, Socket } from 'socket.io';
import { RoomManager } from './RoomManager';
import {
  ClientEvents,
  ServerEvents,
  ErrorCode,
  CreateRoomPayload,
  JoinRoomPayload,
  RoomInfoPayload,
} from '../../shared/types/SocketEvents';

/**
 * Socket.io接続管理
 *
 * Socket.ioのイベントをRoomManagerのメソッドにブリッジする。
 */
export class ConnectionManager {
  private io: Server;
  private roomManager: RoomManager;

  constructor(io: Server, roomManager: RoomManager) {
    this.io = io;
    this.roomManager = roomManager;
  }

  /** RoomManagerを差し替える（テスト用） */
  setRoomManager(roomManager: RoomManager): void {
    this.roomManager = roomManager;
  }

  /** Socket.ioイベントリスナーを設定する */
  setupListeners(): void {
    this.io.on('connection', (socket) => this.handleConnection(socket));
  }

  private handleConnection(socket: Socket): void {
    socket.on(ClientEvents.ROOM_CREATE, (payload: CreateRoomPayload) => {
      this.handleCreateRoom(socket, payload);
    });

    socket.on(ClientEvents.ROOM_JOIN, (payload: JoinRoomPayload) => {
      this.handleJoinRoom(socket, payload);
    });

    socket.on(ClientEvents.ROOM_LEAVE, () => {
      this.handleLeaveRoom(socket);
    });

    socket.on(ClientEvents.ROOM_INFO, (payload: RoomInfoPayload) => {
      this.handleRoomInfo(socket, payload);
    });

    socket.on('disconnect', () => {
      this.handleDisconnect(socket);
    });
  }

  private handleCreateRoom(socket: Socket, payload: CreateRoomPayload): void {
    const room = this.roomManager.createRoom(socket.id, payload.password);
    const roomInfo = this.roomManager.getRoomInfo(room.roomId)!;

    socket.join(room.roomId);
    socket.emit(ServerEvents.ROOM_CREATED, {
      roomId: room.roomId,
      roomInfo,
    });
  }

  private handleJoinRoom(socket: Socket, payload: JoinRoomPayload): void {
    if (!payload.roomId) {
      socket.emit(ServerEvents.ERROR, {
        code: ErrorCode.INVALID_PAYLOAD,
        message: 'roomIdは必須です',
      });
      return;
    }

    const result = this.roomManager.joinRoom(payload.roomId, socket.id, payload.password);

    if ('error' in result) {
      const messages: Record<ErrorCode, string> = {
        [ErrorCode.ROOM_NOT_FOUND]: '部屋が見つかりません',
        [ErrorCode.ROOM_FULL]: '部屋が満員です',
        [ErrorCode.WRONG_PASSWORD]: 'パスワードが間違っています',
        [ErrorCode.ALREADY_IN_ROOM]: 'すでに部屋に参加しています',
        [ErrorCode.NOT_IN_ROOM]: '部屋に参加していません',
        [ErrorCode.INVALID_PAYLOAD]: '不正なリクエストです',
      };
      socket.emit(ServerEvents.ERROR, {
        code: result.error,
        message: messages[result.error],
      });
      return;
    }

    const roomInfo = this.roomManager.getRoomInfo(payload.roomId)!;

    socket.join(payload.roomId);
    socket.emit(ServerEvents.ROOM_JOINED, {
      roomInfo,
      playerNumber: 2,
    });

    // ホストに相手入室を通知
    socket.to(payload.roomId).emit(ServerEvents.ROOM_OPPONENT_JOINED, {
      roomInfo,
    });
  }

  private handleLeaveRoom(socket: Socket): void {
    const room = this.roomManager.findRoomBySocketId(socket.id);
    if (!room) return;

    const isHost = room.host.socketId === socket.id;
    this.roomManager.leaveRoom(room.roomId, socket.id);
    socket.leave(room.roomId);

    if (!isHost) {
      // ゲスト退出 → ホストに通知
      const updatedInfo = this.roomManager.getRoomInfo(room.roomId);
      if (updatedInfo) {
        socket.to(room.roomId).emit(ServerEvents.ROOM_OPPONENT_LEFT, {
          roomInfo: updatedInfo,
        });
      }
    }
  }

  private handleRoomInfo(socket: Socket, payload: RoomInfoPayload): void {
    if (!payload.roomId) {
      socket.emit(ServerEvents.ERROR, {
        code: ErrorCode.INVALID_PAYLOAD,
        message: 'roomIdは必須です',
      });
      return;
    }

    const roomInfo = this.roomManager.getRoomInfo(payload.roomId);
    if (!roomInfo) {
      socket.emit(ServerEvents.ERROR, {
        code: ErrorCode.ROOM_NOT_FOUND,
        message: '部屋が見つかりません',
      });
      return;
    }

    socket.emit(ServerEvents.ROOM_INFO, roomInfo);
  }

  private handleDisconnect(socket: Socket): void {
    const room = this.roomManager.findRoomBySocketId(socket.id);
    if (!room) return;

    const isHost = room.host.socketId === socket.id;
    this.roomManager.leaveRoom(room.roomId, socket.id);

    if (!isHost) {
      // ゲスト切断 → ホストに通知
      const updatedInfo = this.roomManager.getRoomInfo(room.roomId);
      if (updatedInfo) {
        this.io.to(room.roomId).emit(ServerEvents.ROOM_OPPONENT_LEFT, {
          roomInfo: updatedInfo,
        });
      }
    }
  }
}
