import { GAME_WIDTH, GAME_HEIGHT } from '../../scenes/gameConfig';
import { BattleResultType } from '../../types/BattleState';
import { SceneKey } from '../../scenes/sceneKeys';
import {
  RESULT_LAYOUT,
  RESULT_COLORS,
  RESULT_TEXT,
  RESULT_BUTTON_CONFIG,
  getResultButtons,
} from '../../scenes/resultConfig';
import { GameMode } from '../../types/GameMode';

describe('RESULT_LAYOUT', () => {
  it('すべてのレイアウト定数が正の数であること', () => {
    expect(RESULT_LAYOUT.resultTextY).toBeGreaterThan(0);
    expect(RESULT_LAYOUT.hpDisplayY).toBeGreaterThan(0);
    expect(RESULT_LAYOUT.buttonStartY).toBeGreaterThan(0);
    expect(RESULT_LAYOUT.buttonSpacing).toBeGreaterThan(0);
  });

  it('レイアウトが画面内に収まること', () => {
    expect(RESULT_LAYOUT.resultTextY).toBeLessThan(GAME_HEIGHT);
    expect(RESULT_LAYOUT.hpDisplayY).toBeLessThan(GAME_HEIGHT);
    expect(RESULT_LAYOUT.buttonStartY).toBeLessThan(GAME_HEIGHT);

    // 最後のボタンも画面内に収まること（3ボタン分）
    const lastButtonY =
      RESULT_LAYOUT.buttonStartY + 2 * RESULT_LAYOUT.buttonSpacing;
    expect(lastButtonY).toBeLessThan(GAME_HEIGHT);
  });

  it('要素のY座標が上から順に配置されていること', () => {
    expect(RESULT_LAYOUT.resultTextY).toBeLessThan(RESULT_LAYOUT.hpDisplayY);
    expect(RESULT_LAYOUT.hpDisplayY).toBeLessThan(RESULT_LAYOUT.buttonStartY);
  });
});

describe('RESULT_COLORS', () => {
  it('勝利色が数値であること', () => {
    expect(typeof RESULT_COLORS.winColor).toBe('number');
  });

  it('敗北色が数値であること', () => {
    expect(typeof RESULT_COLORS.loseColor).toBe('number');
  });

  it('ドロー色が数値であること', () => {
    expect(typeof RESULT_COLORS.drawColor).toBe('number');
  });

  it('テキスト色が文字列であること', () => {
    expect(typeof RESULT_COLORS.textColor).toBe('string');
    expect(RESULT_COLORS.textColor).toMatch(/^#[0-9a-fA-F]{6}$/);
  });

  it('ボタンテキスト色が文字列であること', () => {
    expect(typeof RESULT_COLORS.buttonText).toBe('string');
    expect(RESULT_COLORS.buttonText).toMatch(/^#[0-9a-fA-F]{6}$/);
  });
});

describe('RESULT_TEXT', () => {
  it('BattleResultTypeごとにテキストが定義されていること', () => {
    expect(RESULT_TEXT[BattleResultType.PLAYER1_WIN]).toBeDefined();
    expect(RESULT_TEXT[BattleResultType.PLAYER2_WIN]).toBeDefined();
    expect(RESULT_TEXT[BattleResultType.DRAW]).toBeDefined();
  });

  it('PLAYER1_WINが「勝利！」であること', () => {
    expect(RESULT_TEXT[BattleResultType.PLAYER1_WIN]).toBe('勝利！');
  });

  it('PLAYER2_WINが「敗北...」であること', () => {
    expect(RESULT_TEXT[BattleResultType.PLAYER2_WIN]).toBe('敗北...');
  });

  it('DRAWが「引き分け」であること', () => {
    expect(RESULT_TEXT[BattleResultType.DRAW]).toBe('引き分け');
  });
});

describe('RESULT_BUTTON_CONFIG', () => {
  it('3つのボタンが定義されていること', () => {
    expect(RESULT_BUTTON_CONFIG).toHaveLength(3);
  });

  it('すべてのボタンにlabelとtargetSceneがあること', () => {
    RESULT_BUTTON_CONFIG.forEach((button) => {
      expect(button.label).toBeDefined();
      expect(typeof button.label).toBe('string');
      expect(button.targetScene).toBeDefined();
    });
  });

  it('「次へ」ボタンの遷移先がCHARACTER_SELECTであること', () => {
    const nextButton = RESULT_BUTTON_CONFIG.find((b) => b.label === '次へ');
    expect(nextButton).toBeDefined();
    expect(nextButton!.targetScene).toBe(SceneKey.CHARACTER_SELECT);
  });

  it('「リトライ」ボタンの遷移先がCHARACTER_SELECTであること', () => {
    const retryButton = RESULT_BUTTON_CONFIG.find(
      (b) => b.label === 'リトライ'
    );
    expect(retryButton).toBeDefined();
    expect(retryButton!.targetScene).toBe(SceneKey.CHARACTER_SELECT);
  });

  it('「タイトルへ」ボタンの遷移先がTITLEであること', () => {
    const titleButton = RESULT_BUTTON_CONFIG.find(
      (b) => b.label === 'タイトルへ'
    );
    expect(titleButton).toBeDefined();
    expect(titleButton!.targetScene).toBe(SceneKey.TITLE);
  });
});

describe('getResultButtons', () => {
  describe('モード未指定（デフォルト）', () => {
    it('デフォルトのRESULT_BUTTON_CONFIGと同じボタンを返すこと', () => {
      const buttons = getResultButtons();
      expect(buttons).toEqual(RESULT_BUTTON_CONFIG);
    });
  });

  describe('FREE_CPUモード', () => {
    it('2つのボタンが返されること', () => {
      const buttons = getResultButtons(GameMode.FREE_CPU);
      expect(buttons).toHaveLength(2);
    });

    it('「もう一度」ボタンが含まれること', () => {
      const buttons = getResultButtons(GameMode.FREE_CPU);
      const againBtn = buttons.find((b) => b.label === 'もう一度');
      expect(againBtn).toBeDefined();
      expect(againBtn!.targetScene).toBe(SceneKey.CHARACTER_SELECT);
    });

    it('「タイトルへ」ボタンが含まれること', () => {
      const buttons = getResultButtons(GameMode.FREE_CPU);
      const titleBtn = buttons.find((b) => b.label === 'タイトルへ');
      expect(titleBtn).toBeDefined();
      expect(titleBtn!.targetScene).toBe(SceneKey.TITLE);
    });
  });
});
