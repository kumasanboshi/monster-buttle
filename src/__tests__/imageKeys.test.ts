import {
  MonsterImageKey,
  UIImageKey,
  getMonsterBattleKey,
  getMonsterPortraitKey,
} from '../constants/imageKeys';

describe('MonsterImageKey', () => {
  it('8体すべてのモンスターバトルキーが定義されている', () => {
    expect(MonsterImageKey.ZAAG_BATTLE).toBe('monster_zaag_battle');
    expect(MonsterImageKey.GARDAN_BATTLE).toBe('monster_gardan_battle');
    expect(MonsterImageKey.ROONA_BATTLE).toBe('monster_roona_battle');
    expect(MonsterImageKey.ZEPHYR_BATTLE).toBe('monster_zephyr_battle');
    expect(MonsterImageKey.BALGA_BATTLE).toBe('monster_balga_battle');
    expect(MonsterImageKey.MORSU_BATTLE).toBe('monster_morsu_battle');
    expect(MonsterImageKey.GRAON_BATTLE).toBe('monster_graon_battle');
    expect(MonsterImageKey.IGNA_BATTLE).toBe('monster_igna_battle');
  });

  it('8体すべてのモンスターポートレートキーが定義されている', () => {
    expect(MonsterImageKey.ZAAG_PORTRAIT).toBe('monster_zaag_portrait');
    expect(MonsterImageKey.GARDAN_PORTRAIT).toBe('monster_gardan_portrait');
    expect(MonsterImageKey.ROONA_PORTRAIT).toBe('monster_roona_portrait');
    expect(MonsterImageKey.ZEPHYR_PORTRAIT).toBe('monster_zephyr_portrait');
    expect(MonsterImageKey.BALGA_PORTRAIT).toBe('monster_balga_portrait');
    expect(MonsterImageKey.MORSU_PORTRAIT).toBe('monster_morsu_portrait');
    expect(MonsterImageKey.GRAON_PORTRAIT).toBe('monster_graon_portrait');
    expect(MonsterImageKey.IGNA_PORTRAIT).toBe('monster_igna_portrait');
  });
});

describe('UIImageKey', () => {
  it('ロックアイコンキーが定義されている', () => {
    expect(UIImageKey.LOCK_ICON).toBe('ui_lock_icon');
  });
});

describe('getMonsterBattleKey', () => {
  it('モンスターIDからバトルテクスチャキーを返す', () => {
    expect(getMonsterBattleKey('zaag')).toBe('monster_zaag_battle');
    expect(getMonsterBattleKey('gardan')).toBe('monster_gardan_battle');
    expect(getMonsterBattleKey('roona')).toBe('monster_roona_battle');
    expect(getMonsterBattleKey('zephyr')).toBe('monster_zephyr_battle');
    expect(getMonsterBattleKey('balga')).toBe('monster_balga_battle');
    expect(getMonsterBattleKey('morsu')).toBe('monster_morsu_battle');
    expect(getMonsterBattleKey('graon')).toBe('monster_graon_battle');
    expect(getMonsterBattleKey('igna')).toBe('monster_igna_battle');
  });
});

describe('getMonsterPortraitKey', () => {
  it('モンスターIDからポートレートテクスチャキーを返す', () => {
    expect(getMonsterPortraitKey('zaag')).toBe('monster_zaag_portrait');
    expect(getMonsterPortraitKey('gardan')).toBe('monster_gardan_portrait');
    expect(getMonsterPortraitKey('roona')).toBe('monster_roona_portrait');
    expect(getMonsterPortraitKey('zephyr')).toBe('monster_zephyr_portrait');
    expect(getMonsterPortraitKey('balga')).toBe('monster_balga_portrait');
    expect(getMonsterPortraitKey('morsu')).toBe('monster_morsu_portrait');
    expect(getMonsterPortraitKey('graon')).toBe('monster_graon_portrait');
    expect(getMonsterPortraitKey('igna')).toBe('monster_igna_portrait');
  });
});
