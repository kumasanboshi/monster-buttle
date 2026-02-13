import { BaseScene } from './BaseScene';
import { SceneKey } from './sceneKeys';
import { GAME_WIDTH } from './gameConfig';
import {
  BATTLE_LAYOUT,
  BATTLE_COLORS,
  BATTLE_INITIAL,
  DISTANCE_LABELS,
  STANCE_LABELS,
  DISTANCE_CHARACTER_POSITIONS,
  formatTime,
  clampHp,
} from './battleConfig';
import { DistanceType } from '../types/Distance';
import { StanceType } from '../types/Stance';
import { Monster } from '../types/Monster';
import { MONSTER_DATABASE, getMonsterById } from '../constants/monsters';
import { INITIAL_MONSTER_ID } from './characterSelectConfig';

/**
 * バトル画面シーン（基盤）
 *
 * HPバー、キャラ表示、距離表示、残り時間、スタンス表示を管理する。
 * コマンド選択UIは別issueで実装。
 */
export class BattleScene extends BaseScene {
  // モンスターデータ
  private playerMonster!: Monster;
  private enemyMonster!: Monster;

  // バトル状態
  private currentDistance!: DistanceType;
  private currentPlayerStance!: StanceType;
  private currentEnemyStance!: StanceType;
  private remainingTime!: number;
  private playerCurrentHp!: number;
  private enemyCurrentHp!: number;

  // UIオブジェクト - HPバー
  private playerHpBarBg!: Phaser.GameObjects.Rectangle;
  private playerHpBarFill!: Phaser.GameObjects.Rectangle;
  private playerHpText!: Phaser.GameObjects.Text;
  private enemyHpBarBg!: Phaser.GameObjects.Rectangle;
  private enemyHpBarFill!: Phaser.GameObjects.Rectangle;
  private enemyHpText!: Phaser.GameObjects.Text;

  // UIオブジェクト - キャラ表示
  private playerCharacterText!: Phaser.GameObjects.Text;
  private enemyCharacterText!: Phaser.GameObjects.Text;

  // UIオブジェクト - ステータス
  private distanceText!: Phaser.GameObjects.Text;
  private timeText!: Phaser.GameObjects.Text;
  private playerStanceText!: Phaser.GameObjects.Text;
  private enemyStanceText!: Phaser.GameObjects.Text;

  constructor() {
    super(SceneKey.BATTLE);
  }

  create(data?: { monsterId?: string }): void {
    // モンスター取得
    const playerMonsterId = data?.monsterId || INITIAL_MONSTER_ID;
    this.playerMonster = getMonsterById(playerMonsterId) || getMonsterById(INITIAL_MONSTER_ID)!;
    this.enemyMonster = this.selectRandomEnemy(this.playerMonster.id);

    // 初期状態設定
    this.currentDistance = BATTLE_INITIAL.initialDistance;
    this.currentPlayerStance = BATTLE_INITIAL.initialStance;
    this.currentEnemyStance = BATTLE_INITIAL.initialStance;
    this.remainingTime = BATTLE_INITIAL.initialTime;
    this.playerCurrentHp = this.playerMonster.stats.hp;
    this.enemyCurrentHp = this.enemyMonster.stats.hp;

    // UI生成
    this.createHpBars();
    this.createCharacterDisplays();
    this.createStatusDisplays();
  }

  private selectRandomEnemy(excludeId: string): Monster {
    const candidates = MONSTER_DATABASE.filter((m) => m.id !== excludeId);
    if (candidates.length === 0) {
      return MONSTER_DATABASE[0];
    }
    const index = Math.floor(Math.random() * candidates.length);
    return candidates[index];
  }

  private createHpBars(): void {
    const { hpBarY, hpBarWidth, hpBarHeight, playerHpBarX, enemyHpBarX } = BATTLE_LAYOUT;

    // プレイヤーHPバー
    this.playerHpBarBg = this.add.rectangle(
      playerHpBarX + hpBarWidth / 2,
      hpBarY + hpBarHeight / 2,
      hpBarWidth,
      hpBarHeight,
      BATTLE_COLORS.hpBarBg
    );
    this.playerHpBarFill = this.add.rectangle(
      playerHpBarX + hpBarWidth / 2,
      hpBarY + hpBarHeight / 2,
      hpBarWidth,
      hpBarHeight,
      BATTLE_COLORS.playerHpBar
    );
    this.playerHpText = this.add
      .text(playerHpBarX + hpBarWidth / 2, hpBarY + hpBarHeight + 8, '', {
        fontSize: '14px',
        color: '#ffffff',
        fontFamily: 'Arial, sans-serif',
      })
      .setOrigin(0.5, 0);
    // プレイヤー名
    this.add
      .text(playerHpBarX, hpBarY - 8, this.playerMonster.name, {
        fontSize: '16px',
        color: '#ffffff',
        fontFamily: 'Arial, sans-serif',
        fontStyle: 'bold',
      })
      .setOrigin(0, 1);

    // 敵HPバー
    this.enemyHpBarBg = this.add.rectangle(
      enemyHpBarX + hpBarWidth / 2,
      hpBarY + hpBarHeight / 2,
      hpBarWidth,
      hpBarHeight,
      BATTLE_COLORS.hpBarBg
    );
    this.enemyHpBarFill = this.add.rectangle(
      enemyHpBarX + hpBarWidth / 2,
      hpBarY + hpBarHeight / 2,
      hpBarWidth,
      hpBarHeight,
      BATTLE_COLORS.enemyHpBar
    );
    this.enemyHpText = this.add
      .text(enemyHpBarX + hpBarWidth / 2, hpBarY + hpBarHeight + 8, '', {
        fontSize: '14px',
        color: '#ffffff',
        fontFamily: 'Arial, sans-serif',
      })
      .setOrigin(0.5, 0);
    // 敵名
    this.add
      .text(enemyHpBarX + hpBarWidth, hpBarY - 8, this.enemyMonster.name, {
        fontSize: '16px',
        color: '#ffffff',
        fontFamily: 'Arial, sans-serif',
        fontStyle: 'bold',
      })
      .setOrigin(1, 1);

    // HP表示を初期値で更新
    this.updateHpDisplay();
  }

