/**
 * ゲーム進捗データ
 *
 * 挑戦モードのクリア状態を管理する。
 */
export interface GameProgress {
  /** クリア済みステージ数（0〜8） */
  clearedStages: number;
}

/** デフォルトのゲーム進捗（未クリア状態） */
export const DEFAULT_GAME_PROGRESS: GameProgress = {
  clearedStages: 0,
};

/**
 * GameProgress型のバリデーション
 */
export function isValidGameProgress(obj: unknown): obj is GameProgress {
  if (obj === null || obj === undefined || typeof obj !== 'object') {
    return false;
  }

  const candidate = obj as Record<string, unknown>;

  return (
    typeof candidate.clearedStages === 'number' &&
    Number.isInteger(candidate.clearedStages) &&
    candidate.clearedStages >= 0 &&
    candidate.clearedStages <= 8
  );
}
