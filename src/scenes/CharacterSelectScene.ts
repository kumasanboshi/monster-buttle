import { BaseScene } from './BaseScene';
import { SceneKey } from './sceneKeys';
import { GAME_WIDTH, GAME_HEIGHT } from './gameConfig';
import {
  GRID_COLS,
  THEME_COLORS,
  getUnlockedMonsterIds,
  getCharacterSelectButtons,
  getChallengeHeader,
  CHARACTER_SELECT_HEADERS,
  CharacterSelectStep,
} from './characterSelectConfig';
import { MONSTER_DATABASE } from '../constants/monsters';
import { GameMode } from '../types/GameMode';
import { loadGameProgress } from '../utils/gameProgressManager';
import { getMonsterPortraitKey, UIImageKey, BackgroundImageKey } from '../constants/imageKeys';
import { getNextStageNumber } from '../constants/challengeConfig';

/** CharacterSelectSceneに渡されるデータ */
export interface CharacterSelectSceneData {
  mode?: GameMode;
  step?: CharacterSelectStep;
  playerMonsterId?: string;
  clearedStages?: number;
  stageNumber?: number;
}

/**
 * キャラ選択画面シーン
 *
 * 8魂格の選択グリッド、ロック表示、パラメータ表示、決定/戻るボタンを表示する。
 * FREE_CPUモードでは player/opponent の2ステップに対応。
 */
export class CharacterSelectScene extends BaseScene {
  private selectedMonsterId: string | null = null;
  private parameterTexts: Phaser.GameObjects.Text[] = [];
  private gridCells: Phaser.GameObjects.Container[] = [];
  private mode?: GameMode;
  private step?: CharacterSelectStep;
  private playerMonsterId?: string;
  private stageNumber?: number;
  private clearedStages?: number;

  constructor() {
    super(SceneKey.CHARACTER_SELECT);
  }

  create(data?: CharacterSelectSceneData): void {
    if (this.textures.exists(BackgroundImageKey.CHARACTER_SELECT)) {
      this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, BackgroundImageKey.CHARACTER_SELECT).setOrigin(0.5);
    }
    this.mode = data?.mode;
    this.step = data?.step;
    this.playerMonsterId = data?.playerMonsterId;

    // CHALLENGEモード：進捗からステージ番号を決定
    if (this.mode === GameMode.CHALLENGE) {
      const progress = loadGameProgress();
      this.clearedStages = progress.clearedStages;
      this.stageNumber = data?.stageNumber ?? getNextStageNumber(progress.clearedStages) ?? undefined;
    }

    // FREE_CPUは全キャラ解放、CHALLENGEは進捗ベース
    const clearedStages = this.mode === GameMode.FREE_CPU ? 7
      : this.mode === GameMode.CHALLENGE ? (this.clearedStages ?? 0)
      : (data?.clearedStages ?? 7);
    const unlockedIds = getUnlockedMonsterIds(clearedStages);

    this.createHeader();
    this.createGrid(unlockedIds);
    this.createParameterPanel();
    this.createButtons();

