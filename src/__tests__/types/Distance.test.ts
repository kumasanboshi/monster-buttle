import {
  DistanceType,
  moveCloser,
  moveFarther,
  calculateDistance,
} from '../../types/Distance';
import { CommandType } from '../../types/Command';

describe('Distance Types', () => {
  describe('DistanceType enum', () => {
    it('should have NEAR distance', () => {
      expect(DistanceType.NEAR).toBe('NEAR');
    });

    it('should have MID distance', () => {
      expect(DistanceType.MID).toBe('MID');
    });

    it('should have FAR distance', () => {
      expect(DistanceType.FAR).toBe('FAR');
    });

    it('should have exactly 3 distance types', () => {
      const distanceTypes = Object.values(DistanceType);
      expect(distanceTypes).toHaveLength(3);
    });
  });

  describe('Distance transition helpers', () => {
    describe('moveCloser', () => {
      it('should move closer from MID to NEAR', () => {
        const result = moveCloser(DistanceType.MID);
        expect(result).toBe(DistanceType.NEAR);
      });

      it('should move closer from FAR to MID', () => {
        const result = moveCloser(DistanceType.FAR);
        expect(result).toBe(DistanceType.MID);
      });

      it('should stay at NEAR when already at minimum', () => {
        const result = moveCloser(DistanceType.NEAR);
        expect(result).toBe(DistanceType.NEAR);
      });
    });

    describe('moveFarther', () => {
      it('should move farther from MID to FAR', () => {
        const result = moveFarther(DistanceType.MID);
        expect(result).toBe(DistanceType.FAR);
      });

      it('should move farther from NEAR to MID', () => {
        const result = moveFarther(DistanceType.NEAR);
        expect(result).toBe(DistanceType.MID);
      });

      it('should stay at FAR when already at maximum', () => {
        const result = moveFarther(DistanceType.FAR);
        expect(result).toBe(DistanceType.FAR);
      });
    });

    describe('calculateDistance', () => {
      it('should move 1 step closer when player1 advances and player2 does not retreat', () => {
        const result = calculateDistance(
          DistanceType.MID,
          CommandType.ADVANCE,
          CommandType.WEAPON_ATTACK
        );
        expect(result).toBe(DistanceType.NEAR);
      });

      it('should move 1 step farther when player1 retreats and player2 does not advance', () => {
        const result = calculateDistance(
          DistanceType.MID,
          CommandType.RETREAT,
          CommandType.WEAPON_ATTACK
        );
        expect(result).toBe(DistanceType.FAR);
      });

      it('should move 2 steps closer when both players advance', () => {
        const result = calculateDistance(
          DistanceType.FAR,
          CommandType.ADVANCE,
          CommandType.ADVANCE
        );
        expect(result).toBe(DistanceType.NEAR);
      });

      it('should move 2 steps farther when both players retreat', () => {
        const result = calculateDistance(
          DistanceType.NEAR,
          CommandType.RETREAT,
          CommandType.RETREAT
        );
        expect(result).toBe(DistanceType.FAR);
      });

      it('should not change distance when one advances and one retreats', () => {
        const result = calculateDistance(
          DistanceType.MID,
          CommandType.ADVANCE,
          CommandType.RETREAT
        );
        expect(result).toBe(DistanceType.MID);
      });

      it('should not change distance when neither player moves', () => {
        const result = calculateDistance(
          DistanceType.MID,
          CommandType.WEAPON_ATTACK,
          CommandType.SPECIAL_ATTACK
        );
        expect(result).toBe(DistanceType.MID);
      });

      it('should not go beyond NEAR when moving closer', () => {
        const result = calculateDistance(
          DistanceType.NEAR,
          CommandType.ADVANCE,
          CommandType.ADVANCE
        );
        expect(result).toBe(DistanceType.NEAR);
      });

      it('should not go beyond FAR when moving farther', () => {
        const result = calculateDistance(
          DistanceType.FAR,
          CommandType.RETREAT,
          CommandType.RETREAT
        );
        expect(result).toBe(DistanceType.FAR);
      });
    });
  });
});
