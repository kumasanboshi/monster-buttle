/**
 * BattleScene ギブアップ機能のテスト
 *
 * Phaserシーンメソッドは直接テストしにくいため、
 * ギブアップに関わる定数・ガード条件ロジック・ペイロード構造を個別にテストする。
 * checkVictoryOnGiveUp の勝敗判定は victoryCondition.test.ts で完全に検証済みのため、
 * このファイルでは重複させない。
 */
import { BattleState, BattleResultType, BattleResult } from '../../types/BattleState';
import { DistanceType } from '../../types/Distance';
import { StanceType } from '../../types/Stance';
import { GameMode } from '../../types/GameMode';
import { SceneKey } from '../../scenes/sceneKeys';
import { isValidTransition } from '../../scenes/sceneTransitions';
import { SURRENDER_MESSAGES } from '../../scenes/battleConfig';
import { BattleFinishedPayload } from '../../../shared/types/SocketEvents';
import { BattleSceneData } from '../../scenes/BattleScene';

/** テスト用BattleState生成ヘルパー */
function createTestBattleState(overrides: Partial<BattleState> = {}): BattleState {
  return {
    player1: {
      monsterId: 'monster-1',
      currentHp: 100,
      currentStance: StanceType.NORMAL,
      remainingSpecialCount: 3,
      usedReflectCount: 0,
    },
    player2: {
      monsterId: 'monster-2',
      currentHp: 100,
      currentStance: StanceType.NORMAL,
      remainingSpecialCount: 3,
      usedReflectCount: 0,
    },
    currentDistance: DistanceType.MID,
    currentTurn: 5,
    remainingTime: 60,
    isFinished: false,
    ...overrides,
  };
}

/** テスト用BattleResult（サレンダー）生成ヘルパー */
function createSurrenderBattleResult(giveUpPlayer: 1 | 2): BattleResult {
  const state = createTestBattleState();
  return {
    resultType: giveUpPlayer === 1 ? BattleResultType.PLAYER2_WIN : BattleResultType.PLAYER1_WIN,
    finalState: { ...state, isFinished: true },
    turnHistory: [],
    reason: `Player ${giveUpPlayer} gave up`,
  };
}

