import {
  calculateGrownStats,
  getMonsterWithFinalStats,
  FINAL_MONSTER_DATABASE,
} from '../../constants/monsterStats';
import { MONSTER_DATABASE, ABILITY_UP_VALUES } from '../../constants/monsters';

describe('calculateGrownStats', () => {
  const baseStats = { hp: 250, strength: 50, special: 50, speed: 40, toughness: 50, specialAttackCount: 5 };
  const abilityUp = { hp: 15, strength: 5, special: 5, speed: 4, toughness: 5 };

  it('成長段階0で基礎パラメータのままであること', () => {
    const result = calculateGrownStats(baseStats, abilityUp, 0);
    expect(result.hp).toBe(250);
    expect(result.strength).toBe(50);
    expect(result.special).toBe(50);
    expect(result.speed).toBe(40);
    expect(result.toughness).toBe(50);
  });

  it('成長段階7で各能力が7倍のUP値分上昇すること', () => {
    const result = calculateGrownStats(baseStats, abilityUp, 7);
    expect(result.hp).toBe(250 + 15 * 7);       // 355
    expect(result.strength).toBe(50 + 5 * 7);   // 85
    expect(result.special).toBe(50 + 5 * 7);    // 85
    expect(result.speed).toBe(40 + 4 * 7);      // 68
    expect(result.toughness).toBe(50 + 5 * 7);  // 85
  });

  it('specialAttackCountは成長しないこと', () => {
    const result = calculateGrownStats(baseStats, abilityUp, 7);
    expect(result.specialAttackCount).toBe(5);
  });

  it('成長段階3で正しく計算されること', () => {
    const result = calculateGrownStats(baseStats, abilityUp, 3);
    expect(result.hp).toBe(250 + 15 * 3);       // 295
    expect(result.strength).toBe(50 + 5 * 3);   // 65
  });

  it('負の成長段階は0にクランプされること', () => {
    const result = calculateGrownStats(baseStats, abilityUp, -1);
    expect(result.hp).toBe(250);
    expect(result.strength).toBe(50);
  });

  it('7を超える成長段階は7にクランプされること', () => {
    const result = calculateGrownStats(baseStats, abilityUp, 10);
    expect(result.hp).toBe(250 + 15 * 7);
    expect(result.strength).toBe(50 + 5 * 7);
  });
});

describe('getMonsterWithFinalStats', () => {
  it('ザーグの最終パラメータが正しいこと', () => {
    const monster = getMonsterWithFinalStats('zaag');
    expect(monster).toBeDefined();
    expect(monster!.stats.hp).toBe(375 + 15 * 7);         // 480
    expect(monster!.stats.strength).toBe(50 + 5 * 7);     // 85
    expect(monster!.stats.special).toBe(50 + 5 * 7);      // 85
    expect(monster!.stats.speed).toBe(40 + 4 * 7);        // 68
    expect(monster!.stats.toughness).toBe(50 + 5 * 7);    // 85
    expect(monster!.stats.specialAttackCount).toBe(7);
  });

  it('ガルダンの最終パラメータが正しいこと', () => {
    const monster = getMonsterWithFinalStats('gardan');
    expect(monster).toBeDefined();
    expect(monster!.stats.hp).toBe(420 + 15 * 7);         // 525
    expect(monster!.stats.strength).toBe(75 + 8 * 7);     // 131
    expect(monster!.stats.special).toBe(25 + 2 * 7);      // 39
    expect(monster!.stats.speed).toBe(15 + 1 * 7);        // 22
    expect(monster!.stats.toughness).toBe(55 + 5 * 7);    // 90
    expect(monster!.stats.specialAttackCount).toBe(5);
  });

  it('存在しないIDでundefinedを返すこと', () => {
    const monster = getMonsterWithFinalStats('nonexistent');
    expect(monster).toBeUndefined();
  });

  it('装備情報は変化しないこと', () => {
    const base = MONSTER_DATABASE.find((m) => m.id === 'zaag')!;
    const final = getMonsterWithFinalStats('zaag')!;
    expect(final.weapon).toEqual(base.weapon);
    expect(final.reflector).toEqual(base.reflector);
  });

  it('名前と魂格は変化しないこと', () => {
    const base = MONSTER_DATABASE.find((m) => m.id === 'zaag')!;
    const final = getMonsterWithFinalStats('zaag')!;
    expect(final.name).toBe(base.name);
    expect(final.species).toBe(base.species);
    expect(final.id).toBe(base.id);
  });
});

describe('FINAL_MONSTER_DATABASE', () => {
  it('8体のモンスターが含まれること', () => {
    expect(FINAL_MONSTER_DATABASE).toHaveLength(8);
  });

  it('すべてのモンスターが最終パラメータを持つこと', () => {
    for (const monster of FINAL_MONSTER_DATABASE) {
      const base = MONSTER_DATABASE.find((m) => m.id === monster.id)!;
      const abilityUp = ABILITY_UP_VALUES[monster.id];
      expect(monster.stats.hp).toBe(base.stats.hp + abilityUp.hp * 7);
      expect(monster.stats.strength).toBe(base.stats.strength + abilityUp.strength * 7);
      expect(monster.stats.special).toBe(base.stats.special + abilityUp.special * 7);
      expect(monster.stats.speed).toBe(base.stats.speed + abilityUp.speed * 7);
      expect(monster.stats.toughness).toBe(base.stats.toughness + abilityUp.toughness * 7);
      expect(monster.stats.specialAttackCount).toBe(base.stats.specialAttackCount);
    }
  });

  it('IDの重複がないこと', () => {
    const ids = FINAL_MONSTER_DATABASE.map((m) => m.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
