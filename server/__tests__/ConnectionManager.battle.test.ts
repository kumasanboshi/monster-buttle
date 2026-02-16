import { createServer } from 'http';
import { Server } from 'socket.io';
import { io as ioc, Socket as ClientSocket } from 'socket.io-client';
import { ConnectionManager } from '../src/ConnectionManager';
import { RoomManager } from '../src/RoomManager';
import { BattleManager } from '../src/BattleManager';
import {
  ClientEvents,
  ServerEvents,
  ErrorCode,
} from '../../shared/types/SocketEvents';
import {
  CommandType,
  DistanceType,
  TurnCommands,
  BattleResultType,
} from '../../src/types';
import type { AddressInfo } from 'net';

function makeCommands(first: CommandType, second: CommandType): TurnCommands {
  return { first: { type: first }, second: { type: second } };
}

describe('ConnectionManager (Battle)', () => {
  let httpServer: ReturnType<typeof createServer>;
  let ioServer: Server;
  let roomManager: RoomManager;
  let battleManager: BattleManager;
  let connectionManager: ConnectionManager;
  let port: number;

  // 実際のモンスターDBに存在するIDを使用
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

  /** ホスト+ゲスト接続済みの部屋を作成するヘルパー */
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

  afterEach((done) => {
    const sockets = ioServer.sockets.sockets;
    for (const [, socket] of sockets) {
      socket.disconnect(true);
    }
    connectionManager.clearAllTimeouts();
    setTimeout(done, 50);
  });

  describe('battle:start', () => {
    it('バトルを開始してbattle:startedイベントを両者に送信する', async () => {
      const { host, guest, roomId } = await createRoomWithPlayers();

      const hostStartedPromise = waitForEvent<any>(host, ServerEvents.BATTLE_STARTED);
      const guestStartedPromise = waitForEvent<any>(guest, ServerEvents.BATTLE_STARTED);

      host.emit(ClientEvents.BATTLE_START, {
        roomId,
        monsterId: monster1Id,
      });
      // ゲスト側もモンスター選択を送信
      guest.emit(ClientEvents.BATTLE_START, {
        roomId,
        monsterId: monster2Id,
      });

      const hostData = await hostStartedPromise;
      const guestData = await guestStartedPromise;

      expect(hostData.roomId).toBe(roomId);
      expect(hostData.initialState).toBeDefined();
      expect(hostData.initialState.currentDistance).toBe(DistanceType.MID);
      expect(guestData.roomId).toBe(roomId);

      host.disconnect();
      guest.disconnect();
    });
  });

  describe('battle:command_submit', () => {
    it('片方だけ提出するとwaiting_commandsが通知される', async () => {
      const { host, guest, roomId } = await createRoomWithPlayers();

      // バトル開始
      const hostStartedPromise = waitForEvent<any>(host, ServerEvents.BATTLE_STARTED);
      const guestStartedPromise = waitForEvent<any>(guest, ServerEvents.BATTLE_STARTED);
      host.emit(ClientEvents.BATTLE_START, { roomId, monsterId: monster1Id });
      guest.emit(ClientEvents.BATTLE_START, { roomId, monsterId: monster2Id });
      await hostStartedPromise;
      await guestStartedPromise;

      // ホストだけコマンド提出
      const waitingPromise = waitForEvent<any>(host, ServerEvents.BATTLE_WAITING_COMMANDS);
      host.emit(ClientEvents.BATTLE_COMMAND_SUBMIT, {
        roomId,
        commands: makeCommands(CommandType.ADVANCE, CommandType.WEAPON_ATTACK),
      });
      const waitingData = await waitingPromise;

      expect(waitingData.roomId).toBe(roomId);
      expect(waitingData.turnNumber).toBeDefined();

      host.disconnect();
      guest.disconnect();
    });

    it('両方提出するとturn_resultが両者に通知される', async () => {
      const { host, guest, roomId } = await createRoomWithPlayers();

      // バトル開始
      const hostStartedPromise = waitForEvent<any>(host, ServerEvents.BATTLE_STARTED);
      const guestStartedPromise = waitForEvent<any>(guest, ServerEvents.BATTLE_STARTED);
      host.emit(ClientEvents.BATTLE_START, { roomId, monsterId: monster1Id });
      guest.emit(ClientEvents.BATTLE_START, { roomId, monsterId: monster2Id });
      await hostStartedPromise;
      await guestStartedPromise;

      // 両方コマンド提出
      const hostResultPromise = waitForEvent<any>(host, ServerEvents.BATTLE_TURN_RESULT);
      const guestResultPromise = waitForEvent<any>(guest, ServerEvents.BATTLE_TURN_RESULT);

      host.emit(ClientEvents.BATTLE_COMMAND_SUBMIT, {
        roomId,
        commands: makeCommands(CommandType.ADVANCE, CommandType.WEAPON_ATTACK),
      });
      guest.emit(ClientEvents.BATTLE_COMMAND_SUBMIT, {
        roomId,
        commands: makeCommands(CommandType.ADVANCE, CommandType.WEAPON_ATTACK),
      });

      const hostResult = await hostResultPromise;
      const guestResult = await guestResultPromise;

      expect(hostResult.roomId).toBe(roomId);
      expect(hostResult.turnResult).toBeDefined();
      expect(hostResult.newState).toBeDefined();
      expect(guestResult.turnResult).toBeDefined();

      host.disconnect();
      guest.disconnect();
    });

    it('同じプレイヤーが2回提出するとエラーを受信する', async () => {
      const { host, guest, roomId } = await createRoomWithPlayers();

      // バトル開始
      const hostStartedPromise = waitForEvent<any>(host, ServerEvents.BATTLE_STARTED);
      const guestStartedPromise = waitForEvent<any>(guest, ServerEvents.BATTLE_STARTED);
      host.emit(ClientEvents.BATTLE_START, { roomId, monsterId: monster1Id });
      guest.emit(ClientEvents.BATTLE_START, { roomId, monsterId: monster2Id });
      await hostStartedPromise;
      await guestStartedPromise;

      // ホストが2回提出
      const waitingPromise = waitForEvent<any>(host, ServerEvents.BATTLE_WAITING_COMMANDS);
      host.emit(ClientEvents.BATTLE_COMMAND_SUBMIT, {
        roomId,
        commands: makeCommands(CommandType.ADVANCE, CommandType.WEAPON_ATTACK),
      });
      await waitingPromise;

      const errorPromise = waitForEvent<any>(host, ServerEvents.ERROR);
      host.emit(ClientEvents.BATTLE_COMMAND_SUBMIT, {
        roomId,
        commands: makeCommands(CommandType.ADVANCE, CommandType.WEAPON_ATTACK),
      });
      const error = await errorPromise;

      expect(error.code).toBe(ErrorCode.ALREADY_SUBMITTED);

      host.disconnect();
      guest.disconnect();
    });
  });

  describe('battle:surrender', () => {
    it('降参するとbattle:finishedが両者に通知される', async () => {
      const { host, guest, roomId } = await createRoomWithPlayers();

      // バトル開始
      const hostStartedPromise = waitForEvent<any>(host, ServerEvents.BATTLE_STARTED);
      const guestStartedPromise = waitForEvent<any>(guest, ServerEvents.BATTLE_STARTED);
      host.emit(ClientEvents.BATTLE_START, { roomId, monsterId: monster1Id });
      guest.emit(ClientEvents.BATTLE_START, { roomId, monsterId: monster2Id });
      await hostStartedPromise;
      await guestStartedPromise;

      // ホストが降参
      const hostFinishedPromise = waitForEvent<any>(host, ServerEvents.BATTLE_FINISHED);
      const guestFinishedPromise = waitForEvent<any>(guest, ServerEvents.BATTLE_FINISHED);
      host.emit(ClientEvents.BATTLE_SURRENDER, { roomId });

      const hostFinished = await hostFinishedPromise;
      const guestFinished = await guestFinishedPromise;

      expect(hostFinished.roomId).toBe(roomId);
      expect(hostFinished.result.resultType).toBe(BattleResultType.PLAYER2_WIN);
      expect(hostFinished.reason).toBe('surrender');
      expect(guestFinished.result.resultType).toBe(BattleResultType.PLAYER2_WIN);

      host.disconnect();
      guest.disconnect();
    });
  });

  describe('コマンドタイムアウト', () => {
    it('タイムアウトで未提出プレイヤーにauto-submitされターン結果が通知される', async () => {
      // タイムアウトを短く設定（バトル開始前に設定する）
      connectionManager.setCommandTimeoutMs(500);

      const { host, guest, roomId } = await createRoomWithPlayers();

      // バトル開始
      const hostStartedPromise = waitForEvent<any>(host, ServerEvents.BATTLE_STARTED);
      const guestStartedPromise = waitForEvent<any>(guest, ServerEvents.BATTLE_STARTED);
      host.emit(ClientEvents.BATTLE_START, { roomId, monsterId: monster1Id });
      guest.emit(ClientEvents.BATTLE_START, { roomId, monsterId: monster2Id });
      await hostStartedPromise;
      await guestStartedPromise;

      // ホストだけコマンド提出
      const waitingPromise = waitForEvent<any>(host, ServerEvents.BATTLE_WAITING_COMMANDS);
      host.emit(ClientEvents.BATTLE_COMMAND_SUBMIT, {
        roomId,
        commands: makeCommands(CommandType.ADVANCE, CommandType.WEAPON_ATTACK),
      });
      await waitingPromise;

      // タイムアウト待ち → command_timeout + turn_result が通知される
      const hostTimeoutPromise = waitForEvent<any>(host, ServerEvents.BATTLE_COMMAND_TIMEOUT, 3000);
      const hostResultPromise = waitForEvent<any>(host, ServerEvents.BATTLE_TURN_RESULT, 3000);

      const timeoutData = await hostTimeoutPromise;
      expect(timeoutData.roomId).toBe(roomId);
      expect(timeoutData.timedOutPlayer).toBe(2);

      const resultData = await hostResultPromise;
      expect(resultData.turnResult).toBeDefined();

      host.disconnect();
      guest.disconnect();
    }, 10000);
  });

  describe('切断時のバトル処理', () => {
    it('バトル中にゲストが切断するとbattle:opponent_disconnectedとbattle:finishedが通知される', async () => {
      const { host, guest, roomId } = await createRoomWithPlayers();

      // バトル開始
      const hostStartedPromise = waitForEvent<any>(host, ServerEvents.BATTLE_STARTED);
      const guestStartedPromise = waitForEvent<any>(guest, ServerEvents.BATTLE_STARTED);
      host.emit(ClientEvents.BATTLE_START, { roomId, monsterId: monster1Id });
      guest.emit(ClientEvents.BATTLE_START, { roomId, monsterId: monster2Id });
      await hostStartedPromise;
      await guestStartedPromise;

      // ゲスト切断
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
  });

  describe('モンスター選択中の切断/退室', () => {
    it('モンスター選択中にゲストが切断するとpendingMonsterSelectionsがクリアされる', async () => {
      const { host, guest, roomId } = await createRoomWithPlayers();

      // ホストだけモンスター選択を送信（バトルはまだ始まらない）
      host.emit(ClientEvents.BATTLE_START, { roomId, monsterId: monster1Id });
      await new Promise((resolve) => setTimeout(resolve, 100));

      // ゲスト切断
      const opponentLeftPromise = waitForEvent<any>(host, ServerEvents.ROOM_OPPONENT_LEFT);
      guest.disconnect();
      await opponentLeftPromise;

      // 新しいゲストが参加
      const newGuest = await connectClient();
      const joinedPromise = waitForEvent<any>(newGuest, ServerEvents.ROOM_JOINED);
      const opponentJoinedPromise = waitForEvent<any>(host, ServerEvents.ROOM_OPPONENT_JOINED);
      newGuest.emit(ClientEvents.ROOM_JOIN, { roomId });
      await joinedPromise;
      await opponentJoinedPromise;

      // 新ゲストだけモンスター選択 → 前のホスト選択が残っていたらバトルが始まってしまう（バグ）
      // 正しくクリアされていれば、バトルは始まらない
      let battleStarted = false;
      newGuest.on(ServerEvents.BATTLE_STARTED, () => { battleStarted = true; });
      host.on(ServerEvents.BATTLE_STARTED, () => { battleStarted = true; });

      newGuest.emit(ClientEvents.BATTLE_START, { roomId, monsterId: monster2Id });
      await new Promise((resolve) => setTimeout(resolve, 200));

      expect(battleStarted).toBe(false);

      host.disconnect();
      newGuest.disconnect();
    });

    it('モンスター選択中にゲストが退室するとpendingMonsterSelectionsがクリアされる', async () => {
      const { host, guest, roomId } = await createRoomWithPlayers();

      // ホストだけモンスター選択を送信
      host.emit(ClientEvents.BATTLE_START, { roomId, monsterId: monster1Id });
      await new Promise((resolve) => setTimeout(resolve, 100));

      // ゲスト退室（room:leave）
      const opponentLeftPromise = waitForEvent<any>(host, ServerEvents.ROOM_OPPONENT_LEFT);
      guest.emit(ClientEvents.ROOM_LEAVE);
      await opponentLeftPromise;

      // 新しいゲストが参加
      const newGuest = await connectClient();
      const joinedPromise = waitForEvent<any>(newGuest, ServerEvents.ROOM_JOINED);
      const opponentJoinedPromise = waitForEvent<any>(host, ServerEvents.ROOM_OPPONENT_JOINED);
      newGuest.emit(ClientEvents.ROOM_JOIN, { roomId });
      await joinedPromise;
      await opponentJoinedPromise;

      // 新ゲストだけモンスター選択 → バトルが始まらないことを確認
      let battleStarted = false;
      newGuest.on(ServerEvents.BATTLE_STARTED, () => { battleStarted = true; });
      host.on(ServerEvents.BATTLE_STARTED, () => { battleStarted = true; });

      newGuest.emit(ClientEvents.BATTLE_START, { roomId, monsterId: monster2Id });
      await new Promise((resolve) => setTimeout(resolve, 200));

      expect(battleStarted).toBe(false);

      host.disconnect();
      newGuest.disconnect();
      guest.disconnect();
    });

    it('モンスター選択中にゲスト切断後、新ゲスト参加で両者再選択するとバトルが正常に開始する', async () => {
      const { host, guest, roomId } = await createRoomWithPlayers();

      // ホストだけモンスター選択を送信
      host.emit(ClientEvents.BATTLE_START, { roomId, monsterId: monster1Id });
      await new Promise((resolve) => setTimeout(resolve, 100));

      // ゲスト切断
      const opponentLeftPromise = waitForEvent<any>(host, ServerEvents.ROOM_OPPONENT_LEFT);
      guest.disconnect();
      await opponentLeftPromise;

      // 新しいゲストが参加
      const newGuest = await connectClient();
      const joinedPromise = waitForEvent<any>(newGuest, ServerEvents.ROOM_JOINED);
      const opponentJoinedPromise = waitForEvent<any>(host, ServerEvents.ROOM_OPPONENT_JOINED);
      newGuest.emit(ClientEvents.ROOM_JOIN, { roomId });
      await joinedPromise;
      await opponentJoinedPromise;

      // 両者がモンスター選択を再送信 → バトルが正常に開始する
      const hostStartedPromise = waitForEvent<any>(host, ServerEvents.BATTLE_STARTED);
      const guestStartedPromise = waitForEvent<any>(newGuest, ServerEvents.BATTLE_STARTED);
      host.emit(ClientEvents.BATTLE_START, { roomId, monsterId: monster1Id });
      newGuest.emit(ClientEvents.BATTLE_START, { roomId, monsterId: monster2Id });

      const hostData = await hostStartedPromise;
      const guestData = await guestStartedPromise;

      expect(hostData.roomId).toBe(roomId);
      expect(hostData.initialState).toBeDefined();
      expect(guestData.roomId).toBe(roomId);

      host.disconnect();
      newGuest.disconnect();
    });
  });
});
