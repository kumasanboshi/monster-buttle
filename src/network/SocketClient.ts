/**
 * Socket.ioクライアント
 *
 * サーバーとの接続・部屋作成・参加・バトル通信を管理する。
 * コールバック経由でシーンにイベントを通知する。
 */

import { io, Socket } from 'socket.io-client';
import {
  ClientEvents,
  ServerEvents,
  ClientToServerEvents,
  ServerToClientEvents,
  ErrorCode,
  BattleStartedPayload,
  WaitingForCommandsPayload,
  TurnResultPayload,
  CommandTimeoutPayload,
  BattleFinishedPayload,
} from '../../shared/types/SocketEvents';
import { RoomInfo } from '../../shared/types/RoomTypes';
import { TurnCommands } from '../types/Command';

/** SocketClientのイベントコールバック */
export interface SocketClientCallbacks {
  onConnect?: () => void;
  onDisconnect?: (reason: string) => void;
  onRoomCreated?: (roomId: string, roomInfo: RoomInfo) => void;
  onRoomJoined?: (roomInfo: RoomInfo, playerNumber: 1 | 2) => void;
  onOpponentJoined?: (roomInfo: RoomInfo) => void;
  onOpponentLeft?: (roomInfo: RoomInfo) => void;
  onError?: (code: ErrorCode, message: string) => void;
  // Battle callbacks
  onBattleStarted?: (payload: BattleStartedPayload) => void;
  onWaitingForCommands?: (payload: WaitingForCommandsPayload) => void;
  onTurnResult?: (payload: TurnResultPayload) => void;
  onCommandTimeout?: (payload: CommandTimeoutPayload) => void;
  onBattleFinished?: (payload: BattleFinishedPayload) => void;
  onOpponentDisconnected?: (payload: { roomId: string }) => void;
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

  /** バトル開始（モンスター選択完了） */
  startBattle(roomId: string, monsterId: string): void {
    if (!this.socket) return;
    this.socket.emit(ClientEvents.BATTLE_START, { roomId, monsterId });
  }

  /** コマンドを提出する */
  submitCommands(roomId: string, commands: TurnCommands): void {
    if (!this.socket) return;
    this.socket.emit(ClientEvents.BATTLE_COMMAND_SUBMIT, { roomId, commands });
  }

  /** 降参する */
  surrender(roomId: string): void {
    if (!this.socket) return;
    this.socket.emit(ClientEvents.BATTLE_SURRENDER, { roomId });
  }

  /** コールバックを部分的に更新する */
  updateCallbacks(callbacks: Partial<SocketClientCallbacks>): void {
    this.callbacks = { ...this.callbacks, ...callbacks };
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

    // Battle event listeners
    this.socket.on(ServerEvents.BATTLE_STARTED, (payload) => {
      this.callbacks.onBattleStarted?.(payload);
    });

    this.socket.on(ServerEvents.BATTLE_WAITING_COMMANDS, (payload) => {
      this.callbacks.onWaitingForCommands?.(payload);
    });

    this.socket.on(ServerEvents.BATTLE_TURN_RESULT, (payload) => {
      this.callbacks.onTurnResult?.(payload);
    });

    this.socket.on(ServerEvents.BATTLE_COMMAND_TIMEOUT, (payload) => {
      this.callbacks.onCommandTimeout?.(payload);
    });

    this.socket.on(ServerEvents.BATTLE_FINISHED, (payload) => {
      this.callbacks.onBattleFinished?.(payload);
    });

    this.socket.on(ServerEvents.BATTLE_OPPONENT_DISCONNECTED, (payload) => {
      this.callbacks.onOpponentDisconnected?.(payload);
    });
  }
}
