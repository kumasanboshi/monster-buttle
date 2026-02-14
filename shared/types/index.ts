/**
 * 共有型定義モジュール
 *
 * フロントエンド・バックエンド間で共有する型をエクスポートする。
 */

// Room types
export { RoomStatus, RoomPlayer, RoomState, RoomInfo } from './RoomTypes';

// Socket event types
export {
  CreateRoomPayload,
  JoinRoomPayload,
  RoomInfoPayload,
  RoomCreatedPayload,
  RoomJoinedPayload,
  OpponentUpdatePayload,
  ErrorPayload,
  ErrorCode,
  ClientEvents,
  ServerEvents,
  ClientToServerEvents,
  ServerToClientEvents,
} from './SocketEvents';
