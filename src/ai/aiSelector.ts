import { BattleState, Monster, TurnCommands, CommandType } from '../types';
import { AILevel } from './types';
import { getValidCommands } from './commandValidator';

/**
 * 有効コマンドリストからランダムに1つ選択する
 */
function selectSingleCommand(
  validCommands: CommandType[],
  randomFn: () => number
): CommandType {
  if (validCommands.length === 0) {
    return CommandType.ADVANCE;
  }
  const index = Math.floor(randomFn() * validCommands.length);
  return validCommands[index];
}

/**
 * AIレベルに応じてコマンドを選択する
 *
 * @param state 現在のバトル状態
 * @param playerId AIが操作するプレイヤーID
 * @param monster AIが操作するモンスター
 * @param level AIレベル
 * @param randomFn 乱数生成関数（テスト用に注入可能）
 * @returns 選択された2つのコマンド
 */
export function selectCommands(
  state: BattleState,
  playerId: 'player1' | 'player2',
  monster: Monster,
  level: AILevel,
  randomFn: () => number = Math.random
): TurnCommands {
  switch (level) {
    case AILevel.LV1:
      return selectLv1(state, playerId, monster, randomFn);
    case AILevel.LV2:
      throw new Error('AI Level LV2 is not implemented yet');
    case AILevel.LV3:
      throw new Error('AI Level LV3 is not implemented yet');
    case AILevel.LV4:
      throw new Error('AI Level LV4 is not implemented yet');
    case AILevel.LV5:
      throw new Error('AI Level LV5 is not implemented yet');
    default:
      throw new Error(`Unknown AI level: ${level}`);
  }
}

/**
 * Lv1 AI: ほぼランダム行動。重み付けなし。
 * 有効なコマンドから均等確率でランダムに選択する。
 */
function selectLv1(
  state: BattleState,
  playerId: 'player1' | 'player2',
  monster: Monster,
  randomFn: () => number
): TurnCommands {
  const validCommands = getValidCommands(state, playerId, monster);

  return {
    first: { type: selectSingleCommand(validCommands, randomFn) },
    second: { type: selectSingleCommand(validCommands, randomFn) },
  };
}
