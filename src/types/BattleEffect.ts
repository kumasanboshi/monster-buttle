import { DistanceType } from './Distance';

/**
 * バトルエフェクトの種類
 */
export enum BattleEffectType {
  /** ダメージ数値表示 */
  DAMAGE_NUMBER = 'DAMAGE_NUMBER',
  /** 武器攻撃エフェクト */
  WEAPON_ATTACK = 'WEAPON_ATTACK',
  /** 特殊攻撃エフェクト */
  SPECIAL_ATTACK = 'SPECIAL_ATTACK',
  /** リフレクター発動エフェクト */
  REFLECTOR = 'REFLECTOR',
  /** 回避エフェクト */
  EVASION = 'EVASION',
  /** 距離移動アニメーション */
  DISTANCE_MOVE = 'DISTANCE_MOVE',
}

/** エフェクトのターゲット */
export type EffectTarget = 'player' | 'enemy';

/**
 * 個別のバトルエフェクト
 */
export interface BattleEffect {
  /** エフェクトの種類 */
  type: BattleEffectType;
  /** エフェクトの対象 */
  target: EffectTarget;
  /** ダメージ値等 */
  value?: number;
  /** 距離移動の開始距離 */
  distanceFrom?: DistanceType;
  /** 距離移動の終了距離 */
  distanceTo?: DistanceType;
}

/**
 * バトルエフェクトのシーケンス
 * 外側配列 = フェーズ（順次実行）
 * 内側配列 = 同時実行するエフェクト群
 */
export type BattleEffectSequence = BattleEffect[][];
