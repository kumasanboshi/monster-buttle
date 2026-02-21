import {
  EQUIPMENT_PRESETS,
  MONSTER_DATABASE,
  ABILITY_UP_VALUES,
  getMonsterById,
} from '../../constants/monsters';

describe('EQUIPMENT_PRESETS', () => {
  describe('タイプA（攻撃寄り）', () => {
    it('武器倍率が1.6であること', () => {
      expect(EQUIPMENT_PRESETS.A.weapon.multiplier).toBe(1.6);
    });

    it('リフレクター反射回数が2であること', () => {
      expect(EQUIPMENT_PRESETS.A.reflector.maxReflectCount).toBe(2);
    });

    it('リフレクター反射率が0.5であること', () => {
      expect(EQUIPMENT_PRESETS.A.reflector.reflectRate).toBe(0.5);
    });
  });

  describe('タイプB（防御寄り）', () => {
    it('武器倍率が1.4であること', () => {
      expect(EQUIPMENT_PRESETS.B.weapon.multiplier).toBe(1.4);
    });

    it('リフレクター反射回数が3であること', () => {
      expect(EQUIPMENT_PRESETS.B.reflector.maxReflectCount).toBe(3);
    });

    it('リフレクター反射率が0.6であること', () => {
      expect(EQUIPMENT_PRESETS.B.reflector.reflectRate).toBe(0.6);
    });
  });
});

