import { BattleState, BattleResult, BattleResultType } from '../types';

/**
 * バトル結果を生成するヘルパー
 */
function createBattleResult(
  state: BattleState,
  resultType: BattleResultType,
  reason: string
): BattleResult {
  return {
    resultType,
    finalState: { ...state, isFinished: true },
    turnHistory: [],
    reason,
  };
}

/**
 * ターン後のHP0による勝敗判定
 * 両者HPが残っていればnullを返す（バトル継続）
 */
export function checkVictoryAfterTurn(state: BattleState): BattleResult | null {
  const p1Dead = state.player1.currentHp <= 0;
  const p2Dead = state.player2.currentHp <= 0;

  if (p1Dead && p2Dead) {
    return createBattleResult(state, BattleResultType.DRAW, 'Both players HP reached 0');
  }
  if (p2Dead) {
    return createBattleResult(state, BattleResultType.PLAYER1_WIN, 'Player 2 HP reached 0');
  }
  if (p1Dead) {
    return createBattleResult(state, BattleResultType.PLAYER2_WIN, 'Player 1 HP reached 0');
  }

  return null;
}

/**
 * 制限時間切れによる勝敗判定
 * HP残量で勝敗を決定、同値ならドロー
 */
export function checkVictoryOnTimeout(state: BattleState): BattleResult {
  const finishedState = { ...state, remainingTime: 0 };
  const p1Hp = state.player1.currentHp;
  const p2Hp = state.player2.currentHp;

  if (p1Hp > p2Hp) {
    return createBattleResult(finishedState, BattleResultType.PLAYER1_WIN, 'Time expired - Player 1 has more HP');
  }
  if (p2Hp > p1Hp) {
    return createBattleResult(finishedState, BattleResultType.PLAYER2_WIN, 'Time expired - Player 2 has more HP');
  }

  return createBattleResult(finishedState, BattleResultType.DRAW, 'Time expired - Both players have same HP');
}

/**
 * ギブアップによる勝敗判定
 */
export function checkVictoryOnGiveUp(state: BattleState, giveUpPlayer: 1 | 2): BattleResult {
  const resultType = giveUpPlayer === 1 ? BattleResultType.PLAYER2_WIN : BattleResultType.PLAYER1_WIN;
  const reason = `Player ${giveUpPlayer} gave up`;

  return createBattleResult(state, resultType, reason);
}
