import { StanceType, STANCE_MODIFIERS } from '../../types';
import {
  calculateWeaponDamage,
  calculateSpecialDamage,
  calculateReflectDamage,
} from '../../battle/damage';

describe('calculateWeaponDamage', () => {
  // 計算式: max(腕力 × 攻撃倍率 × 武器倍率 - 丈夫さ × 防御倍率, 1)

  it('通常スタンス同士の基本ダメージ計算', () => {
    // 50 * 1.0 * 1.6 - 50 * 1.0 = 80 - 50 = 30
    const damage = calculateWeaponDamage(
      { strength: 50, weaponMultiplier: 1.6, stance: StanceType.NORMAL },
      { toughness: 50, stance: StanceType.NORMAL }
    );
    expect(damage).toBe(30);
  });

  it('攻勢スタンスの攻撃者はダメージが増加する', () => {
    // 50 * 1.3 * 1.6 - 50 * 1.0 = 104 - 50 = 54
    const damage = calculateWeaponDamage(
      { strength: 50, weaponMultiplier: 1.6, stance: StanceType.OFFENSIVE },
      { toughness: 50, stance: StanceType.NORMAL }
    );
    expect(damage).toBe(54);
  });

  it('守勢スタンスの防御者はダメージが軽減される', () => {
    // 50 * 1.0 * 1.6 - 50 * 1.3 = 80 - 65 = 15
    const damage = calculateWeaponDamage(
      { strength: 50, weaponMultiplier: 1.6, stance: StanceType.NORMAL },
      { toughness: 50, stance: StanceType.DEFENSIVE }
    );
    expect(damage).toBe(15);
  });

  it('攻勢攻撃者 vs 守勢防御者', () => {
    // 50 * 1.3 * 1.6 - 50 * 1.3 = 104 - 65 = 39
    const damage = calculateWeaponDamage(
      { strength: 50, weaponMultiplier: 1.6, stance: StanceType.OFFENSIVE },
      { toughness: 50, stance: StanceType.DEFENSIVE }
    );
    expect(damage).toBe(39);
  });

  it('守勢攻撃者 vs 通常防御者', () => {
    // 50 * 0.7 * 1.6 - 50 * 1.0 = 56 - 50 = 6
    const damage = calculateWeaponDamage(
      { strength: 50, weaponMultiplier: 1.6, stance: StanceType.DEFENSIVE },
      { toughness: 50, stance: StanceType.NORMAL }
    );
    expect(damage).toBe(6);
  });

  it('最低ダメージ1が保証される', () => {
    // 10 * 1.0 * 1.4 - 80 * 1.0 = 14 - 80 = -66 → 1
    const damage = calculateWeaponDamage(
      { strength: 10, weaponMultiplier: 1.4, stance: StanceType.NORMAL },
      { toughness: 80, stance: StanceType.NORMAL }
    );
    expect(damage).toBe(1);
  });

  it('守勢攻撃者 vs 守勢防御者で最低ダメージ1', () => {
    // 20 * 0.7 * 1.4 - 80 * 1.3 = 19.6 - 104 = -84.4 → 1
    const damage = calculateWeaponDamage(
      { strength: 20, weaponMultiplier: 1.4, stance: StanceType.DEFENSIVE },
      { toughness: 80, stance: StanceType.DEFENSIVE }
    );
    expect(damage).toBe(1);
  });

  it('ガルダン(腕力75,A武器) vs バルガ(丈夫さ80) 通常スタンス', () => {
    // 75 * 1.0 * 1.6 - 80 * 1.0 = 120 - 80 = 40
    const damage = calculateWeaponDamage(
      { strength: 75, weaponMultiplier: 1.6, stance: StanceType.NORMAL },
      { toughness: 80, stance: StanceType.NORMAL }
    );
    expect(damage).toBe(40);
  });

  it('タイプB武器(倍率1.4)での計算', () => {
    // 50 * 1.0 * 1.4 - 50 * 1.0 = 70 - 50 = 20
    const damage = calculateWeaponDamage(
      { strength: 50, weaponMultiplier: 1.4, stance: StanceType.NORMAL },
      { toughness: 50, stance: StanceType.NORMAL }
    );
    expect(damage).toBe(20);
  });

  it('ダメージが整数(小数点切り捨て)であること', () => {
    // 45 * 1.3 * 1.6 - 30 * 0.7 = 93.6 - 21 = 72.6 → 72
    const damage = calculateWeaponDamage(
      { strength: 45, weaponMultiplier: 1.6, stance: StanceType.OFFENSIVE },
      { toughness: 30, stance: StanceType.OFFENSIVE }
    );
    expect(Number.isInteger(damage)).toBe(true);
  });
});

