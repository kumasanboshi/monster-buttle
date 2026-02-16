import { BaseScene } from './BaseScene';
import { SceneKey } from './sceneKeys';
import { ASSET_MANIFEST, AssetType, SpritesheetAssetEntry } from './assetManifest';
import { PlaceholderGenerator } from './PlaceholderGenerator';

/**
 * 起動シーン
 * アセットのプリロードを行い、完了後にタイトルシーンへ遷移する。
 */
export class BootScene extends BaseScene {
  constructor() {
    super(SceneKey.BOOT);
  }

  preload(): void {
    for (const asset of ASSET_MANIFEST.assets) {
      switch (asset.type) {
        case AssetType.IMAGE:
          this.load.image(asset.key, asset.path);
          break;
        case AssetType.SPRITESHEET: {
          const spritesheet = asset as SpritesheetAssetEntry;
          this.load.spritesheet(asset.key, asset.path, {
            frameWidth: spritesheet.frameWidth,
            frameHeight: spritesheet.frameHeight,
          });
          break;
        }
        case AssetType.AUDIO:
          this.load.audio(asset.key, asset.path);
          break;
        case AssetType.JSON:
          this.load.json(asset.key, asset.path);
          break;
      }
    }
  }

  create(): void {
    // プレースホルダーテクスチャをランタイム生成
    const generator = new PlaceholderGenerator(this);
    generator.generateAll();

    this.transitionTo(SceneKey.TITLE);
  }
}
