import { SceneKey } from './sceneKeys';
import { GameMode } from '../types/GameMode';

/** 初期解放キャラのID（ザーグ：レイン） */
export const INITIAL_MONSTER_ID = 'zaag';

/**
 * キャラ解放順序（PROJECT.mdのステージ順と一致）
 * ステージNをクリアすると UNLOCK_ORDER[N-1] が解放される
 */
export const UNLOCK_ORDER: string[] = [
  'gardan', // ステージ1: ドルグ
  'morsu', // ステージ2: ユグド
  'roona', // ステージ3: シエル
  'balga', // ステージ4: ゲンブ
  'zephyr', // ステージ5: カイ
  'graon', // ステージ6: ボルグ
  'igna', // ステージ7: アーシュ
];

/**
 * クリアしたステージ数に基づいて解放済みモンスターIDの一覧を返す
 */
export function getUnlockedMonsterIds(clearedStages: number): string[] {
  const count = Math.max(0, Math.min(clearedStages, UNLOCK_ORDER.length));
  return [INITIAL_MONSTER_ID, ...UNLOCK_ORDER.slice(0, count)];
}

/**
 * 指定モンスターが解放済みかどうかを返す
 */
export function isMonsterUnlocked(monsterId: string, clearedStages: number): boolean {
  return getUnlockedMonsterIds(clearedStages).includes(monsterId);
}

/** グリッド列数 */
export const GRID_COLS = 4;

/** グリッド行数 */
export const GRID_ROWS = 2;

/** 魂格別テーマカラー */
export const THEME_COLORS: Record<string, string> = {
  zaag: '#c0c0c0', // 銀/白
  gardan: '#8b6914', // 茶/岩色
  roona: '#87ceeb', // 淡青/白
  zephyr: '#2e8b57', // 緑/翠
  balga: '#191970', // 紺/黒
  morsu: '#006400', // 深緑/茶
  graon: '#800080', // 紫/暗赤
  igna: '#ff4500', // 赤/橙/金
};

/** キャラ選択画面のステップ */
export type CharacterSelectStep = 'player' | 'opponent';

/** キャラ選択画面のヘッダーテキスト */
export const CHARACTER_SELECT_HEADERS = {
  player: 'キャラ選択（自分）',
  opponent: 'キャラ選択（相手）',
  default: 'キャラ選択',
} as const;

/** キャラ選択画面のボタン設定 */
export interface CharacterSelectButtonConfig {
  /** ボタンのラベル */
  label: string;
  /** 遷移先シーン */
  targetScene: SceneKey;
  /** ボタンの役割 */
  action: 'confirm' | 'back' | 'random';
}

/** キャラ選択画面のデフォルトボタン定義 */
export const CHARACTER_SELECT_BUTTONS: CharacterSelectButtonConfig[] = [
  {
    label: '決定',
    targetScene: SceneKey.BATTLE,
    action: 'confirm',
  },
  {
    label: '戻る',
    targetScene: SceneKey.MODE_SELECT,
    action: 'back',
  },
];

/**
 * 挑戦モードのヘッダーテキストを返す
 */
export function getChallengeHeader(stageNumber: number): string {
  return `挑戦モード - ステージ${stageNumber}`;
}

/**
 * ステップとモードに応じたボタン定義を返す
 */
export function getCharacterSelectButtons(
  step?: CharacterSelectStep,
  mode?: GameMode,
): CharacterSelectButtonConfig[] {
  if (mode === GameMode.CHALLENGE) {
    return [
      { label: '決定', targetScene: SceneKey.BATTLE, action: 'confirm' },
      { label: 'タイトルへ', targetScene: SceneKey.TITLE, action: 'back' },
    ];
  }
  if (mode === GameMode.FREE_CPU) {
    if (step === 'player') {
      return [
        { label: '決定', targetScene: SceneKey.CHARACTER_SELECT, action: 'confirm' },
        { label: '戻る', targetScene: SceneKey.TITLE, action: 'back' },
      ];
    }
    if (step === 'opponent') {
      return [
        { label: '決定', targetScene: SceneKey.DIFFICULTY_SELECT, action: 'confirm' },
        { label: 'ランダム', targetScene: SceneKey.DIFFICULTY_SELECT, action: 'random' },
        { label: '戻る', targetScene: SceneKey.CHARACTER_SELECT, action: 'back' },
      ];
    }
  }
  return CHARACTER_SELECT_BUTTONS;
}
