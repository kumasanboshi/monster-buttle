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
  COMMAND_LABELS,
  COMMAND_UI_LAYOUT,
  COMMAND_UI_COLORS,
  COMMAND_BUTTON_ROWS,
  formatTime,
  clampHp,
  getCommandButtonLayout,
} from './battleConfig';
import { detectDevice } from '../utils/deviceDetector';
import { DistanceType } from '../types/Distance';
import { StanceType } from '../types/Stance';
import { CommandType } from '../types/Command';
import { BattleState, TurnResult } from '../types/BattleState';
import { Monster } from '../types/Monster';
import { TurnCommands } from '../types/Command';
import { MONSTER_DATABASE, getMonsterById } from '../constants/monsters';
import { FINAL_MONSTER_DATABASE, getMonsterWithGrownStats } from '../constants/monsterStats';
import { INITIAL_MONSTER_ID } from './characterSelectConfig';
import { getChallengeStage } from '../constants/challengeConfig';
import { CommandSelectionManager } from '../battle/CommandSelectionManager';
import { processTurn } from '../battle/turnProcessor';
import { resolveBattleEffects } from '../battle/effectResolver';
import { BattleEffectPlayer } from './BattleEffectPlayer';
import { selectCommands, AILevel } from '../ai';
import { checkVictoryAfterTurn } from '../battle/victoryCondition';
import { GameMode } from '../types/GameMode';
import { TutorialManager } from '../battle/TutorialManager';
import { GAME_HEIGHT } from './gameConfig';
import { SocketClient } from '../network/SocketClient';
import { BattleResult } from '../types/BattleState';
import { playBgm, playSe } from '../utils/audioManager';
import { AudioKey } from '../constants/audioKeys';

/** BattleSceneに渡されるデータ */
export interface BattleSceneData {
  monsterId?: string;
  enemyMonsterId?: string;
  aiLevel?: AILevel;
  mode?: GameMode;
  stageNumber?: number;
  clearedStages?: number;
  // ネットワークモード用
  isNetworkMode?: boolean;
  roomId?: string;
  socketClient?: SocketClient;
  playerNumber?: 1 | 2;
  playerMonster?: Monster;
  enemyMonster?: Monster;
  initialBattleState?: BattleState;
}

