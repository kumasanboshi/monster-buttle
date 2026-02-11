import { CommandType, StanceType, TurnCommands, calculateNextStance } from '../types';

/**
 * スタンスコマンドかどうかを判定する
 */
export function isStanceCommand(cmd: CommandType): boolean {
  return cmd === CommandType.STANCE_A || cmd === CommandType.STANCE_B;
}

/**
 * TCBターンのスタンス解決（プレイヤー単位）
 * 1stコマンドでスタンス変動→2ndコマンドは新スタンスから処理
 */
export function resolveStanceForTurn(
  currentStance: StanceType,
  cmds: TurnCommands
): { afterFirst: StanceType; afterSecond: StanceType } {
  const afterFirst = isStanceCommand(cmds.first.type)
    ? calculateNextStance(currentStance, cmds.first.type as CommandType.STANCE_A | CommandType.STANCE_B)
    : currentStance;

  const afterSecond = isStanceCommand(cmds.second.type)
    ? calculateNextStance(afterFirst, cmds.second.type as CommandType.STANCE_A | CommandType.STANCE_B)
    : afterFirst;

  return { afterFirst, afterSecond };
}
