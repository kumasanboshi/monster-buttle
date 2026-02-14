import { SceneKey } from './sceneKeys';
import { GameMode } from '../types/GameMode';

/** タイトル画面のボタン設定 */
export interface TitleButtonConfig {
  /** ボタンのラベルテキスト */
  label: string;
  /** 遷移先シーン */
  targetScene: SceneKey;
  /** ゲームモード（モード選択ボタンの場合） */
  mode?: GameMode;
}

/** ゲームタイトルテキスト */
export const TITLE_TEXT = 'モンスター対戦';

/** タイトル画面のボタン定義（表示順） */
export const TITLE_BUTTONS: TitleButtonConfig[] = [
  {
    label: '挑戦モード',
    targetScene: SceneKey.MODE_SELECT,
    mode: GameMode.CHALLENGE,
  },
  {
    label: '自由対戦（CPU）',
    targetScene: SceneKey.CHARACTER_SELECT,
    mode: GameMode.FREE_CPU,
  },
  {
    label: '自由対戦（ローカル）',
    targetScene: SceneKey.MODE_SELECT,
    mode: GameMode.FREE_LOCAL,
  },
  {
    label: '設定',
    targetScene: SceneKey.SETTINGS,
  },
];
