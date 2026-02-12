import { CommandType, DistanceType, moveCloser, moveFarther, StanceType, calculateNextStance } from '../types';

/**
 * 1stコマンド実行後の状態を予測する
 *
 * AI自身の行動による状態変化のみ予測する（相手の行動は考慮しない）:
 * - 距離: ADVANCE→1段階近づく / RETREAT→1段階離れる / 他→変化なし
 * - スタンス: STANCE_A/B→遷移ルールに従う / 他→変化なし
 */
export function predictStateAfterCommand(
  currentDistance: DistanceType,
  currentStance: StanceType,
  command: CommandType
): { predictedDistance: DistanceType; predictedStance: StanceType } {
  // 距離予測
  let predictedDistance = currentDistance;
  if (command === CommandType.ADVANCE) {
    predictedDistance = moveCloser(currentDistance);
  } else if (command === CommandType.RETREAT) {
    predictedDistance = moveFarther(currentDistance);
  }

  // スタンス予測
  let predictedStance = currentStance;
  if (command === CommandType.STANCE_A || command === CommandType.STANCE_B) {
    predictedStance = calculateNextStance(currentStance, command);
  }

  return { predictedDistance, predictedStance };
}
