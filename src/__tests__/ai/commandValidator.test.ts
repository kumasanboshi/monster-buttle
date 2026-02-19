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
  describe('全コマンドが常に有効', () => {
    it('全7コマンドが返される', () => {
      const state = createTestState();
      const monster = createTestMonster();
      const validCmds = getValidCommands(state, 'player1', monster);
      expect(validCmds).toHaveLength(7);
      expect(validCmds).toContain(CommandType.ADVANCE);
      expect(validCmds).toContain(CommandType.RETREAT);
      expect(validCmds).toContain(CommandType.WEAPON_ATTACK);
      expect(validCmds).toContain(CommandType.SPECIAL_ATTACK);
      expect(validCmds).toContain(CommandType.REFLECTOR);
      expect(validCmds).toContain(CommandType.STANCE_A);
      expect(validCmds).toContain(CommandType.STANCE_B);
    });

    it('武器攻撃は全距離で選択可能（命中判定は解決時）', () => {
      const monster = createTestMonster();
      for (const distance of [DistanceType.NEAR, DistanceType.MID, DistanceType.FAR]) {
        const state = createTestState({ currentDistance: distance });
        const validCmds = getValidCommands(state, 'player1', monster);
        expect(validCmds).toContain(CommandType.WEAPON_ATTACK);
      }
    });

    it('リフレクターは反射回数0でも選択可能（無効化のみで防御可能）', () => {
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
      expect(validCmds).toContain(CommandType.REFLECTOR);
    });

    it('特殊攻撃は残り回数0でも選択可能（弱体化して使用可能）', () => {
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

    it('スタンスコマンドは全スタンス状態で選択可能', () => {
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

    it('player2でも全7コマンドが返される', () => {
      const state = createTestState();
      const monster = createTestMonster();
      const validCmds = getValidCommands(state, 'player2', monster);
      expect(validCmds).toHaveLength(7);
    });
  });
});
