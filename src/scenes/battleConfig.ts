import { DistanceType } from '../types/Distance';
import { StanceType } from '../types/Stance';
import { CommandType } from '../types/Command';
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
  /** 残り時間表示のY座標 */
  timeY: number;
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
  timeY: 60,
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

/** コマンドボタンのデフォルトラベル（STANCE_A/Bはスタンスに応じて動的に変わる） */
export const COMMAND_LABELS: Record<CommandType, string> = {
  [CommandType.ADVANCE]: '前進',
  [CommandType.RETREAT]: '後退',
  [CommandType.WEAPON_ATTACK]: '武器',
  [CommandType.SPECIAL_ATTACK]: '特殊',
  [CommandType.REFLECTOR]: 'リフレクタ',
  [CommandType.STANCE_A]: 'スタンスA',
  [CommandType.STANCE_B]: 'スタンスB',
};

/** コマンド選択UIのレイアウト定数 */
export const COMMAND_UI_LAYOUT = {
  /** コマンドボタン1段目のY座標 */
  row1Y: 490,
  /** コマンドボタン2段目のY座標 */
  row2Y: 530,
  /** ボタン幅 */
  buttonWidth: 80,
  /** ボタン高さ */
  buttonHeight: 30,
  /** ボタン間隔（左端から次の左端まで） */
  buttonSpacing: 95,
  /** 1段目の開始X座標 */
  row1StartX: 135,
  /** 2段目の開始X座標 */
  row2StartX: 182,
  /** 選択表示のY座標 */
  selectionY: 565,
  /** 決定ボタンのY座標 */
  confirmY: 565,
  /** キャンセルボタンのX座標 */
  cancelX: 650,
  /** キャンセルボタンのY座標 */
  cancelY: 530,
} as const;

/** コマンドUIの色設定 */
export const COMMAND_UI_COLORS = {
  /** 有効なボタン背景 */
  buttonActive: 0x445588,
  /** 無効なボタン背景 */
  buttonDisabled: 0x333333,
  /** 選択済みボタン背景 */
  buttonSelected: 0x6688bb,
  /** ボタンテキスト（有効） */
  buttonTextActive: '#ffffff',
  /** ボタンテキスト（無効） */
  buttonTextDisabled: '#666666',
  /** 決定ボタン背景（有効） */
  confirmActive: 0x448844,
  /** 決定ボタン背景（無効） */
  confirmDisabled: 0x333333,
  /** キャンセルボタン背景 */
  cancelButton: 0x884444,
  /** 選択表示テキスト */
  selectionText: '#ffffff',
} as const;

/** コマンドボタンの配置（行ごと） */
export const COMMAND_BUTTON_ROWS: CommandType[][] = [
  [CommandType.ADVANCE, CommandType.RETREAT, CommandType.WEAPON_ATTACK, CommandType.SPECIAL_ATTACK],
  [CommandType.REFLECTOR, CommandType.STANCE_A, CommandType.STANCE_B],
];

/** コマンドボタンレイアウトの型 */
export interface CommandButtonLayout {
  buttonWidth: number;
  buttonHeight: number;
  buttonSpacing: number;
  row1Y: number;
  row2Y: number;
  row1StartX: number;
  row2StartX: number;
  selectionY: number;
  confirmY: number;
  cancelX: number;
  cancelY: number;
}

/**
 * デバイスに応じたコマンドボタンレイアウトを返す
 * モバイルではタッチしやすい大きめサイズに調整
 */
export function getCommandButtonLayout(isMobile: boolean): CommandButtonLayout {
  if (!isMobile) {
    return {
      buttonWidth: COMMAND_UI_LAYOUT.buttonWidth,
      buttonHeight: COMMAND_UI_LAYOUT.buttonHeight,
      buttonSpacing: COMMAND_UI_LAYOUT.buttonSpacing,
      row1Y: COMMAND_UI_LAYOUT.row1Y,
      row2Y: COMMAND_UI_LAYOUT.row2Y,
      row1StartX: COMMAND_UI_LAYOUT.row1StartX,
      row2StartX: COMMAND_UI_LAYOUT.row2StartX,
      selectionY: COMMAND_UI_LAYOUT.selectionY,
      confirmY: COMMAND_UI_LAYOUT.confirmY,
      cancelX: COMMAND_UI_LAYOUT.cancelX,
      cancelY: COMMAND_UI_LAYOUT.cancelY,
    };
  }

  // モバイル用: ボタンを大きく、間隔を広げる
  const buttonWidth = 95;
  const buttonHeight = 40;
  const buttonSpacing = 105;
  const row1Y = 480;
  const row2Y = 528;
  const row1StartX = 120;
  const row2StartX = 172;
  const selectionY = 570;
  const confirmY = 570;
  const cancelX = 660;
  const cancelY = 528;

  return {
    buttonWidth,
    buttonHeight,
    buttonSpacing,
    row1Y,
    row2Y,
    row1StartX,
    row2StartX,
    selectionY,
    confirmY,
    cancelX,
    cancelY,
  };
}

/** エフェクト再生用定数 */
export const EFFECT_CONFIG = {
  /** ダメージ数値の表示時間（ms） */
  damageNumberDuration: 800,
  /** ダメージ数値の色 */
  damageNumberColor: '#ff4444',
  /** 武器攻撃エフェクトの時間（ms） */
  weaponAttackDuration: 400,
  /** 武器攻撃フラッシュ色 */
  weaponFlashColor: 0xffffff,
  /** 特殊攻撃エフェクトの時間（ms） */
  specialAttackDuration: 500,
  /** 特殊攻撃パルス色 */
  specialPulseColor: 0xaa44ff,
  /** リフレクターエフェクトの時間（ms） */
  reflectorDuration: 600,
  /** リフレクターシールド色 */
  reflectorShieldColor: 0x4488ff,
  /** リフレクターテキスト色 */
  reflectorTextColor: '#4488ff',
  /** 回避エフェクトの時間（ms） */
  evasionDuration: 500,
  /** 回避テキスト色 */
  evasionTextColor: '#aaaaaa',
  /** 距離移動アニメーションの時間（ms） */
  distanceMoveDuration: 400,
  /** スタンス変更エフェクトの時間（ms） */
  stanceChangeDuration: 700,
  /** 攻勢スタンスのティント色 */
  stanceOffensiveColor: 0xff6600,
  /** 守勢スタンスのティント色 */
  stanceDefensiveColor: 0x4488ff,
  /** 通常スタンスのティント色 */
  stanceNormalColor: 0xaaaaaa,
} as const;

/** ギブアップ確認ダイアログのメッセージ */
export const SURRENDER_MESSAGES = {
  /** ギブアップボタンのラベル */
  buttonLabel: 'ギブアップ',
  /** 確認ダイアログのタイトル */
  confirmTitle: 'ギブアップしますか？',
  /** 確認ダイアログ本文（CPUモード） */
  confirmBody: '負けとなりバトルを終了します。',
  /** 確認ダイアログ本文（通信対戦モード） */
  onlineConfirmBody: '対戦相手の勝利となります。',
  /** 「はい」ボタンラベル */
  confirmYes: 'はい',
  /** 「いいえ」ボタンラベル */
  confirmNo: 'いいえ',
} as const;

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
