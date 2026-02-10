import { CommandType, DistanceType, TurnCommands, calculateDistance } from '../types';

/**
 * 移動コマンドかどうかを判定する
 */
export function isMovementCommand(cmd: CommandType): boolean {
  return cmd === CommandType.ADVANCE || cmd === CommandType.RETREAT;
}

/**
 * TCBターンの距離解決
 * 1stコマンドで距離変動→2ndコマンドは新距離で処理
 */
export function resolveDistanceForTurn(
  current: DistanceType,
  p1Cmds: TurnCommands,
  p2Cmds: TurnCommands
): { afterFirst: DistanceType; afterSecond: DistanceType } {
  const afterFirst = calculateDistance(current, p1Cmds.first.type, p2Cmds.first.type);
  const afterSecond = calculateDistance(afterFirst, p1Cmds.second.type, p2Cmds.second.type);

  return { afterFirst, afterSecond };
}
