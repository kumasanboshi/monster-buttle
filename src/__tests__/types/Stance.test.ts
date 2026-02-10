import {
  StanceType,
  StanceModifiers,
  STANCE_MODIFIERS,
  calculateNextStance,
} from '../../types/Stance';
import { CommandType } from '../../types/Command';

describe('Stance Types', () => {
  describe('StanceType enum', () => {
    it('should have NORMAL stance', () => {
      expect(StanceType.NORMAL).toBe('NORMAL');
    });

    it('should have OFFENSIVE stance', () => {
      expect(StanceType.OFFENSIVE).toBe('OFFENSIVE');
    });

    it('should have DEFENSIVE stance', () => {
      expect(StanceType.DEFENSIVE).toBe('DEFENSIVE');
    });

    it('should have exactly 3 stance types', () => {
      const stanceTypes = Object.values(StanceType);
      expect(stanceTypes).toHaveLength(3);
    });
  });

  describe('StanceModifiers', () => {
    it('should have NORMAL with 1.0x attack and 1.0x defense', () => {
      const normalMod = STANCE_MODIFIERS[StanceType.NORMAL];
      expect(normalMod.attackModifier).toBe(1.0);
      expect(normalMod.defenseModifier).toBe(1.0);
    });

    it('should have OFFENSIVE with 1.3x attack and 0.7x defense', () => {
      const offensiveMod = STANCE_MODIFIERS[StanceType.OFFENSIVE];
      expect(offensiveMod.attackModifier).toBe(1.3);
      expect(offensiveMod.defenseModifier).toBe(0.7);
    });

    it('should have DEFENSIVE with 0.7x attack and 1.3x defense', () => {
      const defensiveMod = STANCE_MODIFIERS[StanceType.DEFENSIVE];
      expect(defensiveMod.attackModifier).toBe(0.7);
      expect(defensiveMod.defenseModifier).toBe(1.3);
    });

    it('should define attackModifier for each stance', () => {
      Object.values(StanceType).forEach((stance) => {
        expect(STANCE_MODIFIERS[stance]).toHaveProperty('attackModifier');
        expect(typeof STANCE_MODIFIERS[stance].attackModifier).toBe('number');
      });
    });

    it('should define defenseModifier for each stance', () => {
      Object.values(StanceType).forEach((stance) => {
        expect(STANCE_MODIFIERS[stance]).toHaveProperty('defenseModifier');
        expect(typeof STANCE_MODIFIERS[stance].defenseModifier).toBe('number');
      });
    });
  });

  describe('Stance transition', () => {
    it('should switch from NORMAL to OFFENSIVE with STANCE_A', () => {
      const nextStance = calculateNextStance(StanceType.NORMAL, CommandType.STANCE_A);
      expect(nextStance).toBe(StanceType.OFFENSIVE);
    });

    it('should switch from NORMAL to DEFENSIVE with STANCE_B', () => {
      const nextStance = calculateNextStance(StanceType.NORMAL, CommandType.STANCE_B);
      expect(nextStance).toBe(StanceType.DEFENSIVE);
    });

    it('should switch from OFFENSIVE to NORMAL with STANCE_A', () => {
      const nextStance = calculateNextStance(StanceType.OFFENSIVE, CommandType.STANCE_A);
      expect(nextStance).toBe(StanceType.NORMAL);
    });

    it('should switch from OFFENSIVE to DEFENSIVE with STANCE_B', () => {
      const nextStance = calculateNextStance(StanceType.OFFENSIVE, CommandType.STANCE_B);
      expect(nextStance).toBe(StanceType.DEFENSIVE);
    });

    it('should switch from DEFENSIVE to NORMAL with STANCE_A', () => {
      const nextStance = calculateNextStance(StanceType.DEFENSIVE, CommandType.STANCE_A);
      expect(nextStance).toBe(StanceType.NORMAL);
    });

    it('should switch from DEFENSIVE to OFFENSIVE with STANCE_B', () => {
      const nextStance = calculateNextStance(StanceType.DEFENSIVE, CommandType.STANCE_B);
      expect(nextStance).toBe(StanceType.OFFENSIVE);
    });
  });
});
