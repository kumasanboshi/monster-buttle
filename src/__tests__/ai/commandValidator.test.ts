import { getValidCommands } from '../../ai/commandValidator';
import { CommandType, DistanceType, StanceType, Monster, BattleState } from '../../types';

/**
 * テスト用ヘルパー: デフォルトのモンスターを生成
 */
function createTestMonster(overrides: Partial<Monster> = {}): Monster {
  return {
    id: 'zaag',
    name: 'レイン',
    species: 'ザーグ',
    stats: { hp: 250, strength: 50, special: 50, speed: 40, toughness: 50, specialAttackCount: 5 },
    weapon: { name: 'テスト武器', multiplier: 1.6 },
    reflector: { name: 'テストリフレクター', maxReflectCount: 2, reflectRate: 0.5 },
    ...overrides,
  };
}

/**
 * テスト用ヘルパー: デフォルトのBattleStateを生成
 */
function createTestState(overrides: Partial<BattleState> = {}): BattleState {
  return {
    player1: {
      monsterId: 'zaag',
      currentHp: 250,
      currentStance: StanceType.NORMAL,
      remainingSpecialCount: 5,
      usedReflectCount: 0,
    },
    player2: {
      monsterId: 'gardan',
      currentHp: 280,
      currentStance: StanceType.NORMAL,
      remainingSpecialCount: 3,
      usedReflectCount: 0,
    },
    currentDistance: DistanceType.MID,
    currentTurn: 1,
    remainingTime: 180,
    isFinished: false,
    ...overrides,
  };
}

