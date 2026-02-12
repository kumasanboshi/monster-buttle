import { BattleState, Monster, TurnCommands, TurnResult, CommandType, DistanceType, StanceType } from '../types';
import { AILevel } from './types';
import { getValidCommands } from './commandValidator';
import { getTendencyBySpecies } from './tendencies';
import { getDistanceWeights } from './distanceWeights';
import { selectWeightedCommand, selectDeterministicCommand, selectWeightedCommandPair, CommandWeightMap, CommandPairWeightMap } from './weightedSelection';
import { getHpModifiers, getStanceResponseModifiers, getReflectorModifiers } from './situationModifiers';
import { analyzePlayerPattern, getMostFrequentCommand } from './patternAnalyzer';
import { getCounterModifiers } from './counterStrategy';
import { predictStateAfterCommand } from './statePredictor';

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
      return selectLv5(state, playerId, monster, opponentMonster, turnHistory);
    default:
      throw new Error(`Unknown AI level: ${level}`);
  }
}

/**
 * Lv5 AI: 最適行動（確定的）
 *
 * Lv4と同じ全モディファイア（種族・距離・HP・スタンス・リフレクター・カウンター）を適用し、
 * ランダム要素を完全に排除して最大重みのコマンドを確定選択する。
 * - Lv3フォールバックなし（常にパターン読みを試みる）
 * - 履歴不足時はカウンター無しの5モディファイアで確定選択
 * - 同率タイブレーク: 攻撃系コマンド優先
 */
function selectLv5(
  state: BattleState,
  playerId: 'player1' | 'player2',
  monster: Monster,
  opponentMonster?: Monster,
  turnHistory?: TurnResult[]
): TurnCommands {
  if (!opponentMonster) {
    throw new Error('Lv5 AI requires opponentMonster');
  }
  if (turnHistory === undefined) {
    throw new Error('Lv5 AI requires turnHistory');
  }

  const opponentId = playerId === 'player1' ? 'player2' : 'player1';

  // Lv3ベースのモディファイア計算
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

  // パターン分析（履歴不足時はカウンター無し）
  const pattern = analyzePlayerPattern(turnHistory, opponentId, 3);
  const mostFrequent = getMostFrequentCommand(pattern, state.currentDistance);

  const hasCounterData = mostFrequent !== null && mostFrequent.length > 0;
  const counterMods = hasCounterData
    ? getCounterModifiers(mostFrequent![0], state.currentDistance)
    : undefined;

  // 全モディファイアを掛け合わせ
  const combinedWeights: CommandWeightMap = {};
  for (const cmd of validCommands) {
    combinedWeights[cmd] =
      speciesTendency[cmd] *
      distanceWeights[cmd] *
      hpMods[cmd] *
      stanceMods[cmd] *
      reflectorMods[cmd] *
      (counterMods ? counterMods[cmd] : 1.0);
  }

  // 確定選択（ランダムなし）
  const selected = selectDeterministicCommand(combinedWeights);
  return {
    first: { type: selected },
    second: { type: selected },
  };
}

