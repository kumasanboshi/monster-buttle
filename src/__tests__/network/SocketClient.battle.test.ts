/**
 * SocketClient バトルイベントテスト
 *
 * socket.io-clientをモックし、バトル関連イベントの連携をテストする。
 */

import { CommandType, DistanceType, StanceType, BattleResultType } from '../../types';
import type { TurnCommands, BattleState, TurnResult, BattleResult, Monster } from '../../types';

// --- socket.io-client モック ---
const mockOn = jest.fn();
const mockEmit = jest.fn();
const mockDisconnect = jest.fn();
const mockConnected = { value: false };

const mockSocket = {
  on: mockOn,
  emit: mockEmit,
  disconnect: mockDisconnect,
  get connected() {
    return mockConnected.value;
  },
};

jest.mock('socket.io-client', () => ({
  io: jest.fn(() => mockSocket),
}));

import { SocketClient, SocketClientCallbacks } from '../../network/SocketClient';

function getHandler(eventName: string): (...args: unknown[]) => void {
  const call = mockOn.mock.calls.find(([name]: [string]) => name === eventName);
  if (!call) throw new Error(`Handler for '${eventName}' not found`);
  return call[1];
}

function createTestBattleState(): BattleState {
  return {
    player1: {
      monsterId: 'monster-1',
      currentHp: 100,
      currentStance: StanceType.NORMAL,
      remainingSpecialCount: 3,
      usedReflectCount: 0,
    },
    player2: {
      monsterId: 'monster-2',
      currentHp: 100,
      currentStance: StanceType.NORMAL,
      remainingSpecialCount: 3,
      usedReflectCount: 0,
    },
    currentDistance: DistanceType.MID,
    currentTurn: 1,
    remainingTime: 120,
    isFinished: false,
  };
}

function createTestMonster(id: string): Monster {
  return {
    id,
    name: 'テスト',
    species: 'テスト種',
    stats: { hp: 100, strength: 30, special: 25, speed: 10, toughness: 20, specialAttackCount: 3 },
    weapon: { name: 'テスト武器', multiplier: 1.6 },
    reflector: { name: 'テストリフレクター', maxReflectCount: 2, reflectRate: 0.5 },
  };
}

