import { BaseScene } from './BaseScene';
import { SceneKey } from './sceneKeys';
import { GAME_WIDTH, GAME_HEIGHT } from './gameConfig';
import {
  GRID_COLS,
  GRID_ROWS,
  THEME_COLORS,
  CHARACTER_SELECT_BUTTONS,
  getUnlockedMonsterIds,
} from './characterSelectConfig';
import { MONSTER_DATABASE } from '../constants/monsters';
import { Monster } from '../types/Monster';

/**
 * キャラ選択画面シーン
 *
 * 8魂格の選択グリッド、ロック表示、パラメータ表示、決定/戻るボタンを表示する。
 */
export class CharacterSelectScene extends BaseScene {
  private selectedMonsterId: string | null = null;
  private parameterTexts: Phaser.GameObjects.Text[] = [];
  private gridCells: Phaser.GameObjects.Container[] = [];

  constructor() {
    super(SceneKey.CHARACTER_SELECT);
  }

  create(data?: { mode?: string; clearedStages?: number }): void {
    const clearedStages = data?.clearedStages ?? 7;
    const unlockedIds = getUnlockedMonsterIds(clearedStages);

    this.createHeader();
    this.createGrid(unlockedIds);
    this.createParameterPanel();
    this.createButtons();

    // 初期選択（最初の解放済みキャラ）
    this.selectMonster(unlockedIds[0]);
  }

