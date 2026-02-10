import { CommandType, DistanceType } from '../../types';
import { isMovementCommand, resolveDistanceForTurn } from '../../battle/distance';

describe('isMovementCommand', () => {
  it('前進は移動コマンド', () => {
    expect(isMovementCommand(CommandType.ADVANCE)).toBe(true);
  });

  it('後退は移動コマンド', () => {
    expect(isMovementCommand(CommandType.RETREAT)).toBe(true);
  });

  it('武器攻撃は移動コマンドではない', () => {
    expect(isMovementCommand(CommandType.WEAPON_ATTACK)).toBe(false);
  });

  it('特殊攻撃は移動コマンドではない', () => {
    expect(isMovementCommand(CommandType.SPECIAL_ATTACK)).toBe(false);
  });

  it('リフレクターは移動コマンドではない', () => {
    expect(isMovementCommand(CommandType.REFLECTOR)).toBe(false);
  });

  it('スタンスAは移動コマンドではない', () => {
    expect(isMovementCommand(CommandType.STANCE_A)).toBe(false);
  });

  it('スタンスBは移動コマンドではない', () => {
    expect(isMovementCommand(CommandType.STANCE_B)).toBe(false);
  });
});

describe('resolveDistanceForTurn', () => {
  // TCBの距離解決: 1stコマンドで距離変動→2ndコマンドは新距離で処理

  describe('1stコマンドの距離変動', () => {
    it('双方前進: 中距離→近距離', () => {
      const result = resolveDistanceForTurn(
        DistanceType.MID,
        { first: { type: CommandType.ADVANCE }, second: { type: CommandType.WEAPON_ATTACK } },
        { first: { type: CommandType.ADVANCE }, second: { type: CommandType.WEAPON_ATTACK } }
      );
      expect(result.afterFirst).toBe(DistanceType.NEAR);
    });

    it('双方後退: 中距離→遠距離', () => {
      const result = resolveDistanceForTurn(
        DistanceType.MID,
        { first: { type: CommandType.RETREAT }, second: { type: CommandType.WEAPON_ATTACK } },
        { first: { type: CommandType.RETREAT }, second: { type: CommandType.WEAPON_ATTACK } }
      );
      expect(result.afterFirst).toBe(DistanceType.FAR);
    });

    it('前進vs後退: 中距離→中距離（相殺）', () => {
      const result = resolveDistanceForTurn(
        DistanceType.MID,
        { first: { type: CommandType.ADVANCE }, second: { type: CommandType.WEAPON_ATTACK } },
        { first: { type: CommandType.RETREAT }, second: { type: CommandType.WEAPON_ATTACK } }
      );
      expect(result.afterFirst).toBe(DistanceType.MID);
    });

    it('P1前進のみ: 中距離→近距離', () => {
      const result = resolveDistanceForTurn(
        DistanceType.MID,
        { first: { type: CommandType.ADVANCE }, second: { type: CommandType.WEAPON_ATTACK } },
        { first: { type: CommandType.WEAPON_ATTACK }, second: { type: CommandType.WEAPON_ATTACK } }
      );
      expect(result.afterFirst).toBe(DistanceType.NEAR);
    });

    it('非移動コマンド同士: 距離変化なし', () => {
      const result = resolveDistanceForTurn(
        DistanceType.MID,
        { first: { type: CommandType.WEAPON_ATTACK }, second: { type: CommandType.RETREAT } },
        { first: { type: CommandType.SPECIAL_ATTACK }, second: { type: CommandType.ADVANCE } }
      );
      expect(result.afterFirst).toBe(DistanceType.MID);
    });
  });

  describe('2ndコマンドの距離変動（1st結果からの連続処理）', () => {
    it('1st: 双方前進(中→近), 2nd: 双方後退(近→中)', () => {
      const result = resolveDistanceForTurn(
        DistanceType.MID,
        { first: { type: CommandType.ADVANCE }, second: { type: CommandType.RETREAT } },
        { first: { type: CommandType.ADVANCE }, second: { type: CommandType.RETREAT } }
      );
      expect(result.afterFirst).toBe(DistanceType.NEAR);
      expect(result.afterSecond).toBe(DistanceType.FAR);
    });

    it('1st: 双方後退(中→遠), 2nd: 双方前進(遠→近)', () => {
      const result = resolveDistanceForTurn(
        DistanceType.MID,
        { first: { type: CommandType.RETREAT }, second: { type: CommandType.ADVANCE } },
        { first: { type: CommandType.RETREAT }, second: { type: CommandType.ADVANCE } }
      );
      expect(result.afterFirst).toBe(DistanceType.FAR);
      expect(result.afterSecond).toBe(DistanceType.NEAR);
    });

    it('1st: 移動なし, 2nd: P1前進(中→近)', () => {
      const result = resolveDistanceForTurn(
        DistanceType.MID,
        { first: { type: CommandType.WEAPON_ATTACK }, second: { type: CommandType.ADVANCE } },
        { first: { type: CommandType.WEAPON_ATTACK }, second: { type: CommandType.WEAPON_ATTACK } }
      );
      expect(result.afterFirst).toBe(DistanceType.MID);
      expect(result.afterSecond).toBe(DistanceType.NEAR);
    });

    it('2ndも非移動: 1stの距離を維持', () => {
      const result = resolveDistanceForTurn(
        DistanceType.FAR,
        { first: { type: CommandType.SPECIAL_ATTACK }, second: { type: CommandType.REFLECTOR } },
        { first: { type: CommandType.SPECIAL_ATTACK }, second: { type: CommandType.STANCE_A } }
      );
      expect(result.afterFirst).toBe(DistanceType.FAR);
      expect(result.afterSecond).toBe(DistanceType.FAR);
    });
  });

  describe('境界値テスト', () => {
    it('近距離で双方前進: 近距離のまま', () => {
      const result = resolveDistanceForTurn(
        DistanceType.NEAR,
        { first: { type: CommandType.ADVANCE }, second: { type: CommandType.ADVANCE } },
        { first: { type: CommandType.ADVANCE }, second: { type: CommandType.ADVANCE } }
      );
      expect(result.afterFirst).toBe(DistanceType.NEAR);
      expect(result.afterSecond).toBe(DistanceType.NEAR);
    });

    it('遠距離で双方後退: 遠距離のまま', () => {
      const result = resolveDistanceForTurn(
        DistanceType.FAR,
        { first: { type: CommandType.RETREAT }, second: { type: CommandType.RETREAT } },
        { first: { type: CommandType.RETREAT }, second: { type: CommandType.RETREAT } }
      );
      expect(result.afterFirst).toBe(DistanceType.FAR);
      expect(result.afterSecond).toBe(DistanceType.FAR);
    });

    it('遠距離で双方前進: 遠→近(2段階)', () => {
      const result = resolveDistanceForTurn(
        DistanceType.FAR,
        { first: { type: CommandType.ADVANCE }, second: { type: CommandType.WEAPON_ATTACK } },
        { first: { type: CommandType.ADVANCE }, second: { type: CommandType.WEAPON_ATTACK } }
      );
      expect(result.afterFirst).toBe(DistanceType.NEAR);
    });

    it('近距離で双方後退: 近→遠(2段階)', () => {
      const result = resolveDistanceForTurn(
        DistanceType.NEAR,
        { first: { type: CommandType.RETREAT }, second: { type: CommandType.WEAPON_ATTACK } },
        { first: { type: CommandType.RETREAT }, second: { type: CommandType.WEAPON_ATTACK } }
      );
      expect(result.afterFirst).toBe(DistanceType.FAR);
    });
  });
});
