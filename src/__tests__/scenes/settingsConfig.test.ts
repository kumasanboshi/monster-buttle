import { GAME_WIDTH, GAME_HEIGHT } from '../../scenes/gameConfig';
import {
  SETTINGS_LAYOUT,
  SETTINGS_COLORS,
  SETTINGS_LABELS,
} from '../../scenes/settingsConfig';

describe('SETTINGS_LAYOUT', () => {
  it('すべてのレイアウト定数が正の数であること', () => {
    expect(SETTINGS_LAYOUT.titleY).toBeGreaterThan(0);
    expect(SETTINGS_LAYOUT.sliderStartY).toBeGreaterThan(0);
    expect(SETTINGS_LAYOUT.sliderSpacing).toBeGreaterThan(0);
    expect(SETTINGS_LAYOUT.sliderLabelX).toBeGreaterThan(0);
    expect(SETTINGS_LAYOUT.sliderBarX).toBeGreaterThan(0);
    expect(SETTINGS_LAYOUT.sliderBarWidth).toBeGreaterThan(0);
    expect(SETTINGS_LAYOUT.sliderBarHeight).toBeGreaterThan(0);
    expect(SETTINGS_LAYOUT.effectSpeedY).toBeGreaterThan(0);
    expect(SETTINGS_LAYOUT.backButtonY).toBeGreaterThan(0);
  });

  it('レイアウトが画面内に収まること', () => {
    expect(SETTINGS_LAYOUT.titleY).toBeLessThan(GAME_HEIGHT);
    expect(SETTINGS_LAYOUT.sliderStartY).toBeLessThan(GAME_HEIGHT);
    expect(SETTINGS_LAYOUT.effectSpeedY).toBeLessThan(GAME_HEIGHT);
    expect(SETTINGS_LAYOUT.backButtonY).toBeLessThan(GAME_HEIGHT);

    // スライダーバーが画面内に収まること
    const sliderEnd = SETTINGS_LAYOUT.sliderBarX + SETTINGS_LAYOUT.sliderBarWidth;
    expect(sliderEnd).toBeLessThan(GAME_WIDTH);
  });

  it('要素のY座標が上から順に配置されていること', () => {
    expect(SETTINGS_LAYOUT.titleY).toBeLessThan(SETTINGS_LAYOUT.sliderStartY);
    expect(SETTINGS_LAYOUT.sliderStartY).toBeLessThan(
      SETTINGS_LAYOUT.effectSpeedY
    );
    expect(SETTINGS_LAYOUT.effectSpeedY).toBeLessThan(
      SETTINGS_LAYOUT.backButtonY
    );
  });
});

describe('SETTINGS_COLORS', () => {
  it('数値色が有効な範囲であること', () => {
    expect(SETTINGS_COLORS.sliderBarBg).toBeGreaterThanOrEqual(0);
    expect(SETTINGS_COLORS.sliderBarBg).toBeLessThanOrEqual(0xffffff);
    expect(SETTINGS_COLORS.sliderBarFill).toBeGreaterThanOrEqual(0);
    expect(SETTINGS_COLORS.sliderBarFill).toBeLessThanOrEqual(0xffffff);
    expect(SETTINGS_COLORS.sliderHandle).toBeGreaterThanOrEqual(0);
    expect(SETTINGS_COLORS.sliderHandle).toBeLessThanOrEqual(0xffffff);
  });

  it('テキスト色が#RRGGBB形式であること', () => {
    expect(SETTINGS_COLORS.titleText).toMatch(/^#[0-9a-fA-F]{6}$/);
    expect(SETTINGS_COLORS.labelText).toMatch(/^#[0-9a-fA-F]{6}$/);
    expect(SETTINGS_COLORS.buttonText).toMatch(/^#[0-9a-fA-F]{6}$/);
  });
});

describe('SETTINGS_LABELS', () => {
  it('すべてのラベルが非空文字列であること', () => {
    expect(SETTINGS_LABELS.title.length).toBeGreaterThan(0);
    expect(SETTINGS_LABELS.bgmVolume.length).toBeGreaterThan(0);
    expect(SETTINGS_LABELS.seVolume.length).toBeGreaterThan(0);
    expect(SETTINGS_LABELS.effectSpeed.length).toBeGreaterThan(0);
    expect(SETTINGS_LABELS.effectSpeedNormal.length).toBeGreaterThan(0);
    expect(SETTINGS_LABELS.effectSpeedFast.length).toBeGreaterThan(0);
    expect(SETTINGS_LABELS.back.length).toBeGreaterThan(0);
  });
});
