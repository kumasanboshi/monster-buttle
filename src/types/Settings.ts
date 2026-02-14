/**
 * 演出速度
 */
export enum EffectSpeed {
  /** 通常速度 */
  NORMAL = 'normal',
  /** 高速 */
  FAST = 'fast',
}

/**
 * ゲーム設定
 */
export interface Settings {
  /** BGM音量（0〜100の整数） */
  bgmVolume: number;
  /** SE音量（0〜100の整数） */
  seVolume: number;
  /** 演出速度 */
  effectSpeed: EffectSpeed;
}

/** デフォルト設定値 */
export const DEFAULT_SETTINGS: Settings = {
  bgmVolume: 80,
  seVolume: 80,
  effectSpeed: EffectSpeed.NORMAL,
};

/**
 * 音量を0〜100の整数にクランプする
 */
export function clampVolume(volume: number): number {
  return Math.max(0, Math.min(100, Math.round(volume)));
}

/**
 * 有効な演出速度かどうかを判定する
 */
export function isValidEffectSpeed(speed: string): speed is EffectSpeed {
  return speed === EffectSpeed.NORMAL || speed === EffectSpeed.FAST;
}

/**
 * Settings型のバリデーション
 */
export function isValidSettings(obj: unknown): obj is Settings {
  if (obj === null || obj === undefined || typeof obj !== 'object') {
    return false;
  }

  const candidate = obj as Record<string, unknown>;

  return (
    typeof candidate.bgmVolume === 'number' &&
    typeof candidate.seVolume === 'number' &&
    typeof candidate.effectSpeed === 'string' &&
    isValidEffectSpeed(candidate.effectSpeed)
  );
}
