import {
  Settings,
  DEFAULT_SETTINGS,
  EffectSpeed,
  isValidSettings,
  clampVolume,
} from '../types/Settings';

/** LocalStorageのキー */
export const STORAGE_KEY = 'monster-buttle-settings';

/**
 * 設定値をLocalStorageから読み込む
 * データがない場合や壊れている場合はデフォルト値を返す
 */
export function loadSettings(): Settings {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return { ...DEFAULT_SETTINGS };

    const parsed = JSON.parse(stored);
    if (!isValidSettings(parsed)) return { ...DEFAULT_SETTINGS };

    return parsed;
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

/**
 * 設定値をLocalStorageに保存する
 * 音量は0〜100の範囲にクランプされる
 */
export function saveSettings(settings: Settings): void {
  const clamped: Settings = {
    bgmVolume: clampVolume(settings.bgmVolume),
    seVolume: clampVolume(settings.seVolume),
    effectSpeed: settings.effectSpeed,
  };

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(clamped));
  } catch {
    // LocalStorageが使えない場合は無視
  }
}

/**
 * 演出速度に対応するエフェクト時間の乗数を返す
 */
export function getEffectSpeedMultiplier(speed: EffectSpeed): number {
  switch (speed) {
    case EffectSpeed.SLOW:
      return 2.0;
    case EffectSpeed.NORMAL:
      return 1.0;
    case EffectSpeed.FAST:
      return 0.5;
  }
}