    // 初期選択（最初の解放済みキャラ）
    this.selectMonster(unlockedIds[0]);
  }

  private createHeader(): void {
    let headerText: string;
    if (this.mode === GameMode.CHALLENGE && this.stageNumber) {
      headerText = getChallengeHeader(this.stageNumber);
    } else if (this.step === 'player') {
      headerText = CHARACTER_SELECT_HEADERS.player;
    } else if (this.step === 'opponent') {
      headerText = CHARACTER_SELECT_HEADERS.opponent;
    } else {
      headerText = CHARACTER_SELECT_HEADERS.default;
    }

    this.add
      .text(GAME_WIDTH / 2, 30, headerText, {
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
        // ポートレート画像
        const portraitKey = getMonsterPortraitKey(monster.id);
        if (this.textures.exists(portraitKey)) {
          const portrait = this.add.image(0, -18, portraitKey).setOrigin(0.5);
          portrait.setScale(0.7);
          container.add(portrait);
        }

        // キャラ名
        const nameText = this.add
          .text(0, 18, monster.name, {
            fontSize: '16px',
            color: THEME_COLORS[monster.id] || '#ffffff',
            fontFamily: 'Arial, sans-serif',
            fontStyle: 'bold',
          })
          .setOrigin(0.5);
        container.add(nameText);

        // 魂格名
        const speciesText = this.add
          .text(0, 35, monster.species, {
            fontSize: '12px',
            color: '#aaaaaa',
            fontFamily: 'Arial, sans-serif',
          })
          .setOrigin(0.5);
        container.add(speciesText);

        // インタラクティブ設定
        bg.setInteractive({ useHandCursor: true });
        bg.on('pointerdown', () => this.selectMonster(monster.id));
        bg.on('pointerover', () => bg.setFillStyle(0x444466));
        bg.on('pointerout', () => {
          bg.setFillStyle(this.selectedMonsterId === monster.id ? 0x555577 : 0x333355);
        });
      } else {
        // ロックアイコン（テクスチャ生成済みならImage、なければテキスト）
        if (this.textures.exists(UIImageKey.LOCK_ICON)) {
          const lockIcon = this.add.image(0, -10, UIImageKey.LOCK_ICON).setOrigin(0.5).setDisplaySize(40, 40);
          container.add(lockIcon);
        } else {
          const lockText = this.add
            .text(0, -10, '🔒', {
              fontSize: '24px',
            })
            .setOrigin(0.5);
          container.add(lockText);
        }

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
      .rectangle(panelX + 100, panelY + 130, 220, 290, 0x222244)
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
    const buttons = getCharacterSelectButtons(this.step, this.mode);
    const buttonY = GAME_HEIGHT - 50;
    const buttonSpacing = buttons.length > 2 ? 150 : 200;

    buttons.forEach((buttonConfig, index) => {
      const centerOffset = (buttons.length - 1) / 2;
      const x = GAME_WIDTH / 2 + (index - centerOffset) * buttonSpacing;

      const color = buttonConfig.action === 'confirm' ? '#88ff88'
        : buttonConfig.action === 'random' ? '#ffcc44'
        : '#cccccc';

      const text = this.add
        .text(x, buttonY, buttonConfig.label, {
          fontSize: '24px',
          color,
          fontFamily: 'Arial, sans-serif',
        })
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true });

      text.on('pointerover', () => text.setScale(1.1));
      text.on('pointerout', () => text.setScale(1.0));

      text.on('pointerdown', () => {
        this.handleButtonClick(buttonConfig);
      });
    });
  }

  private handleButtonClick(buttonConfig: { action: string; targetScene: SceneKey }): void {
    if (buttonConfig.action === 'confirm' && this.selectedMonsterId) {
      if (this.mode === GameMode.CHALLENGE) {
        // CHALLENGE → BATTLE with stage info
        this.transitionTo(buttonConfig.targetScene, {
          monsterId: this.selectedMonsterId,
          mode: GameMode.CHALLENGE,
          stageNumber: this.stageNumber,
          clearedStages: this.clearedStages,
        });
        return;
      }
      if (this.mode === GameMode.FREE_CPU && this.step === 'player') {
        // player → opponent
        this.transitionTo(buttonConfig.targetScene, {
          mode: this.mode,
          step: 'opponent',
          playerMonsterId: this.selectedMonsterId,
        });
      } else if (this.mode === GameMode.FREE_CPU && this.step === 'opponent') {
        // opponent → difficulty
        this.transitionTo(buttonConfig.targetScene, {
          mode: this.mode,
          playerMonsterId: this.playerMonsterId,
          enemyMonsterId: this.selectedMonsterId,
        });
      } else {
        // デフォルト（既存動作）
        this.transitionTo(buttonConfig.targetScene, {
          monsterId: this.selectedMonsterId,
        });
      }
    } else if (buttonConfig.action === 'random') {
      // ランダム → difficulty with null enemy
      this.transitionTo(buttonConfig.targetScene, {
        mode: this.mode,
        playerMonsterId: this.playerMonsterId,
        enemyMonsterId: null,
      });
    } else if (buttonConfig.action === 'back') {
      if (this.mode === GameMode.FREE_CPU && this.step === 'opponent') {
        this.transitionTo(buttonConfig.targetScene, {
          mode: this.mode,
          step: 'player',
        });
      } else {
        this.transitionTo(buttonConfig.targetScene);
      }
    }
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
      { label: `武器: ${monster.weapon.name}(×${monster.weapon.multiplier})`, color: '#cccccc' },
      { label: `反射: ${monster.reflector.name}(${monster.reflector.maxReflectCount}回)`, color: '#cccccc' },
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
