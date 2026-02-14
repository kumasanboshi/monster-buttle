import { SceneKey } from './sceneKeys';

/** シーン遷移の定義 */
export interface SceneTransition {
  /** 遷移元シーン */
  from: SceneKey;
  /** 遷移先シーン */
  to: SceneKey;
}

/** 許可されたシーン遷移の一覧 */
export const SCENE_TRANSITIONS: SceneTransition[] = [
  { from: SceneKey.BOOT, to: SceneKey.TITLE },
  { from: SceneKey.TITLE, to: SceneKey.MODE_SELECT },
  { from: SceneKey.TITLE, to: SceneKey.CHARACTER_SELECT },
  { from: SceneKey.TITLE, to: SceneKey.SETTINGS },
  { from: SceneKey.MODE_SELECT, to: SceneKey.CHARACTER_SELECT },
  { from: SceneKey.MODE_SELECT, to: SceneKey.TITLE },
  { from: SceneKey.CHARACTER_SELECT, to: SceneKey.BATTLE },
  { from: SceneKey.CHARACTER_SELECT, to: SceneKey.MODE_SELECT },
  { from: SceneKey.CHARACTER_SELECT, to: SceneKey.CHARACTER_SELECT },
  { from: SceneKey.CHARACTER_SELECT, to: SceneKey.DIFFICULTY_SELECT },
  { from: SceneKey.CHARACTER_SELECT, to: SceneKey.TITLE },
  { from: SceneKey.DIFFICULTY_SELECT, to: SceneKey.BATTLE },
  { from: SceneKey.DIFFICULTY_SELECT, to: SceneKey.CHARACTER_SELECT },
  { from: SceneKey.BATTLE, to: SceneKey.RESULT },
  { from: SceneKey.RESULT, to: SceneKey.TITLE },
  { from: SceneKey.RESULT, to: SceneKey.CHARACTER_SELECT },
  { from: SceneKey.RESULT, to: SceneKey.BATTLE },
  { from: SceneKey.SETTINGS, to: SceneKey.TITLE },
];

/**
 * 指定シーンから遷移可能な先のシーンキー一覧を返す
 */
export function getAvailableTransitions(from: SceneKey): SceneKey[] {
  return SCENE_TRANSITIONS.filter((t) => t.from === from).map((t) => t.to);
}

/**
 * 指定の遷移が許可されているか確認する
 */
export function isValidTransition(from: SceneKey, to: SceneKey): boolean {
  return SCENE_TRANSITIONS.some((t) => t.from === from && t.to === to);
}
