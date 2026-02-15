import { Server, Socket } from 'socket.io';
import { RoomManager } from './RoomManager';
import { BattleManager } from './BattleManager';
import {
  ClientEvents,
  ServerEvents,
  ErrorCode,
  CreateRoomPayload,
  JoinRoomPayload,
  RoomInfoPayload,
  BattleStartPayload,
  CommandSubmitPayload,
} from '../../shared/types/SocketEvents';
import { getMonsterWithFinalStats } from '../../src/constants/monsterStats';
import { checkVictoryOnGiveUp } from '../../src/battle/victoryCondition';

/** デフォルトのコマンドタイムアウト（30秒） */
const DEFAULT_COMMAND_TIMEOUT_MS = 30000;

/**
 * Socket.io接続管理
 *
 * Socket.ioのイベントをRoomManager/BattleManagerのメソッドにブリッジする。
 */
export class ConnectionManager {
  private io: Server;
  private roomManager: RoomManager;
  private battleManager: BattleManager;
  private commandTimeouts: Map<string, ReturnType<typeof setTimeout>> = new Map();
  private commandTimeoutMs: number = DEFAULT_COMMAND_TIMEOUT_MS;

  /** 各部屋のモンスター選択を一時保持 */
  private pendingMonsterSelections: Map<string, { player1MonsterId?: string; player2MonsterId?: string }> = new Map();

  constructor(io: Server, roomManager: RoomManager, battleManager?: BattleManager) {
    this.io = io;
    this.roomManager = roomManager;
    this.battleManager = battleManager ?? new BattleManager();
  }

  /** RoomManagerを差し替える（テスト用） */
  setRoomManager(roomManager: RoomManager): void {
    this.roomManager = roomManager;
  }

  /** BattleManagerを差し替える（テスト用） */
  setBattleManager(battleManager: BattleManager): void {
    this.battleManager = battleManager;
  }

  /** コマンドタイムアウトを設定する（テスト用） */
  setCommandTimeoutMs(ms: number): void {
    this.commandTimeoutMs = ms;
  }

