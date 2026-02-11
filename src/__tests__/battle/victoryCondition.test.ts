import { DistanceType, StanceType, BattleState, BattleResultType } from '../../types';
import {
  checkVictoryAfterTurn,
  checkVictoryOnTimeout,
  checkVictoryOnGiveUp,
} from '../../battle/victoryCondition';

/**
 * テスト用のバトル状態を生成するヘルパー
 */
function createTestBattleState(overrides: Partial<BattleState> = {}): BattleState {
  return {
    player1: {
      monsterId: 'monster-1',
      currentHp: 100,
      currentStance: StanceType.NORMAL,
      remainingSpecialCount: 3,
      usedReflectCount: 0,
    },
    player2: {
      monsterId: 'monster-2',
      currentHp: 100,
      currentStance: StanceType.NORMAL,
      remainingSpecialCount: 3,
      usedReflectCount: 0,
    },
    currentDistance: DistanceType.MID,
    currentTurn: 5,
    remainingTime: 60,
    isFinished: false,
    ...overrides,
  };
}

describe('checkVictoryAfterTurn', () => {
  describe('HP0による勝敗', () => {
    it('P2のHP0でP1勝利', () => {
      const state = createTestBattleState({
        player2: {
          monsterId: 'monster-2',
          currentHp: 0,
          currentStance: StanceType.NORMAL,
          remainingSpecialCount: 3,
          usedReflectCount: 0,
        },
      });
      const result = checkVictoryAfterTurn(state);
      expect(result).not.toBeNull();
      expect(result!.resultType).toBe(BattleResultType.PLAYER1_WIN);
      expect(result!.reason).toContain('HP');
      expect(result!.finalState.isFinished).toBe(true);
    });

    it('P1のHP0でP2勝利', () => {
      const state = createTestBattleState({
        player1: {
          monsterId: 'monster-1',
          currentHp: 0,
          currentStance: StanceType.NORMAL,
          remainingSpecialCount: 3,
          usedReflectCount: 0,
        },
      });
      const result = checkVictoryAfterTurn(state);
      expect(result).not.toBeNull();
      expect(result!.resultType).toBe(BattleResultType.PLAYER2_WIN);
      expect(result!.reason).toContain('HP');
      expect(result!.finalState.isFinished).toBe(true);
    });

    it('両者HP0でドロー', () => {
      const state = createTestBattleState({
        player1: {
          monsterId: 'monster-1',
          currentHp: 0,
          currentStance: StanceType.NORMAL,
          remainingSpecialCount: 3,
          usedReflectCount: 0,
        },
        player2: {
          monsterId: 'monster-2',
          currentHp: 0,
          currentStance: StanceType.NORMAL,
          remainingSpecialCount: 3,
          usedReflectCount: 0,
        },
      });
      const result = checkVictoryAfterTurn(state);
      expect(result).not.toBeNull();
      expect(result!.resultType).toBe(BattleResultType.DRAW);
      expect(result!.finalState.isFinished).toBe(true);
    });
  });

  describe('バトル継続', () => {
    it('両者HPが残っていればnullを返す', () => {
      const state = createTestBattleState();
      const result = checkVictoryAfterTurn(state);
      expect(result).toBeNull();
    });

    it('HP1でもバトル継続', () => {
      const state = createTestBattleState({
        player1: {
          monsterId: 'monster-1',
          currentHp: 1,
          currentStance: StanceType.NORMAL,
          remainingSpecialCount: 3,
          usedReflectCount: 0,
        },
      });
      const result = checkVictoryAfterTurn(state);
      expect(result).toBeNull();
    });
  });

  describe('finalStateの確認', () => {
    it('finalStateに現在の状態が正しく反映される', () => {
      const state = createTestBattleState({
        player1: {
          monsterId: 'monster-1',
          currentHp: 50,
          currentStance: StanceType.OFFENSIVE,
          remainingSpecialCount: 1,
          usedReflectCount: 2,
        },
        player2: {
          monsterId: 'monster-2',
          currentHp: 0,
          currentStance: StanceType.DEFENSIVE,
          remainingSpecialCount: 0,
          usedReflectCount: 1,
        },
        currentDistance: DistanceType.FAR,
        currentTurn: 10,
        remainingTime: 30,
      });
      const result = checkVictoryAfterTurn(state);
      expect(result).not.toBeNull();
      expect(result!.finalState.player1.currentHp).toBe(50);
      expect(result!.finalState.player1.currentStance).toBe(StanceType.OFFENSIVE);
      expect(result!.finalState.currentDistance).toBe(DistanceType.FAR);
      expect(result!.finalState.currentTurn).toBe(10);
    });
  });
});

