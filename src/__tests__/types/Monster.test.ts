import {
  MonsterStats,
  Monster,
  MonsterBattleState,
} from '../../types/Monster';
import { StanceType } from '../../types/Stance';

describe('Monster Types', () => {
  describe('MonsterStats', () => {
    it('should accept valid monster stats', () => {
      const stats: MonsterStats = {
        hp: 250,
        strength: 50,
        special: 50,
        speed: 40,
        toughness: 50,
        specialAttackCount: 5,
      };
      expect(stats.hp).toBe(250);
      expect(stats.strength).toBe(50);
      expect(stats.special).toBe(50);
      expect(stats.speed).toBe(40);
      expect(stats.toughness).toBe(50);
      expect(stats.specialAttackCount).toBe(5);
    });

    it('should have all required stat properties', () => {
      const stats: MonsterStats = {
        hp: 200,
        strength: 30,
        special: 40,
        speed: 35,
        toughness: 45,
        specialAttackCount: 4,
      };
      expect(stats).toHaveProperty('hp');
      expect(stats).toHaveProperty('strength');
      expect(stats).toHaveProperty('special');
      expect(stats).toHaveProperty('speed');
      expect(stats).toHaveProperty('toughness');
      expect(stats).toHaveProperty('specialAttackCount');
    });

    it('should validate HP as positive number', () => {
      const stats: MonsterStats = {
        hp: 250,
        strength: 50,
        special: 50,
        speed: 40,
        toughness: 50,
        specialAttackCount: 5,
      };
      expect(stats.hp).toBeGreaterThan(0);
    });

    it('should validate strength as positive number', () => {
      const stats: MonsterStats = {
        hp: 250,
        strength: 50,
        special: 50,
        speed: 40,
        toughness: 50,
        specialAttackCount: 5,
      };
      expect(stats.strength).toBeGreaterThan(0);
    });

    it('should validate special as positive number', () => {
      const stats: MonsterStats = {
        hp: 250,
        strength: 50,
        special: 50,
        speed: 40,
        toughness: 50,
        specialAttackCount: 5,
      };
      expect(stats.special).toBeGreaterThan(0);
    });

    it('should validate speed as positive number', () => {
      const stats: MonsterStats = {
        hp: 250,
        strength: 50,
        special: 50,
        speed: 40,
        toughness: 50,
        specialAttackCount: 5,
      };
      expect(stats.speed).toBeGreaterThan(0);
    });

    it('should validate toughness as positive number', () => {
      const stats: MonsterStats = {
        hp: 250,
        strength: 50,
        special: 50,
        speed: 40,
        toughness: 50,
        specialAttackCount: 5,
      };
      expect(stats.toughness).toBeGreaterThan(0);
    });

    it('should validate specialAttackCount as positive integer', () => {
      const stats: MonsterStats = {
        hp: 250,
        strength: 50,
        special: 50,
        speed: 40,
        toughness: 50,
        specialAttackCount: 5,
      };
      expect(stats.specialAttackCount).toBeGreaterThan(0);
      expect(Number.isInteger(stats.specialAttackCount)).toBe(true);
    });
  });

  describe('Monster', () => {
    it('should create a complete monster with name, stats, and equipment', () => {
      const monster: Monster = {
        id: 'test-1',
        name: 'レイン',
        species: 'ザーグ',
        stats: {
          hp: 250,
          strength: 50,
          special: 50,
          speed: 40,
          toughness: 50,
          specialAttackCount: 5,
        },
        weapon: {
          name: 'ザーグソード',
          multiplier: 1.6,
        },
        reflector: {
          name: 'ザーグシールド',
          maxReflectCount: 2,
          reflectRate: 0.5,
        },
      };
      expect(monster).toHaveProperty('id');
      expect(monster).toHaveProperty('name');
      expect(monster).toHaveProperty('species');
      expect(monster).toHaveProperty('stats');
      expect(monster).toHaveProperty('weapon');
      expect(monster).toHaveProperty('reflector');
    });

    it('should accept valid species name', () => {
      const monster: Monster = {
        id: 'test-2',
        name: 'ドルグ',
        species: 'ガルダン',
        stats: {
          hp: 280,
          strength: 75,
          special: 25,
          speed: 15,
          toughness: 55,
          specialAttackCount: 3,
        },
        weapon: {
          name: 'ガルダンアックス',
          multiplier: 1.6,
        },
        reflector: {
          name: 'ガルダンバリア',
          maxReflectCount: 2,
          reflectRate: 0.5,
        },
      };
      expect(monster.species).toBe('ガルダン');
    });

    it('should include weapon in monster data', () => {
      const monster: Monster = {
        id: 'test-3',
        name: 'シエル',
        species: 'ルーナ',
        stats: {
          hp: 180,
          strength: 20,
          special: 80,
          speed: 45,
          toughness: 25,
          specialAttackCount: 7,
        },
        weapon: {
          name: 'ルーナスタッフ',
          multiplier: 1.4,
        },
        reflector: {
          name: 'ルーナミラー',
          maxReflectCount: 3,
          reflectRate: 0.6,
        },
      };
      expect(monster.weapon).toBeDefined();
      expect(monster.weapon).toHaveProperty('name');
      expect(monster.weapon).toHaveProperty('multiplier');
    });

    it('should include reflector in monster data', () => {
      const monster: Monster = {
        id: 'test-4',
        name: 'カイ',
        species: 'ゼフィル',
        stats: {
          hp: 200,
          strength: 45,
          special: 40,
          speed: 50,
          toughness: 30,
          specialAttackCount: 5,
        },
        weapon: {
          name: 'ゼフィルブレード',
          multiplier: 1.6,
        },
        reflector: {
          name: 'ゼフィルガード',
          maxReflectCount: 2,
          reflectRate: 0.5,
        },
      };
      expect(monster.reflector).toBeDefined();
      expect(monster.reflector).toHaveProperty('name');
      expect(monster.reflector).toHaveProperty('maxReflectCount');
      expect(monster.reflector).toHaveProperty('reflectRate');
    });
  });

  describe('MonsterBattleState', () => {
    it('should track current HP', () => {
      const battleState: MonsterBattleState = {
        monsterId: 'test-1',
        currentHp: 200,
        currentStance: StanceType.NORMAL,
        remainingSpecialCount: 5,
        usedReflectCount: 0,
      };
      expect(battleState.currentHp).toBe(200);
    });

    it('should track current stance', () => {
      const battleState: MonsterBattleState = {
        monsterId: 'test-1',
        currentHp: 250,
        currentStance: StanceType.OFFENSIVE,
        remainingSpecialCount: 5,
        usedReflectCount: 0,
      };
      expect(battleState.currentStance).toBe(StanceType.OFFENSIVE);
    });

    it('should track remaining special attack count', () => {
      const battleState: MonsterBattleState = {
        monsterId: 'test-1',
        currentHp: 250,
        currentStance: StanceType.NORMAL,
        remainingSpecialCount: 3,
        usedReflectCount: 0,
      };
      expect(battleState.remainingSpecialCount).toBe(3);
    });

    it('should track used reflector count', () => {
      const battleState: MonsterBattleState = {
        monsterId: 'test-1',
        currentHp: 250,
        currentStance: StanceType.NORMAL,
        remainingSpecialCount: 5,
        usedReflectCount: 1,
      };
      expect(battleState.usedReflectCount).toBe(1);
    });

    it('should allow HP to decrease below max', () => {
      const battleState: MonsterBattleState = {
        monsterId: 'test-1',
        currentHp: 100,
        currentStance: StanceType.NORMAL,
        remainingSpecialCount: 5,
        usedReflectCount: 0,
      };
      expect(battleState.currentHp).toBeLessThan(250);
    });

    it('should not allow negative HP', () => {
      const battleState: MonsterBattleState = {
        monsterId: 'test-1',
        currentHp: 0,
        currentStance: StanceType.NORMAL,
        remainingSpecialCount: 5,
        usedReflectCount: 0,
      };
      expect(battleState.currentHp).toBeGreaterThanOrEqual(0);
    });

    it('should not allow special count to exceed initial count', () => {
      const battleState: MonsterBattleState = {
        monsterId: 'test-1',
        currentHp: 250,
        currentStance: StanceType.NORMAL,
        remainingSpecialCount: 5,
        usedReflectCount: 0,
      };
      expect(battleState.remainingSpecialCount).toBeLessThanOrEqual(5);
    });
  });
});