describe('SocketClient (Battle)', () => {
  let client: SocketClient;
  let callbacks: Required<SocketClientCallbacks>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockConnected.value = false;
    callbacks = {
      onConnect: jest.fn(),
      onDisconnect: jest.fn(),
      onRoomCreated: jest.fn(),
      onRoomJoined: jest.fn(),
      onOpponentJoined: jest.fn(),
      onOpponentLeft: jest.fn(),
      onError: jest.fn(),
      onBattleStarted: jest.fn(),
      onWaitingForCommands: jest.fn(),
      onTurnResult: jest.fn(),
      onCommandTimeout: jest.fn(),
      onBattleFinished: jest.fn(),
      onOpponentDisconnected: jest.fn(),
    };
    client = new SocketClient();
    client.connect('http://localhost:3001', callbacks);
  });

  describe('startBattle', () => {
    it('battle:startイベントをemitすること', () => {
      client.startBattle('room-1', 'zaag');

      expect(mockEmit).toHaveBeenCalledWith('battle:start', {
        roomId: 'room-1',
        monsterId: 'zaag',
      });
    });

    it('未接続でstartBattleを呼んでもエラーにならないこと', () => {
      const newClient = new SocketClient();
      expect(() => newClient.startBattle('room-1', 'zaag')).not.toThrow();
    });
  });

  describe('submitCommands', () => {
    it('battle:command_submitイベントをemitすること', () => {
      const commands: TurnCommands = {
        first: { type: CommandType.ADVANCE },
        second: { type: CommandType.WEAPON_ATTACK },
      };
      client.submitCommands('room-1', commands);

      expect(mockEmit).toHaveBeenCalledWith('battle:command_submit', {
        roomId: 'room-1',
        commands,
      });
    });

    it('未接続でsubmitCommandsを呼んでもエラーにならないこと', () => {
      const newClient = new SocketClient();
      const commands: TurnCommands = {
        first: { type: CommandType.ADVANCE },
        second: { type: CommandType.WEAPON_ATTACK },
      };
      expect(() => newClient.submitCommands('room-1', commands)).not.toThrow();
    });
  });

  describe('surrender', () => {
    it('battle:surrenderイベントをemitすること', () => {
      client.surrender('room-1');

      expect(mockEmit).toHaveBeenCalledWith('battle:surrender', { roomId: 'room-1' });
    });

    it('未接続でsurrenderを呼んでもエラーにならないこと', () => {
      const newClient = new SocketClient();
      expect(() => newClient.surrender('room-1')).not.toThrow();
    });
  });

  describe('バトルイベントリスナー', () => {
    it('battle:startedリスナーが登録されること', () => {
      const registeredEvents = mockOn.mock.calls.map(([name]: [string]) => name);
      expect(registeredEvents).toContain('battle:started');
    });

    it('battle:startedイベントでonBattleStartedコールバックを呼ぶこと', () => {
      const handler = getHandler('battle:started');
      const payload = {
        roomId: 'room-1',
        player1Monster: createTestMonster('monster-1'),
        player2Monster: createTestMonster('monster-2'),
        initialState: createTestBattleState(),
      };
      handler(payload);

      expect(callbacks.onBattleStarted).toHaveBeenCalledWith(payload);
    });

    it('battle:waiting_commandsイベントでonWaitingForCommandsコールバックを呼ぶこと', () => {
      const handler = getHandler('battle:waiting_commands');
      const payload = { roomId: 'room-1', turnNumber: 1 };
      handler(payload);

      expect(callbacks.onWaitingForCommands).toHaveBeenCalledWith(payload);
    });

    it('battle:turn_resultイベントでonTurnResultコールバックを呼ぶこと', () => {
      const handler = getHandler('battle:turn_result');
      const payload = {
        roomId: 'room-1',
        turnResult: {} as TurnResult,
        newState: createTestBattleState(),
      };
      handler(payload);

      expect(callbacks.onTurnResult).toHaveBeenCalledWith(payload);
    });

    it('battle:command_timeoutイベントでonCommandTimeoutコールバックを呼ぶこと', () => {
      const handler = getHandler('battle:command_timeout');
      const payload = {
        roomId: 'room-1',
        timedOutPlayer: 2 as const,
        autoSelectedCommands: {
          first: { type: CommandType.ADVANCE },
          second: { type: CommandType.ADVANCE },
        },
      };
      handler(payload);

      expect(callbacks.onCommandTimeout).toHaveBeenCalledWith(payload);
    });

    it('battle:finishedイベントでonBattleFinishedコールバックを呼ぶこと', () => {
      const handler = getHandler('battle:finished');
      const payload = {
        roomId: 'room-1',
        result: {
          resultType: BattleResultType.PLAYER1_WIN,
          finalState: createTestBattleState(),
          turnHistory: [],
          reason: 'HP0',
        } as BattleResult,
        reason: 'hp_zero' as const,
      };
      handler(payload);

      expect(callbacks.onBattleFinished).toHaveBeenCalledWith(payload);
    });

    it('battle:opponent_disconnectedイベントでonOpponentDisconnectedコールバックを呼ぶこと', () => {
      const handler = getHandler('battle:opponent_disconnected');
      const payload = { roomId: 'room-1' };
      handler(payload);

      expect(callbacks.onOpponentDisconnected).toHaveBeenCalledWith(payload);
    });
  });

  describe('updateCallbacks', () => {
    it('コールバックを部分的に更新できること', () => {
      const newOnTurnResult = jest.fn();
      client.updateCallbacks({ onTurnResult: newOnTurnResult });

      const handler = getHandler('battle:turn_result');
      const payload = {
        roomId: 'room-1',
        turnResult: {} as TurnResult,
        newState: createTestBattleState(),
      };
      handler(payload);

      // 更新されたコールバックが呼ばれる
      expect(newOnTurnResult).toHaveBeenCalledWith(payload);
      // 元のコールバックは呼ばれない
      expect(callbacks.onTurnResult).not.toHaveBeenCalled();
    });

    it('他のコールバックは維持されること', () => {
      client.updateCallbacks({ onTurnResult: jest.fn() });

      // onBattleFinished は元のまま
      const handler = getHandler('battle:finished');
      const payload = {
        roomId: 'room-1',
        result: {
          resultType: BattleResultType.PLAYER1_WIN,
          finalState: createTestBattleState(),
          turnHistory: [],
          reason: 'HP Zero',
        } as BattleResult,
        reason: 'hp_zero' as const,
      };
      handler(payload);

      expect(callbacks.onBattleFinished).toHaveBeenCalledWith(payload);
    });
  });
});
