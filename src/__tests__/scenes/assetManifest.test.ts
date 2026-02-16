import {
  AssetType,
  ASSET_MANIFEST,
  getAssetsByType,
  getAssetByKey,
  validateManifest,
  AssetManifest,
  AssetEntry,
} from '../../scenes/assetManifest';

describe('AssetType', () => {
  it('IMAGE, SPRITESHEET, AUDIO, JSON の4種類が定義されていること', () => {
    expect(AssetType.IMAGE).toBe('IMAGE');
    expect(AssetType.SPRITESHEET).toBe('SPRITESHEET');
    expect(AssetType.AUDIO).toBe('AUDIO');
    expect(AssetType.JSON).toBe('JSON');
    expect(Object.values(AssetType)).toHaveLength(4);
  });
});

describe('ASSET_MANIFEST', () => {
  it('assets プロパティが配列であること', () => {
    expect(Array.isArray(ASSET_MANIFEST.assets)).toBe(true);
  });

  it('オーディオアセットが6件定義されていること', () => {
    const audioAssets = ASSET_MANIFEST.assets.filter(a => a.type === AssetType.AUDIO);
    expect(audioAssets).toHaveLength(6);
  });

  it('BGMアセットが正しいパスで定義されていること', () => {
    const bgmTitle = ASSET_MANIFEST.assets.find(a => a.key === 'bgm_title');
    const bgmBattle = ASSET_MANIFEST.assets.find(a => a.key === 'bgm_battle');
    expect(bgmTitle).toBeDefined();
    expect(bgmTitle!.path).toBe('assets/audio/bgm/title.mp3');
    expect(bgmTitle!.type).toBe(AssetType.AUDIO);
    expect(bgmBattle).toBeDefined();
    expect(bgmBattle!.path).toBe('assets/audio/bgm/battle.mp3');
    expect(bgmBattle!.type).toBe(AssetType.AUDIO);
  });

  it('SEアセットが正しいパスで定義されていること', () => {
    const seKeys = ['se_attack', 'se_select', 'se_victory', 'se_defeat'];
    const sePaths = [
      'assets/audio/se/attack.mp3',
      'assets/audio/se/select.mp3',
      'assets/audio/se/victory.mp3',
      'assets/audio/se/defeat.mp3',
    ];
    seKeys.forEach((key, i) => {
      const asset = ASSET_MANIFEST.assets.find(a => a.key === key);
      expect(asset).toBeDefined();
      expect(asset!.path).toBe(sePaths[i]);
      expect(asset!.type).toBe(AssetType.AUDIO);
    });
  });

  it('マニフェストのバリデーションが通ること', () => {
    const result = validateManifest(ASSET_MANIFEST);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });
});

describe('getAssetsByType', () => {
  const testManifest: AssetManifest = {
    assets: [
      { key: 'bg', type: AssetType.IMAGE, path: 'assets/bg.png' },
      { key: 'player', type: AssetType.SPRITESHEET, path: 'assets/player.png', frameWidth: 32, frameHeight: 32 },
      { key: 'bgm', type: AssetType.AUDIO, path: 'assets/bgm.mp3' },
      { key: 'icon', type: AssetType.IMAGE, path: 'assets/icon.png' },
    ],
  };

  it('指定タイプのアセットのみを返すこと', () => {
    const images = getAssetsByType(testManifest, AssetType.IMAGE);
    expect(images).toHaveLength(2);
    expect(images.every((a) => a.type === AssetType.IMAGE)).toBe(true);
  });

  it('該当するアセットがない場合は空配列を返すこと', () => {
    const jsonAssets = getAssetsByType(testManifest, AssetType.JSON);
    expect(jsonAssets).toHaveLength(0);
  });

  it('複数タイプが混在するマニフェストから正しくフィルタリングすること', () => {
    const audio = getAssetsByType(testManifest, AssetType.AUDIO);
    expect(audio).toHaveLength(1);
    expect(audio[0].key).toBe('bgm');
  });
});

describe('getAssetByKey', () => {
  const testManifest: AssetManifest = {
    assets: [
      { key: 'bg', type: AssetType.IMAGE, path: 'assets/bg.png' },
      { key: 'bgm', type: AssetType.AUDIO, path: 'assets/bgm.mp3' },
    ],
  };

  it('指定キーのアセットを返すこと', () => {
    const asset = getAssetByKey(testManifest, 'bg');
    expect(asset).toBeDefined();
    expect(asset!.key).toBe('bg');
    expect(asset!.type).toBe(AssetType.IMAGE);
  });

  it('存在しないキーの場合 undefined を返すこと', () => {
    const asset = getAssetByKey(testManifest, 'nonexistent');
    expect(asset).toBeUndefined();
  });
});

describe('validateManifest', () => {
  it('空のマニフェストは valid であること', () => {
    const result = validateManifest({ assets: [] });
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('正常なマニフェストは valid であること', () => {
    const manifest: AssetManifest = {
      assets: [
        { key: 'bg', type: AssetType.IMAGE, path: 'assets/bg.png' },
        { key: 'bgm', type: AssetType.AUDIO, path: 'assets/bgm.mp3' },
      ],
    };
    const result = validateManifest(manifest);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('キーが重複している場合は invalid でエラーメッセージを返すこと', () => {
    const manifest: AssetManifest = {
      assets: [
        { key: 'bg', type: AssetType.IMAGE, path: 'assets/bg1.png' },
        { key: 'bg', type: AssetType.IMAGE, path: 'assets/bg2.png' },
      ],
    };
    const result = validateManifest(manifest);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('重複キー'))).toBe(true);
  });

  it('空のキーがある場合は invalid であること', () => {
    const manifest: AssetManifest = {
      assets: [{ key: '', type: AssetType.IMAGE, path: 'assets/bg.png' } as AssetEntry],
    };
    const result = validateManifest(manifest);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('空のアセットキー'))).toBe(true);
  });

  it('空のパスがある場合は invalid であること', () => {
    const manifest: AssetManifest = {
      assets: [{ key: 'bg', type: AssetType.IMAGE, path: '' } as AssetEntry],
    };
    const result = validateManifest(manifest);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('パスが空'))).toBe(true);
  });

  it('複数のエラーを同時に検出できること', () => {
    const manifest: AssetManifest = {
      assets: [
        { key: 'bg', type: AssetType.IMAGE, path: 'assets/bg.png' },
        { key: 'bg', type: AssetType.IMAGE, path: '' },
      ],
    };
    const result = validateManifest(manifest);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThanOrEqual(2);
  });
});
