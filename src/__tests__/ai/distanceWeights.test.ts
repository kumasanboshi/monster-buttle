import { DISTANCE_WEIGHTS, getDistanceWeights } from '../../ai/distanceWeights';
import { CommandType, DistanceType } from '../../types';

describe('DISTANCE_WEIGHTS定数', () => {
  it('全3距離（NEAR, MID, FAR）のエントリがある', () => {
    expect(DISTANCE_WEIGHTS).toHaveProperty(DistanceType.NEAR);
    expect(DISTANCE_WEIGHTS).toHaveProperty(DistanceType.MID);
    expect(DISTANCE_WEIGHTS).toHaveProperty(DistanceType.FAR);
  });

  it('各距離に全7コマンドの重みがある', () => {
    const allCommands = Object.values(CommandType);
    for (const distance of Object.values(DistanceType)) {
      const weights = DISTANCE_WEIGHTS[distance];
      for (const cmd of allCommands) {
        expect(weights).toHaveProperty(cmd);
        expect(typeof weights[cmd]).toBe('number');
      }
    }
  });

  it('全ての重みは正の値', () => {
    for (const distance of Object.values(DistanceType)) {
      const weights = DISTANCE_WEIGHTS[distance];
      for (const cmd of Object.values(CommandType)) {
        expect(weights[cmd]).toBeGreaterThan(0);
      }
    }
  });

  describe('NEAR距離', () => {
    it('WEAPON_ATTACKの重みが最も高い', () => {
      const near = DISTANCE_WEIGHTS[DistanceType.NEAR];
      const weaponWeight = near[CommandType.WEAPON_ATTACK];
      for (const cmd of Object.values(CommandType)) {
        if (cmd !== CommandType.WEAPON_ATTACK) {
          expect(weaponWeight).toBeGreaterThanOrEqual(near[cmd]);
        }
      }
    });

    it('ADVANCEの重みは基準(1.0)未満（既に近いため）', () => {
      expect(DISTANCE_WEIGHTS[DistanceType.NEAR][CommandType.ADVANCE]).toBeLessThan(1.0);
    });
  });

  describe('MID距離', () => {
    it('極端な重み（2.0以上）がない', () => {
      const mid = DISTANCE_WEIGHTS[DistanceType.MID];
      for (const cmd of Object.values(CommandType)) {
        expect(mid[cmd]).toBeLessThan(2.0);
      }
    });
  });

  describe('FAR距離', () => {
    it('SPECIAL_ATTACKの重みが高い', () => {
      const far = DISTANCE_WEIGHTS[DistanceType.FAR];
      expect(far[CommandType.SPECIAL_ATTACK]).toBeGreaterThan(1.5);
    });

    it('ADVANCEの重みが高い（距離を詰めるため）', () => {
      const far = DISTANCE_WEIGHTS[DistanceType.FAR];
      expect(far[CommandType.ADVANCE]).toBeGreaterThan(1.5);
    });

    it('RETREATの重みは基準(1.0)未満（既に遠いため）', () => {
      expect(DISTANCE_WEIGHTS[DistanceType.FAR][CommandType.RETREAT]).toBeLessThan(1.0);
    });
  });
});

describe('getDistanceWeights', () => {
  it('NEAR距離のモディファイアを返す', () => {
    expect(getDistanceWeights(DistanceType.NEAR)).toBe(DISTANCE_WEIGHTS[DistanceType.NEAR]);
  });

  it('MID距離のモディファイアを返す', () => {
    expect(getDistanceWeights(DistanceType.MID)).toBe(DISTANCE_WEIGHTS[DistanceType.MID]);
  });

  it('FAR距離のモディファイアを返す', () => {
    expect(getDistanceWeights(DistanceType.FAR)).toBe(DISTANCE_WEIGHTS[DistanceType.FAR]);
  });
});