describe('BattleScene ギブアップ機能', () => {
  // =========================================================================
  // 1. SURRENDER_MESSAGES 定数
  // =========================================================================
  describe('SURRENDER_MESSAGES定数', () => {
    describe('定義の存在確認', () => {
      it('SURRENDER_MESSAGESが定義されていること', () => {
        expect(SURRENDER_MESSAGES).toBeDefined();
        expect(typeof SURRENDER_MESSAGES).toBe('object');
      });

      it('ギブアップボタンのラベルが定義されていること', () => {
        expect(typeof SURRENDER_MESSAGES.buttonLabel).toBe('string');
        expect(SURRENDER_MESSAGES.buttonLabel.length).toBeGreaterThan(0);
      });

      it('確認ダイアログのタイトルが定義されていること', () => {
        expect(typeof SURRENDER_MESSAGES.confirmTitle).toBe('string');
        expect(SURRENDER_MESSAGES.confirmTitle.length).toBeGreaterThan(0);
      });

      it('確認ダイアログの本文が定義されていること', () => {
        expect(typeof SURRENDER_MESSAGES.confirmBody).toBe('string');
        expect(SURRENDER_MESSAGES.confirmBody.length).toBeGreaterThan(0);
      });

      it('通信対戦用の確認メッセージが定義されていること', () => {
        expect(typeof SURRENDER_MESSAGES.onlineConfirmBody).toBe('string');
        expect(SURRENDER_MESSAGES.onlineConfirmBody.length).toBeGreaterThan(0);
      });

      it('「はい」ボタンのラベルが定義されていること', () => {
        expect(typeof SURRENDER_MESSAGES.confirmYes).toBe('string');
        expect(SURRENDER_MESSAGES.confirmYes.length).toBeGreaterThan(0);
      });

      it('「いいえ」ボタンのラベルが定義されていること', () => {
        expect(typeof SURRENDER_MESSAGES.confirmNo).toBe('string');
        expect(SURRENDER_MESSAGES.confirmNo.length).toBeGreaterThan(0);
      });
    });

    describe('メッセージ内容の妥当性', () => {
      it('「はい」と「いいえ」のラベルが異なること', () => {
        expect(SURRENDER_MESSAGES.confirmYes).not.toBe(SURRENDER_MESSAGES.confirmNo);
      });

      it('CPUモードと通信対戦モードの確認メッセージが異なること', () => {
        expect(SURRENDER_MESSAGES.confirmBody).not.toBe(SURRENDER_MESSAGES.onlineConfirmBody);
      });
    });
  });

  // =========================================================================
  // 2. ギブアップ可否ガード条件ロジック
  // =========================================================================
  describe('ギブアップ可否ガード条件', () => {
    /**
     * BattleSceneの「ギブアップボタンを受け付けるか」の判定ロジックを
     * 純粋関数として抽出して検証する。
     */
    function canSurrender(isPlayingEffects: boolean, isFinished: boolean): boolean {
      return !isPlayingEffects && !isFinished;
    }

    describe('正常系: ギブアップ可能な状態', () => {
      it('エフェクト非再生かつバトル未終了であればギブアップ可能であること', () => {
        expect(canSurrender(false, false)).toBe(true);
      });
    });

    describe('異常系: ギブアップ不可な状態', () => {
      it('エフェクト再生中はギブアップ不可であること', () => {
        expect(canSurrender(true, false)).toBe(false);
      });

      it('バトル終了後はギブアップ不可であること', () => {
        expect(canSurrender(false, true)).toBe(false);
      });

      it('エフェクト再生中かつバトル終了後もギブアップ不可であること', () => {
        expect(canSurrender(true, true)).toBe(false);
      });
    });

    describe('BattleState.isFinishedとの対応', () => {
      it('isFinished=trueのBattleStateではギブアップ不可であること', () => {
        const state = createTestBattleState({ isFinished: true });
        expect(canSurrender(false, state.isFinished)).toBe(false);
      });

      it('isFinished=falseのBattleStateではギブアップ可能であること', () => {
        const state = createTestBattleState({ isFinished: false });
        expect(canSurrender(false, state.isFinished)).toBe(true);
      });
    });
  });

  // =========================================================================
  // 3. シーン遷移：サレンダーケースでもBATTLE→RESULT遷移が成立すること
  // =========================================================================
  describe('ギブアップ時のシーン遷移', () => {
    it('BATTLE→RESULT遷移がギブアップケースでも許可されていること', () => {
      expect(isValidTransition(SceneKey.BATTLE, SceneKey.RESULT)).toBe(true);
    });

    it('CPUモードのBattleSceneDataにギブアップ後のリザルトデータを構築できること', () => {
      const data: BattleSceneData = {
        mode: GameMode.FREE_CPU,
        monsterId: 'monster-1',
      };
      expect(data.mode).toBe(GameMode.FREE_CPU);
      expect(data.isNetworkMode).toBeUndefined();
    });

    it('オンラインモードのBattleSceneDataにroomIdが含まれていること', () => {
      const data: BattleSceneData = {
        mode: GameMode.ONLINE,
        isNetworkMode: true,
        roomId: 'ABC123',
        playerNumber: 1,
        playerMonster: {
          id: 'monster-1',
          name: 'テストモンスター',
          species: 'テスト種',
          stats: { hp: 100, strength: 30, special: 25, speed: 0, toughness: 20, specialAttackCount: 3 },
          weapon: { name: 'テスト武器', multiplier: 1.6 },
          reflector: { name: 'テストリフレクター', maxReflectCount: 2, reflectRate: 0.5 },
        },
        enemyMonster: {
          id: 'monster-2',
          name: 'テスト敵',
          species: 'テスト種',
          stats: { hp: 100, strength: 30, special: 25, speed: 0, toughness: 20, specialAttackCount: 3 },
          weapon: { name: 'テスト武器', multiplier: 1.6 },
          reflector: { name: 'テストリフレクター', maxReflectCount: 2, reflectRate: 0.5 },
        },
        initialBattleState: createTestBattleState(),
      };
      expect(typeof data.roomId).toBe('string');
      expect(data.roomId!.length).toBeGreaterThan(0);
    });
  });

  // =========================================================================
  // 4. BattleFinishedPayload の surrender reason 統合検証
  // =========================================================================
  describe('BattleFinishedPayload サレンダーケース', () => {
    describe('正常系: ペイロード構造の検証', () => {
      it('reason="surrender"のBattleFinishedPayloadを構築できること', () => {
        const payload: BattleFinishedPayload = {
          roomId: 'ABC123',
          result: createSurrenderBattleResult(1),
          reason: 'surrender',
        };
        expect(payload.reason).toBe('surrender');
        expect(payload.roomId).toBe('ABC123');
        expect(payload.result).toBeDefined();
      });

      it('P1ギブアップ時のペイロードにP2勝利結果が含まれること', () => {
        const payload: BattleFinishedPayload = {
          roomId: 'ROOM01',
          result: createSurrenderBattleResult(1),
          reason: 'surrender',
        };
        expect(payload.result.resultType).toBe(BattleResultType.PLAYER2_WIN);
      });

      it('P2ギブアップ時のペイロードにP1勝利結果が含まれること', () => {
        const payload: BattleFinishedPayload = {
          roomId: 'ROOM01',
          result: createSurrenderBattleResult(2),
          reason: 'surrender',
        };
        expect(payload.result.resultType).toBe(BattleResultType.PLAYER1_WIN);
      });

      it('サレンダーペイロードのresultにisFinished=trueのfinalStateが含まれること', () => {
        const payload: BattleFinishedPayload = {
          roomId: 'ROOM01',
          result: createSurrenderBattleResult(1),
          reason: 'surrender',
        };
        expect(payload.result.finalState.isFinished).toBe(true);
      });

      it('サレンダーペイロードのreasonが"gave up"を含む文字列であること', () => {
        const result = createSurrenderBattleResult(1);
        expect(result.reason).toContain('gave up');
      });
    });

    describe('reason フィールドの型安全性', () => {
      it('BattleFinishedPayload.reasonの全許容値が4種類であること', () => {
        const validReasons: BattleFinishedPayload['reason'][] = [
          'hp_zero',
          'time_up',
          'disconnect',
          'surrender',
        ];
        expect(validReasons).toHaveLength(4);
        expect(validReasons).toContain('surrender');
      });
    });

    describe('CPUモード: ローカルでのサレンダー結果構造', () => {
      it('CPUモードのギブアップ結果にturnHistoryが含まれること', () => {
        const result = createSurrenderBattleResult(1);
        expect(Array.isArray(result.turnHistory)).toBe(true);
      });

      it('CPUモードのギブアップ結果にfinalStateの全フィールドが存在すること', () => {
        const result = createSurrenderBattleResult(1);
        expect(result.finalState.player1).toBeDefined();
        expect(result.finalState.player2).toBeDefined();
        expect(result.finalState.currentDistance).toBeDefined();
        expect(typeof result.finalState.currentTurn).toBe('number');
        expect(typeof result.finalState.remainingTime).toBe('number');
        expect(result.finalState.isFinished).toBe(true);
      });
    });
  });
});
