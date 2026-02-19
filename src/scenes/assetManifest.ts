/** アセットの種類 */
export enum AssetType {
  /** 画像（PNG/JPG等） */
  IMAGE = 'IMAGE',
  /** スプライトシート */
  SPRITESHEET = 'SPRITESHEET',
  /** オーディオ */
  AUDIO = 'AUDIO',
  /** JSONデータ */
  JSON = 'JSON',
}

/** アセット定義の基本インターフェース */
export interface AssetEntry {
  /** アセットの一意キー（Phaserのキャッシュキー） */
  key: string;
  /** アセットの種類 */
  type: AssetType;
  /** ファイルパス */
  path: string;
}

/** スプライトシート固有の追加情報 */
export interface SpritesheetAssetEntry extends AssetEntry {
  type: AssetType.SPRITESHEET;
  /** フレーム幅 */
  frameWidth: number;
  /** フレーム高さ */
  frameHeight: number;
}

/** アセットマニフェスト全体 */
export interface AssetManifest {
  /** アセット一覧 */
  assets: (AssetEntry | SpritesheetAssetEntry)[];
}

/**
 * アセットマニフェスト
 */
export const ASSET_MANIFEST: AssetManifest = {
  assets: [
    // オーディオ
    { key: 'bgm_title', type: AssetType.AUDIO, path: 'assets/audio/bgm/title.mp3' },
    { key: 'bgm_battle', type: AssetType.AUDIO, path: 'assets/audio/bgm/battle.mp3' },
    { key: 'se_attack', type: AssetType.AUDIO, path: 'assets/audio/se/attack.mp3' },
    { key: 'se_select', type: AssetType.AUDIO, path: 'assets/audio/se/select.mp3' },
    { key: 'se_victory', type: AssetType.AUDIO, path: 'assets/audio/se/victory.mp3' },
    { key: 'se_defeat', type: AssetType.AUDIO, path: 'assets/audio/se/defeat.mp3' },
    // モンスター画像（バトル用）
    { key: 'monster_zaag_battle', type: AssetType.IMAGE, path: 'assets/images/monsters/zaag.png' },
    { key: 'monster_gardan_battle', type: AssetType.IMAGE, path: 'assets/images/monsters/gardan.png' },
    { key: 'monster_roona_battle', type: AssetType.IMAGE, path: 'assets/images/monsters/roona.png' },
    { key: 'monster_zephyr_battle', type: AssetType.IMAGE, path: 'assets/images/monsters/zephyr.png' },
    { key: 'monster_balga_battle', type: AssetType.IMAGE, path: 'assets/images/monsters/balga.png' },
    { key: 'monster_morsu_battle', type: AssetType.IMAGE, path: 'assets/images/monsters/morsu.png' },
    { key: 'monster_graon_battle', type: AssetType.IMAGE, path: 'assets/images/monsters/graon.png' },
    { key: 'monster_igna_battle', type: AssetType.IMAGE, path: 'assets/images/monsters/igna.png' },
    // モンスター画像（ポートレート用 — バトルと同じファイルを使用）
    { key: 'monster_zaag_portrait', type: AssetType.IMAGE, path: 'assets/images/monsters/zaag.png' },
    { key: 'monster_gardan_portrait', type: AssetType.IMAGE, path: 'assets/images/monsters/gardan.png' },
    { key: 'monster_roona_portrait', type: AssetType.IMAGE, path: 'assets/images/monsters/roona.png' },
    { key: 'monster_zephyr_portrait', type: AssetType.IMAGE, path: 'assets/images/monsters/zephyr.png' },
    { key: 'monster_balga_portrait', type: AssetType.IMAGE, path: 'assets/images/monsters/balga.png' },
    { key: 'monster_morsu_portrait', type: AssetType.IMAGE, path: 'assets/images/monsters/morsu.png' },
    { key: 'monster_graon_portrait', type: AssetType.IMAGE, path: 'assets/images/monsters/graon.png' },
    { key: 'monster_igna_portrait', type: AssetType.IMAGE, path: 'assets/images/monsters/igna.png' },
    // UIアイコン
    { key: 'ui_lock_icon', type: AssetType.IMAGE, path: 'assets/images/monsters/lock.png' },
  ],
};

/**
 * マニフェストから指定タイプのアセットのみ取得する
 */
export function getAssetsByType(manifest: AssetManifest, type: AssetType): AssetEntry[] {
  return manifest.assets.filter((a) => a.type === type);
}

/**
 * マニフェストから指定キーのアセットを取得する
 */
export function getAssetByKey(manifest: AssetManifest, key: string): AssetEntry | undefined {
  return manifest.assets.find((a) => a.key === key);
}

/**
 * マニフェストのバリデーション（キーの重複チェック等）
 */
export function validateManifest(manifest: AssetManifest): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const keys = manifest.assets.map((a) => a.key);
  const duplicates = keys.filter((k, i) => keys.indexOf(k) !== i);
  if (duplicates.length > 0) {
    errors.push(`重複キー: ${[...new Set(duplicates)].join(', ')}`);
  }
  for (const asset of manifest.assets) {
    if (!asset.key || asset.key.trim() === '') {
      errors.push('空のアセットキーが存在します');
    }
    if (!asset.path || asset.path.trim() === '') {
      errors.push(`アセット "${asset.key}" のパスが空です`);
    }
  }
  return { valid: errors.length === 0, errors };
}
