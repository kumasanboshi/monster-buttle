import { BattleState, BattleResultType } from '../../types/BattleState';
import { DistanceType } from '../../types/Distance';
import { StanceType } from '../../types/Stance';
import { checkVictoryAfterTurn } from '../../battle/victoryCondition';
import { SceneKey } from '../../scenes/sceneKeys';
import { isValidTransition } from '../../scenes/sceneTransitions';

/**
 * BattleSceneからResultSceneへの遷移に関するテスト
 *
 * BattleSceneのPhaserシーンメソッドは直接テストしにくいため、
 * 勝敗判定ロジックとシーン遷移ルールを個別にテストする。
 */

/** テスト用のBattleState作成 */
function createTestState(player1Hp: number, player2Hp: number): BattleState {
  return {
    player1: {
      monsterId: 'test-1',
      currentHp: player1Hp,
      currentStance: StanceType.NORMAL,
      remainingSpecialCount: 3,
      usedReflectCount: 0,
    },
    player2: {
      monsterId: 'test-2',
      currentHp: player2Hp,
      currentStance: StanceType.NORMAL,
      remainingSpecialCount: 3,
      usedReflectCount: 0,
    },
    currentDistance: DistanceType.MID,
    currentTurn: 5,
    remainingTime: 60,
    isFinished: false,
  };
}

describe('バトル終了判定とリザルト遷移', () => {
  describe('BATTLE→RESULT遷移ルール', () => {
    it('BATTLEからRESULTへの遷移が許可されていること', () => {
      expect(isValidTransition(SceneKey.BATTLE, SceneKey.RESULT)).toBe(true);
    });

    it('RESULTからTITLEへの遷移が許可されていること', () => {
      expect(isValidTransition(SceneKey.RESULT, SceneKey.TITLE)).toBe(true);
    });

    it('RESULTからCHARACTER_SELECTへの遷移が許可されていること', () => {
      expect(
        isValidTransition(SceneKey.RESULT, SceneKey.CHARACTER_SELECT)
      ).toBe(true);
    });
  });

  describe('勝敗判定（checkVictoryAfterTurn）の確認', () => {
    it('P2のHP0でP1勝利が判定されること', () => {
      const state = createTestState(50, 0);
      const result = checkVictoryAfterTurn(state);
      expect(result).not.toBeNull();
      expect(result!.resultType).toBe(BattleResultType.PLAYER1_WIN);
    });

    it('P1のHP0でP2勝利が判定されること', () => {
      const state = createTestState(0, 50);
      const result = checkVictoryAfterTurn(state);
      expect(result).not.toBeNull();
      expect(result!.resultType).toBe(BattleResultType.PLAYER2_WIN);
    });

    it('両者HP0でドローが判定されること', () => {
      const state = createTestState(0, 0);
      const result = checkVictoryAfterTurn(state);
      expect(result).not.toBeNull();
      expect(result!.resultType).toBe(BattleResultType.DRAW);
    });

    it('両者HPが残っていればnullを返すこと', () => {
      const state = createTestState(50, 50);
      const result = checkVictoryAfterTurn(state);
      expect(result).toBeNull();
    });

    it('結果にfinalStateが含まれること', () => {
      const state = createTestState(50, 0);
      const result = checkVictoryAfterTurn(state);
      expect(result!.finalState).toBeDefined();
      expect(result!.finalState.isFinished).toBe(true);
    });

    it('結果にreasonが含まれること', () => {
      const state = createTestState(50, 0);
      const result = checkVictoryAfterTurn(state);
      expect(result!.reason).toBeDefined();
      expect(typeof result!.reason).toBe('string');
      expect(result!.reason.length).toBeGreaterThan(0);
    });
  });
});
