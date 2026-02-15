/**
 * Socket.ioクライアント
 *
 * サーバーとの接続・部屋作成・参加を管理する。
 * コールバック経由でModeSelectSceneにイベントを通知する。
 */

import { io, Socket } from 'socket.io-client';
import {
  ClientEvents,
  ServerEvents,
  ClientToServerEvents,
  ServerToClientEvents,
  ErrorCode,
} from '../../shared/types/SocketEvents';
import { RoomInfo } from '../../shared/types/RoomTypes';

/** SocketClientのイベントコールバック */
export interface SocketClientCallbacks {
  onConnect?: () => void;
  onDisconnect?: (reason: string) => void;
  onRoomCreated?: (roomId: string, roomInfo: RoomInfo) => void;
  onRoomJoined?: (roomInfo: RoomInfo, playerNumber: 1 | 2) => void;
  onOpponentJoined?: (roomInfo: RoomInfo) => void;
  onOpponentLeft?: (roomInfo: RoomInfo) => void;
  onError?: (code: ErrorCode, message: string) => void;
}

type TypedSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

export class SocketClient {
  private socket: TypedSocket | null = null;
  private callbacks: SocketClientCallbacks = {};

  /** サーバーに接続しイベントリスナーを登録する */
  connect(url: string, callbacks: SocketClientCallbacks): void {
    this.callbacks = callbacks;
    this.socket = io(url, {
      transports: ['websocket'],
    }) as TypedSocket;

    this.setupListeners();
  }

  /** サーバーとの接続を切断する */
  disconnect(): void {
    if (!this.socket) return;
    this.socket.disconnect();
    this.socket = null;
  }

  /** 接続状態を返す */
  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  /** 部屋を作成する */
  createRoom(password?: string): void {
    if (!this.socket) return;
    const payload = password ? { password } : {};
    this.socket.emit(ClientEvents.ROOM_CREATE, payload);
  }

  /** 部屋に参加する */
  joinRoom(roomId: string, password?: string): void {
    if (!this.socket) return;
    const payload = password ? { roomId, password } : { roomId };
    this.socket.emit(ClientEvents.ROOM_JOIN, payload);
  }

  /** 部屋を退出する */
  leaveRoom(): void {
    if (!this.socket) return;
    this.socket.emit(ClientEvents.ROOM_LEAVE);
  }

  private setupListeners(): void {
    if (!this.socket) return;

    this.socket.on('connect' as keyof ServerToClientEvents, (() => {
      this.callbacks.onConnect?.();
    }) as never);

    this.socket.on('disconnect' as keyof ServerToClientEvents, ((reason: string) => {
      this.callbacks.onDisconnect?.(reason);
    }) as never);

    this.socket.on(ServerEvents.ROOM_CREATED, (payload) => {
      this.callbacks.onRoomCreated?.(payload.roomId, payload.roomInfo);
    });

    this.socket.on(ServerEvents.ROOM_JOINED, (payload) => {
      this.callbacks.onRoomJoined?.(payload.roomInfo, payload.playerNumber);
    });

    this.socket.on(ServerEvents.ROOM_OPPONENT_JOINED, (payload) => {
      this.callbacks.onOpponentJoined?.(payload.roomInfo);
    });

    this.socket.on(ServerEvents.ROOM_OPPONENT_LEFT, (payload) => {
      this.callbacks.onOpponentLeft?.(payload.roomInfo);
    });

    this.socket.on(ServerEvents.ERROR, (payload) => {
      this.callbacks.onError?.(payload.code, payload.message);
    });
  }
}
