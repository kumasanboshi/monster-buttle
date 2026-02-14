import { CommandType } from '../types/Command';

/**
 * チュートリアルターン定義
 */
export interface TutorialTurnDef {
  /** ターン番号 */
  turn: number;
  /** プレイヤーの固定コマンド */
  playerCommands: { first: CommandType; second: CommandType };
  /** 敵の固定コマンド */
  enemyCommands: { first: CommandType; second: CommandType };
  /** ポップアップメッセージ */
  popupMessage: string;
}

/** チュートリアル対象ステージ番号 */
export const TUTORIAL_STAGE_NUMBER = 1;

/** チュートリアル固定ターンの最終ターン */
export const TUTORIAL_LAST_FIXED_TURN = 5;

/** ターン6以降の自由戦闘メッセージ */
export const TUTORIAL_FREE_BATTLE_MESSAGE = '自由に戦ってみよう！';

/**
 * チュートリアル固定ターン定義（ターン1〜5）
 */
export const TUTORIAL_TURNS: TutorialTurnDef[] = [
  {
    turn: 1,
    playerCommands: { first: CommandType.ADVANCE, second: CommandType.ADVANCE },
    enemyCommands: { first: CommandType.ADVANCE, second: CommandType.ADVANCE },
    popupMessage: '前進で距離を詰めよう',
  },
  {
    turn: 2,
    playerCommands: { first: CommandType.WEAPON_ATTACK, second: CommandType.WEAPON_ATTACK },
    enemyCommands: { first: CommandType.ADVANCE, second: CommandType.ADVANCE },
    popupMessage: '武器攻撃で攻撃しよう',
  },
  {
    turn: 3,
    playerCommands: { first: CommandType.SPECIAL_ATTACK, second: CommandType.SPECIAL_ATTACK },
    enemyCommands: { first: CommandType.RETREAT, second: CommandType.RETREAT },
    popupMessage: '特殊攻撃は距離に関係なく当たる',
  },
  {
    turn: 4,
    playerCommands: { first: CommandType.REFLECTOR, second: CommandType.REFLECTOR },
    enemyCommands: { first: CommandType.SPECIAL_ATTACK, second: CommandType.SPECIAL_ATTACK },
    popupMessage: 'リフレクターで特殊攻撃を跳ね返せ',
  },
  {
    turn: 5,
    playerCommands: { first: CommandType.STANCE_A, second: CommandType.WEAPON_ATTACK },
    enemyCommands: { first: CommandType.ADVANCE, second: CommandType.ADVANCE },
    popupMessage: 'スタンス切替で攻撃力UP',
  },
];
