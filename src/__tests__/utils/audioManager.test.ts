import { playBgm, stopBgm, setBgmVolume, playSe, _resetForTest } from '../../utils/audioManager';
import { DEFAULT_SETTINGS, EffectSpeed } from '../../types/Settings';
import { STORAGE_KEY } from '../../utils/settingsManager';

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

Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock });

/** Phaser SoundManagerのモックを作成 */
function createMockSoundManager() {
  const mockSound = {
    play: jest.fn(),
    stop: jest.fn(),
    destroy: jest.fn(),
    setVolume: jest.fn(),
    setLoop: jest.fn(),
    isPlaying: true,
  };

  const soundManager = {
    add: jest.fn().mockReturnValue(mockSound),
  };

  return { soundManager, mockSound };
}

describe('playBgm', () => {
  beforeEach(() => {
    localStorage.clear();
    _resetForTest();
  });

  it('指定キーでBGMをループ再生すること', () => {
    const { soundManager, mockSound } = createMockSoundManager();

    playBgm(soundManager as any, 'bgm_title');

    expect(soundManager.add).toHaveBeenCalledWith('bgm_title');
    expect(mockSound.setLoop).toHaveBeenCalledWith(true);
    expect(mockSound.setVolume).toHaveBeenCalled();
    expect(mockSound.play).toHaveBeenCalled();
  });

  it('設定値に基づいた音量（0-100 → 0.0-1.0）で再生すること', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      bgmVolume: 50,
      seVolume: 80,
      effectSpeed: EffectSpeed.NORMAL,
    }));

    const { soundManager, mockSound } = createMockSoundManager();

    playBgm(soundManager as any, 'bgm_battle');

    expect(mockSound.setVolume).toHaveBeenCalledWith(0.5);
  });

  it('既存のBGMを停止してから新しいBGMを再生すること', () => {
    const { soundManager: sm1, mockSound: sound1 } = createMockSoundManager();
    const { soundManager: sm2, mockSound: sound2 } = createMockSoundManager();

    playBgm(sm1 as any, 'bgm_title');
    playBgm(sm2 as any, 'bgm_battle');

    expect(sound1.stop).toHaveBeenCalled();
    expect(sound1.destroy).toHaveBeenCalled();
    expect(sound2.play).toHaveBeenCalled();
  });

  it('デフォルト音量（80）で再生すること（設定未保存時）', () => {
    const { soundManager, mockSound } = createMockSoundManager();

    playBgm(soundManager as any, 'bgm_title');

    expect(mockSound.setVolume).toHaveBeenCalledWith(0.8);
  });
});

describe('stopBgm', () => {
  beforeEach(() => {
    localStorage.clear();
    _resetForTest();
  });

  it('再生中のBGMを停止・破棄すること', () => {
    const { soundManager, mockSound } = createMockSoundManager();

    playBgm(soundManager as any, 'bgm_title');
    stopBgm();

    expect(mockSound.stop).toHaveBeenCalled();
    expect(mockSound.destroy).toHaveBeenCalled();
  });

  it('BGMが未再生の場合、エラーなく実行できること', () => {
    expect(() => stopBgm()).not.toThrow();
  });

  it('二重呼び出しでもエラーにならないこと', () => {
    const { soundManager } = createMockSoundManager();

    playBgm(soundManager as any, 'bgm_title');
    stopBgm();
    expect(() => stopBgm()).not.toThrow();
  });
});

describe('setBgmVolume', () => {
  beforeEach(() => {
    localStorage.clear();
    _resetForTest();
  });

  it('再生中のBGMの音量をリアルタイムで更新すること', () => {
    const { soundManager, mockSound } = createMockSoundManager();

    playBgm(soundManager as any, 'bgm_title');
    setBgmVolume(30);

    expect(mockSound.setVolume).toHaveBeenCalledWith(0.3);
  });

  it('BGMが未再生の場合、エラーなく実行できること', () => {
    expect(() => setBgmVolume(50)).not.toThrow();
  });

  it('音量0で再生中BGMの音量を0に設定すること', () => {
    const { soundManager, mockSound } = createMockSoundManager();

    playBgm(soundManager as any, 'bgm_title');
    setBgmVolume(0);

    expect(mockSound.setVolume).toHaveBeenCalledWith(0);
  });

  it('音量100で再生中BGMの音量を1.0に設定すること', () => {
    const { soundManager, mockSound } = createMockSoundManager();

    playBgm(soundManager as any, 'bgm_title');
    setBgmVolume(100);

    expect(mockSound.setVolume).toHaveBeenCalledWith(1.0);
  });
});

describe('playSe', () => {
  beforeEach(() => {
    localStorage.clear();
    _resetForTest();
  });

  it('指定キーでSEをワンショット再生すること', () => {
    const { soundManager, mockSound } = createMockSoundManager();

    playSe(soundManager as any, 'se_attack');

    expect(soundManager.add).toHaveBeenCalledWith('se_attack');
    expect(mockSound.setVolume).toHaveBeenCalled();
    expect(mockSound.play).toHaveBeenCalled();
  });

  it('設定値に基づいたSE音量で再生すること', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      bgmVolume: 80,
      seVolume: 60,
      effectSpeed: EffectSpeed.NORMAL,
    }));

    const { soundManager, mockSound } = createMockSoundManager();

    playSe(soundManager as any, 'se_select');

    expect(mockSound.setVolume).toHaveBeenCalledWith(0.6);
  });

  it('SEはループ再生しないこと', () => {
    const { soundManager, mockSound } = createMockSoundManager();

    playSe(soundManager as any, 'se_attack');

    expect(mockSound.setLoop).not.toHaveBeenCalled();
  });

  it('デフォルトSE音量（80）で再生すること（設定未保存時）', () => {
    const { soundManager, mockSound } = createMockSoundManager();

    playSe(soundManager as any, 'se_attack');

    expect(mockSound.setVolume).toHaveBeenCalledWith(0.8);
  });
});
