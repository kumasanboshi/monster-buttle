import { CommandType, BattleState, Monster } from '../types';

/**
 * 現在の状態で使用可能なコマンド一覧を返す
 *
 * 全7コマンドは常に選択可能。距離による命中判定はコマンド解決時に行う。
 * TCB（2コマンド同時選択）のため、選択時に距離で制限すると
 * 「前進→武器攻撃」のような組み合わせが選べなくなる。
 */
export function getValidCommands(
  state: BattleState,
  playerId: 'player1' | 'player2',
  monster: Monster
): CommandType[] {
  return [
    CommandType.ADVANCE,
    CommandType.RETREAT,
    CommandType.WEAPON_ATTACK,
    CommandType.SPECIAL_ATTACK,
    CommandType.REFLECTOR,
    CommandType.STANCE_A,
    CommandType.STANCE_B,
  ];
}
