/**
 * シーンモジュール（純粋ロジック）
 *
 * テスト可能なシーン関連の定数・ユーティリティをエクスポート。
 * Phaser依存のシーンクラスは各ファイルから直接インポートすること。
 */

export { SceneKey, ALL_SCENE_KEYS } from './sceneKeys';

export type { SceneTransition } from './sceneTransitions';
export { SCENE_TRANSITIONS, getAvailableTransitions, isValidTransition } from './sceneTransitions';

export { GAME_WIDTH, GAME_HEIGHT, DEFAULT_GAME_CONFIG } from './gameConfig';
export type { GameConfigValues } from './gameConfig';

export {
  AssetType,
  ASSET_MANIFEST,
  getAssetsByType,
  getAssetByKey,
  validateManifest,
} from './assetManifest';
export type { AssetEntry, SpritesheetAssetEntry, AssetManifest } from './assetManifest';

export { TITLE_TEXT, TITLE_BUTTONS } from './titleConfig';
export type { TitleButtonConfig } from './titleConfig';

export {
  ModeSelectState,
  MODE_SELECT_LAYOUT,
  MODE_SELECT_LABELS,
  MODE_SELECT_COLORS,
  ERROR_MESSAGES,
} from './modeSelectConfig';

export {
  INITIAL_MONSTER_ID,
  UNLOCK_ORDER,
  getUnlockedMonsterIds,
  isMonsterUnlocked,
  GRID_COLS,
  GRID_ROWS,
  THEME_COLORS,
  CHARACTER_SELECT_BUTTONS,
} from './characterSelectConfig';
export type { CharacterSelectButtonConfig } from './characterSelectConfig';