/**
 * Lv4 AI: ペア評価コンボ + パターン読み
 *
 * 全(1st, 2nd)ペアをスコア化し、重み付きランダムで選択。
 * - 直近3ターンの相手コマンドを距離別に集計
 * - 最頻出コマンドに対するカウンターモディファイアを適用
 * - 20%の確率でLv3相当の行動（完全予測防止）
 * - 履歴不足時はカウンター無しのペア評価
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

  // 完全予測防止: 20%でLv3にフォールバック（順次予測コンボ方式）
  const LV4_FALLBACK_RATE = 0.2;
  if (randomFn() < LV4_FALLBACK_RATE) {
    return selectLv3(state, playerId, monster, randomFn, opponentMonster);
  }

  const opponentId = playerId === 'player1' ? 'player2' : 'player1';
  const ownState = state[playerId];
  const oppState = state[opponentId];

  // 共通モディファイア
  const speciesTendency = getTendencyBySpecies(monster.id);
  const ownHpRatio = ownState.currentHp / monster.stats.hp;
  const oppHpRatio = opponentMonster.stats.hp > 0
    ? oppState.currentHp / opponentMonster.stats.hp
    : 1.0;
  const hpMods = getHpModifiers(ownHpRatio, oppHpRatio);
  const oppRemainingReflect = Math.max(0, opponentMonster.reflector.maxReflectCount - oppState.usedReflectCount);
  const reflectorMods = getReflectorModifiers(oppRemainingReflect);

  // パターン分析 → カウンターモディファイア（データ不足時は undefined）
  const pattern = analyzePlayerPattern(turnHistory, opponentId, 3);
  const mostFrequent = getMostFrequentCommand(pattern, state.currentDistance);
  const hasCounterData = mostFrequent !== null && mostFrequent.length > 0;
  let counterMods: CommandWeightMap | undefined;
  if (hasCounterData) {
    const targetCommand = mostFrequent!.length === 1
      ? mostFrequent![0]
      : mostFrequent![Math.floor(randomFn() * mostFrequent!.length)];
    counterMods = getCounterModifiers(targetCommand, state.currentDistance);
  }

  // ペア評価
  const pairScores = buildPairScores(
    state, playerId, monster, opponentMonster,
    speciesTendency, hpMods, reflectorMods, counterMods
  );

  const selected = selectWeightedCommandPair(pairScores, randomFn);
  return {
    first: { type: selected.first },
    second: { type: selected.second },
  };
}

/**
 * 全(1st, 2nd)ペアのスコアマップを構築する
 *
 * 1. 有効な1stコマンドを列挙
 * 2. 各1stについて状態を予測し、予測状態での有効な2ndコマンドを列挙
 * 3. 各ペアのスコア = 1stの重み × 2ndの重み（予測状態）
 */
function buildPairScores(
  state: BattleState,
  playerId: 'player1' | 'player2',
  monster: Monster,
  opponentMonster: Monster,
  speciesTendency: CommandWeightMap,
  hpMods: CommandWeightMap,
  reflectorMods: CommandWeightMap,
  counterMods?: CommandWeightMap
): CommandPairWeightMap {
  const ownState = state[playerId];
  const opponentId = playerId === 'player1' ? 'player2' : 'player1';
  const oppState = state[opponentId];

  const validCommands1st = getValidCommands(state, playerId, monster);
  const distanceWeights1st = getDistanceWeights(state.currentDistance);
  const stanceMods1st = getStanceResponseModifiers(ownState.currentStance, oppState.currentStance);

  const pairScores: CommandPairWeightMap = new Map();

  for (const cmd1st of validCommands1st) {
    // 1stの重みを計算
    const weight1st =
      (speciesTendency[cmd1st] ?? 1.0) *
      (distanceWeights1st[cmd1st] ?? 1.0) *
      (hpMods[cmd1st] ?? 1.0) *
      (stanceMods1st[cmd1st] ?? 1.0) *
      (reflectorMods[cmd1st] ?? 1.0) *
      (counterMods ? (counterMods[cmd1st] ?? 1.0) : 1.0);

    if (weight1st <= 0) continue;

    // 1st実行後の状態を予測
    const { predictedDistance, predictedStance } = predictStateAfterCommand(
      state.currentDistance,
      ownState.currentStance,
      cmd1st
    );

    // 予測状態でのBattleStateを構築
    const predictedState = buildPredictedState(state, playerId, predictedDistance, cmd1st, monster);
    const validCommands2nd = getValidCommands(predictedState, playerId, monster);

    const distanceWeights2nd = getDistanceWeights(predictedDistance);
    const stanceMods2nd = getStanceResponseModifiers(predictedStance, oppState.currentStance);

    for (const cmd2nd of validCommands2nd) {
      const weight2nd =
        (speciesTendency[cmd2nd] ?? 1.0) *
        (distanceWeights2nd[cmd2nd] ?? 1.0) *
        (hpMods[cmd2nd] ?? 1.0) *
        (stanceMods2nd[cmd2nd] ?? 1.0) *
        (reflectorMods[cmd2nd] ?? 1.0) *
        (counterMods ? (counterMods[cmd2nd] ?? 1.0) : 1.0);

      if (weight2nd <= 0) continue;

      const pairScore = weight1st * weight2nd;
      const key = `${cmd1st}:${cmd2nd}`;
      pairScores.set(key, { first: cmd1st, second: cmd2nd, score: pairScore });
    }
  }

  return pairScores;
}

