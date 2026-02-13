/**
 * シーンキー定数
 *
 * Phaserのシーン管理で使用する一意なキー文字列を定義。
 * 文字列リテラルのタイプミスを防ぎ、補完を効かせるために定数化する。
 */
export enum SceneKey {
  /** 起動シーン（アセットロード） */
  BOOT = 'BOOT',
  /** タイトル画面 */
  TITLE = 'TITLE',
  /** モード選択画面 */
  MODE_SELECT = 'MODE_SELECT',
  /** キャラ選択画面 */
  CHARACTER_SELECT = 'CHARACTER_SELECT',
  /** バトル画面 */
  BATTLE = 'BATTLE',
  /** リザルト画面 */
  RESULT = 'RESULT',
  /** 設定画面 */
  SETTINGS = 'SETTINGS',
}

/** 全シーンキーの配列（順序はシーン登録順） */
export const ALL_SCENE_KEYS: SceneKey[] = [
  SceneKey.BOOT,
  SceneKey.TITLE,
  SceneKey.MODE_SELECT,
  SceneKey.CHARACTER_SELECT,
  SceneKey.BATTLE,
  SceneKey.RESULT,
  SceneKey.SETTINGS,
];
