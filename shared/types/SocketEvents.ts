/**
 * Socket.ioイベント型定義
 *
 * クライアント・サーバー間の通信イベント名とペイロード型を定義する。
 */

import { RoomInfo } from './RoomTypes';
import type { TurnCommands } from '../../src/types/Command';
import type { Monster } from '../../src/types/Monster';
import type { BattleState, TurnResult, BattleResult } from '../../src/types/BattleState';

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

// --- バトル関連ペイロード型 ---

/** バトル開始リクエスト */
export interface BattleStartPayload {
  roomId: string;
  monsterId: string;
}

/** バトル開始通知 */
export interface BattleStartedPayload {
  roomId: string;
  player1Monster: Monster;
  player2Monster: Monster;
  initialState: BattleState;
}

/** コマンド提出リクエスト */
export interface CommandSubmitPayload {
  roomId: string;
  commands: TurnCommands;
}

/** コマンド待機通知 */
export interface WaitingForCommandsPayload {
  roomId: string;
  turnNumber: number;
}

/** コマンドタイムアウト通知 */
export interface CommandTimeoutPayload {
  roomId: string;
  timedOutPlayer: 1 | 2;
  autoSelectedCommands: TurnCommands;
}

/** ターン結果通知 */
export interface TurnResultPayload {
  roomId: string;
  turnResult: TurnResult;
  newState: BattleState;
}

/** バトル終了通知 */
export interface BattleFinishedPayload {
  roomId: string;
  result: BattleResult;
  reason: 'hp_zero' | 'time_up' | 'disconnect' | 'surrender';
}

// --- エラーコード ---

export enum ErrorCode {
  ROOM_NOT_FOUND = 'ROOM_NOT_FOUND',
  ROOM_FULL = 'ROOM_FULL',
  WRONG_PASSWORD = 'WRONG_PASSWORD',
  ALREADY_IN_ROOM = 'ALREADY_IN_ROOM',
  NOT_IN_ROOM = 'NOT_IN_ROOM',
  INVALID_PAYLOAD = 'INVALID_PAYLOAD',
  BATTLE_NOT_STARTED = 'BATTLE_NOT_STARTED',
  INVALID_COMMAND = 'INVALID_COMMAND',
  ALREADY_SUBMITTED = 'ALREADY_SUBMITTED',
}

// --- イベント名定数 ---

/** クライアント→サーバーのイベント名 */
export const ClientEvents = {
  ROOM_CREATE: 'room:create',
  ROOM_JOIN: 'room:join',
  ROOM_LEAVE: 'room:leave',
  ROOM_INFO: 'room:info',
  BATTLE_START: 'battle:start',
  BATTLE_COMMAND_SUBMIT: 'battle:command_submit',
  BATTLE_SURRENDER: 'battle:surrender',
} as const;

/** サーバー→クライアントのイベント名 */
export const ServerEvents = {
  ROOM_CREATED: 'room:created',
  ROOM_JOINED: 'room:joined',
  ROOM_OPPONENT_JOINED: 'room:opponent_joined',
  ROOM_OPPONENT_LEFT: 'room:opponent_left',
  ROOM_INFO: 'room:info',
  ERROR: 'error',
  BATTLE_STARTED: 'battle:started',
  BATTLE_WAITING_COMMANDS: 'battle:waiting_commands',
  BATTLE_TURN_RESULT: 'battle:turn_result',
  BATTLE_COMMAND_TIMEOUT: 'battle:command_timeout',
  BATTLE_FINISHED: 'battle:finished',
  BATTLE_OPPONENT_DISCONNECTED: 'battle:opponent_disconnected',
} as const;

// --- Socket.io型付きインターフェース ---

/** クライアント→サーバーのイベントマップ */
export interface ClientToServerEvents {
  [ClientEvents.ROOM_CREATE]: (payload: CreateRoomPayload) => void;
  [ClientEvents.ROOM_JOIN]: (payload: JoinRoomPayload) => void;
  [ClientEvents.ROOM_LEAVE]: () => void;
  [ClientEvents.ROOM_INFO]: (payload: RoomInfoPayload) => void;
  [ClientEvents.BATTLE_START]: (payload: BattleStartPayload) => void;
  [ClientEvents.BATTLE_COMMAND_SUBMIT]: (payload: CommandSubmitPayload) => void;
  [ClientEvents.BATTLE_SURRENDER]: (payload: { roomId: string }) => void;
}

/** サーバー→クライアントのイベントマップ */
export interface ServerToClientEvents {
  [ServerEvents.ROOM_CREATED]: (payload: RoomCreatedPayload) => void;
  [ServerEvents.ROOM_JOINED]: (payload: RoomJoinedPayload) => void;
  [ServerEvents.ROOM_OPPONENT_JOINED]: (payload: OpponentUpdatePayload) => void;
  [ServerEvents.ROOM_OPPONENT_LEFT]: (payload: OpponentUpdatePayload) => void;
  [ServerEvents.ROOM_INFO]: (payload: RoomInfo) => void;
  [ServerEvents.ERROR]: (payload: ErrorPayload) => void;
  [ServerEvents.BATTLE_STARTED]: (payload: BattleStartedPayload) => void;
  [ServerEvents.BATTLE_WAITING_COMMANDS]: (payload: WaitingForCommandsPayload) => void;
  [ServerEvents.BATTLE_TURN_RESULT]: (payload: TurnResultPayload) => void;
  [ServerEvents.BATTLE_COMMAND_TIMEOUT]: (payload: CommandTimeoutPayload) => void;
  [ServerEvents.BATTLE_FINISHED]: (payload: BattleFinishedPayload) => void;
  [ServerEvents.BATTLE_OPPONENT_DISCONNECTED]: (payload: { roomId: string }) => void;
}
