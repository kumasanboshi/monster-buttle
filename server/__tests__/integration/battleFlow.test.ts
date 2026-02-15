/**
 * バトルフロー統合テスト
 *
 * 部屋作成からバトル終了までの完全なフローをテストする。
 */
import { createServer } from 'http';
import { Server } from 'socket.io';
import { io as ioc, Socket as ClientSocket } from 'socket.io-client';
import { ConnectionManager } from '../../src/ConnectionManager';
import { RoomManager } from '../../src/RoomManager';
import { BattleManager } from '../../src/BattleManager';
import {
  ClientEvents,
  ServerEvents,
} from '../../../shared/types/SocketEvents';
import {
  CommandType,
  DistanceType,
  BattleResultType,
  TurnCommands,
} from '../../../src/types';
import type { AddressInfo } from 'net';

function makeCommands(first: CommandType, second: CommandType): TurnCommands {
  return { first: { type: first }, second: { type: second } };
}

describe('バトルフロー統合テスト', () => {
  let httpServer: ReturnType<typeof createServer>;
  let ioServer: Server;
  let roomManager: RoomManager;
  let battleManager: BattleManager;
  let connectionManager: ConnectionManager;
  let port: number;

  const monster1Id = 'zaag';
  const monster2Id = 'gardan';

  beforeAll((done) => {
    httpServer = createServer();
    ioServer = new Server(httpServer, { cors: { origin: '*' } });
    roomManager = new RoomManager();
    battleManager = new BattleManager();
    connectionManager = new ConnectionManager(ioServer, roomManager, battleManager);
    connectionManager.setupListeners();
    httpServer.listen(() => {
      port = (httpServer.address() as AddressInfo).port;
      done();
    });
  });

  afterAll((done) => {
    ioServer.close();
    httpServer.close(done);
  });

  beforeEach(() => {
    roomManager = new RoomManager();
    battleManager = new BattleManager();
    connectionManager.setRoomManager(roomManager);
    connectionManager.setBattleManager(battleManager);
    connectionManager.setCommandTimeoutMs(500); // 短いタイムアウトでテスト
  });

  function createClient(): ClientSocket {
    return ioc(`http://localhost:${port}`, {
      transports: ['websocket'],
      forceNew: true,
    });
  }

  function waitForEvent<T>(socket: ClientSocket, event: string, timeoutMs = 5000): Promise<T> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error(`Timeout waiting for ${event}`)), timeoutMs);
      socket.once(event, (data: T) => {
        clearTimeout(timer);
        resolve(data);
      });
    });
  }

  function connectClient(): Promise<ClientSocket> {
    return new Promise((resolve) => {
      const client = createClient();
      client.on('connect', () => resolve(client));
    });
  }

  async function createRoomWithPlayers(): Promise<{
    host: ClientSocket;
    guest: ClientSocket;
    roomId: string;
  }> {
    const host = await connectClient();
    const createdPromise = waitForEvent<any>(host, ServerEvents.ROOM_CREATED);
    host.emit(ClientEvents.ROOM_CREATE, {});
    const created = await createdPromise;

    const guest = await connectClient();
    const joinedPromise = waitForEvent<any>(guest, ServerEvents.ROOM_JOINED);
    const opponentJoinedPromise = waitForEvent<any>(host, ServerEvents.ROOM_OPPONENT_JOINED);
    guest.emit(ClientEvents.ROOM_JOIN, { roomId: created.roomId });
    await joinedPromise;
    await opponentJoinedPromise;

    return { host, guest, roomId: created.roomId };
  }

  async function startBattle(
    host: ClientSocket,
    guest: ClientSocket,
    roomId: string,
  ): Promise<any> {
    const hostStartedPromise = waitForEvent<any>(host, ServerEvents.BATTLE_STARTED);
    const guestStartedPromise = waitForEvent<any>(guest, ServerEvents.BATTLE_STARTED);
    host.emit(ClientEvents.BATTLE_START, { roomId, monsterId: monster1Id });
    guest.emit(ClientEvents.BATTLE_START, { roomId, monsterId: monster2Id });
    const hostData = await hostStartedPromise;
    await guestStartedPromise;
    return hostData;
  }

  afterEach((done) => {
    const sockets = ioServer.sockets.sockets;
    for (const [, socket] of sockets) {
      socket.disconnect(true);
    }
    connectionManager.clearAllTimeouts();
    setTimeout(done, 50);
  });

  it('フルフロー: 部屋作成 → バトル開始 → ターン実行 → 継続', async () => {
    const { host, guest, roomId } = await createRoomWithPlayers();
    const battleStarted = await startBattle(host, guest, roomId);

    // 初期状態を検証
    expect(battleStarted.initialState.currentDistance).toBe(DistanceType.MID);
    expect(battleStarted.initialState.currentTurn).toBe(1);
    expect(battleStarted.player1Monster.id).toBe(monster1Id);
    expect(battleStarted.player2Monster.id).toBe(monster2Id);

    // ターン1: 両者がコマンドを送信
    const hostResultPromise = waitForEvent<any>(host, ServerEvents.BATTLE_TURN_RESULT);
    const guestResultPromise = waitForEvent<any>(guest, ServerEvents.BATTLE_TURN_RESULT);

    host.emit(ClientEvents.BATTLE_COMMAND_SUBMIT, {
      roomId,
      commands: makeCommands(CommandType.ADVANCE, CommandType.ADVANCE),
    });
    guest.emit(ClientEvents.BATTLE_COMMAND_SUBMIT, {
      roomId,
      commands: makeCommands(CommandType.ADVANCE, CommandType.ADVANCE),
    });

    const hostResult = await hostResultPromise;
    const guestResult = await guestResultPromise;

    // ターン結果を検証
    expect(hostResult.turnResult.turnNumber).toBe(1);
    expect(hostResult.newState.currentTurn).toBe(2);
    // 同じ結果が両者に届いていること
    expect(hostResult.turnResult.turnNumber).toBe(guestResult.turnResult.turnNumber);
    expect(hostResult.newState.currentDistance).toBe(guestResult.newState.currentDistance);

    host.disconnect();
    guest.disconnect();
  });

  it('複数ターンの連続実行', async () => {
    const { host, guest, roomId } = await createRoomWithPlayers();
    await startBattle(host, guest, roomId);

    // ターン1
    let hostResultPromise = waitForEvent<any>(host, ServerEvents.BATTLE_TURN_RESULT);
    host.emit(ClientEvents.BATTLE_COMMAND_SUBMIT, {
      roomId,
      commands: makeCommands(CommandType.ADVANCE, CommandType.ADVANCE),
    });
    guest.emit(ClientEvents.BATTLE_COMMAND_SUBMIT, {
      roomId,
      commands: makeCommands(CommandType.ADVANCE, CommandType.ADVANCE),
    });
    let hostResult = await hostResultPromise;
    expect(hostResult.turnResult.turnNumber).toBe(1);
    expect(hostResult.newState.currentTurn).toBe(2);

    // ターン2
    hostResultPromise = waitForEvent<any>(host, ServerEvents.BATTLE_TURN_RESULT);
    host.emit(ClientEvents.BATTLE_COMMAND_SUBMIT, {
      roomId,
      commands: makeCommands(CommandType.WEAPON_ATTACK, CommandType.WEAPON_ATTACK),
    });
    guest.emit(ClientEvents.BATTLE_COMMAND_SUBMIT, {
      roomId,
      commands: makeCommands(CommandType.WEAPON_ATTACK, CommandType.WEAPON_ATTACK),
    });
    hostResult = await hostResultPromise;
    expect(hostResult.turnResult.turnNumber).toBe(2);
    expect(hostResult.newState.currentTurn).toBe(3);

    host.disconnect();
    guest.disconnect();
  });

  it('タイムアウトフロー: 片方が提出しない場合、自動的にターンが進む', async () => {
    const { host, guest, roomId } = await createRoomWithPlayers();
    await startBattle(host, guest, roomId);

    // ホストだけコマンド提出
    const waitingPromise = waitForEvent<any>(host, ServerEvents.BATTLE_WAITING_COMMANDS);
    host.emit(ClientEvents.BATTLE_COMMAND_SUBMIT, {
      roomId,
      commands: makeCommands(CommandType.ADVANCE, CommandType.WEAPON_ATTACK),
    });
    await waitingPromise;

    // ゲストは提出しない → タイムアウトで自動進行
    const timeoutPromise = waitForEvent<any>(host, ServerEvents.BATTLE_COMMAND_TIMEOUT, 3000);
    const resultPromise = waitForEvent<any>(host, ServerEvents.BATTLE_TURN_RESULT, 3000);

    const timeoutData = await timeoutPromise;
    expect(timeoutData.timedOutPlayer).toBe(2);
    expect(timeoutData.autoSelectedCommands).toBeDefined();
    // 初回ターンのデフォルト: ADVANCE + ADVANCE
    expect(timeoutData.autoSelectedCommands.first.type).toBe(CommandType.ADVANCE);
    expect(timeoutData.autoSelectedCommands.second.type).toBe(CommandType.ADVANCE);

    const resultData = await resultPromise;
    expect(resultData.turnResult.turnNumber).toBe(1);

    host.disconnect();
    guest.disconnect();
  }, 10000);

  it('降参フロー: ホストが降参するとゲスト勝利', async () => {
    const { host, guest, roomId } = await createRoomWithPlayers();
    await startBattle(host, guest, roomId);

    const hostFinishedPromise = waitForEvent<any>(host, ServerEvents.BATTLE_FINISHED);
    const guestFinishedPromise = waitForEvent<any>(guest, ServerEvents.BATTLE_FINISHED);

    host.emit(ClientEvents.BATTLE_SURRENDER, { roomId });

    const hostFinished = await hostFinishedPromise;
    const guestFinished = await guestFinishedPromise;

    expect(hostFinished.result.resultType).toBe(BattleResultType.PLAYER2_WIN);
    expect(hostFinished.reason).toBe('surrender');
    expect(guestFinished.result.resultType).toBe(BattleResultType.PLAYER2_WIN);

    host.disconnect();
    guest.disconnect();
  });

  it('切断フロー: バトル中のゲスト切断でホスト勝利', async () => {
    const { host, guest, roomId } = await createRoomWithPlayers();
    await startBattle(host, guest, roomId);

    const disconnectedPromise = waitForEvent<any>(host, ServerEvents.BATTLE_OPPONENT_DISCONNECTED);
    const finishedPromise = waitForEvent<any>(host, ServerEvents.BATTLE_FINISHED);

    guest.disconnect();

    const disconnectedData = await disconnectedPromise;
    expect(disconnectedData.roomId).toBe(roomId);

    const finishedData = await finishedPromise;
    expect(finishedData.result.resultType).toBe(BattleResultType.PLAYER1_WIN);
    expect(finishedData.reason).toBe('disconnect');

    host.disconnect();
  });

  it('切断フロー: バトル中のホスト切断でゲスト勝利', async () => {
    const { host, guest, roomId } = await createRoomWithPlayers();
    await startBattle(host, guest, roomId);

    const disconnectedPromise = waitForEvent<any>(guest, ServerEvents.BATTLE_OPPONENT_DISCONNECTED);
    const finishedPromise = waitForEvent<any>(guest, ServerEvents.BATTLE_FINISHED);

    host.disconnect();

    const disconnectedData = await disconnectedPromise;
    expect(disconnectedData.roomId).toBe(roomId);

    const finishedData = await finishedPromise;
    expect(finishedData.result.resultType).toBe(BattleResultType.PLAYER2_WIN);
    expect(finishedData.reason).toBe('disconnect');

    guest.disconnect();
  });
});
