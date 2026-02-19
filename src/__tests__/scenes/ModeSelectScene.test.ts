/**
 * ModeSelectScene テスト
 *
 * マッチングUI（部屋作成・参加）の状態遷移とSocket連携をテストする。
 */

import { SceneKey } from '../../scenes/sceneKeys';
import { ModeSelectState, MODE_SELECT_LABELS, ERROR_MESSAGES } from '../../scenes/modeSelectConfig';
import { GameMode } from '../../types/GameMode';
import { RoomInfo, RoomStatus } from '../../../shared/types/RoomTypes';
import { ErrorCode } from '../../../shared/types/SocketEvents';
import type { SocketClientCallbacks } from '../../network/SocketClient';

// --- SocketClient モック ---
const mockConnect = jest.fn();
const mockDisconnect = jest.fn();
const mockCreateRoom = jest.fn();
const mockJoinRoom = jest.fn();
const mockLeaveRoom = jest.fn();
const mockIsConnected = jest.fn().mockReturnValue(false);

jest.mock('../../network/SocketClient', () => ({
  SocketClient: jest.fn().mockImplementation(() => ({
    connect: mockConnect,
    disconnect: mockDisconnect,
    createRoom: mockCreateRoom,
    joinRoom: mockJoinRoom,
    leaveRoom: mockLeaveRoom,
    isConnected: mockIsConnected,
  })),
}));

// --- Phaser モック ---
jest.mock('phaser', () => ({
  Scene: class MockScene {
    scene = {
      key: '',
      start: jest.fn(),
    };
    add = {
      text: jest.fn().mockReturnValue({
        setOrigin: jest.fn().mockReturnThis(),
        setInteractive: jest.fn().mockReturnThis(),
        setColor: jest.fn().mockReturnThis(),
        setScale: jest.fn().mockReturnThis(),
        on: jest.fn().mockReturnThis(),
        setText: jest.fn().mockReturnThis(),
        setVisible: jest.fn().mockReturnThis(),
        destroy: jest.fn(),
      }),
      rectangle: jest.fn().mockReturnValue({
        setOrigin: jest.fn().mockReturnThis(),
        setInteractive: jest.fn().mockReturnThis(),
        setFillStyle: jest.fn().mockReturnThis(),
        setStrokeStyle: jest.fn().mockReturnThis(),
        on: jest.fn().mockReturnThis(),
        setVisible: jest.fn().mockReturnThis(),
        destroy: jest.fn(),
      }),
    };
    cameras = {
      main: {
        setBackgroundColor: jest.fn(),
      },
    };
    textures = {
      exists: jest.fn().mockReturnValue(false),
    };
    constructor(config: { key: string }) {
      this.scene.key = config.key;
    }
  },
}));

import { ModeSelectScene } from '../../scenes/ModeSelectScene';

// テスト用のRoomInfo
function createTestRoomInfo(overrides: Partial<RoomInfo> = {}): RoomInfo {
  return {
    roomId: 'ABC123',
    status: RoomStatus.WAITING,
    hasPassword: false,
    host: {
      socketId: 'host-socket-id',
      playerNumber: 1,
      selectedMonsterId: null,
      isConnected: true,
    },
    guest: null,
    createdAt: Date.now(),
    ...overrides,
  };
}

