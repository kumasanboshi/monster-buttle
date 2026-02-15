/**
 * BattleScene ネットワークモードのテスト
 *
 * BattleScene 自体は Phaser シーンのため直接テストしにくいが、
 * ネットワークモードのデータ仕様とモード分岐ロジックを検証する。
 */
import { GameMode } from '../../types/GameMode';
import { SceneKey } from '../../scenes/sceneKeys';
import { isValidTransition } from '../../scenes/sceneTransitions';
import { DistanceType } from '../../types/Distance';
import { StanceType } from '../../types/Stance';
import { BattleState } from '../../types/BattleState';
import { Monster } from '../../types/Monster';
import { BattleSceneData } from '../../scenes/BattleScene';

/** テスト用モンスター */
function createTestMonster(id: string, name: string): Monster {
  return {
    id,
    name,
    species: 'テスト種',
    stats: {
      hp: 100,
      strength: 30,
      special: 25,
      speed: 0,
      toughness: 20,
      specialAttackCount: 3,
    },
    weapon: { name: 'テスト武器', multiplier: 1.6 },
    reflector: { name: 'テストリフレクター', maxReflectCount: 2, reflectRate: 0.5 },
  };
}

/** テスト用BattleState */
function createTestBattleState(): BattleState {
  return {
    player1: {
      monsterId: 'zaag',
      currentHp: 100,
      currentStance: StanceType.NORMAL,
      remainingSpecialCount: 3,
      usedReflectCount: 0,
    },
    player2: {
      monsterId: 'gardan',
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

describe('BattleScene ネットワークモード', () => {
  describe('GameMode.ONLINE', () => {
    it('GameModeにONLINEが定義されていること', () => {
      expect(GameMode.ONLINE).toBe('ONLINE');
    });
  });

  describe('BattleSceneData ネットワークフィールド', () => {
    it('ネットワークモードのデータを構築できること', () => {
      const data: BattleSceneData = {
        mode: GameMode.ONLINE,
        isNetworkMode: true,
        roomId: 'ABC123',
        playerNumber: 1,
        playerMonster: createTestMonster('zaag', 'ザーグ'),
        enemyMonster: createTestMonster('gardan', 'ガーダン'),
        initialBattleState: createTestBattleState(),
      };

      expect(data.isNetworkMode).toBe(true);
      expect(data.roomId).toBe('ABC123');
      expect(data.playerNumber).toBe(1);
      expect(data.playerMonster).toBeDefined();
      expect(data.enemyMonster).toBeDefined();
      expect(data.initialBattleState).toBeDefined();
    });

    it('playerNumber=2の場合も構築できること', () => {
      const data: BattleSceneData = {
        mode: GameMode.ONLINE,
        isNetworkMode: true,
        roomId: 'XYZ789',
        playerNumber: 2,
        playerMonster: createTestMonster('gardan', 'ガーダン'),
        enemyMonster: createTestMonster('zaag', 'ザーグ'),
        initialBattleState: createTestBattleState(),
      };

      expect(data.playerNumber).toBe(2);
    });

    it('ネットワークモードではAIレベルが不要であること', () => {
      const data: BattleSceneData = {
        mode: GameMode.ONLINE,
        isNetworkMode: true,
        roomId: 'ABC123',
        playerNumber: 1,
        playerMonster: createTestMonster('zaag', 'ザーグ'),
        enemyMonster: createTestMonster('gardan', 'ガーダン'),
        initialBattleState: createTestBattleState(),
      };

      expect(data.aiLevel).toBeUndefined();
    });
  });

  describe('ネットワークモード判定ロジック', () => {
    it('mode=ONLINE かつ isNetworkMode=true でネットワークモードと判定できること', () => {
      const data: BattleSceneData = {
        mode: GameMode.ONLINE,
        isNetworkMode: true,
        roomId: 'ABC123',
        playerNumber: 1,
        playerMonster: createTestMonster('zaag', 'ザーグ'),
        enemyMonster: createTestMonster('gardan', 'ガーダン'),
        initialBattleState: createTestBattleState(),
      };

      const isNetworkMode = data.isNetworkMode === true;
      expect(isNetworkMode).toBe(true);
    });

    it('isNetworkMode未指定でCPUモードと判定できること', () => {
      const data: BattleSceneData = {
        mode: GameMode.FREE_CPU,
        monsterId: 'zaag',
      };

      const isNetworkMode = data.isNetworkMode === true;
      expect(isNetworkMode).toBe(false);
    });

    it('ネットワークモードではプレイヤー視点の変換が必要であること', () => {
      // Player2の場合、サーバーのplayer1/player2がクライアント上で逆に見える
      const serverState = createTestBattleState();

      // Player1視点: player1が自分、player2が敵
      function getMyState(pn: 1 | 2, state: BattleState) {
        return pn === 1 ? state.player1 : state.player2;
      }
      function getEnemyState(pn: 1 | 2, state: BattleState) {
        return pn === 1 ? state.player2 : state.player1;
      }

      // Player2視点: サーバーのplayer2が自分、player1が敵
      expect(getMyState(2, serverState).monsterId).toBe('gardan');
      expect(getEnemyState(2, serverState).monsterId).toBe('zaag');

      // Player1視点: サーバーのplayer1が自分、player2が敵
      expect(getMyState(1, serverState).monsterId).toBe('zaag');
      expect(getEnemyState(1, serverState).monsterId).toBe('gardan');
    });
  });

  describe('シーン遷移', () => {
    it('MODE_SELECT から BATTLE への遷移が許可されていること', () => {
      expect(isValidTransition(SceneKey.MODE_SELECT, SceneKey.BATTLE)).toBe(true);
    });
  });
});
