import Phaser from 'phaser';
import { SceneKey } from './sceneKeys';
import { isValidTransition } from './sceneTransitions';

/**
 * 全シーン共通の基底クラス
 * シーン遷移のバリデーションやユーティリティを提供する。
 */
export abstract class BaseScene extends Phaser.Scene {
  constructor(key: SceneKey) {
    super({ key });
  }

  /**
   * 遷移ルールを検証して別のシーンへ遷移する
   */
  protected transitionTo(to: SceneKey, data?: object): void {
    const from = this.scene.key as SceneKey;
    if (!isValidTransition(from, to)) {
      console.warn(`無効なシーン遷移: ${from} → ${to}`);
      return;
    }
    this.scene.start(to, data);
  }
}
