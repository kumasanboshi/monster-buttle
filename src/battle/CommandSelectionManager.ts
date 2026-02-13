import { CommandType, BattleState, Monster } from '../types';
import { getValidCommands } from '../ai/commandValidator';

/**
 * コマンド選択フェーズ
 */
export type SelectionPhase = 'first' | 'second';

/**
 * コマンド選択状態
 */
export interface SelectionState {
  /** 1stコマンド */
  first: CommandType | null;
  /** 2ndコマンド */
  second: CommandType | null;
  /** 現在の選択フェーズ */
  phase: SelectionPhase;
}

/**
 * コマンド選択ロジックを管理するクラス
 *
 * Phaserに依存しない純粋なロジック層として、
 * コマンドの選択状態・有効性判定・スタンスラベル計算を担当する。
 */
export class CommandSelectionManager {
  private selection: SelectionState;

  constructor(
    private battleState: BattleState,
    private playerId: 'player1' | 'player2',
    private monster: Monster
  ) {
    this.selection = {
      first: null,
      second: null,
      phase: 'first',
    };
  }

  /**
   * コマンドを選択する
   * @returns 選択が成功したかどうか
   */
  selectCommand(command: CommandType): boolean {
    if (this.selection.phase === 'first') {
      this.selection.first = command;
      this.selection.phase = 'second';
      return true;
    }

    this.selection.second = command;
    return true;
  }

  /**
   * 現在の選択状態を取得
   */
  getSelection(): Readonly<SelectionState> {
    return this.selection;
  }
}
