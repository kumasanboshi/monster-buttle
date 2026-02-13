import { CommandSelectionManager } from '../../battle/CommandSelectionManager';
import { CommandType, BattleState, StanceType, DistanceType, Monster } from '../../types';

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
    remainingTime: 120,
    isFinished: false,
    ...overrides,
  };
}

describe('CommandSelectionManager', () => {
  describe('初期化', () => {
    it('初期状態で1st選択フェーズである', () => {
      const manager = new CommandSelectionManager(
        createTestState(),
        'player1',
        createTestMonster()
      );
      const selection = manager.getSelection();
      expect(selection.phase).toBe('first');
    });

    it('初期状態で選択コマンドが空である', () => {
      const manager = new CommandSelectionManager(
        createTestState(),
        'player1',
        createTestMonster()
      );
      const selection = manager.getSelection();
      expect(selection.first).toBeNull();
      expect(selection.second).toBeNull();
    });
  });

  describe('コマンド選択', () => {
    it('1stコマンドを選択できる', () => {
      const manager = new CommandSelectionManager(
        createTestState(),
        'player1',
        createTestMonster()
      );
      const result = manager.selectCommand(CommandType.ADVANCE);
      expect(result).toBe(true);
      expect(manager.getSelection().first).toBe(CommandType.ADVANCE);
    });

    it('1st選択後、2nd選択フェーズに移行する', () => {
      const manager = new CommandSelectionManager(
        createTestState(),
        'player1',
        createTestMonster()
      );
      manager.selectCommand(CommandType.ADVANCE);
      expect(manager.getSelection().phase).toBe('second');
    });

    it('2ndコマンドを選択できる', () => {
      const manager = new CommandSelectionManager(
        createTestState(),
        'player1',
        createTestMonster()
      );
      manager.selectCommand(CommandType.ADVANCE);
      const result = manager.selectCommand(CommandType.RETREAT);
      expect(result).toBe(true);
      expect(manager.getSelection().second).toBe(CommandType.RETREAT);
    });

    it('1stと同じコマンドを2ndに選択できる', () => {
      const manager = new CommandSelectionManager(
        createTestState(),
        'player1',
        createTestMonster()
      );
      manager.selectCommand(CommandType.ADVANCE);
      const result = manager.selectCommand(CommandType.ADVANCE);
      expect(result).toBe(true);
      expect(manager.getSelection().second).toBe(CommandType.ADVANCE);
    });
  });

  describe('有効コマンド判定', () => {
    it('有効なコマンド一覧を取得できる', () => {
      const manager = new CommandSelectionManager(
        createTestState(),
        'player1',
        createTestMonster()
      );
      const validCommands = manager.getValidCommands();
      expect(validCommands).toContain(CommandType.ADVANCE);
      expect(validCommands).toContain(CommandType.RETREAT);
      expect(validCommands).toContain(CommandType.SPECIAL_ATTACK);
      expect(validCommands).toContain(CommandType.STANCE_A);
      expect(validCommands).toContain(CommandType.STANCE_B);
    });

    it('中距離では武器攻撃が無効', () => {
      const manager = new CommandSelectionManager(
        createTestState({ currentDistance: DistanceType.MID }),
        'player1',
        createTestMonster()
      );
      expect(manager.getValidCommands()).not.toContain(CommandType.WEAPON_ATTACK);
    });

    it('近距離では武器攻撃が有効', () => {
      const manager = new CommandSelectionManager(
        createTestState({ currentDistance: DistanceType.NEAR }),
        'player1',
        createTestMonster()
      );
      expect(manager.getValidCommands()).toContain(CommandType.WEAPON_ATTACK);
    });

    it('リフレクター残り回数0では無効', () => {
      const manager = new CommandSelectionManager(
        createTestState({
          player1: {
            monsterId: 'zaag',
            currentHp: 250,
            currentStance: StanceType.NORMAL,
            remainingSpecialCount: 5,
            usedReflectCount: 2,
          },
        }),
        'player1',
        createTestMonster() // maxReflectCount: 2
      );
      expect(manager.getValidCommands()).not.toContain(CommandType.REFLECTOR);
    });

    it('無効なコマンドは選択できない', () => {
      const manager = new CommandSelectionManager(
        createTestState({ currentDistance: DistanceType.MID }),
        'player1',
        createTestMonster()
      );
      // 中距離では武器攻撃は無効
      const result = manager.selectCommand(CommandType.WEAPON_ATTACK);
      expect(result).toBe(false);
      expect(manager.getSelection().first).toBeNull();
    });
  });

  describe('選択キャンセル', () => {
    it('2nd選択フェーズでキャンセルすると1st選択フェーズに戻る', () => {
      const manager = new CommandSelectionManager(
        createTestState(),
        'player1',
        createTestMonster()
      );
      manager.selectCommand(CommandType.ADVANCE);
      manager.cancelSelection();
      const selection = manager.getSelection();
      expect(selection.phase).toBe('first');
      expect(selection.first).toBeNull();
    });

    it('両方選択済みでキャンセルすると2ndが空になる', () => {
      const manager = new CommandSelectionManager(
        createTestState(),
        'player1',
        createTestMonster()
      );
      manager.selectCommand(CommandType.ADVANCE);
      manager.selectCommand(CommandType.RETREAT);
      manager.cancelSelection();
      const selection = manager.getSelection();
      expect(selection.phase).toBe('second');
      expect(selection.first).toBe(CommandType.ADVANCE);
      expect(selection.second).toBeNull();
    });

    it('未選択状態でキャンセルしても何も起きない', () => {
      const manager = new CommandSelectionManager(
        createTestState(),
        'player1',
        createTestMonster()
      );
      manager.cancelSelection();
      const selection = manager.getSelection();
      expect(selection.phase).toBe('first');
      expect(selection.first).toBeNull();
      expect(selection.second).toBeNull();
    });
  });
});
