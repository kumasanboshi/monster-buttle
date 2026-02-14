import { GAME_HEIGHT } from '../../scenes/gameConfig';
import {
  CPU_DIFFICULTY_OPTIONS,
  DIFFICULTY_SELECT_LAYOUT,
  DIFFICULTY_SELECT_LABELS,
} from '../../scenes/difficultySelectConfig';
import { AILevel } from '../../ai/types';

describe('CPU_DIFFICULTY_OPTIONS', () => {
  it('4段階の難易度が定義されていること', () => {
    expect(CPU_DIFFICULTY_OPTIONS).toHaveLength(4);
  });

  it('弱い=LV1, 普通=LV2, 強い=LV4, 最強=LV5 であること', () => {
    const levelMap = CPU_DIFFICULTY_OPTIONS.reduce(
      (acc, opt) => ({ ...acc, [opt.label]: opt.aiLevel }),
      {} as Record<string, AILevel>,
    );
    expect(levelMap['弱い']).toBe(AILevel.LV1);
    expect(levelMap['普通']).toBe(AILevel.LV2);
    expect(levelMap['強い']).toBe(AILevel.LV4);
    expect(levelMap['最強']).toBe(AILevel.LV5);
  });

  it('すべてのオプションにlabelとaiLevelがあること', () => {
    for (const option of CPU_DIFFICULTY_OPTIONS) {
      expect(option.label).toBeDefined();
      expect(typeof option.label).toBe('string');
      expect(option.label.length).toBeGreaterThan(0);
      expect(option.aiLevel).toBeDefined();
    }
  });

  it('ラベルの並び順が「弱い, 普通, 強い, 最強」であること', () => {
    expect(CPU_DIFFICULTY_OPTIONS[0].label).toBe('弱い');
    expect(CPU_DIFFICULTY_OPTIONS[1].label).toBe('普通');
    expect(CPU_DIFFICULTY_OPTIONS[2].label).toBe('強い');
    expect(CPU_DIFFICULTY_OPTIONS[3].label).toBe('最強');
  });
});

describe('DIFFICULTY_SELECT_LAYOUT', () => {
  it('レイアウト定数が正の値であること', () => {
    expect(DIFFICULTY_SELECT_LAYOUT.titleY).toBeGreaterThan(0);
    expect(DIFFICULTY_SELECT_LAYOUT.buttonStartY).toBeGreaterThan(0);
    expect(DIFFICULTY_SELECT_LAYOUT.buttonSpacing).toBeGreaterThan(0);
    expect(DIFFICULTY_SELECT_LAYOUT.backButtonY).toBeGreaterThan(0);
  });

  it('要素のY座標が上から順に配置されていること', () => {
    expect(DIFFICULTY_SELECT_LAYOUT.titleY).toBeLessThan(DIFFICULTY_SELECT_LAYOUT.buttonStartY);
    expect(DIFFICULTY_SELECT_LAYOUT.buttonStartY).toBeLessThan(DIFFICULTY_SELECT_LAYOUT.backButtonY);
  });

  it('レイアウトが画面内に収まること', () => {
    expect(DIFFICULTY_SELECT_LAYOUT.backButtonY).toBeLessThan(GAME_HEIGHT);
  });
});

describe('DIFFICULTY_SELECT_LABELS', () => {
  it('タイトルが「CPU難易度選択」であること', () => {
    expect(DIFFICULTY_SELECT_LABELS.title).toBe('CPU難易度選択');
  });

  it('戻るラベルが「戻る」であること', () => {
    expect(DIFFICULTY_SELECT_LABELS.back).toBe('戻る');
  });
});
