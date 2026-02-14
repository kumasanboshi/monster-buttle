import { SceneKey } from '../../scenes/sceneKeys';
import { AILevel } from '../../ai/types';
import { GameMode } from '../../types/GameMode';
import {
  DIFFICULTY_SELECT_LABELS,
  CPU_DIFFICULTY_OPTIONS,
} from '../../scenes/difficultySelectConfig';

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
      }),
    };
    input = {
      on: jest.fn(),
    };
    constructor(config: { key: string }) {
      this.scene.key = config.key;
    }
  },
}));

import { DifficultySelectScene } from '../../scenes/DifficultySelectScene';

describe('DifficultySelectScene', () => {
  let scene: DifficultySelectScene;
  let addTextCalls: any[];

  function setupScene(data?: object): void {
    scene = new DifficultySelectScene();
    addTextCalls = [];

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
      },
    );

    (scene as any).transitionTo = jest.fn();
    scene.create(data);
  }

  describe('初期化', () => {
    it('SceneKey.DIFFICULTY_SELECTで初期化されること', () => {
      const s = new DifficultySelectScene();
      expect((s as any).scene.key).toBe(SceneKey.DIFFICULTY_SELECT);
    });
  });

  describe('タイトル表示', () => {
    it('「CPU難易度選択」が表示されること', () => {
      setupScene({
        mode: GameMode.FREE_CPU,
        playerMonsterId: 'zaag',
        enemyMonsterId: 'gardan',
      });
      const title = addTextCalls.find(
        (call) => call.text === DIFFICULTY_SELECT_LABELS.title,
      );
      expect(title).toBeDefined();
    });
  });

  describe('難易度ボタン', () => {
    it('4つの難易度ボタンが表示されること', () => {
      setupScene({
        mode: GameMode.FREE_CPU,
        playerMonsterId: 'zaag',
        enemyMonsterId: 'gardan',
      });
      for (const option of CPU_DIFFICULTY_OPTIONS) {
        const btn = addTextCalls.find((call) => call.text === option.label);
        expect(btn).toBeDefined();
      }
    });

    it.each([
      { label: '弱い', aiLevel: AILevel.LV1 },
      { label: '普通', aiLevel: AILevel.LV2 },
      { label: '強い', aiLevel: AILevel.LV4 },
      { label: '最強', aiLevel: AILevel.LV5 },
    ])('「$label」ボタンクリックでBATTLEに遷移しaiLevel=$aiLevelが渡されること', ({ label, aiLevel }) => {
      setupScene({
        mode: GameMode.FREE_CPU,
        playerMonsterId: 'zaag',
        enemyMonsterId: 'gardan',
      });
      const btn = addTextCalls.find((call) => call.text === label);
      expect(btn).toBeDefined();

      const onCalls = btn.on.mock.calls;
      const pointerdownCall = onCalls.find(
        (call: any[]) => call[0] === 'pointerdown',
      );
      expect(pointerdownCall).toBeDefined();

      pointerdownCall[1]();
      expect((scene as any).transitionTo).toHaveBeenCalledWith(
        SceneKey.BATTLE,
        expect.objectContaining({
          monsterId: 'zaag',
          enemyMonsterId: 'gardan',
          aiLevel,
          mode: GameMode.FREE_CPU,
        }),
      );
    });
  });

  describe('戻るボタン', () => {
    it('「戻る」ボタンが表示されること', () => {
      setupScene({
        mode: GameMode.FREE_CPU,
        playerMonsterId: 'zaag',
        enemyMonsterId: 'gardan',
      });
      const backBtn = addTextCalls.find(
        (call) => call.text === DIFFICULTY_SELECT_LABELS.back,
      );
      expect(backBtn).toBeDefined();
    });

    it('クリックでCHARACTER_SELECTに遷移すること', () => {
      setupScene({
        mode: GameMode.FREE_CPU,
        playerMonsterId: 'zaag',
        enemyMonsterId: 'gardan',
      });
      const backBtn = addTextCalls.find(
        (call) => call.text === DIFFICULTY_SELECT_LABELS.back,
      );

      const onCalls = backBtn.on.mock.calls;
      const pointerdownCall = onCalls.find(
        (call: any[]) => call[0] === 'pointerdown',
      );
      pointerdownCall[1]();

      expect((scene as any).transitionTo).toHaveBeenCalledWith(
        SceneKey.CHARACTER_SELECT,
        expect.objectContaining({
          mode: GameMode.FREE_CPU,
          step: 'opponent',
          playerMonsterId: 'zaag',
        }),
      );
    });
  });

  describe('ランダム敵', () => {
    it('enemyMonsterId=nullの場合でもエラーにならないこと', () => {
      expect(() =>
        setupScene({
          mode: GameMode.FREE_CPU,
          playerMonsterId: 'zaag',
          enemyMonsterId: null,
        }),
      ).not.toThrow();
    });

    it('enemyMonsterId=nullの場合、ランダム選択された敵IDがBATTLEに渡されること', () => {
      setupScene({
        mode: GameMode.FREE_CPU,
        playerMonsterId: 'zaag',
        enemyMonsterId: null,
      });

      // 「弱い」ボタンをクリック
      const btn = addTextCalls.find((call) => call.text === '弱い');
      const onCalls = btn.on.mock.calls;
      const pointerdownCall = onCalls.find(
        (call: any[]) => call[0] === 'pointerdown',
      );
      pointerdownCall[1]();

      const transitionCall = (scene as any).transitionTo.mock.calls[0];
      expect(transitionCall[0]).toBe(SceneKey.BATTLE);
      expect(transitionCall[1].monsterId).toBe('zaag');
      expect(transitionCall[1].enemyMonsterId).toBeDefined();
      expect(transitionCall[1].enemyMonsterId).not.toBe('zaag');
      expect(typeof transitionCall[1].enemyMonsterId).toBe('string');
    });
  });

  describe('データなしの場合', () => {
    it('create()がエラーにならないこと', () => {
      expect(() => setupScene()).not.toThrow();
    });
  });
});
