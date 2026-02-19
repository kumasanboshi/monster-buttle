import { Monster, MonsterStats } from '../types/Monster';
import { MONSTER_DATABASE, ABILITY_UP_VALUES } from './monsters';

const MAX_GROWTH_STAGES = 7;

/**
 * 能力UP値の型
 */
interface AbilityUpValue {
  hp: number;
  strength: number;
  special: number;
  speed: number;
  toughness: number;
}

/**
 * 指定成長段階のステータスを計算する
 * specialAttackCountは成長しない
 */
export function calculateGrownStats(
  baseStats: MonsterStats,
  abilityUp: AbilityUpValue,
  stages: number,
): MonsterStats {
  const clampedStages = Math.max(0, Math.min(stages, MAX_GROWTH_STAGES));
  return {
    hp: baseStats.hp + abilityUp.hp * clampedStages,
    strength: baseStats.strength + abilityUp.strength * clampedStages,
    special: baseStats.special + abilityUp.special * clampedStages,
    speed: baseStats.speed + abilityUp.speed * clampedStages,
    toughness: baseStats.toughness + abilityUp.toughness * clampedStages,
    specialAttackCount: baseStats.specialAttackCount,
  };
}

/**
 * 指定成長段階のパラメータを持つモンスターを返す
 */
export function getMonsterWithGrownStats(monsterId: string, stages: number): Monster | undefined {
  const base = MONSTER_DATABASE.find((m) => m.id === monsterId);
  if (!base) return undefined;

  const abilityUp = ABILITY_UP_VALUES[monsterId];
  if (!abilityUp) return undefined;

  return {
    ...base,
    stats: calculateGrownStats(base.stats, abilityUp, stages),
  };
}

/**
 * 最終パラメータ（全ステージクリア後）を持つモンスターを返す
 */
export function getMonsterWithFinalStats(monsterId: string): Monster | undefined {
  const base = MONSTER_DATABASE.find((m) => m.id === monsterId);
  if (!base) return undefined;

  const abilityUp = ABILITY_UP_VALUES[monsterId];
  if (!abilityUp) return undefined;

  return {
    ...base,
    stats: calculateGrownStats(base.stats, abilityUp, MAX_GROWTH_STAGES),
  };
}

/** パラメータ成長差分の型 */
export interface StatsDiff {
  hp: { before: number; after: number; gain: number };
  strength: { before: number; after: number; gain: number };
  special: { before: number; after: number; gain: number };
  speed: { before: number; after: number; gain: number };
  toughness: { before: number; after: number; gain: number };
}

/**
 * ステージクリア前後のパラメータ差分を計算する
 * stagesAfter: クリア後のclearedStages（1以上）
 * stagesAfter=0 の場合は before=after=基礎値（gain=0）
 */
export function calculateStatsDiff(monsterId: string, stagesAfter: number): StatsDiff | undefined {
  const base = MONSTER_DATABASE.find((m) => m.id === monsterId);
  if (!base) return undefined;

  const abilityUp = ABILITY_UP_VALUES[monsterId];
  if (!abilityUp) return undefined;

  const before = calculateGrownStats(base.stats, abilityUp, Math.max(0, stagesAfter - 1));
  const after = calculateGrownStats(base.stats, abilityUp, stagesAfter);

  return {
    hp:        { before: before.hp,        after: after.hp,        gain: after.hp        - before.hp },
    strength:  { before: before.strength,  after: after.strength,  gain: after.strength  - before.strength },
    special:   { before: before.special,   after: after.special,   gain: after.special   - before.special },
    speed:     { before: before.speed,     after: after.speed,     gain: after.speed     - before.speed },
    toughness: { before: before.toughness, after: after.toughness, gain: after.toughness - before.toughness },
  };
}

/**
 * 全モンスターの最終パラメータ版データベース
 */
export const FINAL_MONSTER_DATABASE: Monster[] = MONSTER_DATABASE
  .map((m) => getMonsterWithFinalStats(m.id))
  .filter((m): m is Monster => m !== undefined);
