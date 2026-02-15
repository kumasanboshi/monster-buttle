/**
 * モード選択画面（マッチングUI）の設定定数
 *
 * 部屋作成・参加のUI状態、レイアウト、ラベル、カラーを定義する。
 */

import { ErrorCode } from '../../shared/types/SocketEvents';

/** モード選択画面の状態 */
export enum ModeSelectState {
  /** メインメニュー（部屋を作る/部屋に入る/戻る） */
  MAIN_MENU = 'MAIN_MENU',
  /** 部屋作成（パスワード入力 + 作成ボタン） */
  CREATE_ROOM = 'CREATE_ROOM',
  /** 待機中（部屋ID表示 + 待機メッセージ + キャンセル） */
  WAITING = 'WAITING',
  /** 部屋参加（部屋ID入力 + パスワード入力 + 参加ボタン） */
  JOIN_ROOM = 'JOIN_ROOM',
}

/** レイアウト定数 */
export const MODE_SELECT_LAYOUT = {
  /** タイトルのY座標 */
  titleY: 80,
  /** ボタン開始Y座標 */
  buttonStartY: 200,
  /** ボタン間隔 */
  buttonSpacing: 60,
  /** テキスト入力の幅 */
  inputWidth: 250,
  /** テキスト入力の高さ */
  inputHeight: 36,
  /** 注意書きのY座標 */
  noteY: 520,
} as const;

/** ラベル文字列 */
export const MODE_SELECT_LABELS = {
  /** 画面タイトル */
  title: '自由対戦（ローカル）',
  /** 部屋を作るボタン */
  createRoom: '部屋を作る',
  /** 部屋に入るボタン */
  joinRoom: '部屋に入る',
  /** 戻るボタン */
  back: '戻る',
  /** 作成ボタン */
  create: '作成',
  /** 参加ボタン */
  join: '参加',
  /** キャンセルボタン */
  cancel: 'キャンセル',
  /** 待機メッセージ */
  waiting: '対戦相手を待っています...',
  /** Wi-Fi注意書き */
  wifiNote: '※ 同じWi-Fiネットワーク内で接続してください',
  /** パスワードプレースホルダー */
  passwordPlaceholder: 'パスワード（任意）',
  /** 部屋IDプレースホルダー */
  roomIdPlaceholder: '部屋IDを入力',
  /** 部屋ID表示プレフィックス */
  roomIdPrefix: '部屋ID: ',
} as const;

/** カラー定数 */
export const MODE_SELECT_COLORS = {
  /** 背景色 */
  background: '#1a1a2e',
  /** ボタン通常色 */
  buttonNormal: '#cccccc',
  /** ボタンホバー色 */
  buttonHover: '#ffffff',
  /** エラーテキスト色 */
  error: '#ff4444',
  /** 注意書きテキスト色 */
  note: '#888888',
  /** 部屋IDテキスト色 */
  roomId: '#44ff44',
} as const;

/** エラーコード → 日本語メッセージのマッピング */
export const ERROR_MESSAGES: Record<ErrorCode, string> = {
  [ErrorCode.ROOM_NOT_FOUND]: '部屋が見つかりません',
  [ErrorCode.ROOM_FULL]: '部屋が満員です',
  [ErrorCode.WRONG_PASSWORD]: 'パスワードが違います',
  [ErrorCode.ALREADY_IN_ROOM]: '既に部屋に参加しています',
  [ErrorCode.NOT_IN_ROOM]: '部屋に参加していません',
  [ErrorCode.INVALID_PAYLOAD]: '入力内容が不正です',
  [ErrorCode.BATTLE_NOT_STARTED]: 'バトルが開始されていません',
  [ErrorCode.INVALID_COMMAND]: '無効なコマンドです',
  [ErrorCode.ALREADY_SUBMITTED]: 'コマンドは既に提出済みです',
};
