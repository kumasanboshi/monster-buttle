/** 横画面推奨プロンプトに必要なデバイス情報 */
export interface OrientationCheckInput {
  isMobile: boolean;
  isPortrait: boolean;
}

/** 横画面推奨メッセージ */
export const ORIENTATION_PROMPT_MESSAGE = '横画面での\nプレイを推奨します';

/**
 * 横画面推奨プロンプトを表示すべきかどうか判定する
 * モバイル端末かつ縦画面の場合のみ true
 */
export function shouldShowOrientationPrompt(input: OrientationCheckInput): boolean {
  return input.isMobile && input.isPortrait;
}
