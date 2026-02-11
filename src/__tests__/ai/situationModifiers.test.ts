import {
  getHpModifiers,
  getStanceResponseModifiers,
  getReflectorModifiers,
} from '../../ai/situationModifiers';
import { CommandType, StanceType } from '../../types';

describe('getHpModifiers', () => {
  describe('自分HP高い + 相手HP高い（ニュートラル）', () => {
    it('全コマンドがほぼ基準値（1.0）', () => {
      const mods = getHpModifiers(0.8, 0.8);
      for (const cmd of Object.values(CommandType)) {
        expect(mods[cmd]).toBeGreaterThanOrEqual(0.8);
        expect(mods[cmd]).toBeLessThanOrEqual(1.2);
      }
    });
  });

  describe('自分HP低い → 守備的', () => {
    it('RETREATの重みが上がる', () => {
      const mods = getHpModifiers(0.2, 0.8);
      expect(mods[CommandType.RETREAT]).toBeGreaterThan(1.0);
    });

    it('REFLECTORの重みが上がる', () => {
      const mods = getHpModifiers(0.2, 0.8);
      expect(mods[CommandType.REFLECTOR]).toBeGreaterThan(1.0);
    });

    it('ADVANCEの重みが下がる', () => {
      const mods = getHpModifiers(0.2, 0.8);
      expect(mods[CommandType.ADVANCE]).toBeLessThan(1.0);
    });
  });

  describe('相手HP低い → 攻撃的', () => {
    it('WEAPON_ATTACKの重みが上がる', () => {
      const mods = getHpModifiers(0.8, 0.2);
      expect(mods[CommandType.WEAPON_ATTACK]).toBeGreaterThan(1.0);
    });

    it('SPECIAL_ATTACKの重みが上がる', () => {
      const mods = getHpModifiers(0.8, 0.2);
      expect(mods[CommandType.SPECIAL_ATTACK]).toBeGreaterThan(1.0);
    });

    it('ADVANCEの重みが上がる（追い詰める）', () => {
      const mods = getHpModifiers(0.8, 0.2);
      expect(mods[CommandType.ADVANCE]).toBeGreaterThan(1.0);
    });
  });

  describe('両方HP低い → 攻守バランス', () => {
    it('攻撃系と防御系が両方影響を受ける', () => {
      const mods = getHpModifiers(0.2, 0.2);
      // 攻撃ブーストと防御ブーストが相殺する方向
      // RETREAT は自分HP低いのでブースト
      expect(mods[CommandType.RETREAT]).toBeGreaterThan(1.0);
      // WEAPON_ATTACK は相手HP低いのでブースト
      expect(mods[CommandType.WEAPON_ATTACK]).toBeGreaterThan(1.0);
    });
  });

  describe('全モディファイアは正の値', () => {
    it('任意のHP割合で全コマンドが正の値', () => {
      const ratios = [0.0, 0.1, 0.3, 0.5, 0.7, 1.0];
      for (const ownHp of ratios) {
        for (const oppHp of ratios) {
          const mods = getHpModifiers(ownHp, oppHp);
          for (const cmd of Object.values(CommandType)) {
            expect(mods[cmd]).toBeGreaterThan(0);
          }
        }
      }
    });
  });
});

