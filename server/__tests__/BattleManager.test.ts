import { BattleManager } from '../src/BattleManager';
import { RoomManager } from '../src/RoomManager';
import {
  CommandType,
  DistanceType,
  StanceType,
  Monster,
  TurnCommands,
  BattleResultType,
} from '../../src/types';

/**
 * テスト用モンスターを生成するヘルパー
 */
function createTestMonster(overrides: Partial<Monster> = {}): Monster {
  return {
    id: 'test-monster-1',
    name: 'テストモンスター',
    species: 'テスト種',
    stats: {
      hp: 100,
      strength: 30,
      special: 25,
      speed: 0,
      toughness: 20,
      specialAttackCount: 3,
    },
    weapon: {
      name: 'テスト武器',
      multiplier: 1.6,
    },
    reflector: {
      name: 'テストリフレクター',
      maxReflectCount: 2,
      reflectRate: 0.5,
    },
    ...overrides,
  };
}

function makeCommands(first: CommandType, second: CommandType): TurnCommands {
  return { first: { type: first }, second: { type: second } };
}

describe('BattleManager', () => {
  let battleManager: BattleManager;
  let roomManager: RoomManager;
  const monster1 = createTestMonster({ id: 'monster-1', name: 'モンスター1' });
  const monster2 = createTestMonster({ id: 'monster-2', name: 'モンスター2' });

  beforeEach(() => {
    battleManager = new BattleManager();
    roomManager = new RoomManager();
  });

  describe('startBattle', () => {
    it('バトルを開始し初期状態を返す', () => {
      const room = roomManager.createRoom('host-id');
      roomManager.joinRoom(room.roomId, 'guest-id');

      const battleRoom = battleManager.startBattle(room, monster1, monster2);

      expect(battleRoom.battleState).toBeDefined();
      expect(battleRoom.player1Monster).toBe(monster1);
      expect(battleRoom.player2Monster).toBe(monster2);
    });

    it('初期距離がMIDである', () => {
      const room = roomManager.createRoom('host-id');
      roomManager.joinRoom(room.roomId, 'guest-id');

      const battleRoom = battleManager.startBattle(room, monster1, monster2);

      expect(battleRoom.battleState!.currentDistance).toBe(DistanceType.MID);
    });

    it('初期ターンが1である', () => {
      const room = roomManager.createRoom('host-id');
      roomManager.joinRoom(room.roomId, 'guest-id');

      const battleRoom = battleManager.startBattle(room, monster1, monster2);

      expect(battleRoom.battleState!.currentTurn).toBe(1);
    });

    it('初期HPが各モンスターのHP最大値になっている', () => {
      const room = roomManager.createRoom('host-id');
      roomManager.joinRoom(room.roomId, 'guest-id');

      const battleRoom = battleManager.startBattle(room, monster1, monster2);

      expect(battleRoom.battleState!.player1.currentHp).toBe(monster1.stats.hp);
      expect(battleRoom.battleState!.player2.currentHp).toBe(monster2.stats.hp);
    });

    it('初期スタンスがNORMALである', () => {
      const room = roomManager.createRoom('host-id');
      roomManager.joinRoom(room.roomId, 'guest-id');

      const battleRoom = battleManager.startBattle(room, monster1, monster2);

      expect(battleRoom.battleState!.player1.currentStance).toBe(StanceType.NORMAL);
      expect(battleRoom.battleState!.player2.currentStance).toBe(StanceType.NORMAL);
    });

    it('pendingCommandsが初期化される', () => {
      const room = roomManager.createRoom('host-id');
      roomManager.joinRoom(room.roomId, 'guest-id');

      const battleRoom = battleManager.startBattle(room, monster1, monster2);

      expect(battleRoom.pendingCommands).toBeDefined();
      expect(battleRoom.pendingCommands!.player1Commands).toBeNull();
      expect(battleRoom.pendingCommands!.player2Commands).toBeNull();
    });

    it('turnHistoryが空配列で初期化される', () => {
      const room = roomManager.createRoom('host-id');
      roomManager.joinRoom(room.roomId, 'guest-id');

      const battleRoom = battleManager.startBattle(room, monster1, monster2);

      expect(battleRoom.turnHistory).toEqual([]);
    });
  });

  describe('submitCommands', () => {
    it('player1がコマンドを提出できる', () => {
      const room = roomManager.createRoom('host-id');
      roomManager.joinRoom(room.roomId, 'guest-id');
      battleManager.startBattle(room, monster1, monster2);

      const commands = makeCommands(CommandType.ADVANCE, CommandType.WEAPON_ATTACK);
      const result = battleManager.submitCommands(room.roomId, 1, commands);

      expect('error' in result).toBe(false);
      if (!('error' in result)) {
        expect(result.bothReady).toBe(false);
      }
    });

    it('player2がコマンドを提出できる', () => {
      const room = roomManager.createRoom('host-id');
      roomManager.joinRoom(room.roomId, 'guest-id');
      battleManager.startBattle(room, monster1, monster2);

      const commands = makeCommands(CommandType.RETREAT, CommandType.REFLECTOR);
      const result = battleManager.submitCommands(room.roomId, 2, commands);

      expect('error' in result).toBe(false);
      if (!('error' in result)) {
        expect(result.bothReady).toBe(false);
      }
    });

    it('両方提出するとbothReady=trueを返す', () => {
      const room = roomManager.createRoom('host-id');
      roomManager.joinRoom(room.roomId, 'guest-id');
      battleManager.startBattle(room, monster1, monster2);

      const p1Cmds = makeCommands(CommandType.ADVANCE, CommandType.WEAPON_ATTACK);
      const p2Cmds = makeCommands(CommandType.RETREAT, CommandType.REFLECTOR);

      battleManager.submitCommands(room.roomId, 1, p1Cmds);
      const result = battleManager.submitCommands(room.roomId, 2, p2Cmds);

      expect('error' in result).toBe(false);
      if (!('error' in result)) {
        expect(result.bothReady).toBe(true);
      }
    });

    it('同じプレイヤーが2回提出するとエラーを返す', () => {
      const room = roomManager.createRoom('host-id');
      roomManager.joinRoom(room.roomId, 'guest-id');
      battleManager.startBattle(room, monster1, monster2);

      const commands = makeCommands(CommandType.ADVANCE, CommandType.WEAPON_ATTACK);
      battleManager.submitCommands(room.roomId, 1, commands);
      const result = battleManager.submitCommands(room.roomId, 1, commands);

      expect('error' in result).toBe(true);
      if ('error' in result) {
        expect(result.error).toBe('ALREADY_SUBMITTED');
      }
    });

    it('存在しない部屋にはエラーを返す', () => {
      const commands = makeCommands(CommandType.ADVANCE, CommandType.WEAPON_ATTACK);
      const result = battleManager.submitCommands('nonexistent', 1, commands);

      expect('error' in result).toBe(true);
      if ('error' in result) {
        expect(result.error).toBe('BATTLE_NOT_STARTED');
      }
    });

    it('バトル未開始の部屋にはエラーを返す', () => {
      const room = roomManager.createRoom('host-id');
      roomManager.joinRoom(room.roomId, 'guest-id');
      // startBattle() を呼ばない

      const commands = makeCommands(CommandType.ADVANCE, CommandType.WEAPON_ATTACK);
      const result = battleManager.submitCommands(room.roomId, 1, commands);

      expect('error' in result).toBe(true);
    });
  });

  describe('executeTurn', () => {
    it('ターンを処理しターン結果を返す', () => {
      const room = roomManager.createRoom('host-id');
      roomManager.joinRoom(room.roomId, 'guest-id');
      battleManager.startBattle(room, monster1, monster2);

      const p1Cmds = makeCommands(CommandType.ADVANCE, CommandType.WEAPON_ATTACK);
      const p2Cmds = makeCommands(CommandType.ADVANCE, CommandType.WEAPON_ATTACK);
      battleManager.submitCommands(room.roomId, 1, p1Cmds);
      battleManager.submitCommands(room.roomId, 2, p2Cmds);

      const result = battleManager.executeTurn(room.roomId);

      expect('error' in result).toBe(false);
      if (!('error' in result)) {
        expect(result.turnResult).toBeDefined();
        expect(result.newState).toBeDefined();
        expect(result.turnResult.turnNumber).toBe(1);
      }
    });

    it('ターン処理後にpendingCommandsがクリアされる', () => {
      const room = roomManager.createRoom('host-id');
      roomManager.joinRoom(room.roomId, 'guest-id');
      battleManager.startBattle(room, monster1, monster2);

      const p1Cmds = makeCommands(CommandType.ADVANCE, CommandType.WEAPON_ATTACK);
      const p2Cmds = makeCommands(CommandType.ADVANCE, CommandType.WEAPON_ATTACK);
      battleManager.submitCommands(room.roomId, 1, p1Cmds);
      battleManager.submitCommands(room.roomId, 2, p2Cmds);
      battleManager.executeTurn(room.roomId);

      const battleRoom = battleManager.getRoom(room.roomId);
      expect(battleRoom!.pendingCommands!.player1Commands).toBeNull();
      expect(battleRoom!.pendingCommands!.player2Commands).toBeNull();
    });

    it('ターン処理後にturnHistoryに追加される', () => {
      const room = roomManager.createRoom('host-id');
      roomManager.joinRoom(room.roomId, 'guest-id');
      battleManager.startBattle(room, monster1, monster2);

      const p1Cmds = makeCommands(CommandType.ADVANCE, CommandType.WEAPON_ATTACK);
      const p2Cmds = makeCommands(CommandType.ADVANCE, CommandType.WEAPON_ATTACK);
      battleManager.submitCommands(room.roomId, 1, p1Cmds);
      battleManager.submitCommands(room.roomId, 2, p2Cmds);
      battleManager.executeTurn(room.roomId);

      const battleRoom = battleManager.getRoom(room.roomId);
      expect(battleRoom!.turnHistory).toHaveLength(1);
    });

    it('ターン番号がインクリメントされる', () => {
      const room = roomManager.createRoom('host-id');
      roomManager.joinRoom(room.roomId, 'guest-id');
      battleManager.startBattle(room, monster1, monster2);

      // Turn 1
      const p1Cmds = makeCommands(CommandType.ADVANCE, CommandType.ADVANCE);
      const p2Cmds = makeCommands(CommandType.ADVANCE, CommandType.ADVANCE);
      battleManager.submitCommands(room.roomId, 1, p1Cmds);
      battleManager.submitCommands(room.roomId, 2, p2Cmds);
      battleManager.executeTurn(room.roomId);

      const battleRoom = battleManager.getRoom(room.roomId);
      expect(battleRoom!.battleState!.currentTurn).toBe(2);
    });

    it('HPが0になると勝敗結果を返す', () => {
      const room = roomManager.createRoom('host-id');
      roomManager.joinRoom(room.roomId, 'guest-id');
      // HP1のモンスターを使って即決着
      const weakMonster = createTestMonster({ id: 'weak', stats: { ...monster1.stats, hp: 1, toughness: 0 } });
      battleManager.startBattle(room, weakMonster, monster2);

      // 近距離で武器攻撃 → HP1なので倒れる
      const p1Cmds = makeCommands(CommandType.ADVANCE, CommandType.WEAPON_ATTACK);
      const p2Cmds = makeCommands(CommandType.ADVANCE, CommandType.WEAPON_ATTACK);
      battleManager.submitCommands(room.roomId, 1, p1Cmds);
      battleManager.submitCommands(room.roomId, 2, p2Cmds);

      const result = battleManager.executeTurn(room.roomId);

      expect('error' in result).toBe(false);
      if (!('error' in result)) {
        expect(result.battleResult).toBeDefined();
      }
    });

    it('存在しない部屋にはエラーを返す', () => {
      const result = battleManager.executeTurn('nonexistent');
      expect('error' in result).toBe(true);
    });
  });

  describe('getLastCommands', () => {
    it('初回ターンではデフォルトコマンド(ADVANCE+ADVANCE)を返す', () => {
      const room = roomManager.createRoom('host-id');
      roomManager.joinRoom(room.roomId, 'guest-id');
      battleManager.startBattle(room, monster1, monster2);

      const commands = battleManager.getLastCommands(room.roomId, 1);

      expect(commands).not.toBeNull();
      expect(commands!.first.type).toBe(CommandType.ADVANCE);
      expect(commands!.second.type).toBe(CommandType.ADVANCE);
    });

    it('前ターンと同じコマンドを返す', () => {
      const room = roomManager.createRoom('host-id');
      roomManager.joinRoom(room.roomId, 'guest-id');
      battleManager.startBattle(room, monster1, monster2);

      // Turn 1: 前進+武器
      const p1Cmds = makeCommands(CommandType.RETREAT, CommandType.SPECIAL_ATTACK);
      const p2Cmds = makeCommands(CommandType.ADVANCE, CommandType.WEAPON_ATTACK);
      battleManager.submitCommands(room.roomId, 1, p1Cmds);
      battleManager.submitCommands(room.roomId, 2, p2Cmds);
      battleManager.executeTurn(room.roomId);

      // Player1の前回コマンドを取得
      const lastCommands = battleManager.getLastCommands(room.roomId, 1);
      expect(lastCommands!.first.type).toBe(CommandType.RETREAT);
      expect(lastCommands!.second.type).toBe(CommandType.SPECIAL_ATTACK);
    });

    it('player2の前回コマンドも取得できる', () => {
      const room = roomManager.createRoom('host-id');
      roomManager.joinRoom(room.roomId, 'guest-id');
      battleManager.startBattle(room, monster1, monster2);

      const p1Cmds = makeCommands(CommandType.ADVANCE, CommandType.WEAPON_ATTACK);
      const p2Cmds = makeCommands(CommandType.RETREAT, CommandType.REFLECTOR);
      battleManager.submitCommands(room.roomId, 1, p1Cmds);
      battleManager.submitCommands(room.roomId, 2, p2Cmds);
      battleManager.executeTurn(room.roomId);

      const lastCommands = battleManager.getLastCommands(room.roomId, 2);
      expect(lastCommands!.first.type).toBe(CommandType.RETREAT);
      expect(lastCommands!.second.type).toBe(CommandType.REFLECTOR);
    });

    it('存在しない部屋にはnullを返す', () => {
      const commands = battleManager.getLastCommands('nonexistent', 1);
      expect(commands).toBeNull();
    });
  });

  describe('handleDisconnect', () => {
    it('player1が切断するとplayer2が勝者になる', () => {
      const room = roomManager.createRoom('host-id');
      roomManager.joinRoom(room.roomId, 'guest-id');
      battleManager.startBattle(room, monster1, monster2);

      const result = battleManager.handleDisconnect(room.roomId, 1);

      expect(result).not.toBeNull();
      expect(result!.battleResult).toBeDefined();
      expect(result!.battleResult!.resultType).toBe(BattleResultType.PLAYER2_WIN);
    });

    it('player2が切断するとplayer1が勝者になる', () => {
      const room = roomManager.createRoom('host-id');
      roomManager.joinRoom(room.roomId, 'guest-id');
      battleManager.startBattle(room, monster1, monster2);

      const result = battleManager.handleDisconnect(room.roomId, 2);

      expect(result).not.toBeNull();
      expect(result!.battleResult).toBeDefined();
      expect(result!.battleResult!.resultType).toBe(BattleResultType.PLAYER1_WIN);
    });

    it('切断後にisFinishedがtrueになる', () => {
      const room = roomManager.createRoom('host-id');
      roomManager.joinRoom(room.roomId, 'guest-id');
      battleManager.startBattle(room, monster1, monster2);

      const result = battleManager.handleDisconnect(room.roomId, 1);

      expect(result!.battleState!.isFinished).toBe(true);
    });

    it('存在しない部屋にはnullを返す', () => {
      const result = battleManager.handleDisconnect('nonexistent', 1);
      expect(result).toBeNull();
    });
  });

  describe('getRoom', () => {
    it('バトル中の部屋を取得できる', () => {
      const room = roomManager.createRoom('host-id');
      roomManager.joinRoom(room.roomId, 'guest-id');
      battleManager.startBattle(room, monster1, monster2);

      const battleRoom = battleManager.getRoom(room.roomId);
      expect(battleRoom).not.toBeNull();
      expect(battleRoom!.roomId).toBe(room.roomId);
    });

    it('存在しない部屋はnullを返す', () => {
      expect(battleManager.getRoom('nonexistent')).toBeNull();
    });
  });

  describe('removeRoom', () => {
    it('部屋を削除できる', () => {
      const room = roomManager.createRoom('host-id');
      roomManager.joinRoom(room.roomId, 'guest-id');
      battleManager.startBattle(room, monster1, monster2);

      battleManager.removeRoom(room.roomId);
      expect(battleManager.getRoom(room.roomId)).toBeNull();
    });
  });
});
