import { TutorialManager } from '../../battle/TutorialManager';
import { GameMode } from '../../types/GameMode';
import { CommandType, TurnCommands } from '../../types/Command';
import { CommandSelectionManager } from '../../battle/CommandSelectionManager';
import { BattleState } from '../../types/BattleState';
import { DistanceType } from '../../types/Distance';
import { StanceType } from '../../types/Stance';
import { getMonsterById } from '../../constants/monsters';
import { selectCommands, AILevel } from '../../ai';
import {
  TUTORIAL_STAGE_NUMBER,
  TUTORIAL_TURNS,
  TUTORIAL_FREE_BATTLE_MESSAGE,
} from '../../constants/tutorialConfig';

/**
 * BattleScene チュートリアル統合テスト
 *
 * BattleScene は Phaser シーンのため直接テストしにくいが、
 * チュートリアルデータフローの仕様を検証する。
 */

/** テスト用のバトル状態を生成 */
function createTestBattleState(turn: number): BattleState {
  return {
    player1: {
      monsterId: 'zaag',
      currentHp: 100,
      currentStance: StanceType.NORMAL,
      remainingSpecialCount: 3,
      usedReflectCount: 0,
    },
    player2: {
      monsterId: 'gardan',
      currentHp: 100,
      currentStance: StanceType.NORMAL,
      remainingSpecialCount: 3,
      usedReflectCount: 0,
    },
    currentDistance: DistanceType.NEAR,
    currentTurn: turn,
    remainingTime: 10,
    isFinished: false,
  };
}

describe('BattleScene チュートリアル統合', () => {
  describe('チュートリアルモード判定', () => {
    it('CHALLENGE+ステージ1でチュートリアルが有効になること', () => {
      const manager = new TutorialManager(TUTORIAL_STAGE_NUMBER, GameMode.CHALLENGE);
      expect(manager.isTutorial()).toBe(true);
    });

    it('CHALLENGE+ステージ2以降でチュートリアルが無効であること', () => {
      for (let stage = 2; stage <= 8; stage++) {
        const manager = new TutorialManager(stage, GameMode.CHALLENGE);
        expect(manager.isTutorial()).toBe(false);
      }
    });
  });

  describe('固定ターンのコマンドフロー（ターン1〜5）', () => {
    let tutorialManager: TutorialManager;

    beforeEach(() => {
      tutorialManager = new TutorialManager(TUTORIAL_STAGE_NUMBER, GameMode.CHALLENGE);
    });

    it('固定ターンではプレイヤーコマンドがTutorialManagerから取得されること', () => {
      for (let turn = 1; turn <= 5; turn++) {
        const playerCmds = tutorialManager.getPlayerCommands(turn);
        expect(playerCmds).not.toBeNull();
        expect(playerCmds!.first.type).toBeDefined();
        expect(playerCmds!.second.type).toBeDefined();
      }
    });

    it('固定ターンでは敵コマンドがTutorialManagerから取得されること（AI不使用）', () => {
      for (let turn = 1; turn <= 5; turn++) {
        const enemyCmds = tutorialManager.getEnemyCommands(turn);
        expect(enemyCmds).not.toBeNull();
        expect(enemyCmds!.first.type).toBeDefined();
        expect(enemyCmds!.second.type).toBeDefined();
      }
    });

    it('固定コマンドをCommandSelectionManagerに投入して選択状態を確認できること', () => {
      const state = createTestBattleState(1);
      const monster = getMonsterById('zaag')!;
      const cmdManager = new CommandSelectionManager(state, 'player1', monster);

      // ターン1の固定コマンド: ADVANCE, ADVANCE
      const playerCmds = tutorialManager.getPlayerCommands(1)!;
      cmdManager.selectCommand(playerCmds.first.type);
      cmdManager.selectCommand(playerCmds.second.type);

      expect(cmdManager.canConfirm()).toBe(true);
      const confirmed = cmdManager.confirmSelection();
      expect(confirmed).toEqual(playerCmds);
    });
  });

  describe('自由ターンへの移行（ターン6以降）', () => {
    let tutorialManager: TutorialManager;

    beforeEach(() => {
      tutorialManager = new TutorialManager(TUTORIAL_STAGE_NUMBER, GameMode.CHALLENGE);
    });

    it('ターン6では固定コマンドがnullになること', () => {
      expect(tutorialManager.getPlayerCommands(6)).toBeNull();
      expect(tutorialManager.getEnemyCommands(6)).toBeNull();
    });

    it('ターン6ではAIによるコマンド生成が使用されること', () => {
      const state = createTestBattleState(6);
      const monster = getMonsterById('gardan')!;

      // ターン6以降は通常のAIコマンド生成
      const enemyCmds = selectCommands(state, 'player2', monster, AILevel.LV1);
      expect(enemyCmds.first.type).toBeDefined();
      expect(enemyCmds.second.type).toBeDefined();
    });

    it('ターン6のポップアップメッセージが初回のみ表示されること', () => {
      expect(tutorialManager.getPopupMessage(6)).toBe(TUTORIAL_FREE_BATTLE_MESSAGE);
      tutorialManager.markFreeBattleMessageShown();
      expect(tutorialManager.getPopupMessage(6)).toBeNull();
    });
  });

  describe('ポップアップメッセージのシーケンス', () => {
    it('ターン1〜6のメッセージが正しい順序で取得できること', () => {
      const manager = new TutorialManager(TUTORIAL_STAGE_NUMBER, GameMode.CHALLENGE);
      const expectedMessages = [
        '前進で距離を詰めよう',
        '武器攻撃で攻撃しよう',
        '特殊攻撃は距離に関係なく当たる',
        'リフレクターで特殊攻撃を跳ね返せ',
        'スタンス切替で攻撃力UP',
        TUTORIAL_FREE_BATTLE_MESSAGE,
      ];

      for (let turn = 1; turn <= 6; turn++) {
        expect(manager.getPopupMessage(turn)).toBe(expectedMessages[turn - 1]);
      }
    });
  });
});
