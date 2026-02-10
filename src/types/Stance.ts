import { CommandType } from './Command';

/**
 * スタンスタイプ（3種類）
 */
export enum StanceType {
  /** 通常（攻撃×1.0, 防御×1.0） */
  NORMAL = 'NORMAL',
  /** 攻勢（攻撃×1.3, 防御×0.7） */
  OFFENSIVE = 'OFFENSIVE',
  /** 守勢（攻撃×0.7, 防御×1.3） */
  DEFENSIVE = 'DEFENSIVE',
}

/**
 * スタンス倍率
 */
export interface StanceModifiers {
  /** 攻撃力倍率 */
  attackModifier: number;
  /** 防御力倍率 */
  defenseModifier: number;
}

/**
 * スタンスごとの倍率定義
 */
export const STANCE_MODIFIERS: Record<StanceType, StanceModifiers> = {
  [StanceType.NORMAL]: {
    attackModifier: 1.0,
    defenseModifier: 1.0,
  },
  [StanceType.OFFENSIVE]: {
    attackModifier: 1.3,
    defenseModifier: 0.7,
  },
  [StanceType.DEFENSIVE]: {
    attackModifier: 0.7,
    defenseModifier: 1.3,
  },
};

/**
 * 現在のスタンスとコマンドから次のスタンスを計算
 *
 * スタンス切替ルール:
 * - 現在のスタンスが NORMAL の場合: STANCE_A → OFFENSIVE, STANCE_B → DEFENSIVE
 * - 現在のスタンスが OFFENSIVE の場合: STANCE_A → NORMAL, STANCE_B → DEFENSIVE
 * - 現在のスタンスが DEFENSIVE の場合: STANCE_A → NORMAL, STANCE_B → OFFENSIVE
 *
 * @param current 現在のスタンス
 * @param command スタンス切替コマンド
 * @returns 新しいスタンス
 */
export function calculateNextStance(
  current: StanceType,
  command: CommandType.STANCE_A | CommandType.STANCE_B
): StanceType {
  if (current === StanceType.NORMAL) {
    return command === CommandType.STANCE_A ? StanceType.OFFENSIVE : StanceType.DEFENSIVE;
  }

  if (current === StanceType.OFFENSIVE) {
    return command === CommandType.STANCE_A ? StanceType.NORMAL : StanceType.DEFENSIVE;
  }

  if (current === StanceType.DEFENSIVE) {
    return command === CommandType.STANCE_A ? StanceType.NORMAL : StanceType.OFFENSIVE;
  }

  return current;
}
