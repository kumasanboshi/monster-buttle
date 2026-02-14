import { GameMode } from '../../types/GameMode';
import { BattleResultType } from '../../types/BattleState';
import { getChallengeStage, getNextStageNumber } from '../../constants/challengeConfig';
import { getMonsterWithGrownStats } from '../../constants/monsterStats';
import { getCharacterSelectButtons, getChallengeHeader } from '../../scenes/characterSelectConfig';
import { getResultButtons } from '../../scenes/resultConfig';
import { loadGameProgress, saveGameProgress, updateClearedStages } from '../../utils/gameProgressManager';
import { SceneKey } from '../../scenes/sceneKeys';

// localStorageモック
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();

Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock });

describe('CharacterSelectScene CHALLENGE data flow', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('初回プレイ時はステージ1が次のステージであること', () => {
    const progress = loadGameProgress();
    const stageNumber = getNextStageNumber(progress.clearedStages);
    expect(stageNumber).toBe(1);
  });

  it('ステージ3クリア後はステージ4が次のステージであること', () => {
    saveGameProgress({ clearedStages: 3 });
    const progress = loadGameProgress();
    const stageNumber = getNextStageNumber(progress.clearedStages);
    expect(stageNumber).toBe(4);
  });

  it('全クリア後はnullを返すこと', () => {
    saveGameProgress({ clearedStages: 8 });
    const progress = loadGameProgress();
    const stageNumber = getNextStageNumber(progress.clearedStages);
    expect(stageNumber).toBeNull();
  });

  it('CHALLENGEモードのヘッダーがステージ番号を含むこと', () => {
    const header = getChallengeHeader(5);
    expect(header).toContain('5');
  });

  it('CHALLENGEモードのボタンが正しいこと', () => {
    const buttons = getCharacterSelectButtons(undefined, GameMode.CHALLENGE);
    expect(buttons).toHaveLength(2);
    expect(buttons[0].action).toBe('confirm');
    expect(buttons[1].action).toBe('back');
  });
});

describe('BattleScene CHALLENGE data flow', () => {
  it('ステージ設定から敵モンスターとAIレベルを取得できること', () => {
    const stage = getChallengeStage(3);
    expect(stage).toBeDefined();
    expect(stage!.enemyMonsterId).toBe('roona');
    expect(stage!.aiLevel).toBe('LV2');
  });

  it('成長パラメータでモンスターを取得できること（プレイヤー）', () => {
    const monster = getMonsterWithGrownStats('zaag', 2);
    expect(monster).toBeDefined();
    // ステージ2クリア済み = 成長段階2
    expect(monster!.stats.hp).toBeGreaterThan(250);
  });

  it('敵モンスターも成長パラメータで取得できること', () => {
    const stage = getChallengeStage(5);
    const enemyMonster = getMonsterWithGrownStats(stage!.enemyMonsterId, 4);
    expect(enemyMonster).toBeDefined();
    expect(enemyMonster!.id).toBe('zephyr');
  });
});

describe('ResultScene CHALLENGE data flow', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('勝利時にclearedStagesを更新すること', () => {
    const stageNumber = 3;
    const resultType = BattleResultType.PLAYER1_WIN;

    if (resultType === BattleResultType.PLAYER1_WIN) {
      updateClearedStages(stageNumber);
    }

    const progress = loadGameProgress();
    expect(progress.clearedStages).toBe(3);
  });

  it('敗北時にclearedStagesを更新しないこと（updateClearedStages未呼出）', () => {
    saveGameProgress({ clearedStages: 2 });

    // 敗北時はupdateClearedStagesを呼ばない想定
    // → clearedStagesは変化しない
    const progress = loadGameProgress();
    expect(progress.clearedStages).toBe(2);
  });

  it('勝利+stage<8で「次へ」ボタンがBATTLEへ遷移すること', () => {
    const buttons = getResultButtons(GameMode.CHALLENGE, {
      stageNumber: 5,
      resultType: BattleResultType.PLAYER1_WIN,
    });
    const nextBtn = buttons.find((b) => b.label === '次へ');
    expect(nextBtn).toBeDefined();
    expect(nextBtn!.targetScene).toBe(SceneKey.BATTLE);
  });

  it('ステージ8勝利で「タイトルへ」のみであること', () => {
    const buttons = getResultButtons(GameMode.CHALLENGE, {
      stageNumber: 8,
      resultType: BattleResultType.PLAYER1_WIN,
    });
    expect(buttons).toHaveLength(1);
    expect(buttons[0].label).toBe('タイトルへ');
  });

  it('敗北時に「リトライ」がBATTLEへ遷移すること', () => {
    const buttons = getResultButtons(GameMode.CHALLENGE, {
      stageNumber: 3,
      resultType: BattleResultType.PLAYER2_WIN,
    });
    const retryBtn = buttons.find((b) => b.label === 'リトライ');
    expect(retryBtn).toBeDefined();
    expect(retryBtn!.targetScene).toBe(SceneKey.BATTLE);
  });
});

describe('CHALLENGE full flow simulation', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('ステージ1〜3の連続クリアフローが正しいこと', () => {
    // ステージ1
    let progress = loadGameProgress();
    let stageNumber = getNextStageNumber(progress.clearedStages)!;
    expect(stageNumber).toBe(1);

    let stage = getChallengeStage(stageNumber)!;
    expect(stage.enemyMonsterId).toBe('gardan');

    updateClearedStages(stageNumber);

    // ステージ2
    progress = loadGameProgress();
    stageNumber = getNextStageNumber(progress.clearedStages)!;
    expect(stageNumber).toBe(2);

    stage = getChallengeStage(stageNumber)!;
    expect(stage.enemyMonsterId).toBe('morsu');

    updateClearedStages(stageNumber);

    // ステージ3
    progress = loadGameProgress();
    stageNumber = getNextStageNumber(progress.clearedStages)!;
    expect(stageNumber).toBe(3);

    stage = getChallengeStage(stageNumber)!;
    expect(stage.enemyMonsterId).toBe('roona');
  });

  it('敗北時のリトライで同じステージに戻ること', () => {
    saveGameProgress({ clearedStages: 2 });
    const stageNumber = 3; // 現在のステージ

    // 敗北→リトライ：同じステージ番号が使われる
    const progress = loadGameProgress();
    expect(getNextStageNumber(progress.clearedStages)).toBe(stageNumber);
  });

  it('全クリアフローが正しいこと', () => {
    for (let i = 1; i <= 8; i++) {
      updateClearedStages(i);
    }

    const progress = loadGameProgress();
    expect(progress.clearedStages).toBe(8);
    expect(getNextStageNumber(progress.clearedStages)).toBeNull();

    // ステージ8勝利後のボタン
    const buttons = getResultButtons(GameMode.CHALLENGE, {
      stageNumber: 8,
      resultType: BattleResultType.PLAYER1_WIN,
    });
    expect(buttons).toHaveLength(1);
    expect(buttons[0].label).toBe('タイトルへ');
  });
});
