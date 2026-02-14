/**
 * Socket.ioイベント型定義
 *
 * クライアント・サーバー間の通信イベント名とペイロード型を定義する。
 */

import { RoomInfo } from './RoomTypes';

// --- ペイロード型 ---

/** 部屋作成リクエスト */
export interface CreateRoomPayload {
  password?: string;
}

/** 部屋参加リクエスト */
export interface JoinRoomPayload {
  roomId: string;
  password?: string;
}

/** 部屋情報リクエスト */
export interface RoomInfoPayload {
  roomId: string;
}

/** 部屋作成完了レスポンス */
export interface RoomCreatedPayload {
  roomId: string;
  roomInfo: RoomInfo;
}

/** 部屋参加完了レスポンス */
export interface RoomJoinedPayload {
  roomInfo: RoomInfo;
  playerNumber: 1 | 2;
}

/** 相手入室/退室通知 */
export interface OpponentUpdatePayload {
  roomInfo: RoomInfo;
}

/** エラーレスポンス */
export interface ErrorPayload {
  code: ErrorCode;
  message: string;
}

// --- エラーコード ---

export enum ErrorCode {
  ROOM_NOT_FOUND = 'ROOM_NOT_FOUND',
  ROOM_FULL = 'ROOM_FULL',
  WRONG_PASSWORD = 'WRONG_PASSWORD',
  ALREADY_IN_ROOM = 'ALREADY_IN_ROOM',
  NOT_IN_ROOM = 'NOT_IN_ROOM',
  INVALID_PAYLOAD = 'INVALID_PAYLOAD',
}

// --- イベント名定数 ---

/** クライアント→サーバーのイベント名 */
export const ClientEvents = {
  ROOM_CREATE: 'room:create',
  ROOM_JOIN: 'room:join',
  ROOM_LEAVE: 'room:leave',
  ROOM_INFO: 'room:info',
} as const;

/** サーバー→クライアントのイベント名 */
export const ServerEvents = {
  ROOM_CREATED: 'room:created',
  ROOM_JOINED: 'room:joined',
  ROOM_OPPONENT_JOINED: 'room:opponent_joined',
  ROOM_OPPONENT_LEFT: 'room:opponent_left',
  ROOM_INFO: 'room:info',
  ERROR: 'error',
} as const;

// --- Socket.io型付きインターフェース ---

/** クライアント→サーバーのイベントマップ */
export interface ClientToServerEvents {
  [ClientEvents.ROOM_CREATE]: (payload: CreateRoomPayload) => void;
  [ClientEvents.ROOM_JOIN]: (payload: JoinRoomPayload) => void;
  [ClientEvents.ROOM_LEAVE]: () => void;
  [ClientEvents.ROOM_INFO]: (payload: RoomInfoPayload) => void;
}

/** サーバー→クライアントのイベントマップ */
export interface ServerToClientEvents {
  [ServerEvents.ROOM_CREATED]: (payload: RoomCreatedPayload) => void;
  [ServerEvents.ROOM_JOINED]: (payload: RoomJoinedPayload) => void;
  [ServerEvents.ROOM_OPPONENT_JOINED]: (payload: OpponentUpdatePayload) => void;
  [ServerEvents.ROOM_OPPONENT_LEFT]: (payload: OpponentUpdatePayload) => void;
  [ServerEvents.ROOM_INFO]: (payload: RoomInfo) => void;
  [ServerEvents.ERROR]: (payload: ErrorPayload) => void;
}
