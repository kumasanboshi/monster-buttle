import { getMonsterWithGrownStats } from '../../constants/monsterStats';
import { MONSTER_DATABASE, ABILITY_UP_VALUES } from '../../constants/monsters';

describe('getMonsterWithGrownStats', () => {
  it('成長段階0で基礎パラメータのままであること', () => {
    const monster = getMonsterWithGrownStats('zaag', 0);
    expect(monster).toBeDefined();
    const base = MONSTER_DATABASE.find((m) => m.id === 'zaag')!;
    expect(monster!.stats).toEqual(base.stats);
  });

  it('成長段階3で正しく計算されること', () => {
    const monster = getMonsterWithGrownStats('zaag', 3);
    expect(monster).toBeDefined();
    const abilityUp = ABILITY_UP_VALUES['zaag'];
    expect(monster!.stats.hp).toBe(375 + abilityUp.hp * 3);
    expect(monster!.stats.strength).toBe(50 + abilityUp.strength * 3);
    expect(monster!.stats.special).toBe(50 + abilityUp.special * 3);
    expect(monster!.stats.speed).toBe(40 + abilityUp.speed * 3);
    expect(monster!.stats.toughness).toBe(50 + abilityUp.toughness * 3);
  });

  it('成長段階7で最終パラメータと同じであること', () => {
    const monster = getMonsterWithGrownStats('zaag', 7);
    expect(monster).toBeDefined();
    const abilityUp = ABILITY_UP_VALUES['zaag'];
    expect(monster!.stats.hp).toBe(375 + abilityUp.hp * 7);
    expect(monster!.stats.strength).toBe(50 + abilityUp.strength * 7);
  });

  it('specialAttackCountは成長しないこと', () => {
    const monster = getMonsterWithGrownStats('zaag', 5);
    expect(monster!.stats.specialAttackCount).toBe(7);
  });

  it('装備情報は変化しないこと', () => {
    const base = MONSTER_DATABASE.find((m) => m.id === 'gardan')!;
    const grown = getMonsterWithGrownStats('gardan', 4);
    expect(grown!.weapon).toEqual(base.weapon);
    expect(grown!.reflector).toEqual(base.reflector);
  });

  it('名前と魂格は変化しないこと', () => {
    const base = MONSTER_DATABASE.find((m) => m.id === 'gardan')!;
    const grown = getMonsterWithGrownStats('gardan', 4);
    expect(grown!.name).toBe(base.name);
    expect(grown!.species).toBe(base.species);
    expect(grown!.id).toBe(base.id);
  });

  it('存在しないIDでundefinedを返すこと', () => {
    expect(getMonsterWithGrownStats('nonexistent', 3)).toBeUndefined();
  });

  it('ガルダンの成長段階5が正しいこと', () => {
    const monster = getMonsterWithGrownStats('gardan', 5);
    expect(monster).toBeDefined();
    const abilityUp = ABILITY_UP_VALUES['gardan'];
    expect(monster!.stats.hp).toBe(420 + abilityUp.hp * 5);
    expect(monster!.stats.strength).toBe(75 + abilityUp.strength * 5);
    expect(monster!.stats.toughness).toBe(55 + abilityUp.toughness * 5);
  });
});
