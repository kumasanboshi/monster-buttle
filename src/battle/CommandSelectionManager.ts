import { CommandType, TurnCommands, BattleState, Monster } from '../types';
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
    const validCommands = this.getValidCommands();
    if (!validCommands.includes(command)) {
      return false;
    }

    if (this.selection.phase === 'first') {
      this.selection.first = command;
      this.selection.phase = 'second';
      return true;
    }

    this.selection.second = command;
    return true;
  }

  /**
   * 現在の状態で有効なコマンド一覧を取得
   */
  getValidCommands(): CommandType[] {
    return getValidCommands(this.battleState, this.playerId, this.monster);
  }

  /**
   * 直前の選択をキャンセルする
   * - 2nd選択済み → 2ndをクリアし2nd選択フェーズに戻る
   * - 1st選択済み（2nd選択フェーズ） → 1stをクリアし1st選択フェーズに戻る
   * - 未選択 → 何もしない
   */
  cancelSelection(): void {
    if (this.selection.second !== null) {
      this.selection.second = null;
      return;
    }
    if (this.selection.first !== null) {
      this.selection.first = null;
      this.selection.phase = 'first';
    }
  }

  /**
   * 両方のコマンドが選択済みかどうか
   */
  canConfirm(): boolean {
    return this.selection.first !== null && this.selection.second !== null;
  }

  /**
   * 選択を確定し、TurnCommandsを返す
   * @returns 確定できない場合はnull
   */
  confirmSelection(): TurnCommands | null {
    if (!this.canConfirm()) {
      return null;
    }
    return {
      first: { type: this.selection.first! },
      second: { type: this.selection.second! },
    };
  }

  /**
   * 現在の選択状態を取得
   */
  getSelection(): Readonly<SelectionState> {
    return this.selection;
  }
}
