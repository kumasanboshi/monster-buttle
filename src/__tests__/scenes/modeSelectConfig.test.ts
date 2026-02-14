import {
  ModeSelectState,
  MODE_SELECT_LAYOUT,
  MODE_SELECT_LABELS,
  MODE_SELECT_COLORS,
  ERROR_MESSAGES,
} from '../../scenes/modeSelectConfig';
import { ErrorCode } from '../../../shared/types/SocketEvents';

describe('ModeSelectState', () => {
  it('4つの状態が定義されていること', () => {
    const states = Object.values(ModeSelectState);
    expect(states).toHaveLength(4);
  });

  it('MAIN_MENU が定義されていること', () => {
    expect(ModeSelectState.MAIN_MENU).toBe('MAIN_MENU');
  });

  it('CREATE_ROOM が定義されていること', () => {
    expect(ModeSelectState.CREATE_ROOM).toBe('CREATE_ROOM');
  });

  it('WAITING が定義されていること', () => {
    expect(ModeSelectState.WAITING).toBe('WAITING');
  });

  it('JOIN_ROOM が定義されていること', () => {
    expect(ModeSelectState.JOIN_ROOM).toBe('JOIN_ROOM');
  });
});

describe('MODE_SELECT_LAYOUT', () => {
  it('titleY が正の値であること', () => {
    expect(MODE_SELECT_LAYOUT.titleY).toBeGreaterThan(0);
  });

  it('buttonStartY が正の値であること', () => {
    expect(MODE_SELECT_LAYOUT.buttonStartY).toBeGreaterThan(0);
  });

  it('buttonSpacing が正の値であること', () => {
    expect(MODE_SELECT_LAYOUT.buttonSpacing).toBeGreaterThan(0);
  });

  it('inputWidth が正の値であること', () => {
    expect(MODE_SELECT_LAYOUT.inputWidth).toBeGreaterThan(0);
  });

  it('inputHeight が正の値であること', () => {
    expect(MODE_SELECT_LAYOUT.inputHeight).toBeGreaterThan(0);
  });

  it('noteY が正の値であること', () => {
    expect(MODE_SELECT_LAYOUT.noteY).toBeGreaterThan(0);
  });
});

describe('MODE_SELECT_LABELS', () => {
  it('title が非空文字列であること', () => {
    expect(MODE_SELECT_LABELS.title).toBeDefined();
    expect(typeof MODE_SELECT_LABELS.title).toBe('string');
    expect(MODE_SELECT_LABELS.title.length).toBeGreaterThan(0);
  });

  it('createRoom が非空文字列であること', () => {
    expect(MODE_SELECT_LABELS.createRoom).toBeDefined();
    expect(MODE_SELECT_LABELS.createRoom.length).toBeGreaterThan(0);
  });

  it('joinRoom が非空文字列であること', () => {
    expect(MODE_SELECT_LABELS.joinRoom).toBeDefined();
    expect(MODE_SELECT_LABELS.joinRoom.length).toBeGreaterThan(0);
  });

  it('back が非空文字列であること', () => {
    expect(MODE_SELECT_LABELS.back).toBeDefined();
    expect(MODE_SELECT_LABELS.back.length).toBeGreaterThan(0);
  });

  it('create が非空文字列であること', () => {
    expect(MODE_SELECT_LABELS.create).toBeDefined();
    expect(MODE_SELECT_LABELS.create.length).toBeGreaterThan(0);
  });

  it('join が非空文字列であること', () => {
    expect(MODE_SELECT_LABELS.join).toBeDefined();
    expect(MODE_SELECT_LABELS.join.length).toBeGreaterThan(0);
  });

  it('cancel が非空文字列であること', () => {
    expect(MODE_SELECT_LABELS.cancel).toBeDefined();
    expect(MODE_SELECT_LABELS.cancel.length).toBeGreaterThan(0);
  });

  it('waiting が非空文字列であること', () => {
    expect(MODE_SELECT_LABELS.waiting).toBeDefined();
    expect(MODE_SELECT_LABELS.waiting.length).toBeGreaterThan(0);
  });

  it('wifiNote が非空文字列であること', () => {
    expect(MODE_SELECT_LABELS.wifiNote).toBeDefined();
    expect(MODE_SELECT_LABELS.wifiNote.length).toBeGreaterThan(0);
  });

  it('passwordPlaceholder が非空文字列であること', () => {
    expect(MODE_SELECT_LABELS.passwordPlaceholder).toBeDefined();
    expect(MODE_SELECT_LABELS.passwordPlaceholder.length).toBeGreaterThan(0);
  });

  it('roomIdPlaceholder が非空文字列であること', () => {
    expect(MODE_SELECT_LABELS.roomIdPlaceholder).toBeDefined();
    expect(MODE_SELECT_LABELS.roomIdPlaceholder.length).toBeGreaterThan(0);
  });

  it('roomIdPrefix が非空文字列であること', () => {
    expect(MODE_SELECT_LABELS.roomIdPrefix).toBeDefined();
    expect(MODE_SELECT_LABELS.roomIdPrefix.length).toBeGreaterThan(0);
  });
});

