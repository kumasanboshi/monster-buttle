/**
 * モンスター画像テクスチャキー
 */
export const MonsterImageKey = {
  // バトルスプライト (100x100)
  ZAAG_BATTLE: 'monster_zaag_battle',
  GARDAN_BATTLE: 'monster_gardan_battle',
  ROONA_BATTLE: 'monster_roona_battle',
  ZEPHYR_BATTLE: 'monster_zephyr_battle',
  BALGA_BATTLE: 'monster_balga_battle',
  MORSU_BATTLE: 'monster_morsu_battle',
  GRAON_BATTLE: 'monster_graon_battle',
  IGNA_BATTLE: 'monster_igna_battle',

  // ポートレート (60x60)
  ZAAG_PORTRAIT: 'monster_zaag_portrait',
  GARDAN_PORTRAIT: 'monster_gardan_portrait',
  ROONA_PORTRAIT: 'monster_roona_portrait',
  ZEPHYR_PORTRAIT: 'monster_zephyr_portrait',
  BALGA_PORTRAIT: 'monster_balga_portrait',
  MORSU_PORTRAIT: 'monster_morsu_portrait',
  GRAON_PORTRAIT: 'monster_graon_portrait',
  IGNA_PORTRAIT: 'monster_igna_portrait',
} as const;

/**
 * UI画像テクスチャキー
 */
export const UIImageKey = {
  LOCK_ICON: 'ui_lock_icon',
} as const;

/**
 * モンスターIDからバトルテクスチャキーを取得
 */
export function getMonsterBattleKey(monsterId: string): string {
  return `monster_${monsterId}_battle`;
}

/**
 * モンスターIDからポートレートテクスチャキーを取得
 */
export function getMonsterPortraitKey(monsterId: string): string {
  return `monster_${monsterId}_portrait`;
}
