import { CommandType, DistanceType } from '../types';

/**
 * 距離別コマンド重みモディファイア
 *
 * 種族傾向の重みに掛け合わせて使用する。
 * 1.0 = 基準、>1.0 = 距離的に有利、<1.0 = 距離的に不利
 *
 * 注意: WEAPON_ATTACKは全距離で選択可能。命中判定はコマンド解決時に行う。
 * MID/FARでは空振りリスクがあるが、AIの重みで自然に調整される。
 */
export type DistanceWeightModifiers = Record<CommandType, number>;

export const DISTANCE_WEIGHTS: Record<DistanceType, DistanceWeightModifiers> = {
  // 近距離: 武器攻撃が有効、前進は不要
  [DistanceType.NEAR]: {
    [CommandType.ADVANCE]: 0.6,
    [CommandType.RETREAT]: 1.2,
    [CommandType.WEAPON_ATTACK]: 2.0,
    [CommandType.SPECIAL_ATTACK]: 0.8,
    [CommandType.REFLECTOR]: 1.0,
    [CommandType.STANCE_A]: 1.0,
    [CommandType.STANCE_B]: 1.0,
  },
  // 中距離: バランス（極端な重みなし）
  [DistanceType.MID]: {
    [CommandType.ADVANCE]: 1.2,
    [CommandType.RETREAT]: 1.0,
    [CommandType.WEAPON_ATTACK]: 1.0,
    [CommandType.SPECIAL_ATTACK]: 1.2,
    [CommandType.REFLECTOR]: 1.0,
    [CommandType.STANCE_A]: 1.0,
    [CommandType.STANCE_B]: 1.0,
  },
  // 遠距離: 特殊攻撃と前進を重視、後退は不要
  [DistanceType.FAR]: {
    [CommandType.ADVANCE]: 1.8,
    [CommandType.RETREAT]: 0.4,
    [CommandType.WEAPON_ATTACK]: 1.0,
    [CommandType.SPECIAL_ATTACK]: 2.0,
    [CommandType.REFLECTOR]: 1.0,
    [CommandType.STANCE_A]: 0.8,
    [CommandType.STANCE_B]: 0.8,
  },
};

/**
 * 指定距離の重みモディファイアを取得
 */
export function getDistanceWeights(distance: DistanceType): DistanceWeightModifiers {
  return DISTANCE_WEIGHTS[distance];
}
