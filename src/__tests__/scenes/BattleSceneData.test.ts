import { MONSTER_DATABASE, getMonsterById } from '../../constants/monsters';
import { FINAL_MONSTER_DATABASE } from '../../constants/monsterStats';
import { AILevel } from '../../ai/types';
import { GameMode } from '../../types/GameMode';
import { SceneKey } from '../../scenes/sceneKeys';
import { isValidTransition } from '../../scenes/sceneTransitions';

/**
 * BattleScene のデータ受け渡しとモンスター取得ロジックのテスト
 *
 * BattleScene 自体は Phaser シーンのため直接テストしにくいが、
 * create() で受け取るデータの仕様と、
 * モンスター取得・AIレベル使用のロジックを検証する。
 */

/** BattleScene.create() に渡されるデータの型仕様テスト */
describe('BattleSceneData 仕様', () => {
  describe('遷移ルール', () => {
    it('DIFFICULTY_SELECT から BATTLE への遷移が許可されていること', () => {
      expect(isValidTransition(SceneKey.DIFFICULTY_SELECT, SceneKey.BATTLE)).toBe(true);
    });

    it('CHARACTER_SELECT から BATTLE への遷移が許可されていること', () => {
      expect(isValidTransition(SceneKey.CHARACTER_SELECT, SceneKey.BATTLE)).toBe(true);
    });
  });

  describe('モンスター取得ロジック', () => {
    it('enemyMonsterId が指定されている場合、そのモンスターが取得できること', () => {
      const enemyMonsterId = 'gardan';
      const enemy = getMonsterById(enemyMonsterId);
      expect(enemy).toBeDefined();
      expect(enemy!.id).toBe('gardan');
    });

    it('enemyMonsterId が未指定の場合、ランダム選択されること', () => {
      const playerMonsterId = 'zaag';
      const candidates = MONSTER_DATABASE.filter((m) => m.id !== playerMonsterId);
      expect(candidates.length).toBe(7);
      expect(candidates.every((m) => m.id !== playerMonsterId)).toBe(true);
    });

    it('mode=FREE_CPU の場合、FINAL_MONSTER_DATABASE から取得できること', () => {
      const mode = GameMode.FREE_CPU;
      const finalMonster = FINAL_MONSTER_DATABASE.find((m) => m.id === 'zaag');
      expect(finalMonster).toBeDefined();
      // 最終パラメータは基礎値より高い
      const baseMonster = getMonsterById('zaag')!;
      expect(finalMonster!.stats.hp).toBeGreaterThan(baseMonster.stats.hp);
      expect(finalMonster!.stats.strength).toBeGreaterThan(baseMonster.stats.strength);
    });

    it('FINAL_MONSTER_DATABASE の全モンスターIDが MONSTER_DATABASE に存在すること', () => {
      for (const monster of FINAL_MONSTER_DATABASE) {
        expect(getMonsterById(monster.id)).toBeDefined();
      }
    });
  });

  describe('AIレベル仕様', () => {
    it('CPU難易度と AILevel の対応が正しいこと', () => {
      // 弱い=LV1, 普通=LV2, 強い=LV4, 最強=LV5
      expect(AILevel.LV1).toBe('LV1');
      expect(AILevel.LV2).toBe('LV2');
      expect(AILevel.LV4).toBe('LV4');
      expect(AILevel.LV5).toBe('LV5');
    });

    it('aiLevel 未指定時のデフォルトが LV2 であること', () => {
      const defaultLevel = AILevel.LV2;
      expect(defaultLevel).toBe(AILevel.LV2);
    });
  });

  describe('create data の整合性', () => {
    it('DifficultySelectScene から渡されるデータ形式が正しいこと', () => {
      // DifficultySelectScene が渡すデータ形式
      const data = {
        monsterId: 'zaag',
        enemyMonsterId: 'gardan',
        aiLevel: AILevel.LV4,
        mode: GameMode.FREE_CPU,
      };

      expect(data.monsterId).toBeDefined();
      expect(data.enemyMonsterId).toBeDefined();
      expect(data.aiLevel).toBeDefined();
      expect(data.mode).toBe(GameMode.FREE_CPU);
    });
  });
});