describe('getStanceResponseModifiers', () => {
  describe('相手OFFENSIVE → 守備的に対応', () => {
    it('REFLECTORの重みが上がる', () => {
      const mods = getStanceResponseModifiers(StanceType.NORMAL, StanceType.OFFENSIVE);
      expect(mods[CommandType.REFLECTOR]).toBeGreaterThan(1.0);
    });

    it('NORMAL状態: STANCE_B（→守勢）の重みが上がる', () => {
      const mods = getStanceResponseModifiers(StanceType.NORMAL, StanceType.OFFENSIVE);
      expect(mods[CommandType.STANCE_B]).toBeGreaterThan(1.0);
    });

    it('既にDEFENSIVE状態: スタンス変更の重みは低い（維持したい）', () => {
      const mods = getStanceResponseModifiers(StanceType.DEFENSIVE, StanceType.OFFENSIVE);
      // DEFENSIVE → STANCE_A=NORMAL, STANCE_B=OFFENSIVE、どちらも望ましくない
      expect(mods[CommandType.STANCE_A]).toBeLessThanOrEqual(1.0);
      expect(mods[CommandType.STANCE_B]).toBeLessThanOrEqual(1.0);
    });
  });

  describe('相手DEFENSIVE → 攻撃的に対応', () => {
    it('WEAPON_ATTACKの重みが上がる', () => {
      const mods = getStanceResponseModifiers(StanceType.NORMAL, StanceType.DEFENSIVE);
      expect(mods[CommandType.WEAPON_ATTACK]).toBeGreaterThan(1.0);
    });

    it('SPECIAL_ATTACKの重みが上がる', () => {
      const mods = getStanceResponseModifiers(StanceType.NORMAL, StanceType.DEFENSIVE);
      expect(mods[CommandType.SPECIAL_ATTACK]).toBeGreaterThan(1.0);
    });

    it('NORMAL状態: STANCE_A（→攻勢）の重みが上がる', () => {
      const mods = getStanceResponseModifiers(StanceType.NORMAL, StanceType.DEFENSIVE);
      expect(mods[CommandType.STANCE_A]).toBeGreaterThan(1.0);
    });
  });

  describe('相手NORMAL → ニュートラル', () => {
    it('全コマンドがほぼ基準値', () => {
      const mods = getStanceResponseModifiers(StanceType.NORMAL, StanceType.NORMAL);
      for (const cmd of Object.values(CommandType)) {
        expect(mods[cmd]).toBeGreaterThanOrEqual(0.9);
        expect(mods[cmd]).toBeLessThanOrEqual(1.1);
      }
    });
  });

  describe('全モディファイアは正の値', () => {
    it('全スタンス組み合わせで正の値', () => {
      const stances = [StanceType.NORMAL, StanceType.OFFENSIVE, StanceType.DEFENSIVE];
      for (const own of stances) {
        for (const opp of stances) {
          const mods = getStanceResponseModifiers(own, opp);
          for (const cmd of Object.values(CommandType)) {
            expect(mods[cmd]).toBeGreaterThan(0);
          }
        }
      }
    });
  });
});

describe('getReflectorModifiers', () => {
  describe('相手リフレクター残りあり → 特殊攻撃抑制', () => {
    it('SPECIAL_ATTACKの重みが下がる', () => {
      const mods = getReflectorModifiers(2);
      expect(mods[CommandType.SPECIAL_ATTACK]).toBeLessThan(1.0);
    });

    it('WEAPON_ATTACKの重みが上がる（代替攻撃手段）', () => {
      const mods = getReflectorModifiers(2);
      expect(mods[CommandType.WEAPON_ATTACK]).toBeGreaterThan(1.0);
    });
  });

  describe('相手リフレクター残り0 → 特殊攻撃増加', () => {
    it('SPECIAL_ATTACKの重みが上がる', () => {
      const mods = getReflectorModifiers(0);
      expect(mods[CommandType.SPECIAL_ATTACK]).toBeGreaterThan(1.0);
    });
  });

  describe('相手リフレクター残り1 → 中程度の抑制', () => {
    it('残り2より抑制が弱い', () => {
      const mods1 = getReflectorModifiers(1);
      const mods2 = getReflectorModifiers(2);
      expect(mods1[CommandType.SPECIAL_ATTACK]).toBeGreaterThan(mods2[CommandType.SPECIAL_ATTACK]);
    });
  });

  describe('全モディファイアは正の値', () => {
    it('任意のリフレクター残数で正の値', () => {
      for (let remaining = 0; remaining <= 3; remaining++) {
        const mods = getReflectorModifiers(remaining);
        for (const cmd of Object.values(CommandType)) {
          expect(mods[cmd]).toBeGreaterThan(0);
        }
      }
    });
  });
});
