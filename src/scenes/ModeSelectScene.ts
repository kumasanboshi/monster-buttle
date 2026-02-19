/**
 * モード選択画面シーン（マッチングUI）
 *
 * 部屋作成・参加のUI状態を管理し、SocketClientでサーバーと通信する。
 */

import { BaseScene } from './BaseScene';
import { SceneKey } from './sceneKeys';
import { GAME_WIDTH, GAME_HEIGHT } from './gameConfig';
import {
  ModeSelectState,
  MODE_SELECT_LAYOUT,
  MODE_SELECT_LABELS,
  MODE_SELECT_COLORS,
  ERROR_MESSAGES,
} from './modeSelectConfig';
import { SocketClient } from '../network/SocketClient';
import { GameMode } from '../types/GameMode';
import { BackgroundImageKey } from '../constants/imageKeys';
import { ErrorCode } from '../../shared/types/SocketEvents';
import { RoomInfo } from '../../shared/types/RoomTypes';

const SERVER_URL = process.env.VITE_SERVER_URL || 'http://localhost:3001';

export class ModeSelectScene extends BaseScene {
  private socketClient: SocketClient;
  private currentState: ModeSelectState = ModeSelectState.MAIN_MENU;
  private uiElements: Phaser.GameObjects.GameObject[] = [];
  private errorText: Phaser.GameObjects.Text | null = null;
  private roomId: string = '';
  private playerNumber: 1 | 2 = 1;
  private roomIdInput: string = '';
  private passwordInput: string = '';
  private isProcessing: boolean = false;

  constructor() {
    super(SceneKey.MODE_SELECT);
    this.socketClient = new SocketClient();
  }

  getCurrentState(): ModeSelectState {
    return this.currentState;
  }

  setRoomIdInput(value: string): void {
    this.roomIdInput = value;
  }

  setPasswordInput(value: string): void {
    this.passwordInput = value;
  }