describe('getValidCommands', () => {
  describe('WEAPON_ATTACK の有効性', () => {
    it('近距離で武器攻撃は有効', () => {
      const state = createTestState({ currentDistance: DistanceType.NEAR });
      const monster = createTestMonster();
      const validCmds = getValidCommands(state, 'player1', monster);
      expect(validCmds).toContain(CommandType.WEAPON_ATTACK);
    });

    it('中距離で武器攻撃は無効', () => {
      const state = createTestState({ currentDistance: DistanceType.MID });
      const monster = createTestMonster();
      const validCmds = getValidCommands(state, 'player1', monster);
      expect(validCmds).not.toContain(CommandType.WEAPON_ATTACK);
    });

    it('遠距離で武器攻撃は無効', () => {
      const state = createTestState({ currentDistance: DistanceType.FAR });
      const monster = createTestMonster();
      const validCmds = getValidCommands(state, 'player1', monster);
      expect(validCmds).not.toContain(CommandType.WEAPON_ATTACK);
    });
  });

  describe('SPECIAL_ATTACK の有効性', () => {
    it('残り回数が1以上で特殊攻撃は有効', () => {
      const state = createTestState();
      const monster = createTestMonster();
      const validCmds = getValidCommands(state, 'player1', monster);
      expect(validCmds).toContain(CommandType.SPECIAL_ATTACK);
    });

    it('残り回数が0でも特殊攻撃は有効（弱体化するが使用可能）', () => {
      const state = createTestState({
        player1: {
          monsterId: 'zaag',
          currentHp: 250,
          currentStance: StanceType.NORMAL,
          remainingSpecialCount: 0,
          usedReflectCount: 0,
        },
      });
      const monster = createTestMonster();
      const validCmds = getValidCommands(state, 'player1', monster);
      expect(validCmds).toContain(CommandType.SPECIAL_ATTACK);
    });

    it('全距離で特殊攻撃は有効', () => {
      const monster = createTestMonster();
      for (const distance of [DistanceType.NEAR, DistanceType.MID, DistanceType.FAR]) {
        const state = createTestState({ currentDistance: distance });
        const validCmds = getValidCommands(state, 'player1', monster);
        expect(validCmds).toContain(CommandType.SPECIAL_ATTACK);
      }
    });
  });

  describe('REFLECTOR の有効性', () => {
    it('使用回数が最大未満でリフレクターは有効', () => {
      const state = createTestState({
        player1: {
          monsterId: 'zaag',
          currentHp: 250,
          currentStance: StanceType.NORMAL,
          remainingSpecialCount: 5,
          usedReflectCount: 1,
        },
      });
      const monster = createTestMonster(); // maxReflectCount: 2
      const validCmds = getValidCommands(state, 'player1', monster);
      expect(validCmds).toContain(CommandType.REFLECTOR);
    });

    it('使用回数が最大に達したらリフレクターは無効', () => {
      const state = createTestState({
        player1: {
          monsterId: 'zaag',
          currentHp: 250,
          currentStance: StanceType.NORMAL,
          remainingSpecialCount: 5,
          usedReflectCount: 2,
        },
      });
      const monster = createTestMonster(); // maxReflectCount: 2
      const validCmds = getValidCommands(state, 'player1', monster);
      expect(validCmds).not.toContain(CommandType.REFLECTOR);
    });
  });

  describe('STANCE_A/STANCE_B の有効性', () => {
    it('スタンスコマンドは常に有効', () => {
      const monster = createTestMonster();
      for (const stance of [StanceType.NORMAL, StanceType.OFFENSIVE, StanceType.DEFENSIVE]) {
        const state = createTestState({
          player1: {
            monsterId: 'zaag',
            currentHp: 250,
            currentStance: stance,
            remainingSpecialCount: 5,
            usedReflectCount: 0,
          },
        });
        const validCmds = getValidCommands(state, 'player1', monster);
        expect(validCmds).toContain(CommandType.STANCE_A);
        expect(validCmds).toContain(CommandType.STANCE_B);
      }
    });
  });

  describe('ADVANCE/RETREAT の有効性', () => {
    it('前進と後退は常に有効', () => {
      const monster = createTestMonster();
      for (const distance of [DistanceType.NEAR, DistanceType.MID, DistanceType.FAR]) {
        const state = createTestState({ currentDistance: distance });
        const validCmds = getValidCommands(state, 'player1', monster);
        expect(validCmds).toContain(CommandType.ADVANCE);
        expect(validCmds).toContain(CommandType.RETREAT);
      }
    });
  });

  describe('player2の判定', () => {
    it('player2のリフレクター使用回数を正しく参照する', () => {
      const state = createTestState({
        player2: {
          monsterId: 'gardan',
          currentHp: 280,
          currentStance: StanceType.NORMAL,
          remainingSpecialCount: 3,
          usedReflectCount: 2,
        },
      });
      const monster = createTestMonster(); // maxReflectCount: 2
      const validCmds = getValidCommands(state, 'player2', monster);
      expect(validCmds).not.toContain(CommandType.REFLECTOR);
    });
  });

  describe('統合テスト', () => {
    it('近距離・リフレクター残り0: 武器攻撃あり・リフレクターなし', () => {
      const state = createTestState({
        currentDistance: DistanceType.NEAR,
        player1: {
          monsterId: 'zaag',
          currentHp: 250,
          currentStance: StanceType.NORMAL,
          remainingSpecialCount: 5,
          usedReflectCount: 2,
        },
      });
      const monster = createTestMonster(); // maxReflectCount: 2
      const validCmds = getValidCommands(state, 'player1', monster);
      expect(validCmds).toContain(CommandType.WEAPON_ATTACK);
      expect(validCmds).not.toContain(CommandType.REFLECTOR);
      expect(validCmds).toHaveLength(6); // ADVANCE, RETREAT, WEAPON, SPECIAL, STANCE_A, STANCE_B
    });

    it('遠距離・全リソース満タン: 武器攻撃なし・それ以外全部あり', () => {
      const state = createTestState({ currentDistance: DistanceType.FAR });
      const monster = createTestMonster();
      const validCmds = getValidCommands(state, 'player1', monster);
      expect(validCmds).not.toContain(CommandType.WEAPON_ATTACK);
      expect(validCmds).toContain(CommandType.REFLECTOR);
      expect(validCmds).toHaveLength(6); // ADVANCE, RETREAT, SPECIAL, REFLECTOR, STANCE_A, STANCE_B
    });
  });
});