describe('calculateSpecialDamage', () => {
  // 計算式: 特殊 × 攻撃倍率 × 技倍率(1.0)
  // 回数超過時: × 0.5

  it('通常スタンスの基本特殊ダメージ', () => {
    // 50 * 1.0 * 1.0 = 50
    const damage = calculateSpecialDamage(
      { special: 50, stance: StanceType.NORMAL },
      false
    );
    expect(damage).toBe(50);
  });

  it('攻勢スタンスの特殊ダメージ増加', () => {
    // 50 * 1.3 * 1.0 = 65
    const damage = calculateSpecialDamage(
      { special: 50, stance: StanceType.OFFENSIVE },
      false
    );
    expect(damage).toBe(65);
  });

  it('守勢スタンスの特殊ダメージ減少', () => {
    // 50 * 0.7 * 1.0 = 35
    const damage = calculateSpecialDamage(
      { special: 50, stance: StanceType.DEFENSIVE },
      false
    );
    expect(damage).toBe(35);
  });

  it('回数超過時はダメージ半減', () => {
    // 50 * 1.0 * 1.0 * 0.5 = 25
    const damage = calculateSpecialDamage(
      { special: 50, stance: StanceType.NORMAL },
      true
    );
    expect(damage).toBe(25);
  });

  it('攻勢 + 回数超過時', () => {
    // 80 * 1.3 * 1.0 * 0.5 = 52
    const damage = calculateSpecialDamage(
      { special: 80, stance: StanceType.OFFENSIVE },
      true
    );
    expect(damage).toBe(52);
  });

  it('守勢 + 回数超過時', () => {
    // 80 * 0.7 * 1.0 * 0.5 = 28
    const damage = calculateSpecialDamage(
      { special: 80, stance: StanceType.DEFENSIVE },
      true
    );
    expect(damage).toBe(28);
  });

  it('ルーナ(特殊80)の通常攻撃', () => {
    // 80 * 1.0 = 80
    const damage = calculateSpecialDamage(
      { special: 80, stance: StanceType.NORMAL },
      false
    );
    expect(damage).toBe(80);
  });

  it('最低ダメージ1が保証される', () => {
    // 特殊が極端に低くても1以上
    const damage = calculateSpecialDamage(
      { special: 1, stance: StanceType.DEFENSIVE },
      true
    );
    // 1 * 0.7 * 0.5 = 0.35 → 1
    expect(damage).toBeGreaterThanOrEqual(1);
  });

  it('ダメージが整数であること', () => {
    // 15 * 1.3 * 0.5 = 9.75 → 整数
    const damage = calculateSpecialDamage(
      { special: 15, stance: StanceType.OFFENSIVE },
      true
    );
    expect(Number.isInteger(damage)).toBe(true);
  });
});

describe('calculateReflectDamage', () => {
  // 計算式: 相手の特殊ダメージ × 反射率

  it('タイプA(反射率0.5)のリフレクター反射', () => {
    // 50 * 0.5 = 25
    const damage = calculateReflectDamage(50, 0.5);
    expect(damage).toBe(25);
  });

  it('タイプB(反射率0.6)のリフレクター反射', () => {
    // 80 * 0.6 = 48
    const damage = calculateReflectDamage(80, 0.6);
    expect(damage).toBe(48);
  });

  it('反射ダメージが整数であること', () => {
    // 75 * 0.6 = 45
    const damage = calculateReflectDamage(75, 0.6);
    expect(Number.isInteger(damage)).toBe(true);
  });

  it('小数点が出る場合は切り捨て', () => {
    // 35 * 0.5 = 17.5 → 17
    const damage = calculateReflectDamage(35, 0.5);
    expect(damage).toBe(17);
  });

  it('最低ダメージ1が保証される', () => {
    // 1 * 0.5 = 0.5 → 1
    const damage = calculateReflectDamage(1, 0.5);
    expect(damage).toBe(1);
  });
});
