import { CommandType } from '../types';

/**
 * AIレベル（5段階）
 */
export enum AILevel {
  /** ほぼランダム行動 */
  LV1 = 'LV1',
  /** 距離に応じた基本行動 */
  LV2 = 'LV2',
  /** Lv2 + HP・スタンス・リフレクター考慮 */
  LV3 = 'LV3',
  /** Lv3 + 行動パターン読み */
  LV4 = 'LV4',
  /** 常に最適行動 */
  LV5 = 'LV5',
}

/**
 * 種族別AI傾向（各コマンドの重み付け）
 */
export type SpeciesTendency = Record<CommandType, number>;
