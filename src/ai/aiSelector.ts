import { BattleState, Monster, TurnCommands, CommandType } from '../types';
import { AILevel } from './types';
import { getValidCommands } from './commandValidator';
import { getTendencyBySpecies } from './tendencies';
import { getDistanceWeights } from './distanceWeights';
import { selectWeightedCommand, CommandWeightMap } from './weightedSelection';
import { getHpModifiers, getStanceResponseModifiers, getReflectorModifiers } from './situationModifiers';

/**
 * 有効コマンドリストからランダムに1つ選択する
 * @internal
 *
 * 空リストの場合はADVANCEをフォールバックとして返す。
 * 通常 getValidCommands は ADVANCE/RETREAT を必ず含むため空にはならないが、
 * 防御的にフォールバックを用意している。
 */
export function selectSingleCommand(
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
 * @param opponentMonster 相手モンスター情報（Lv3以降で使用）
 * @returns 選択された2つのコマンド
 */
export function selectCommands(
  state: BattleState,
  playerId: 'player1' | 'player2',
  monster: Monster,
  level: AILevel,
  randomFn: () => number = Math.random,
  opponentMonster?: Monster
): TurnCommands {
  switch (level) {
    case AILevel.LV1:
      return selectLv1(state, playerId, monster, randomFn);
    case AILevel.LV2:
      return selectLv2(state, playerId, monster, randomFn);
    case AILevel.LV3:
      return selectLv3(state, playerId, monster, randomFn, opponentMonster);
    case AILevel.LV4:
      throw new Error('AI Level LV4 is not implemented yet');
    case AILevel.LV5:
      throw new Error('AI Level LV5 is not implemented yet');
    default:
      throw new Error(`Unknown AI level: ${level}`);
  }
}

/**
 * Lv3 AI: Lv2 + 状況考慮
 *
 * Lv2の距離＋種族傾向に加え、以下の状況モディファイアを適用:
 * - HP状況（自分/相手のHP割合）
 * - 相手スタンスへの対応（カウンター行動）
 * - 相手リフレクター残数（特殊攻撃の頻度調整）
 */
function selectLv3(
  state: BattleState,
  playerId: 'player1' | 'player2',
  monster: Monster,
  randomFn: () => number,
  opponentMonster?: Monster
): TurnCommands {
  const validCommands = getValidCommands(state, playerId, monster);
  const speciesTendency = getTendencyBySpecies(monster.id);
  const distanceWeights = getDistanceWeights(state.currentDistance);

  const ownState = state[playerId];
  const opponentId = playerId === 'player1' ? 'player2' : 'player1';
  const oppState = state[opponentId];

  // HP状況モディファイア
  const ownHpRatio = ownState.currentHp / monster.stats.hp;
  const oppMaxHp = opponentMonster ? opponentMonster.stats.hp : ownState.currentHp;
  const oppHpRatio = oppState.currentHp / oppMaxHp;
  const hpMods = getHpModifiers(ownHpRatio, oppHpRatio);

  // スタンス対応モディファイア
  const stanceMods = getStanceResponseModifiers(ownState.currentStance, oppState.currentStance);

  // リフレクター対応モディファイア
  const oppMaxReflect = opponentMonster ? opponentMonster.reflector.maxReflectCount : 2;
  const oppRemainingReflect = oppMaxReflect - oppState.usedReflectCount;
  const reflectorMods = getReflectorModifiers(oppRemainingReflect);

  // 全モディファイアを掛け合わせ
  const combinedWeights: CommandWeightMap = {};
  for (const cmd of validCommands) {
    combinedWeights[cmd] =
      speciesTendency[cmd] *
      distanceWeights[cmd] *
      hpMods[cmd] *
      stanceMods[cmd] *
      reflectorMods[cmd];
  }

  return {
    first: { type: selectWeightedCommand(combinedWeights, randomFn) },
    second: { type: selectWeightedCommand(combinedWeights, randomFn) },
  };
}

/**
 * Lv2 AI: 距離に応じた基本行動 + 種族傾向
 *
 * 種族傾向の重みと距離別モディファイアを掛け合わせて、
 * 重み付きランダム選択を行う。
 *
 * 制約: STANCE_A/Bの重みは現在のスタンスに関わらず固定。
 * Lv3以降でスタンス遷移先の適切さを考慮する。
 */
function selectLv2(
  state: BattleState,
  playerId: 'player1' | 'player2',
  monster: Monster,
  randomFn: () => number
): TurnCommands {
  const validCommands = getValidCommands(state, playerId, monster);
  const speciesTendency = getTendencyBySpecies(monster.id);
  const distanceWeights = getDistanceWeights(state.currentDistance);

  const combinedWeights: CommandWeightMap = {};
  for (const cmd of validCommands) {
    combinedWeights[cmd] = speciesTendency[cmd] * distanceWeights[cmd];
  }

  return {
    first: { type: selectWeightedCommand(combinedWeights, randomFn) },
    second: { type: selectWeightedCommand(combinedWeights, randomFn) },
  };
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
