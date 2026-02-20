/**
 * BattleScene LV4 AI コマンド選択テスト（Issue #79 対応）
 *
 * 挑戦モードステージ7（AILevel.LV4）で決定ボタンが機能しない問題の
 * 再現テストと修正後の動作確認。
 *
 * 根本原因:
 *   processLocalTurn() が selectCommands() を呼ぶ際に
 *   opponentMonster と turnHistory を渡していなかった。
 *   LV4 AI はこれらが undefined の場合に例外を投げるため、
 *   決定ボタンを押しても例外が発生して何も起きないように見えた。
 */
import { selectCommands } from '../../ai/aiSelector';
import { AILevel } from '../../ai/types';
import { CommandType, DistanceType, StanceType, Monster, BattleState, TurnResult } from '../../types';
import { MONSTER_DATABASE } from '../../constants/monsters';
import { getMonsterWithGrownStats } from '../../constants/monsterStats';
import { getChallengeStage } from '../../constants/challengeConfig';

/** テスト用モンスター生成 */
function createTestMonster(id: string): Monster {
  return {
    id,
    name: 'テストモンスター',
    species: 'テスト種',
    stats: { hp: 250, strength: 50, special: 50, speed: 40, toughness: 50, specialAttackCount: 5 },
    weapon: { name: 'テスト武器', multiplier: 1.6 },
    reflector: { name: 'テストリフレクター', maxReflectCount: 2, reflectRate: 0.5 },
  };
}

/** テスト用バトルステート生成 */
function createTestBattleState(
  playerMonsterId: string,
  enemyMonsterId: string
): BattleState {
  return {
    player1: {
      monsterId: playerMonsterId,
      currentHp: 250,
      currentStance: StanceType.NORMAL,
      remainingSpecialCount: 5,
      usedReflectCount: 0,
    },
    player2: {
      monsterId: enemyMonsterId,
      currentHp: 250,
      currentStance: StanceType.NORMAL,
      remainingSpecialCount: 5,
      usedReflectCount: 0,
    },
    currentDistance: DistanceType.MID,
    currentTurn: 1,
    remainingTime: 180,
    isFinished: false,
  };
}

describe('BattleScene LV4 AI - processLocalTurn の敵コマンド選択', () => {
  const playerMonster = createTestMonster('zaag');
  const enemyMonster = createTestMonster('igna');
  const state = createTestBattleState('zaag', 'igna');
  const emptyTurnHistory: TurnResult[] = [];

  // =========================================================================
  // 修正前の問題再現（BUG）
  // =========================================================================
  describe('BUG: opponentMonster/turnHistory なしの LV4 呼び出しは例外を投げる', () => {
    it('opponentMonster なしで LV4 AI を呼ぶと例外が発生する', () => {
      // processLocalTurn が修正前に行っていた呼び出し方（opponentMonster なし）
      expect(() =>
        selectCommands(state, 'player2', enemyMonster, AILevel.LV4, Math.random, undefined, emptyTurnHistory)
      ).toThrow();
    });

    it('turnHistory なしで LV4 AI を呼ぶと例外が発生する', () => {
      // processLocalTurn が修正前に行っていた呼び出し方（turnHistory なし）
      expect(() =>
        selectCommands(state, 'player2', enemyMonster, AILevel.LV4, Math.random, playerMonster, undefined)
      ).toThrow();
    });

    it('opponentMonster も turnHistory もなしで LV4 AI を呼ぶと例外が発生する（修正前の呼び出し）', () => {
      // BattleScene.processLocalTurn() の修正前のコード:
      //   selectCommands(this.battleState, 'player2', this.enemyMonster, this.enemyAILevel)
      expect(() =>
        selectCommands(state, 'player2', enemyMonster, AILevel.LV4)
      ).toThrow();
    });
  });

  // =========================================================================
  // 修正後の正しい動作（FIX）
  // =========================================================================
  describe('FIX: opponentMonster と turnHistory を渡すと LV4 AI は正常動作する', () => {
    it('playerMonster と turnHistory を渡せば LV4 AI は例外を投げない', () => {
      // processLocalTurn 修正後の呼び出し方:
      //   selectCommands(state, 'player2', enemy, aiLevel, Math.random, this.playerMonster, this.turnHistory)
      expect(() =>
        selectCommands(state, 'player2', enemyMonster, AILevel.LV4, Math.random, playerMonster, emptyTurnHistory)
      ).not.toThrow();
    });

    it('LV4 AI は TurnCommands 構造（first, second）を返す', () => {
      const result = selectCommands(
        state, 'player2', enemyMonster, AILevel.LV4,
        () => 0.5,  // 乱数固定
        playerMonster,
        emptyTurnHistory
      );
      expect(result).toHaveProperty('first');
      expect(result).toHaveProperty('second');
      expect(result.first).toHaveProperty('type');
      expect(result.second).toHaveProperty('type');
    });

    it('LV4 AI の選択コマンドは有効な CommandType である', () => {
      const result = selectCommands(
        state, 'player2', enemyMonster, AILevel.LV4,
        () => 0.5,
        playerMonster,
        emptyTurnHistory
      );
      const validTypes = Object.values(CommandType);
      expect(validTypes).toContain(result.first.type);
      expect(validTypes).toContain(result.second.type);
    });

    it('挑戦モード ステージ7 の実際の設定で LV4 AI が正常動作する', () => {
      // ステージ7の設定を challengeConfig から取得
      const stage7 = getChallengeStage(7);
      expect(stage7).toBeDefined();
      expect(stage7!.aiLevel).toBe(AILevel.LV4);

      // clearedStages=6 の状態でモンスター取得（ステージ7到達時）
      const stage7EnemyMonster = getMonsterWithGrownStats(stage7!.enemyMonsterId, 6);
      const stage7PlayerMonster = getMonsterWithGrownStats('zaag', 6);
      expect(stage7EnemyMonster).toBeDefined();
      expect(stage7PlayerMonster).toBeDefined();

      const stage7State = createTestBattleState('zaag', stage7!.enemyMonsterId);

      // 修正後のコード相当
      expect(() =>
        selectCommands(
          stage7State,
          'player2',
          stage7EnemyMonster!,
          AILevel.LV4,
          Math.random,
          stage7PlayerMonster!,  // this.playerMonster (修正で追加)
          []                      // this.turnHistory (修正で追加)
        )
      ).not.toThrow();
    });

    it('ターン履歴が空でも LV4 AI は正常動作する（第1ターンの場合）', () => {
      // 第1ターン（まだターン履歴がない状態）での動作確認
      expect(() =>
        selectCommands(
          state, 'player2', enemyMonster, AILevel.LV4,
          () => 0.5,
          playerMonster,
          []  // this.turnHistory の初期値は空配列
        )
      ).not.toThrow();
    });
  });

  // =========================================================================
  // LV1/LV2/LV3 は影響を受けないことの確認
  // =========================================================================
  describe('LV1/LV2/LV3 AI は opponentMonster/turnHistory なしでも動作する（影響なし）', () => {
    it('LV1 は opponentMonster なしで動作する', () => {
      expect(() =>
        selectCommands(state, 'player2', enemyMonster, AILevel.LV1)
      ).not.toThrow();
    });

    it('LV2 は opponentMonster なしで動作する', () => {
      expect(() =>
        selectCommands(state, 'player2', enemyMonster, AILevel.LV2)
      ).not.toThrow();
    });

    it('LV3 は opponentMonster なしで動作する（デフォルト値を使用）', () => {
      expect(() =>
        selectCommands(state, 'player2', enemyMonster, AILevel.LV3)
      ).not.toThrow();
    });
  });
});
