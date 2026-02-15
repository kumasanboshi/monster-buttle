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
  // Battle payload types
  BattleStartPayload,
  BattleStartedPayload,
  CommandSubmitPayload,
  WaitingForCommandsPayload,
  CommandTimeoutPayload,
  TurnResultPayload,
  BattleFinishedPayload,
} from './SocketEvents';
