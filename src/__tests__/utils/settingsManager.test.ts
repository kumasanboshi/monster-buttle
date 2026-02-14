import {
  loadSettings,
  saveSettings,
  getEffectSpeedMultiplier,
  STORAGE_KEY,
} from '../../utils/settingsManager';
import {
  DEFAULT_SETTINGS,
  EffectSpeed,
  Settings,
} from '../../types/Settings';

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

describe('loadSettings', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('LocalStorageにデータがない場合、デフォルト値を返すこと', () => {
    const settings = loadSettings();
    expect(settings).toEqual(DEFAULT_SETTINGS);
  });

  it('LocalStorageに正しいデータがある場合、それを返すこと', () => {
    const saved: Settings = {
      bgmVolume: 50,
      seVolume: 30,
      effectSpeed: EffectSpeed.FAST,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));

    const settings = loadSettings();
    expect(settings).toEqual(saved);
  });

  it('LocalStorageのデータが壊れている場合、デフォルト値を返すこと', () => {
    localStorage.setItem(STORAGE_KEY, 'not valid json{{{');

    const settings = loadSettings();
    expect(settings).toEqual(DEFAULT_SETTINGS);
  });

  it('LocalStorageのデータが不完全な場合、デフォルト値を返すこと', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ bgmVolume: 50 }));

    const settings = loadSettings();
    expect(settings).toEqual(DEFAULT_SETTINGS);
  });
});

describe('saveSettings', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('設定値をLocalStorageに保存すること', () => {
    const settings: Settings = {
      bgmVolume: 70,
      seVolume: 40,
      effectSpeed: EffectSpeed.FAST,
    };
    saveSettings(settings);

    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
    expect(stored.bgmVolume).toBe(70);
    expect(stored.seVolume).toBe(40);
    expect(stored.effectSpeed).toBe(EffectSpeed.FAST);
  });

  it('保存後、loadSettings()で同じ値が取得できること', () => {
    const settings: Settings = {
      bgmVolume: 55,
      seVolume: 45,
      effectSpeed: EffectSpeed.NORMAL,
    };
    saveSettings(settings);

    const loaded = loadSettings();
    expect(loaded).toEqual(settings);
  });

  it('音量が0〜100の範囲外の場合、クランプして保存すること', () => {
    const settings: Settings = {
      bgmVolume: 150,
      seVolume: -20,
      effectSpeed: EffectSpeed.NORMAL,
    };
    saveSettings(settings);

    const loaded = loadSettings();
    expect(loaded.bgmVolume).toBe(100);
    expect(loaded.seVolume).toBe(0);
  });
});

describe('getEffectSpeedMultiplier', () => {
  it('NORMALの場合1.0を返すこと', () => {
    expect(getEffectSpeedMultiplier(EffectSpeed.NORMAL)).toBe(1.0);
  });

  it('FASTの場合0.5を返すこと', () => {
    expect(getEffectSpeedMultiplier(EffectSpeed.FAST)).toBe(0.5);
  });
});
