import { GameMode } from '../../types/GameMode';

describe('GameMode', () => {
  it('挑戦モードが定義されていること', () => {
    expect(GameMode.CHALLENGE).toBe('CHALLENGE');
  });

  it('自由対戦（CPU）モードが定義されていること', () => {
    expect(GameMode.FREE_CPU).toBe('FREE_CPU');
  });

  it('自由対戦（ローカル）モードが定義されていること', () => {
    expect(GameMode.FREE_LOCAL).toBe('FREE_LOCAL');
  });

  it('オンライン対戦モードが定義されていること', () => {
    expect(GameMode.ONLINE).toBe('ONLINE');
  });

  it('4種類のモードが定義されていること', () => {
    const modes = Object.values(GameMode);
    expect(modes).toHaveLength(4);
  });

  it('すべてのモードが一意であること', () => {
    const values = Object.values(GameMode);
    const uniqueValues = new Set(values);
    expect(uniqueValues.size).toBe(values.length);
  });
});
