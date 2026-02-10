import { MonsterBattleState } from './Monster';
import { DistanceType } from './Distance';
import { StanceType } from './Stance';
import { TurnCommands } from './Command';

/**
 * バトル全体の状態
 */
export interface BattleState {
  /** プレイヤー1の状態 */
  player1: MonsterBattleState;
  /** プレイヤー2の状態 */
  player2: MonsterBattleState;
  /** 現在の距離 */
  currentDistance: DistanceType;
  /** 現在のターン数 */
  currentTurn: number;
  /** 残り時間（秒） */
  remainingTime: number;
  /** バトル終了フラグ */
  isFinished: boolean;
}

/**
 * ダメージ情報
 */
export interface DamageInfo {
  /** ダメージ量 */
  damage: number;
  /** 回避されたか */
  isEvaded: boolean;
  /** 反射されたか */
  isReflected: boolean;
}

/**
 * ターン結果
 */
export interface TurnResult {
  /** ターン番号 */
  turnNumber: number;
  /** プレイヤー1のコマンド */
  player1Commands: TurnCommands;
  /** プレイヤー2のコマンド */
  player2Commands: TurnCommands;
  /** ターン後の距離 */
  distanceAfter: DistanceType;
  /** プレイヤー1が受けたダメージ */
  player1Damage: DamageInfo;
  /** プレイヤー2が受けたダメージ */
  player2Damage: DamageInfo;
  /** プレイヤー1のターン後スタンス */
  player1StanceAfter: StanceType;
  /** プレイヤー2のターン後スタンス */
  player2StanceAfter: StanceType;
}

/**
 * バトル結果タイプ
 */
export enum BattleResultType {
  /** プレイヤー1勝利 */
  PLAYER1_WIN = 'PLAYER1_WIN',
  /** プレイヤー2勝利 */
  PLAYER2_WIN = 'PLAYER2_WIN',
  /** ドロー */
  DRAW = 'DRAW',
}

/**
 * バトル最終結果
 */
export interface BattleResult {
  /** 勝敗結果 */
  resultType: BattleResultType;
  /** 最終状態 */
  finalState: BattleState;
  /** ターン履歴 */
  turnHistory: TurnResult[];
  /** 勝敗理由（HP0、時間切れ、ギブアップ等） */
  reason: string;
}
