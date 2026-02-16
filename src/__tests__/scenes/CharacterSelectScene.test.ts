import { SceneKey } from '../../scenes/sceneKeys';
import { GameMode } from '../../types/GameMode';
import { CHARACTER_SELECT_HEADERS } from '../../scenes/characterSelectConfig';

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
        setStrokeStyle: jest.fn().mockReturnThis(),
        on: jest.fn().mockReturnThis(),
        input: true,
        list: [],
      }),
      container: jest.fn().mockReturnValue({
        add: jest.fn(),
        list: [],
      }),
      image: jest.fn().mockReturnValue({
        setOrigin: jest.fn().mockReturnThis(),
        setScale: jest.fn().mockReturnThis(),
      }),
    };
    textures = {
      exists: jest.fn().mockReturnValue(false),
    };
    input = {
      on: jest.fn(),
    };
    constructor(config: { key: string }) {
      this.scene.key = config.key;
    }
  },
}));

import { CharacterSelectScene } from '../../scenes/CharacterSelectScene';

describe('CharacterSelectScene', () => {
  let scene: CharacterSelectScene;
  let addTextCalls: any[];

  function setupScene(data?: object): void {
    scene = new CharacterSelectScene();
    addTextCalls = [];

    // containerのモックを改善（gridCellsで使われる）
    (scene as any).add.container.mockImplementation((x: number, y: number) => {
      const mockContainer = {
        x,
        y,
        add: jest.fn(),
        list: [
          {
            // 背景rect
            setFillStyle: jest.fn(),
            setStrokeStyle: jest.fn(),
            setInteractive: jest.fn().mockReturnThis(),
            on: jest.fn().mockReturnThis(),
            input: true,
          },
        ],
      };
      return mockContainer;
    });

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
          destroy: jest.fn(),
        };
        addTextCalls.push(mockText);
        return mockText;
      },
    );

    (scene as any).add.rectangle.mockImplementation(
      (x: number, y: number, w: number, h: number, color?: number) => {
        return {
          x,
          y,
          width: w,
          height: h,
          fillColor: color,
          setOrigin: jest.fn().mockReturnThis(),
          setInteractive: jest.fn().mockReturnThis(),
          setFillStyle: jest.fn().mockReturnThis(),
          setStrokeStyle: jest.fn().mockReturnThis(),
          on: jest.fn().mockReturnThis(),
          input: true,
        };
      },
    );

    (scene as any).transitionTo = jest.fn();
    scene.create(data);
  }

  describe('初期化', () => {
    it('SceneKey.CHARACTER_SELECTで初期化されること', () => {
      const s = new CharacterSelectScene();
      expect((s as any).scene.key).toBe(SceneKey.CHARACTER_SELECT);
    });
  });

  describe('FREE_CPU - step=player', () => {
    it('ヘッダーが「キャラ選択（自分）」であること', () => {
      setupScene({ mode: GameMode.FREE_CPU, step: 'player' });
      const header = addTextCalls.find(
        (call) => call.text === CHARACTER_SELECT_HEADERS.player,
      );
      expect(header).toBeDefined();
    });

    it('決定ボタンクリックでCHARACTER_SELECT(step=opponent)に遷移すること', () => {
      setupScene({ mode: GameMode.FREE_CPU, step: 'player' });
      const confirmBtn = addTextCalls.find((call) => call.text === '決定');
      expect(confirmBtn).toBeDefined();

      const onCalls = confirmBtn.on.mock.calls;
      const pointerdownCall = onCalls.find(
        (call: any[]) => call[0] === 'pointerdown',
      );
      expect(pointerdownCall).toBeDefined();
      pointerdownCall[1]();

      expect((scene as any).transitionTo).toHaveBeenCalledWith(
        SceneKey.CHARACTER_SELECT,
        expect.objectContaining({
          mode: GameMode.FREE_CPU,
          step: 'opponent',
          playerMonsterId: expect.any(String),
        }),
      );
    });

    it('戻るボタンクリックでTITLEに遷移すること', () => {
      setupScene({ mode: GameMode.FREE_CPU, step: 'player' });
      const backBtn = addTextCalls.find((call) => call.text === '戻る');
      expect(backBtn).toBeDefined();

      const onCalls = backBtn.on.mock.calls;
      const pointerdownCall = onCalls.find(
        (call: any[]) => call[0] === 'pointerdown',
      );
      pointerdownCall[1]();

      expect((scene as any).transitionTo).toHaveBeenCalledWith(SceneKey.TITLE);
    });
  });

  describe('FREE_CPU - step=opponent', () => {
    it('ヘッダーが「キャラ選択（相手）」であること', () => {
      setupScene({ mode: GameMode.FREE_CPU, step: 'opponent', playerMonsterId: 'zaag' });
      const header = addTextCalls.find(
        (call) => call.text === CHARACTER_SELECT_HEADERS.opponent,
      );
      expect(header).toBeDefined();
    });

    it('決定ボタンクリックでDIFFICULTY_SELECTに遷移すること', () => {
      setupScene({ mode: GameMode.FREE_CPU, step: 'opponent', playerMonsterId: 'zaag' });
      const confirmBtn = addTextCalls.find((call) => call.text === '決定');
      expect(confirmBtn).toBeDefined();

      const onCalls = confirmBtn.on.mock.calls;
      const pointerdownCall = onCalls.find(
        (call: any[]) => call[0] === 'pointerdown',
      );
      pointerdownCall[1]();

      expect((scene as any).transitionTo).toHaveBeenCalledWith(
        SceneKey.DIFFICULTY_SELECT,
        expect.objectContaining({
          mode: GameMode.FREE_CPU,
          playerMonsterId: 'zaag',
          enemyMonsterId: expect.any(String),
        }),
      );
    });

    it('戻るボタンクリックでCHARACTER_SELECT(step=player)に遷移すること', () => {
      setupScene({ mode: GameMode.FREE_CPU, step: 'opponent', playerMonsterId: 'zaag' });
      const backBtn = addTextCalls.find((call) => call.text === '戻る');
      expect(backBtn).toBeDefined();

      const onCalls = backBtn.on.mock.calls;
      const pointerdownCall = onCalls.find(
        (call: any[]) => call[0] === 'pointerdown',
      );
      pointerdownCall[1]();

      expect((scene as any).transitionTo).toHaveBeenCalledWith(
        SceneKey.CHARACTER_SELECT,
        expect.objectContaining({
          mode: GameMode.FREE_CPU,
          step: 'player',
        }),
      );
    });

    it('ランダムボタンが表示されること', () => {
      setupScene({ mode: GameMode.FREE_CPU, step: 'opponent', playerMonsterId: 'zaag' });
      const randomBtn = addTextCalls.find((call) => call.text === 'ランダム');
      expect(randomBtn).toBeDefined();
    });

    it('ランダムボタンクリックでDIFFICULTY_SELECTに enemyMonsterId=null で遷移すること', () => {
      setupScene({ mode: GameMode.FREE_CPU, step: 'opponent', playerMonsterId: 'zaag' });
      const randomBtn = addTextCalls.find((call) => call.text === 'ランダム');
      expect(randomBtn).toBeDefined();

      const onCalls = randomBtn.on.mock.calls;
      const pointerdownCall = onCalls.find(
        (call: any[]) => call[0] === 'pointerdown',
      );
      pointerdownCall[1]();

      expect((scene as any).transitionTo).toHaveBeenCalledWith(
        SceneKey.DIFFICULTY_SELECT,
        expect.objectContaining({
          mode: GameMode.FREE_CPU,
          playerMonsterId: 'zaag',
          enemyMonsterId: null,
        }),
      );
    });
  });

  describe('デフォルト（モード未指定）', () => {
    it('ヘッダーが「キャラ選択」であること', () => {
      setupScene();
      const header = addTextCalls.find(
        (call) => call.text === CHARACTER_SELECT_HEADERS.default,
      );
      expect(header).toBeDefined();
    });
  });

  describe('FREE_CPUモードの全キャラ解放', () => {
    it('mode=FREE_CPUの場合、全8キャラが解放されていること', () => {
      setupScene({ mode: GameMode.FREE_CPU, step: 'player' });
      // containerは8つ生成されるはず（全キャラ分）
      const containerCalls = (scene as any).add.container.mock.calls;
      expect(containerCalls.length).toBe(8);
    });
  });
});
