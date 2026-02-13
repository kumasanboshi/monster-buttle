import { BaseScene } from './BaseScene';
import { SceneKey } from './sceneKeys';
import { GAME_WIDTH, GAME_HEIGHT } from './gameConfig';
import { TITLE_TEXT, TITLE_BUTTONS } from './titleConfig';

/**
 * タイトル画面シーン
 *
 * ゲームタイトルとモード選択ボタンを表示する。
 */
export class TitleScene extends BaseScene {
  constructor() {
    super(SceneKey.TITLE);
  }

  create(): void {
    this.createTitle();
    this.createButtons();
  }

  private createTitle(): void {
    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT * 0.2, TITLE_TEXT, {
        fontSize: '48px',
        color: '#ffffff',
        fontFamily: 'Arial, sans-serif',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
  }

  private createButtons(): void {
    const startY = GAME_HEIGHT * 0.45;
    const spacing = 60;

    TITLE_BUTTONS.forEach((buttonConfig, index) => {
      const y = startY + index * spacing;

      const text = this.add
        .text(GAME_WIDTH / 2, y, buttonConfig.label, {
          fontSize: '28px',
          color: '#cccccc',
          fontFamily: 'Arial, sans-serif',
        })
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true });

      text.on('pointerover', () => {
        text.setColor('#ffffff');
        text.setScale(1.1);
      });

      text.on('pointerout', () => {
        text.setColor('#cccccc');
        text.setScale(1.0);
      });

      text.on('pointerdown', () => {
        this.transitionTo(buttonConfig.targetScene, {
          mode: buttonConfig.mode,
        });
      });
    });
  }
}
