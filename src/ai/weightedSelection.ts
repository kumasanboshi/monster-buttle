import { CommandType } from '../types';

/**
 * タイブレーク用の優先順位（攻撃系コマンドを優先）
 * WEAPON_ATTACK > SPECIAL_ATTACK > REFLECTOR > ADVANCE > RETREAT > STANCE_A > STANCE_B
 */
const TIEBREAK_PRIORITY: CommandType[] = [
  CommandType.WEAPON_ATTACK,
  CommandType.SPECIAL_ATTACK,
  CommandType.REFLECTOR,
  CommandType.ADVANCE,
  CommandType.RETREAT,
  CommandType.STANCE_A,
  CommandType.STANCE_B,
];

/**
 * コマンドごとの重みマップ
 */
export type CommandWeightMap = Partial<Record<CommandType, number>>;

/**
 * 重み付きランダム選択でコマンドを1つ選ぶ
 *
 * 各コマンドの選択確率は「そのコマンドの重み / 全重みの合計」に比例する。
 * 重みが0以下のコマンドは候補から除外される。
 *
 * @param weights コマンドごとの重み（正の値のみ有効）
 * @param randomFn 乱数生成関数 [0, 1)（テスト用に注入可能）
 * @returns 選択されたコマンド
 * @throws 有効な候補が存在しない場合
 */
export function selectWeightedCommand(
  weights: CommandWeightMap,
  randomFn: () => number
): CommandType {
  const entries = (Object.entries(weights) as [CommandType, number][])
    .filter(([, weight]) => weight > 0);

  if (entries.length === 0) {
    throw new Error('No valid commands with positive weights');
  }

  if (entries.length === 1) {
    return entries[0][0];
  }

  const totalWeight = entries.reduce((sum, [, weight]) => sum + weight, 0);
  let randomValue = randomFn() * totalWeight;

  for (const [command, weight] of entries) {
    randomValue -= weight;
    if (randomValue < 0) {
      return command;
    }
  }

  // 浮動小数点の累積誤差で randomValue が微小な正の値のまま
  // ループを抜ける場合のフォールバック（最後のコマンドを返す）
  return entries[entries.length - 1][0];
}

/**
 * 重みが最大のコマンドを確定的に選ぶ（Lv5 AI用）
 *
 * ランダム要素なし。同率の場合は攻撃系コマンドを優先するタイブレーク規則を適用。
 * 優先順: WEAPON_ATTACK > SPECIAL_ATTACK > REFLECTOR > ADVANCE > RETREAT > STANCE_A > STANCE_B
 *
 * @param weights コマンドごとの重み（正の値のみ有効）
 * @returns 最大重みのコマンド
 * @throws 有効な候補が存在しない場合
 */
/**
 * (1st, 2nd) コマンドペアとスコアのマップ
 * キー: "FIRST_CMD:SECOND_CMD" 形式の文字列
 * 値: { first, second, score }
 */
export type CommandPairWeightMap = Map<string, { first: CommandType; second: CommandType; score: number }>;

/**
 * ペアの重み付きランダム選択（Lv4 AI用）
 *
 * スコアが正のペアのみを候補とし、スコアに比例した確率でペアを選択する。
 *
 * @param pairWeights ペアスコアマップ
 * @param randomFn 乱数生成関数 [0, 1)
 * @returns 選択されたペア { first, second }
 * @throws 有効な候補が存在しない場合
 */
export function selectWeightedCommandPair(
  pairWeights: CommandPairWeightMap,
  randomFn: () => number
): { first: CommandType; second: CommandType } {
  const entries = Array.from(pairWeights.values()).filter(e => e.score > 0);

  if (entries.length === 0) {
    throw new Error('No valid command pairs with positive scores');
  }

  if (entries.length === 1) {
    return { first: entries[0].first, second: entries[0].second };
  }

  const totalScore = entries.reduce((sum, e) => sum + e.score, 0);
  let randomValue = randomFn() * totalScore;

  for (const entry of entries) {
    randomValue -= entry.score;
    if (randomValue < 0) {
      return { first: entry.first, second: entry.second };
    }
  }

  const last = entries[entries.length - 1];
  return { first: last.first, second: last.second };
}

/**
 * ペアの確定選択（Lv5 AI用）
 *
 * 最高スコアのペアを確定的に選択する。同率の場合のタイブレーク規則:
 * 1. 2ndコマンドの優先順位で比較
 * 2. 2ndが同じ場合は1stコマンドの優先順位で比較
 *
 * @param pairWeights ペアスコアマップ
 * @returns 最高スコアのペア { first, second }
 * @throws 有効な候補が存在しない場合
 */
export function selectDeterministicCommandPair(
  pairWeights: CommandPairWeightMap
): { first: CommandType; second: CommandType } {
  const entries = Array.from(pairWeights.values()).filter(e => e.score > 0);

  if (entries.length === 0) {
    throw new Error('No valid command pairs with positive scores');
  }

  const maxScore = Math.max(...entries.map(e => e.score));
  const maxEntries = entries.filter(e => e.score === maxScore);

  if (maxEntries.length === 1) {
    return { first: maxEntries[0].first, second: maxEntries[0].second };
  }

  // タイブレーク: まず2ndの優先順位、次に1stの優先順位
  maxEntries.sort((a, b) => {
    const secondPriorityA = TIEBREAK_PRIORITY.indexOf(a.second);
    const secondPriorityB = TIEBREAK_PRIORITY.indexOf(b.second);
    if (secondPriorityA !== secondPriorityB) {
      return secondPriorityA - secondPriorityB;
    }
    const firstPriorityA = TIEBREAK_PRIORITY.indexOf(a.first);
    const firstPriorityB = TIEBREAK_PRIORITY.indexOf(b.first);
    return firstPriorityA - firstPriorityB;
  });

  return { first: maxEntries[0].first, second: maxEntries[0].second };
}

export function selectDeterministicCommand(
  weights: CommandWeightMap
): CommandType {
  const entries = (Object.entries(weights) as [CommandType, number][])
    .filter(([, weight]) => weight > 0);

  if (entries.length === 0) {
    throw new Error('No valid commands with positive weights');
  }

  const maxWeight = Math.max(...entries.map(([, weight]) => weight));
  const maxEntries = entries.filter(([, weight]) => weight === maxWeight);

  if (maxEntries.length === 1) {
    return maxEntries[0][0];
  }

  // タイブレーク: 優先順位が高いコマンドを選択
  for (const cmd of TIEBREAK_PRIORITY) {
    if (maxEntries.some(([c]) => c === cmd)) {
      return cmd;
    }
  }

  return maxEntries[0][0];
}
