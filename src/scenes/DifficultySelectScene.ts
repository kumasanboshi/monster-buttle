import { BaseScene } from './BaseScene';
import { SceneKey } from './sceneKeys';
import { GAME_WIDTH } from './gameConfig';
import { GameMode } from '../types/GameMode';
import { AILevel } from '../ai/types';
import { MONSTER_DATABASE } from '../constants/monsters';
import {
  CPU_DIFFICULTY_OPTIONS,
  DIFFICULTY_SELECT_LAYOUT,
  DIFFICULTY_SELECT_LABELS,
} from './difficultySelectConfig';

/** DifficultySelectSceneに渡されるデータ */
export interface DifficultySelectSceneData {
  mode?: GameMode;
  playerMonsterId?: string;
  enemyMonsterId?: string | null;
}

/**
 * CPU難易度選択画面シーン
 *
 * 4段階の難易度ボタンと戻るボタンを表示する。
 */
export class DifficultySelectScene extends BaseScene {
  constructor() {
    super(SceneKey.DIFFICULTY_SELECT);
  }

  create(data?: DifficultySelectSceneData): void {
    const mode = data?.mode ?? GameMode.FREE_CPU;
    const playerMonsterId = data?.playerMonsterId ?? '';
    const enemyMonsterId = data?.enemyMonsterId ?? null;

    this.createTitle();
    this.createDifficultyButtons(mode, playerMonsterId, enemyMonsterId);
    this.createBackButton(mode, playerMonsterId);
  }

  private createTitle(): void {
    this.add
      .text(GAME_WIDTH / 2, DIFFICULTY_SELECT_LAYOUT.titleY, DIFFICULTY_SELECT_LABELS.title, {
        fontSize: '40px',
        color: '#ffffff',
        fontFamily: 'Arial, sans-serif',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
  }

  private createDifficultyButtons(
    mode: GameMode,
    playerMonsterId: string,
    enemyMonsterId: string | null,
  ): void {
    CPU_DIFFICULTY_OPTIONS.forEach((option, index) => {
      const y = DIFFICULTY_SELECT_LAYOUT.buttonStartY + index * DIFFICULTY_SELECT_LAYOUT.buttonSpacing;

      const text = this.add
        .text(GAME_WIDTH / 2, y, option.label, {
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
        const resolvedEnemyId = enemyMonsterId ?? this.selectRandomEnemy(playerMonsterId);
        this.transitionTo(SceneKey.BATTLE, {
          monsterId: playerMonsterId,
          enemyMonsterId: resolvedEnemyId,
          aiLevel: option.aiLevel,
          mode,
        });
      });
    });
  }

  private createBackButton(mode: GameMode, playerMonsterId: string): void {
    const text = this.add
      .text(GAME_WIDTH / 2, DIFFICULTY_SELECT_LAYOUT.backButtonY, DIFFICULTY_SELECT_LABELS.back, {
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
      this.transitionTo(SceneKey.CHARACTER_SELECT, {
        mode,
        step: 'opponent',
        playerMonsterId,
      });
    });
  }

  private selectRandomEnemy(excludeId: string): string {
    const candidates = MONSTER_DATABASE.filter((m) => m.id !== excludeId);
    const index = Math.floor(Math.random() * candidates.length);
    return candidates[index].id;
  }
}
