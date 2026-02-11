import { SPECIES_TENDENCIES, getTendencyBySpecies } from '../../ai/tendencies';
import { CommandType } from '../../types';

describe('SPECIES_TENDENCIES', () => {
  const ALL_SPECIES_IDS = ['zaag', 'gardan', 'roona', 'zephyr', 'balga', 'morsu', 'graon', 'igna'];
  const ALL_COMMAND_TYPES = Object.values(CommandType);

  describe('全魂格のデータが存在する', () => {
    it.each(ALL_SPECIES_IDS)('%s の傾向データが存在する', (speciesId) => {
      expect(SPECIES_TENDENCIES[speciesId]).toBeDefined();
    });

    it('8種族すべてのデータが揃っている', () => {
      expect(Object.keys(SPECIES_TENDENCIES)).toHaveLength(8);
    });
  });

  describe('各傾向データが全コマンドタイプの重みを持つ', () => {
    it.each(ALL_SPECIES_IDS)('%s は7つのコマンドタイプの重みを持つ', (speciesId) => {
      const tendency = SPECIES_TENDENCIES[speciesId];
      for (const cmdType of ALL_COMMAND_TYPES) {
        expect(tendency[cmdType]).toBeDefined();
        expect(typeof tendency[cmdType]).toBe('number');
        expect(tendency[cmdType]).toBeGreaterThan(0);
      }
    });
  });

  describe('種族別傾向が仕様に準拠', () => {
    it('gardan (ゴーレム): 前進＋武器攻撃の重みが高い', () => {
      const t = SPECIES_TENDENCIES['gardan'];
      const baseWeight = 1.0;
      expect(t[CommandType.ADVANCE]).toBeGreaterThan(baseWeight);
      expect(t[CommandType.WEAPON_ATTACK]).toBeGreaterThan(baseWeight);
    });

    it('morsu (トレント): 守勢＋距離維持（後退）の重みが高い', () => {
      const t = SPECIES_TENDENCIES['morsu'];
      const baseWeight = 1.0;
      expect(t[CommandType.RETREAT]).toBeGreaterThan(baseWeight);
      // 守勢への切替（STANCE_B = 通常から守勢）
      expect(t[CommandType.STANCE_B]).toBeGreaterThan(baseWeight);
    });

    it('roona (ウィスプ): 後退＋特殊攻撃の重みが高い', () => {
      const t = SPECIES_TENDENCIES['roona'];
      const baseWeight = 1.0;
      expect(t[CommandType.RETREAT]).toBeGreaterThan(baseWeight);
      expect(t[CommandType.SPECIAL_ATTACK]).toBeGreaterThan(baseWeight);
    });

    it('balga (大亀): 守勢＋リフレクターの重みが高い', () => {
      const t = SPECIES_TENDENCIES['balga'];
      const baseWeight = 1.0;
      expect(t[CommandType.REFLECTOR]).toBeGreaterThan(baseWeight);
      expect(t[CommandType.STANCE_B]).toBeGreaterThan(baseWeight);
    });

    it('zephyr (ワイバーン): バランス型でスタンス切替活用', () => {
      const t = SPECIES_TENDENCIES['zephyr'];
      const baseWeight = 1.0;
      expect(t[CommandType.STANCE_A]).toBeGreaterThan(baseWeight);
      expect(t[CommandType.STANCE_B]).toBeGreaterThan(baseWeight);
    });

    it('graon (ミノタウロス): 攻勢＋前進＋武器攻撃の重みが高い', () => {
      const t = SPECIES_TENDENCIES['graon'];
      const baseWeight = 1.0;
      expect(t[CommandType.ADVANCE]).toBeGreaterThan(baseWeight);
      expect(t[CommandType.WEAPON_ATTACK]).toBeGreaterThan(baseWeight);
      // 攻勢への切替（STANCE_A = 通常から攻勢）
      expect(t[CommandType.STANCE_A]).toBeGreaterThan(baseWeight);
    });

    it('igna (フェニックス): 後退＋特殊攻撃の重みが非常に高い', () => {
      const t = SPECIES_TENDENCIES['igna'];
      const baseWeight = 1.0;
      expect(t[CommandType.RETREAT]).toBeGreaterThan(baseWeight);
      expect(t[CommandType.SPECIAL_ATTACK]).toBeGreaterThan(baseWeight);
      // 特殊攻撃がウィスプ以上
      expect(t[CommandType.SPECIAL_ATTACK]).toBeGreaterThanOrEqual(
        SPECIES_TENDENCIES['roona'][CommandType.SPECIAL_ATTACK]
      );
    });

    it('zaag (剣士): バランス型（全体的に均等）', () => {
      const t = SPECIES_TENDENCIES['zaag'];
      const weights = Object.values(t) as number[];
      const max = Math.max(...weights);
      const min = Math.min(...weights);
      // バランス型なので重みの差が小さい
      expect(max - min).toBeLessThanOrEqual(0.5);
    });
  });
});

describe('getTendencyBySpecies', () => {
  it('種族IDから傾向データを取得できる', () => {
    const tendency = getTendencyBySpecies('gardan');
    expect(tendency).toEqual(SPECIES_TENDENCIES['gardan']);
  });

  it('存在しない種族IDでデフォルト（バランス）傾向を返す', () => {
    const tendency = getTendencyBySpecies('unknown');
    const weights = Object.values(tendency);
    // デフォルトはすべて同じ重み
    expect(new Set(weights).size).toBe(1);
  });
});
