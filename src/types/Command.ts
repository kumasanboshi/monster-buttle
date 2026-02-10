/**
 * コマンドタイプ（7種類）
 */
export enum CommandType {
  /** 前進 */
  ADVANCE = 'ADVANCE',
  /** 後退 */
  RETREAT = 'RETREAT',
  /** 武器攻撃 */
  WEAPON_ATTACK = 'WEAPON_ATTACK',
  /** 特殊攻撃 */
  SPECIAL_ATTACK = 'SPECIAL_ATTACK',
  /** リフレクター */
  REFLECTOR = 'REFLECTOR',
  /** スタンスA切替 */
  STANCE_A = 'STANCE_A',
  /** スタンスB切替 */
  STANCE_B = 'STANCE_B',
}

/**
 * 単一コマンド
 */
export interface Command {
  /** コマンドタイプ */
  type: CommandType;
}

/**
 * ターンごとの2コマンド
 */
export interface TurnCommands {
  /** 1stコマンド */
  first: Command;
  /** 2ndコマンド */
  second: Command;
}
