import { DistanceType } from './Distance';
import { StanceType } from './Stance';

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
  /** スタンス変更エフェクト */
  STANCE_CHANGE = 'STANCE_CHANGE',
  /** リフレクター構えエフェクト（攻撃が来なかった場合） */
  REFLECTOR_DEPLOY = 'REFLECTOR_DEPLOY',
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
  /** スタンス変更後のスタンス */
  stanceTo?: StanceType;
}

/**
 * バトルエフェクトのシーケンス
 * 外側配列 = フェーズ（順次実行）
 * 内側配列 = 同時実行するエフェクト群
 */
export type BattleEffectSequence = BattleEffect[][];
