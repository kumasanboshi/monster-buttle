import { BattleResultType, BattleResult, BattleState } from '../../types/BattleState';
import { DistanceType } from '../../types/Distance';
import { StanceType } from '../../types/Stance';
import { SceneKey } from '../../scenes/sceneKeys';
import { RESULT_TEXT, RESULT_COLORS } from '../../scenes/resultConfig';
import { GameMode } from '../../types/GameMode';

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
      }),
      rectangle: jest.fn().mockReturnValue({
        setOrigin: jest.fn().mockReturnThis(),
      }),
    };
    sound = {
      add: jest.fn().mockReturnValue({
        play: jest.fn(),
        stop: jest.fn(),
        destroy: jest.fn(),
        setVolume: jest.fn(),
        setLoop: jest.fn(),
      }),
    };
    textures = {
      exists: jest.fn().mockReturnValue(false),
    };
    constructor(config: { key: string }) {
      this.scene.key = config.key;
    }
  },
}));

// モック後にインポート
import { ResultScene, ResultSceneData } from '../../scenes/ResultScene';

/** テスト用のBattleState作成 */
function createTestBattleState(
  player1Hp: number,
  player2Hp: number
): BattleState {
  return {
    player1: {
      monsterId: 'test-monster-1',
      currentHp: player1Hp,
      currentStance: StanceType.NORMAL,
      remainingSpecialCount: 3,
      usedReflectCount: 0,
    },
    player2: {
      monsterId: 'test-monster-2',
      currentHp: player2Hp,
      currentStance: StanceType.NORMAL,
      remainingSpecialCount: 3,
      usedReflectCount: 0,
    },
    currentDistance: DistanceType.MID,
    currentTurn: 5,
    remainingTime: 60,
    isFinished: true,
  };
}

/** テスト用のBattleResult作成 */
function createTestBattleResult(
  resultType: BattleResultType,
  player1Hp = 50,
  player2Hp = 0
): BattleResult {
  return {
    resultType,
    finalState: createTestBattleState(player1Hp, player2Hp),
    turnHistory: [],
    reason: 'test reason',
  };
}

describe('ResultScene - 基本構造', () => {
  it('SceneKey.RESULTで初期化されること', () => {
    const scene = new ResultScene();
    expect((scene as any).scene.key).toBe(SceneKey.RESULT);
  });
});

