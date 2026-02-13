import * as Types from '../../types';

describe('Type Exports', () => {
  describe('Command types', () => {
    it('should export CommandType enum', () => {
      expect(Types.CommandType).toBeDefined();
      expect(Types.CommandType.ADVANCE).toBe('ADVANCE');
      expect(Types.CommandType.RETREAT).toBe('RETREAT');
      expect(Types.CommandType.WEAPON_ATTACK).toBe('WEAPON_ATTACK');
      expect(Types.CommandType.SPECIAL_ATTACK).toBe('SPECIAL_ATTACK');
      expect(Types.CommandType.REFLECTOR).toBe('REFLECTOR');
      expect(Types.CommandType.STANCE_A).toBe('STANCE_A');
      expect(Types.CommandType.STANCE_B).toBe('STANCE_B');
    });
  });

  describe('Distance types', () => {
    it('should export DistanceType enum', () => {
      expect(Types.DistanceType).toBeDefined();
      expect(Types.DistanceType.NEAR).toBe('NEAR');
      expect(Types.DistanceType.MID).toBe('MID');
      expect(Types.DistanceType.FAR).toBe('FAR');
    });

    it('should export distance helper functions', () => {
      expect(Types.moveCloser).toBeDefined();
      expect(Types.moveFarther).toBeDefined();
      expect(Types.calculateDistance).toBeDefined();
    });
  });

  describe('Stance types', () => {
    it('should export StanceType enum', () => {
      expect(Types.StanceType).toBeDefined();
      expect(Types.StanceType.NORMAL).toBe('NORMAL');
      expect(Types.StanceType.OFFENSIVE).toBe('OFFENSIVE');
      expect(Types.StanceType.DEFENSIVE).toBe('DEFENSIVE');
    });

    it('should export STANCE_MODIFIERS constant', () => {
      expect(Types.STANCE_MODIFIERS).toBeDefined();
      expect(Types.STANCE_MODIFIERS[Types.StanceType.NORMAL]).toBeDefined();
      expect(Types.STANCE_MODIFIERS[Types.StanceType.OFFENSIVE]).toBeDefined();
      expect(Types.STANCE_MODIFIERS[Types.StanceType.DEFENSIVE]).toBeDefined();
    });

    it('should export calculateNextStance function', () => {
      expect(Types.calculateNextStance).toBeDefined();
    });
  });

  describe('Equipment types', () => {
    it('should export equipment type definitions', () => {
      const weapon: Types.Weapon = {
        name: 'Test Weapon',
        multiplier: 1.6,
      };
      const reflector: Types.Reflector = {
        name: 'Test Reflector',
        maxReflectCount: 2,
        reflectRate: 0.5,
      };
      const equipmentSet: Types.EquipmentSet = {
        weapon,
        reflector,
      };
      expect(weapon).toBeDefined();
      expect(reflector).toBeDefined();
      expect(equipmentSet).toBeDefined();
    });
  });

  describe('Monster types', () => {
    it('should export Monster type', () => {
      const monster: Types.Monster = {
        id: 'test-1',
        name: 'Test Monster',
        species: 'Test Species',
        stats: {
          hp: 250,
          strength: 50,
          special: 50,
          speed: 40,
          toughness: 50,
          specialAttackCount: 5,
        },
        weapon: {
          name: 'Test Weapon',
          multiplier: 1.6,
        },
        reflector: {
          name: 'Test Reflector',
          maxReflectCount: 2,
          reflectRate: 0.5,
        },
      };
      expect(monster).toBeDefined();
    });

    it('should export MonsterStats type', () => {
      const stats: Types.MonsterStats = {
        hp: 250,
        strength: 50,
        special: 50,
        speed: 40,
        toughness: 50,
        specialAttackCount: 5,
      };
      expect(stats).toBeDefined();
    });

    it('should export MonsterBattleState type', () => {
      const battleState: Types.MonsterBattleState = {
        monsterId: 'test-1',
        currentHp: 250,
        currentStance: Types.StanceType.NORMAL,
        remainingSpecialCount: 5,
        usedReflectCount: 0,
      };
      expect(battleState).toBeDefined();
    });
  });

  describe('BattleState types', () => {
    it('should export BattleState type', () => {
      const battleState: Types.BattleState = {
        player1: {
          monsterId: 'monster-1',
          currentHp: 250,
          currentStance: Types.StanceType.NORMAL,
          remainingSpecialCount: 5,
          usedReflectCount: 0,
        },
        player2: {
          monsterId: 'monster-2',
          currentHp: 200,
          currentStance: Types.StanceType.NORMAL,
          remainingSpecialCount: 5,
          usedReflectCount: 0,
        },
        currentDistance: Types.DistanceType.MID,
        currentTurn: 1,
        remainingTime: 120,
        isFinished: false,
      };
      expect(battleState).toBeDefined();
    });

    it('should export DamageInfo type', () => {
      const damageInfo: Types.DamageInfo = {
        damage: 50,
        isEvaded: false,
        isReflected: false,
      };
      expect(damageInfo).toBeDefined();
    });

    it('should export TurnResult type', () => {
      const noDamage = { damage: 0, isEvaded: false, isReflected: false };
      const turnResult: Types.TurnResult = {
        turnNumber: 1,
        player1Commands: {
          first: { type: Types.CommandType.WEAPON_ATTACK },
          second: { type: Types.CommandType.ADVANCE },
        },
        player2Commands: {
          first: { type: Types.CommandType.REFLECTOR },
          second: { type: Types.CommandType.RETREAT },
        },
        distanceAfter: Types.DistanceType.MID,
        player1Damage: noDamage,
        player2Damage: {
          damage: 40,
          isEvaded: false,
          isReflected: false,
        },
        player1StanceAfter: Types.StanceType.NORMAL,
        player2StanceAfter: Types.StanceType.NORMAL,
        phases: [
          { player1Command: Types.CommandType.WEAPON_ATTACK, player2Command: Types.CommandType.REFLECTOR, distanceAfter: Types.DistanceType.MID, player1Damage: noDamage, player2Damage: { damage: 40, isEvaded: false, isReflected: false } },
          { player1Command: Types.CommandType.ADVANCE, player2Command: Types.CommandType.RETREAT, distanceAfter: Types.DistanceType.MID, player1Damage: noDamage, player2Damage: noDamage },
        ],
      };
      expect(turnResult).toBeDefined();
    });

    it('should export BattleResultType enum', () => {
      expect(Types.BattleResultType).toBeDefined();
      expect(Types.BattleResultType.PLAYER1_WIN).toBe('PLAYER1_WIN');
      expect(Types.BattleResultType.PLAYER2_WIN).toBe('PLAYER2_WIN');
      expect(Types.BattleResultType.DRAW).toBe('DRAW');
    });

    it('should export BattleResult type', () => {
      const battleResult: Types.BattleResult = {
        resultType: Types.BattleResultType.PLAYER1_WIN,
        finalState: {
          player1: {
            monsterId: 'monster-1',
            currentHp: 100,
            currentStance: Types.StanceType.NORMAL,
            remainingSpecialCount: 3,
            usedReflectCount: 1,
          },
          player2: {
            monsterId: 'monster-2',
            currentHp: 0,
            currentStance: Types.StanceType.DEFENSIVE,
            remainingSpecialCount: 2,
            usedReflectCount: 2,
          },
          currentDistance: Types.DistanceType.NEAR,
          currentTurn: 8,
          remainingTime: 60,
          isFinished: true,
        },
        turnHistory: [],
        reason: 'Player 2 HP reached 0',
      };
      expect(battleResult).toBeDefined();
    });
  });

  describe('Command interface', () => {
    it('should export Command type', () => {
      const command: Types.Command = {
        type: Types.CommandType.WEAPON_ATTACK,
      };
      expect(command).toBeDefined();
    });

    it('should export TurnCommands type', () => {
      const turnCommands: Types.TurnCommands = {
        first: { type: Types.CommandType.WEAPON_ATTACK },
        second: { type: Types.CommandType.ADVANCE },
      };
      expect(turnCommands).toBeDefined();
    });
  });
});
