/** オーディオアセットのキー定数 */
export const AudioKey = {
  BGM_TITLE: 'bgm_title',
  BGM_BATTLE: 'bgm_battle',
  SE_ATTACK: 'se_attack',
  SE_SELECT: 'se_select',
  SE_VICTORY: 'se_victory',
  SE_DEFEAT: 'se_defeat',
} as const;

/** AudioKeyの値の型 */
export type AudioKeyValue = (typeof AudioKey)[keyof typeof AudioKey];

/** BGMキーの一覧 */
export const BGM_KEYS: readonly AudioKeyValue[] = [
  AudioKey.BGM_TITLE,
  AudioKey.BGM_BATTLE,
];

/** SEキーの一覧 */
export const SE_KEYS: readonly AudioKeyValue[] = [
  AudioKey.SE_ATTACK,
  AudioKey.SE_SELECT,
  AudioKey.SE_VICTORY,
  AudioKey.SE_DEFEAT,
];

/** 全AudioKeyの値セット */
const ALL_AUDIO_KEYS = new Set<string>(Object.values(AudioKey));

/** 文字列がAudioKeyの値かどうかを判定する型ガード */
export function isAudioKey(value: string): value is AudioKeyValue {
  return ALL_AUDIO_KEYS.has(value);
}