describe('checkVictoryOnTimeout', () => {
  describe('HP差による勝敗', () => {
    it('P1のHPが多い場合P1勝利', () => {
      const state = createTestBattleState({
        player1: {
          monsterId: 'monster-1',
          currentHp: 80,
          currentStance: StanceType.NORMAL,
          remainingSpecialCount: 3,
          usedReflectCount: 0,
        },
        player2: {
          monsterId: 'monster-2',
          currentHp: 50,
          currentStance: StanceType.NORMAL,
          remainingSpecialCount: 3,
          usedReflectCount: 0,
        },
        remainingTime: 0,
      });
      const result = checkVictoryOnTimeout(state);
      expect(result.resultType).toBe(BattleResultType.PLAYER1_WIN);
      expect(result.reason).toContain('Time');
      expect(result.finalState.isFinished).toBe(true);
    });

    it('P2のHPが多い場合P2勝利', () => {
      const state = createTestBattleState({
        player1: {
          monsterId: 'monster-1',
          currentHp: 30,
          currentStance: StanceType.NORMAL,
          remainingSpecialCount: 3,
          usedReflectCount: 0,
        },
        player2: {
          monsterId: 'monster-2',
          currentHp: 70,
          currentStance: StanceType.NORMAL,
          remainingSpecialCount: 3,
          usedReflectCount: 0,
        },
        remainingTime: 0,
      });
      const result = checkVictoryOnTimeout(state);
      expect(result.resultType).toBe(BattleResultType.PLAYER2_WIN);
      expect(result.reason).toContain('Time');
      expect(result.finalState.isFinished).toBe(true);
    });
  });

  describe('HP同値でドロー', () => {
    it('HP同値でドロー', () => {
      const state = createTestBattleState({
        player1: {
          monsterId: 'monster-1',
          currentHp: 60,
          currentStance: StanceType.NORMAL,
          remainingSpecialCount: 3,
          usedReflectCount: 0,
        },
        player2: {
          monsterId: 'monster-2',
          currentHp: 60,
          currentStance: StanceType.NORMAL,
          remainingSpecialCount: 3,
          usedReflectCount: 0,
        },
        remainingTime: 0,
      });
      const result = checkVictoryOnTimeout(state);
      expect(result.resultType).toBe(BattleResultType.DRAW);
      expect(result.reason).toContain('same HP');
      expect(result.finalState.isFinished).toBe(true);
    });

    it('両者HP0でもドロー', () => {
      const state = createTestBattleState({
        player1: {
          monsterId: 'monster-1',
          currentHp: 0,
          currentStance: StanceType.NORMAL,
          remainingSpecialCount: 3,
          usedReflectCount: 0,
        },
        player2: {
          monsterId: 'monster-2',
          currentHp: 0,
          currentStance: StanceType.NORMAL,
          remainingSpecialCount: 3,
          usedReflectCount: 0,
        },
        remainingTime: 0,
      });
      const result = checkVictoryOnTimeout(state);
      expect(result.resultType).toBe(BattleResultType.DRAW);
    });
  });

  describe('finalStateの確認', () => {
    it('remainingTimeが0に設定される', () => {
      const state = createTestBattleState({ remainingTime: 5 });
      const result = checkVictoryOnTimeout(state);
      expect(result.finalState.remainingTime).toBe(0);
      expect(result.finalState.isFinished).toBe(true);
    });
  });
});

describe('checkVictoryOnGiveUp', () => {
  it('P1がギブアップするとP2勝利', () => {
    const state = createTestBattleState();
    const result = checkVictoryOnGiveUp(state, 1);
    expect(result.resultType).toBe(BattleResultType.PLAYER2_WIN);
    expect(result.reason).toContain('gave up');
    expect(result.finalState.isFinished).toBe(true);
  });

  it('P2がギブアップするとP1勝利', () => {
    const state = createTestBattleState();
    const result = checkVictoryOnGiveUp(state, 2);
    expect(result.resultType).toBe(BattleResultType.PLAYER1_WIN);
    expect(result.reason).toContain('gave up');
    expect(result.finalState.isFinished).toBe(true);
  });

  it('HP残量に関係なくギブアップ側が敗北', () => {
    const state = createTestBattleState({
      player1: {
        monsterId: 'monster-1',
        currentHp: 200,
        currentStance: StanceType.NORMAL,
        remainingSpecialCount: 5,
        usedReflectCount: 0,
      },
      player2: {
        monsterId: 'monster-2',
        currentHp: 10,
        currentStance: StanceType.NORMAL,
        remainingSpecialCount: 0,
        usedReflectCount: 3,
      },
    });
    const result = checkVictoryOnGiveUp(state, 1);
    expect(result.resultType).toBe(BattleResultType.PLAYER2_WIN);
  });

  it('finalStateに現在の状態が保持される', () => {
    const state = createTestBattleState({
      currentTurn: 7,
      remainingTime: 45,
      currentDistance: DistanceType.FAR,
    });
    const result = checkVictoryOnGiveUp(state, 2);
    expect(result.finalState.currentTurn).toBe(7);
    expect(result.finalState.remainingTime).toBe(45);
    expect(result.finalState.currentDistance).toBe(DistanceType.FAR);
  });
});
