import { selectWeightedCommand, selectDeterministicCommand } from '../../ai/weightedSelection';
import { CommandType } from '../../types';

describe('selectWeightedCommand', () => {
  describe('基本動作', () => {
    it('1つのコマンドだけの場合、それを返す', () => {
      const weights = { [CommandType.ADVANCE]: 1.0 };
      expect(selectWeightedCommand(weights, () => 0.5)).toBe(CommandType.ADVANCE);
    });

    it('等しい重みの2コマンドでrandomFn=0.0なら先頭を返す', () => {
      const weights = {
        [CommandType.ADVANCE]: 1.0,
        [CommandType.RETREAT]: 1.0,
      };
      expect(selectWeightedCommand(weights, () => 0.0)).toBe(CommandType.ADVANCE);
    });

    it('等しい重みの2コマンドでrandomFn=0.99なら末尾を返す', () => {
      const weights = {
        [CommandType.ADVANCE]: 1.0,
        [CommandType.RETREAT]: 1.0,
      };
      expect(selectWeightedCommand(weights, () => 0.99)).toBe(CommandType.RETREAT);
    });
  });

  describe('重み付き分布', () => {
    it('重み3.0 vs 1.0 → randomFn < 0.75 で前者を選択', () => {
      const weights = {
        [CommandType.WEAPON_ATTACK]: 3.0,
        [CommandType.SPECIAL_ATTACK]: 1.0,
      };
      // randomFn * totalWeight(4.0) = 0.74 * 4.0 = 2.96 < 3.0 → WEAPON_ATTACK
      expect(selectWeightedCommand(weights, () => 0.74)).toBe(CommandType.WEAPON_ATTACK);
    });

    it('重み3.0 vs 1.0 → randomFn >= 0.75 で後者を選択', () => {
      const weights = {
        [CommandType.WEAPON_ATTACK]: 3.0,
        [CommandType.SPECIAL_ATTACK]: 1.0,
      };
      // randomFn * totalWeight(4.0) = 0.76 * 4.0 = 3.04 > 3.0 → SPECIAL_ATTACK
      expect(selectWeightedCommand(weights, () => 0.76)).toBe(CommandType.SPECIAL_ATTACK);
    });

    it('等しい重みの境界値（randomFn=0.5）で2番目のコマンドを返す', () => {
      const weights = {
        [CommandType.ADVANCE]: 0.5,
        [CommandType.RETREAT]: 0.5,
      };
      // randomFn(0.5) * totalWeight(1.0) = 0.5
      // ADVANCE(0.5): 0.5 - 0.5 = 0.0 → 0は負でないので次へ
      // RETREAT(0.5): 0.0 - 0.5 = -0.5 < 0 → RETREAT
      expect(selectWeightedCommand(weights, () => 0.5)).toBe(CommandType.RETREAT);
    });

    it('3つのコマンドで累積重みによる選択', () => {
      const weights = {
        [CommandType.ADVANCE]: 2.0,
        [CommandType.RETREAT]: 1.0,
        [CommandType.SPECIAL_ATTACK]: 1.0,
      };
      // totalWeight = 4.0
      // ADVANCE: 0 ~ 2.0, RETREAT: 2.0 ~ 3.0, SPECIAL: 3.0 ~ 4.0
      expect(selectWeightedCommand(weights, () => 0.0)).toBe(CommandType.ADVANCE);     // 0 * 4 = 0
      expect(selectWeightedCommand(weights, () => 0.49)).toBe(CommandType.ADVANCE);    // 0.49 * 4 = 1.96
      expect(selectWeightedCommand(weights, () => 0.51)).toBe(CommandType.RETREAT);    // 0.51 * 4 = 2.04
      expect(selectWeightedCommand(weights, () => 0.74)).toBe(CommandType.RETREAT);    // 0.74 * 4 = 2.96
      expect(selectWeightedCommand(weights, () => 0.76)).toBe(CommandType.SPECIAL_ATTACK); // 0.76 * 4 = 3.04
      expect(selectWeightedCommand(weights, () => 0.99)).toBe(CommandType.SPECIAL_ATTACK); // 0.99 * 4 = 3.96
    });
  });

  describe('エッジケース', () => {
    it('重み0のコマンドは選択されない', () => {
      const weights = {
        [CommandType.ADVANCE]: 1.0,
        [CommandType.RETREAT]: 0,
      };
      // 0は除外されるので ADVANCE のみ
      expect(selectWeightedCommand(weights, () => 0.99)).toBe(CommandType.ADVANCE);
    });

    it('全コマンドの重みが0以下の場合はエラー', () => {
      const weights = {
        [CommandType.ADVANCE]: 0,
        [CommandType.RETREAT]: 0,
      };
      expect(() => selectWeightedCommand(weights, () => 0.5)).toThrow();
    });

    it('空のweightsの場合はエラー', () => {
      expect(() => selectWeightedCommand({}, () => 0.5)).toThrow();
    });

    it('非常に小さい重みでも正しく選択される', () => {
      const weights = {
        [CommandType.ADVANCE]: 0.001,
        [CommandType.RETREAT]: 0.001,
      };
      expect(selectWeightedCommand(weights, () => 0.0)).toBe(CommandType.ADVANCE);
      expect(selectWeightedCommand(weights, () => 0.99)).toBe(CommandType.RETREAT);
    });

    it('非常に大きい重みでも正しく動作する', () => {
      const weights = {
        [CommandType.ADVANCE]: 10000,
        [CommandType.RETREAT]: 10000,
      };
      expect(selectWeightedCommand(weights, () => 0.0)).toBe(CommandType.ADVANCE);
      expect(selectWeightedCommand(weights, () => 0.99)).toBe(CommandType.RETREAT);
    });
  });
});