describe('MODE_SELECT_COLORS', () => {
  it('background が有効な16進カラーコードであること', () => {
    expect(MODE_SELECT_COLORS.background).toMatch(/^#[0-9a-fA-F]{6}$/);
  });

  it('buttonNormal が有効な16進カラーコードであること', () => {
    expect(MODE_SELECT_COLORS.buttonNormal).toMatch(/^#[0-9a-fA-F]{6}$/);
  });

  it('buttonHover が有効な16進カラーコードであること', () => {
    expect(MODE_SELECT_COLORS.buttonHover).toMatch(/^#[0-9a-fA-F]{6}$/);
  });

  it('error が有効な16進カラーコードであること', () => {
    expect(MODE_SELECT_COLORS.error).toMatch(/^#[0-9a-fA-F]{6}$/);
  });

  it('note が有効な16進カラーコードであること', () => {
    expect(MODE_SELECT_COLORS.note).toMatch(/^#[0-9a-fA-F]{6}$/);
  });

  it('roomId が有効な16進カラーコードであること', () => {
    expect(MODE_SELECT_COLORS.roomId).toMatch(/^#[0-9a-fA-F]{6}$/);
  });
});

describe('ERROR_MESSAGES', () => {
  it('全ErrorCodeに対応するメッセージが定義されていること', () => {
    const allErrorCodes = Object.values(ErrorCode);
    for (const code of allErrorCodes) {
      expect(ERROR_MESSAGES[code]).toBeDefined();
      expect(typeof ERROR_MESSAGES[code]).toBe('string');
      expect(ERROR_MESSAGES[code].length).toBeGreaterThan(0);
    }
  });

  it('ROOM_NOT_FOUND のメッセージが定義されていること', () => {
    expect(ERROR_MESSAGES[ErrorCode.ROOM_NOT_FOUND]).toBeDefined();
  });

  it('ROOM_FULL のメッセージが定義されていること', () => {
    expect(ERROR_MESSAGES[ErrorCode.ROOM_FULL]).toBeDefined();
  });

  it('WRONG_PASSWORD のメッセージが定義されていること', () => {
    expect(ERROR_MESSAGES[ErrorCode.WRONG_PASSWORD]).toBeDefined();
  });

  it('ALREADY_IN_ROOM のメッセージが定義されていること', () => {
    expect(ERROR_MESSAGES[ErrorCode.ALREADY_IN_ROOM]).toBeDefined();
  });

  it('NOT_IN_ROOM のメッセージが定義されていること', () => {
    expect(ERROR_MESSAGES[ErrorCode.NOT_IN_ROOM]).toBeDefined();
  });

  it('INVALID_PAYLOAD のメッセージが定義されていること', () => {
    expect(ERROR_MESSAGES[ErrorCode.INVALID_PAYLOAD]).toBeDefined();
  });
});
