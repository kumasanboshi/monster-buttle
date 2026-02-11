import { CommandType, DistanceType, TurnResult } from '../types';

/**
 * 距離別コマンド頻度マップ
 */
export type DistanceCommandFrequency = Record<DistanceType, Partial<Record<CommandType, number>>>;

/**
 * 空の距離別頻度マップを生成
 */
function createEmptyFrequency(): DistanceCommandFrequency {
  return {
    [DistanceType.NEAR]: {},
    [DistanceType.MID]: {},
    [DistanceType.FAR]: {},
  };
}

/**
 * プレイヤーの直近Nターンの履歴を分析し、距離別コマンド頻度を返す
 *
 * distanceBeforeはTurnResultに含まれないため、前ターンのdistanceAfterから導出する。
 * 履歴の最初のターン（前ターンが無い）はdistanceBefore不明のためスキップする。
 *
 * @param turnHistory バトル履歴（TurnResult[]）
 * @param playerId 分析対象プレイヤー
 * @param lookbackTurns 何ターン分遡るか（デフォルト3）
 * @returns 距離別コマンド頻度
 */
export function analyzePlayerPattern(
  turnHistory: TurnResult[],
  playerId: 'player1' | 'player2',
  lookbackTurns: number = 3
): DistanceCommandFrequency {
  const frequency = createEmptyFrequency();

  if (turnHistory.length <= 1) {
    return frequency;
  }

  // lookbackTurns分の直近ターンを取得（ただしdistanceBefore導出のため最初のターンは除外可能性あり）
  // 分析対象: 末尾からlookbackTurns個（ただしindex 0は前ターンが無いのでスキップ）
  const startIndex = Math.max(1, turnHistory.length - lookbackTurns);

  for (let i = startIndex; i < turnHistory.length; i++) {
    const turn = turnHistory[i];
    const distanceBefore = turnHistory[i - 1].distanceAfter;
    const commands = playerId === 'player1' ? turn.player1Commands : turn.player2Commands;

    // 1stと2ndの両方をカウント
    addCount(frequency, distanceBefore, commands.first.type);
    addCount(frequency, distanceBefore, commands.second.type);
  }

  return frequency;
}

/**
 * 頻度マップにカウントを追加
 */
function addCount(
  frequency: DistanceCommandFrequency,
  distance: DistanceType,
  command: CommandType
): void {
  const distMap = frequency[distance];
  distMap[command] = (distMap[command] ?? 0) + 1;
}

/**
 * 距離別頻度から最頻出コマンドを抽出
 *
 * @param frequency 距離別コマンド頻度
 * @param distance 対象距離
 * @returns 最頻出コマンド（同率の場合は配列）、データ不足時はnull
 */
export function getMostFrequentCommand(
  frequency: DistanceCommandFrequency,
  distance: DistanceType
): CommandType[] | null {
  const distMap = frequency[distance];
  const entries = Object.entries(distMap) as [CommandType, number][];

  if (entries.length === 0) {
    return null;
  }

  const maxCount = Math.max(...entries.map(([, count]) => count));
  const mostFrequent = entries
    .filter(([, count]) => count === maxCount)
    .map(([cmd]) => cmd);

  return mostFrequent;
}