describe('MONSTER_DATABASE', () => {
  it('8体のモンスターが定義されていること', () => {
    expect(MONSTER_DATABASE).toHaveLength(8);
  });

  it('すべてのモンスターがユニークなIDを持つこと', () => {
    const ids = MONSTER_DATABASE.map((m) => m.id);
    expect(new Set(ids).size).toBe(8);
  });

  describe('ザーグ（レイン）- バランス型', () => {
    const monster = () => MONSTER_DATABASE.find((m) => m.species === 'ザーグ')!;

    it('基礎パラメータが仕様通りであること', () => {
      expect(monster().name).toBe('レイン');
      expect(monster().stats.hp).toBe(375);
      expect(monster().stats.strength).toBe(50);
      expect(monster().stats.special).toBe(50);
      expect(monster().stats.speed).toBe(40);
      expect(monster().stats.toughness).toBe(50);
      expect(monster().stats.specialAttackCount).toBe(7);
    });

    it('装備タイプAであること', () => {
      expect(monster().weapon.multiplier).toBe(1.6);
      expect(monster().reflector.maxReflectCount).toBe(2);
      expect(monster().reflector.reflectRate).toBe(0.5);
    });
  });

  describe('ガルダン（ドルグ）- 腕力型', () => {
    const monster = () => MONSTER_DATABASE.find((m) => m.species === 'ガルダン')!;

    it('基礎パラメータが仕様通りであること', () => {
      expect(monster().name).toBe('ドルグ');
      expect(monster().stats.hp).toBe(420);
      expect(monster().stats.strength).toBe(75);
      expect(monster().stats.special).toBe(25);
      expect(monster().stats.speed).toBe(15);
      expect(monster().stats.toughness).toBe(55);
      expect(monster().stats.specialAttackCount).toBe(5);
    });

    it('装備タイプAであること', () => {
      expect(monster().weapon.multiplier).toBe(1.6);
      expect(monster().reflector.maxReflectCount).toBe(2);
    });
  });

  describe('ルーナ（シエル）- 特殊型', () => {
    const monster = () => MONSTER_DATABASE.find((m) => m.species === 'ルーナ')!;

    it('基礎パラメータが仕様通りであること', () => {
      expect(monster().name).toBe('シエル');
      expect(monster().stats.hp).toBe(270);
      expect(monster().stats.strength).toBe(20);
      expect(monster().stats.special).toBe(80);
      expect(monster().stats.speed).toBe(45);
      expect(monster().stats.toughness).toBe(25);
      expect(monster().stats.specialAttackCount).toBe(9);
    });

    it('装備タイプBであること', () => {
      expect(monster().weapon.multiplier).toBe(1.4);
      expect(monster().reflector.maxReflectCount).toBe(3);
      expect(monster().reflector.reflectRate).toBe(0.6);
    });
  });

  describe('ゼフィル（カイ）- 素早さ型', () => {
    const monster = () => MONSTER_DATABASE.find((m) => m.species === 'ゼフィル')!;

    it('基礎パラメータが仕様通りであること', () => {
      expect(monster().name).toBe('カイ');
      expect(monster().stats.hp).toBe(300);
      expect(monster().stats.strength).toBe(45);
      expect(monster().stats.special).toBe(40);
      expect(monster().stats.speed).toBe(50);
      expect(monster().stats.toughness).toBe(30);
      expect(monster().stats.specialAttackCount).toBe(7);
    });

    it('装備タイプAであること', () => {
      expect(monster().weapon.multiplier).toBe(1.6);
    });
  });

  describe('バルガ（ゲンブ）- 丈夫さ型', () => {
    const monster = () => MONSTER_DATABASE.find((m) => m.species === 'バルガ')!;

    it('基礎パラメータが仕様通りであること', () => {
      expect(monster().name).toBe('ゲンブ');
      expect(monster().stats.hp).toBe(405);
      expect(monster().stats.strength).toBe(35);
      expect(monster().stats.special).toBe(30);
      expect(monster().stats.speed).toBe(15);
      expect(monster().stats.toughness).toBe(65);
      expect(monster().stats.specialAttackCount).toBe(6);
    });

    it('装備タイプBであること', () => {
      expect(monster().weapon.multiplier).toBe(1.4);
      expect(monster().reflector.maxReflectCount).toBe(3);
    });
  });

  describe('モルス（ユグド）- HP型', () => {
    const monster = () => MONSTER_DATABASE.find((m) => m.species === 'モルス')!;

    it('基礎パラメータが仕様通りであること', () => {
      expect(monster().name).toBe('ユグド');
      expect(monster().stats.hp).toBe(525);
      expect(monster().stats.strength).toBe(30);
      expect(monster().stats.special).toBe(35);
      expect(monster().stats.speed).toBe(20);
      expect(monster().stats.toughness).toBe(55);
      expect(monster().stats.specialAttackCount).toBe(8);
    });

    it('装備タイプBであること', () => {
      expect(monster().weapon.multiplier).toBe(1.4);
      expect(monster().reflector.reflectRate).toBe(0.6);
    });
  });

  describe('グラオン（ボルグ）- 物理特化型', () => {
    const monster = () => MONSTER_DATABASE.find((m) => m.species === 'グラオン')!;

    it('基礎パラメータが仕様通りであること', () => {
      expect(monster().name).toBe('ボルグ');
      expect(monster().stats.hp).toBe(345);
      expect(monster().stats.strength).toBe(70);
      expect(monster().stats.special).toBe(15);
      expect(monster().stats.speed).toBe(25);
      expect(monster().stats.toughness).toBe(65);
      expect(monster().stats.specialAttackCount).toBe(5);
    });

    it('装備タイプAであること', () => {
      expect(monster().weapon.multiplier).toBe(1.6);
      expect(monster().reflector.maxReflectCount).toBe(2);
    });
  });

  describe('イグナ（アーシュ）- 魔法特化型', () => {
    const monster = () => MONSTER_DATABASE.find((m) => m.species === 'イグナ')!;

    it('基礎パラメータが仕様通りであること', () => {
      expect(monster().name).toBe('アーシュ');
      expect(monster().stats.hp).toBe(255);
      expect(monster().stats.strength).toBe(15);
      expect(monster().stats.special).toBe(75);
      expect(monster().stats.speed).toBe(50);
      expect(monster().stats.toughness).toBe(20);
      expect(monster().stats.specialAttackCount).toBe(10);
    });

    it('装備タイプBであること', () => {
      expect(monster().weapon.multiplier).toBe(1.4);
      expect(monster().reflector.maxReflectCount).toBe(3);
      expect(monster().reflector.reflectRate).toBe(0.6);
    });
  });
});

