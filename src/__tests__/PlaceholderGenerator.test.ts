import {
  MONSTER_SPRITE_CONFIG,
  MONSTER_PORTRAIT_CONFIG,
  LOCK_ICON_CONFIG,
  MONSTER_VISUALS,
} from '../scenes/PlaceholderGenerator';

describe('MONSTER_SPRITE_CONFIG', () => {
  it('バトルスプライトは100x100pxである', () => {
    expect(MONSTER_SPRITE_CONFIG.width).toBe(100);
    expect(MONSTER_SPRITE_CONFIG.height).toBe(100);
  });
});

describe('MONSTER_PORTRAIT_CONFIG', () => {
  it('ポートレートは60x60pxである', () => {
    expect(MONSTER_PORTRAIT_CONFIG.width).toBe(60);
    expect(MONSTER_PORTRAIT_CONFIG.height).toBe(60);
  });
});

describe('LOCK_ICON_CONFIG', () => {
  it('ロックアイコンは40x40pxである', () => {
    expect(LOCK_ICON_CONFIG.width).toBe(40);
    expect(LOCK_ICON_CONFIG.height).toBe(40);
  });
});

describe('MONSTER_VISUALS', () => {
  const expectedMonsterIds = ['zaag', 'gardan', 'roona', 'zephyr', 'balga', 'morsu', 'graon', 'igna'];

  it('全8体のモンスターが定義されている', () => {
    expect(Object.keys(MONSTER_VISUALS)).toHaveLength(8);
    expectedMonsterIds.forEach((id) => {
      expect(MONSTER_VISUALS[id]).toBeDefined();
    });
  });

  it('各モンスターにイニシャルとカラーが設定されている', () => {
    expectedMonsterIds.forEach((id) => {
      const visual = MONSTER_VISUALS[id];
      expect(visual.initial).toBeDefined();
      expect(typeof visual.initial).toBe('string');
      expect(visual.initial.length).toBeGreaterThan(0);
      expect(typeof visual.color).toBe('number');
    });
  });

  it('各モンスターのイニシャルはユニークである', () => {
    const initials = expectedMonsterIds.map((id) => MONSTER_VISUALS[id].initial);
    const uniqueInitials = new Set(initials);
    expect(uniqueInitials.size).toBe(initials.length);
  });
});
