import { BattleEffectPlayer, EffectTargets } from '../../scenes/BattleEffectPlayer';
import { BattleEffectType, BattleEffectSequence } from '../../types/BattleEffect';
import { DistanceType } from '../../types/Distance';

/** Phaser.Tweensのモック */
function createMockTweens() {
  return {
    add: jest.fn().mockImplementation((config: { onComplete?: () => void }) => {
      // すぐにonCompleteを呼ぶ（アニメーションの即時完了をシミュレート）
      if (config.onComplete) {
        config.onComplete();
      }
      return {};
    }),
  };
}

/** Phaser.GameObjects.Textのモック */
function createMockText(x = 0, y = 0) {
  const mockText = {
    x,
    y,
    setOrigin: jest.fn().mockReturnThis(),
    setFontSize: jest.fn().mockReturnThis(),
    setColor: jest.fn().mockReturnThis(),
    setAlpha: jest.fn().mockReturnThis(),
    setText: jest.fn().mockReturnThis(),
    destroy: jest.fn(),
    setTint: jest.fn().mockReturnThis(),
    clearTint: jest.fn().mockReturnThis(),
    setScale: jest.fn().mockReturnThis(),
  };
  return mockText;
}

/** Phaser.GameObjects.Rectangleのモック */
function createMockRectangle() {
  return {
    x: 0,
    y: 0,
    setFillStyle: jest.fn().mockReturnThis(),
    setScale: jest.fn().mockReturnThis(),
  };
}

/** Phaser.Sceneのモック */
function createMockScene() {
  const mockTweens = createMockTweens();
  return {
    add: {
      text: jest.fn().mockImplementation((_x: number, _y: number, _text: string) => {
        return createMockText(_x, _y);
      }),
    },
    tweens: mockTweens,
  };
}

/** EffectTargetsのモック */
function createMockTargets(): EffectTargets {
  return {
    playerText: createMockText(200, 250) as any,
    enemyText: createMockText(600, 250) as any,
    playerHpBarFill: createMockRectangle() as any,
    enemyHpBarFill: createMockRectangle() as any,
  };
}

describe('BattleEffectPlayer', () => {
  let scene: ReturnType<typeof createMockScene>;
  let targets: EffectTargets;
  let player: BattleEffectPlayer;

  beforeEach(() => {
    scene = createMockScene();
    targets = createMockTargets();
    player = new BattleEffectPlayer(scene as any, targets);
  });

  describe('playSequence', () => {
    it('空のシーケンスでもエラーなく完了する', async () => {
      const sequence: BattleEffectSequence = [];
      await expect(player.playSequence(sequence)).resolves.toBeUndefined();
    });

    it('空のフェーズ配列でもエラーなく完了する', async () => {
      const sequence: BattleEffectSequence = [[], []];
      await expect(player.playSequence(sequence)).resolves.toBeUndefined();
    });

    it('DAMAGE_NUMBERエフェクトでテキスト生成とTweenが呼ばれる', async () => {
      const sequence: BattleEffectSequence = [
        [{ type: BattleEffectType.DAMAGE_NUMBER, target: 'enemy', value: 30 }],
      ];
      await player.playSequence(sequence);

      expect(scene.add.text).toHaveBeenCalled();
      expect(scene.tweens.add).toHaveBeenCalled();
    });

    it('WEAPON_ATTACKエフェクトでTweenが呼ばれる', async () => {
      const sequence: BattleEffectSequence = [
        [{ type: BattleEffectType.WEAPON_ATTACK, target: 'enemy' }],
      ];
      await player.playSequence(sequence);

      expect(scene.tweens.add).toHaveBeenCalled();
    });

    it('SPECIAL_ATTACKエフェクトでTweenが呼ばれる', async () => {
      const sequence: BattleEffectSequence = [
        [{ type: BattleEffectType.SPECIAL_ATTACK, target: 'enemy' }],
      ];
      await player.playSequence(sequence);

      expect(scene.tweens.add).toHaveBeenCalled();
    });

    it('EVASIONエフェクトでテキスト生成とTweenが呼ばれる', async () => {
      const sequence: BattleEffectSequence = [
        [{ type: BattleEffectType.EVASION, target: 'enemy' }],
      ];
      await player.playSequence(sequence);

      expect(scene.add.text).toHaveBeenCalled();
      expect(scene.tweens.add).toHaveBeenCalled();
    });

    it('REFLECTORエフェクトでテキスト生成とTweenが呼ばれる', async () => {
      const sequence: BattleEffectSequence = [
        [{ type: BattleEffectType.REFLECTOR, target: 'enemy' }],
      ];
      await player.playSequence(sequence);

      expect(scene.add.text).toHaveBeenCalled();
      expect(scene.tweens.add).toHaveBeenCalled();
    });

    it('DISTANCE_MOVEエフェクトでTweenが呼ばれる', async () => {
      const sequence: BattleEffectSequence = [
        [{
          type: BattleEffectType.DISTANCE_MOVE,
          target: 'player',
          distanceFrom: DistanceType.MID,
          distanceTo: DistanceType.NEAR,
        }],
      ];
      await player.playSequence(sequence);

      expect(scene.tweens.add).toHaveBeenCalled();
    });

    it('複数フェーズが順次実行される', async () => {
      const sequence: BattleEffectSequence = [
        [{ type: BattleEffectType.WEAPON_ATTACK, target: 'enemy' }],
        [{ type: BattleEffectType.SPECIAL_ATTACK, target: 'player' }],
      ];
      await player.playSequence(sequence);

      // 2つのフェーズで合計2回以上Tweenが呼ばれる
      expect(scene.tweens.add.mock.calls.length).toBeGreaterThanOrEqual(2);
    });
  });
});