  /** すべてのタイムアウトをクリアする（テスト用） */
  clearAllTimeouts(): void {
    for (const timeout of this.commandTimeouts.values()) {
      clearTimeout(timeout);
    }
    this.commandTimeouts.clear();
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

    socket.on(ClientEvents.BATTLE_START, (payload: BattleStartPayload) => {
      this.handleBattleStart(socket, payload);
    });

    socket.on(ClientEvents.BATTLE_COMMAND_SUBMIT, (payload: CommandSubmitPayload) => {
      this.handleCommandSubmit(socket, payload);
    });

    socket.on(ClientEvents.BATTLE_SURRENDER, (payload: { roomId: string }) => {
      this.handleSurrender(socket, payload);
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
        [ErrorCode.BATTLE_NOT_STARTED]: 'バトルが開始されていません',
        [ErrorCode.INVALID_COMMAND]: '無効なコマンドです',
        [ErrorCode.ALREADY_SUBMITTED]: 'コマンドは既に提出済みです',
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

  private handleBattleStart(socket: Socket, payload: BattleStartPayload): void {
    const { roomId, monsterId } = payload;
    const room = this.roomManager.getRoom(roomId);
    if (!room || !room.guest) {
      socket.emit(ServerEvents.ERROR, {
        code: ErrorCode.ROOM_NOT_FOUND,
        message: '部屋が見つかりません',
      });
      return;
    }

    // プレイヤー番号を判定
    const isHost = room.host.socketId === socket.id;
    const playerNumber = isHost ? 1 : 2;

    // モンスター選択を一時保持
    let selection = this.pendingMonsterSelections.get(roomId);
    if (!selection) {
      selection = {};
      this.pendingMonsterSelections.set(roomId, selection);
    }

    if (playerNumber === 1) {
      selection.player1MonsterId = monsterId;
    } else {
      selection.player2MonsterId = monsterId;
    }

    // 両方のモンスター選択が揃ったらバトル開始
    if (selection.player1MonsterId && selection.player2MonsterId) {
      const monster1 = getMonsterWithFinalStats(selection.player1MonsterId);
      const monster2 = getMonsterWithFinalStats(selection.player2MonsterId);

      if (!monster1 || !monster2) {
        socket.emit(ServerEvents.ERROR, {
          code: ErrorCode.INVALID_PAYLOAD,
          message: 'モンスターが見つかりません',
        });
        return;
      }

      const battleRoom = this.battleManager.startBattle(room, monster1, monster2);
      this.pendingMonsterSelections.delete(roomId);

      this.io.to(roomId).emit(ServerEvents.BATTLE_STARTED, {
        roomId,
        player1Monster: monster1,
        player2Monster: monster2,
        initialState: battleRoom.battleState!,
      });

      // コマンドタイムアウト開始
      this.startCommandTimeout(roomId);
    }
  }

  private handleCommandSubmit(socket: Socket, payload: CommandSubmitPayload): void {
    const { roomId, commands } = payload;
    const room = this.roomManager.getRoom(roomId);
    if (!room) {
      socket.emit(ServerEvents.ERROR, {
        code: ErrorCode.ROOM_NOT_FOUND,
        message: '部屋が見つかりません',
      });
      return;
    }

    // プレイヤー番号を判定
    const isHost = room.host.socketId === socket.id;
    const playerNumber: 1 | 2 = isHost ? 1 : 2;

    const result = this.battleManager.submitCommands(roomId, playerNumber, commands);

    if ('error' in result) {
      const errorCode = result.error === 'ALREADY_SUBMITTED'
        ? ErrorCode.ALREADY_SUBMITTED
        : ErrorCode.BATTLE_NOT_STARTED;
      socket.emit(ServerEvents.ERROR, {
        code: errorCode,
        message: result.error === 'ALREADY_SUBMITTED'
          ? 'コマンドは既に提出済みです'
          : 'バトルが開始されていません',
      });
      return;
    }

    if (result.bothReady) {
      // 両方揃った → ターン処理
      this.clearCommandTimeout(roomId);
      this.processTurnAndNotify(roomId);
    } else {
      // 待機中 → 通知
      const battleRoom = this.battleManager.getRoom(roomId);
      this.io.to(roomId).emit(ServerEvents.BATTLE_WAITING_COMMANDS, {
        roomId,
        turnNumber: battleRoom?.battleState?.currentTurn ?? 1,
      });
    }
  }

  private handleSurrender(socket: Socket, payload: { roomId: string }): void {
    const { roomId } = payload;
    const room = this.roomManager.getRoom(roomId);
    if (!room) return;

    const battleRoom = this.battleManager.getRoom(roomId);
    if (!battleRoom || !battleRoom.battleState) return;

    const isHost = room.host.socketId === socket.id;
    const giveUpPlayer: 1 | 2 = isHost ? 1 : 2;

    const result = checkVictoryOnGiveUp(battleRoom.battleState, giveUpPlayer);
    result.turnHistory = battleRoom.turnHistory ?? [];

    this.clearCommandTimeout(roomId);

    this.io.to(roomId).emit(ServerEvents.BATTLE_FINISHED, {
      roomId,
      result,
      reason: 'surrender',
    });

    this.battleManager.removeRoom(roomId);
  }

  private handleDisconnect(socket: Socket): void {
    const room = this.roomManager.findRoomBySocketId(socket.id);
    if (!room) return;

    const isHost = room.host.socketId === socket.id;

    // バトル中の切断処理
    const battleRoom = this.battleManager.getRoom(room.roomId);
    if (battleRoom && battleRoom.battleState && !battleRoom.battleState.isFinished) {
      const disconnectedPlayer: 1 | 2 = isHost ? 1 : 2;
      const updatedRoom = this.battleManager.handleDisconnect(room.roomId, disconnectedPlayer);

      if (updatedRoom) {
        this.clearCommandTimeout(room.roomId);

        this.io.to(room.roomId).emit(ServerEvents.BATTLE_OPPONENT_DISCONNECTED, {
          roomId: room.roomId,
        });

        this.io.to(room.roomId).emit(ServerEvents.BATTLE_FINISHED, {
          roomId: room.roomId,
          result: updatedRoom.battleResult!,
          reason: 'disconnect',
        });

        this.battleManager.removeRoom(room.roomId);
      }
    }

    // 通常の退室処理
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

  private startCommandTimeout(roomId: string): void {
    this.clearCommandTimeout(roomId);
    const timeout = setTimeout(() => this.handleCommandTimeout(roomId), this.commandTimeoutMs);
    this.commandTimeouts.set(roomId, timeout);
  }

  private clearCommandTimeout(roomId: string): void {
    const timeout = this.commandTimeouts.get(roomId);
    if (timeout) {
      clearTimeout(timeout);
      this.commandTimeouts.delete(roomId);
    }
  }

  private handleCommandTimeout(roomId: string): void {
    const battleRoom = this.battleManager.getRoom(roomId);
    if (!battleRoom || !battleRoom.pendingCommands || !battleRoom.battleState) return;

    const { pendingCommands } = battleRoom;
    const p1Missing = pendingCommands.player1Commands === null;
    const p2Missing = pendingCommands.player2Commands === null;

    // 未提出プレイヤーに前回コマンドを自動提出
    if (p1Missing) {
      const autoCommands = this.battleManager.getLastCommands(roomId, 1)!;
      this.battleManager.submitCommands(roomId, 1, autoCommands);

      this.io.to(roomId).emit(ServerEvents.BATTLE_COMMAND_TIMEOUT, {
        roomId,
        timedOutPlayer: 1,
        autoSelectedCommands: autoCommands,
      });
    }

    if (p2Missing) {
      const autoCommands = this.battleManager.getLastCommands(roomId, 2)!;
      this.battleManager.submitCommands(roomId, 2, autoCommands);

      this.io.to(roomId).emit(ServerEvents.BATTLE_COMMAND_TIMEOUT, {
        roomId,
        timedOutPlayer: 2,
        autoSelectedCommands: autoCommands,
      });
    }

    // ターン処理
    this.processTurnAndNotify(roomId);
  }

  private processTurnAndNotify(roomId: string): void {
    const result = this.battleManager.executeTurn(roomId);

    if ('error' in result) return;

    this.io.to(roomId).emit(ServerEvents.BATTLE_TURN_RESULT, {
      roomId,
      turnResult: result.turnResult,
      newState: result.newState,
    });

    if (result.battleResult) {
      // バトル終了
      this.io.to(roomId).emit(ServerEvents.BATTLE_FINISHED, {
        roomId,
        result: result.battleResult,
        reason: 'hp_zero',
      });
      this.battleManager.removeRoom(roomId);
    } else {
      // 次のターンのタイムアウト開始
      this.startCommandTimeout(roomId);
    }
  }
}