  create(): void {
    this.cameras.main.setBackgroundColor(MODE_SELECT_COLORS.background);
    if (this.textures.exists(BackgroundImageKey.MODE_SELECT)) {
      this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, BackgroundImageKey.MODE_SELECT).setOrigin(0.5);
    }
    this.connectToServer();
    this.showMainMenu();
  }

  private connectToServer(): void {
    this.socketClient.connect(SERVER_URL, {
      onConnect: () => {},
      onDisconnect: () => {
        this.showMainMenu();
      },
      onRoomCreated: (roomId: string, _roomInfo: RoomInfo) => {
        if (this.currentState !== ModeSelectState.CREATE_ROOM) return;
        this.roomId = roomId;
        this.playerNumber = 1;
        this.isProcessing = false;
        this.showWaiting();
      },
      onRoomJoined: (roomInfo: RoomInfo, playerNumber: 1 | 2) => {
        if (this.currentState !== ModeSelectState.JOIN_ROOM) return;
        this.roomId = roomInfo.roomId;
        this.playerNumber = playerNumber;
        this.isProcessing = false;
        this.transitionToCharacterSelect();
      },
      onOpponentJoined: (_roomInfo: RoomInfo) => {
        if (this.currentState !== ModeSelectState.WAITING) return;
        this.transitionToCharacterSelect();
      },
      onOpponentLeft: () => {},
      onError: (code: ErrorCode) => {
        this.isProcessing = false;
        this.showError(code);
      },
    });
  }

  private clearUI(): void {
    this.uiElements.forEach((el) => el.destroy());
    this.uiElements = [];
  }

  private showMainMenu(): void {
    this.clearUI();
    this.currentState = ModeSelectState.MAIN_MENU;
    this.roomIdInput = '';
    this.passwordInput = '';
    this.isProcessing = false;
    this.errorText = null;

    // タイトル
    this.uiElements.push(
      this.add
        .text(GAME_WIDTH / 2, MODE_SELECT_LAYOUT.titleY, MODE_SELECT_LABELS.title, {
          fontSize: '32px',
          color: '#ffffff',
        })
        .setOrigin(0.5),
    );

    // ボタン
    const buttons = [
      { label: MODE_SELECT_LABELS.createRoom, action: () => this.showCreateRoom() },
      { label: MODE_SELECT_LABELS.joinRoom, action: () => this.showJoinRoom() },
      { label: MODE_SELECT_LABELS.back, action: () => this.transitionTo(SceneKey.TITLE) },
    ];

    buttons.forEach((btn, index) => {
      const y = MODE_SELECT_LAYOUT.buttonStartY + index * MODE_SELECT_LAYOUT.buttonSpacing;
      const text = this.add
        .text(GAME_WIDTH / 2, y, btn.label, {
          fontSize: '24px',
          color: MODE_SELECT_COLORS.buttonNormal,
        })
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true });

      text.on('pointerover', () => text.setColor(MODE_SELECT_COLORS.buttonHover));
      text.on('pointerout', () => text.setColor(MODE_SELECT_COLORS.buttonNormal));
      text.on('pointerdown', btn.action);

      this.uiElements.push(text);
    });

    // Wi-Fi注意書き
    this.uiElements.push(
      this.add
        .text(GAME_WIDTH / 2, MODE_SELECT_LAYOUT.noteY, MODE_SELECT_LABELS.wifiNote, {
          fontSize: '14px',
          color: MODE_SELECT_COLORS.note,
        })
        .setOrigin(0.5),
    );
  }

  private showCreateRoom(): void {
    this.clearUI();
    this.currentState = ModeSelectState.CREATE_ROOM;

    // タイトル
    this.uiElements.push(
      this.add
        .text(GAME_WIDTH / 2, MODE_SELECT_LAYOUT.titleY, MODE_SELECT_LABELS.title, {
          fontSize: '32px',
          color: '#ffffff',
        })
        .setOrigin(0.5),
    );

    // パスワードプレースホルダー表示
    this.uiElements.push(
      this.add
        .text(GAME_WIDTH / 2, MODE_SELECT_LAYOUT.buttonStartY, MODE_SELECT_LABELS.passwordPlaceholder, {
          fontSize: '18px',
          color: MODE_SELECT_COLORS.note,
        })
        .setOrigin(0.5),
    );

    // 作成ボタン
    const createBtn = this.add
      .text(GAME_WIDTH / 2, MODE_SELECT_LAYOUT.buttonStartY + MODE_SELECT_LAYOUT.buttonSpacing, MODE_SELECT_LABELS.create, {
        fontSize: '24px',
        color: MODE_SELECT_COLORS.buttonNormal,
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    createBtn.on('pointerover', () => createBtn.setColor(MODE_SELECT_COLORS.buttonHover));
    createBtn.on('pointerout', () => createBtn.setColor(MODE_SELECT_COLORS.buttonNormal));
    createBtn.on('pointerdown', () => {
      if (this.isProcessing) return;
      this.isProcessing = true;
      const password = this.passwordInput || undefined;
      this.socketClient.createRoom(password);
    });
    this.uiElements.push(createBtn);

    // 戻るボタン
    const backBtn = this.add
      .text(GAME_WIDTH / 2, MODE_SELECT_LAYOUT.buttonStartY + MODE_SELECT_LAYOUT.buttonSpacing * 2, MODE_SELECT_LABELS.back, {
        fontSize: '24px',
        color: MODE_SELECT_COLORS.buttonNormal,
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    backBtn.on('pointerover', () => backBtn.setColor(MODE_SELECT_COLORS.buttonHover));
    backBtn.on('pointerout', () => backBtn.setColor(MODE_SELECT_COLORS.buttonNormal));
    backBtn.on('pointerdown', () => this.showMainMenu());
    this.uiElements.push(backBtn);
  }

  private showWaiting(): void {
    this.clearUI();
    this.currentState = ModeSelectState.WAITING;

    // 部屋ID表示
    this.uiElements.push(
      this.add
        .text(GAME_WIDTH / 2, MODE_SELECT_LAYOUT.buttonStartY, MODE_SELECT_LABELS.roomIdPrefix + this.roomId, {
          fontSize: '28px',
          color: MODE_SELECT_COLORS.roomId,
        })
        .setOrigin(0.5),
    );

    // 待機メッセージ
    this.uiElements.push(
      this.add
        .text(GAME_WIDTH / 2, MODE_SELECT_LAYOUT.buttonStartY + MODE_SELECT_LAYOUT.buttonSpacing, MODE_SELECT_LABELS.waiting, {
          fontSize: '20px',
          color: '#ffffff',
        })
        .setOrigin(0.5),
    );

    // キャンセルボタン
    const cancelBtn = this.add
      .text(GAME_WIDTH / 2, MODE_SELECT_LAYOUT.buttonStartY + MODE_SELECT_LAYOUT.buttonSpacing * 2, MODE_SELECT_LABELS.cancel, {
        fontSize: '24px',
        color: MODE_SELECT_COLORS.buttonNormal,
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    cancelBtn.on('pointerover', () => cancelBtn.setColor(MODE_SELECT_COLORS.buttonHover));
    cancelBtn.on('pointerout', () => cancelBtn.setColor(MODE_SELECT_COLORS.buttonNormal));
    cancelBtn.on('pointerdown', () => {
      this.socketClient.leaveRoom();
      this.showMainMenu();
    });
    this.uiElements.push(cancelBtn);
  }

  private showJoinRoom(): void {
    this.clearUI();
    this.currentState = ModeSelectState.JOIN_ROOM;

    // タイトル
    this.uiElements.push(
      this.add
        .text(GAME_WIDTH / 2, MODE_SELECT_LAYOUT.titleY, MODE_SELECT_LABELS.title, {
          fontSize: '32px',
          color: '#ffffff',
        })
        .setOrigin(0.5),
    );

    // 部屋IDプレースホルダー
    this.uiElements.push(
      this.add
        .text(GAME_WIDTH / 2, MODE_SELECT_LAYOUT.buttonStartY, MODE_SELECT_LABELS.roomIdPlaceholder, {
          fontSize: '18px',
          color: MODE_SELECT_COLORS.note,
        })
        .setOrigin(0.5),
    );

    // パスワードプレースホルダー
    this.uiElements.push(
      this.add
        .text(GAME_WIDTH / 2, MODE_SELECT_LAYOUT.buttonStartY + MODE_SELECT_LAYOUT.buttonSpacing, MODE_SELECT_LABELS.passwordPlaceholder, {
          fontSize: '18px',
          color: MODE_SELECT_COLORS.note,
        })
        .setOrigin(0.5),
    );

    // 参加ボタン
    const joinBtn = this.add
      .text(GAME_WIDTH / 2, MODE_SELECT_LAYOUT.buttonStartY + MODE_SELECT_LAYOUT.buttonSpacing * 2, MODE_SELECT_LABELS.join, {
        fontSize: '24px',
        color: MODE_SELECT_COLORS.buttonNormal,
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    joinBtn.on('pointerover', () => joinBtn.setColor(MODE_SELECT_COLORS.buttonHover));
    joinBtn.on('pointerout', () => joinBtn.setColor(MODE_SELECT_COLORS.buttonNormal));
    joinBtn.on('pointerdown', () => {
      if (this.isProcessing || !this.roomIdInput) return;
      this.isProcessing = true;
      const password = this.passwordInput || undefined;
      this.socketClient.joinRoom(this.roomIdInput, password);
    });
    this.uiElements.push(joinBtn);

    // 戻るボタン
    const backBtn = this.add
      .text(GAME_WIDTH / 2, MODE_SELECT_LAYOUT.buttonStartY + MODE_SELECT_LAYOUT.buttonSpacing * 3, MODE_SELECT_LABELS.back, {
        fontSize: '24px',
        color: MODE_SELECT_COLORS.buttonNormal,
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    backBtn.on('pointerover', () => backBtn.setColor(MODE_SELECT_COLORS.buttonHover));
    backBtn.on('pointerout', () => backBtn.setColor(MODE_SELECT_COLORS.buttonNormal));
    backBtn.on('pointerdown', () => this.showMainMenu());
    this.uiElements.push(backBtn);
  }

  private showError(code: ErrorCode): void {
    if (this.errorText) {
      this.errorText.destroy();
    }
    const message = ERROR_MESSAGES[code];
    this.errorText = this.add
      .text(GAME_WIDTH / 2, MODE_SELECT_LAYOUT.noteY - 40, message, {
        fontSize: '16px',
        color: MODE_SELECT_COLORS.error,
      })
      .setOrigin(0.5) as unknown as Phaser.GameObjects.Text;
    this.uiElements.push(this.errorText);
  }

  private transitionToCharacterSelect(): void {
    this.transitionTo(SceneKey.CHARACTER_SELECT, {
      mode: GameMode.FREE_LOCAL,
      playerNumber: this.playerNumber,
      roomId: this.roomId,
    });
  }
}
