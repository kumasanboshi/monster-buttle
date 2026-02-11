import { CommandType, DistanceType } from '../../types';
import {
  isCombatCommand,
  isWeaponInRange,
  resolveCommandInteraction,
  CommandOutcome,
} from '../../battle/commandPriority';

describe('isCombatCommand', () => {
  it('武器攻撃は戦闘コマンド', () => {
    expect(isCombatCommand(CommandType.WEAPON_ATTACK)).toBe(true);
  });

  it('特殊攻撃は戦闘コマンド', () => {
    expect(isCombatCommand(CommandType.SPECIAL_ATTACK)).toBe(true);
  });

  it('リフレクターは戦闘コマンド', () => {
    expect(isCombatCommand(CommandType.REFLECTOR)).toBe(true);
  });

  it('前進は戦闘コマンドではない', () => {
    expect(isCombatCommand(CommandType.ADVANCE)).toBe(false);
  });

  it('後退は戦闘コマンドではない', () => {
    expect(isCombatCommand(CommandType.RETREAT)).toBe(false);
  });

  it('スタンスAは戦闘コマンドではない', () => {
    expect(isCombatCommand(CommandType.STANCE_A)).toBe(false);
  });

  it('スタンスBは戦闘コマンドではない', () => {
    expect(isCombatCommand(CommandType.STANCE_B)).toBe(false);
  });
});

describe('isWeaponInRange', () => {
  it('近距離では武器攻撃が届く', () => {
    expect(isWeaponInRange(DistanceType.NEAR)).toBe(true);
  });

  it('中距離では武器攻撃が届かない', () => {
    expect(isWeaponInRange(DistanceType.MID)).toBe(false);
  });

  it('遠距離では武器攻撃が届かない', () => {
    expect(isWeaponInRange(DistanceType.FAR)).toBe(false);
  });
});

