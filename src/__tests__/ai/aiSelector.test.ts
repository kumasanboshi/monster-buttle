import { selectCommands } from '../../ai/aiSelector';
import { AILevel } from '../../ai/types';
import { CommandType, DistanceType, StanceType, Monster, BattleState } from '../../types';

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

describe('selectCommands', () => {
  describe('Lv1 AI（ランダム）', () => {
    describe('基本動作', () => {
      it('TurnCommands構造（first, second）を返す', () => {
        const state = createTestState();
        const monster = createTestMonster();
        const result = selectCommands(state, 'player1', monster, AILevel.LV1, () => 0.5);
        expect(result).toHaveProperty('first');
        expect(result).toHaveProperty('second');
        expect(result.first).toHaveProperty('type');
        expect(result.second).toHaveProperty('type');
      });

      it('有効なコマンドから選択する', () => {
        const state = createTestState({ currentDistance: DistanceType.MID });
        const monster = createTestMonster();
        const result = selectCommands(state, 'player1', monster, AILevel.LV1, () => 0.5);
        // MID距離では WEAPON_ATTACK は無効
        expect(result.first.type).not.toBe(CommandType.WEAPON_ATTACK);
        expect(result.second.type).not.toBe(CommandType.WEAPON_ATTACK);
      });

      it('同じコマンドを2回選択することも可能', () => {
        const state = createTestState();
        const monster = createTestMonster();
        // 同じ乱数値なら同じコマンドを選ぶ
        const result = selectCommands(state, 'player1', monster, AILevel.LV1, () => 0.0);
        expect(result.first.type).toBe(result.second.type);
      });
    });

    describe('ランダム性のテスト（固定乱数）', () => {
      it('randomFn() = 0.0の時、最初の有効コマンドを選択', () => {
        const state = createTestState({ currentDistance: DistanceType.MID });
        const monster = createTestMonster();
        // MID距離の有効コマンド: ADVANCE, RETREAT, SPECIAL_ATTACK, REFLECTOR, STANCE_A, STANCE_B
        const result = selectCommands(state, 'player1', monster, AILevel.LV1, () => 0.0);
        expect(result.first.type).toBe(CommandType.ADVANCE);
      });

      it('randomFn() = 0.99の時、最後の有効コマンドを選択', () => {
        const state = createTestState({ currentDistance: DistanceType.MID });
        const monster = createTestMonster();
        const result = selectCommands(state, 'player1', monster, AILevel.LV1, () => 0.99);
        expect(result.first.type).toBe(CommandType.STANCE_B);
      });

      it('1stと2ndで異なる乱数値を使う場合、異なるコマンドを選べる', () => {
        const state = createTestState({ currentDistance: DistanceType.MID });
        const monster = createTestMonster();
        let callCount = 0;
        const randomFn = () => {
          callCount++;
          return callCount === 1 ? 0.0 : 0.99;
        };
        const result = selectCommands(state, 'player1', monster, AILevel.LV1, randomFn);
        expect(result.first.type).toBe(CommandType.ADVANCE);
        expect(result.second.type).toBe(CommandType.STANCE_B);
      });
    });

    describe('無効コマンドの除外', () => {
      it('遠距離では武器攻撃を選択しない', () => {
        const state = createTestState({ currentDistance: DistanceType.FAR });
        const monster = createTestMonster();
        // 全乱数パターンで武器攻撃が出ないことを確認
        for (let i = 0; i < 10; i++) {
          const result = selectCommands(state, 'player1', monster, AILevel.LV1, () => i / 10);
          expect(result.first.type).not.toBe(CommandType.WEAPON_ATTACK);
          expect(result.second.type).not.toBe(CommandType.WEAPON_ATTACK);
        }
      });

      it('リフレクター使用済みではリフレクターを選択しない', () => {
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
        for (let i = 0; i < 10; i++) {
          const result = selectCommands(state, 'player1', monster, AILevel.LV1, () => i / 10);
          expect(result.first.type).not.toBe(CommandType.REFLECTOR);
          expect(result.second.type).not.toBe(CommandType.REFLECTOR);
        }
      });
    });

    describe('近距離での動作', () => {
      it('近距離では武器攻撃を選択できる', () => {
        const state = createTestState({ currentDistance: DistanceType.NEAR });
        const monster = createTestMonster();
        // 7つの有効コマンド: ADVANCE, RETREAT, WEAPON, SPECIAL, REFLECTOR, STANCE_A, STANCE_B
        // randomFn = 2/7 ≈ 0.286 → WEAPON_ATTACK（3番目）
        const result = selectCommands(state, 'player1', monster, AILevel.LV1, () => 2 / 7);
        expect(result.first.type).toBe(CommandType.WEAPON_ATTACK);
      });
    });

    describe('player2としての動作', () => {
      it('player2でも正しく動作する', () => {
        const state = createTestState();
        const monster = createTestMonster({ id: 'gardan' });
        const result = selectCommands(state, 'player2', monster, AILevel.LV1, () => 0.5);
        expect(result.first).toHaveProperty('type');
        expect(result.second).toHaveProperty('type');
      });
    });
  });

  describe('未実装AIレベル（Lv2-Lv5）', () => {
    const state = createTestState();
    const monster = createTestMonster();

    it('Lv2を指定するとエラーをスロー', () => {
      expect(() => selectCommands(state, 'player1', monster, AILevel.LV2)).toThrow();
    });

    it('Lv3を指定するとエラーをスロー', () => {
      expect(() => selectCommands(state, 'player1', monster, AILevel.LV3)).toThrow();
    });

    it('Lv4を指定するとエラーをスロー', () => {
      expect(() => selectCommands(state, 'player1', monster, AILevel.LV4)).toThrow();
    });

    it('Lv5を指定するとエラーをスロー', () => {
      expect(() => selectCommands(state, 'player1', monster, AILevel.LV5)).toThrow();
    });
  });
});
