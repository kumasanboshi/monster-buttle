import Phaser from 'phaser';
import { getMonsterBattleKey, getMonsterPortraitKey, UIImageKey } from '../constants/imageKeys';

/** バトルスプライト設定 */
export const MONSTER_SPRITE_CONFIG = {
  width: 100,
  height: 100,
} as const;

/** ポートレート設定 */
export const MONSTER_PORTRAIT_CONFIG = {
  width: 60,
  height: 60,
} as const;

/** ロックアイコン設定 */
export const LOCK_ICON_CONFIG = {
  width: 40,
  height: 40,
} as const;

/** モンスターごとのビジュアル設定 */
export interface MonsterVisual {
  initial: string;
  color: number;
}

/** 全8体のモンスタービジュアル設定 */
export const MONSTER_VISUALS: Record<string, MonsterVisual> = {
  zaag: { initial: 'Z', color: 0xc0c0c0 },
  gardan: { initial: 'G', color: 0x8b6914 },
  roona: { initial: 'R', color: 0x87ceeb },
  zephyr: { initial: 'Zp', color: 0x2e8b57 },
  balga: { initial: 'B', color: 0x191970 },
  morsu: { initial: 'M', color: 0x006400 },
  graon: { initial: 'Gr', color: 0x800080 },
  igna: { initial: 'I', color: 0xff4500 },
};

const ALL_MONSTER_IDS = ['zaag', 'gardan', 'roona', 'zephyr', 'balga', 'morsu', 'graon', 'igna'];

/**
 * ランタイムプレースホルダーテクスチャ生成クラス
 *
 * BootScene.create()で呼び出し、Phaser.GameObjects.Graphicsで描画→generateTexture()でキャッシュする。
 */
export class PlaceholderGenerator {
  private scene: Phaser.Scene;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  /**
   * 全テクスチャを生成する
   */
  generateAll(): void {
    ALL_MONSTER_IDS.forEach((id) => {
      this.generateMonsterBattleSprite(id);
      this.generateMonsterPortrait(id);
    });
    this.generateLockIcon();
  }

  /**
   * モンスターバトルスプライト (100x100) を生成
   * テーマカラーの円 + イニシャル文字
   */
  private generateMonsterBattleSprite(monsterId: string): void {
    const visual = MONSTER_VISUALS[monsterId];
    if (!visual) return;

    const { width, height } = MONSTER_SPRITE_CONFIG;
    const key = getMonsterBattleKey(monsterId);

    const graphics = this.scene.add.graphics();
    // 円を描画
    graphics.fillStyle(visual.color, 1);
    graphics.fillCircle(width / 2, height / 2, width / 2 - 4);
    // 枠線
    graphics.lineStyle(2, 0xffffff, 0.6);
    graphics.strokeCircle(width / 2, height / 2, width / 2 - 4);

    graphics.generateTexture(key, width, height);
    graphics.destroy();

    // イニシャルテキストをテクスチャに重ねて再生成
    this.addInitialToTexture(key, visual.initial, width, height, '28px');
  }

  /**
   * モンスターポートレート (60x60) を生成
   */
  private generateMonsterPortrait(monsterId: string): void {
    const visual = MONSTER_VISUALS[monsterId];
    if (!visual) return;

    const { width, height } = MONSTER_PORTRAIT_CONFIG;
    const key = getMonsterPortraitKey(monsterId);

    const graphics = this.scene.add.graphics();
    graphics.fillStyle(visual.color, 1);
    graphics.fillCircle(width / 2, height / 2, width / 2 - 3);
    graphics.lineStyle(2, 0xffffff, 0.6);
    graphics.strokeCircle(width / 2, height / 2, width / 2 - 3);

    graphics.generateTexture(key, width, height);
    graphics.destroy();

    this.addInitialToTexture(key, visual.initial, width, height, '18px');
  }

  /**
   * ロックアイコン (40x40) を生成
   */
  private generateLockIcon(): void {
    const { width, height } = LOCK_ICON_CONFIG;
    const key = UIImageKey.LOCK_ICON;

    const graphics = this.scene.add.graphics();

    // 錠前の本体（四角）
    graphics.fillStyle(0x666666, 1);
    graphics.fillRoundedRect(8, 18, 24, 18, 3);

    // 錠前のシャックル（上の弧）
    graphics.lineStyle(4, 0x888888, 1);
    graphics.beginPath();
    graphics.arc(20, 18, 8, Math.PI, 0, false);
    graphics.strokePath();

    // 鍵穴
    graphics.fillStyle(0x333333, 1);
    graphics.fillCircle(20, 25, 3);
    graphics.fillRect(19, 25, 2, 5);

    graphics.generateTexture(key, width, height);
    graphics.destroy();
  }

  /**
   * 既存テクスチャの上にイニシャル文字を重ねて再生成する
   */
  private addInitialToTexture(key: string, initial: string, width: number, height: number, fontSize: string): void {
    // RenderTextureを使ってテクスチャとテキストを合成
    const rt = this.scene.add.renderTexture(0, 0, width, height);
    rt.draw(key, 0, 0);

    const text = this.scene.add.text(width / 2, height / 2, initial, {
      fontSize,
      color: '#ffffff',
      fontFamily: 'Arial, sans-serif',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    rt.draw(text, 0, 0);

    // 既存テクスチャを破棄して再生成
    this.scene.textures.remove(key);
    rt.saveTexture(key);

    text.destroy();
    rt.destroy();
  }
}
