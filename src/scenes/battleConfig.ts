import { DistanceType } from '../types/Distance';
import { StanceType } from '../types/Stance';
import { GAME_WIDTH } from './gameConfig';

/** バトル画面レイアウト定数 */
export interface BattleLayoutConfig {
  /** HPバーのY座標 */
  hpBarY: number;
  /** HPバーの幅 */
  hpBarWidth: number;
  /** HPバーの高さ */
  hpBarHeight: number;
  /** プレイヤーHPバーのX座標 */
  playerHpBarX: number;
  /** 敵HPバーのX座標 */
  enemyHpBarX: number;
  /** キャラ表示エリアのY座標 */
  characterY: number;
  /** ステータス表示エリアのY座標 */
  statusY: number;
}

/** バトル画面レイアウト */
export const BATTLE_LAYOUT: BattleLayoutConfig = {
  hpBarY: 30,
  hpBarWidth: 250,
  hpBarHeight: 20,
  playerHpBarX: 30,
  enemyHpBarX: GAME_WIDTH - 30 - 250, // 520
  characterY: 250,
  statusY: 430,
};

/** バトル画面の色設定 */
export interface BattleColorConfig {
  /** プレイヤーHPバー色 */
  playerHpBar: number;
  /** 敵HPバー色 */
  enemyHpBar: number;
  /** HPバー背景色 */
  hpBarBg: number;
  /** 距離表示テキスト色 */
  distanceText: string;
  /** 残り時間テキスト色 */
  timeText: string;
  /** プレイヤースタンステキスト色 */
  playerStanceText: string;
  /** 敵スタンステキスト色 */
  enemyStanceText: string;
}

/** バトル画面色設定 */
export const BATTLE_COLORS: BattleColorConfig = {
  playerHpBar: 0x44cc44,
  enemyHpBar: 0xcc4444,
  hpBarBg: 0x333333,
  distanceText: '#ffff88',
  timeText: '#ffffff',
  playerStanceText: '#88ccff',
  enemyStanceText: '#ff8888',
};

/** 距離表示ラベル */
export const DISTANCE_LABELS: Record<DistanceType, string> = {
  [DistanceType.NEAR]: '近距離',
  [DistanceType.MID]: '中距離',
  [DistanceType.FAR]: '遠距離',
};

/** スタンス表示ラベル */
export const STANCE_LABELS: Record<StanceType, string> = {
  [StanceType.NORMAL]: '通常',
  [StanceType.OFFENSIVE]: '攻勢',
  [StanceType.DEFENSIVE]: '守勢',
};

/** バトル初期設定 */
export interface BattleInitialConfig {
  /** 初期距離 */
  initialDistance: DistanceType;
  /** 初期スタンス */
  initialStance: StanceType;
  /** 初期制限時間（秒） */
  initialTime: number;
}

/** バトル初期値 */
export const BATTLE_INITIAL: BattleInitialConfig = {
  initialDistance: DistanceType.MID,
  initialStance: StanceType.NORMAL,
  initialTime: 120,
};

/** 距離ごとのキャラクターX座標 */
export const DISTANCE_CHARACTER_POSITIONS: Record<
  DistanceType,
  { playerX: number; enemyX: number }
> = {
  [DistanceType.NEAR]: { playerX: 280, enemyX: 520 },
  [DistanceType.MID]: { playerX: 200, enemyX: 600 },
  [DistanceType.FAR]: { playerX: 120, enemyX: 680 },
};

/**
 * 秒数を「M:SS」形式にフォーマット
 */
export function formatTime(seconds: number): string {
  const clamped = Math.max(0, Math.floor(seconds));
  const min = Math.floor(clamped / 60);
  const sec = clamped % 60;
  return `${min}:${sec.toString().padStart(2, '0')}`;
}

/**
 * HPを0〜maxHpの範囲にクランプ
 */
export function clampHp(hp: number, maxHp: number): number {
  return Math.max(0, Math.min(hp, maxHp));
}
