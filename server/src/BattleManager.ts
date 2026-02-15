import { RoomState } from '../../shared/types/RoomTypes';
import { BattleState, TurnResult, BattleResult } from '../../src/types/BattleState';
import { Monster, MonsterBattleState } from '../../src/types/Monster';
import { TurnCommands, CommandType } from '../../src/types/Command';
import { DistanceType } from '../../src/types/Distance';
import { StanceType } from '../../src/types/Stance';
import { processTurn } from '../../src/battle/turnProcessor';
import { checkVictoryAfterTurn } from '../../src/battle/victoryCondition';
import { BattleResultType } from '../../src/types/BattleState';

/**
 * 保留中のコマンド
 */
export interface PendingCommands {
  player1Commands: TurnCommands | null;
  player2Commands: TurnCommands | null;
  startedAt: number;
}

/**
 * バトル状態を含む部屋
 */
export interface BattleRoomState extends RoomState {
  battleState?: BattleState;
  player1Monster?: Monster;
  player2Monster?: Monster;
  pendingCommands?: PendingCommands;
  turnHistory?: TurnResult[];
  battleResult?: BattleResult;
}

type SubmitResult =
  | { bothReady: boolean; battleRoom: BattleRoomState }
  | { error: string };

type TurnExecuteResult =
  | { turnResult: TurnResult; newState: BattleState; battleRoom: BattleRoomState; battleResult?: BattleResult }
  | { error: string };

/** デフォルトのタイムアウト時コマンド */
const DEFAULT_COMMANDS: TurnCommands = {
  first: { type: CommandType.ADVANCE },
  second: { type: CommandType.ADVANCE },
};

/**
 * バトル管理クラス
 *
 * Socket.io非依存の純粋なバトルロジック。
 * バトル状態管理、コマンド収集、ターン処理を管理する。
 */
export class BattleManager {
  private rooms: Map<string, BattleRoomState> = new Map();

  /**
   * バトルを開始する
   */
  startBattle(
    room: RoomState,
    player1Monster: Monster,
    player2Monster: Monster,
  ): BattleRoomState {
    const player1State: MonsterBattleState = {
      monsterId: player1Monster.id,
      currentHp: player1Monster.stats.hp,
      currentStance: StanceType.NORMAL,
      remainingSpecialCount: player1Monster.stats.specialAttackCount,
      usedReflectCount: 0,
    };

    const player2State: MonsterBattleState = {
      monsterId: player2Monster.id,
      currentHp: player2Monster.stats.hp,
      currentStance: StanceType.NORMAL,
      remainingSpecialCount: player2Monster.stats.specialAttackCount,
      usedReflectCount: 0,
    };

    const battleState: BattleState = {
      player1: player1State,
      player2: player2State,
      currentDistance: DistanceType.MID,
      currentTurn: 1,
      remainingTime: 120,
      isFinished: false,
    };

    const battleRoom: BattleRoomState = {
      ...room,
      battleState,
      player1Monster,
      player2Monster,
      pendingCommands: {
        player1Commands: null,
        player2Commands: null,
        startedAt: Date.now(),
      },
      turnHistory: [],
    };

    this.rooms.set(room.roomId, battleRoom);
    return battleRoom;
  }

  /**
   * コマンドを提出する
   */
  submitCommands(
    roomId: string,
    playerNumber: 1 | 2,
    commands: TurnCommands,
  ): SubmitResult {
    const battleRoom = this.rooms.get(roomId);

    if (!battleRoom || !battleRoom.battleState || !battleRoom.pendingCommands) {
      return { error: 'BATTLE_NOT_STARTED' };
    }

    const pending = battleRoom.pendingCommands;

    if (playerNumber === 1) {
      if (pending.player1Commands !== null) {
        return { error: 'ALREADY_SUBMITTED' };
      }
      pending.player1Commands = commands;
    } else {
      if (pending.player2Commands !== null) {
        return { error: 'ALREADY_SUBMITTED' };
      }
      pending.player2Commands = commands;
    }

    const bothReady = pending.player1Commands !== null && pending.player2Commands !== null;

    return { bothReady, battleRoom };
  }

  /**
   * ターンを実行する
   */
  executeTurn(roomId: string): TurnExecuteResult {
    const battleRoom = this.rooms.get(roomId);

    if (!battleRoom || !battleRoom.battleState || !battleRoom.pendingCommands) {
      return { error: 'BATTLE_NOT_STARTED' };
    }

    const { pendingCommands, battleState, player1Monster, player2Monster } = battleRoom;

    if (!pendingCommands.player1Commands || !pendingCommands.player2Commands) {
      return { error: 'COMMANDS_NOT_READY' };
    }

    if (!player1Monster || !player2Monster) {
      return { error: 'BATTLE_NOT_STARTED' };
    }

    const { newState, turnResult } = processTurn(
      battleState,
      player1Monster,
      player2Monster,
      pendingCommands.player1Commands,
      pendingCommands.player2Commands,
    );

    // Update state
    battleRoom.battleState = newState;
    battleRoom.turnHistory!.push(turnResult);

    // Reset pending commands
    battleRoom.pendingCommands = {
      player1Commands: null,
      player2Commands: null,
      startedAt: Date.now(),
    };

    // Check victory
    const victoryResult = checkVictoryAfterTurn(newState);
    if (victoryResult) {
      victoryResult.turnHistory = battleRoom.turnHistory!;
      battleRoom.battleResult = victoryResult;
      battleRoom.battleState = { ...newState, isFinished: true };
      return { turnResult, newState: battleRoom.battleState, battleRoom, battleResult: victoryResult };
    }

    return { turnResult, newState, battleRoom };
  }

  /**
   * 前回のコマンドを取得する（タイムアウト時の自動選択用）
   */
  getLastCommands(roomId: string, playerNumber: 1 | 2): TurnCommands | null {
    const battleRoom = this.rooms.get(roomId);
    if (!battleRoom || !battleRoom.turnHistory) {
      return null;
    }

    // 初回ターン（履歴なし）→ デフォルト
    if (battleRoom.turnHistory.length === 0) {
      return {
        first: { type: DEFAULT_COMMANDS.first.type },
        second: { type: DEFAULT_COMMANDS.second.type },
      };
    }

    const lastTurn = battleRoom.turnHistory[battleRoom.turnHistory.length - 1];
    return playerNumber === 1 ? lastTurn.player1Commands : lastTurn.player2Commands;
  }

  /**
   * 切断処理
   */
  handleDisconnect(roomId: string, disconnectedPlayer: 1 | 2): BattleRoomState | null {
    const battleRoom = this.rooms.get(roomId);
    if (!battleRoom || !battleRoom.battleState) {
      return null;
    }

    const resultType = disconnectedPlayer === 1
      ? BattleResultType.PLAYER2_WIN
      : BattleResultType.PLAYER1_WIN;

    const battleResult: BattleResult = {
      resultType,
      finalState: { ...battleRoom.battleState, isFinished: true },
      turnHistory: battleRoom.turnHistory ?? [],
      reason: `Player ${disconnectedPlayer} disconnected`,
    };

    battleRoom.battleResult = battleResult;
    battleRoom.battleState = { ...battleRoom.battleState, isFinished: true };

    return battleRoom;
  }

  /**
   * バトル部屋を取得する
   */
  getRoom(roomId: string): BattleRoomState | null {
    return this.rooms.get(roomId) ?? null;
  }

  /**
   * バトル部屋を削除する
   */
  removeRoom(roomId: string): void {
    this.rooms.delete(roomId);
  }
}
