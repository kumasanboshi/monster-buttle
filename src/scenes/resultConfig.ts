import { BattleResultType } from '../types/BattleState';
import { SceneKey } from './sceneKeys';
import { GameMode } from '../types/GameMode';

/** リザルト画面レイアウト定数 */
export interface ResultLayoutConfig {
  /** 勝敗テキストのY座標 */
  resultTextY: number;
  /** HP表示エリアのY座標 */
  hpDisplayY: number;
  /** ボタン開始Y座標 */
  buttonStartY: number;
  /** ボタン間隔 */
  buttonSpacing: number;
}

/** リザルト画面レイアウト */
export const RESULT_LAYOUT: ResultLayoutConfig = {
  resultTextY: 150,
  hpDisplayY: 250,
  buttonStartY: 400,
  buttonSpacing: 60,
};

/** リザルト画面の色設定 */
export interface ResultColorConfig {
  /** 勝利テキスト色 */
  winColor: number;
  /** 敗北テキスト色 */
  loseColor: number;
  /** ドローテキスト色 */
  drawColor: number;
  /** 通常テキスト色 */
  textColor: string;
  /** ボタン背景色 */
  buttonBg: number;
  /** ボタンテキスト色 */
  buttonText: string;
}

/** リザルト画面色設定 */
export const RESULT_COLORS: ResultColorConfig = {
  winColor: 0x44cc44,
  loseColor: 0xcc4444,
  drawColor: 0xcccc44,
  textColor: '#ffffff',
  buttonBg: 0x445588,
  buttonText: '#ffffff',
};

/** 勝敗テキスト */
export const RESULT_TEXT: Record<BattleResultType, string> = {
  [BattleResultType.PLAYER1_WIN]: '勝利！',
  [BattleResultType.PLAYER2_WIN]: '敗北...',
  [BattleResultType.DRAW]: '引き分け',
};

/** ボタン設定 */
export interface ResultButtonConfig {
  /** ボタンラベル */
  label: string;
  /** 遷移先シーン */
  targetScene: SceneKey;
}

/** リザルト画面のデフォルトボタン定義（表示順） */
export const RESULT_BUTTON_CONFIG: ResultButtonConfig[] = [
  {
    label: '次へ',
    targetScene: SceneKey.CHARACTER_SELECT,
  },
  {
    label: 'リトライ',
    targetScene: SceneKey.CHARACTER_SELECT,
  },
  {
    label: 'タイトルへ',
    targetScene: SceneKey.TITLE,
  },
];

/** FREE_CPUモード用のボタン定義 */
const FREE_CPU_BUTTON_CONFIG: ResultButtonConfig[] = [
  {
    label: 'もう一度',
    targetScene: SceneKey.CHARACTER_SELECT,
  },
  {
    label: 'タイトルへ',
    targetScene: SceneKey.TITLE,
  },
];

/**
 * モードに応じたボタン定義を返す
 */
export function getResultButtons(mode?: GameMode): ResultButtonConfig[] {
  if (mode === GameMode.FREE_CPU) {
    return FREE_CPU_BUTTON_CONFIG;
  }
  return RESULT_BUTTON_CONFIG;
}