describe('selectDeterministicCommand', () => {
  describe('基本動作', () => {
    it('重みが最大のコマンドを返す', () => {
      const weights = {
        [CommandType.ADVANCE]: 1.0,
        [CommandType.RETREAT]: 3.0,
        [CommandType.SPECIAL_ATTACK]: 2.0,
      };
      expect(selectDeterministicCommand(weights)).toBe(CommandType.RETREAT);
    });

    it('1つのコマンドだけの場合、それを返す', () => {
      const weights = { [CommandType.WEAPON_ATTACK]: 1.5 };
      expect(selectDeterministicCommand(weights)).toBe(CommandType.WEAPON_ATTACK);
    });
  });

  describe('タイブレーク（同率の場合、攻撃系コマンドを優先）', () => {
    it('WEAPON_ATTACK と SPECIAL_ATTACK が同率 → WEAPON_ATTACK', () => {
      const weights = {
        [CommandType.WEAPON_ATTACK]: 2.0,
        [CommandType.SPECIAL_ATTACK]: 2.0,
      };
      expect(selectDeterministicCommand(weights)).toBe(CommandType.WEAPON_ATTACK);
    });

    it('SPECIAL_ATTACK と REFLECTOR が同率 → SPECIAL_ATTACK', () => {
      const weights = {
        [CommandType.SPECIAL_ATTACK]: 2.0,
        [CommandType.REFLECTOR]: 2.0,
      };
      expect(selectDeterministicCommand(weights)).toBe(CommandType.SPECIAL_ATTACK);
    });

    it('REFLECTOR と ADVANCE が同率 → REFLECTOR', () => {
      const weights = {
        [CommandType.REFLECTOR]: 2.0,
        [CommandType.ADVANCE]: 2.0,
      };
      expect(selectDeterministicCommand(weights)).toBe(CommandType.REFLECTOR);
    });

    it('ADVANCE と RETREAT が同率 → ADVANCE', () => {
      const weights = {
        [CommandType.ADVANCE]: 2.0,
        [CommandType.RETREAT]: 2.0,
      };
      expect(selectDeterministicCommand(weights)).toBe(CommandType.ADVANCE);
    });

    it('STANCE_A と STANCE_B が同率 → STANCE_A', () => {
      const weights = {
        [CommandType.STANCE_A]: 2.0,
        [CommandType.STANCE_B]: 2.0,
      };
      expect(selectDeterministicCommand(weights)).toBe(CommandType.STANCE_A);
    });

    it('全コマンド同率 → WEAPON_ATTACK（最優先）', () => {
      const weights = {
        [CommandType.ADVANCE]: 1.0,
        [CommandType.RETREAT]: 1.0,
        [CommandType.WEAPON_ATTACK]: 1.0,
        [CommandType.SPECIAL_ATTACK]: 1.0,
        [CommandType.REFLECTOR]: 1.0,
        [CommandType.STANCE_A]: 1.0,
        [CommandType.STANCE_B]: 1.0,
      };
      expect(selectDeterministicCommand(weights)).toBe(CommandType.WEAPON_ATTACK);
    });
  });

  describe('エッジケース', () => {
    it('重み0のコマンドは選択されない', () => {
      const weights = {
        [CommandType.ADVANCE]: 0,
        [CommandType.RETREAT]: 1.0,
      };
      expect(selectDeterministicCommand(weights)).toBe(CommandType.RETREAT);
    });

    it('空のweightsの場合はエラー', () => {
      expect(() => selectDeterministicCommand({})).toThrow();
    });

    it('全コマンドの重みが0以下の場合はエラー', () => {
      const weights = {
        [CommandType.ADVANCE]: 0,
        [CommandType.RETREAT]: -1,
      };
      expect(() => selectDeterministicCommand(weights)).toThrow();
    });

    it('同じ乱数で呼んでも常に同じ結果（確定的）', () => {
      const weights = {
        [CommandType.ADVANCE]: 1.0,
        [CommandType.RETREAT]: 3.0,
        [CommandType.SPECIAL_ATTACK]: 2.0,
      };
      const result1 = selectDeterministicCommand(weights);
      const result2 = selectDeterministicCommand(weights);
      const result3 = selectDeterministicCommand(weights);
      expect(result1).toBe(result2);
      expect(result2).toBe(result3);
    });
  });
});
