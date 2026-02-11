import { CommandType, DistanceType } from '../types';

/**
 * コマンドの戦闘結果
 */
export enum CommandOutcome {
  /** 攻撃命中 */
  HIT = 'HIT',
  /** 攻撃空振り（射程外） */
  MISS = 'MISS',
  /** 上位優先コマンドにより潰された */
  CANCELLED = 'CANCELLED',
  /** リフレクターにカウンターされた */
  COUNTERED = 'COUNTERED',
  /** 戦闘効果なし */
  NO_EFFECT = 'NO_EFFECT',
}

export interface CommandResolution {
  p1Outcome: CommandOutcome;
  p2Outcome: CommandOutcome;
}

/**
 * 戦闘コマンド（武器攻撃・特殊攻撃・リフレクター）かどうかを判定
 */
export function isCombatCommand(cmd: CommandType): boolean {
  return (
    cmd === CommandType.WEAPON_ATTACK ||
    cmd === CommandType.SPECIAL_ATTACK ||
    cmd === CommandType.REFLECTOR
  );
}

/**
 * 武器攻撃の射程判定（近距離のみ有効）
 */
export function isWeaponInRange(distance: DistanceType): boolean {
  return distance === DistanceType.NEAR;
}

/**
 * 単一コマンドの戦闘結果を判定
 */
function resolveSingleCommand(
  attackerCmd: CommandType,
  defenderCmd: CommandType,
  distance: DistanceType
): CommandOutcome {
  // 非戦闘コマンド（移動・スタンス）は戦闘効果なし
  if (!isCombatCommand(attackerCmd)) {
    return CommandOutcome.NO_EFFECT;
  }

  // リフレクターは単独では効果なし（相手の特殊攻撃にのみ反応）
  if (attackerCmd === CommandType.REFLECTOR) {
    return CommandOutcome.NO_EFFECT;
  }

  // 武器攻撃
  if (attackerCmd === CommandType.WEAPON_ATTACK) {
    if (!isWeaponInRange(distance)) {
      return CommandOutcome.MISS;
    }
    // 近距離: 武器は常に命中（リフレクター貫通、特殊を潰す）
    return CommandOutcome.HIT;
  }

  // 特殊攻撃
  if (attackerCmd === CommandType.SPECIAL_ATTACK) {
    // 相手がリフレクター → カウンター
    if (defenderCmd === CommandType.REFLECTOR) {
      return CommandOutcome.COUNTERED;
    }
    // 近距離で相手が武器攻撃 → 特殊が潰される
    if (defenderCmd === CommandType.WEAPON_ATTACK && isWeaponInRange(distance)) {
      return CommandOutcome.CANCELLED;
    }
    // それ以外: 特殊攻撃は全距離で命中
    return CommandOutcome.HIT;
  }

  return CommandOutcome.NO_EFFECT;
}

/**
 * コマンド優先順位の解決
 *
 * じゃんけん構造: 武器攻撃 > リフレクター > 特殊攻撃
 * - 武器攻撃 > 特殊攻撃: 近距離で武器が先に発生し特殊を潰す
 * - 武器攻撃 > リフレクター: 武器はリフレクターを貫通
 * - リフレクター > 特殊攻撃: 特殊攻撃を無効化/反射
 */
export function resolveCommandInteraction(
  distance: DistanceType,
  p1Cmd: CommandType,
  p2Cmd: CommandType
): CommandResolution {
  return {
    p1Outcome: resolveSingleCommand(p1Cmd, p2Cmd, distance),
    p2Outcome: resolveSingleCommand(p2Cmd, p1Cmd, distance),
  };
}
