/** 設定画面レイアウト定数 */
export interface SettingsLayoutConfig {
  /** タイトルのY座標 */
  titleY: number;
  /** スライダー開始Y座標 */
  sliderStartY: number;
  /** スライダー間隔 */
  sliderSpacing: number;
  /** ラベルのX座標 */
  sliderLabelX: number;
  /** スライダーバーのX座標 */
  sliderBarX: number;
  /** スライダーバーの幅 */
  sliderBarWidth: number;
  /** スライダーバーの高さ */
  sliderBarHeight: number;
  /** 演出速度のY座標 */
  effectSpeedY: number;
  /** 戻るボタンのY座標 */
  backButtonY: number;
}

/** 設定画面レイアウト */
export const SETTINGS_LAYOUT: SettingsLayoutConfig = {
  titleY: 80,
  sliderStartY: 180,
  sliderSpacing: 100,
  sliderLabelX: 150,
  sliderBarX: 350,
  sliderBarWidth: 300,
  sliderBarHeight: 8,
  effectSpeedY: 420,
  backButtonY: 520,
};

/** 設定画面の色設定 */
export interface SettingsColorConfig {
  /** タイトルテキスト色 */
  titleText: string;
  /** ラベルテキスト色 */
  labelText: string;
  /** スライダーバー背景色 */
  sliderBarBg: number;
  /** スライダーバー充填色 */
  sliderBarFill: number;
  /** スライダーハンドル色 */
  sliderHandle: number;
  /** 演出速度ボタン色 */
  effectSpeedButton: number;
  /** 演出速度ボタン選択色 */
  effectSpeedButtonActive: number;
  /** ボタンテキスト色 */
  buttonText: string;
}

/** 設定画面色設定 */
export const SETTINGS_COLORS: SettingsColorConfig = {
  titleText: '#ffffff',
  labelText: '#cccccc',
  sliderBarBg: 0x333333,
  sliderBarFill: 0x6688bb,
  sliderHandle: 0xffffff,
  effectSpeedButton: 0x445588,
  effectSpeedButtonActive: 0x6688bb,
  buttonText: '#ffffff',
};

/** 設定画面のラベルテキスト */
export const SETTINGS_LABELS = {
  title: '設定',
  bgmVolume: 'BGM音量',
  seVolume: 'SE音量',
  effectSpeed: '演出速度',
  effectSpeedNormal: '通常',
  effectSpeedFast: '高速',
  back: '戻る',
} as const;
