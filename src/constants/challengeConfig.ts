import { AILevel } from '../ai';

/**
 * 挑戦モードのステージ定義
 */
export interface ChallengeStage {
  /** ステージ番号（1〜8） */
  stageNumber: number;
  /** 敵モンスターID */
  enemyMonsterId: string;
  /** AIレベル */
  aiLevel: AILevel;
}

/**
 * 挑戦モード全8ステージの定義
 */
export const CHALLENGE_STAGES: ChallengeStage[] = [
  { stageNumber: 1, enemyMonsterId: 'gardan', aiLevel: AILevel.LV1 },
  { stageNumber: 2, enemyMonsterId: 'morsu', aiLevel: AILevel.LV1 },
  { stageNumber: 3, enemyMonsterId: 'roona', aiLevel: AILevel.LV2 },
  { stageNumber: 4, enemyMonsterId: 'balga', aiLevel: AILevel.LV2 },
  { stageNumber: 5, enemyMonsterId: 'zephyr', aiLevel: AILevel.LV3 },
  { stageNumber: 6, enemyMonsterId: 'graon', aiLevel: AILevel.LV3 },
  { stageNumber: 7, enemyMonsterId: 'igna', aiLevel: AILevel.LV4 },
  { stageNumber: 8, enemyMonsterId: 'zaag', aiLevel: AILevel.LV4 },
];

/**
 * ステージ番号からステージ情報を取得する
 */
export function getChallengeStage(stageNumber: number): ChallengeStage | undefined {
  return CHALLENGE_STAGES.find((s) => s.stageNumber === stageNumber);
}

/**
 * クリア済みステージ数から次のステージ番号を返す
 * 全クリア時はnullを返す
 */
export function getNextStageNumber(clearedStages: number): number | null {
  const next = clearedStages + 1;
  if (next > CHALLENGE_STAGES.length) return null;
  return next;
}
