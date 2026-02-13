import {
  analyzePlayerPattern,
  getMostFrequentCommand,
  DistanceCommandFrequency,
} from '../../ai/patternAnalyzer';
import { CommandType, DistanceType, TurnResult, StanceType } from '../../types';

/**
 * テスト用TurnResultヘルパー
 */
function makeTurnResult(
  turnNumber: number,
  p1First: CommandType,
  p1Second: CommandType,
  p2First: CommandType,
  p2Second: CommandType,
  distanceAfter: DistanceType
): TurnResult {
  const noDamage = { damage: 0, isEvaded: false, isReflected: false };
  return {
    turnNumber,
    player1Commands: { first: { type: p1First }, second: { type: p1Second } },
    player2Commands: { first: { type: p2First }, second: { type: p2Second } },
    distanceAfter,
    player1Damage: noDamage,
    player2Damage: noDamage,
    player1StanceAfter: StanceType.NORMAL,
    player2StanceAfter: StanceType.NORMAL,
    phases: [
      { player1Command: p1First, player2Command: p2First, distanceAfter, player1Damage: noDamage, player2Damage: noDamage },
      { player1Command: p1Second, player2Command: p2Second, distanceAfter, player1Damage: noDamage, player2Damage: noDamage },
    ],
  };
}

describe('analyzePlayerPattern', () => {
  describe('基本動作', () => {
    it('履歴が空の場合、全距離で空のマップを返す', () => {
      const result = analyzePlayerPattern([], 'player1');
      expect(result[DistanceType.NEAR]).toEqual({});
      expect(result[DistanceType.MID]).toEqual({});
      expect(result[DistanceType.FAR]).toEqual({});
    });

    it('履歴が1ターンのみの場合、そのターンを集計する', () => {
      // ターン1: distanceAfter=MID（開始距離が不明なので分析対象外）
      // 単独ターンではdistanceBeforeを導出できないため空になる
      const history = [
        makeTurnResult(1, CommandType.ADVANCE, CommandType.WEAPON_ATTACK,
          CommandType.RETREAT, CommandType.SPECIAL_ATTACK, DistanceType.MID),
      ];
      const result = analyzePlayerPattern(history, 'player1');
      // 最初のターンはdistanceBefore不明のためスキップ
      expect(result[DistanceType.NEAR]).toEqual({});
      expect(result[DistanceType.MID]).toEqual({});
      expect(result[DistanceType.FAR]).toEqual({});
    });

    it('直近3ターンを正しく集計する', () => {
      const history = [
        // ターン1: distanceAfter=NEAR（distanceBefore不明→スキップ）
        makeTurnResult(1, CommandType.ADVANCE, CommandType.ADVANCE,
          CommandType.ADVANCE, CommandType.ADVANCE, DistanceType.NEAR),
        // ターン2: distanceBefore=NEAR, distanceAfter=MID
        makeTurnResult(2, CommandType.WEAPON_ATTACK, CommandType.WEAPON_ATTACK,
          CommandType.RETREAT, CommandType.SPECIAL_ATTACK, DistanceType.MID),
        // ターン3: distanceBefore=MID, distanceAfter=FAR
        makeTurnResult(3, CommandType.SPECIAL_ATTACK, CommandType.REFLECTOR,
          CommandType.RETREAT, CommandType.RETREAT, DistanceType.FAR),
      ];

      const result = analyzePlayerPattern(history, 'player1');

      // ターン2: NEAR距離でWEAPON_ATTACK×2
      expect(result[DistanceType.NEAR][CommandType.WEAPON_ATTACK]).toBe(2);
      // ターン3: MID距離でSPECIAL_ATTACK×1, REFLECTOR×1
      expect(result[DistanceType.MID][CommandType.SPECIAL_ATTACK]).toBe(1);
      expect(result[DistanceType.MID][CommandType.REFLECTOR]).toBe(1);
    });
  });

  describe('距離別集計', () => {
    it('各距離で使ったコマンドが正しい距離にカウントされる', () => {
      const history = [
        makeTurnResult(1, CommandType.ADVANCE, CommandType.ADVANCE,
          CommandType.ADVANCE, CommandType.ADVANCE, DistanceType.NEAR),
        // ターン2: distanceBefore=NEAR
        makeTurnResult(2, CommandType.WEAPON_ATTACK, CommandType.RETREAT,
          CommandType.REFLECTOR, CommandType.ADVANCE, DistanceType.MID),
        // ターン3: distanceBefore=MID
        makeTurnResult(3, CommandType.SPECIAL_ATTACK, CommandType.SPECIAL_ATTACK,
          CommandType.SPECIAL_ATTACK, CommandType.SPECIAL_ATTACK, DistanceType.FAR),
        // ターン4: distanceBefore=FAR
        makeTurnResult(4, CommandType.REFLECTOR, CommandType.REFLECTOR,
          CommandType.REFLECTOR, CommandType.REFLECTOR, DistanceType.FAR),
      ];

      const result = analyzePlayerPattern(history, 'player1', 3);

      // ターン2: NEAR距離でWEAPON_ATTACK×1, RETREAT×1
      expect(result[DistanceType.NEAR][CommandType.WEAPON_ATTACK]).toBe(1);
      expect(result[DistanceType.NEAR][CommandType.RETREAT]).toBe(1);
      // ターン3: MID距離でSPECIAL_ATTACK×2
      expect(result[DistanceType.MID][CommandType.SPECIAL_ATTACK]).toBe(2);
      // ターン4: FAR距離でREFLECTOR×2
      expect(result[DistanceType.FAR][CommandType.REFLECTOR]).toBe(2);
    });
  });

  describe('lookbackTurns指定', () => {
    it('lookbackTurns=1で直近1ターンのみ分析', () => {
      const history = [
        makeTurnResult(1, CommandType.ADVANCE, CommandType.ADVANCE,
          CommandType.ADVANCE, CommandType.ADVANCE, DistanceType.MID),
        makeTurnResult(2, CommandType.WEAPON_ATTACK, CommandType.WEAPON_ATTACK,
          CommandType.RETREAT, CommandType.RETREAT, DistanceType.NEAR),
        makeTurnResult(3, CommandType.SPECIAL_ATTACK, CommandType.SPECIAL_ATTACK,
          CommandType.SPECIAL_ATTACK, CommandType.SPECIAL_ATTACK, DistanceType.FAR),
      ];

      // lookback=1: ターン3のみ（distanceBefore=ターン2のafter=NEAR）
      const result = analyzePlayerPattern(history, 'player1', 1);
      expect(result[DistanceType.NEAR][CommandType.SPECIAL_ATTACK]).toBe(2);
      // ターン2のデータは含まれない
      expect(result[DistanceType.MID]).toEqual({});
    });

    it('lookbackTurnsが履歴長より大きい場合、全履歴を使用', () => {
      const history = [
        makeTurnResult(1, CommandType.ADVANCE, CommandType.ADVANCE,
          CommandType.ADVANCE, CommandType.ADVANCE, DistanceType.MID),
        makeTurnResult(2, CommandType.WEAPON_ATTACK, CommandType.WEAPON_ATTACK,
          CommandType.RETREAT, CommandType.RETREAT, DistanceType.NEAR),
      ];

      // lookback=10だが履歴は2ターンのみ
      const result = analyzePlayerPattern(history, 'player1', 10);
      // ターン2: distanceBefore=MID, WEAPON_ATTACK×2
      expect(result[DistanceType.MID][CommandType.WEAPON_ATTACK]).toBe(2);
    });
  });

  describe('1stと2ndの両方をカウント', () => {
    it('1ターンで2コマンド分をカウントする', () => {
      const history = [
        makeTurnResult(1, CommandType.ADVANCE, CommandType.ADVANCE,
          CommandType.ADVANCE, CommandType.ADVANCE, DistanceType.MID),
        // ターン2: distanceBefore=MID, WEAPON_ATTACKとSPECIAL_ATTACK
        makeTurnResult(2, CommandType.WEAPON_ATTACK, CommandType.SPECIAL_ATTACK,
          CommandType.RETREAT, CommandType.RETREAT, DistanceType.NEAR),
      ];

      const result = analyzePlayerPattern(history, 'player1');
      expect(result[DistanceType.MID][CommandType.WEAPON_ATTACK]).toBe(1);
      expect(result[DistanceType.MID][CommandType.SPECIAL_ATTACK]).toBe(1);
    });
  });

  describe('player1とplayer2の識別', () => {
    it('player1を指定した場合、player1のコマンドのみ集計', () => {
      const history = [
        makeTurnResult(1, CommandType.ADVANCE, CommandType.ADVANCE,
          CommandType.RETREAT, CommandType.RETREAT, DistanceType.MID),
        makeTurnResult(2, CommandType.WEAPON_ATTACK, CommandType.WEAPON_ATTACK,
          CommandType.SPECIAL_ATTACK, CommandType.SPECIAL_ATTACK, DistanceType.NEAR),
      ];

      const result = analyzePlayerPattern(history, 'player1');
      // player1: MID距離でWEAPON_ATTACK×2
      expect(result[DistanceType.MID][CommandType.WEAPON_ATTACK]).toBe(2);
      // player2のSPECIAL_ATTACKは含まれない
      expect(result[DistanceType.MID][CommandType.SPECIAL_ATTACK]).toBeUndefined();
    });

    it('player2を指定した場合、player2のコマンドのみ集計', () => {
      const history = [
        makeTurnResult(1, CommandType.ADVANCE, CommandType.ADVANCE,
          CommandType.RETREAT, CommandType.RETREAT, DistanceType.MID),
        makeTurnResult(2, CommandType.WEAPON_ATTACK, CommandType.WEAPON_ATTACK,
          CommandType.SPECIAL_ATTACK, CommandType.SPECIAL_ATTACK, DistanceType.NEAR),
      ];

      const result = analyzePlayerPattern(history, 'player2');
      // player2: MID距離でSPECIAL_ATTACK×2
      expect(result[DistanceType.MID][CommandType.SPECIAL_ATTACK]).toBe(2);
      // player1のWEAPON_ATTACKは含まれない
      expect(result[DistanceType.MID][CommandType.WEAPON_ATTACK]).toBeUndefined();
    });
  });
});

