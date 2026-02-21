import { BaseScene } from './BaseScene';
import { SceneKey } from './sceneKeys';
import { ASSET_MANIFEST, AssetType, SpritesheetAssetEntry } from './assetManifest';
import { PlaceholderGenerator } from './PlaceholderGenerator';
import { GAME_WIDTH, GAME_HEIGHT } from './gameConfig';

const LOADING_HINTS = [
  'TCB（ツインコマンドバトル）で毎ターン2つのコマンドを同時実行！',
  '3種のスタンスを切り替えて攻防バランスを操れ！',
  '8種の魂格から自分のプレイスタイルに合ったモンスターを選ぼう',
  'リフレクターで相手の特殊攻撃を反射・無効化せよ！',
  '相手の行動を読み切った時の快感がたまらない！',
  '導き手として最強のモンスターを導け！',
];

/**
 * 起動シーン
 * アセットのプリロードを行い、完了後にタイトルシーンへ遷移する。
 * ロード中はプログレスバー・タイトル・ヒントテキストを表示する。
 */
export class BootScene extends BaseScene {
  private progressBar?: Phaser.GameObjects.Rectangle;
  private progressText?: Phaser.GameObjects.Text;

  constructor() {
    super(SceneKey.BOOT);
  }

  preload(): void {
    this.createLoadingUI();

    this.load.on('progress', (value: number) => {
      this.updateProgress(value);
    });

    // アセットのロード失敗を無視（PlaceholderGeneratorがフォールバック生成）
    this.load.on('loaderror', () => {});

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

    // プログレスバーを100%にしてからフェードアウト
    this.updateProgress(1);
    this.cameras.main.fadeOut(600, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.transitionTo(SceneKey.TITLE);
    });
  }

  private createLoadingUI(): void {
    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2;

    // 背景
    this.add.rectangle(cx, cy, GAME_WIDTH, GAME_HEIGHT, 0x1a1a2e);

    // タイトルテキスト
    this.add
      .text(cx, cy - 130, 'モンスター対戦', {
        fontSize: '52px',
        color: '#ffffff',
        fontFamily: 'Arial, sans-serif',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    // サブタイトル
    this.add
      .text(cx, cy - 75, '読み合い特化の1vs1バトル', {
        fontSize: '20px',
        color: '#aaaacc',
        fontFamily: 'Arial, sans-serif',
      })
      .setOrigin(0.5);

    // プログレスバー背景
    const barWidth = 400;
    const barHeight = 18;
    const barY = cy + 60;
    this.add.rectangle(cx, barY, barWidth + 4, barHeight + 4, 0x333355);

    // プログレスバー（左端起点で幅を変えていく）
    this.progressBar = this.add
      .rectangle(cx - barWidth / 2, barY, 0, barHeight, 0x6688ff)
      .setOrigin(0, 0.5);

    // パーセント表示
    this.progressText = this.add
      .text(cx, barY + 22, '0%', {
        fontSize: '14px',
        color: '#8888bb',
        fontFamily: 'Arial, sans-serif',
      })
      .setOrigin(0.5);

    // ヒントテキスト（ランダム表示）
    const hint = LOADING_HINTS[Math.floor(Math.random() * LOADING_HINTS.length)];
    this.add
      .text(cx, cy + 130, `Hint: ${hint}`, {
        fontSize: '14px',
        color: '#666688',
        fontFamily: 'Arial, sans-serif',
        wordWrap: { width: 600 },
        align: 'center',
      })
      .setOrigin(0.5);
  }

  private updateProgress(value: number): void {
    const barWidth = 400;
    this.progressBar?.setSize(barWidth * value, 18);
    this.progressText?.setText(`${Math.round(value * 100)}%`);
  }
}
