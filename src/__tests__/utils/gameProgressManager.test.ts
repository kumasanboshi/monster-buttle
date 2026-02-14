import {
  loadGameProgress,
  saveGameProgress,
  updateClearedStages,
  PROGRESS_STORAGE_KEY,
} from '../../utils/gameProgressManager';
import {
  DEFAULT_GAME_PROGRESS,
  isValidGameProgress,
} from '../../types/GameProgress';

// node環境用のlocalStorageモック
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();

Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock });

describe('isValidGameProgress', () => {
  it('正しいGameProgressを受け入れること', () => {
    expect(isValidGameProgress({ clearedStages: 0 })).toBe(true);
    expect(isValidGameProgress({ clearedStages: 4 })).toBe(true);
    expect(isValidGameProgress({ clearedStages: 8 })).toBe(true);
  });

  it('nullやundefinedを拒否すること', () => {
    expect(isValidGameProgress(null)).toBe(false);
    expect(isValidGameProgress(undefined)).toBe(false);
  });

  it('不正な型を拒否すること', () => {
    expect(isValidGameProgress('string')).toBe(false);
    expect(isValidGameProgress(42)).toBe(false);
    expect(isValidGameProgress({})).toBe(false);
  });

  it('clearedStagesが整数でない場合を拒否すること', () => {
    expect(isValidGameProgress({ clearedStages: 1.5 })).toBe(false);
  });

  it('clearedStagesが範囲外の場合を拒否すること', () => {
    expect(isValidGameProgress({ clearedStages: -1 })).toBe(false);
    expect(isValidGameProgress({ clearedStages: 9 })).toBe(false);
  });
});

describe('loadGameProgress', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('LocalStorageにデータがない場合、デフォルト値を返すこと', () => {
    const progress = loadGameProgress();
    expect(progress).toEqual(DEFAULT_GAME_PROGRESS);
  });

  it('LocalStorageに正しいデータがある場合、それを返すこと', () => {
    const saved = { clearedStages: 5 };
    localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(saved));

    const progress = loadGameProgress();
    expect(progress).toEqual(saved);
  });

  it('LocalStorageのデータが壊れている場合、デフォルト値を返すこと', () => {
    localStorage.setItem(PROGRESS_STORAGE_KEY, 'not valid json{{{');

    const progress = loadGameProgress();
    expect(progress).toEqual(DEFAULT_GAME_PROGRESS);
  });

  it('LocalStorageのデータが不正な値の場合、デフォルト値を返すこと', () => {
    localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify({ clearedStages: -1 }));

    const progress = loadGameProgress();
    expect(progress).toEqual(DEFAULT_GAME_PROGRESS);
  });
});

describe('saveGameProgress', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('進捗をLocalStorageに保存すること', () => {
    const progress = { clearedStages: 3 };
    saveGameProgress(progress);

    const stored = JSON.parse(localStorage.getItem(PROGRESS_STORAGE_KEY)!);
    expect(stored.clearedStages).toBe(3);
  });

  it('保存後、loadGameProgress()で同じ値が取得できること', () => {
    const progress = { clearedStages: 7 };
    saveGameProgress(progress);

    const loaded = loadGameProgress();
    expect(loaded).toEqual(progress);
  });
});

describe('updateClearedStages', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('初回クリア時にclearedStagesを更新すること', () => {
    const result = updateClearedStages(1);
    expect(result.clearedStages).toBe(1);

    const loaded = loadGameProgress();
    expect(loaded.clearedStages).toBe(1);
  });

  it('現在値より大きいステージ番号で更新すること', () => {
    saveGameProgress({ clearedStages: 3 });

    const result = updateClearedStages(5);
    expect(result.clearedStages).toBe(5);
  });

  it('現在値以下のステージ番号では更新しないこと', () => {
    saveGameProgress({ clearedStages: 5 });

    const result = updateClearedStages(3);
    expect(result.clearedStages).toBe(5);
  });

  it('同じステージ番号では更新しないこと', () => {
    saveGameProgress({ clearedStages: 4 });

    const result = updateClearedStages(4);
    expect(result.clearedStages).toBe(4);
  });
});
