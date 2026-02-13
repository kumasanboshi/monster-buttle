import {
  BATTLE_LAYOUT,
  BATTLE_COLORS,
  DISTANCE_LABELS,
  STANCE_LABELS,
  BATTLE_INITIAL,
  DISTANCE_CHARACTER_POSITIONS,
  formatTime,
  clampHp,
} from '../../scenes/battleConfig';
import { DistanceType } from '../../types/Distance';
import { StanceType } from '../../types/Stance';
import { GAME_WIDTH, GAME_HEIGHT } from '../../scenes/gameConfig';

describe('BATTLE_LAYOUT', () => {
  it('すべてのレイアウト定数が正の数であること', () => {
    expect(BATTLE_LAYOUT.hpBarY).toBeGreaterThan(0);
    expect(BATTLE_LAYOUT.hpBarWidth).toBeGreaterThan(0);
    expect(BATTLE_LAYOUT.hpBarHeight).toBeGreaterThan(0);
    expect(BATTLE_LAYOUT.playerHpBarX).toBeGreaterThanOrEqual(0);
    expect(BATTLE_LAYOUT.enemyHpBarX).toBeGreaterThan(0);
    expect(BATTLE_LAYOUT.characterY).toBeGreaterThan(0);
    expect(BATTLE_LAYOUT.statusY).toBeGreaterThan(0);
  });

  it('HPバーが画面内に収まること', () => {
    expect(BATTLE_LAYOUT.hpBarY + BATTLE_LAYOUT.hpBarHeight).toBeLessThanOrEqual(GAME_HEIGHT);
    expect(BATTLE_LAYOUT.playerHpBarX + BATTLE_LAYOUT.hpBarWidth).toBeLessThanOrEqual(GAME_WIDTH);
    expect(BATTLE_LAYOUT.enemyHpBarX + BATTLE_LAYOUT.hpBarWidth).toBeLessThanOrEqual(GAME_WIDTH);
  });

  it('キャラ表示Y座標が画面内であること', () => {
    expect(BATTLE_LAYOUT.characterY).toBeLessThanOrEqual(GAME_HEIGHT);
  });

  it('ステータス表示Y座標が画面内であること', () => {
    expect(BATTLE_LAYOUT.statusY).toBeLessThanOrEqual(GAME_HEIGHT);
  });
});

