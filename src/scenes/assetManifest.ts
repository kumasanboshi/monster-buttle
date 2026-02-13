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
 * 第1フェーズのアセットマニフェスト
 * 現時点ではプレースホルダー（アセットが未作成のため空）
 */
export const ASSET_MANIFEST: AssetManifest = {
  assets: [],
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