  private createHeader(): void {
    this.add
      .text(GAME_WIDTH / 2, 30, 'キャラ選択', {
        fontSize: '32px',
        color: '#ffffff',
        fontFamily: 'Arial, sans-serif',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
  }

  private createGrid(unlockedIds: string[]): void {
    const gridStartX = 50;
    const gridStartY = 80;
    const cellWidth = (GAME_WIDTH - 100 - 250) / GRID_COLS;
    const cellHeight = 110;

    MONSTER_DATABASE.forEach((monster, index) => {
      const col = index % GRID_COLS;
      const row = Math.floor(index / GRID_COLS);
      const x = gridStartX + col * cellWidth + cellWidth / 2;
      const y = gridStartY + row * cellHeight + cellHeight / 2;
      const isUnlocked = unlockedIds.includes(monster.id);

      const container = this.add.container(x, y);

      // 背景
      const bg = this.add
        .rectangle(0, 0, cellWidth - 10, cellHeight - 10, isUnlocked ? 0x333355 : 0x1a1a1a)
        .setStrokeStyle(2, isUnlocked ? 0x666699 : 0x333333);
      container.add(bg);

      if (isUnlocked) {
        // キャラ名
        const nameText = this.add
          .text(0, -20, monster.name, {
            fontSize: '18px',
            color: THEME_COLORS[monster.id] || '#ffffff',
            fontFamily: 'Arial, sans-serif',
            fontStyle: 'bold',
          })
          .setOrigin(0.5);
        container.add(nameText);

        // 魂格名
        const speciesText = this.add
          .text(0, 5, monster.species, {
            fontSize: '14px',
            color: '#aaaaaa',
            fontFamily: 'Arial, sans-serif',
          })
          .setOrigin(0.5);
        container.add(speciesText);

        // HP表示
        const hpText = this.add
          .text(0, 25, `HP:${monster.stats.hp}`, {
            fontSize: '12px',
            color: '#88ff88',
            fontFamily: 'Arial, sans-serif',
          })
          .setOrigin(0.5);
        container.add(hpText);

        // インタラクティブ設定
        bg.setInteractive({ useHandCursor: true });
        bg.on('pointerdown', () => this.selectMonster(monster.id));
        bg.on('pointerover', () => bg.setFillStyle(0x444466));
        bg.on('pointerout', () => {
          bg.setFillStyle(this.selectedMonsterId === monster.id ? 0x555577 : 0x333355);
        });
      } else {
        // ロック表示
        const lockText = this.add
          .text(0, -10, '🔒', {
            fontSize: '24px',
          })
          .setOrigin(0.5);
        container.add(lockText);

        const lockedLabel = this.add
          .text(0, 20, '未解放', {
            fontSize: '12px',
            color: '#555555',
            fontFamily: 'Arial, sans-serif',
          })
          .setOrigin(0.5);
        container.add(lockedLabel);
      }

      this.gridCells.push(container);
    });
  }

  private createParameterPanel(): void {
    const panelX = GAME_WIDTH - 220;
    const panelY = 80;

    this.add
      .rectangle(panelX + 100, panelY + 120, 220, 260, 0x222244)
      .setStrokeStyle(2, 0x444488);

    this.add
      .text(panelX + 100, panelY + 5, 'パラメータ', {
        fontSize: '18px',
        color: '#ffffff',
        fontFamily: 'Arial, sans-serif',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
  }

  private createButtons(): void {
    const buttonY = GAME_HEIGHT - 50;
    const buttonSpacing = 200;

    CHARACTER_SELECT_BUTTONS.forEach((buttonConfig, index) => {
      const x = GAME_WIDTH / 2 + (index - 0.5) * buttonSpacing;

      const text = this.add
        .text(x, buttonY, buttonConfig.label, {
          fontSize: '24px',
          color: buttonConfig.action === 'confirm' ? '#88ff88' : '#cccccc',
          fontFamily: 'Arial, sans-serif',
        })
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true });

      text.on('pointerover', () => text.setScale(1.1));
      text.on('pointerout', () => text.setScale(1.0));

      text.on('pointerdown', () => {
        if (buttonConfig.action === 'confirm' && this.selectedMonsterId) {
          this.transitionTo(buttonConfig.targetScene, {
            monsterId: this.selectedMonsterId,
          });
        } else if (buttonConfig.action === 'back') {
          this.transitionTo(buttonConfig.targetScene);
        }
      });
    });
  }

  private selectMonster(monsterId: string): void {
    this.selectedMonsterId = monsterId;
    this.updateParameterDisplay(monsterId);
    this.updateGridSelection(monsterId);
  }

  private updateParameterDisplay(monsterId: string): void {
    // 既存のパラメータテキストを削除
    this.parameterTexts.forEach((t) => t.destroy());
    this.parameterTexts = [];

    const monster = MONSTER_DATABASE.find((m) => m.id === monsterId);
    if (!monster) return;

    const panelX = GAME_WIDTH - 220;
    const panelY = 105;
    const lineHeight = 25;

    const lines = [
      { label: monster.name, color: THEME_COLORS[monster.id] || '#ffffff' },
      { label: `魂格: ${monster.species}`, color: '#aaaaaa' },
      { label: `HP: ${monster.stats.hp}`, color: '#88ff88' },
      { label: `腕力: ${monster.stats.strength}`, color: '#ff8888' },
      { label: `特殊: ${monster.stats.special}`, color: '#8888ff' },
      { label: `素早さ: ${monster.stats.speed}`, color: '#ffff88' },
      { label: `丈夫さ: ${monster.stats.toughness}`, color: '#88ffff' },
      { label: `特殊回数: ${monster.stats.specialAttackCount}`, color: '#ff88ff' },
      { label: `武器: ${monster.weapon.name}`, color: '#cccccc' },
    ];

    lines.forEach((line, i) => {
      const text = this.add
        .text(panelX + 10, panelY + i * lineHeight, line.label, {
          fontSize: '14px',
          color: line.color,
          fontFamily: 'Arial, sans-serif',
        });
      this.parameterTexts.push(text);
    });
  }

  private updateGridSelection(monsterId: string): void {
    MONSTER_DATABASE.forEach((monster, index) => {
      const container = this.gridCells[index];
      if (!container) return;
      const bg = container.list[0] as Phaser.GameObjects.Rectangle;
      if (bg && bg.input) {
        bg.setFillStyle(monster.id === monsterId ? 0x555577 : 0x333355);
        bg.setStrokeStyle(2, monster.id === monsterId ? 0xaaaaff : 0x666699);
      }
    });
  }
}
