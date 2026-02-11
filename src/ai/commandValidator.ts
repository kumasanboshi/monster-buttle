import { CommandType, DistanceType, BattleState, Monster } from '../types';

/**
 * 現在の状態で使用可能なコマンド一覧を返す
 *
 * フィルタルール:
 * - WEAPON_ATTACK: 近距離のみ
 * - SPECIAL_ATTACK: 常に有効（残り0でも弱体化して使用可能）
 * - REFLECTOR: usedReflectCount < maxReflectCount の場合のみ
 * - STANCE_A/B: 常に有効（異なるスタンスに遷移する）
 * - ADVANCE/RETREAT: 常に有効
 */
export function getValidCommands(
  state: BattleState,
  playerId: 'player1' | 'player2',
  monster: Monster
): CommandType[] {
  const playerState = state[playerId];
  const validCommands: CommandType[] = [];

  // 前進・後退は常に有効
  validCommands.push(CommandType.ADVANCE);
  validCommands.push(CommandType.RETREAT);

  // 武器攻撃: 近距離のみ
  if (state.currentDistance === DistanceType.NEAR) {
    validCommands.push(CommandType.WEAPON_ATTACK);
  }

  // 特殊攻撃: 常に有効（残り0でも弱体化して使用可能）
  validCommands.push(CommandType.SPECIAL_ATTACK);

  // リフレクター: 使用回数が残っている場合のみ
  if (playerState.usedReflectCount < monster.reflector.maxReflectCount) {
    validCommands.push(CommandType.REFLECTOR);
  }

  // スタンス切替: 常に有効
  validCommands.push(CommandType.STANCE_A);
  validCommands.push(CommandType.STANCE_B);

  return validCommands;
}
