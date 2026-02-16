/** デバイス情報 */
export interface DeviceInfo {
  isMobile: boolean;
  isPortrait: boolean;
  screenWidth: number;
  screenHeight: number;
  hasTouchScreen: boolean;
}

/** モバイル判定の画面幅しきい値 */
const MOBILE_WIDTH_THRESHOLD = 1024;

/**
 * 現在のデバイス情報を検知して返す
 */
export function detectDevice(): DeviceInfo {
  const hasTouchScreen = navigator.maxTouchPoints > 0;
  const screenWidth = window.innerWidth;
  const screenHeight = window.innerHeight;
  const smallScreen = Math.min(screenWidth, screenHeight) < MOBILE_WIDTH_THRESHOLD;
  const isMobile = hasTouchScreen && smallScreen;
  const isPortrait = screenHeight > screenWidth;

  return {
    isMobile,
    isPortrait,
    screenWidth,
    screenHeight,
    hasTouchScreen,
  };
}

/**
 * 現在の画面が縦向きかどうかを判定する
 */
export function isPortraitOrientation(): boolean {
  return window.innerHeight > window.innerWidth;
}
