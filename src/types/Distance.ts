import { CommandType } from './Command';

/**
 * 距離タイプ（3段階）
 */
export enum DistanceType {
  /** 近距離 */
  NEAR = 'NEAR',
  /** 中距離 */
  MID = 'MID',
  /** 遠距離 */
  FAR = 'FAR',
}

/**
 * 距離を1段階近づける
 * @param current 現在の距離
 * @returns 近づいた後の距離
 */
export function moveCloser(current: DistanceType): DistanceType {
  switch (current) {
    case DistanceType.FAR:
      return DistanceType.MID;
    case DistanceType.MID:
      return DistanceType.NEAR;
    case DistanceType.NEAR:
      return DistanceType.NEAR;
  }
}

/**
 * 距離を1段階離す
 * @param current 現在の距離
 * @returns 離れた後の距離
 */
export function moveFarther(current: DistanceType): DistanceType {
  switch (current) {
    case DistanceType.NEAR:
      return DistanceType.MID;
    case DistanceType.MID:
      return DistanceType.FAR;
    case DistanceType.FAR:
      return DistanceType.FAR;
  }
}

/**
 * 両プレイヤーの移動コマンドに基づいて距離を計算
 * @param current 現在の距離
 * @param p1Command プレイヤー1のコマンド
 * @param p2Command プレイヤー2のコマンド
 * @returns 新しい距離
 */
export function calculateDistance(
  current: DistanceType,
  p1Command: CommandType,
  p2Command: CommandType
): DistanceType {
  const p1IsAdvancing = p1Command === CommandType.ADVANCE;
  const p1IsRetreating = p1Command === CommandType.RETREAT;
  const p2IsAdvancing = p2Command === CommandType.ADVANCE;
  const p2IsRetreating = p2Command === CommandType.RETREAT;

  // 両方が前進 → 2段階近づく
  if (p1IsAdvancing && p2IsAdvancing) {
    return moveCloser(moveCloser(current));
  }

  // 両方が後退 → 2段階離れる
  if (p1IsRetreating && p2IsRetreating) {
    return moveFarther(moveFarther(current));
  }

  // 一方が前進、他方が後退 → 距離変化なし
  if ((p1IsAdvancing && p2IsRetreating) || (p1IsRetreating && p2IsAdvancing)) {
    return current;
  }

  // 一方だけが前進 → 1段階近づく
  if (p1IsAdvancing || p2IsAdvancing) {
    return moveCloser(current);
  }

  // 一方だけが後退 → 1段階離れる
  if (p1IsRetreating || p2IsRetreating) {
    return moveFarther(current);
  }

  // どちらも移動しない → 距離変化なし
  return current;
}
