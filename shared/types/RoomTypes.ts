/**
 * 部屋関連の型定義
 *
 * オンライン対戦の部屋管理に必要な型を定義する。
 */

/** 部屋の状態 */
export enum RoomStatus {
  /** 対戦相手を待っている */
  WAITING = 'WAITING',
  /** 対戦中 */
  PLAYING = 'PLAYING',
  /** 対戦終了 */
  FINISHED = 'FINISHED',
}

/** 部屋内のプレイヤー情報 */
export interface RoomPlayer {
  /** Socket.ioの接続ID */
  socketId: string;
  /** プレイヤー番号（1: ホスト, 2: ゲスト） */
  playerNumber: 1 | 2;
  /** 選択したモンスターのID（未選択時はnull） */
  selectedMonsterId: string | null;
  /** 接続中かどうか */
  isConnected: boolean;
}

/** 部屋の内部状態（サーバー管理用） */
export interface RoomState {
  /** 部屋ID */
  roomId: string;
  /** 部屋の状態 */
  status: RoomStatus;
  /** パスワード（設定されていない場合はnull） */
  password: string | null;
  /** ホスト（プレイヤー1） */
  host: RoomPlayer;
  /** ゲスト（プレイヤー2、未参加時はnull） */
  guest: RoomPlayer | null;
  /** 作成日時 */
  createdAt: number;
  /** 更新日時 */
  updatedAt: number;
}

/** クライアント向けの部屋情報（パスワード除外） */
export interface RoomInfo {
  /** 部屋ID */
  roomId: string;
  /** 部屋の状態 */
  status: RoomStatus;
  /** パスワードが設定されているか */
  hasPassword: boolean;
  /** ホスト情報 */
  host: RoomPlayer;
  /** ゲスト情報（未参加時はnull） */
  guest: RoomPlayer | null;
  /** 作成日時 */
  createdAt: number;
}
