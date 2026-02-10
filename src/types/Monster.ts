import { Weapon, Reflector } from './Equipment';
import { StanceType } from './Stance';

/**
 * モンスターの基礎パラメータ
 */
export interface MonsterStats {
  /** 体力（最大HP） */
  hp: number;
  /** 腕力（武器攻撃力） */
  strength: number;
  /** 特殊（特殊攻撃力） */
  special: number;
  /** 素早さ（回避率に影響） */
  speed: number;
  /** 丈夫さ（物理防御力） */
  toughness: number;
  /** 特殊攻撃の使用可能回数 */
  specialAttackCount: number;
}

/**
 * モンスターの完全な定義
 */
export interface Monster {
  /** 一意識別子 */
  id: string;
  /** 個体名（例: レイン） */
  name: string;
  /** 魂格名（例: ザーグ） */
  species: string;
  /** 基礎パラメータ */
  stats: MonsterStats;
  /** 装備武器 */
  weapon: Weapon;
  /** 装備リフレクター */
  reflector: Reflector;
}

/**
 * バトル中のモンスター状態
 */
export interface MonsterBattleState {
  /** 参照するモンスターのID */
  monsterId: string;
  /** 現在HP */
  currentHp: number;
  /** 現在のスタンス */
  currentStance: StanceType;
  /** 残り特殊攻撃回数 */
  remainingSpecialCount: number;
  /** 使用したリフレクター回数 */
  usedReflectCount: number;
}
