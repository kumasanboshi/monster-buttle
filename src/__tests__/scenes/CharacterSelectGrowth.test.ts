/**
 * CharacterSelectScene - CHALLENGEモードの成長後パラメータ表示テスト
 */
import { GameMode } from '../../types/GameMode';

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
        setText: jest.fn().mockReturnThis(),
      }),
      rectangle: jest.fn().mockReturnValue({
        setOrigin: jest.fn().mockReturnThis(),
        setInteractive: jest.fn().mockReturnThis(),
        setFillStyle: jest.fn().mockReturnThis(),
        setStrokeStyle: jest.fn().mockReturnThis(),
        on: jest.fn().mockReturnThis(),
        input: true,
      }),
      container: jest.fn().mockReturnValue({
        add: jest.fn(),
        list: [{
          setFillStyle: jest.fn(),
          setStrokeStyle: jest.fn(),
          setInteractive: jest.fn().mockReturnThis(),
          on: jest.fn().mockReturnThis(),
          input: true,
        }],
      }),
      image: jest.fn().mockReturnValue({
        setOrigin: jest.fn().mockReturnThis(),
        setDisplaySize: jest.fn().mockReturnThis(),
      }),
    };
    textures = { exists: jest.fn().mockReturnValue(false) };
    input = { on: jest.fn() };
    constructor(config: { key: string }) { this.scene.key = config.key; }
  },
}));

import { CharacterSelectScene } from '../../scenes/CharacterSelectScene';

describe('CharacterSelectScene - パラメータパネルの成長後表示', () => {
  let scene: CharacterSelectScene;
  let addTextCalls: { text: string }[];

  function setupScene(data?: object): void {
    localStorage.clear();
    scene = new CharacterSelectScene();
    addTextCalls = [];

    (scene as any).add.container.mockImplementation((x: number, y: number) => ({
      x, y,
      add: jest.fn(),
      list: [{
        setFillStyle: jest.fn(),
        setStrokeStyle: jest.fn(),
        setInteractive: jest.fn().mockReturnThis(),
        on: jest.fn().mockReturnThis(),
        input: true,
      }],
    }));

    (scene as any).add.text.mockImplementation((_x: number, _y: number, text: string) => {
      const mock = {
        text,
        setOrigin: jest.fn().mockReturnThis(),
        setInteractive: jest.fn().mockReturnThis(),
        setColor: jest.fn().mockReturnThis(),
        setScale: jest.fn().mockReturnThis(),
        on: jest.fn().mockReturnThis(),
        destroy: jest.fn(),
      };
      addTextCalls.push(mock);
      return mock;
    });

    (scene as any).transitionTo = jest.fn();
    scene.create(data as any);
  }

  describe('CHALLENGEモード - 成長後パラメータ表示', () => {
    it('clearedStages=3のとき基礎値より大きいHPが表示されること', () => {
      setupScene({ mode: GameMode.CHALLENGE, clearedStages: 3 });
      // zaagのHP基礎値=250、3段階成長後=295
      const hpText = addTextCalls.find(c => c.text.startsWith('HP:'));
      expect(hpText).toBeDefined();
      const hpValue = parseInt(hpText!.text.replace('HP: ', ''));
      expect(hpValue).toBeGreaterThan(250); // 基礎値より大きい
    });

    it('clearedStages=3のときzaagのHPが295であること', () => {
      setupScene({ mode: GameMode.CHALLENGE, clearedStages: 3 });
      // zaag HP基礎250 + 15*3 = 295
      const hpText = addTextCalls.find(c => c.text === 'HP: 295');
      expect(hpText).toBeDefined();
    });

    it('clearedStages=0のときは基礎値が表示されること', () => {
      setupScene({ mode: GameMode.CHALLENGE, clearedStages: 0 });
      const hpText = addTextCalls.find(c => c.text === 'HP: 250');
      expect(hpText).toBeDefined();
    });
  });

  describe('FREE_CPUモード - 最終パラメータ表示', () => {
    it('最終段階のHP（基礎値より大きい）が表示されること', () => {
      setupScene({ mode: GameMode.FREE_CPU, step: 'player' });
      const hpText = addTextCalls.find(c => c.text.startsWith('HP:'));
      expect(hpText).toBeDefined();
      const hpValue = parseInt(hpText!.text.replace('HP: ', ''));
      expect(hpValue).toBeGreaterThan(250); // 7段階成長後 = 250 + 15*7 = 355
    });
  });

  describe('モード未指定 - 基礎値表示', () => {
    it('モード未指定時はzaagの基礎HPが表示されること', () => {
      setupScene(undefined);
      const hpText = addTextCalls.find(c => c.text === 'HP: 250');
      expect(hpText).toBeDefined();
    });
  });
});
