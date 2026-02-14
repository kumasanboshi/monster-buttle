import { BaseScene } from './BaseScene';
import { SceneKey } from './sceneKeys';
import { GAME_WIDTH, GAME_HEIGHT } from './gameConfig';
import { BattleResult, BattleResultType } from '../types/BattleState';
import { GameMode } from '../types/GameMode';
import {
  RESULT_LAYOUT,
  RESULT_COLORS,
  RESULT_TEXT,
  getResultButtons,
} from './resultConfig';

/** ResultSceneに渡されるデータ */
export interface ResultSceneData {
  /** バトル結果 */
  battleResult?: BattleResult;
  /** ゲームモード */
  mode?: GameMode;
}

/**
 * リザルト画面シーン
 *
 * 勝敗表示、残りHP表示、遷移ボタンを表示する。
 */
export class ResultScene extends BaseScene {
  private gameMode?: GameMode;

  constructor() {
    super(SceneKey.RESULT);
  }

  create(data?: ResultSceneData): void {
    const battleResult = data?.battleResult;
    this.gameMode = data?.mode;

    this.createResultDisplay(battleResult?.resultType);
    this.createHpDisplay(battleResult);
    this.createButtons();
  }

  /** 勝敗テキストを表示 */
  private createResultDisplay(resultType?: BattleResultType): void {
    const text = resultType ? RESULT_TEXT[resultType] : '---';
    const color = this.getResultColor(resultType);

    this.add
      .text(GAME_WIDTH / 2, RESULT_LAYOUT.resultTextY, text, {
        fontSize: '48px',
        color,
        fontFamily: 'Arial, sans-serif',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
  }

  /** 残りHP表示 */
  private createHpDisplay(battleResult?: BattleResult): void {
    if (!battleResult) return;

    const { finalState } = battleResult;
    const playerHp = finalState.player1.currentHp;
    const enemyHp = finalState.player2.currentHp;

    this.add
      .text(
        GAME_WIDTH / 2,
        RESULT_LAYOUT.hpDisplayY,
        `あなた HP: ${playerHp}　　相手 HP: ${enemyHp}`,
        {
          fontSize: '20px',
          color: RESULT_COLORS.textColor,
          fontFamily: 'Arial, sans-serif',
        }
      )
      .setOrigin(0.5);
  }

  /** ボタンを生成 */
  private createButtons(): void {
    const buttons = getResultButtons(this.gameMode);

    buttons.forEach((buttonConfig, index) => {
      const y = RESULT_LAYOUT.buttonStartY + index * RESULT_LAYOUT.buttonSpacing;

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
        this.handleButtonClick(buttonConfig.targetScene);
      });
    });
  }

  /** ボタンクリック処理 */
  private handleButtonClick(targetScene: SceneKey): void {
    if (targetScene === SceneKey.CHARACTER_SELECT && this.gameMode === GameMode.FREE_CPU) {
      this.transitionTo(targetScene, {
        mode: GameMode.FREE_CPU,
        step: 'player',
      });
    } else {
      this.transitionTo(targetScene);
    }
  }

  /** 結果タイプに応じた色文字列を返す */
  private getResultColor(resultType?: BattleResultType): string {
    if (!resultType) return RESULT_COLORS.textColor;

    const colorMap: Record<BattleResultType, number> = {
      [BattleResultType.PLAYER1_WIN]: RESULT_COLORS.winColor,
      [BattleResultType.PLAYER2_WIN]: RESULT_COLORS.loseColor,
      [BattleResultType.DRAW]: RESULT_COLORS.drawColor,
    };

    const numColor = colorMap[resultType];
    return `#${numColor.toString(16).padStart(6, '0')}`;
  }
}