/**
 * バトル画面シーン
 *
 * HPバー、キャラ表示、距離表示、残り時間、スタンス表示、コマンド選択UIを管理する。
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

  // コマンド選択UI
  private commandManager!: CommandSelectionManager;
  private commandButtons: Map<CommandType, { bg: Phaser.GameObjects.Rectangle; text: Phaser.GameObjects.Text }> = new Map();
  private selectionText1st!: Phaser.GameObjects.Text;
  private selectionText2nd!: Phaser.GameObjects.Text;
  private confirmButtonBg!: Phaser.GameObjects.Rectangle;
  private confirmButtonText!: Phaser.GameObjects.Text;
  private cancelButtonBg!: Phaser.GameObjects.Rectangle;
  private cancelButtonText!: Phaser.GameObjects.Text;

  // バトルロジック
  private battleState!: BattleState;
  private effectPlayer!: BattleEffectPlayer;
  private turnHistory: TurnResult[] = [];
  private isPlayingEffects = false;
  private enemyAILevel: AILevel = AILevel.LV2;
  private gameMode?: GameMode;
  private stageNumber?: number;
  private clearedStages?: number;

  // ネットワークモード
  private isNetworkMode = false;
  private roomId?: string;
  private socketClient?: SocketClient;
  private playerNumber?: 1 | 2;
  private isWaitingForOpponent = false;
  private waitingText?: Phaser.GameObjects.Text;

  // チュートリアル
  private tutorialManager!: TutorialManager;
  private tutorialPopupOverlay?: Phaser.GameObjects.Rectangle;
  private tutorialPopupText?: Phaser.GameObjects.Text;
  private tutorialPopupHint?: Phaser.GameObjects.Text;

  constructor() {
    super(SceneKey.BATTLE);
  }

  create(data?: BattleSceneData): void {
    this.gameMode = data?.mode;
    this.stageNumber = data?.stageNumber;
    this.clearedStages = data?.clearedStages;

    // ネットワークモード設定
    this.isNetworkMode = data?.isNetworkMode === true;
    this.roomId = data?.roomId;
    this.socketClient = data?.socketClient;
    this.playerNumber = data?.playerNumber;
    this.isWaitingForOpponent = false;

    if (this.isNetworkMode) {
      this.setupNetworkMode(data!);
    } else if (this.gameMode === GameMode.CHALLENGE && this.stageNumber) {
      this.setupChallengeMode(data);
    } else {
      this.enemyAILevel = data?.aiLevel ?? AILevel.LV2;
      this.setupNormalMode(data);
    }

    // 初期状態設定
    if (this.isNetworkMode && data?.initialBattleState) {
      const state = data.initialBattleState;
      // Player2視点の場合、自分がplayer2、敵がplayer1
      if (this.playerNumber === 2) {
        this.currentDistance = state.currentDistance;
        this.currentPlayerStance = state.player2.currentStance;
        this.currentEnemyStance = state.player1.currentStance;
        this.remainingTime = state.remainingTime;
        this.playerCurrentHp = state.player2.currentHp;
        this.enemyCurrentHp = state.player1.currentHp;
      } else {
        this.currentDistance = state.currentDistance;
        this.currentPlayerStance = state.player1.currentStance;
        this.currentEnemyStance = state.player2.currentStance;
        this.remainingTime = state.remainingTime;
        this.playerCurrentHp = state.player1.currentHp;
        this.enemyCurrentHp = state.player2.currentHp;
      }
      this.battleState = state;
    } else {
      this.currentDistance = BATTLE_INITIAL.initialDistance;
      this.currentPlayerStance = BATTLE_INITIAL.initialStance;
      this.currentEnemyStance = BATTLE_INITIAL.initialStance;
      this.remainingTime = BATTLE_INITIAL.initialTime;
      this.playerCurrentHp = this.playerMonster.stats.hp;
      this.enemyCurrentHp = this.enemyMonster.stats.hp;
      this.battleState = this.buildBattleState();
    }

    this.turnHistory = [];
    this.isPlayingEffects = false;

    // CommandSelectionManagerを初期化
    const playerSide = this.isNetworkMode && this.playerNumber === 2 ? 'player2' : 'player1';
    this.commandManager = new CommandSelectionManager(
      this.battleState,
      playerSide,
      this.playerMonster
    );

    // UI生成
    this.createHpBars();
    this.createCharacterDisplays();
    this.createStatusDisplays();
    this.createCommandUI();

    // エフェクトプレイヤーを初期化（UI生成後）
    this.effectPlayer = new BattleEffectPlayer(this, {
      playerText: this.playerCharacterText,
      enemyText: this.enemyCharacterText,
      playerHpBarFill: this.playerHpBarFill,
      enemyHpBarFill: this.enemyHpBarFill,
    });

    // チュートリアル初期化
    this.tutorialManager = new TutorialManager(
      this.stageNumber ?? 0,
      this.gameMode ?? GameMode.FREE_CPU
    );
    this.startTutorialTurnIfNeeded(this.battleState.currentTurn);

    // ネットワークモード: イベントリスナー設定
    if (this.isNetworkMode && this.socketClient) {
      this.setupNetworkListeners();
    }

    // モバイル横画面推奨プロンプト
    this.setupOrientationPrompt();

    // バトルBGM再生
    playBgm(this.sound, AudioKey.BGM_BATTLE);
  }

  private setupChallengeMode(data?: BattleSceneData): void {
    const stage = getChallengeStage(this.stageNumber!);
    if (!stage) {
      throw new Error(`Challenge stage ${this.stageNumber} not found`);
    }

    this.enemyAILevel = stage.aiLevel;
    const growthStages = this.clearedStages ?? 0;

    // プレイヤーモンスター（成長パラメータ適用）
    const playerMonsterId = data?.monsterId || INITIAL_MONSTER_ID;
    const foundPlayer = getMonsterWithGrownStats(playerMonsterId, growthStages);
    if (!foundPlayer) {
      throw new Error(`Failed to create monster ${playerMonsterId} with growth stage ${growthStages}`);
    }
    this.playerMonster = foundPlayer;

    // 敵モンスター（成長パラメータ適用）
    const foundEnemy = getMonsterWithGrownStats(stage.enemyMonsterId, growthStages);
    if (!foundEnemy) {
      throw new Error(`Failed to create monster ${stage.enemyMonsterId} with growth stage ${growthStages}`);
    }
    this.enemyMonster = foundEnemy;
  }

  private setupNetworkMode(data: BattleSceneData): void {
    if (!data.playerMonster || !data.enemyMonster) {
      throw new Error('Network mode requires playerMonster and enemyMonster');
    }
    this.playerMonster = data.playerMonster;
    this.enemyMonster = data.enemyMonster;
  }

  private setupNormalMode(data?: BattleSceneData): void {
    // モンスター取得（FREE_CPUは最終パラメータを使用）
    const db = this.gameMode === GameMode.FREE_CPU ? FINAL_MONSTER_DATABASE : MONSTER_DATABASE;
    const playerMonsterId = data?.monsterId || INITIAL_MONSTER_ID;
    const foundPlayer = db.find((m) => m.id === playerMonsterId);
    if (!foundPlayer) {
      throw new Error(`Monster ${playerMonsterId} not found in database`);
    }
    this.playerMonster = foundPlayer;

    if (data?.enemyMonsterId) {
      const foundEnemy = db.find((m) => m.id === data.enemyMonsterId);
      this.enemyMonster = foundEnemy || this.selectRandomEnemy(this.playerMonster.id, db);
    } else {
      this.enemyMonster = this.selectRandomEnemy(this.playerMonster.id, db);
    }
  }

  private buildBattleState(): BattleState {
    return {
      player1: {
        monsterId: this.playerMonster.id,
        currentHp: this.playerCurrentHp,
        currentStance: this.currentPlayerStance,
        remainingSpecialCount: this.playerMonster.stats.specialAttackCount,
        usedReflectCount: 0,
      },
      player2: {
        monsterId: this.enemyMonster.id,
        currentHp: this.enemyCurrentHp,
        currentStance: this.currentEnemyStance,
        remainingSpecialCount: this.enemyMonster.stats.specialAttackCount,
        usedReflectCount: 0,
      },
      currentDistance: this.currentDistance,
      currentTurn: 1,
      remainingTime: this.remainingTime,
      isFinished: false,
    };
  }

  private selectRandomEnemy(excludeId: string, db: Monster[] = MONSTER_DATABASE): Monster {
    const candidates = db.filter((m) => m.id !== excludeId);
    if (candidates.length === 0) {
      return db[0];
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

  private createCommandUI(): void {
    const deviceInfo = detectDevice();
    const layout = getCommandButtonLayout(deviceInfo.isMobile);
    const { row1Y, row2Y, buttonWidth, buttonHeight, buttonSpacing, row1StartX, row2StartX } = layout;
    const stanceLabels = this.commandManager.getStanceLabels();

    // コマンドボタン生成
    COMMAND_BUTTON_ROWS.forEach((row, rowIndex) => {
      const y = rowIndex === 0 ? row1Y : row2Y;
      const startX = rowIndex === 0 ? row1StartX : row2StartX;

      row.forEach((commandType, colIndex) => {
        const x = startX + colIndex * buttonSpacing;
        let label = COMMAND_LABELS[commandType];
        if (commandType === CommandType.STANCE_A) label = stanceLabels.stanceA;
        if (commandType === CommandType.STANCE_B) label = stanceLabels.stanceB;

        const bg = this.add
          .rectangle(x, y, buttonWidth, buttonHeight, COMMAND_UI_COLORS.buttonActive)
          .setInteractive({ useHandCursor: true })
          .on('pointerdown', () => this.onCommandClick(commandType));

        const text = this.add
          .text(x, y, label, {
            fontSize: '14px',
            color: COMMAND_UI_COLORS.buttonTextActive,
            fontFamily: 'Arial, sans-serif',
            fontStyle: 'bold',
          })
          .setOrigin(0.5);

        this.commandButtons.set(commandType, { bg, text });
      });
    });

    // キャンセルボタン
    this.cancelButtonBg = this.add
      .rectangle(
        layout.cancelX,
        layout.cancelY,
        buttonWidth,
        buttonHeight,
        COMMAND_UI_COLORS.cancelButton
      )
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.onCancelClick());

    this.cancelButtonText = this.add
      .text(layout.cancelX, layout.cancelY, '戻す', {
        fontSize: '14px',
        color: '#ffffff',
        fontFamily: 'Arial, sans-serif',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    // 選択表示
    this.selectionText1st = this.add
      .text(200, layout.selectionY, '1st: ---', {
        fontSize: '16px',
        color: COMMAND_UI_COLORS.selectionText,
        fontFamily: 'Arial, sans-serif',
      })
      .setOrigin(0.5);

    this.selectionText2nd = this.add
      .text(380, layout.selectionY, '2nd: ---', {
        fontSize: '16px',
        color: COMMAND_UI_COLORS.selectionText,
        fontFamily: 'Arial, sans-serif',
      })
      .setOrigin(0.5);

    // 決定ボタン
    this.confirmButtonBg = this.add
      .rectangle(580, layout.confirmY, 100, buttonHeight, COMMAND_UI_COLORS.confirmDisabled)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.onConfirmClick());

    this.confirmButtonText = this.add
      .text(580, layout.confirmY, '決定', {
        fontSize: '16px',
        color: '#ffffff',
        fontFamily: 'Arial, sans-serif',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    // 初期状態でUI更新
    this.updateCommandUI();
  }

  private onCommandClick(command: CommandType): void {
    if (this.isPlayingEffects) return;
    if (this.isWaitingForOpponent) return;
    // チュートリアル固定ターンではコマンド変更不可
    if (this.tutorialManager.isFixedTurn(this.battleState.currentTurn)) return;

    const success = this.commandManager.selectCommand(command);
    if (success) {
      playSe(this.sound, AudioKey.SE_SELECT);
      this.updateCommandUI();
    }
  }

  private onCancelClick(): void {
    if (this.isPlayingEffects) return;
    if (this.isWaitingForOpponent) return;
    // チュートリアル固定ターンではキャンセル不可
    if (this.tutorialManager.isFixedTurn(this.battleState.currentTurn)) return;

    this.commandManager.cancelSelection();
    this.updateCommandUI();
  }

  private onConfirmClick(): void {
    if (this.isPlayingEffects) return;
    if (this.isWaitingForOpponent) return;

    const playerCommands = this.commandManager.confirmSelection();
    if (!playerCommands) return;

    // ネットワークモード: サーバーにコマンド送信
    if (this.isNetworkMode && this.socketClient && this.roomId) {
      this.socketClient.submitCommands(this.roomId, playerCommands);
      this.isWaitingForOpponent = true;
      this.setCommandUIEnabled(false);
      this.showWaitingMessage('相手のコマンド選択を待っています...');
      return;
    }

    // ローカルモード: CPU対戦処理
    this.processLocalTurn(playerCommands);
  }

  private processLocalTurn(playerCommands: TurnCommands): void {
    // チュートリアル固定ターン: TutorialManagerから敵コマンドを取得
    // 通常ターン: AIコマンド生成
    const currentTurn = this.battleState.currentTurn;
    const tutorialEnemyCmds = this.tutorialManager.getEnemyCommands(currentTurn);
    const enemyCommands = tutorialEnemyCmds ?? selectCommands(
      this.battleState,
      'player2',
      this.enemyMonster,
      this.enemyAILevel
    );

    // ターン処理
    const distanceBefore = this.battleState.currentDistance;
    const { newState, turnResult } = processTurn(
      this.battleState,
      this.playerMonster,
      this.enemyMonster,
      playerCommands,
      enemyCommands
    );

    // エフェクト解決
    const effectSequence = resolveBattleEffects(turnResult, distanceBefore);

    // エフェクト再生中はコマンド入力を無効化
    this.isPlayingEffects = true;
    this.setCommandUIEnabled(false);

    // エフェクト再生 → UI更新
    this.effectPlayer.playSequence(effectSequence).then(() => {
      this.applyTurnResult(newState, turnResult);
    }).catch((error) => {
      console.error('Effect playback error:', error);
      this.applyTurnResult(newState, turnResult);
    });
  }

  /**
   * ターン結果をUIに反映し、次のターンの準備をする
   */
  private applyTurnResult(newState: BattleState, turnResult: TurnResult): void {
    this.battleState = newState;
    this.turnHistory.push(turnResult);

    // UI更新
    this.updateHp(newState.player1.currentHp, newState.player2.currentHp);
    this.updateDistance(newState.currentDistance);
    this.updateStance(turnResult.player1StanceAfter, turnResult.player2StanceAfter);

    // 勝敗判定（processTurnで更新済みのbattleStateを使用）
    const battleResult = checkVictoryAfterTurn(this.battleState);
    if (battleResult) {
      battleResult.turnHistory = this.turnHistory;
      this.setCommandUIEnabled(false);
      this.transitionTo(SceneKey.RESULT, {
        battleResult,
        mode: this.gameMode,
        stageNumber: this.stageNumber,
        clearedStages: this.clearedStages,
        monsterId: this.playerMonster.id,
      });
      return;
    }

    this.commandManager = new CommandSelectionManager(
      this.battleState,
      'player1',
      this.playerMonster
    );

    this.isPlayingEffects = false;
    this.setCommandUIEnabled(true);
    this.updateCommandUI();

    // 次のターンのチュートリアル処理
    this.startTutorialTurnIfNeeded(this.battleState.currentTurn);
  }

  /**
   * コマンドUIの有効/無効を切り替える
   */
  private setCommandUIEnabled(enabled: boolean): void {
    this.commandButtons.forEach((button) => {
      if (enabled) {
        button.bg.setInteractive({ useHandCursor: true });
      } else {
        button.bg.disableInteractive();
      }
    });
    if (enabled) {
      this.confirmButtonBg.setInteractive({ useHandCursor: true });
      this.cancelButtonBg.setInteractive({ useHandCursor: true });
    } else {
      this.confirmButtonBg.disableInteractive();
      this.cancelButtonBg.disableInteractive();
    }
  }

  private updateCommandUI(): void {
    const selection = this.commandManager.getSelection();
    const validCommands = this.commandManager.getValidCommands();
    const stanceLabels = this.commandManager.getStanceLabels();

    // ボタンの有効/無効/選択状態を更新
    this.commandButtons.forEach((button, commandType) => {
      const isValid = validCommands.includes(commandType);
      const isSelected =
        selection.first === commandType || selection.second === commandType;

      if (!isValid) {
        button.bg.setFillStyle(COMMAND_UI_COLORS.buttonDisabled);
        button.text.setColor(COMMAND_UI_COLORS.buttonTextDisabled);
        button.bg.disableInteractive();
      } else if (isSelected) {
        button.bg.setFillStyle(COMMAND_UI_COLORS.buttonSelected);
        button.text.setColor(COMMAND_UI_COLORS.buttonTextActive);
        button.bg.setInteractive({ useHandCursor: true });
      } else {
        button.bg.setFillStyle(COMMAND_UI_COLORS.buttonActive);
        button.text.setColor(COMMAND_UI_COLORS.buttonTextActive);
        button.bg.setInteractive({ useHandCursor: true });
      }

      // スタンスボタンのラベルを動的に更新
      if (commandType === CommandType.STANCE_A) {
        button.text.setText(stanceLabels.stanceA);
      } else if (commandType === CommandType.STANCE_B) {
        button.text.setText(stanceLabels.stanceB);
      }
    });

    // 選択表示を更新
    const firstLabel = selection.first ? COMMAND_LABELS[selection.first] : '---';
    const secondLabel = selection.second ? COMMAND_LABELS[selection.second] : '---';
    this.selectionText1st.setText(`1st: ${firstLabel}`);
    this.selectionText2nd.setText(`2nd: ${secondLabel}`);

    // 決定ボタンの状態
    if (this.commandManager.canConfirm()) {
      this.confirmButtonBg.setFillStyle(COMMAND_UI_COLORS.confirmActive);
    } else {
      this.confirmButtonBg.setFillStyle(COMMAND_UI_COLORS.confirmDisabled);
    }
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

  // --- ネットワークモード ---

  private setupNetworkListeners(): void {
    if (!this.socketClient) return;

    this.socketClient.updateCallbacks({
      onTurnResult: (payload) => this.handleNetworkTurnResult(payload),
      onBattleFinished: (payload) => this.handleNetworkBattleFinished(payload),
      onOpponentDisconnected: () => this.handleOpponentDisconnected(),
      onCommandTimeout: (payload) => this.handleCommandTimeout(payload),
    });
  }

  /**
   * Player2視点用にTurnResultのplayer1/player2を入れ替える
   */
  private swapTurnResultPerspective(turnResult: TurnResult): TurnResult {
    return {
      ...turnResult,
      player1Commands: turnResult.player2Commands,
      player2Commands: turnResult.player1Commands,
      player1Damage: turnResult.player2Damage,
      player2Damage: turnResult.player1Damage,
      player1StanceAfter: turnResult.player2StanceAfter,
      player2StanceAfter: turnResult.player1StanceAfter,
      phases: turnResult.phases.map(phase => ({
        ...phase,
        player1Command: phase.player2Command,
        player2Command: phase.player1Command,
        player1Damage: phase.player2Damage,
        player2Damage: phase.player1Damage,
      })) as [typeof turnResult.phases[0], typeof turnResult.phases[1]],
    };
  }

  private handleNetworkTurnResult(payload: import('../../shared/types/SocketEvents').TurnResultPayload): void {
    if (payload.roomId !== this.roomId) return;

    this.isWaitingForOpponent = false;
    this.hideWaitingMessage();

    const { turnResult: rawTurnResult, newState } = payload;

    // Player2視点の場合、エフェクト表示のためにplayer1/player2を入れ替え
    const turnResult = this.playerNumber === 2
      ? this.swapTurnResultPerspective(rawTurnResult)
      : rawTurnResult;

    // エフェクト解決
    const distanceBefore = this.battleState.currentDistance;
    const effectSequence = resolveBattleEffects(turnResult, distanceBefore);

    // エフェクト再生中はコマンド入力を無効化
    this.isPlayingEffects = true;
    this.setCommandUIEnabled(false);

    // エフェクト再生 → UI更新
    this.effectPlayer.playSequence(effectSequence).then(() => {
      this.applyNetworkTurnResult(newState, turnResult);
    }).catch((error) => {
      console.error('Effect playback error:', error);
      this.applyNetworkTurnResult(newState, turnResult);
    });
  }

  private applyNetworkTurnResult(newState: BattleState, turnResult: TurnResult): void {
    this.battleState = newState;
    this.turnHistory.push(turnResult);

    // Player視点でHP/スタンスを更新
    if (this.playerNumber === 2) {
      this.updateHp(newState.player2.currentHp, newState.player1.currentHp);
      this.updateStance(turnResult.player2StanceAfter, turnResult.player1StanceAfter);
    } else {
      this.updateHp(newState.player1.currentHp, newState.player2.currentHp);
      this.updateStance(turnResult.player1StanceAfter, turnResult.player2StanceAfter);
    }
    this.updateDistance(newState.currentDistance);
    this.updateTime(newState.remainingTime);

    // バトル終了はサーバーからの BATTLE_FINISHED で処理するため、ここでは次ターン準備のみ
    if (!newState.isFinished) {
      const playerSide = this.playerNumber === 2 ? 'player2' : 'player1';
      this.commandManager = new CommandSelectionManager(
        this.battleState,
        playerSide,
        this.playerMonster
      );

      this.isPlayingEffects = false;
      this.setCommandUIEnabled(true);
      this.updateCommandUI();
    }
  }

  private handleNetworkBattleFinished(payload: import('../../shared/types/SocketEvents').BattleFinishedPayload): void {
    if (payload.roomId !== this.roomId) return;

    this.isWaitingForOpponent = false;
    this.hideWaitingMessage();
    this.setCommandUIEnabled(false);

    this.transitionTo(SceneKey.RESULT, {
      battleResult: payload.result,
      mode: this.gameMode,
      monsterId: this.playerMonster.id,
    });
  }

  private handleOpponentDisconnected(): void {
    this.isWaitingForOpponent = false;
    this.hideWaitingMessage();
    this.showWaitingMessage('相手が切断しました...');
    // BATTLE_FINISHED イベントで結果画面に遷移する
  }

  private handleCommandTimeout(payload: import('../../shared/types/SocketEvents').CommandTimeoutPayload): void {
    if (payload.roomId !== this.roomId) return;
    // タイムアウト通知はサーバーが自動でコマンド提出し、
    // TURN_RESULT が続けて送られるので、ここでは特別な処理は不要
  }

  private showWaitingMessage(message: string): void {
    this.hideWaitingMessage();
    this.waitingText = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2, message, {
        fontSize: '20px',
        color: '#ffffff',
        fontFamily: 'Arial, sans-serif',
        fontStyle: 'bold',
        backgroundColor: '#000000aa',
        padding: { x: 20, y: 10 },
      })
      .setOrigin(0.5)
      .setDepth(50);
  }

  private hideWaitingMessage(): void {
    this.waitingText?.destroy();
    this.waitingText = undefined;
  }

  // --- チュートリアル ---

  /**
   * チュートリアルターン開始処理
   * ポップアップ表示 → 固定コマンド自動選択
   */
  private startTutorialTurnIfNeeded(turn: number): void {
    const message = this.tutorialManager.getPopupMessage(turn);
    if (!message) return;

    // コマンドUI無効化（ポップアップ表示中）
    this.setCommandUIEnabled(false);

    this.showTutorialPopup(message, () => {
      // ターン6の自由戦闘メッセージ表示後はフラグ更新
      if (!this.tutorialManager.isFixedTurn(turn)) {
        this.tutorialManager.markFreeBattleMessageShown();
        this.setCommandUIEnabled(true);
        return;
      }

      // 固定コマンドを自動選択
      this.autoSelectTutorialCommands(turn);
      this.setCommandUIEnabled(true);
    });
  }

  /**
   * チュートリアルポップアップ表示
   */
  private showTutorialPopup(message: string, onDismiss: () => void): void {
    // 半透明オーバーレイ
    this.tutorialPopupOverlay = this.add
      .rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.6)
      .setDepth(100)
      .setInteractive();

    // メッセージテキスト
    this.tutorialPopupText = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 20, message, {
        fontSize: '24px',
        color: '#ffffff',
        fontFamily: 'Arial, sans-serif',
        fontStyle: 'bold',
        align: 'center',
        wordWrap: { width: GAME_WIDTH - 100 },
      })
      .setOrigin(0.5)
      .setDepth(101);

    // 「タップして続ける」ヒント
    this.tutorialPopupHint = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 40, 'タップして続ける', {
        fontSize: '16px',
        color: '#aaaaaa',
        fontFamily: 'Arial, sans-serif',
      })
      .setOrigin(0.5)
      .setDepth(101);

    // クリックで閉じる
    this.tutorialPopupOverlay.once('pointerdown', () => {
      this.dismissTutorialPopup();
      onDismiss();
    });
  }

  /**
   * チュートリアルポップアップを閉じる
   */
  private dismissTutorialPopup(): void {
    this.tutorialPopupOverlay?.destroy();
    this.tutorialPopupText?.destroy();
    this.tutorialPopupHint?.destroy();
    this.tutorialPopupOverlay = undefined;
    this.tutorialPopupText = undefined;
    this.tutorialPopupHint = undefined;
  }

  /**
   * チュートリアル固定コマンドを自動選択する
   */
  private autoSelectTutorialCommands(turn: number): void {
    const playerCmds = this.tutorialManager.getPlayerCommands(turn);
    if (!playerCmds) return;

    this.commandManager.selectCommand(playerCmds.first.type);
    this.commandManager.selectCommand(playerCmds.second.type);
    this.updateCommandUI();

    // 固定ターン: コマンドボタンとキャンセルを無効化し、決定のみ有効にする
    this.commandButtons.forEach((button) => {
      button.bg.disableInteractive();
    });
    this.cancelButtonBg.disableInteractive();
  }
}
