import { DistanceType, CommandType } from '../../types';
import { calculateEvasionRate, isGuaranteedHit } from '../../battle/evasion';

describe('calculateEvasionRate', () => {
  // 計算式: min(素早さ × 0.5, 25)%

  it('素早さ10で回避率5%', () => {
    expect(calculateEvasionRate(10)).toBe(5);
  });

  it('素早さ20で回避率10%', () => {
    expect(calculateEvasionRate(20)).toBe(10);
  });

  it('素早さ30で回避率15%', () => {
    expect(calculateEvasionRate(30)).toBe(15);
  });

  it('素早さ40で回避率20%', () => {
    expect(calculateEvasionRate(40)).toBe(20);
  });

  it('素早さ50で回避率25%（上限）', () => {
    expect(calculateEvasionRate(50)).toBe(25);
  });

  it('素早さ100でも回避率25%を超えない', () => {
    expect(calculateEvasionRate(100)).toBe(25);
  });

  it('素早さ0で回避率0%', () => {
    expect(calculateEvasionRate(0)).toBe(0);
  });

  it('素早さ15で回避率7.5%', () => {
    expect(calculateEvasionRate(15)).toBe(7.5);
  });

  it('素早さ45で回避率22.5%', () => {
    expect(calculateEvasionRate(45)).toBe(22.5);
  });
});

describe('isGuaranteedHit', () => {
  // 近距離で武器 vs 武器は回避不可（必中相打ち）

  it('近距離で武器 vs 武器は必中', () => {
    expect(
      isGuaranteedHit(DistanceType.NEAR, CommandType.WEAPON_ATTACK, CommandType.WEAPON_ATTACK)
    ).toBe(true);
  });

  it('中距離で武器 vs 武器は必中ではない', () => {
    expect(
      isGuaranteedHit(DistanceType.MID, CommandType.WEAPON_ATTACK, CommandType.WEAPON_ATTACK)
    ).toBe(false);
  });

  it('遠距離で武器 vs 武器は必中ではない', () => {
    expect(
      isGuaranteedHit(DistanceType.FAR, CommandType.WEAPON_ATTACK, CommandType.WEAPON_ATTACK)
    ).toBe(false);
  });

  it('近距離で武器 vs 特殊は必中ではない', () => {
    expect(
      isGuaranteedHit(DistanceType.NEAR, CommandType.WEAPON_ATTACK, CommandType.SPECIAL_ATTACK)
    ).toBe(false);
  });

  it('近距離で特殊 vs 武器は必中ではない', () => {
    expect(
      isGuaranteedHit(DistanceType.NEAR, CommandType.SPECIAL_ATTACK, CommandType.WEAPON_ATTACK)
    ).toBe(false);
  });

  it('近距離で特殊 vs 特殊は必中ではない', () => {
    expect(
      isGuaranteedHit(DistanceType.NEAR, CommandType.SPECIAL_ATTACK, CommandType.SPECIAL_ATTACK)
    ).toBe(false);
  });
});
