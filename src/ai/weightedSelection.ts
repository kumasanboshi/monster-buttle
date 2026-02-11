import { CommandType } from '../types';

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
