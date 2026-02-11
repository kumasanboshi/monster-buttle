import { CommandType, StanceType, calculateNextStance } from '../types';

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
 * HP状況に応じた重みモディファイア
 *
 * 自分HPが低い → 守備的（後退・リフレクター増、前進減）
 * 相手HPが低い → 攻撃的（攻撃・前進増、後退減）
 *
 * @param ownHpRatio 自分のHP割合 (0.0〜1.0)
 * @param opponentHpRatio 相手のHP割合 (0.0〜1.0)
 */
export function getHpModifiers(ownHpRatio: number, opponentHpRatio: number): CommandModifiers {
  // 自分HPが低いほど守備的（0.0→最大効果、1.0→効果なし）
  const ownLowFactor = Math.max(0, 1.0 - ownHpRatio);
  // 相手HPが低いほど攻撃的
  const oppLowFactor = Math.max(0, 1.0 - opponentHpRatio);

  return {
    [CommandType.ADVANCE]: 1.0 - 0.4 * ownLowFactor + 0.4 * oppLowFactor,
    [CommandType.RETREAT]: 1.0 + 0.5 * ownLowFactor - 0.3 * oppLowFactor,
    [CommandType.WEAPON_ATTACK]: 1.0 + 0.4 * oppLowFactor,
    [CommandType.SPECIAL_ATTACK]: 1.0 + 0.4 * oppLowFactor,
    [CommandType.REFLECTOR]: 1.0 + 0.5 * ownLowFactor,
    [CommandType.STANCE_A]: 1.0 + 0.3 * oppLowFactor,
    [CommandType.STANCE_B]: 1.0 + 0.3 * ownLowFactor,
  };
}

/**
 * 相手スタンスに応じた重みモディファイア
 *
 * 相手OFFENSIVE → 守備的に対応（リフレクター、守勢スタンスを優先）
 * 相手DEFENSIVE → 攻撃的に対応（攻撃、攻勢スタンスを優先）
 * 相手NORMAL → ニュートラル
 *
 * STANCE_A/Bの重みは、自分の現在スタンスから遷移先を判定し、
 * 望ましいスタンスに向かうコマンドを優先する。
 *
 * @param ownStance 自分の現在スタンス
 * @param opponentStance 相手の現在スタンス
 */
export function getStanceResponseModifiers(
  ownStance: StanceType,
  opponentStance: StanceType
): CommandModifiers {
  if (opponentStance === StanceType.NORMAL) {
    return { ...NEUTRAL_MODIFIERS };
  }

  // 相手OFFENSIVEなら守勢(DEFENSIVE)に行きたい
  // 相手DEFENSIVEなら攻勢(OFFENSIVE)に行きたい
  const desiredStance = opponentStance === StanceType.OFFENSIVE
    ? StanceType.DEFENSIVE
    : StanceType.OFFENSIVE;

  const nextA = calculateNextStance(ownStance, CommandType.STANCE_A);
  const nextB = calculateNextStance(ownStance, CommandType.STANCE_B);

  let stanceAMod = 1.0;
  let stanceBMod = 1.0;

  if (nextA === desiredStance) {
    stanceAMod = 1.5;
  } else if (nextA === ownStance) {
    // 変わらない（ありえないが安全対策）
    stanceAMod = 0.8;
  } else {
    // 望ましくない方向
    stanceAMod = 0.7;
  }

  if (nextB === desiredStance) {
    stanceBMod = 1.5;
  } else if (nextB === ownStance) {
    stanceBMod = 0.8;
  } else {
    stanceBMod = 0.7;
  }

  // 既に望ましいスタンスにいる場合、スタンス変更の優先度を下げる
  if (ownStance === desiredStance) {
    stanceAMod = 0.6;
    stanceBMod = 0.6;
  }

  if (opponentStance === StanceType.OFFENSIVE) {
    // 相手攻勢 → 守備的に
    return {
      [CommandType.ADVANCE]: 0.7,
      [CommandType.RETREAT]: 1.2,
      [CommandType.WEAPON_ATTACK]: 0.9,
      [CommandType.SPECIAL_ATTACK]: 0.9,
      [CommandType.REFLECTOR]: 1.5,
      [CommandType.STANCE_A]: stanceAMod,
      [CommandType.STANCE_B]: stanceBMod,
    };
  }

  // 相手守勢 → 攻撃的に
  return {
    [CommandType.ADVANCE]: 1.3,
    [CommandType.RETREAT]: 0.7,
    [CommandType.WEAPON_ATTACK]: 1.4,
    [CommandType.SPECIAL_ATTACK]: 1.3,
    [CommandType.REFLECTOR]: 0.8,
    [CommandType.STANCE_A]: stanceAMod,
    [CommandType.STANCE_B]: stanceBMod,
  };
}

/**
 * 相手リフレクター残数に応じた重みモディファイア
 *
 * 残りあり → 特殊攻撃を抑制、武器攻撃を優先
 * 残り0 → 特殊攻撃を積極的に使用
 *
 * @param opponentRemainingReflectors 相手のリフレクター残り回数
 */
export function getReflectorModifiers(opponentRemainingReflectors: number): CommandModifiers {
  if (opponentRemainingReflectors <= 0) {
    // 相手リフレクター枯渇 → 特殊攻撃が安全
    return {
      ...NEUTRAL_MODIFIERS,
      [CommandType.SPECIAL_ATTACK]: 1.4,
    };
  }

  // 残り数に応じた抑制（多いほど抑制が強い）
  const suppressFactor = Math.min(opponentRemainingReflectors * 0.15, 0.4);

  return {
    ...NEUTRAL_MODIFIERS,
    [CommandType.SPECIAL_ATTACK]: 1.0 - suppressFactor,
    [CommandType.WEAPON_ATTACK]: 1.0 + suppressFactor * 0.5,
  };
}
