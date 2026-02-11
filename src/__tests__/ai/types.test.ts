import { AILevel, SpeciesTendency } from '../../ai/types';
import { CommandType } from '../../types';

describe('AILevel', () => {
  it('5つのレベルが定義されている', () => {
    expect(AILevel.LV1).toBe('LV1');
    expect(AILevel.LV2).toBe('LV2');
    expect(AILevel.LV3).toBe('LV3');
    expect(AILevel.LV4).toBe('LV4');
    expect(AILevel.LV5).toBe('LV5');
  });

  it('5つのレベルのみ存在する', () => {
    const values = Object.values(AILevel);
    expect(values).toHaveLength(5);
  });
});

describe('SpeciesTendency', () => {
  it('7つのコマンドタイプのweightを持つ', () => {
    const tendency: SpeciesTendency = {
      [CommandType.ADVANCE]: 1.0,
      [CommandType.RETREAT]: 1.0,
      [CommandType.WEAPON_ATTACK]: 1.0,
      [CommandType.SPECIAL_ATTACK]: 1.0,
      [CommandType.REFLECTOR]: 1.0,
      [CommandType.STANCE_A]: 1.0,
      [CommandType.STANCE_B]: 1.0,
    };

    expect(Object.keys(tendency)).toHaveLength(7);
    for (const weight of Object.values(tendency)) {
      expect(typeof weight).toBe('number');
      expect(weight).toBeGreaterThan(0);
    }
  });
});
