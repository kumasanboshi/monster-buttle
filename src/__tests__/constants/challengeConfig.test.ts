import {
  CHALLENGE_STAGES,
  getChallengeStage,
  getNextStageNumber,
  ChallengeStage,
} from '../../constants/challengeConfig';
import { AILevel } from '../../ai';
import { MONSTER_DATABASE } from '../../constants/monsters';

describe('CHALLENGE_STAGES', () => {
  it('8ステージが定義されていること', () => {
    expect(CHALLENGE_STAGES).toHaveLength(8);
  });

  it('ステージ番号が1〜8の連番であること', () => {
    CHALLENGE_STAGES.forEach((stage, index) => {
      expect(stage.stageNumber).toBe(index + 1);
    });
  });

  it('すべてのenemyMonsterIdが存在するモンスターであること', () => {
    const monsterIds = MONSTER_DATABASE.map((m) => m.id);
    CHALLENGE_STAGES.forEach((stage) => {
      expect(monsterIds).toContain(stage.enemyMonsterId);
    });
  });

  it('すべてのaiLevelが有効なAILevelであること', () => {
    const validLevels = Object.values(AILevel);
    CHALLENGE_STAGES.forEach((stage) => {
      expect(validLevels).toContain(stage.aiLevel);
    });
  });

  it('仕様通りのステージ構成であること', () => {
    const expected: ChallengeStage[] = [
      { stageNumber: 1, enemyMonsterId: 'gardan', aiLevel: AILevel.LV1 },
      { stageNumber: 2, enemyMonsterId: 'morsu', aiLevel: AILevel.LV1 },
      { stageNumber: 3, enemyMonsterId: 'roona', aiLevel: AILevel.LV2 },
      { stageNumber: 4, enemyMonsterId: 'balga', aiLevel: AILevel.LV2 },
      { stageNumber: 5, enemyMonsterId: 'zephyr', aiLevel: AILevel.LV3 },
      { stageNumber: 6, enemyMonsterId: 'graon', aiLevel: AILevel.LV3 },
      { stageNumber: 7, enemyMonsterId: 'igna', aiLevel: AILevel.LV4 },
      { stageNumber: 8, enemyMonsterId: 'zaag', aiLevel: AILevel.LV4 },
    ];
    expect(CHALLENGE_STAGES).toEqual(expected);
  });
});

describe('getChallengeStage', () => {
  it('ステージ1の情報を返すこと', () => {
    const stage = getChallengeStage(1);
    expect(stage).toBeDefined();
    expect(stage!.enemyMonsterId).toBe('gardan');
    expect(stage!.aiLevel).toBe(AILevel.LV1);
  });

  it('ステージ8の情報を返すこと', () => {
    const stage = getChallengeStage(8);
    expect(stage).toBeDefined();
    expect(stage!.enemyMonsterId).toBe('zaag');
    expect(stage!.aiLevel).toBe(AILevel.LV4);
  });

  it('範囲外のステージ番号でundefinedを返すこと', () => {
    expect(getChallengeStage(0)).toBeUndefined();
    expect(getChallengeStage(9)).toBeUndefined();
    expect(getChallengeStage(-1)).toBeUndefined();
  });
});

describe('getNextStageNumber', () => {
  it('未クリア（0）の場合、ステージ1を返すこと', () => {
    expect(getNextStageNumber(0)).toBe(1);
  });

  it('ステージ3クリア済みの場合、ステージ4を返すこと', () => {
    expect(getNextStageNumber(3)).toBe(4);
  });

  it('ステージ7クリア済みの場合、ステージ8を返すこと', () => {
    expect(getNextStageNumber(7)).toBe(8);
  });

  it('全ステージクリア（8）の場合、nullを返すこと', () => {
    expect(getNextStageNumber(8)).toBeNull();
  });
});
