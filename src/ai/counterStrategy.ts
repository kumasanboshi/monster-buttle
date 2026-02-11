import { CommandType, DistanceType } from '../types';

type CommandModifiers = Record<CommandType, number>;

const NEUTRAL_MODIFIERS: CommandModifiers = {
  [CommandType.ADVANCE]: 1.0,
  [CommandType.RETREAT]: 1.0,
  [CommandType.WEAPON_ATTACK]: 1.0,
  [CommandType.SPECIAL_ATTACK]: 1.0,
  [CommandType.REFLECTOR]: 1.0,
  [CommandType.STANCE_A]: 1.0,
  [CommandType.STANCE_B]: 1.0,
};

/**
 * 近距離でのカウンターマップ
 *
 * じゃんけん構造:
 * - WEAPON_ATTACK → RETREAT（距離を取る）
 * - SPECIAL_ATTACK → REFLECTOR（反射）+ WEAPON_ATTACK（潰す）
 * - ADVANCE → RETREAT（距離維持）+ WEAPON_ATTACK（迎撃）
 * - RETREAT → ADVANCE（追跡）+ WEAPON_ATTACK（逃げる前に攻撃）
 * - REFLECTOR → WEAPON_ATTACK（貫通）
 * - STANCE → 攻撃系（無防備を突く）
 */
const COUNTER_AT_NEAR: Record<CommandType, Partial<CommandModifiers>> = {
  [CommandType.WEAPON_ATTACK]: {
    [CommandType.RETREAT]: 1.5,
    [CommandType.REFLECTOR]: 1.2,
  },
  [CommandType.SPECIAL_ATTACK]: {
    [CommandType.REFLECTOR]: 1.8,
    [CommandType.WEAPON_ATTACK]: 1.5,
  },
  [CommandType.ADVANCE]: {
    [CommandType.RETREAT]: 1.6,
    [CommandType.WEAPON_ATTACK]: 1.3,
  },
  [CommandType.RETREAT]: {
    [CommandType.ADVANCE]: 1.7,
    [CommandType.WEAPON_ATTACK]: 1.4,
  },
  [CommandType.REFLECTOR]: {
    [CommandType.WEAPON_ATTACK]: 1.8,
    [CommandType.ADVANCE]: 1.2,
  },
  [CommandType.STANCE_A]: {
    [CommandType.WEAPON_ATTACK]: 1.5,
    [CommandType.SPECIAL_ATTACK]: 1.5,
  },
  [CommandType.STANCE_B]: {
    [CommandType.WEAPON_ATTACK]: 1.5,
    [CommandType.SPECIAL_ATTACK]: 1.5,
  },
};

/**
 * 中距離でのカウンターマップ
 */
const COUNTER_AT_MID: Record<CommandType, Partial<CommandModifiers>> = {
  [CommandType.WEAPON_ATTACK]: {
    [CommandType.RETREAT]: 1.4,
    [CommandType.SPECIAL_ATTACK]: 1.3,
  },
  [CommandType.SPECIAL_ATTACK]: {
    [CommandType.REFLECTOR]: 1.7,
    [CommandType.ADVANCE]: 1.3,
  },
  [CommandType.ADVANCE]: {
    [CommandType.RETREAT]: 1.5,
    [CommandType.SPECIAL_ATTACK]: 1.4,
  },
  [CommandType.RETREAT]: {
    [CommandType.ADVANCE]: 1.6,
  },
  [CommandType.REFLECTOR]: {
    [CommandType.ADVANCE]: 1.5,
    [CommandType.WEAPON_ATTACK]: 1.2,
  },
  [CommandType.STANCE_A]: {
    [CommandType.SPECIAL_ATTACK]: 1.5,
  },
  [CommandType.STANCE_B]: {
    [CommandType.SPECIAL_ATTACK]: 1.5,
  },
};

/**
 * 遠距離でのカウンターマップ
 */
const COUNTER_AT_FAR: Record<CommandType, Partial<CommandModifiers>> = {
  [CommandType.WEAPON_ATTACK]: {
    [CommandType.SPECIAL_ATTACK]: 1.4,
  },
  [CommandType.SPECIAL_ATTACK]: {
    [CommandType.REFLECTOR]: 1.8,
  },
  [CommandType.ADVANCE]: {
    [CommandType.RETREAT]: 1.7,
    [CommandType.SPECIAL_ATTACK]: 1.5,
  },
  [CommandType.RETREAT]: {
    [CommandType.ADVANCE]: 1.8,
    [CommandType.SPECIAL_ATTACK]: 1.4,
  },
  [CommandType.REFLECTOR]: {
    [CommandType.ADVANCE]: 1.6,
  },
  [CommandType.STANCE_A]: {
    [CommandType.SPECIAL_ATTACK]: 1.6,
  },
  [CommandType.STANCE_B]: {
    [CommandType.SPECIAL_ATTACK]: 1.6,
  },
};

const COUNTER_BY_DISTANCE: Record<DistanceType, Record<CommandType, Partial<CommandModifiers>>> = {
  [DistanceType.NEAR]: COUNTER_AT_NEAR,
  [DistanceType.MID]: COUNTER_AT_MID,
  [DistanceType.FAR]: COUNTER_AT_FAR,
};

/**
 * 頻出コマンドに対するカウンター重みモディファイアを返す
 *
 * @param targetCommand プレイヤーが頻繁に使うコマンド
 * @param distance 現在の距離
 * @returns 全コマンドの重みモディファイア（カウンター対象は1.0超、それ以外は1.0）
 */
export function getCounterModifiers(
  targetCommand: CommandType,
  distance: DistanceType
): CommandModifiers {
  const counterMap = COUNTER_BY_DISTANCE[distance];
  const overrides = counterMap[targetCommand] ?? {};

  return {
    ...NEUTRAL_MODIFIERS,
    ...overrides,
  };
}
