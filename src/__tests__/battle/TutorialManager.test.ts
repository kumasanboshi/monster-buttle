import { TutorialManager } from '../../battle/TutorialManager';
import { GameMode } from '../../types/GameMode';
import { CommandType } from '../../types/Command';
import {
  TUTORIAL_STAGE_NUMBER,
  TUTORIAL_FREE_BATTLE_MESSAGE,
} from '../../constants/tutorialConfig';

describe('TutorialManager', () => {
  describe('isTutorial()', () => {
    it('CHALLENGE + ステージ1 → true', () => {
      const manager = new TutorialManager(TUTORIAL_STAGE_NUMBER, GameMode.CHALLENGE);
      expect(manager.isTutorial()).toBe(true);
    });

    it('CHALLENGE + ステージ2 → false', () => {
      const manager = new TutorialManager(2, GameMode.CHALLENGE);
      expect(manager.isTutorial()).toBe(false);
    });

    it('FREE_CPU + ステージ1 → false', () => {
      const manager = new TutorialManager(1, GameMode.FREE_CPU);
      expect(manager.isTutorial()).toBe(false);
    });

    it('FREE_LOCAL → false', () => {
      const manager = new TutorialManager(1, GameMode.FREE_LOCAL);
      expect(manager.isTutorial()).toBe(false);
    });
  });

  describe('isFixedTurn()', () => {
    let manager: TutorialManager;

    beforeEach(() => {
      manager = new TutorialManager(TUTORIAL_STAGE_NUMBER, GameMode.CHALLENGE);
    });

    it('ターン1〜5はtrue', () => {
      for (let turn = 1; turn <= 5; turn++) {
        expect(manager.isFixedTurn(turn)).toBe(true);
      }
    });

    it('ターン6以降はfalse', () => {
      expect(manager.isFixedTurn(6)).toBe(false);
      expect(manager.isFixedTurn(7)).toBe(false);
      expect(manager.isFixedTurn(10)).toBe(false);
    });

    it('チュートリアルでない場合は常にfalse', () => {
      const nonTutorial = new TutorialManager(2, GameMode.CHALLENGE);
      expect(nonTutorial.isFixedTurn(1)).toBe(false);
      expect(nonTutorial.isFixedTurn(3)).toBe(false);
    });
  });

  describe('getPlayerCommands()', () => {
    let manager: TutorialManager;

    beforeEach(() => {
      manager = new TutorialManager(TUTORIAL_STAGE_NUMBER, GameMode.CHALLENGE);
    });

    it('ターン1: 前進・前進', () => {
      const cmds = manager.getPlayerCommands(1);
      expect(cmds).toEqual({
        first: { type: CommandType.ADVANCE },
        second: { type: CommandType.ADVANCE },
      });
    });

    it('ターン2: 武器攻撃・武器攻撃', () => {
      const cmds = manager.getPlayerCommands(2);
      expect(cmds).toEqual({
        first: { type: CommandType.WEAPON_ATTACK },
        second: { type: CommandType.WEAPON_ATTACK },
      });
    });

    it('ターン3: 特殊攻撃・特殊攻撃', () => {
      const cmds = manager.getPlayerCommands(3);
      expect(cmds).toEqual({
        first: { type: CommandType.SPECIAL_ATTACK },
        second: { type: CommandType.SPECIAL_ATTACK },
      });
    });

    it('ターン4: リフレクター・リフレクター', () => {
      const cmds = manager.getPlayerCommands(4);
      expect(cmds).toEqual({
        first: { type: CommandType.REFLECTOR },
        second: { type: CommandType.REFLECTOR },
      });
    });

    it('ターン5: スタンスA・武器攻撃', () => {
      const cmds = manager.getPlayerCommands(5);
      expect(cmds).toEqual({
        first: { type: CommandType.STANCE_A },
        second: { type: CommandType.WEAPON_ATTACK },
      });
    });

    it('ターン6以降: null', () => {
      expect(manager.getPlayerCommands(6)).toBeNull();
      expect(manager.getPlayerCommands(10)).toBeNull();
    });

    it('チュートリアルでない場合: null', () => {
      const nonTutorial = new TutorialManager(2, GameMode.CHALLENGE);
      expect(nonTutorial.getPlayerCommands(1)).toBeNull();
    });
  });

  describe('getEnemyCommands()', () => {
    let manager: TutorialManager;

    beforeEach(() => {
      manager = new TutorialManager(TUTORIAL_STAGE_NUMBER, GameMode.CHALLENGE);
    });

    it('ターン1: 前進・前進', () => {
      const cmds = manager.getEnemyCommands(1);
      expect(cmds).toEqual({
        first: { type: CommandType.ADVANCE },
        second: { type: CommandType.ADVANCE },
      });
    });

    it('ターン2: 前進・前進', () => {
      const cmds = manager.getEnemyCommands(2);
      expect(cmds).toEqual({
        first: { type: CommandType.ADVANCE },
        second: { type: CommandType.ADVANCE },
      });
    });

    it('ターン3: 後退・後退', () => {
      const cmds = manager.getEnemyCommands(3);
      expect(cmds).toEqual({
        first: { type: CommandType.RETREAT },
        second: { type: CommandType.RETREAT },
      });
    });

    it('ターン4: 特殊攻撃・特殊攻撃', () => {
      const cmds = manager.getEnemyCommands(4);
      expect(cmds).toEqual({
        first: { type: CommandType.SPECIAL_ATTACK },
        second: { type: CommandType.SPECIAL_ATTACK },
      });
    });

    it('ターン5: 前進・前進', () => {
      const cmds = manager.getEnemyCommands(5);
      expect(cmds).toEqual({
        first: { type: CommandType.ADVANCE },
        second: { type: CommandType.ADVANCE },
      });
    });

    it('ターン6以降: null', () => {
      expect(manager.getEnemyCommands(6)).toBeNull();
    });

    it('チュートリアルでない場合: null', () => {
      const nonTutorial = new TutorialManager(2, GameMode.CHALLENGE);
      expect(nonTutorial.getEnemyCommands(1)).toBeNull();
    });
  });

  describe('getPopupMessage()', () => {
    let manager: TutorialManager;

    beforeEach(() => {
      manager = new TutorialManager(TUTORIAL_STAGE_NUMBER, GameMode.CHALLENGE);
    });

    it('ターン1〜5: 各ターンのメッセージを返す', () => {
      expect(manager.getPopupMessage(1)).toBe('前進で距離を詰めよう');
      expect(manager.getPopupMessage(2)).toBe('武器攻撃で攻撃しよう');
      expect(manager.getPopupMessage(3)).toBe('特殊攻撃は距離に関係なく当たる');
      expect(manager.getPopupMessage(4)).toBe('リフレクターで特殊攻撃を跳ね返せ');
      expect(manager.getPopupMessage(5)).toBe('スタンス切替で攻撃力UP');
    });

    it('ターン6: 初回は自由戦闘メッセージを返す', () => {
      expect(manager.getPopupMessage(6)).toBe(TUTORIAL_FREE_BATTLE_MESSAGE);
    });

    it('ターン6: 2回目以降はnullを返す', () => {
      manager.getPopupMessage(6); // 1回目
      manager.markFreeBattleMessageShown();
      expect(manager.getPopupMessage(6)).toBeNull();
    });

    it('ターン7以降: nullを返す', () => {
      expect(manager.getPopupMessage(7)).toBeNull();
      expect(manager.getPopupMessage(10)).toBeNull();
    });

    it('チュートリアルでない場合: nullを返す', () => {
      const nonTutorial = new TutorialManager(2, GameMode.CHALLENGE);
      expect(nonTutorial.getPopupMessage(1)).toBeNull();
    });
  });

  describe('markFreeBattleMessageShown()', () => {
    it('フラグを切り替えてターン6メッセージを非表示にする', () => {
      const manager = new TutorialManager(TUTORIAL_STAGE_NUMBER, GameMode.CHALLENGE);
      expect(manager.getPopupMessage(6)).toBe(TUTORIAL_FREE_BATTLE_MESSAGE);
      manager.markFreeBattleMessageShown();
      expect(manager.getPopupMessage(6)).toBeNull();
    });
  });
});
