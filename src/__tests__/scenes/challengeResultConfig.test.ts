import { getResultButtons } from '../../scenes/resultConfig';
import { SceneKey } from '../../scenes/sceneKeys';
import { GameMode } from '../../types/GameMode';
import { BattleResultType } from '../../types/BattleState';

describe('getResultButtons (CHALLENGE)', () => {
  describe('勝利 + ステージ1〜7', () => {
    it('3つのボタンが返されること', () => {
      const buttons = getResultButtons(GameMode.CHALLENGE, {
        stageNumber: 3,
        resultType: BattleResultType.PLAYER1_WIN,
      });
      expect(buttons).toHaveLength(3);
    });

    it('「次へ」ボタンがBATTLEへの遷移であること', () => {
      const buttons = getResultButtons(GameMode.CHALLENGE, {
        stageNumber: 5,
        resultType: BattleResultType.PLAYER1_WIN,
      });
      const nextBtn = buttons.find((b) => b.label === '次へ');
      expect(nextBtn).toBeDefined();
      expect(nextBtn!.targetScene).toBe(SceneKey.BATTLE);
    });

    it('「リトライ」ボタンがBATTLEへの遷移であること', () => {
      const buttons = getResultButtons(GameMode.CHALLENGE, {
        stageNumber: 5,
        resultType: BattleResultType.PLAYER1_WIN,
      });
      const retryBtn = buttons.find((b) => b.label === 'リトライ');
      expect(retryBtn).toBeDefined();
      expect(retryBtn!.targetScene).toBe(SceneKey.BATTLE);
    });

    it('「タイトルへ」ボタンがTITLEへの遷移であること', () => {
      const buttons = getResultButtons(GameMode.CHALLENGE, {
        stageNumber: 5,
        resultType: BattleResultType.PLAYER1_WIN,
      });
      const titleBtn = buttons.find((b) => b.label === 'タイトルへ');
      expect(titleBtn).toBeDefined();
      expect(titleBtn!.targetScene).toBe(SceneKey.TITLE);
    });

    it('ステージ1でも3つのボタンが返されること', () => {
      const buttons = getResultButtons(GameMode.CHALLENGE, {
        stageNumber: 1,
        resultType: BattleResultType.PLAYER1_WIN,
      });
      expect(buttons).toHaveLength(3);
    });

    it('ステージ7でも3つのボタンが返されること', () => {
      const buttons = getResultButtons(GameMode.CHALLENGE, {
        stageNumber: 7,
        resultType: BattleResultType.PLAYER1_WIN,
      });
      expect(buttons).toHaveLength(3);
    });
  });

  describe('勝利 + ステージ8（最終）', () => {
    it('1つのボタンのみ返されること', () => {
      const buttons = getResultButtons(GameMode.CHALLENGE, {
        stageNumber: 8,
        resultType: BattleResultType.PLAYER1_WIN,
      });
      expect(buttons).toHaveLength(1);
    });

    it('「タイトルへ」ボタンのみであること', () => {
      const buttons = getResultButtons(GameMode.CHALLENGE, {
        stageNumber: 8,
        resultType: BattleResultType.PLAYER1_WIN,
      });
      expect(buttons[0].label).toBe('タイトルへ');
      expect(buttons[0].targetScene).toBe(SceneKey.TITLE);
    });
  });

  describe('敗北', () => {
    it('2つのボタンが返されること', () => {
      const buttons = getResultButtons(GameMode.CHALLENGE, {
        stageNumber: 3,
        resultType: BattleResultType.PLAYER2_WIN,
      });
      expect(buttons).toHaveLength(2);
    });

    it('「リトライ」ボタンがBATTLEへの遷移であること', () => {
      const buttons = getResultButtons(GameMode.CHALLENGE, {
        stageNumber: 3,
        resultType: BattleResultType.PLAYER2_WIN,
      });
      const retryBtn = buttons.find((b) => b.label === 'リトライ');
      expect(retryBtn).toBeDefined();
      expect(retryBtn!.targetScene).toBe(SceneKey.BATTLE);
    });

    it('「タイトルへ」ボタンがTITLEへの遷移であること', () => {
      const buttons = getResultButtons(GameMode.CHALLENGE, {
        stageNumber: 3,
        resultType: BattleResultType.PLAYER2_WIN,
      });
      const titleBtn = buttons.find((b) => b.label === 'タイトルへ');
      expect(titleBtn).toBeDefined();
      expect(titleBtn!.targetScene).toBe(SceneKey.TITLE);
    });
  });

  describe('ドロー', () => {
    it('2つのボタンが返されること', () => {
      const buttons = getResultButtons(GameMode.CHALLENGE, {
        stageNumber: 4,
        resultType: BattleResultType.DRAW,
      });
      expect(buttons).toHaveLength(2);
    });

    it('「リトライ」と「タイトルへ」のみであること', () => {
      const buttons = getResultButtons(GameMode.CHALLENGE, {
        stageNumber: 4,
        resultType: BattleResultType.DRAW,
      });
      expect(buttons.map((b) => b.label)).toEqual(['リトライ', 'タイトルへ']);
    });
  });

  describe('既存モードとの互換性', () => {
    it('モード未指定でデフォルトボタンが返されること', () => {
      const buttons = getResultButtons();
      expect(buttons).toHaveLength(3);
    });

    it('FREE_CPUモードで2つのボタンが返されること', () => {
      const buttons = getResultButtons(GameMode.FREE_CPU);
      expect(buttons).toHaveLength(2);
    });
  });
});