describe('getMostFrequentCommand', () => {
  describe('基本動作', () => {
    it('最頻出コマンドを返す', () => {
      const frequency: DistanceCommandFrequency = {
        [DistanceType.NEAR]: { [CommandType.WEAPON_ATTACK]: 5, [CommandType.ADVANCE]: 2 },
        [DistanceType.MID]: {},
        [DistanceType.FAR]: {},
      };
      const result = getMostFrequentCommand(frequency, DistanceType.NEAR);
      expect(result).toEqual([CommandType.WEAPON_ATTACK]);
    });

    it('同率1位が複数ある場合、すべて返す', () => {
      const frequency: DistanceCommandFrequency = {
        [DistanceType.NEAR]: {},
        [DistanceType.MID]: { [CommandType.WEAPON_ATTACK]: 3, [CommandType.SPECIAL_ATTACK]: 3 },
        [DistanceType.FAR]: {},
      };
      const result = getMostFrequentCommand(frequency, DistanceType.MID);
      expect(result).toContain(CommandType.WEAPON_ATTACK);
      expect(result).toContain(CommandType.SPECIAL_ATTACK);
      expect(result).toHaveLength(2);
    });

    it('指定距離のデータがない場合、nullを返す', () => {
      const frequency: DistanceCommandFrequency = {
        [DistanceType.NEAR]: { [CommandType.WEAPON_ATTACK]: 5 },
        [DistanceType.MID]: {},
        [DistanceType.FAR]: {},
      };
      const result = getMostFrequentCommand(frequency, DistanceType.FAR);
      expect(result).toBeNull();
    });
  });

  describe('エッジケース', () => {
    it('全コマンドが1回ずつの場合、全コマンドを返す', () => {
      const frequency: DistanceCommandFrequency = {
        [DistanceType.NEAR]: {
          [CommandType.WEAPON_ATTACK]: 1,
          [CommandType.SPECIAL_ATTACK]: 1,
          [CommandType.REFLECTOR]: 1,
        },
        [DistanceType.MID]: {},
        [DistanceType.FAR]: {},
      };
      const result = getMostFrequentCommand(frequency, DistanceType.NEAR);
      expect(result).toHaveLength(3);
    });

    it('frequencyが全距離空の場合、nullを返す', () => {
      const frequency: DistanceCommandFrequency = {
        [DistanceType.NEAR]: {},
        [DistanceType.MID]: {},
        [DistanceType.FAR]: {},
      };
      const result = getMostFrequentCommand(frequency, DistanceType.NEAR);
      expect(result).toBeNull();
    });
  });
});
