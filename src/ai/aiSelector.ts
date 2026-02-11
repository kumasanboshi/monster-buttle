import { BattleState, Monster, TurnCommands, TurnResult, CommandType } from '../types';
import { AILevel } from './types';
import { getValidCommands } from './commandValidator';
import { getTendencyBySpecies } from './tendencies';
import { getDistanceWeights } from './distanceWeights';
import { selectWeightedCommand, CommandWeightMap } from './weightedSelection';
import { getHpModifiers, getStanceResponseModifiers, getReflectorModifiers } from './situationModifiers';
import { analyzePlayerPattern, getMostFrequentCommand } from './patternAnalyzer';
import { getCounterModifiers } from './counterStrategy';

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
 * @param turnHistory ターン履歴（Lv4で使用、パターン読み用）
 * @returns 選択された2つのコマンド
 */
export function selectCommands(
  state: BattleState,
  playerId: 'player1' | 'player2',
  monster: Monster,
  level: AILevel,
  randomFn: () => number = Math.random,
  opponentMonster?: Monster,
  turnHistory?: TurnResult[]
): TurnCommands {
  switch (level) {
    case AILevel.LV1:
      return selectLv1(state, playerId, monster, randomFn);
    case AILevel.LV2:
      return selectLv2(state, playerId, monster, randomFn);
    case AILevel.LV3:
      return selectLv3(state, playerId, monster, randomFn, opponentMonster);
    case AILevel.LV4:
      return selectLv4(state, playerId, monster, randomFn, opponentMonster, turnHistory);
    case AILevel.LV5:
      throw new Error('AI Level LV5 is not implemented yet');
    default:
      throw new Error(`Unknown AI level: ${level}`);
  }
}

/**
 * Lv4 AI: Lv3 + パターン読み
 *
 * Lv3の状況考慮に加え、相手の過去の行動パターンを分析してカウンター戦略を適用。
 * - 直近3ターンの相手コマンドを距離別に集計
 * - 最頻出コマンドに対するカウンターモディファイアを適用
 * - 20%の確率でLv3相当の行動（完全予測防止）
 * - 履歴不足時はLv3にフォールバック
 */
function selectLv4(
  state: BattleState,
  playerId: 'player1' | 'player2',
  monster: Monster,
  randomFn: () => number,
  opponentMonster?: Monster,
  turnHistory?: TurnResult[]
): TurnCommands {
  if (!opponentMonster) {
    throw new Error('Lv4 AI requires opponentMonster');
  }
  if (turnHistory === undefined) {
    throw new Error('Lv4 AI requires turnHistory');
  }

  // 完全予測防止: 20%でLv3にフォールバック
  const LV4_FALLBACK_RATE = 0.2;
  if (randomFn() < LV4_FALLBACK_RATE) {
    return selectLv3(state, playerId, monster, randomFn, opponentMonster);
  }

  // パターン分析: 直近3ターンの相手コマンドを距離別に集計
  const opponentId = playerId === 'player1' ? 'player2' : 'player1';
  const pattern = analyzePlayerPattern(turnHistory, opponentId, 3);
  const mostFrequent = getMostFrequentCommand(pattern, state.currentDistance);

  // データ不足 → Lv3にフォールバック
  if (!mostFrequent || mostFrequent.length === 0) {
    return selectLv3(state, playerId, monster, randomFn, opponentMonster);
  }

  // カウンター戦略（同率の場合はランダムに1つ選択）
  const targetCommand = mostFrequent.length === 1
    ? mostFrequent[0]
    : mostFrequent[Math.floor(randomFn() * mostFrequent.length)];
  const counterMods = getCounterModifiers(targetCommand, state.currentDistance);

  // Lv3ベースの重み計算
  const validCommands = getValidCommands(state, playerId, monster);
  const speciesTendency = getTendencyBySpecies(monster.id);
  const distanceWeights = getDistanceWeights(state.currentDistance);

  const ownState = state[playerId];
  const oppState = state[opponentId];

  const ownHpRatio = ownState.currentHp / monster.stats.hp;
  const oppHpRatio = opponentMonster.stats.hp > 0
    ? oppState.currentHp / opponentMonster.stats.hp
    : 1.0;
  const hpMods = getHpModifiers(ownHpRatio, oppHpRatio);
  const stanceMods = getStanceResponseModifiers(ownState.currentStance, oppState.currentStance);
  const oppRemainingReflect = Math.max(0, opponentMonster.reflector.maxReflectCount - oppState.usedReflectCount);
  const reflectorMods = getReflectorModifiers(oppRemainingReflect);

  // 全モディファイアを掛け合わせ（Lv3 + カウンター）
  const combinedWeights: CommandWeightMap = {};
  for (const cmd of validCommands) {
    combinedWeights[cmd] =
      speciesTendency[cmd] *
      distanceWeights[cmd] *
      hpMods[cmd] *
      stanceMods[cmd] *
      reflectorMods[cmd] *
      counterMods[cmd];
  }

  return {
    first: { type: selectWeightedCommand(combinedWeights, randomFn) },
    second: { type: selectWeightedCommand(combinedWeights, randomFn) },
  };
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
  // opponentMonster未定義時は相手HP割合を1.0（満タン）と仮定
  const oppMaxHp = opponentMonster ? opponentMonster.stats.hp : oppState.currentHp;
  const oppHpRatio = oppMaxHp > 0 ? oppState.currentHp / oppMaxHp : 1.0;
  const hpMods = getHpModifiers(ownHpRatio, oppHpRatio);

  // スタンス対応モディファイア
  const stanceMods = getStanceResponseModifiers(ownState.currentStance, oppState.currentStance);

  // リフレクター対応モディファイア（未定義時は2回と仮定）
  const oppMaxReflect = opponentMonster ? opponentMonster.reflector.maxReflectCount : 2;
  const oppRemainingReflect = Math.max(0, oppMaxReflect - oppState.usedReflectCount);
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
