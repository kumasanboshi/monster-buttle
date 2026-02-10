import { StanceType, STANCE_MODIFIERS } from '../types';

interface WeaponAttacker {
  strength: number;
  weaponMultiplier: number;
  stance: StanceType;
}

interface WeaponDefender {
  toughness: number;
  stance: StanceType;
}

interface SpecialAttacker {
  special: number;
  stance: StanceType;
}

/**
 * 武器攻撃のダメージ計算
 * 計算式: max(腕力 × 攻撃倍率 × 武器倍率 - 丈夫さ × 防御倍率, 1)
 */
export function calculateWeaponDamage(attacker: WeaponAttacker, defender: WeaponDefender): number {
  const attackMod = STANCE_MODIFIERS[attacker.stance].attackModifier;
  const defenseMod = STANCE_MODIFIERS[defender.stance].defenseModifier;

  const rawDamage = attacker.strength * attackMod * attacker.weaponMultiplier - defender.toughness * defenseMod;
  return Math.max(Math.floor(rawDamage), 1);
}

/**
 * 特殊攻撃のダメージ計算
 * 計算式: 特殊 × 攻撃倍率 × 技倍率(1.0)
 * 回数超過時: × 0.5
 */
export function calculateSpecialDamage(attacker: SpecialAttacker, isExceeded: boolean): number {
  const attackMod = STANCE_MODIFIERS[attacker.stance].attackModifier;
  const exceedMod = isExceeded ? 0.5 : 1.0;

  const rawDamage = attacker.special * attackMod * 1.0 * exceedMod;
  return Math.max(Math.floor(rawDamage), 1);
}

/**
 * リフレクター反射ダメージ計算
 * 計算式: 相手の特殊ダメージ × 反射率
 */
export function calculateReflectDamage(incomingSpecialDamage: number, reflectRate: number): number {
  const rawDamage = incomingSpecialDamage * reflectRate;
  return Math.max(Math.floor(rawDamage), 1);
}