/**
 * Lv3 AI: Lv2 + 状況考慮 + 順次予測コンボ
 *
 * Lv2の距離＋種族傾向に加え、以下の状況モディファイアを適用:
 * - HP状況（自分/相手のHP割合）
 * - 相手スタンスへの対応（カウンター行動）
 * - 相手リフレクター残数（特殊攻撃の頻度調整）
 *
 * 順次予測コンボ:
 * 1stを選択後、1stコマンドによる距離・スタンス変化を予測し、
 * 予測状態で2ndの重みを再計算して選択する。
 */
function selectLv3(
  state: BattleState,
  playerId: 'player1' | 'player2',
  monster: Monster,
  randomFn: () => number,
  opponentMonster?: Monster
): TurnCommands {
  const ownState = state[playerId];
  const opponentId = playerId === 'player1' ? 'player2' : 'player1';
  const oppState = state[opponentId];

  // 共通モディファイア（距離・スタンス非依存）
  const speciesTendency = getTendencyBySpecies(monster.id);
  const ownHpRatio = ownState.currentHp / monster.stats.hp;
  const oppMaxHp = opponentMonster ? opponentMonster.stats.hp : oppState.currentHp;
  const oppHpRatio = oppMaxHp > 0 ? oppState.currentHp / oppMaxHp : 1.0;
  const hpMods = getHpModifiers(ownHpRatio, oppHpRatio);
  const oppMaxReflect = opponentMonster ? opponentMonster.reflector.maxReflectCount : 2;
  const oppRemainingReflect = Math.max(0, oppMaxReflect - oppState.usedReflectCount);
  const reflectorMods = getReflectorModifiers(oppRemainingReflect);

  // --- 1st選択（現在状態） ---
  const validCommands1st = getValidCommands(state, playerId, monster);
  const distanceWeights1st = getDistanceWeights(state.currentDistance);
  const stanceMods1st = getStanceResponseModifiers(ownState.currentStance, oppState.currentStance);

  const weights1st: CommandWeightMap = {};
  for (const cmd of validCommands1st) {
    weights1st[cmd] =
      speciesTendency[cmd] *
      distanceWeights1st[cmd] *
      hpMods[cmd] *
      stanceMods1st[cmd] *
      reflectorMods[cmd];
  }

  const firstCmd = selectWeightedCommand(weights1st, randomFn);

  // --- 2nd選択（予測状態） ---
  const { predictedDistance, predictedStance } = predictStateAfterCommand(
    state.currentDistance,
    ownState.currentStance,
    firstCmd
  );

  // 予測状態での有効コマンドを計算
  const predictedState = buildPredictedState(state, playerId, predictedDistance, firstCmd, monster);
  const validCommands2nd = getValidCommands(predictedState, playerId, monster);

  const distanceWeights2nd = getDistanceWeights(predictedDistance);
  const stanceMods2nd = getStanceResponseModifiers(predictedStance, oppState.currentStance);

  const weights2nd: CommandWeightMap = {};
  for (const cmd of validCommands2nd) {
    weights2nd[cmd] =
      speciesTendency[cmd] *
      distanceWeights2nd[cmd] *
      hpMods[cmd] *
      stanceMods2nd[cmd] *
      reflectorMods[cmd];
  }

  const secondCmd = selectWeightedCommand(weights2nd, randomFn);

  return {
    first: { type: firstCmd },
    second: { type: secondCmd },
  };
}

/**
 * 1stコマンド実行後の予測状態でBattleStateを構築する
 *
 * getValidCommands が距離やリフレクター残数を参照するため、
 * 予測距離と予測リフレクター使用状況を反映したBattleStateを生成する。
 */
function buildPredictedState(
  originalState: BattleState,
  playerId: 'player1' | 'player2',
  predictedDistance: DistanceType,
  firstCmd: CommandType,
  monster: Monster
): BattleState {
  const playerState = originalState[playerId];
  const predictedUsedReflect = firstCmd === CommandType.REFLECTOR
    ? playerState.usedReflectCount + 1
    : playerState.usedReflectCount;

  return {
    ...originalState,
    currentDistance: predictedDistance,
    [playerId]: {
      ...playerState,
      usedReflectCount: predictedUsedReflect,
    },
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