describe('ResultScene - create', () => {
  let scene: ResultScene;
  let addTextCalls: any[];

  function setupScene(data?: ResultSceneData): void {
    scene = new ResultScene();
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
        };
        addTextCalls.push(mockText);
        return mockText;
      }
    );
    // transitionToをモック（BaseSceneのprotectedメソッド）
    (scene as any).transitionTo = jest.fn();

    scene.create(data);
  }

  describe('勝敗表示', () => {
    it('PLAYER1_WINの場合「勝利！」と表示すること', () => {
      const battleResult = createTestBattleResult(BattleResultType.PLAYER1_WIN);
      setupScene({ battleResult });

      const resultText = addTextCalls.find(
        (call) => call.text === RESULT_TEXT[BattleResultType.PLAYER1_WIN]
      );
      expect(resultText).toBeDefined();
    });

    it('PLAYER2_WINの場合「敗北...」と表示すること', () => {
      const battleResult = createTestBattleResult(
        BattleResultType.PLAYER2_WIN,
        0,
        50
      );
      setupScene({ battleResult });

      const resultText = addTextCalls.find(
        (call) => call.text === RESULT_TEXT[BattleResultType.PLAYER2_WIN]
      );
      expect(resultText).toBeDefined();
    });

    it('DRAWの場合「引き分け」と表示すること', () => {
      const battleResult = createTestBattleResult(
        BattleResultType.DRAW,
        30,
        30
      );
      setupScene({ battleResult });

      const resultText = addTextCalls.find(
        (call) => call.text === RESULT_TEXT[BattleResultType.DRAW]
      );
      expect(resultText).toBeDefined();
    });
  });

  describe('残りHP表示', () => {
    it('プレイヤーの最終HPを表示すること', () => {
      const battleResult = createTestBattleResult(
        BattleResultType.PLAYER1_WIN,
        75,
        0
      );
      setupScene({ battleResult });

      const hpText = addTextCalls.find(
        (call) =>
          typeof call.text === 'string' && call.text.includes('75')
      );
      expect(hpText).toBeDefined();
    });

    it('敵の最終HPを表示すること', () => {
      const battleResult = createTestBattleResult(
        BattleResultType.PLAYER2_WIN,
        0,
        42
      );
      setupScene({ battleResult });

      const hpText = addTextCalls.find(
        (call) =>
          typeof call.text === 'string' && call.text.includes('42')
      );
      expect(hpText).toBeDefined();
    });
  });

  describe('ボタン表示と遷移', () => {
    it('「次へ」「リトライ」「タイトルへ」の3ボタンが表示されること', () => {
      const battleResult = createTestBattleResult(BattleResultType.PLAYER1_WIN);
      setupScene({ battleResult });

      const nextButton = addTextCalls.find((call) => call.text === '次へ');
      const retryButton = addTextCalls.find(
        (call) => call.text === 'リトライ'
      );
      const titleButton = addTextCalls.find(
        (call) => call.text === 'タイトルへ'
      );

      expect(nextButton).toBeDefined();
      expect(retryButton).toBeDefined();
      expect(titleButton).toBeDefined();
    });

    it('ボタンがインタラクティブに設定されていること', () => {
      const battleResult = createTestBattleResult(BattleResultType.PLAYER1_WIN);
      setupScene({ battleResult });

      const buttonTexts = addTextCalls.filter((call) =>
        ['次へ', 'リトライ', 'タイトルへ'].includes(call.text)
      );

      buttonTexts.forEach((button) => {
        expect(button.setInteractive).toHaveBeenCalled();
      });
    });

    it('「タイトルへ」クリックでTITLEに遷移すること', () => {
      const battleResult = createTestBattleResult(BattleResultType.PLAYER1_WIN);
      setupScene({ battleResult });

      const titleButton = addTextCalls.find(
        (call) => call.text === 'タイトルへ'
      );
      expect(titleButton).toBeDefined();

      // pointerdownイベントハンドラを取得して呼び出す
      const onCalls = titleButton.on.mock.calls;
      const pointerdownCall = onCalls.find(
        (call: any[]) => call[0] === 'pointerdown'
      );
      expect(pointerdownCall).toBeDefined();

      // ハンドラを実行
      pointerdownCall[1]();
      expect((scene as any).transitionTo).toHaveBeenCalledWith(SceneKey.TITLE);
    });

    it('「リトライ」クリックでCHARACTER_SELECTに遷移すること', () => {
      const battleResult = createTestBattleResult(BattleResultType.PLAYER1_WIN);
      setupScene({ battleResult });

      const retryButton = addTextCalls.find(
        (call) => call.text === 'リトライ'
      );
      const onCalls = retryButton.on.mock.calls;
      const pointerdownCall = onCalls.find(
        (call: any[]) => call[0] === 'pointerdown'
      );
      pointerdownCall[1]();

      expect((scene as any).transitionTo).toHaveBeenCalledWith(
        SceneKey.CHARACTER_SELECT
      );
    });

    it('「次へ」クリックでCHARACTER_SELECTに遷移すること', () => {
      const battleResult = createTestBattleResult(BattleResultType.PLAYER1_WIN);
      setupScene({ battleResult });

      const nextButton = addTextCalls.find((call) => call.text === '次へ');
      const onCalls = nextButton.on.mock.calls;
      const pointerdownCall = onCalls.find(
        (call: any[]) => call[0] === 'pointerdown'
      );
      pointerdownCall[1]();

      expect((scene as any).transitionTo).toHaveBeenCalledWith(
        SceneKey.CHARACTER_SELECT
      );
    });
  });

  describe('データなしの場合', () => {
    it('BattleResultがない場合でもエラーにならないこと', () => {
      expect(() => setupScene()).not.toThrow();
      expect(() => setupScene({})).not.toThrow();
    });
  });

  describe('FREE_CPUモード', () => {
    it('「もう一度」「タイトルへ」の2ボタンが表示されること', () => {
      const battleResult = createTestBattleResult(BattleResultType.PLAYER1_WIN);
      setupScene({ battleResult, mode: GameMode.FREE_CPU });

      const againButton = addTextCalls.find((call) => call.text === 'もう一度');
      const titleButton = addTextCalls.find((call) => call.text === 'タイトルへ');
      expect(againButton).toBeDefined();
      expect(titleButton).toBeDefined();
    });

    it('「次へ」「リトライ」ボタンは表示されないこと', () => {
      const battleResult = createTestBattleResult(BattleResultType.PLAYER1_WIN);
      setupScene({ battleResult, mode: GameMode.FREE_CPU });

      const nextButton = addTextCalls.find((call) => call.text === '次へ');
      const retryButton = addTextCalls.find((call) => call.text === 'リトライ');
      expect(nextButton).toBeUndefined();
      expect(retryButton).toBeUndefined();
    });

    it('「もう一度」クリックでCHARACTER_SELECTにmode=FREE_CPU, step=playerで遷移すること', () => {
      const battleResult = createTestBattleResult(BattleResultType.PLAYER1_WIN);
      setupScene({ battleResult, mode: GameMode.FREE_CPU });

      const againButton = addTextCalls.find((call) => call.text === 'もう一度');
      const onCalls = againButton.on.mock.calls;
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

    it('「タイトルへ」クリックでTITLEに遷移すること', () => {
      const battleResult = createTestBattleResult(BattleResultType.PLAYER1_WIN);
      setupScene({ battleResult, mode: GameMode.FREE_CPU });

      const titleButton = addTextCalls.find((call) => call.text === 'タイトルへ');
      const onCalls = titleButton.on.mock.calls;
      const pointerdownCall = onCalls.find(
        (call: any[]) => call[0] === 'pointerdown',
      );
      pointerdownCall[1]();

      expect((scene as any).transitionTo).toHaveBeenCalledWith(SceneKey.TITLE);
    });
  });
});
