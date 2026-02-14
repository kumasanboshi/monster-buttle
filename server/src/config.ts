/**
 * サーバー設定定数
 */

/** サーバーのポート番号 */
export const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001;

/** CORS許可オリジン */
export const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:3000';

/** Room IDの長さ */
export const ROOM_ID_LENGTH = 6;

/** 部屋のTTL（ミリ秒）: 30分 */
export const ROOM_TTL_MS = 30 * 60 * 1000;

/** 期限切れ部屋のクリーンアップ間隔（ミリ秒）: 5分 */
export const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;
