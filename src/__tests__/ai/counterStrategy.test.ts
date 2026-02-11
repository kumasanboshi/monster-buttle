import { getCounterModifiers } from '../../ai/counterStrategy';
import { CommandType, DistanceType } from '../../types';

describe('getCounterModifiers', () => {
  describe('近距離でのカウンター', () => {
    it('WEAPON_ATTACK多用に対してRETREATの重みが上がる', () => {
      const mods = getCounterModifiers(CommandType.WEAPON_ATTACK, DistanceType.NEAR);
      expect(mods[CommandType.RETREAT]).toBeGreaterThan(1.0);
    });

    it('SPECIAL_ATTACK多用に対してREFLECTORの重みが上がる', () => {
      const mods = getCounterModifiers(CommandType.SPECIAL_ATTACK, DistanceType.NEAR);
      expect(mods[CommandType.REFLECTOR]).toBeGreaterThan(1.0);
    });

    it('SPECIAL_ATTACK多用に対してWEAPON_ATTACKの重みが上がる（潰す）', () => {
      const mods = getCounterModifiers(CommandType.SPECIAL_ATTACK, DistanceType.NEAR);
      expect(mods[CommandType.WEAPON_ATTACK]).toBeGreaterThan(1.0);
    });

    it('ADVANCE多用に対してRETREATの重みが上がる', () => {
      const mods = getCounterModifiers(CommandType.ADVANCE, DistanceType.NEAR);
      expect(mods[CommandType.RETREAT]).toBeGreaterThan(1.0);
    });

    it('RETREAT多用に対してADVANCEの重みが上がる', () => {
      const mods = getCounterModifiers(CommandType.RETREAT, DistanceType.NEAR);
      expect(mods[CommandType.ADVANCE]).toBeGreaterThan(1.0);
    });

    it('REFLECTOR多用に対してWEAPON_ATTACKの重みが上がる（貫通）', () => {
      const mods = getCounterModifiers(CommandType.REFLECTOR, DistanceType.NEAR);
      expect(mods[CommandType.WEAPON_ATTACK]).toBeGreaterThan(1.0);
    });

    it('STANCE_A多用に対して攻撃系の重みが上がる', () => {
      const mods = getCounterModifiers(CommandType.STANCE_A, DistanceType.NEAR);
      expect(mods[CommandType.WEAPON_ATTACK]).toBeGreaterThan(1.0);
    });

    it('STANCE_B多用に対して攻撃系の重みが上がる', () => {
      const mods = getCounterModifiers(CommandType.STANCE_B, DistanceType.NEAR);
      expect(mods[CommandType.WEAPON_ATTACK]).toBeGreaterThan(1.0);
    });
  });

  describe('中距離でのカウンター', () => {
    it('SPECIAL_ATTACK多用に対してREFLECTORの重みが上がる', () => {
      const mods = getCounterModifiers(CommandType.SPECIAL_ATTACK, DistanceType.MID);
      expect(mods[CommandType.REFLECTOR]).toBeGreaterThan(1.0);
    });

    it('ADVANCE多用に対してRETREATの重みが上がる', () => {
      const mods = getCounterModifiers(CommandType.ADVANCE, DistanceType.MID);
      expect(mods[CommandType.RETREAT]).toBeGreaterThan(1.0);
    });

    it('RETREAT多用に対してADVANCEの重みが上がる', () => {
      const mods = getCounterModifiers(CommandType.RETREAT, DistanceType.MID);
      expect(mods[CommandType.ADVANCE]).toBeGreaterThan(1.0);
    });

    it('REFLECTOR多用に対してADVANCEの重みが上がる（武器距離へ）', () => {
      const mods = getCounterModifiers(CommandType.REFLECTOR, DistanceType.MID);
      expect(mods[CommandType.ADVANCE]).toBeGreaterThan(1.0);
    });
  });

  describe('遠距離でのカウンター', () => {
    it('SPECIAL_ATTACK多用に対してREFLECTORの重みが上がる', () => {
      const mods = getCounterModifiers(CommandType.SPECIAL_ATTACK, DistanceType.FAR);
      expect(mods[CommandType.REFLECTOR]).toBeGreaterThan(1.0);
    });

    it('ADVANCE多用に対してRETREATの重みが上がる', () => {
      const mods = getCounterModifiers(CommandType.ADVANCE, DistanceType.FAR);
      expect(mods[CommandType.RETREAT]).toBeGreaterThan(1.0);
    });

    it('RETREAT多用に対してADVANCEの重みが上がる', () => {
      const mods = getCounterModifiers(CommandType.RETREAT, DistanceType.FAR);
      expect(mods[CommandType.ADVANCE]).toBeGreaterThan(1.0);
    });

    it('REFLECTOR多用に対してADVANCEの重みが上がる', () => {
      const mods = getCounterModifiers(CommandType.REFLECTOR, DistanceType.FAR);
      expect(mods[CommandType.ADVANCE]).toBeGreaterThan(1.0);
    });
  });

  describe('モディファイアの妥当性', () => {
    it('すべてのモディファイアが正の値である', () => {
      const commands = Object.values(CommandType);
      const distances = [DistanceType.NEAR, DistanceType.MID, DistanceType.FAR];

      for (const targetCmd of commands) {
        for (const dist of distances) {
          const mods = getCounterModifiers(targetCmd, dist);
          for (const cmd of commands) {
            expect(mods[cmd]).toBeGreaterThan(0);
          }
        }
      }
    });

    it('カウンターでないコマンドの重みは1.0（中立）', () => {
      // WEAPON_ATTACK多用に対して、カウンターでないコマンド（例: STANCE_A）は1.0
      const mods = getCounterModifiers(CommandType.WEAPON_ATTACK, DistanceType.NEAR);
      // STANCEはカウンター対象でないので1.0のまま
      expect(mods[CommandType.STANCE_A]).toBe(1.0);
      expect(mods[CommandType.STANCE_B]).toBe(1.0);
    });
  });
});
