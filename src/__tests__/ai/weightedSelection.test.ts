import { selectWeightedCommand } from '../../ai/weightedSelection';
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
