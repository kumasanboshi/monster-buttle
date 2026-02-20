import {
  DEFAULT_SETTINGS,
  EffectSpeed,
  isValidSettings,
  clampVolume,
  isValidEffectSpeed,
} from '../../types/Settings';

describe('DEFAULT_SETTINGS', () => {
  it('bgmVolumeが0〜100の範囲であること', () => {
    expect(DEFAULT_SETTINGS.bgmVolume).toBeGreaterThanOrEqual(0);
    expect(DEFAULT_SETTINGS.bgmVolume).toBeLessThanOrEqual(100);
  });

  it('seVolumeが0〜100の範囲であること', () => {
    expect(DEFAULT_SETTINGS.seVolume).toBeGreaterThanOrEqual(0);
    expect(DEFAULT_SETTINGS.seVolume).toBeLessThanOrEqual(100);
  });

  it('effectSpeedが有効な値であること', () => {
    expect([EffectSpeed.NORMAL, EffectSpeed.FAST, EffectSpeed.SLOW]).toContain(
      DEFAULT_SETTINGS.effectSpeed
    );
  });
});

describe('isValidSettings', () => {
  it('正しいSettings型オブジェクトをtrueと判定すること', () => {
    expect(
      isValidSettings({
        bgmVolume: 80,
        seVolume: 60,
        effectSpeed: EffectSpeed.NORMAL,
      })
    ).toBe(true);
  });

  it('bgmVolumeが数値でない場合falseを返すこと', () => {
    expect(
      isValidSettings({
        bgmVolume: 'high',
        seVolume: 60,
        effectSpeed: EffectSpeed.NORMAL,
      })
    ).toBe(false);
  });

  it('seVolumeが数値でない場合falseを返すこと', () => {
    expect(
      isValidSettings({
        bgmVolume: 80,
        seVolume: null,
        effectSpeed: EffectSpeed.NORMAL,
      })
    ).toBe(false);
  });

  it('effectSpeedが無効な値の場合falseを返すこと', () => {
    expect(
      isValidSettings({ bgmVolume: 80, seVolume: 60, effectSpeed: 'medium' })
    ).toBe(false);
  });

  it('effectSpeedが"slow"の場合trueを返すこと', () => {
    expect(
      isValidSettings({ bgmVolume: 80, seVolume: 60, effectSpeed: 'slow' })
    ).toBe(true);
  });

  it('プロパティが欠けている場合falseを返すこと', () => {
    expect(isValidSettings({ bgmVolume: 80 })).toBe(false);
    expect(isValidSettings({})).toBe(false);
    expect(isValidSettings(null)).toBe(false);
    expect(isValidSettings(undefined)).toBe(false);
  });
});

describe('clampVolume', () => {
  it('0〜100の範囲内の値はそのまま返すこと', () => {
    expect(clampVolume(50)).toBe(50);
    expect(clampVolume(0)).toBe(0);
    expect(clampVolume(100)).toBe(100);
  });

  it('負の値は0にクランプすること', () => {
    expect(clampVolume(-10)).toBe(0);
    expect(clampVolume(-1)).toBe(0);
  });

  it('100を超える値は100にクランプすること', () => {
    expect(clampVolume(101)).toBe(100);
    expect(clampVolume(200)).toBe(100);
  });

  it('小数は整数に丸めること', () => {
    expect(clampVolume(50.7)).toBe(51);
    expect(clampVolume(50.3)).toBe(50);
  });
});

describe('isValidEffectSpeed', () => {
  it('EffectSpeed.NORMALをtrueと判定すること', () => {
    expect(isValidEffectSpeed(EffectSpeed.NORMAL)).toBe(true);
  });

  it('EffectSpeed.FASTをtrueと判定すること', () => {
    expect(isValidEffectSpeed(EffectSpeed.FAST)).toBe(true);
  });

  it('EffectSpeed.SLOWをtrueと判定すること', () => {
    expect(isValidEffectSpeed(EffectSpeed.SLOW)).toBe(true);
  });

  it('"slow"をtrueと判定すること', () => {
    expect(isValidEffectSpeed('slow')).toBe(true);
  });

  it('他の文字列をfalseと判定すること', () => {
    expect(isValidEffectSpeed('medium')).toBe(false);
    expect(isValidEffectSpeed('')).toBe(false);
    expect(isValidEffectSpeed('NORMAL')).toBe(false);
  });
});