describe('BATTLE_COLORS', () => {
  it('HPバー色が0xRRGGBB形式の数値であること', () => {
    expect(typeof BATTLE_COLORS.playerHpBar).toBe('number');
    expect(typeof BATTLE_COLORS.enemyHpBar).toBe('number');
    expect(typeof BATTLE_COLORS.hpBarBg).toBe('number');
    expect(BATTLE_COLORS.playerHpBar).toBeGreaterThanOrEqual(0x000000);
    expect(BATTLE_COLORS.playerHpBar).toBeLessThanOrEqual(0xffffff);
    expect(BATTLE_COLORS.enemyHpBar).toBeGreaterThanOrEqual(0x000000);
    expect(BATTLE_COLORS.enemyHpBar).toBeLessThanOrEqual(0xffffff);
    expect(BATTLE_COLORS.hpBarBg).toBeGreaterThanOrEqual(0x000000);
    expect(BATTLE_COLORS.hpBarBg).toBeLessThanOrEqual(0xffffff);
  });

  it('テキスト色が#RRGGBB形式の文字列であること', () => {
    expect(BATTLE_COLORS.distanceText).toMatch(/^#[0-9a-fA-F]{6}$/);
    expect(BATTLE_COLORS.timeText).toMatch(/^#[0-9a-fA-F]{6}$/);
    expect(BATTLE_COLORS.playerStanceText).toMatch(/^#[0-9a-fA-F]{6}$/);
    expect(BATTLE_COLORS.enemyStanceText).toMatch(/^#[0-9a-fA-F]{6}$/);
  });

  it('プレイヤーと敵のHPバー色が異なること', () => {
    expect(BATTLE_COLORS.playerHpBar).not.toBe(BATTLE_COLORS.enemyHpBar);
  });
});

describe('DISTANCE_LABELS', () => {
  it('全DistanceTypeにラベルが定義されていること', () => {
    const distanceTypes = Object.values(DistanceType);
    expect(distanceTypes).toHaveLength(3);
    for (const distance of distanceTypes) {
      expect(DISTANCE_LABELS[distance]).toBeDefined();
    }
  });

  it('NEARが「近距離」であること', () => {
    expect(DISTANCE_LABELS[DistanceType.NEAR]).toBe('近距離');
  });

  it('MIDが「中距離」であること', () => {
    expect(DISTANCE_LABELS[DistanceType.MID]).toBe('中距離');
  });

  it('FARが「遠距離」であること', () => {
    expect(DISTANCE_LABELS[DistanceType.FAR]).toBe('遠距離');
  });
});

describe('STANCE_LABELS', () => {
  it('全StanceTypeにラベルが定義されていること', () => {
    const stanceTypes = Object.values(StanceType);
    expect(stanceTypes).toHaveLength(3);
    for (const stance of stanceTypes) {
      expect(STANCE_LABELS[stance]).toBeDefined();
    }
  });

  it('NORMALが「通常」であること', () => {
    expect(STANCE_LABELS[StanceType.NORMAL]).toBe('通常');
  });

  it('OFFENSIVEが「攻勢」であること', () => {
    expect(STANCE_LABELS[StanceType.OFFENSIVE]).toBe('攻勢');
  });

  it('DEFENSIVEが「守勢」であること', () => {
    expect(STANCE_LABELS[StanceType.DEFENSIVE]).toBe('守勢');
  });
});

describe('BATTLE_INITIAL', () => {
  it('初期距離が中距離（MID）であること', () => {
    expect(BATTLE_INITIAL.initialDistance).toBe(DistanceType.MID);
  });

  it('初期スタンスが通常（NORMAL）であること', () => {
    expect(BATTLE_INITIAL.initialStance).toBe(StanceType.NORMAL);
  });

  it('初期制限時間が120秒であること', () => {
    expect(BATTLE_INITIAL.initialTime).toBe(120);
  });
});

describe('DISTANCE_CHARACTER_POSITIONS', () => {
  it('3つの距離すべてにポジション定義があること', () => {
    for (const distance of Object.values(DistanceType)) {
      const pos = DISTANCE_CHARACTER_POSITIONS[distance];
      expect(pos).toBeDefined();
      expect(typeof pos.playerX).toBe('number');
      expect(typeof pos.enemyX).toBe('number');
    }
  });

  it('すべてのポジションが画面内に収まること', () => {
    for (const distance of Object.values(DistanceType)) {
      const pos = DISTANCE_CHARACTER_POSITIONS[distance];
      expect(pos.playerX).toBeGreaterThanOrEqual(0);
      expect(pos.playerX).toBeLessThanOrEqual(GAME_WIDTH);
      expect(pos.enemyX).toBeGreaterThanOrEqual(0);
      expect(pos.enemyX).toBeLessThanOrEqual(GAME_WIDTH);
    }
  });

  it('プレイヤーが常に敵より左側にいること', () => {
    for (const distance of Object.values(DistanceType)) {
      const pos = DISTANCE_CHARACTER_POSITIONS[distance];
      expect(pos.playerX).toBeLessThan(pos.enemyX);
    }
  });

  it('近距離が最も近く、遠距離が最も遠いこと', () => {
    const nearGap = Math.abs(
      DISTANCE_CHARACTER_POSITIONS[DistanceType.NEAR].enemyX -
        DISTANCE_CHARACTER_POSITIONS[DistanceType.NEAR].playerX
    );
    const midGap = Math.abs(
      DISTANCE_CHARACTER_POSITIONS[DistanceType.MID].enemyX -
        DISTANCE_CHARACTER_POSITIONS[DistanceType.MID].playerX
    );
    const farGap = Math.abs(
      DISTANCE_CHARACTER_POSITIONS[DistanceType.FAR].enemyX -
        DISTANCE_CHARACTER_POSITIONS[DistanceType.FAR].playerX
    );

    expect(nearGap).toBeLessThan(midGap);
    expect(midGap).toBeLessThan(farGap);
  });
});

describe('formatTime', () => {
  it('120秒を「2:00」にフォーマットすること', () => {
    expect(formatTime(120)).toBe('2:00');
  });

  it('65秒を「1:05」にフォーマットすること', () => {
    expect(formatTime(65)).toBe('1:05');
  });

  it('60秒を「1:00」にフォーマットすること', () => {
    expect(formatTime(60)).toBe('1:00');
  });

  it('10秒を「0:10」にフォーマットすること', () => {
    expect(formatTime(10)).toBe('0:10');
  });

  it('5秒を「0:05」にフォーマットすること', () => {
    expect(formatTime(5)).toBe('0:05');
  });

  it('0秒を「0:00」にフォーマットすること', () => {
    expect(formatTime(0)).toBe('0:00');
  });

  it('1秒を「0:01」にフォーマットすること', () => {
    expect(formatTime(1)).toBe('0:01');
  });

  it('59秒を「0:59」にフォーマットすること', () => {
    expect(formatTime(59)).toBe('0:59');
  });

  it('119秒を「1:59」にフォーマットすること', () => {
    expect(formatTime(119)).toBe('1:59');
  });

  it('負数を「0:00」にフォーマットすること', () => {
    expect(formatTime(-1)).toBe('0:00');
    expect(formatTime(-120)).toBe('0:00');
  });

  it('小数値を切り捨ててフォーマットすること', () => {
    expect(formatTime(65.7)).toBe('1:05');
    expect(formatTime(59.999)).toBe('0:59');
    expect(formatTime(120.1)).toBe('2:00');
  });
});

describe('clampHp', () => {
  it('範囲内の値はそのまま返すこと', () => {
    expect(clampHp(50, 100)).toBe(50);
    expect(clampHp(1, 100)).toBe(1);
    expect(clampHp(99, 100)).toBe(99);
  });

  it('最大HP値をそのまま返すこと', () => {
    expect(clampHp(100, 100)).toBe(100);
    expect(clampHp(250, 250)).toBe(250);
  });

  it('0をそのまま返すこと', () => {
    expect(clampHp(0, 100)).toBe(0);
  });

  it('負数を0にクランプすること', () => {
    expect(clampHp(-1, 100)).toBe(0);
    expect(clampHp(-50, 100)).toBe(0);
    expect(clampHp(-999, 100)).toBe(0);
  });

  it('maxHp超過をmaxHpにクランプすること', () => {
    expect(clampHp(101, 100)).toBe(100);
    expect(clampHp(150, 100)).toBe(100);
    expect(clampHp(999, 100)).toBe(100);
  });

  it('maxHpが0の場合に0を返すこと', () => {
    expect(clampHp(0, 0)).toBe(0);
    expect(clampHp(10, 0)).toBe(0);
    expect(clampHp(-10, 0)).toBe(0);
  });
});