describe('ABILITY_UP_VALUES', () => {
  it('8種族すべての能力UP値が定義されていること', () => {
    const speciesIds = MONSTER_DATABASE.map((m) => m.id);
    for (const id of speciesIds) {
      expect(ABILITY_UP_VALUES[id]).toBeDefined();
    }
  });

  it('ザーグの能力UP値が仕様通りであること', () => {
    const zaag = MONSTER_DATABASE.find((m) => m.species === 'ザーグ')!;
    const up = ABILITY_UP_VALUES[zaag.id];
    expect(up.hp).toBe(15);
    expect(up.strength).toBe(5);
    expect(up.special).toBe(5);
    expect(up.speed).toBe(4);
    expect(up.toughness).toBe(5);
  });

  it('ガルダンの能力UP値が仕様通りであること', () => {
    const gardan = MONSTER_DATABASE.find((m) => m.species === 'ガルダン')!;
    const up = ABILITY_UP_VALUES[gardan.id];
    expect(up.hp).toBe(15);
    expect(up.strength).toBe(8);
    expect(up.special).toBe(2);
    expect(up.speed).toBe(1);
    expect(up.toughness).toBe(5);
  });

  it('ルーナの能力UP値が仕様通りであること', () => {
    const roona = MONSTER_DATABASE.find((m) => m.species === 'ルーナ')!;
    const up = ABILITY_UP_VALUES[roona.id];
    expect(up.hp).toBe(10);
    expect(up.strength).toBe(1);
    expect(up.special).toBe(8);
    expect(up.speed).toBe(4);
    expect(up.toughness).toBe(2);
  });

  it('ゼフィルの能力UP値が仕様通りであること', () => {
    const zephyr = MONSTER_DATABASE.find((m) => m.species === 'ゼフィル')!;
    const up = ABILITY_UP_VALUES[zephyr.id];
    expect(up.hp).toBe(12);
    expect(up.strength).toBe(4);
    expect(up.special).toBe(4);
    expect(up.speed).toBe(5);
    expect(up.toughness).toBe(3);
  });

  it('バルガの能力UP値が仕様通りであること', () => {
    const balga = MONSTER_DATABASE.find((m) => m.species === 'バルガ')!;
    const up = ABILITY_UP_VALUES[balga.id];
    expect(up.hp).toBe(15);
    expect(up.strength).toBe(3);
    expect(up.special).toBe(2);
    expect(up.speed).toBe(1);
    expect(up.toughness).toBe(8);
  });

  it('モルスの能力UP値が仕様通りであること', () => {
    const morsu = MONSTER_DATABASE.find((m) => m.species === 'モルス')!;
    const up = ABILITY_UP_VALUES[morsu.id];
    expect(up.hp).toBe(20);
    expect(up.strength).toBe(2);
    expect(up.special).toBe(3);
    expect(up.speed).toBe(2);
    expect(up.toughness).toBe(5);
  });

  it('グラオンの能力UP値が仕様通りであること', () => {
    const graon = MONSTER_DATABASE.find((m) => m.species === 'グラオン')!;
    const up = ABILITY_UP_VALUES[graon.id];
    expect(up.hp).toBe(13);
    expect(up.strength).toBe(7);
    expect(up.special).toBe(1);
    expect(up.speed).toBe(2);
    expect(up.toughness).toBe(6);
  });

  it('イグナの能力UP値が仕様通りであること', () => {
    const igna = MONSTER_DATABASE.find((m) => m.species === 'イグナ')!;
    const up = ABILITY_UP_VALUES[igna.id];
    expect(up.hp).toBe(10);
    expect(up.strength).toBe(1);
    expect(up.special).toBe(8);
    expect(up.speed).toBe(5);
    expect(up.toughness).toBe(1);
  });
});

describe('getMonsterById', () => {
  it('IDで正しいモンスターを取得できること', () => {
    const first = MONSTER_DATABASE[0];
    const result = getMonsterById(first.id);
    expect(result).toBe(first);
  });

  it('存在しないIDの場合undefinedを返すこと', () => {
    const result = getMonsterById('non-existent-id');
    expect(result).toBeUndefined();
  });

  it('すべてのモンスターをIDで取得できること', () => {
    for (const monster of MONSTER_DATABASE) {
      expect(getMonsterById(monster.id)).toBe(monster);
    }
  });
});
