import { TurnCommands } from '../types/Command';
import { GameMode } from '../types/GameMode';
import {
  TUTORIAL_TURNS,
  TUTORIAL_STAGE_NUMBER,
  TUTORIAL_LAST_FIXED_TURN,
  TUTORIAL_FREE_BATTLE_MESSAGE,
} from '../constants/tutorialConfig';

/**
 * チュートリアルロジック（Phaser非依存）
 *
 * CHALLENGEモードのステージ1でのみ有効。
 * ターン1〜5は固定コマンド、ターン6以降は自由戦闘。
 */
export class TutorialManager {
  private readonly tutorial: boolean;
  private freeBattleMessageShown = false;

  constructor(stageNumber: number, gameMode: GameMode) {
    this.tutorial = gameMode === GameMode.CHALLENGE && stageNumber === TUTORIAL_STAGE_NUMBER;
  }

  /** チュートリアルモードかどうか */
  isTutorial(): boolean {
    return this.tutorial;
  }

  /** 指定ターンが固定コマンドターンか */
  isFixedTurn(turn: number): boolean {
    if (!this.tutorial) return false;
    return turn >= 1 && turn <= TUTORIAL_LAST_FIXED_TURN;
  }

  /** プレイヤーの固定コマンドを取得（TurnCommands形式） */
  getPlayerCommands(turn: number): TurnCommands | null {
    if (!this.tutorial || !this.isFixedTurn(turn)) return null;
    const def = TUTORIAL_TURNS.find((t) => t.turn === turn);
    if (!def) return null;
    return {
      first: { type: def.playerCommands.first },
      second: { type: def.playerCommands.second },
    };
  }

  /** 敵の固定コマンドを取得（TurnCommands形式） */
  getEnemyCommands(turn: number): TurnCommands | null {
    if (!this.tutorial || !this.isFixedTurn(turn)) return null;
    const def = TUTORIAL_TURNS.find((t) => t.turn === turn);
    if (!def) return null;
    return {
      first: { type: def.enemyCommands.first },
      second: { type: def.enemyCommands.second },
    };
  }

  /** ポップアップメッセージを取得（ターン6は初回のみ） */
  getPopupMessage(turn: number): string | null {
    if (!this.tutorial) return null;

    // 固定ターン（1〜5）
    const def = TUTORIAL_TURNS.find((t) => t.turn === turn);
    if (def) return def.popupMessage;

    // ターン6: 初回のみ自由戦闘メッセージ
    if (turn === TUTORIAL_LAST_FIXED_TURN + 1 && !this.freeBattleMessageShown) {
      return TUTORIAL_FREE_BATTLE_MESSAGE;
    }

    return null;
  }

  /** ターン6のメッセージ表示済みフラグを設定 */
  markFreeBattleMessageShown(): void {
    this.freeBattleMessageShown = true;
  }
}
