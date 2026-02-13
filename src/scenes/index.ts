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
