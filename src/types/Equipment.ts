/**
 * 武器
 */
export interface Weapon {
  /** 武器名 */
  name: string;
  /** 攻撃倍率（Type A: 1.6, Type B: 1.4） */
  multiplier: number;
}

/**
 * リフレクター
 */
export interface Reflector {
  /** リフレクター名 */
  name: string;
  /** 反射可能回数（Type A: 2回, Type B: 3回） */
  maxReflectCount: number;
  /** 反射率（Type A: 0.5, Type B: 0.6） */
  reflectRate: number;
}

/**
 * 装備セット
 */
export interface EquipmentSet {
  /** 武器 */
  weapon: Weapon;
  /** リフレクター */
  reflector: Reflector;
}

/**
 * 装備タイプ
 * - Type A: 攻撃寄り（武器倍率1.6, リフレクター2回, 反射率0.5）
 * - Type B: 防御寄り（武器倍率1.4, リフレクター3回, 反射率0.6）
 */
export type EquipmentType = 'A' | 'B';
