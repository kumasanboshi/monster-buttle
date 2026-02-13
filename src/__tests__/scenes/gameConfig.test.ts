import {
  GAME_WIDTH,
  GAME_HEIGHT,
  DEFAULT_GAME_CONFIG,
} from '../../scenes/gameConfig';
import { SceneKey } from '../../scenes/sceneKeys';

describe('GAME_WIDTH / GAME_HEIGHT', () => {
  it('GAME_WIDTH が正の整数であること', () => {
    expect(GAME_WIDTH).toBeGreaterThan(0);
    expect(Number.isInteger(GAME_WIDTH)).toBe(true);
  });

  it('GAME_HEIGHT が正の整数であること', () => {
    expect(GAME_HEIGHT).toBeGreaterThan(0);
    expect(Number.isInteger(GAME_HEIGHT)).toBe(true);
  });
});

describe('DEFAULT_GAME_CONFIG', () => {
  it('width が GAME_WIDTH と一致すること', () => {
    expect(DEFAULT_GAME_CONFIG.width).toBe(GAME_WIDTH);
  });

  it('height が GAME_HEIGHT と一致すること', () => {
    expect(DEFAULT_GAME_CONFIG.height).toBe(GAME_HEIGHT);
  });

  it('backgroundColor が有効なカラーコードであること', () => {
    expect(DEFAULT_GAME_CONFIG.backgroundColor).toMatch(/^#[0-9a-fA-F]{6}$/);
  });

  it('physicsEnabled が false であること（本ゲームでは物理エンジン不要）', () => {
    expect(DEFAULT_GAME_CONFIG.physicsEnabled).toBe(false);
  });

  it('initialScene が SceneKey.BOOT であること', () => {
    expect(DEFAULT_GAME_CONFIG.initialScene).toBe(SceneKey.BOOT);
  });

  it('pixelArt が true であること', () => {
    expect(DEFAULT_GAME_CONFIG.pixelArt).toBe(true);
  });

  it('scaleMode が FIT であること', () => {
    expect(DEFAULT_GAME_CONFIG.scaleMode).toBe('FIT');
  });

  it('autoCenter が CENTER_BOTH であること', () => {
    expect(DEFAULT_GAME_CONFIG.autoCenter).toBe('CENTER_BOTH');
  });
});