  private createCharacterDisplays(): void {
    const { characterY } = BATTLE_LAYOUT;
    const positions = DISTANCE_CHARACTER_POSITIONS[this.currentDistance];

    this.playerCharacterText = this.add
      .text(positions.playerX, characterY, this.playerMonster.name, {
        fontSize: '28px',
        color: '#88ccff',
        fontFamily: 'Arial, sans-serif',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    this.enemyCharacterText = this.add
      .text(positions.enemyX, characterY, this.enemyMonster.name, {
        fontSize: '28px',
        color: '#ff8888',
        fontFamily: 'Arial, sans-serif',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    // 距離矢印
    this.add
      .text(GAME_WIDTH / 2, characterY + 40, '← 距離 →', {
        fontSize: '14px',
        color: '#888888',
        fontFamily: 'Arial, sans-serif',
      })
      .setOrigin(0.5);
  }

  private createStatusDisplays(): void {
    const { statusY } = BATTLE_LAYOUT;

    // 距離表示
    this.distanceText = this.add
      .text(GAME_WIDTH / 2, statusY, '', {
        fontSize: '20px',
        color: BATTLE_COLORS.distanceText,
        fontFamily: 'Arial, sans-serif',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    // 残り時間
    this.timeText = this.add
      .text(GAME_WIDTH / 2, statusY + 35, '', {
        fontSize: '24px',
        color: BATTLE_COLORS.timeText,
        fontFamily: 'Arial, sans-serif',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    // プレイヤースタンス
    this.playerStanceText = this.add
      .text(BATTLE_LAYOUT.playerHpBarX, statusY, '', {
        fontSize: '16px',
        color: BATTLE_COLORS.playerStanceText,
        fontFamily: 'Arial, sans-serif',
      })
      .setOrigin(0, 0.5);

    // 敵スタンス
    this.enemyStanceText = this.add
      .text(GAME_WIDTH - BATTLE_LAYOUT.playerHpBarX, statusY, '', {
        fontSize: '16px',
        color: BATTLE_COLORS.enemyStanceText,
        fontFamily: 'Arial, sans-serif',
      })
      .setOrigin(1, 0.5);

    // 初期値で表示更新
    this.updateDistanceDisplay();
    this.updateTimeDisplay();
    this.updateStanceDisplay();
  }

  // --- 表示更新メソッド（内部用） ---

  private updateHpDisplay(): void {
    const { hpBarWidth } = BATTLE_LAYOUT;

    const playerRatio = this.playerCurrentHp / this.playerMonster.stats.hp;
    this.playerHpBarFill.setScale(playerRatio, 1);
    this.playerHpBarFill.x =
      BATTLE_LAYOUT.playerHpBarX + (hpBarWidth * playerRatio) / 2;
    this.playerHpText.setText(
      `${this.playerCurrentHp} / ${this.playerMonster.stats.hp}`
    );

    const enemyRatio = this.enemyCurrentHp / this.enemyMonster.stats.hp;
    this.enemyHpBarFill.setScale(enemyRatio, 1);
    this.enemyHpBarFill.x =
      BATTLE_LAYOUT.enemyHpBarX + hpBarWidth - (hpBarWidth * enemyRatio) / 2;
    this.enemyHpText.setText(
      `${this.enemyCurrentHp} / ${this.enemyMonster.stats.hp}`
    );
  }

  private updateDistanceDisplay(): void {
    this.distanceText.setText(`距離: ${DISTANCE_LABELS[this.currentDistance]}`);

    const positions = DISTANCE_CHARACTER_POSITIONS[this.currentDistance];
    this.playerCharacterText.x = positions.playerX;
    this.enemyCharacterText.x = positions.enemyX;
  }

  private updateTimeDisplay(): void {
    this.timeText.setText(formatTime(this.remainingTime));
  }

  private updateStanceDisplay(): void {
    this.playerStanceText.setText(
      `スタンス: ${STANCE_LABELS[this.currentPlayerStance]}`
    );
    this.enemyStanceText.setText(
      `スタンス: ${STANCE_LABELS[this.currentEnemyStance]}`
    );
  }

  // --- 公開メソッド（後続issueから呼び出し可能） ---

  /** HP更新 */
  public updateHp(playerHp: number, enemyHp: number): void {
    this.playerCurrentHp = clampHp(playerHp, this.playerMonster.stats.hp);
    this.enemyCurrentHp = clampHp(enemyHp, this.enemyMonster.stats.hp);
    this.updateHpDisplay();
  }

  /** 距離更新 */
  public updateDistance(distance: DistanceType): void {
    this.currentDistance = distance;
    this.updateDistanceDisplay();
  }

  /** スタンス更新 */
  public updateStance(playerStance: StanceType, enemyStance: StanceType): void {
    this.currentPlayerStance = playerStance;
    this.currentEnemyStance = enemyStance;
    this.updateStanceDisplay();
  }

  /** 残り時間更新 */
  public updateTime(time: number): void {
    this.remainingTime = Math.max(0, time);
    this.updateTimeDisplay();
  }
}
