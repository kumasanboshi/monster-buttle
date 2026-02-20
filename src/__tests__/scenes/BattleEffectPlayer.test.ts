import { BattleEffectPlayer, EffectTargets } from '../../scenes/BattleEffectPlayer';
import { BattleEffectType, BattleEffectSequence } from '../../types/BattleEffect';
import { DistanceType } from '../../types/Distance';
import { StanceType } from '../../types/Stance';
import { EFFECT_CONFIG } from '../../scenes/battleConfig';

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

/** Phaser.Sound のモック */
function createMockSoundManager() {
  const mockSound = {
    play: jest.fn(),
    stop: jest.fn(),
    destroy: jest.fn(),
    setVolume: jest.fn(),
    setLoop: jest.fn(),
  };
  return {
    add: jest.fn().mockReturnValue(mockSound),
  };
}

/** Phaser.GameObjects.Graphicsのモック */
function createMockGraphics() {
  return {
    x: 0,
    y: 0,
    alpha: 1,
    lineStyle: jest.fn().mockReturnThis(),
    fillStyle: jest.fn().mockReturnThis(),
    fillCircle: jest.fn().mockReturnThis(),
    strokeCircle: jest.fn().mockReturnThis(),
    moveTo: jest.fn().mockReturnThis(),
    lineTo: jest.fn().mockReturnThis(),
    strokePath: jest.fn().mockReturnThis(),
    beginPath: jest.fn().mockReturnThis(),
    closePath: jest.fn().mockReturnThis(),
    setAlpha: jest.fn().mockReturnThis(),
    setBlendMode: jest.fn().mockReturnThis(),
    destroy: jest.fn(),
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
      graphics: jest.fn().mockImplementation(() => {
        return createMockGraphics();
      }),
    },
    tweens: mockTweens,
    sound: createMockSoundManager(),
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

    it('WEAPON_ATTACKで攻撃者ダッシュを含む複数のTweenが呼ばれる', async () => {
      const sequence: BattleEffectSequence = [
        [{ type: BattleEffectType.WEAPON_ATTACK, target: 'enemy' }],
      ];
      await player.playSequence(sequence);

      // ダッシュ・シェイク・リターンの3Tween以上
      expect(scene.tweens.add.mock.calls.length).toBeGreaterThanOrEqual(3);
    });

    it('SPECIAL_ATTACKエフェクトでTweenが呼ばれる', async () => {
      const sequence: BattleEffectSequence = [
        [{ type: BattleEffectType.SPECIAL_ATTACK, target: 'enemy' }],
      ];
      await player.playSequence(sequence);

      expect(scene.tweens.add).toHaveBeenCalled();
    });

    it('SPECIAL_ATTACKで光球プロジェクタイルのGraphicsが生成される', async () => {
      const sequence: BattleEffectSequence = [
        [{ type: BattleEffectType.SPECIAL_ATTACK, target: 'enemy' }],
      ];
      await player.playSequence(sequence);

      // 光球はGraphicsで生成される
      expect(scene.add.graphics).toHaveBeenCalled();
    });

    it('SPECIAL_ATTACKでフライト+パルスの2Tween以上が呼ばれる', async () => {
      const sequence: BattleEffectSequence = [
        [{ type: BattleEffectType.SPECIAL_ATTACK, target: 'enemy' }],
      ];
      await player.playSequence(sequence);

      expect(scene.tweens.add.mock.calls.length).toBeGreaterThanOrEqual(2);
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
      // Image無しの場合、Text2つ分のTween
      expect(scene.tweens.add).toHaveBeenCalledTimes(2);
    });

    it('DISTANCE_MOVEでImage有りの場合、Image分もTweenが呼ばれる', async () => {
      // Image付きのtargetsを作成
      const targetsWithImages: EffectTargets = {
        ...createMockTargets(),
        playerImage: createMockText(200, 250) as any,
        enemyImage: createMockText(600, 250) as any,
      };
      const playerWithImages = new BattleEffectPlayer(scene as any, targetsWithImages);

      const sequence: BattleEffectSequence = [
        [{
          type: BattleEffectType.DISTANCE_MOVE,
          target: 'player',
          distanceFrom: DistanceType.MID,
          distanceTo: DistanceType.NEAR,
        }],
      ];
      await playerWithImages.playSequence(sequence);

      // Text2つ + Image2つ = 4つのTween
      expect(scene.tweens.add).toHaveBeenCalledTimes(4);
    });

    it('DISTANCE_MOVEでImage片方のみの場合、3つのTweenが呼ばれる', async () => {
      const targetsWithOneImage: EffectTargets = {
        ...createMockTargets(),
        playerImage: createMockText(200, 250) as any,
      };
      const playerWithOneImage = new BattleEffectPlayer(scene as any, targetsWithOneImage);

      const sequence: BattleEffectSequence = [
        [{
          type: BattleEffectType.DISTANCE_MOVE,
          target: 'player',
          distanceFrom: DistanceType.MID,
          distanceTo: DistanceType.NEAR,
        }],
      ];
      await playerWithOneImage.playSequence(sequence);

      // Text2つ + Image1つ = 3つのTween
      expect(scene.tweens.add).toHaveBeenCalledTimes(3);
    });

    it('STANCE_CHANGEエフェクト（攻勢）でテキスト生成とTweenが呼ばれる', async () => {
      const sequence: BattleEffectSequence = [
        [{ type: BattleEffectType.STANCE_CHANGE, target: 'player', stanceTo: StanceType.OFFENSIVE }],
      ];
      await player.playSequence(sequence);

      expect(scene.add.text).toHaveBeenCalled();
      expect(scene.tweens.add).toHaveBeenCalled();
    });

    it('STANCE_CHANGEエフェクト（守勢）でテキスト生成とTweenが呼ばれる', async () => {
      const sequence: BattleEffectSequence = [
        [{ type: BattleEffectType.STANCE_CHANGE, target: 'enemy', stanceTo: StanceType.DEFENSIVE }],
      ];
      await player.playSequence(sequence);

      expect(scene.add.text).toHaveBeenCalled();
      expect(scene.tweens.add).toHaveBeenCalled();
    });

    it('STANCE_CHANGEエフェクト（通常）でテキスト生成とTweenが呼ばれる', async () => {
      const sequence: BattleEffectSequence = [
        [{ type: BattleEffectType.STANCE_CHANGE, target: 'player', stanceTo: StanceType.NORMAL }],
      ];
      await player.playSequence(sequence);

      expect(scene.add.text).toHaveBeenCalled();
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

    it('WEAPON_ATTACKでGraphicsが生成される（スラッシュエフェクト）', async () => {
      const sequence: BattleEffectSequence = [
        [{ type: BattleEffectType.WEAPON_ATTACK, target: 'enemy' }],
      ];
      await player.playSequence(sequence);

      expect(scene.add.graphics).toHaveBeenCalled();
    });

    it('SPECIAL_ATTACKでGraphicsが生成される（光球エフェクト）', async () => {
      const sequence: BattleEffectSequence = [
        [{ type: BattleEffectType.SPECIAL_ATTACK, target: 'enemy' }],
      ];
      await player.playSequence(sequence);

      expect(scene.add.graphics).toHaveBeenCalled();
    });

    it('REFLECTOR_DEPLOYエフェクトでテキスト生成とTweenが呼ばれる', async () => {
      const sequence: BattleEffectSequence = [
        [{ type: BattleEffectType.REFLECTOR_DEPLOY, target: 'player' }],
      ];
      await player.playSequence(sequence);

      expect(scene.add.text).toHaveBeenCalled();
      expect(scene.tweens.add).toHaveBeenCalled();
    });

    it('REFLECTOR_DEPLOYエフェクト（enemy）でテキスト生成とTweenが呼ばれる', async () => {
      const sequence: BattleEffectSequence = [
        [{ type: BattleEffectType.REFLECTOR_DEPLOY, target: 'enemy' }],
      ];
      await player.playSequence(sequence);

      expect(scene.add.text).toHaveBeenCalled();
      expect(scene.tweens.add).toHaveBeenCalled();
    });
  });

  describe('演出速度の反映', () => {
    it('デフォルト（通常速度）ではEFFECT_CONFIGの値がそのまま使われること', async () => {
      localStorage.clear();
      const freshScene = createMockScene();
      const freshTargets = createMockTargets();
      const freshPlayer = new BattleEffectPlayer(freshScene as any, freshTargets);

      const sequence: BattleEffectSequence = [
        [{ type: BattleEffectType.DAMAGE_NUMBER, target: 'enemy', value: 10 }],
      ];
      await freshPlayer.playSequence(sequence);

      const tweenCall = freshScene.tweens.add.mock.calls[0][0];
      expect(tweenCall.duration).toBe(EFFECT_CONFIG.damageNumberDuration);
    });

    it('高速設定ではEFFECT_CONFIGの値に0.5を乗じること', async () => {
      localStorage.setItem(
        'monster-buttle-settings',
        JSON.stringify({ bgmVolume: 80, seVolume: 80, effectSpeed: 'fast' })
      );
      const fastScene = createMockScene();
      const fastTargets = createMockTargets();
      const fastPlayer = new BattleEffectPlayer(fastScene as any, fastTargets);

      const sequence: BattleEffectSequence = [
        [{ type: BattleEffectType.DAMAGE_NUMBER, target: 'enemy', value: 10 }],
      ];
      await fastPlayer.playSequence(sequence);

      const tweenCall = fastScene.tweens.add.mock.calls[0][0];
      expect(tweenCall.duration).toBe(EFFECT_CONFIG.damageNumberDuration * 0.5);
    });
  });
});
