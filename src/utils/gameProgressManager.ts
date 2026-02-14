import {
  GameProgress,
  DEFAULT_GAME_PROGRESS,
  isValidGameProgress,
} from '../types/GameProgress';

/** LocalStorageのキー */
export const PROGRESS_STORAGE_KEY = 'monster-buttle-progress';

/**
 * ゲーム進捗をLocalStorageから読み込む
 * データがない場合や壊れている場合はデフォルト値を返す
 */
export function loadGameProgress(): GameProgress {
  try {
    const stored = localStorage.getItem(PROGRESS_STORAGE_KEY);
    if (!stored) return { ...DEFAULT_GAME_PROGRESS };

    const parsed = JSON.parse(stored);
    if (!isValidGameProgress(parsed)) return { ...DEFAULT_GAME_PROGRESS };

    return parsed;
  } catch {
    return { ...DEFAULT_GAME_PROGRESS };
  }
}

/**
 * ゲーム進捗をLocalStorageに保存する
 */
export function saveGameProgress(progress: GameProgress): void {
  try {
    localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(progress));
  } catch {
    // LocalStorageが使えない場合は無視
  }
}

/**
 * ステージクリア時に進捗を更新する
 * 現在のclearedStagesより大きい場合のみ更新する
 */
export function updateClearedStages(stageNumber: number): GameProgress {
  const current = loadGameProgress();
  if (stageNumber > current.clearedStages) {
    current.clearedStages = stageNumber;
    saveGameProgress(current);
  }
  return current;
}
