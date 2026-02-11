import { CommandType } from '../types';
import { SpeciesTendency } from './types';

/**
 * デフォルト（バランス型）の傾向
 */
const DEFAULT_TENDENCY: SpeciesTendency = {
  [CommandType.ADVANCE]: 1.0,
  [CommandType.RETREAT]: 1.0,
  [CommandType.WEAPON_ATTACK]: 1.0,
  [CommandType.SPECIAL_ATTACK]: 1.0,
  [CommandType.REFLECTOR]: 1.0,
  [CommandType.STANCE_A]: 1.0,
  [CommandType.STANCE_B]: 1.0,
};

/**
 * 種族別AI傾向データ
 *
 * 全AIレベル共通で定義（ただしLv1では使用しない）。
 * Lv2以降で各種族の強みを活かした行動に重み付けを行う。
 * 重み1.0 = 基準、>1.0 = 選びやすい、<1.0 = 選びにくい
 *
 * 注意: STANCE_A/STANCE_Bの意味は現在のスタンスにより変動する。
 * （NORMAL時: A→攻勢, B→守勢 / OFFENSIVE時: A→通常, B→守勢 / DEFENSIVE時: A→通常, B→攻勢）
 * ここでの重みは「スタンス切替コマンドを選ぶ傾向」を表し、
 * 遷移先のスタンスの適切さはLv2以降のAIロジックで判断する。
 */
export const SPECIES_TENDENCIES: Record<string, SpeciesTendency> = {
  // 剣士（ザーグ）: バランス型（状況対応）
  zaag: {
    [CommandType.ADVANCE]: 1.0,
    [CommandType.RETREAT]: 1.0,
    [CommandType.WEAPON_ATTACK]: 1.0,
    [CommandType.SPECIAL_ATTACK]: 1.0,
    [CommandType.REFLECTOR]: 1.0,
    [CommandType.STANCE_A]: 1.0,
    [CommandType.STANCE_B]: 1.0,
  },
  // ゴーレム（ガルダン）: 前進＋武器攻撃重視
  gardan: {
    [CommandType.ADVANCE]: 1.8,
    [CommandType.RETREAT]: 0.5,
    [CommandType.WEAPON_ATTACK]: 2.0,
    [CommandType.SPECIAL_ATTACK]: 0.6,
    [CommandType.REFLECTOR]: 0.8,
    [CommandType.STANCE_A]: 1.0,
    [CommandType.STANCE_B]: 0.5,
  },
  // ウィスプ（ルーナ）: 後退＋特殊攻撃重視
  roona: {
    [CommandType.ADVANCE]: 0.5,
    [CommandType.RETREAT]: 1.8,
    [CommandType.WEAPON_ATTACK]: 0.4,
    [CommandType.SPECIAL_ATTACK]: 2.0,
    [CommandType.REFLECTOR]: 1.0,
    [CommandType.STANCE_A]: 0.8,
    [CommandType.STANCE_B]: 0.8,
  },
  // ワイバーン（ゼフィル）: バランス＋スタンス切替活用
  zephyr: {
    [CommandType.ADVANCE]: 1.0,
    [CommandType.RETREAT]: 1.0,
    [CommandType.WEAPON_ATTACK]: 1.0,
    [CommandType.SPECIAL_ATTACK]: 1.0,
    [CommandType.REFLECTOR]: 0.8,
    [CommandType.STANCE_A]: 1.5,
    [CommandType.STANCE_B]: 1.5,
  },
  // 大亀（バルガ）: 守勢＋リフレクター重視
  balga: {
    [CommandType.ADVANCE]: 0.6,
    [CommandType.RETREAT]: 1.2,
    [CommandType.WEAPON_ATTACK]: 0.8,
    [CommandType.SPECIAL_ATTACK]: 0.7,
    [CommandType.REFLECTOR]: 2.0,
    [CommandType.STANCE_A]: 0.5,
    [CommandType.STANCE_B]: 1.8,
  },
  // トレント（モルス）: 守勢＋距離維持
  morsu: {
    [CommandType.ADVANCE]: 0.6,
    [CommandType.RETREAT]: 1.5,
    [CommandType.WEAPON_ATTACK]: 0.7,
    [CommandType.SPECIAL_ATTACK]: 1.0,
    [CommandType.REFLECTOR]: 1.2,
    [CommandType.STANCE_A]: 0.6,
    [CommandType.STANCE_B]: 1.5,
  },
  // ミノタウロス（グラオン）: 攻勢＋前進＋武器攻撃重視
  graon: {
    [CommandType.ADVANCE]: 1.8,
    [CommandType.RETREAT]: 0.4,
    [CommandType.WEAPON_ATTACK]: 2.2,
    [CommandType.SPECIAL_ATTACK]: 0.4,
    [CommandType.REFLECTOR]: 0.6,
    [CommandType.STANCE_A]: 1.8,
    [CommandType.STANCE_B]: 0.4,
  },
  // フェニックス（イグナ）: 遠距離維持＋特殊攻撃連打
  igna: {
    [CommandType.ADVANCE]: 0.3,
    [CommandType.RETREAT]: 2.0,
    [CommandType.WEAPON_ATTACK]: 0.3,
    [CommandType.SPECIAL_ATTACK]: 2.5,
    [CommandType.REFLECTOR]: 0.8,
    [CommandType.STANCE_A]: 0.8,
    [CommandType.STANCE_B]: 0.6,
  },
};

/**
 * 種族IDから傾向データを取得
 * 存在しない種族IDの場合はデフォルト（バランス型）を返す
 */
export function getTendencyBySpecies(speciesId: string): SpeciesTendency {
  return SPECIES_TENDENCIES[speciesId] ?? { ...DEFAULT_TENDENCY };
}
