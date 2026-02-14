import {
  getAvailableTransitions,
  isValidTransition,
} from '../../scenes/sceneTransitions';
import { SceneKey } from '../../scenes/sceneKeys';

describe('CHALLENGE mode transitions', () => {
  describe('TITLE → CHARACTER_SELECT', () => {
    it('TITLEからCHARACTER_SELECTへの遷移が許可されていること', () => {
      expect(isValidTransition(SceneKey.TITLE, SceneKey.CHARACTER_SELECT)).toBe(true);
    });
  });

  describe('CHARACTER_SELECT → BATTLE', () => {
    it('CHARACTER_SELECTからBATTLEへの遷移が許可されていること', () => {
      expect(isValidTransition(SceneKey.CHARACTER_SELECT, SceneKey.BATTLE)).toBe(true);
    });
  });

  describe('BATTLE → RESULT', () => {
    it('BATTLEからRESULTへの遷移が許可されていること', () => {
      expect(isValidTransition(SceneKey.BATTLE, SceneKey.RESULT)).toBe(true);
    });
  });

  describe('RESULT → BATTLE（リトライ/次へ）', () => {
    it('RESULTからBATTLEへの遷移が許可されていること', () => {
      expect(isValidTransition(SceneKey.RESULT, SceneKey.BATTLE)).toBe(true);
    });
  });

  describe('RESULT → TITLE', () => {
    it('RESULTからTITLEへの遷移が許可されていること', () => {
      expect(isValidTransition(SceneKey.RESULT, SceneKey.TITLE)).toBe(true);
    });
  });

  describe('全CHALLENGE遷移パス', () => {
    it('CHALLENGEフローに必要な全遷移が定義されていること', () => {
      const requiredTransitions: [SceneKey, SceneKey][] = [
        [SceneKey.TITLE, SceneKey.CHARACTER_SELECT],
        [SceneKey.CHARACTER_SELECT, SceneKey.BATTLE],
        [SceneKey.BATTLE, SceneKey.RESULT],
        [SceneKey.RESULT, SceneKey.TITLE],
        [SceneKey.RESULT, SceneKey.BATTLE],
      ];

      for (const [from, to] of requiredTransitions) {
        expect(isValidTransition(from, to)).toBe(true);
      }
    });
  });

  describe('RESULTからの遷移先一覧', () => {
    it('RESULTからTITLE, CHARACTER_SELECT, BATTLEに遷移可能であること', () => {
      const transitions = getAvailableTransitions(SceneKey.RESULT);
      expect(transitions).toContain(SceneKey.TITLE);
      expect(transitions).toContain(SceneKey.CHARACTER_SELECT);
      expect(transitions).toContain(SceneKey.BATTLE);
    });
  });
});
