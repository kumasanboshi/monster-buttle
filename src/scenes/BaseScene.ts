import Phaser from 'phaser';
import { SceneKey } from './sceneKeys';
import { isValidTransition } from './sceneTransitions';
import { GAME_WIDTH, GAME_HEIGHT } from './gameConfig';
import { detectDevice } from '../utils/deviceDetector';
import { shouldShowOrientationPrompt, ORIENTATION_PROMPT_MESSAGE } from '../utils/orientationPrompt';

/**
 * 全シーン共通の基底クラス
 * シーン遷移のバリデーションやユーティリティを提供する。
 */
export abstract class BaseScene extends Phaser.Scene {
  private orientationOverlay?: Phaser.GameObjects.Rectangle;
  private orientationText?: Phaser.GameObjects.Text;
  private orientationResizeHandler?: () => void;

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

  /**
   * モバイル縦画面時の横画面推奨プロンプトを設定する
   * 各シーンのcreate()内で呼び出す
   */
  protected setupOrientationPrompt(): void {
    this.checkAndShowOrientationPrompt();

    this.orientationResizeHandler = () => {
      this.checkAndShowOrientationPrompt();
    };
    this.scale.on('resize', this.orientationResizeHandler);

    this.events.on('shutdown', () => {
      if (this.orientationResizeHandler) {
        this.scale.off('resize', this.orientationResizeHandler);
      }
      this.destroyOrientationPrompt();
    });
  }

  private checkAndShowOrientationPrompt(): void {
    const deviceInfo = detectDevice();
    if (shouldShowOrientationPrompt(deviceInfo)) {
      this.showOrientationPrompt();
    } else {
      this.destroyOrientationPrompt();
    }
  }

  private showOrientationPrompt(): void {
    if (this.orientationOverlay) return;

    this.orientationOverlay = this.add
      .rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.85)
      .setDepth(200);

    this.orientationText = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2, ORIENTATION_PROMPT_MESSAGE, {
        fontSize: '28px',
        color: '#ffffff',
        fontFamily: 'Arial, sans-serif',
        fontStyle: 'bold',
        align: 'center',
      })
      .setOrigin(0.5)
      .setDepth(201);
  }

  private destroyOrientationPrompt(): void {
    this.orientationOverlay?.destroy();
    this.orientationText?.destroy();
    this.orientationOverlay = undefined;
    this.orientationText = undefined;
  }
}
