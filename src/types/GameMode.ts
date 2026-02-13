/**
 * ゲームモード
 *
 * プレイヤーが選択可能な対戦モードを定義する。
 */
export enum GameMode {
  /** 挑戦モード */
  CHALLENGE = 'CHALLENGE',
  /** 自由対戦（CPU） */
  FREE_CPU = 'FREE_CPU',
  /** 自由対戦（ローカル） */
  FREE_LOCAL = 'FREE_LOCAL',
}