describe('ModeSelectScene', () => {
  let scene: ModeSelectScene;
  let addTextCalls: any[];
  let capturedCallbacks: SocketClientCallbacks;

  function setupScene(): void {
    scene = new ModeSelectScene();
    addTextCalls = [];

    // connectが呼ばれた時にcallbacksをキャプチャ
    mockConnect.mockImplementation((_url: string, callbacks: SocketClientCallbacks) => {
      capturedCallbacks = callbacks;
    });

    // add.textのモックを改善
    (scene as any).add.text.mockImplementation(
      (x: number, y: number, text: string, style?: object) => {
        const mockText = {
          x,
          y,
          text,
          style,
          setOrigin: jest.fn().mockReturnThis(),
          setInteractive: jest.fn().mockReturnThis(),
          setColor: jest.fn().mockReturnThis(),
          setScale: jest.fn().mockReturnThis(),
          on: jest.fn().mockReturnThis(),
          setText: jest.fn().mockReturnThis(),
          setVisible: jest.fn().mockReturnThis(),
          destroy: jest.fn(),
        };
        addTextCalls.push(mockText);
        return mockText;
      },
    );

    (scene as any).transitionTo = jest.fn();
    scene.create();
  }

  beforeEach(() => {
    jest.clearAllMocks();
    capturedCallbacks = {};
  });

  // ヘルパー: テキストからボタンを見つけてクリック（最後に追加された要素を優先）
  function clickButton(label: string): void {
    const matching = addTextCalls.filter((call) => call.text === label);
    const btn = matching[matching.length - 1];
    if (!btn) throw new Error(`Button '${label}' not found`);
    const onCalls = btn.on.mock.calls;
    const pointerdownCall = onCalls.find((call: any[]) => call[0] === 'pointerdown');
    if (!pointerdownCall) throw new Error(`pointerdown handler not found for '${label}'`);
    pointerdownCall[1]();
  }

  // ヘルパー: テキスト要素が存在するか確認（最後に追加された要素を優先）
  function findText(label: string): any {
    const matching = addTextCalls.filter((call) => call.text === label);
    return matching[matching.length - 1];
  }

  describe('初期化', () => {
    it('SceneKey.MODE_SELECTで初期化されること', () => {
      const s = new ModeSelectScene();
      expect((s as any).scene.key).toBe(SceneKey.MODE_SELECT);
    });

    it('create時にSocketClientに接続すること', () => {
      setupScene();
      expect(mockConnect).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          onConnect: expect.any(Function),
          onDisconnect: expect.any(Function),
          onRoomCreated: expect.any(Function),
          onRoomJoined: expect.any(Function),
          onOpponentJoined: expect.any(Function),
          onOpponentLeft: expect.any(Function),
          onError: expect.any(Function),
        }),
      );
    });

    it('MAIN_MENU状態で開始すること', () => {
      setupScene();
      expect(scene.getCurrentState()).toBe(ModeSelectState.MAIN_MENU);
    });
  });

  describe('MAIN_MENU', () => {
    beforeEach(() => setupScene());

    it('タイトルが表示されること', () => {
      expect(findText(MODE_SELECT_LABELS.title)).toBeDefined();
    });

    it('「部屋を作る」ボタンが表示されること', () => {
      expect(findText(MODE_SELECT_LABELS.createRoom)).toBeDefined();
    });

    it('「部屋に入る」ボタンが表示されること', () => {
      expect(findText(MODE_SELECT_LABELS.joinRoom)).toBeDefined();
    });

    it('「戻る」ボタンが表示されること', () => {
      expect(findText(MODE_SELECT_LABELS.back)).toBeDefined();
    });

    it('Wi-Fi注意書きが表示されること', () => {
      expect(findText(MODE_SELECT_LABELS.wifiNote)).toBeDefined();
    });

    it('「戻る」クリックでTITLEに遷移すること', () => {
      clickButton(MODE_SELECT_LABELS.back);
      expect((scene as any).transitionTo).toHaveBeenCalledWith(SceneKey.TITLE);
    });

    it('「部屋を作る」クリックでCREATE_ROOM状態になること', () => {
      clickButton(MODE_SELECT_LABELS.createRoom);
      expect(scene.getCurrentState()).toBe(ModeSelectState.CREATE_ROOM);
    });

    it('「部屋に入る」クリックでJOIN_ROOM状態になること', () => {
      clickButton(MODE_SELECT_LABELS.joinRoom);
      expect(scene.getCurrentState()).toBe(ModeSelectState.JOIN_ROOM);
    });
  });

  describe('CREATE_ROOM', () => {
    beforeEach(() => {
      setupScene();
      clickButton(MODE_SELECT_LABELS.createRoom);
      // CREATE_ROOM遷移後にUIが再構築されるので新しいテキストを拾う
    });

    it('「作成」ボタンが表示されること', () => {
      expect(findText(MODE_SELECT_LABELS.create)).toBeDefined();
    });

    it('「戻る」ボタンが表示されること', () => {
      expect(findText(MODE_SELECT_LABELS.back)).toBeDefined();
    });

    it('「作成」クリックでsocketClient.createRoomが呼ばれること', () => {
      clickButton(MODE_SELECT_LABELS.create);
      expect(mockCreateRoom).toHaveBeenCalled();
    });

    it('「戻る」クリックでMAIN_MENUに戻ること', () => {
      clickButton(MODE_SELECT_LABELS.back);
      expect(scene.getCurrentState()).toBe(ModeSelectState.MAIN_MENU);
    });
  });

  describe('部屋作成成功 → WAITING', () => {
    beforeEach(() => {
      setupScene();
      clickButton(MODE_SELECT_LABELS.createRoom);
      clickButton(MODE_SELECT_LABELS.create);
      // サーバーからroom:createdイベントをシミュレート
      const roomInfo = createTestRoomInfo();
      capturedCallbacks.onRoomCreated?.('ABC123', roomInfo);
    });

    it('WAITING状態に遷移すること', () => {
      expect(scene.getCurrentState()).toBe(ModeSelectState.WAITING);
    });

    it('部屋IDが表示されること', () => {
      const roomIdText = addTextCalls.find((call) =>
        typeof call.text === 'string' && call.text.includes('ABC123'),
      );
      expect(roomIdText).toBeDefined();
    });

    it('待機メッセージが表示されること', () => {
      expect(findText(MODE_SELECT_LABELS.waiting)).toBeDefined();
    });

    it('「キャンセル」ボタンが表示されること', () => {
      expect(findText(MODE_SELECT_LABELS.cancel)).toBeDefined();
    });

    it('「キャンセル」クリックでleaveRoomが呼ばれMAIN_MENUに戻ること', () => {
      clickButton(MODE_SELECT_LABELS.cancel);
      expect(mockLeaveRoom).toHaveBeenCalled();
      expect(scene.getCurrentState()).toBe(ModeSelectState.MAIN_MENU);
    });
  });

  describe('対戦相手入室 → キャラ選択へ遷移', () => {
    it('WAITING中にopponentJoinedでCHARACTER_SELECTに遷移すること', () => {
      setupScene();
      clickButton(MODE_SELECT_LABELS.createRoom);
      clickButton(MODE_SELECT_LABELS.create);
      capturedCallbacks.onRoomCreated?.('ABC123', createTestRoomInfo());

      // 相手が入室
      const roomInfoWithGuest = createTestRoomInfo({
        guest: {
          socketId: 'guest-socket',
          playerNumber: 2,
          selectedMonsterId: null,
          isConnected: true,
        },
      });
      capturedCallbacks.onOpponentJoined?.(roomInfoWithGuest);

      expect((scene as any).transitionTo).toHaveBeenCalledWith(
        SceneKey.CHARACTER_SELECT,
        expect.objectContaining({
          mode: GameMode.FREE_LOCAL,
          playerNumber: 1,
          roomId: 'ABC123',
        }),
      );
    });
  });

  describe('JOIN_ROOM', () => {
    beforeEach(() => {
      setupScene();
      clickButton(MODE_SELECT_LABELS.joinRoom);
    });

    it('「参加」ボタンが表示されること', () => {
      expect(findText(MODE_SELECT_LABELS.join)).toBeDefined();
    });

    it('「戻る」ボタンが表示されること', () => {
      expect(findText(MODE_SELECT_LABELS.back)).toBeDefined();
    });

    it('「戻る」クリックでMAIN_MENUに戻ること', () => {
      clickButton(MODE_SELECT_LABELS.back);
      expect(scene.getCurrentState()).toBe(ModeSelectState.MAIN_MENU);
    });

    it('「参加」クリックでsocketClient.joinRoomが呼ばれること', () => {
      // 部屋IDを設定
      scene.setRoomIdInput('XYZ789');
      clickButton(MODE_SELECT_LABELS.join);
      expect(mockJoinRoom).toHaveBeenCalledWith('XYZ789', undefined);
    });

    it('パスワード付きで参加できること', () => {
      scene.setRoomIdInput('XYZ789');
      scene.setPasswordInput('secret');
      clickButton(MODE_SELECT_LABELS.join);
      expect(mockJoinRoom).toHaveBeenCalledWith('XYZ789', 'secret');
    });
  });

  describe('部屋参加成功 → キャラ選択へ遷移', () => {
    it('roomJoinedでCHARACTER_SELECTに遷移すること', () => {
      setupScene();
      clickButton(MODE_SELECT_LABELS.joinRoom);
      scene.setRoomIdInput('XYZ789');
      clickButton(MODE_SELECT_LABELS.join);

      const roomInfo = createTestRoomInfo({ roomId: 'XYZ789' });
      capturedCallbacks.onRoomJoined?.(roomInfo, 2);

      expect((scene as any).transitionTo).toHaveBeenCalledWith(
        SceneKey.CHARACTER_SELECT,
        expect.objectContaining({
          mode: GameMode.FREE_LOCAL,
          playerNumber: 2,
          roomId: 'XYZ789',
        }),
      );
    });
  });

  describe('エラーハンドリング', () => {
    beforeEach(() => setupScene());

    it('エラー時にエラーメッセージが表示されること', () => {
      capturedCallbacks.onError?.(ErrorCode.ROOM_NOT_FOUND, '部屋が見つかりません');

      const errorText = addTextCalls.find(
        (call) => call.text === ERROR_MESSAGES[ErrorCode.ROOM_NOT_FOUND],
      );
      expect(errorText).toBeDefined();
    });

    it('ROOM_FULLエラーが表示されること', () => {
      capturedCallbacks.onError?.(ErrorCode.ROOM_FULL, '部屋が満員です');

      const errorText = addTextCalls.find(
        (call) => call.text === ERROR_MESSAGES[ErrorCode.ROOM_FULL],
      );
      expect(errorText).toBeDefined();
    });

    it('WRONG_PASSWORDエラーが表示されること', () => {
      capturedCallbacks.onError?.(ErrorCode.WRONG_PASSWORD, 'パスワードが違います');

      const errorText = addTextCalls.find(
        (call) => call.text === ERROR_MESSAGES[ErrorCode.WRONG_PASSWORD],
      );
      expect(errorText).toBeDefined();
    });
  });

  describe('切断ハンドリング', () => {
    it('切断時にMAIN_MENUに戻ること', () => {
      setupScene();
      clickButton(MODE_SELECT_LABELS.createRoom);
      clickButton(MODE_SELECT_LABELS.create);
      capturedCallbacks.onRoomCreated?.('ABC123', createTestRoomInfo());

      // WAITING状態で切断
      capturedCallbacks.onDisconnect?.('io server disconnect');

      expect(scene.getCurrentState()).toBe(ModeSelectState.MAIN_MENU);
    });
  });

  describe('入力バリデーション', () => {
    it('部屋ID未入力で参加ボタンを押してもjoinRoomが呼ばれないこと', () => {
      setupScene();
      clickButton(MODE_SELECT_LABELS.joinRoom);
      scene.setRoomIdInput('');
      clickButton(MODE_SELECT_LABELS.join);

      expect(mockJoinRoom).not.toHaveBeenCalled();
    });
  });

  describe('エラー表示の管理', () => {
    it('連続してエラーが来た場合、前のエラーが破棄されて最新のみ表示されること', () => {
      setupScene();
      capturedCallbacks.onError?.(ErrorCode.ROOM_NOT_FOUND, '部屋が見つかりません');
      capturedCallbacks.onError?.(ErrorCode.WRONG_PASSWORD, 'パスワードが違います');

      // 最新のエラーのみ表示
      const wrongPasswordErrors = addTextCalls.filter(
        (call) => call.text === ERROR_MESSAGES[ErrorCode.WRONG_PASSWORD],
      );
      expect(wrongPasswordErrors).toHaveLength(1);

      // 前のエラーテキストのdestroyが呼ばれている
      const roomNotFoundErrors = addTextCalls.filter(
        (call) => call.text === ERROR_MESSAGES[ErrorCode.ROOM_NOT_FOUND],
      );
      expect(roomNotFoundErrors[0].destroy).toHaveBeenCalled();
    });
  });

  describe('レースコンディション防止', () => {
    it('CREATE_ROOMで「戻る」を押した後にroom:createdが来てもWAITINGに遷移しないこと', () => {
      setupScene();
      clickButton(MODE_SELECT_LABELS.createRoom);
      clickButton(MODE_SELECT_LABELS.create);
      clickButton(MODE_SELECT_LABELS.back); // サーバー応答前に戻る

      // 遅れてサーバーからroom:createdが来る
      capturedCallbacks.onRoomCreated?.('ABC123', createTestRoomInfo());

      expect(scene.getCurrentState()).toBe(ModeSelectState.MAIN_MENU);
    });

    it('「作成」ボタンを連続クリックしてもcreateRoomが1回のみ呼ばれること', () => {
      setupScene();
      clickButton(MODE_SELECT_LABELS.createRoom);
      clickButton(MODE_SELECT_LABELS.create);
      clickButton(MODE_SELECT_LABELS.create); // 2回目

      expect(mockCreateRoom).toHaveBeenCalledTimes(1);
    });
  });
});
