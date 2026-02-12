import { predictStateAfterCommand } from '../../ai/statePredictor';
import { CommandType, DistanceType, StanceType } from '../../types';

describe('predictStateAfterCommand', () => {
  describe('距離予測', () => {
    it('ADVANCE: FAR → MID', () => {
      const result = predictStateAfterCommand(DistanceType.FAR, StanceType.NORMAL, CommandType.ADVANCE);
      expect(result.predictedDistance).toBe(DistanceType.MID);
    });

    it('ADVANCE: MID → NEAR', () => {
      const result = predictStateAfterCommand(DistanceType.MID, StanceType.NORMAL, CommandType.ADVANCE);
      expect(result.predictedDistance).toBe(DistanceType.NEAR);
    });

    it('ADVANCE: NEAR → NEAR（下限クランプ）', () => {
      const result = predictStateAfterCommand(DistanceType.NEAR, StanceType.NORMAL, CommandType.ADVANCE);
      expect(result.predictedDistance).toBe(DistanceType.NEAR);
    });

    it('RETREAT: NEAR → MID', () => {
      const result = predictStateAfterCommand(DistanceType.NEAR, StanceType.NORMAL, CommandType.RETREAT);
      expect(result.predictedDistance).toBe(DistanceType.MID);
    });

    it('RETREAT: MID → FAR', () => {
      const result = predictStateAfterCommand(DistanceType.MID, StanceType.NORMAL, CommandType.RETREAT);
      expect(result.predictedDistance).toBe(DistanceType.FAR);
    });

    it('RETREAT: FAR → FAR（上限クランプ）', () => {
      const result = predictStateAfterCommand(DistanceType.FAR, StanceType.NORMAL, CommandType.RETREAT);
      expect(result.predictedDistance).toBe(DistanceType.FAR);
    });

    it('WEAPON_ATTACK: 距離変化なし', () => {
      const result = predictStateAfterCommand(DistanceType.NEAR, StanceType.NORMAL, CommandType.WEAPON_ATTACK);
      expect(result.predictedDistance).toBe(DistanceType.NEAR);
    });

    it('SPECIAL_ATTACK: 距離変化なし', () => {
      const result = predictStateAfterCommand(DistanceType.MID, StanceType.NORMAL, CommandType.SPECIAL_ATTACK);
      expect(result.predictedDistance).toBe(DistanceType.MID);
    });

    it('REFLECTOR: 距離変化なし', () => {
      const result = predictStateAfterCommand(DistanceType.FAR, StanceType.NORMAL, CommandType.REFLECTOR);
      expect(result.predictedDistance).toBe(DistanceType.FAR);
    });

    it('STANCE_A: 距離変化なし', () => {
      const result = predictStateAfterCommand(DistanceType.MID, StanceType.NORMAL, CommandType.STANCE_A);
      expect(result.predictedDistance).toBe(DistanceType.MID);
    });

    it('STANCE_B: 距離変化なし', () => {
      const result = predictStateAfterCommand(DistanceType.MID, StanceType.NORMAL, CommandType.STANCE_B);
      expect(result.predictedDistance).toBe(DistanceType.MID);
    });
  });

  describe('スタンス予測', () => {
    it('STANCE_A: NORMAL → OFFENSIVE', () => {
      const result = predictStateAfterCommand(DistanceType.MID, StanceType.NORMAL, CommandType.STANCE_A);
      expect(result.predictedStance).toBe(StanceType.OFFENSIVE);
    });

    it('STANCE_A: OFFENSIVE → NORMAL', () => {
      const result = predictStateAfterCommand(DistanceType.MID, StanceType.OFFENSIVE, CommandType.STANCE_A);
      expect(result.predictedStance).toBe(StanceType.NORMAL);
    });

    it('STANCE_A: DEFENSIVE → NORMAL', () => {
      const result = predictStateAfterCommand(DistanceType.MID, StanceType.DEFENSIVE, CommandType.STANCE_A);
      expect(result.predictedStance).toBe(StanceType.NORMAL);
    });

    it('STANCE_B: NORMAL → DEFENSIVE', () => {
      const result = predictStateAfterCommand(DistanceType.MID, StanceType.NORMAL, CommandType.STANCE_B);
      expect(result.predictedStance).toBe(StanceType.DEFENSIVE);
    });

    it('STANCE_B: OFFENSIVE → DEFENSIVE', () => {
      const result = predictStateAfterCommand(DistanceType.MID, StanceType.OFFENSIVE, CommandType.STANCE_B);
      expect(result.predictedStance).toBe(StanceType.DEFENSIVE);
    });

    it('STANCE_B: DEFENSIVE → OFFENSIVE', () => {
      const result = predictStateAfterCommand(DistanceType.MID, StanceType.DEFENSIVE, CommandType.STANCE_B);
      expect(result.predictedStance).toBe(StanceType.OFFENSIVE);
    });

    it('WEAPON_ATTACK: スタンス変化なし', () => {
      const result = predictStateAfterCommand(DistanceType.NEAR, StanceType.OFFENSIVE, CommandType.WEAPON_ATTACK);
      expect(result.predictedStance).toBe(StanceType.OFFENSIVE);
    });

    it('ADVANCE: スタンス変化なし', () => {
      const result = predictStateAfterCommand(DistanceType.MID, StanceType.DEFENSIVE, CommandType.ADVANCE);
      expect(result.predictedStance).toBe(StanceType.DEFENSIVE);
    });
  });

  describe('距離+スタンス同時変化', () => {
    it('ADVANCE: 距離のみ変化、スタンスは維持', () => {
      const result = predictStateAfterCommand(DistanceType.FAR, StanceType.OFFENSIVE, CommandType.ADVANCE);
      expect(result.predictedDistance).toBe(DistanceType.MID);
      expect(result.predictedStance).toBe(StanceType.OFFENSIVE);
    });

    it('STANCE_A: スタンスのみ変化、距離は維持', () => {
      const result = predictStateAfterCommand(DistanceType.FAR, StanceType.NORMAL, CommandType.STANCE_A);
      expect(result.predictedDistance).toBe(DistanceType.FAR);
      expect(result.predictedStance).toBe(StanceType.OFFENSIVE);
    });

    it('SPECIAL_ATTACK: 距離もスタンスも変化なし', () => {
      const result = predictStateAfterCommand(DistanceType.MID, StanceType.DEFENSIVE, CommandType.SPECIAL_ATTACK);
      expect(result.predictedDistance).toBe(DistanceType.MID);
      expect(result.predictedStance).toBe(StanceType.DEFENSIVE);
    });
  });
});
