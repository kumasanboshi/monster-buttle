import { SceneKey } from '../../scenes/sceneKeys';
import { EffectSpeed } from '../../types/Settings';
import { SETTINGS_LABELS } from '../../scenes/settingsConfig';

// localStorageモック
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();
Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock });

// Phaserモジュール全体をモック
jest.mock('phaser', () => ({
  Scene: class MockScene {
    scene = {
      key: '',
      start: jest.fn(),
    };
    add = {
      text: jest.fn().mockReturnValue({
        setOrigin: jest.fn().mockReturnThis(),
        setInteractive: jest.fn().mockReturnThis(),
        setColor: jest.fn().mockReturnThis(),
        setScale: jest.fn().mockReturnThis(),
        on: jest.fn().mockReturnThis(),
        setText: jest.fn().mockReturnThis(),
      }),
      rectangle: jest.fn().mockReturnValue({
        setOrigin: jest.fn().mockReturnThis(),
        setInteractive: jest.fn().mockReturnThis(),
        setFillStyle: jest.fn().mockReturnThis(),
        on: jest.fn().mockReturnThis(),
        x: 0,
        y: 0,
        width: 0,
      }),
    };
    input = {
      on: jest.fn(),
    };
    textures = {
      exists: jest.fn().mockReturnValue(false),
    };
    constructor(config: { key: string }) {
      this.scene.key = config.key;
    }
  },
}));

import { SettingsScene } from '../../scenes/SettingsScene';

describe('SettingsScene', () => {
  let scene: SettingsScene;
  let addTextCalls: any[];
  let addRectCalls: any[];

  function setupScene(): void {
    localStorage.clear();
    scene = new SettingsScene();
    addTextCalls = [];
    addRectCalls = [];

    (scene as any).add.text.mockImplementation(
      (x: number, y: number, text: string, style?: object) => {
        const mockText = {
          x,
          y,
          text,
          style,
          setOrigin: jest.fn().mockReturnThis(),
          setInteractive: jest.fn().mockReturnThis(),
          setColor: jest.fn().mockReturnThis(),
          setScale: jest.fn().mockReturnThis(),
          on: jest.fn().mockReturnThis(),
          setText: jest.fn().mockReturnThis(),
        };
        addTextCalls.push(mockText);
        return mockText;
      }
    );

    (scene as any).add.rectangle.mockImplementation(
      (x: number, y: number, w: number, h: number, color?: number) => {
        const mockRect = {
          x,
          y,
          width: w,
          height: h,
          fillColor: color,
          setOrigin: jest.fn().mockReturnThis(),
          setInteractive: jest.fn().mockReturnThis(),
          setFillStyle: jest.fn().mockReturnThis(),
          on: jest.fn().mockReturnThis(),
          setScale: jest.fn().mockReturnThis(),
        };
        addRectCalls.push(mockRect);
        return mockRect;
      }
    );

    (scene as any).transitionTo = jest.fn();
    scene.create();
  }

  describe('初期化', () => {
    it('SceneKey.SETTINGSで初期化されること', () => {
      const s = new SettingsScene();
      expect((s as any).scene.key).toBe(SceneKey.SETTINGS);
    });

    it('タイトル「設定」が表示されること', () => {
      setupScene();
      const title = addTextCalls.find(
        (call) => call.text === SETTINGS_LABELS.title
      );
      expect(title).toBeDefined();
    });

    it('BGM音量ラベルが表示されること', () => {
      setupScene();
      const label = addTextCalls.find(
        (call) => call.text === SETTINGS_LABELS.bgmVolume
      );
      expect(label).toBeDefined();
    });

    it('SE音量ラベルが表示されること', () => {
      setupScene();
      const label = addTextCalls.find(
        (call) => call.text === SETTINGS_LABELS.seVolume
      );
      expect(label).toBeDefined();
    });

    it('演出速度ラベルが表示されること', () => {
      setupScene();
      const label = addTextCalls.find(
        (call) => call.text === SETTINGS_LABELS.effectSpeed
      );
      expect(label).toBeDefined();
    });

    it('遅い/通常/高速ボタンが表示されること', () => {
      setupScene();
      const slowBtn = addTextCalls.find(
        (call) => call.text === SETTINGS_LABELS.effectSpeedSlow
      );
      const normalBtn = addTextCalls.find(
        (call) => call.text === SETTINGS_LABELS.effectSpeedNormal
      );
      const fastBtn = addTextCalls.find(
        (call) => call.text === SETTINGS_LABELS.effectSpeedFast
      );
      expect(slowBtn).toBeDefined();
      expect(normalBtn).toBeDefined();
      expect(fastBtn).toBeDefined();
    });

    it('戻るボタンが表示されること', () => {
      setupScene();
      const backBtn = addTextCalls.find(
        (call) => call.text === SETTINGS_LABELS.back
      );
      expect(backBtn).toBeDefined();
    });
  });

  describe('戻るボタン', () => {
    it('クリックするとTITLEシーンに遷移すること', () => {
      setupScene();
      const backBtn = addTextCalls.find(
        (call) => call.text === SETTINGS_LABELS.back
      );
      expect(backBtn).toBeDefined();

      const onCalls = backBtn.on.mock.calls;
      const pointerdownCall = onCalls.find(
        (call: any[]) => call[0] === 'pointerdown'
      );
      expect(pointerdownCall).toBeDefined();

      pointerdownCall[1]();
      expect((scene as any).transitionTo).toHaveBeenCalledWith(SceneKey.TITLE);
    });
  });

  describe('データなしの場合', () => {
    it('create()がエラーにならないこと', () => {
      expect(() => setupScene()).not.toThrow();
    });
  });
});
