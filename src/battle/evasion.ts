import { DistanceType, CommandType } from '../types';

/**
 * 回避率を計算する
 * 計算式: min(素早さ × 0.5, 25)
 * @returns 回避率（%）
 */
export function calculateEvasionRate(speed: number): number {
  return Math.min(speed * 0.5, 25);
}

/**
 * 必中判定（回避不可）かどうかを判定する
 * 近距離で双方が武器攻撃の場合のみ必中（回避不可の相打ち）
 */
export function isGuaranteedHit(
  distance: DistanceType,
  attackerCmd: CommandType,
  defenderCmd: CommandType
): boolean {
  return (
    distance === DistanceType.NEAR &&
    attackerCmd === CommandType.WEAPON_ATTACK &&
    defenderCmd === CommandType.WEAPON_ATTACK
  );
}
