import { SceneKey } from './sceneKeys';

/** ゲーム画面の基本サイズ */
export const GAME_WIDTH = 800;
export const GAME_HEIGHT = 600;

/** ゲーム設定の定数値（Phaser.Types.Core.GameConfig と同じ構造の純粋データ） */
export interface GameConfigValues {
  /** ゲーム幅（ピクセル） */
  width: number;
  /** ゲーム高さ（ピクセル） */
  height: number;
  /** 背景色 */
  backgroundColor: string;
  /** 物理エンジン使用有無 */
  physicsEnabled: boolean;
  /** 最初に起動するシーンのキー */
  initialScene: SceneKey;
  /** ピクセルアートモード（アンチエイリアスOFF） */
  pixelArt: boolean;
  /** スケールモード */
  scaleMode: 'FIT' | 'SMOOTH' | 'NONE';
  /** 自動センタリング */
  autoCenter: 'CENTER_BOTH' | 'CENTER_HORIZONTALLY' | 'NONE';
}

/** デフォルトのゲーム設定値 */
export const DEFAULT_GAME_CONFIG: GameConfigValues = {
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  backgroundColor: '#1a1a2e',
  physicsEnabled: false,
  initialScene: SceneKey.BOOT,
  pixelArt: true,
  scaleMode: 'FIT',
  autoCenter: 'CENTER_BOTH',
};