describe('resolveCommandInteraction', () => {
  describe('近距離', () => {
    const distance = DistanceType.NEAR;

    describe('武器攻撃の優先順位', () => {
      it('武器 vs 武器: 相打ち（両者HIT）', () => {
        const result = resolveCommandInteraction(distance, CommandType.WEAPON_ATTACK, CommandType.WEAPON_ATTACK);
        expect(result.p1Outcome).toBe(CommandOutcome.HIT);
        expect(result.p2Outcome).toBe(CommandOutcome.HIT);
      });

      it('武器 vs 特殊: 武器命中＋特殊潰れ（武器 > 特殊）', () => {
        const result = resolveCommandInteraction(distance, CommandType.WEAPON_ATTACK, CommandType.SPECIAL_ATTACK);
        expect(result.p1Outcome).toBe(CommandOutcome.HIT);
        expect(result.p2Outcome).toBe(CommandOutcome.CANCELLED);
      });

      it('特殊 vs 武器: 特殊潰れ＋武器命中（対称）', () => {
        const result = resolveCommandInteraction(distance, CommandType.SPECIAL_ATTACK, CommandType.WEAPON_ATTACK);
        expect(result.p1Outcome).toBe(CommandOutcome.CANCELLED);
        expect(result.p2Outcome).toBe(CommandOutcome.HIT);
      });

      it('武器 vs リフレクター: 武器貫通（武器 > リフレクター）', () => {
        const result = resolveCommandInteraction(distance, CommandType.WEAPON_ATTACK, CommandType.REFLECTOR);
        expect(result.p1Outcome).toBe(CommandOutcome.HIT);
        expect(result.p2Outcome).toBe(CommandOutcome.NO_EFFECT);
      });

      it('リフレクター vs 武器: 武器貫通（対称）', () => {
        const result = resolveCommandInteraction(distance, CommandType.REFLECTOR, CommandType.WEAPON_ATTACK);
        expect(result.p1Outcome).toBe(CommandOutcome.NO_EFFECT);
        expect(result.p2Outcome).toBe(CommandOutcome.HIT);
      });
    });

    describe('特殊攻撃とリフレクターの相互作用', () => {
      it('特殊 vs 特殊: 相打ち（両者HIT）', () => {
        const result = resolveCommandInteraction(distance, CommandType.SPECIAL_ATTACK, CommandType.SPECIAL_ATTACK);
        expect(result.p1Outcome).toBe(CommandOutcome.HIT);
        expect(result.p2Outcome).toBe(CommandOutcome.HIT);
      });

      it('特殊 vs リフレクター: 特殊がカウンターされる（リフレクター > 特殊）', () => {
        const result = resolveCommandInteraction(distance, CommandType.SPECIAL_ATTACK, CommandType.REFLECTOR);
        expect(result.p1Outcome).toBe(CommandOutcome.COUNTERED);
        expect(result.p2Outcome).toBe(CommandOutcome.NO_EFFECT);
      });

      it('リフレクター vs 特殊: 特殊がカウンターされる（対称）', () => {
        const result = resolveCommandInteraction(distance, CommandType.REFLECTOR, CommandType.SPECIAL_ATTACK);
        expect(result.p1Outcome).toBe(CommandOutcome.NO_EFFECT);
        expect(result.p2Outcome).toBe(CommandOutcome.COUNTERED);
      });

      it('リフレクター vs リフレクター: 両者効果なし', () => {
        const result = resolveCommandInteraction(distance, CommandType.REFLECTOR, CommandType.REFLECTOR);
        expect(result.p1Outcome).toBe(CommandOutcome.NO_EFFECT);
        expect(result.p2Outcome).toBe(CommandOutcome.NO_EFFECT);
      });
    });

    describe('戦闘コマンド vs 非戦闘コマンド', () => {
      it('武器 vs スタンス切替: 武器命中', () => {
        const result = resolveCommandInteraction(distance, CommandType.WEAPON_ATTACK, CommandType.STANCE_A);
        expect(result.p1Outcome).toBe(CommandOutcome.HIT);
        expect(result.p2Outcome).toBe(CommandOutcome.NO_EFFECT);
      });

      it('特殊 vs スタンス切替: 特殊命中', () => {
        const result = resolveCommandInteraction(distance, CommandType.SPECIAL_ATTACK, CommandType.STANCE_B);
        expect(result.p1Outcome).toBe(CommandOutcome.HIT);
        expect(result.p2Outcome).toBe(CommandOutcome.NO_EFFECT);
      });

      it('リフレクター vs スタンス切替: 効果なし', () => {
        const result = resolveCommandInteraction(distance, CommandType.REFLECTOR, CommandType.STANCE_A);
        expect(result.p1Outcome).toBe(CommandOutcome.NO_EFFECT);
        expect(result.p2Outcome).toBe(CommandOutcome.NO_EFFECT);
      });
    });

    describe('非戦闘コマンド同士', () => {
      it('前進 vs 後退: 両者効果なし', () => {
        const result = resolveCommandInteraction(distance, CommandType.ADVANCE, CommandType.RETREAT);
        expect(result.p1Outcome).toBe(CommandOutcome.NO_EFFECT);
        expect(result.p2Outcome).toBe(CommandOutcome.NO_EFFECT);
      });

      it('スタンスA vs スタンスB: 両者効果なし', () => {
        const result = resolveCommandInteraction(distance, CommandType.STANCE_A, CommandType.STANCE_B);
        expect(result.p1Outcome).toBe(CommandOutcome.NO_EFFECT);
        expect(result.p2Outcome).toBe(CommandOutcome.NO_EFFECT);
      });
    });
  });

  describe('中距離', () => {
    const distance = DistanceType.MID;

    describe('武器攻撃は届かない', () => {
      it('武器 vs 武器: 両者空振り', () => {
        const result = resolveCommandInteraction(distance, CommandType.WEAPON_ATTACK, CommandType.WEAPON_ATTACK);
        expect(result.p1Outcome).toBe(CommandOutcome.MISS);
        expect(result.p2Outcome).toBe(CommandOutcome.MISS);
      });

      it('武器 vs 特殊: 武器空振り＋特殊命中', () => {
        const result = resolveCommandInteraction(distance, CommandType.WEAPON_ATTACK, CommandType.SPECIAL_ATTACK);
        expect(result.p1Outcome).toBe(CommandOutcome.MISS);
        expect(result.p2Outcome).toBe(CommandOutcome.HIT);
      });

      it('武器 vs リフレクター: 武器空振り', () => {
        const result = resolveCommandInteraction(distance, CommandType.WEAPON_ATTACK, CommandType.REFLECTOR);
        expect(result.p1Outcome).toBe(CommandOutcome.MISS);
        expect(result.p2Outcome).toBe(CommandOutcome.NO_EFFECT);
      });

      it('武器 vs スタンス切替: 武器空振り', () => {
        const result = resolveCommandInteraction(distance, CommandType.WEAPON_ATTACK, CommandType.STANCE_A);
        expect(result.p1Outcome).toBe(CommandOutcome.MISS);
        expect(result.p2Outcome).toBe(CommandOutcome.NO_EFFECT);
      });
    });

    describe('特殊攻撃は全距離で有効', () => {
      it('特殊 vs 特殊: 相打ち', () => {
        const result = resolveCommandInteraction(distance, CommandType.SPECIAL_ATTACK, CommandType.SPECIAL_ATTACK);
        expect(result.p1Outcome).toBe(CommandOutcome.HIT);
        expect(result.p2Outcome).toBe(CommandOutcome.HIT);
      });

      it('特殊 vs リフレクター: カウンター', () => {
        const result = resolveCommandInteraction(distance, CommandType.SPECIAL_ATTACK, CommandType.REFLECTOR);
        expect(result.p1Outcome).toBe(CommandOutcome.COUNTERED);
        expect(result.p2Outcome).toBe(CommandOutcome.NO_EFFECT);
      });

      it('特殊 vs スタンス切替: 特殊命中', () => {
        const result = resolveCommandInteraction(distance, CommandType.SPECIAL_ATTACK, CommandType.STANCE_B);
        expect(result.p1Outcome).toBe(CommandOutcome.HIT);
        expect(result.p2Outcome).toBe(CommandOutcome.NO_EFFECT);
      });
    });
  });

  describe('遠距離', () => {
    const distance = DistanceType.FAR;

    it('武器 vs 特殊: 武器空振り＋特殊命中（中距離と同じ）', () => {
      const result = resolveCommandInteraction(distance, CommandType.WEAPON_ATTACK, CommandType.SPECIAL_ATTACK);
      expect(result.p1Outcome).toBe(CommandOutcome.MISS);
      expect(result.p2Outcome).toBe(CommandOutcome.HIT);
    });

    it('特殊 vs 特殊: 相打ち', () => {
      const result = resolveCommandInteraction(distance, CommandType.SPECIAL_ATTACK, CommandType.SPECIAL_ATTACK);
      expect(result.p1Outcome).toBe(CommandOutcome.HIT);
      expect(result.p2Outcome).toBe(CommandOutcome.HIT);
    });

    it('特殊 vs リフレクター: カウンター', () => {
      const result = resolveCommandInteraction(distance, CommandType.SPECIAL_ATTACK, CommandType.REFLECTOR);
      expect(result.p1Outcome).toBe(CommandOutcome.COUNTERED);
      expect(result.p2Outcome).toBe(CommandOutcome.NO_EFFECT);
    });

    it('武器 vs 武器: 両者空振り', () => {
      const result = resolveCommandInteraction(distance, CommandType.WEAPON_ATTACK, CommandType.WEAPON_ATTACK);
      expect(result.p1Outcome).toBe(CommandOutcome.MISS);
      expect(result.p2Outcome).toBe(CommandOutcome.MISS);
    });

    it('武器 vs リフレクター: 武器空振り', () => {
      const result = resolveCommandInteraction(distance, CommandType.WEAPON_ATTACK, CommandType.REFLECTOR);
      expect(result.p1Outcome).toBe(CommandOutcome.MISS);
      expect(result.p2Outcome).toBe(CommandOutcome.NO_EFFECT);
    });
  });

  describe('対称性の検証', () => {
    it('P1とP2を入れ替えても結果が対称', () => {
      // 近距離: 武器 vs 特殊
      const r1 = resolveCommandInteraction(DistanceType.NEAR, CommandType.WEAPON_ATTACK, CommandType.SPECIAL_ATTACK);
      const r2 = resolveCommandInteraction(DistanceType.NEAR, CommandType.SPECIAL_ATTACK, CommandType.WEAPON_ATTACK);
      expect(r1.p1Outcome).toBe(r2.p2Outcome);
      expect(r1.p2Outcome).toBe(r2.p1Outcome);
    });

    it('中距離でも対称性が保たれる', () => {
      const r1 = resolveCommandInteraction(DistanceType.MID, CommandType.WEAPON_ATTACK, CommandType.SPECIAL_ATTACK);
      const r2 = resolveCommandInteraction(DistanceType.MID, CommandType.SPECIAL_ATTACK, CommandType.WEAPON_ATTACK);
      expect(r1.p1Outcome).toBe(r2.p2Outcome);
      expect(r1.p2Outcome).toBe(r2.p1Outcome);
    });
  });
});
