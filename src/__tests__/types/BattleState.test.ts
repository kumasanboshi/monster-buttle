import {
  BattleState,
  DamageInfo,
  TurnResult,
  BattleResultType,
  BattleResult,
} from '../../types/BattleState';
import { DistanceType } from '../../types/Distance';
import { StanceType } from '../../types/Stance';
import { CommandType } from '../../types/Command';

describe('BattleState Types', () => {
  describe('BattleState', () => {
    it('should track both players state', () => {
      const battleState: BattleState = {
        player1: {
          monsterId: 'monster-1',
          currentHp: 250,
          currentStance: StanceType.NORMAL,
          remainingSpecialCount: 5,
          usedReflectCount: 0,
        },
        player2: {
          monsterId: 'monster-2',
          currentHp: 200,
          currentStance: StanceType.NORMAL,
          remainingSpecialCount: 5,
          usedReflectCount: 0,
        },
        currentDistance: DistanceType.MID,
        currentTurn: 1,
        remainingTime: 120,
        isFinished: false,
      };
      expect(battleState).toHaveProperty('player1');
      expect(battleState).toHaveProperty('player2');
    });

    it('should track current distance', () => {
      const battleState: BattleState = {
        player1: {
          monsterId: 'monster-1',
          currentHp: 250,
          currentStance: StanceType.NORMAL,
          remainingSpecialCount: 5,
          usedReflectCount: 0,
        },
        player2: {
          monsterId: 'monster-2',
          currentHp: 200,
          currentStance: StanceType.NORMAL,
          remainingSpecialCount: 5,
          usedReflectCount: 0,
        },
        currentDistance: DistanceType.NEAR,
        currentTurn: 1,
        remainingTime: 120,
        isFinished: false,
      };
      expect(battleState.currentDistance).toBe(DistanceType.NEAR);
    });

    it('should track current turn number', () => {
      const battleState: BattleState = {
        player1: {
          monsterId: 'monster-1',
          currentHp: 250,
          currentStance: StanceType.NORMAL,
          remainingSpecialCount: 5,
          usedReflectCount: 0,
        },
        player2: {
          monsterId: 'monster-2',
          currentHp: 200,
          currentStance: StanceType.NORMAL,
          remainingSpecialCount: 5,
          usedReflectCount: 0,
        },
        currentDistance: DistanceType.MID,
        currentTurn: 3,
        remainingTime: 100,
        isFinished: false,
      };
      expect(battleState.currentTurn).toBe(3);
    });

    it('should track remaining time', () => {
      const battleState: BattleState = {
        player1: {
          monsterId: 'monster-1',
          currentHp: 250,
          currentStance: StanceType.NORMAL,
          remainingSpecialCount: 5,
          usedReflectCount: 0,
        },
        player2: {
          monsterId: 'monster-2',
          currentHp: 200,
          currentStance: StanceType.NORMAL,
          remainingSpecialCount: 5,
          usedReflectCount: 0,
        },
        currentDistance: DistanceType.MID,
        currentTurn: 1,
        remainingTime: 90,
        isFinished: false,
      };
      expect(battleState.remainingTime).toBe(90);
    });

    it('should include player 1 monster state', () => {
      const battleState: BattleState = {
        player1: {
          monsterId: 'monster-1',
          currentHp: 250,
          currentStance: StanceType.OFFENSIVE,
          remainingSpecialCount: 4,
          usedReflectCount: 1,
        },
        player2: {
          monsterId: 'monster-2',
          currentHp: 200,
          currentStance: StanceType.NORMAL,
          remainingSpecialCount: 5,
          usedReflectCount: 0,
        },
        currentDistance: DistanceType.MID,
        currentTurn: 2,
        remainingTime: 110,
        isFinished: false,
      };
      expect(battleState.player1.monsterId).toBe('monster-1');
      expect(battleState.player1.currentHp).toBe(250);
      expect(battleState.player1.currentStance).toBe(StanceType.OFFENSIVE);
      expect(battleState.player1.remainingSpecialCount).toBe(4);
      expect(battleState.player1.usedReflectCount).toBe(1);
    });

    it('should include player 2 monster state', () => {
      const battleState: BattleState = {
        player1: {
          monsterId: 'monster-1',
          currentHp: 250,
          currentStance: StanceType.NORMAL,
          remainingSpecialCount: 5,
          usedReflectCount: 0,
        },
        player2: {
          monsterId: 'monster-2',
          currentHp: 180,
          currentStance: StanceType.DEFENSIVE,
          remainingSpecialCount: 3,
          usedReflectCount: 2,
        },
        currentDistance: DistanceType.FAR,
        currentTurn: 4,
        remainingTime: 80,
        isFinished: false,
      };
      expect(battleState.player2.monsterId).toBe('monster-2');
      expect(battleState.player2.currentHp).toBe(180);
      expect(battleState.player2.currentStance).toBe(StanceType.DEFENSIVE);
      expect(battleState.player2.remainingSpecialCount).toBe(3);
      expect(battleState.player2.usedReflectCount).toBe(2);
    });
  });

  describe('DamageInfo', () => {
    it('should include damage amount', () => {
      const damageInfo: DamageInfo = {
        damage: 50,
        isEvaded: false,
        isReflected: false,
      };
      expect(damageInfo.damage).toBe(50);
    });

    it('should indicate if attack was evaded', () => {
      const damageInfo: DamageInfo = {
        damage: 0,
        isEvaded: true,
        isReflected: false,
      };
      expect(damageInfo.isEvaded).toBe(true);
    });

    it('should indicate if attack was reflected', () => {
      const damageInfo: DamageInfo = {
        damage: 30,
        isEvaded: false,
        isReflected: true,
      };
      expect(damageInfo.isReflected).toBe(true);
    });
  });

  describe('TurnResult', () => {
    it('should record both players actions', () => {
      const turnResult: TurnResult = {
        turnNumber: 1,
        player1Commands: {
          first: { type: CommandType.WEAPON_ATTACK },
          second: { type: CommandType.ADVANCE },
        },
        player2Commands: {
          first: { type: CommandType.REFLECTOR },
          second: { type: CommandType.RETREAT },
        },
        distanceAfter: DistanceType.MID,
        player1Damage: {
          damage: 0,
          isEvaded: false,
          isReflected: false,
        },
        player2Damage: {
          damage: 40,
          isEvaded: false,
          isReflected: false,
        },
        player1StanceAfter: StanceType.NORMAL,
        player2StanceAfter: StanceType.NORMAL,
      };
      expect(turnResult.player1Commands).toBeDefined();
      expect(turnResult.player2Commands).toBeDefined();
    });

    it('should record distance change', () => {
      const turnResult: TurnResult = {
        turnNumber: 2,
        player1Commands: {
          first: { type: CommandType.ADVANCE },
          second: { type: CommandType.WEAPON_ATTACK },
        },
        player2Commands: {
          first: { type: CommandType.ADVANCE },
          second: { type: CommandType.WEAPON_ATTACK },
        },
        distanceAfter: DistanceType.NEAR,
        player1Damage: {
          damage: 35,
          isEvaded: false,
          isReflected: false,
        },
        player2Damage: {
          damage: 42,
          isEvaded: false,
          isReflected: false,
        },
        player1StanceAfter: StanceType.NORMAL,
        player2StanceAfter: StanceType.NORMAL,
      };
      expect(turnResult.distanceAfter).toBe(DistanceType.NEAR);
    });

    it('should record damage dealt to each player', () => {
      const turnResult: TurnResult = {
        turnNumber: 3,
        player1Commands: {
          first: { type: CommandType.SPECIAL_ATTACK },
          second: { type: CommandType.RETREAT },
        },
        player2Commands: {
          first: { type: CommandType.WEAPON_ATTACK },
          second: { type: CommandType.STANCE_A },
        },
        distanceAfter: DistanceType.FAR,
        player1Damage: {
          damage: 48,
          isEvaded: false,
          isReflected: false,
        },
        player2Damage: {
          damage: 55,
          isEvaded: false,
          isReflected: false,
        },
        player1StanceAfter: StanceType.NORMAL,
        player2StanceAfter: StanceType.OFFENSIVE,
      };
      expect(turnResult.player1Damage.damage).toBe(48);
      expect(turnResult.player2Damage.damage).toBe(55);
    });

    it('should record if attack was evaded', () => {
      const turnResult: TurnResult = {
        turnNumber: 4,
        player1Commands: {
          first: { type: CommandType.WEAPON_ATTACK },
          second: { type: CommandType.ADVANCE },
        },
        player2Commands: {
          first: { type: CommandType.RETREAT },
          second: { type: CommandType.SPECIAL_ATTACK },
        },
        distanceAfter: DistanceType.MID,
        player1Damage: {
          damage: 0,
          isEvaded: true,
          isReflected: false,
        },
        player2Damage: {
          damage: 40,
          isEvaded: false,
          isReflected: false,
        },
        player1StanceAfter: StanceType.NORMAL,
        player2StanceAfter: StanceType.NORMAL,
      };
      expect(turnResult.player1Damage.isEvaded).toBe(true);
    });

    it('should record if reflector was activated', () => {
      const turnResult: TurnResult = {
        turnNumber: 5,
        player1Commands: {
          first: { type: CommandType.SPECIAL_ATTACK },
          second: { type: CommandType.ADVANCE },
        },
        player2Commands: {
          first: { type: CommandType.REFLECTOR },
          second: { type: CommandType.WEAPON_ATTACK },
        },
        distanceAfter: DistanceType.MID,
        player1Damage: {
          damage: 30,
          isEvaded: false,
          isReflected: true,
        },
        player2Damage: {
          damage: 0,
          isEvaded: false,
          isReflected: false,
        },
        player1StanceAfter: StanceType.NORMAL,
        player2StanceAfter: StanceType.NORMAL,
      };
      expect(turnResult.player1Damage.isReflected).toBe(true);
    });

    it('should record stance changes', () => {
      const turnResult: TurnResult = {
        turnNumber: 6,
        player1Commands: {
          first: { type: CommandType.STANCE_A },
          second: { type: CommandType.ADVANCE },
        },
        player2Commands: {
          first: { type: CommandType.STANCE_B },
          second: { type: CommandType.RETREAT },
        },
        distanceAfter: DistanceType.MID,
        player1Damage: {
          damage: 0,
          isEvaded: false,
          isReflected: false,
        },
        player2Damage: {
          damage: 0,
          isEvaded: false,
          isReflected: false,
        },
        player1StanceAfter: StanceType.OFFENSIVE,
        player2StanceAfter: StanceType.DEFENSIVE,
      };
      expect(turnResult.player1StanceAfter).toBe(StanceType.OFFENSIVE);
      expect(turnResult.player2StanceAfter).toBe(StanceType.DEFENSIVE);
    });
  });

  describe('BattleResultType', () => {
    it('should have PLAYER1_WIN', () => {
      expect(BattleResultType.PLAYER1_WIN).toBe('PLAYER1_WIN');
    });

    it('should have PLAYER2_WIN', () => {
      expect(BattleResultType.PLAYER2_WIN).toBe('PLAYER2_WIN');
    });

    it('should have DRAW', () => {
      expect(BattleResultType.DRAW).toBe('DRAW');
    });
  });

  describe('BattleResult', () => {
    it('should declare winner when HP reaches 0', () => {
      const battleResult: BattleResult = {
        resultType: BattleResultType.PLAYER1_WIN,
        finalState: {
          player1: {
            monsterId: 'monster-1',
            currentHp: 100,
            currentStance: StanceType.NORMAL,
            remainingSpecialCount: 3,
            usedReflectCount: 1,
          },
          player2: {
            monsterId: 'monster-2',
            currentHp: 0,
            currentStance: StanceType.DEFENSIVE,
            remainingSpecialCount: 2,
            usedReflectCount: 2,
          },
          currentDistance: DistanceType.NEAR,
          currentTurn: 8,
          remainingTime: 60,
          isFinished: true,
        },
        turnHistory: [],
        reason: 'Player 2 HP reached 0',
      };
      expect(battleResult.resultType).toBe(BattleResultType.PLAYER1_WIN);
      expect(battleResult.reason).toContain('HP reached 0');
    });

    it('should declare winner when time expires with HP difference', () => {
      const battleResult: BattleResult = {
        resultType: BattleResultType.PLAYER1_WIN,
        finalState: {
          player1: {
            monsterId: 'monster-1',
            currentHp: 150,
            currentStance: StanceType.NORMAL,
            remainingSpecialCount: 2,
            usedReflectCount: 1,
          },
          player2: {
            monsterId: 'monster-2',
            currentHp: 80,
            currentStance: StanceType.NORMAL,
            remainingSpecialCount: 1,
            usedReflectCount: 2,
          },
          currentDistance: DistanceType.MID,
          currentTurn: 15,
          remainingTime: 0,
          isFinished: true,
        },
        turnHistory: [],
        reason: 'Time expired - Player 1 has more HP',
      };
      expect(battleResult.resultType).toBe(BattleResultType.PLAYER1_WIN);
      expect(battleResult.finalState.remainingTime).toBe(0);
      expect(battleResult.reason).toContain('Time expired');
    });

    it('should declare draw when time expires with same HP', () => {
      const battleResult: BattleResult = {
        resultType: BattleResultType.DRAW,
        finalState: {
          player1: {
            monsterId: 'monster-1',
            currentHp: 120,
            currentStance: StanceType.OFFENSIVE,
            remainingSpecialCount: 2,
            usedReflectCount: 1,
          },
          player2: {
            monsterId: 'monster-2',
            currentHp: 120,
            currentStance: StanceType.DEFENSIVE,
            remainingSpecialCount: 3,
            usedReflectCount: 2,
          },
          currentDistance: DistanceType.FAR,
          currentTurn: 20,
          remainingTime: 0,
          isFinished: true,
        },
        turnHistory: [],
        reason: 'Time expired - Both players have same HP',
      };
      expect(battleResult.resultType).toBe(BattleResultType.DRAW);
      expect(battleResult.finalState.player1.currentHp).toBe(
        battleResult.finalState.player2.currentHp
      );
      expect(battleResult.reason).toContain('same HP');
    });

    it('should handle giveup as loss', () => {
      const battleResult: BattleResult = {
        resultType: BattleResultType.PLAYER2_WIN,
        finalState: {
          player1: {
            monsterId: 'monster-1',
            currentHp: 200,
            currentStance: StanceType.NORMAL,
            remainingSpecialCount: 5,
            usedReflectCount: 0,
          },
          player2: {
            monsterId: 'monster-2',
            currentHp: 180,
            currentStance: StanceType.NORMAL,
            remainingSpecialCount: 4,
            usedReflectCount: 1,
          },
          currentDistance: DistanceType.MID,
          currentTurn: 3,
          remainingTime: 100,
          isFinished: true,
        },
        turnHistory: [],
        reason: 'Player 1 gave up',
      };
      expect(battleResult.resultType).toBe(BattleResultType.PLAYER2_WIN);
      expect(battleResult.reason).toContain('gave up');
    });
  });
});
