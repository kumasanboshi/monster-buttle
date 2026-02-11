import { CommandType, StanceType } from '../../types';
import { isStanceCommand, resolveStanceForTurn } from '../../battle/stance';

describe('isStanceCommand', () => {
  it('STANCE_Aはスタンスコマンド', () => {
    expect(isStanceCommand(CommandType.STANCE_A)).toBe(true);
  });

  it('STANCE_Bはスタンスコマンド', () => {
    expect(isStanceCommand(CommandType.STANCE_B)).toBe(true);
  });

  it('前進はスタンスコマンドではない', () => {
    expect(isStanceCommand(CommandType.ADVANCE)).toBe(false);
  });

  it('後退はスタンスコマンドではない', () => {
    expect(isStanceCommand(CommandType.RETREAT)).toBe(false);
  });

  it('武器攻撃はスタンスコマンドではない', () => {
    expect(isStanceCommand(CommandType.WEAPON_ATTACK)).toBe(false);
  });

  it('特殊攻撃はスタンスコマンドではない', () => {
    expect(isStanceCommand(CommandType.SPECIAL_ATTACK)).toBe(false);
  });

  it('リフレクターはスタンスコマンドではない', () => {
    expect(isStanceCommand(CommandType.REFLECTOR)).toBe(false);
  });
});

describe('resolveStanceForTurn', () => {
  describe('1stコマンドでのスタンス変更', () => {
    it('通常→STANCE_A→攻勢', () => {
      const result = resolveStanceForTurn(
        StanceType.NORMAL,
        { first: { type: CommandType.STANCE_A }, second: { type: CommandType.WEAPON_ATTACK } }
      );
      expect(result.afterFirst).toBe(StanceType.OFFENSIVE);
      expect(result.afterSecond).toBe(StanceType.OFFENSIVE);
    });

    it('通常→STANCE_B→守勢', () => {
      const result = resolveStanceForTurn(
        StanceType.NORMAL,
        { first: { type: CommandType.STANCE_B }, second: { type: CommandType.WEAPON_ATTACK } }
      );
      expect(result.afterFirst).toBe(StanceType.DEFENSIVE);
      expect(result.afterSecond).toBe(StanceType.DEFENSIVE);
    });

    it('攻勢→STANCE_A→通常', () => {
      const result = resolveStanceForTurn(
        StanceType.OFFENSIVE,
        { first: { type: CommandType.STANCE_A }, second: { type: CommandType.WEAPON_ATTACK } }
      );
      expect(result.afterFirst).toBe(StanceType.NORMAL);
      expect(result.afterSecond).toBe(StanceType.NORMAL);
    });

    it('守勢→STANCE_B→攻勢', () => {
      const result = resolveStanceForTurn(
        StanceType.DEFENSIVE,
        { first: { type: CommandType.STANCE_B }, second: { type: CommandType.WEAPON_ATTACK } }
      );
      expect(result.afterFirst).toBe(StanceType.OFFENSIVE);
      expect(result.afterSecond).toBe(StanceType.OFFENSIVE);
    });
  });

  describe('2ndコマンドでのスタンス変更', () => {
    it('通常→非スタンス→STANCE_A→攻勢', () => {
      const result = resolveStanceForTurn(
        StanceType.NORMAL,
        { first: { type: CommandType.WEAPON_ATTACK }, second: { type: CommandType.STANCE_A } }
      );
      expect(result.afterFirst).toBe(StanceType.NORMAL);
      expect(result.afterSecond).toBe(StanceType.OFFENSIVE);
    });

    it('攻勢→非スタンス→STANCE_B→守勢', () => {
      const result = resolveStanceForTurn(
        StanceType.OFFENSIVE,
        { first: { type: CommandType.WEAPON_ATTACK }, second: { type: CommandType.STANCE_B } }
      );
      expect(result.afterFirst).toBe(StanceType.OFFENSIVE);
      expect(result.afterSecond).toBe(StanceType.DEFENSIVE);
    });
  });

  describe('両コマンドでスタンス変更', () => {
    it('通常→STANCE_A(攻勢)→STANCE_B(守勢)', () => {
      const result = resolveStanceForTurn(
        StanceType.NORMAL,
        { first: { type: CommandType.STANCE_A }, second: { type: CommandType.STANCE_B } }
      );
      expect(result.afterFirst).toBe(StanceType.OFFENSIVE);
      expect(result.afterSecond).toBe(StanceType.DEFENSIVE);
    });

    it('通常→STANCE_B(守勢)→STANCE_A(通常)', () => {
      const result = resolveStanceForTurn(
        StanceType.NORMAL,
        { first: { type: CommandType.STANCE_B }, second: { type: CommandType.STANCE_A } }
      );
      expect(result.afterFirst).toBe(StanceType.DEFENSIVE);
      expect(result.afterSecond).toBe(StanceType.NORMAL);
    });

    it('攻勢→STANCE_A(通常)→STANCE_A(攻勢)', () => {
      const result = resolveStanceForTurn(
        StanceType.OFFENSIVE,
        { first: { type: CommandType.STANCE_A }, second: { type: CommandType.STANCE_A } }
      );
      expect(result.afterFirst).toBe(StanceType.NORMAL);
      expect(result.afterSecond).toBe(StanceType.OFFENSIVE);
    });
  });

  describe('スタンスコマンドなし', () => {
    it('通常のまま変化なし', () => {
      const result = resolveStanceForTurn(
        StanceType.NORMAL,
        { first: { type: CommandType.WEAPON_ATTACK }, second: { type: CommandType.ADVANCE } }
      );
      expect(result.afterFirst).toBe(StanceType.NORMAL);
      expect(result.afterSecond).toBe(StanceType.NORMAL);
    });

    it('攻勢のまま変化なし', () => {
      const result = resolveStanceForTurn(
        StanceType.OFFENSIVE,
        { first: { type: CommandType.SPECIAL_ATTACK }, second: { type: CommandType.REFLECTOR } }
      );
      expect(result.afterFirst).toBe(StanceType.OFFENSIVE);
      expect(result.afterSecond).toBe(StanceType.OFFENSIVE);
    });

    it('守勢のまま変化なし', () => {
      const result = resolveStanceForTurn(
        StanceType.DEFENSIVE,
        { first: { type: CommandType.RETREAT }, second: { type: CommandType.REFLECTOR } }
      );
      expect(result.afterFirst).toBe(StanceType.DEFENSIVE);
      expect(result.afterSecond).toBe(StanceType.DEFENSIVE);
    });
  });
});
