import { BattleResultType, BattleResult, BattleState } from '../../types/BattleState';
import { DistanceType } from '../../types/Distance';
import { StanceType } from '../../types/Stance';
import { GameMode } from '../../types/GameMode';
import { calculateStatsDiff } from '../../constants/monsterStats';

// --- calculateStatsDiff の純粋関数テスト（Phaserなし） ---

describe('calculateStatsDiff', () => {
  it('全5パラメータの差分が生成されること', () => {
    const diff = calculateStatsDiff('zaag', 1);
    expect(diff).toBeDefined();
    expect(diff).toHaveProperty('hp');
    expect(diff).toHaveProperty('strength');
    expect(diff).toHaveProperty('special');
    expect(diff).toHaveProperty('speed');
    expect(diff).toHaveProperty('toughness');
  });

  it('各パラメータに before / after / gain が含まれること', () => {
    const diff = calculateStatsDiff('zaag', 1);
    expect(diff!.hp).toHaveProperty('before');
    expect(diff!.hp).toHaveProperty('after');
    expect(diff!.hp).toHaveProperty('gain');
  });

  it('gain が after - before であること', () => {
    const diff = calculateStatsDiff('zaag', 1);
    expect(diff!.hp.gain).toBe(diff!.hp.after - diff!.hp.before);
    expect(diff!.strength.gain).toBe(diff!.strength.after - diff!.strength.before);
  });

  it('成長段階1のとき before は基礎値、after は1段階成長後の値であること', () => {
    const diff = calculateStatsDiff('zaag', 1);
    // zaagのHP基礎値は375、1段階でHP+15
    expect(diff!.hp.before).toBe(375);
    expect(diff!.hp.after).toBe(390);
    expect(diff!.hp.gain).toBe(15);
  });

  it('成長段階7（最終）の差分が正しく計算されること', () => {
    const diff = calculateStatsDiff('zaag', 7);
    expect(diff!.hp.before).toBe(465); // 375 + 15*6
    expect(diff!.hp.after).toBe(480);  // 375 + 15*7
    expect(diff!.hp.gain).toBe(15);
  });

  it('存在しないモンスターIDはundefinedを返すこと', () => {
    const diff = calculateStatsDiff('unknown_monster', 1);
    expect(diff).toBeUndefined();
  });

  it('成長段階0のとき before と after が同じ値であること（gainが0）', () => {
    const diff = calculateStatsDiff('zaag', 0);
    expect(diff!.hp.gain).toBe(0);
    expect(diff!.hp.before).toBe(diff!.hp.after);
  });
});

// --- ResultScene の成長差分表示テスト（Phaserモック） ---

// localStorageモック
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();
Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock, writable: true });

jest.mock('phaser', () => ({
  Scene: class MockScene {
    scene = { key: '', start: jest.fn() };
    add = {
      text: jest.fn().mockReturnValue({
        setOrigin: jest.fn().mockReturnThis(),
        setInteractive: jest.fn().mockReturnThis(),
        setColor: jest.fn().mockReturnThis(),
        setScale: jest.fn().mockReturnThis(),
        on: jest.fn().mockReturnThis(),
      }),
      image: jest.fn().mockReturnValue({
        setOrigin: jest.fn().mockReturnThis(),
      }),
      rectangle: jest.fn().mockReturnValue({ setOrigin: jest.fn().mockReturnThis() }),
    };
    sound = {
      add: jest.fn().mockReturnValue({
        play: jest.fn(), stop: jest.fn(), destroy: jest.fn(),
        setVolume: jest.fn(), setLoop: jest.fn(),
      }),
    };
    textures = { exists: jest.fn().mockReturnValue(false) };
    constructor(config: { key: string }) { this.scene.key = config.key; }
  },
}));

import { ResultScene, ResultSceneData } from '../../scenes/ResultScene';

function createTestBattleState(p1Hp: number, p2Hp: number): BattleState {
  return {
    player1: { monsterId: 'zaag', currentHp: p1Hp, currentStance: StanceType.NORMAL, remainingSpecialCount: 3, usedReflectCount: 0 },
    player2: { monsterId: 'gardan', currentHp: p2Hp, currentStance: StanceType.NORMAL, remainingSpecialCount: 3, usedReflectCount: 0 },
    currentDistance: DistanceType.MID,
    currentTurn: 5,
    remainingTime: 60,
    isFinished: true,
  };
}

function createWinResult(p1Hp = 100, p2Hp = 0): BattleResult {
  return { resultType: BattleResultType.PLAYER1_WIN, finalState: createTestBattleState(p1Hp, p2Hp), turnHistory: [], reason: 'hp0' };
}

function createLoseResult(): BattleResult {
  return { resultType: BattleResultType.PLAYER2_WIN, finalState: createTestBattleState(0, 100), turnHistory: [], reason: 'hp0' };
}

describe('ResultScene - CHALLENGE勝利時の成長差分表示', () => {
  let scene: ResultScene;
  let addTextCalls: { text: string }[];

  function setupScene(data: ResultSceneData): void {
    localStorage.clear();
    scene = new ResultScene();
    addTextCalls = [];
    (scene as any).add.text.mockImplementation((_x: number, _y: number, text: string) => {
      const mock = {
        text,
        setOrigin: jest.fn().mockReturnThis(),
        setInteractive: jest.fn().mockReturnThis(),
        setColor: jest.fn().mockReturnThis(),
        setScale: jest.fn().mockReturnThis(),
        on: jest.fn().mockReturnThis(),
      };
      addTextCalls.push(mock);
      return mock;
    });
    (scene as any).transitionTo = jest.fn();
    scene.create(data);
  }

  it('CHALLENGE勝利時に成長差分テキストが表示されること', () => {
    setupScene({
      battleResult: createWinResult(),
      mode: GameMode.CHALLENGE,
      stageNumber: 1,
      clearedStages: 0,
      monsterId: 'zaag',
    });
    const hasGrowthText = addTextCalls.some(c => c.text.includes('HP'));
    expect(hasGrowthText).toBe(true);
  });

  it('成長差分テキストに「+」が含まれること', () => {
    setupScene({
      battleResult: createWinResult(),
      mode: GameMode.CHALLENGE,
      stageNumber: 1,
      clearedStages: 0,
      monsterId: 'zaag',
    });
    const hasPlusText = addTextCalls.some(c => c.text.includes('+'));
    expect(hasPlusText).toBe(true);
  });

  it('CHALLENGE敗北時は成長差分が表示されないこと', () => {
    setupScene({
      battleResult: createLoseResult(),
      mode: GameMode.CHALLENGE,
      stageNumber: 1,
      clearedStages: 0,
      monsterId: 'zaag',
    });
    const hasPlusText = addTextCalls.some(c => c.text.includes('+'));
    expect(hasPlusText).toBe(false);
  });

  it('FREE_CPUモード勝利時は成長差分が表示されないこと', () => {
    setupScene({
      battleResult: createWinResult(),
      mode: GameMode.FREE_CPU,
      monsterId: 'zaag',
    });
    const hasPlusText = addTextCalls.some(c => c.text.includes('+'));
    expect(hasPlusText).toBe(false);
  });

  it('monsterId未指定時でもエラーにならないこと', () => {
    expect(() => setupScene({
      battleResult: createWinResult(),
      mode: GameMode.CHALLENGE,
      stageNumber: 1,
      clearedStages: 0,
    })).not.toThrow();
  });
});
