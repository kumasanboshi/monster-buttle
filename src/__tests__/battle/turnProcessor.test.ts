import { CommandType, DistanceType, StanceType, Monster, BattleState, TurnCommands } from '../../types';
import { processTurn } from '../../battle/turnProcessor';
import { CommandOutcome } from '../../battle/commandPriority';

/**
 * テスト用のモンスターデータを生成するヘルパー
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
      speed: 0, // 回避率0%（テストの決定性のため）
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

/**
 * テスト用のバトル状態を生成するヘルパー
 */
function createTestBattleState(overrides: Partial<BattleState> = {}): BattleState {
  return {
    player1: {
      monsterId: 'test-monster-1',
      currentHp: 100,
      currentStance: StanceType.NORMAL,
      remainingSpecialCount: 3,
      usedReflectCount: 0,
    },
    player2: {
      monsterId: 'test-monster-2',
      currentHp: 100,
      currentStance: StanceType.NORMAL,
      remainingSpecialCount: 3,
      usedReflectCount: 0,
    },
    currentDistance: DistanceType.MID,
    currentTurn: 1,
    remainingTime: 120,
    isFinished: false,
    ...overrides,
  };
}

/** 回避なし（テスト決定性のため） */
const NO_EVASION = () => 1.0; // 常に回避率を上回る → 回避しない
/** 必ず回避（テスト用） */
const ALWAYS_EVADE = () => 0.0; // 常に回避率を下回る → 回避する

describe('processTurn', () => {
  const monster1 = createTestMonster({ id: 'test-monster-1', name: 'モンスター1' });
  const monster2 = createTestMonster({ id: 'test-monster-2', name: 'モンスター2' });

  describe('距離更新', () => {
    it('1stコマンドで距離が更新される', () => {
      const state = createTestBattleState({ currentDistance: DistanceType.MID });
      const p1Cmds: TurnCommands = {
        first: { type: CommandType.ADVANCE },
        second: { type: CommandType.ADVANCE },
      };
      const p2Cmds: TurnCommands = {
        first: { type: CommandType.ADVANCE },
        second: { type: CommandType.ADVANCE },
      };
      const { newState } = processTurn(state, monster1, monster2, p1Cmds, p2Cmds, NO_EVASION);
      // 中距離→1st(両方前進→近)→2nd(両方前進→近のまま)
      expect(newState.currentDistance).toBe(DistanceType.NEAR);
    });

    it('2ndコマンドは1st後の距離で処理される', () => {
      const state = createTestBattleState({ currentDistance: DistanceType.FAR });
      const p1Cmds: TurnCommands = {
        first: { type: CommandType.ADVANCE },
        second: { type: CommandType.WEAPON_ATTACK },
      };
      const p2Cmds: TurnCommands = {
        first: { type: CommandType.ADVANCE },
        second: { type: CommandType.WEAPON_ATTACK },
      };
      const { turnResult } = processTurn(state, monster1, monster2, p1Cmds, p2Cmds, NO_EVASION);
      // 遠距離→1st(両方前進→近)→2nd(近距離で武器vs武器→相打ち)
      expect(turnResult.distanceAfter).toBe(DistanceType.NEAR);
      // 近距離で武器vs武器なので両者ダメージ
      expect(turnResult.player1Damage.damage).toBeGreaterThan(0);
      expect(turnResult.player2Damage.damage).toBeGreaterThan(0);
    });

    it('両方前進で2段階近づく（遠→近）', () => {
      const state = createTestBattleState({ currentDistance: DistanceType.FAR });
      const p1Cmds: TurnCommands = {
        first: { type: CommandType.ADVANCE },
        second: { type: CommandType.STANCE_A },
      };
      const p2Cmds: TurnCommands = {
        first: { type: CommandType.ADVANCE },
        second: { type: CommandType.STANCE_A },
      };
      const { newState } = processTurn(state, monster1, monster2, p1Cmds, p2Cmds, NO_EVASION);
      // 遠距離→1st(両方前進→近)
      expect(newState.currentDistance).toBe(DistanceType.NEAR);
    });

    it('両方後退で2段階離れる（近→遠）', () => {
      const state = createTestBattleState({ currentDistance: DistanceType.NEAR });
      const p1Cmds: TurnCommands = {
        first: { type: CommandType.RETREAT },
        second: { type: CommandType.STANCE_A },
      };
      const p2Cmds: TurnCommands = {
        first: { type: CommandType.RETREAT },
        second: { type: CommandType.STANCE_A },
      };
      const { newState } = processTurn(state, monster1, monster2, p1Cmds, p2Cmds, NO_EVASION);
      // 近距離→1st(両方後退→遠)
      expect(newState.currentDistance).toBe(DistanceType.FAR);
    });
  });

  describe('スタンス更新', () => {
    it('1stコマンドでスタンスが変更される', () => {
      const state = createTestBattleState();
      const p1Cmds: TurnCommands = {
        first: { type: CommandType.STANCE_A },
        second: { type: CommandType.WEAPON_ATTACK },
      };
      const p2Cmds: TurnCommands = {
        first: { type: CommandType.STANCE_B },
        second: { type: CommandType.WEAPON_ATTACK },
      };
      const { turnResult } = processTurn(state, monster1, monster2, p1Cmds, p2Cmds, NO_EVASION);
      // 通常→STANCE_A→攻勢, 通常→STANCE_B→守勢
      expect(turnResult.player1StanceAfter).toBe(StanceType.OFFENSIVE);
      expect(turnResult.player2StanceAfter).toBe(StanceType.DEFENSIVE);
    });

    it('2ndコマンドは1st後のスタンスで処理される', () => {
      const state = createTestBattleState({ currentDistance: DistanceType.NEAR });
      const p1Cmds: TurnCommands = {
        first: { type: CommandType.STANCE_A },
        second: { type: CommandType.STANCE_B },
      };
      const p2Cmds: TurnCommands = {
        first: { type: CommandType.STANCE_A },
        second: { type: CommandType.STANCE_A },
      };
      const { turnResult } = processTurn(state, monster1, monster2, p1Cmds, p2Cmds, NO_EVASION);
      // P1: 通常→STANCE_A→攻勢→STANCE_B→守勢
      expect(turnResult.player1StanceAfter).toBe(StanceType.DEFENSIVE);
      // P2: 通常→STANCE_A→攻勢→STANCE_A→通常
      expect(turnResult.player2StanceAfter).toBe(StanceType.NORMAL);
    });

    it('スタンス変更後の攻撃は新スタンスの倍率が適用される', () => {
      const state = createTestBattleState({ currentDistance: DistanceType.NEAR });
      // P1: 攻勢で武器攻撃（攻撃倍率1.3）
      const offensiveState = createTestBattleState({
        currentDistance: DistanceType.NEAR,
        player1: {
          monsterId: 'test-monster-1',
          currentHp: 100,
          currentStance: StanceType.OFFENSIVE,
          remainingSpecialCount: 3,
          usedReflectCount: 0,
        },
      });
      const p1CmdsOffensive: TurnCommands = {
        first: { type: CommandType.WEAPON_ATTACK },
        second: { type: CommandType.STANCE_A },
      };
      // P1: 通常で武器攻撃（攻撃倍率1.0）
      const normalState = createTestBattleState({ currentDistance: DistanceType.NEAR });
      const p1CmdsNormal: TurnCommands = {
        first: { type: CommandType.WEAPON_ATTACK },
        second: { type: CommandType.STANCE_A },
      };
      const p2Cmds: TurnCommands = {
        first: { type: CommandType.STANCE_A },
        second: { type: CommandType.STANCE_A },
      };

      const { turnResult: offensiveResult } = processTurn(offensiveState, monster1, monster2, p1CmdsOffensive, p2Cmds, NO_EVASION);
      const { turnResult: normalResult } = processTurn(normalState, monster1, monster2, p1CmdsNormal, p2Cmds, NO_EVASION);

      // 攻勢の方がダメージが大きい
      expect(offensiveResult.player2Damage.damage).toBeGreaterThan(normalResult.player2Damage.damage);
    });
  });

  describe('武器攻撃', () => {
    it('近距離で武器攻撃がヒットする', () => {
      const state = createTestBattleState({ currentDistance: DistanceType.NEAR });
      const p1Cmds: TurnCommands = {
        first: { type: CommandType.WEAPON_ATTACK },
        second: { type: CommandType.STANCE_A },
      };
      const p2Cmds: TurnCommands = {
        first: { type: CommandType.STANCE_A },
        second: { type: CommandType.STANCE_A },
      };
      const { turnResult } = processTurn(state, monster1, monster2, p1Cmds, p2Cmds, NO_EVASION);
      // P2がダメージを受ける
      expect(turnResult.player2Damage.damage).toBeGreaterThan(0);
      expect(turnResult.player2Damage.isEvaded).toBe(false);
    });

    it('中距離で武器攻撃が空振りする', () => {
      const state = createTestBattleState({ currentDistance: DistanceType.MID });
      const p1Cmds: TurnCommands = {
        first: { type: CommandType.WEAPON_ATTACK },
        second: { type: CommandType.STANCE_A },
      };
      const p2Cmds: TurnCommands = {
        first: { type: CommandType.STANCE_A },
        second: { type: CommandType.STANCE_A },
      };
      const { turnResult } = processTurn(state, monster1, monster2, p1Cmds, p2Cmds, NO_EVASION);
      // P2はダメージなし
      expect(turnResult.player2Damage.damage).toBe(0);
    });

    it('武器 vs 武器で相打ちダメージが発生する（近距離）', () => {
      const state = createTestBattleState({ currentDistance: DistanceType.NEAR });
      const p1Cmds: TurnCommands = {
        first: { type: CommandType.WEAPON_ATTACK },
        second: { type: CommandType.STANCE_A },
      };
      const p2Cmds: TurnCommands = {
        first: { type: CommandType.WEAPON_ATTACK },
        second: { type: CommandType.STANCE_A },
      };
      const { turnResult } = processTurn(state, monster1, monster2, p1Cmds, p2Cmds, NO_EVASION);
      // 両者ダメージ
      expect(turnResult.player1Damage.damage).toBeGreaterThan(0);
      expect(turnResult.player2Damage.damage).toBeGreaterThan(0);
    });

    it('武器 vs 特殊で武器優先（近距離で特殊がCANCELLED）', () => {
      const state = createTestBattleState({ currentDistance: DistanceType.NEAR });
      const p1Cmds: TurnCommands = {
        first: { type: CommandType.WEAPON_ATTACK },
        second: { type: CommandType.STANCE_A },
      };
      const p2Cmds: TurnCommands = {
        first: { type: CommandType.SPECIAL_ATTACK },
        second: { type: CommandType.STANCE_A },
      };
      const { turnResult } = processTurn(state, monster1, monster2, p1Cmds, p2Cmds, NO_EVASION);
      // P2がダメージを受ける（武器命中）、P1はダメージなし（特殊潰れ）
      expect(turnResult.player2Damage.damage).toBeGreaterThan(0);
      expect(turnResult.player1Damage.damage).toBe(0);
    });

    it('ダメージ計算にスタンス倍率が正しく適用される', () => {
      const state = createTestBattleState({ currentDistance: DistanceType.NEAR });
      // P1: 通常（攻撃×1.0）, P2: 守勢（防御×1.3）
      const stateWithStances = {
        ...state,
        player2: { ...state.player2, currentStance: StanceType.DEFENSIVE },
      };
      const p1Cmds: TurnCommands = {
        first: { type: CommandType.WEAPON_ATTACK },
        second: { type: CommandType.STANCE_A },
      };
      const p2Cmds: TurnCommands = {
        first: { type: CommandType.STANCE_A },
        second: { type: CommandType.STANCE_A },
      };
      const { turnResult: normalResult } = processTurn(state, monster1, monster2, p1Cmds, p2Cmds, NO_EVASION);
      const { turnResult: defensiveResult } = processTurn(stateWithStances, monster1, monster2, p1Cmds, p2Cmds, NO_EVASION);

      // 守勢相手の方がダメージが少ない
      expect(defensiveResult.player2Damage.damage).toBeLessThan(normalResult.player2Damage.damage);
    });
  });

  describe('特殊攻撃', () => {
    it('全距離で特殊攻撃がヒットする', () => {
      const distances = [DistanceType.NEAR, DistanceType.MID, DistanceType.FAR];
      for (const dist of distances) {
        const state = createTestBattleState({ currentDistance: dist });
        const p1Cmds: TurnCommands = {
          first: { type: CommandType.SPECIAL_ATTACK },
          second: { type: CommandType.STANCE_A },
        };
        const p2Cmds: TurnCommands = {
          first: { type: CommandType.STANCE_A },
          second: { type: CommandType.STANCE_A },
        };
        const { turnResult } = processTurn(state, monster1, monster2, p1Cmds, p2Cmds, NO_EVASION);
        expect(turnResult.player2Damage.damage).toBeGreaterThan(0);
      }
    });

    it('特殊攻撃使用後、残り回数が1減る', () => {
      const state = createTestBattleState({ currentDistance: DistanceType.MID });
      const p1Cmds: TurnCommands = {
        first: { type: CommandType.SPECIAL_ATTACK },
        second: { type: CommandType.STANCE_A },
      };
      const p2Cmds: TurnCommands = {
        first: { type: CommandType.STANCE_A },
        second: { type: CommandType.STANCE_A },
      };
      const { newState } = processTurn(state, monster1, monster2, p1Cmds, p2Cmds, NO_EVASION);
      expect(newState.player1.remainingSpecialCount).toBe(2);
    });

    it('回数超過時にダメージが半減する', () => {
      const stateNormal = createTestBattleState({ currentDistance: DistanceType.MID });
      const stateExceeded = createTestBattleState({
        currentDistance: DistanceType.MID,
        player1: {
          monsterId: 'test-monster-1',
          currentHp: 100,
          currentStance: StanceType.NORMAL,
          remainingSpecialCount: 0, // 回数超過
          usedReflectCount: 0,
        },
      });
      const p1Cmds: TurnCommands = {
        first: { type: CommandType.SPECIAL_ATTACK },
        second: { type: CommandType.STANCE_A },
      };
      const p2Cmds: TurnCommands = {
        first: { type: CommandType.STANCE_A },
        second: { type: CommandType.STANCE_A },
      };
      const { turnResult: normalResult } = processTurn(stateNormal, monster1, monster2, p1Cmds, p2Cmds, NO_EVASION);
      const { turnResult: exceededResult } = processTurn(stateExceeded, monster1, monster2, p1Cmds, p2Cmds, NO_EVASION);

      // 超過ダメージ = 通常ダメージの半分（切り捨て）
      expect(exceededResult.player2Damage.damage).toBeLessThan(normalResult.player2Damage.damage);
    });

    it('特殊 vs リフレクターで無効化される（COUNTERED）', () => {
      const state = createTestBattleState({ currentDistance: DistanceType.MID });
      const p1Cmds: TurnCommands = {
        first: { type: CommandType.SPECIAL_ATTACK },
        second: { type: CommandType.STANCE_A },
      };
      const p2Cmds: TurnCommands = {
        first: { type: CommandType.REFLECTOR },
        second: { type: CommandType.STANCE_A },
      };
      const { turnResult } = processTurn(state, monster1, monster2, p1Cmds, p2Cmds, NO_EVASION);
      // P2はダメージなし（特殊が無効化される）
      expect(turnResult.player2Damage.damage).toBe(0);
      // P1が反射ダメージを受ける
      expect(turnResult.player1Damage.damage).toBeGreaterThan(0);
      expect(turnResult.player1Damage.isReflected).toBe(true);
    });
  });

  describe('リフレクター', () => {
    it('反射回数1以上で反射ダメージを返す', () => {
      const state = createTestBattleState({ currentDistance: DistanceType.MID });
      const p1Cmds: TurnCommands = {
        first: { type: CommandType.SPECIAL_ATTACK },
        second: { type: CommandType.STANCE_A },
      };
      const p2Cmds: TurnCommands = {
        first: { type: CommandType.REFLECTOR },
        second: { type: CommandType.STANCE_A },
      };
      const { turnResult, newState } = processTurn(state, monster1, monster2, p1Cmds, p2Cmds, NO_EVASION);
      // P1が反射ダメージを受ける
      expect(turnResult.player1Damage.damage).toBeGreaterThan(0);
      expect(turnResult.player1Damage.isReflected).toBe(true);
      // P2のリフレクター使用回数が増える
      expect(newState.player2.usedReflectCount).toBe(1);
    });

    it('反射回数0で無効化のみ（反射ダメージなし）', () => {
      const state = createTestBattleState({
        currentDistance: DistanceType.MID,
        player2: {
          monsterId: 'test-monster-2',
          currentHp: 100,
          currentStance: StanceType.NORMAL,
          remainingSpecialCount: 3,
          usedReflectCount: 2, // maxReflectCount=2なので反射回数切れ
        },
      });
      const p1Cmds: TurnCommands = {
        first: { type: CommandType.SPECIAL_ATTACK },
        second: { type: CommandType.STANCE_A },
      };
      const p2Cmds: TurnCommands = {
        first: { type: CommandType.REFLECTOR },
        second: { type: CommandType.STANCE_A },
      };
      const { turnResult } = processTurn(state, monster1, monster2, p1Cmds, p2Cmds, NO_EVASION);
      // P2はダメージなし（特殊は無効化される）
      expect(turnResult.player2Damage.damage).toBe(0);
      // P1は反射ダメージなし（回数切れ）
      expect(turnResult.player1Damage.damage).toBe(0);
    });

    it('リフレクター単独使用（特殊なし）では回数消費しない', () => {
      const state = createTestBattleState({ currentDistance: DistanceType.MID });
      const p1Cmds: TurnCommands = {
        first: { type: CommandType.STANCE_A },
        second: { type: CommandType.STANCE_A },
      };
      const p2Cmds: TurnCommands = {
        first: { type: CommandType.REFLECTOR },
        second: { type: CommandType.STANCE_A },
      };
      const { newState } = processTurn(state, monster1, monster2, p1Cmds, p2Cmds, NO_EVASION);
      expect(newState.player2.usedReflectCount).toBe(0);
    });

    it('リフレクター vs 武器で武器貫通（被弾する）', () => {
      const state = createTestBattleState({ currentDistance: DistanceType.NEAR });
      const p1Cmds: TurnCommands = {
        first: { type: CommandType.REFLECTOR },
        second: { type: CommandType.STANCE_A },
      };
      const p2Cmds: TurnCommands = {
        first: { type: CommandType.WEAPON_ATTACK },
        second: { type: CommandType.STANCE_A },
      };
      const { turnResult } = processTurn(state, monster1, monster2, p1Cmds, p2Cmds, NO_EVASION);
      // P1が武器ダメージを受ける（リフレクター貫通）
      expect(turnResult.player1Damage.damage).toBeGreaterThan(0);
    });
  });

  describe('回避判定', () => {
    it('回避成功時にダメージが0になる（isEvaded: true）', () => {
      const state = createTestBattleState({ currentDistance: DistanceType.NEAR });
      // P2が素早い（回避率最大）
      const fastMonster2 = createTestMonster({
        id: 'test-monster-2',
        name: 'モンスター2',
        stats: { hp: 100, strength: 30, special: 25, speed: 50, toughness: 20, specialAttackCount: 3 },
      });
      const p1Cmds: TurnCommands = {
        first: { type: CommandType.WEAPON_ATTACK },
        second: { type: CommandType.STANCE_A },
      };
      const p2Cmds: TurnCommands = {
        first: { type: CommandType.STANCE_A },
        second: { type: CommandType.STANCE_A },
      };
      const { turnResult } = processTurn(state, monster1, fastMonster2, p1Cmds, p2Cmds, ALWAYS_EVADE);
      expect(turnResult.player2Damage.damage).toBe(0);
      expect(turnResult.player2Damage.isEvaded).toBe(true);
    });

    it('近距離で武器 vs 武器は回避不可（必中相打ち）', () => {
      const state = createTestBattleState({ currentDistance: DistanceType.NEAR });
      const fastMonster1 = createTestMonster({
        id: 'test-monster-1',
        name: 'モンスター1',
        stats: { hp: 100, strength: 30, special: 25, speed: 50, toughness: 20, specialAttackCount: 3 },
      });
      const fastMonster2 = createTestMonster({
        id: 'test-monster-2',
        name: 'モンスター2',
        stats: { hp: 100, strength: 30, special: 25, speed: 50, toughness: 20, specialAttackCount: 3 },
      });
      const p1Cmds: TurnCommands = {
        first: { type: CommandType.WEAPON_ATTACK },
        second: { type: CommandType.STANCE_A },
      };
      const p2Cmds: TurnCommands = {
        first: { type: CommandType.WEAPON_ATTACK },
        second: { type: CommandType.STANCE_A },
      };
      // ALWAYS_EVADEでも必中なので回避しない
      const { turnResult } = processTurn(state, fastMonster1, fastMonster2, p1Cmds, p2Cmds, ALWAYS_EVADE);
      expect(turnResult.player1Damage.damage).toBeGreaterThan(0);
      expect(turnResult.player1Damage.isEvaded).toBe(false);
      expect(turnResult.player2Damage.damage).toBeGreaterThan(0);
      expect(turnResult.player2Damage.isEvaded).toBe(false);
    });
  });

  describe('HP更新', () => {
    it('武器攻撃ダメージでHPが減少する', () => {
      const state = createTestBattleState({ currentDistance: DistanceType.NEAR });
      const p1Cmds: TurnCommands = {
        first: { type: CommandType.WEAPON_ATTACK },
        second: { type: CommandType.STANCE_A },
      };
      const p2Cmds: TurnCommands = {
        first: { type: CommandType.STANCE_A },
        second: { type: CommandType.STANCE_A },
      };
      const { newState, turnResult } = processTurn(state, monster1, monster2, p1Cmds, p2Cmds, NO_EVASION);
      expect(newState.player2.currentHp).toBe(100 - turnResult.player2Damage.damage);
    });

    it('HP0以下にはならない（最低0）', () => {
      const state = createTestBattleState({
        currentDistance: DistanceType.NEAR,
        player2: {
          monsterId: 'test-monster-2',
          currentHp: 1, // HP1
          currentStance: StanceType.NORMAL,
          remainingSpecialCount: 3,
          usedReflectCount: 0,
        },
      });
      const p1Cmds: TurnCommands = {
        first: { type: CommandType.WEAPON_ATTACK },
        second: { type: CommandType.WEAPON_ATTACK },
      };
      const p2Cmds: TurnCommands = {
        first: { type: CommandType.STANCE_A },
        second: { type: CommandType.STANCE_A },
      };
      const { newState } = processTurn(state, monster1, monster2, p1Cmds, p2Cmds, NO_EVASION);
      expect(newState.player2.currentHp).toBe(0);
    });

    it('1stと2ndの累積ダメージが正しく反映される', () => {
      const state = createTestBattleState({ currentDistance: DistanceType.NEAR });
      const p1Cmds: TurnCommands = {
        first: { type: CommandType.WEAPON_ATTACK },
        second: { type: CommandType.WEAPON_ATTACK },
      };
      const p2Cmds: TurnCommands = {
        first: { type: CommandType.STANCE_A },
        second: { type: CommandType.STANCE_A },
      };
      const { newState, turnResult } = processTurn(state, monster1, monster2, p1Cmds, p2Cmds, NO_EVASION);
      // P2は1stと2ndで2回ダメージを受ける
      expect(turnResult.player2Damage.damage).toBeGreaterThan(0);
      expect(newState.player2.currentHp).toBe(100 - turnResult.player2Damage.damage);
    });
  });

  describe('特殊攻撃回数管理', () => {
    it('特殊攻撃がCANCELLEDでも回数を消費する', () => {
      const state = createTestBattleState({ currentDistance: DistanceType.NEAR });
      const p1Cmds: TurnCommands = {
        first: { type: CommandType.SPECIAL_ATTACK },
        second: { type: CommandType.STANCE_A },
      };
      const p2Cmds: TurnCommands = {
        first: { type: CommandType.WEAPON_ATTACK },
        second: { type: CommandType.STANCE_A },
      };
      const { newState } = processTurn(state, monster1, monster2, p1Cmds, p2Cmds, NO_EVASION);
      // 特殊が潰されても回数は消費される
      expect(newState.player1.remainingSpecialCount).toBe(2);
    });

    it('特殊攻撃がCOUNTEREDでも回数を消費する', () => {
      const state = createTestBattleState({ currentDistance: DistanceType.MID });
      const p1Cmds: TurnCommands = {
        first: { type: CommandType.SPECIAL_ATTACK },
        second: { type: CommandType.STANCE_A },
      };
      const p2Cmds: TurnCommands = {
        first: { type: CommandType.REFLECTOR },
        second: { type: CommandType.STANCE_A },
      };
      const { newState } = processTurn(state, monster1, monster2, p1Cmds, p2Cmds, NO_EVASION);
      expect(newState.player1.remainingSpecialCount).toBe(2);
    });

    it('1stと2ndで合計2回使用すると回数が2減る', () => {
      const state = createTestBattleState({ currentDistance: DistanceType.MID });
      const p1Cmds: TurnCommands = {
        first: { type: CommandType.SPECIAL_ATTACK },
        second: { type: CommandType.SPECIAL_ATTACK },
      };
      const p2Cmds: TurnCommands = {
        first: { type: CommandType.STANCE_A },
        second: { type: CommandType.STANCE_A },
      };
      const { newState } = processTurn(state, monster1, monster2, p1Cmds, p2Cmds, NO_EVASION);
      expect(newState.player1.remainingSpecialCount).toBe(1);
    });
  });

  describe('リフレクター回数管理', () => {
    it('リフレクター成功でusedReflectCountが1増える', () => {
      const state = createTestBattleState({ currentDistance: DistanceType.MID });
      const p1Cmds: TurnCommands = {
        first: { type: CommandType.SPECIAL_ATTACK },
        second: { type: CommandType.STANCE_A },
      };
      const p2Cmds: TurnCommands = {
        first: { type: CommandType.REFLECTOR },
        second: { type: CommandType.STANCE_A },
      };
      const { newState } = processTurn(state, monster1, monster2, p1Cmds, p2Cmds, NO_EVASION);
      expect(newState.player2.usedReflectCount).toBe(1);
    });

    it('1stと2ndで合計2回反射成功すると回数が2増える', () => {
      const state = createTestBattleState({ currentDistance: DistanceType.MID });
      const p1Cmds: TurnCommands = {
        first: { type: CommandType.SPECIAL_ATTACK },
        second: { type: CommandType.SPECIAL_ATTACK },
      };
      const p2Cmds: TurnCommands = {
        first: { type: CommandType.REFLECTOR },
        second: { type: CommandType.REFLECTOR },
      };
      const { newState } = processTurn(state, monster1, monster2, p1Cmds, p2Cmds, NO_EVASION);
      expect(newState.player2.usedReflectCount).toBe(2);
    });
  });

  describe('複合シナリオ', () => {
    it('1st: 前進+前進、2nd: 武器攻撃 vs 武器攻撃で近距離相打ち', () => {
      const state = createTestBattleState({ currentDistance: DistanceType.FAR });
      const p1Cmds: TurnCommands = {
        first: { type: CommandType.ADVANCE },
        second: { type: CommandType.WEAPON_ATTACK },
      };
      const p2Cmds: TurnCommands = {
        first: { type: CommandType.ADVANCE },
        second: { type: CommandType.WEAPON_ATTACK },
      };
      const { turnResult } = processTurn(state, monster1, monster2, p1Cmds, p2Cmds, NO_EVASION);
      // 遠→近（両方前進）→武器vs武器で相打ち
      expect(turnResult.distanceAfter).toBe(DistanceType.NEAR);
      expect(turnResult.player1Damage.damage).toBeGreaterThan(0);
      expect(turnResult.player2Damage.damage).toBeGreaterThan(0);
    });

    it('1st: スタンス切替（攻勢）、2nd: 武器攻撃で高火力', () => {
      const state = createTestBattleState({ currentDistance: DistanceType.NEAR });
      const p1Cmds: TurnCommands = {
        first: { type: CommandType.STANCE_A }, // 通常→攻勢
        second: { type: CommandType.WEAPON_ATTACK },
      };
      const p2Cmds: TurnCommands = {
        first: { type: CommandType.STANCE_A },
        second: { type: CommandType.STANCE_A },
      };
      // 通常状態からの武器攻撃
      const normalState = createTestBattleState({ currentDistance: DistanceType.NEAR });
      const p1CmdsNormal: TurnCommands = {
        first: { type: CommandType.STANCE_A },
        second: { type: CommandType.WEAPON_ATTACK },
      };

      // 攻勢後の武器攻撃（倍率1.3）vs 通常の武器攻撃（倍率1.0）
      // ただし両者同じ条件（1stでSTANCE_A→通常→攻勢）なので同じ
      const { turnResult } = processTurn(state, monster1, monster2, p1Cmds, p2Cmds, NO_EVASION);
      expect(turnResult.player2Damage.damage).toBeGreaterThan(0);
      expect(turnResult.player1StanceAfter).toBe(StanceType.OFFENSIVE);
    });

    it('両プレイヤーがダメージを受けながらHPと距離が変動する', () => {
      const state = createTestBattleState({ currentDistance: DistanceType.NEAR });
      const p1Cmds: TurnCommands = {
        first: { type: CommandType.WEAPON_ATTACK },
        second: { type: CommandType.RETREAT },
      };
      const p2Cmds: TurnCommands = {
        first: { type: CommandType.WEAPON_ATTACK },
        second: { type: CommandType.SPECIAL_ATTACK },
      };
      const { newState, turnResult } = processTurn(state, monster1, monster2, p1Cmds, p2Cmds, NO_EVASION);
      // 1st: 近距離で武器vs武器→相打ち
      // 2nd: P1後退+P2特殊攻撃→中距離、特殊命中
      expect(turnResult.player1Damage.damage).toBeGreaterThan(0); // 武器+特殊
      expect(turnResult.player2Damage.damage).toBeGreaterThan(0); // 武器
      expect(newState.currentDistance).toBe(DistanceType.MID);
    });
  });

  describe('エッジケース', () => {
    it('両方が移動のみのターン（ダメージなし）', () => {
      const state = createTestBattleState({ currentDistance: DistanceType.MID });
      const p1Cmds: TurnCommands = {
        first: { type: CommandType.ADVANCE },
        second: { type: CommandType.ADVANCE },
      };
      const p2Cmds: TurnCommands = {
        first: { type: CommandType.RETREAT },
        second: { type: CommandType.RETREAT },
      };
      const { turnResult } = processTurn(state, monster1, monster2, p1Cmds, p2Cmds, NO_EVASION);
      expect(turnResult.player1Damage.damage).toBe(0);
      expect(turnResult.player2Damage.damage).toBe(0);
    });

    it('両方がスタンス切替のみ（距離・HPは変わらず）', () => {
      const state = createTestBattleState({ currentDistance: DistanceType.MID });
      const p1Cmds: TurnCommands = {
        first: { type: CommandType.STANCE_A },
        second: { type: CommandType.STANCE_B },
      };
      const p2Cmds: TurnCommands = {
        first: { type: CommandType.STANCE_B },
        second: { type: CommandType.STANCE_A },
      };
      const { newState, turnResult } = processTurn(state, monster1, monster2, p1Cmds, p2Cmds, NO_EVASION);
      expect(newState.currentDistance).toBe(DistanceType.MID);
      expect(turnResult.player1Damage.damage).toBe(0);
      expect(turnResult.player2Damage.damage).toBe(0);
      expect(newState.player1.currentHp).toBe(100);
      expect(newState.player2.currentHp).toBe(100);
    });

    it('特殊攻撃回数0からの使用（半減）', () => {
      const state = createTestBattleState({
        currentDistance: DistanceType.MID,
        player1: {
          monsterId: 'test-monster-1',
          currentHp: 100,
          currentStance: StanceType.NORMAL,
          remainingSpecialCount: 0,
          usedReflectCount: 0,
        },
      });
      const p1Cmds: TurnCommands = {
        first: { type: CommandType.SPECIAL_ATTACK },
        second: { type: CommandType.STANCE_A },
      };
      const p2Cmds: TurnCommands = {
        first: { type: CommandType.STANCE_A },
        second: { type: CommandType.STANCE_A },
      };
      const { turnResult } = processTurn(state, monster1, monster2, p1Cmds, p2Cmds, NO_EVASION);
      // 半減ダメージでも命中する
      expect(turnResult.player2Damage.damage).toBeGreaterThan(0);
    });
  });

  describe('戻り値の構造', () => {
    it('newStateにターン後の最新状態が含まれる', () => {
      const state = createTestBattleState({ currentDistance: DistanceType.NEAR });
      const p1Cmds: TurnCommands = {
        first: { type: CommandType.WEAPON_ATTACK },
        second: { type: CommandType.RETREAT },
      };
      const p2Cmds: TurnCommands = {
        first: { type: CommandType.STANCE_A },
        second: { type: CommandType.RETREAT },
      };
      const { newState } = processTurn(state, monster1, monster2, p1Cmds, p2Cmds, NO_EVASION);
      expect(newState.currentTurn).toBe(2); // ターン数+1
      expect(newState.currentDistance).toBe(DistanceType.FAR); // 近→遠（両方後退）
    });

    it('turnResultにターン詳細が記録される', () => {
      const state = createTestBattleState({ currentDistance: DistanceType.MID });
      const p1Cmds: TurnCommands = {
        first: { type: CommandType.ADVANCE },
        second: { type: CommandType.WEAPON_ATTACK },
      };
      const p2Cmds: TurnCommands = {
        first: { type: CommandType.ADVANCE },
        second: { type: CommandType.WEAPON_ATTACK },
      };
      const { turnResult } = processTurn(state, monster1, monster2, p1Cmds, p2Cmds, NO_EVASION);
      expect(turnResult.turnNumber).toBe(1);
      expect(turnResult.player1Commands).toEqual(p1Cmds);
      expect(turnResult.player2Commands).toEqual(p2Cmds);
    });

    it('DamageInfoにdamage, isEvaded, isReflectedが正しく設定される', () => {
      const state = createTestBattleState({ currentDistance: DistanceType.MID });
      const p1Cmds: TurnCommands = {
        first: { type: CommandType.SPECIAL_ATTACK },
        second: { type: CommandType.STANCE_A },
      };
      const p2Cmds: TurnCommands = {
        first: { type: CommandType.REFLECTOR },
        second: { type: CommandType.STANCE_A },
      };
      const { turnResult } = processTurn(state, monster1, monster2, p1Cmds, p2Cmds, NO_EVASION);
      // P1: 反射ダメージを受ける
      expect(turnResult.player1Damage.isReflected).toBe(true);
      expect(turnResult.player1Damage.isEvaded).toBe(false);
      // P2: ダメージなし
      expect(turnResult.player2Damage.damage).toBe(0);
      expect(turnResult.player2Damage.isEvaded).toBe(false);
      expect(turnResult.player2Damage.isReflected).toBe(false);
    });
  });

  describe('phases（フェーズごとの結果）', () => {
    it('phasesに2要素の配列を返す', () => {
      const state = createTestBattleState();
      const p1Cmds: TurnCommands = {
        first: { type: CommandType.ADVANCE },
        second: { type: CommandType.WEAPON_ATTACK },
      };
      const p2Cmds: TurnCommands = {
        first: { type: CommandType.ADVANCE },
        second: { type: CommandType.WEAPON_ATTACK },
      };
      const { turnResult } = processTurn(state, monster1, monster2, p1Cmds, p2Cmds, NO_EVASION);
      expect(turnResult.phases).toHaveLength(2);
    });

    it('phases[0]は1stコマンドの結果を含む', () => {
      const state = createTestBattleState({ currentDistance: DistanceType.MID });
      const p1Cmds: TurnCommands = {
        first: { type: CommandType.ADVANCE },
        second: { type: CommandType.RETREAT },
      };
      const p2Cmds: TurnCommands = {
        first: { type: CommandType.ADVANCE },
        second: { type: CommandType.RETREAT },
      };
      const { turnResult } = processTurn(state, monster1, monster2, p1Cmds, p2Cmds, NO_EVASION);
      expect(turnResult.phases[0].player1Command).toBe(CommandType.ADVANCE);
      expect(turnResult.phases[0].player2Command).toBe(CommandType.ADVANCE);
      // 両方前進 → MIDからNEARへ
      expect(turnResult.phases[0].distanceAfter).toBe(DistanceType.NEAR);
    });

    it('phases[1]は2ndコマンドの結果を含む', () => {
      const state = createTestBattleState({ currentDistance: DistanceType.MID });
      const p1Cmds: TurnCommands = {
        first: { type: CommandType.ADVANCE },
        second: { type: CommandType.RETREAT },
      };
      const p2Cmds: TurnCommands = {
        first: { type: CommandType.ADVANCE },
        second: { type: CommandType.RETREAT },
      };
      const { turnResult } = processTurn(state, monster1, monster2, p1Cmds, p2Cmds, NO_EVASION);
      expect(turnResult.phases[1].player1Command).toBe(CommandType.RETREAT);
      expect(turnResult.phases[1].player2Command).toBe(CommandType.RETREAT);
      // 両方後退 → NEARからFARへ（2段階離れ）
      expect(turnResult.phases[1].distanceAfter).toBe(DistanceType.FAR);
    });

    it('phases合計ダメージが既存のplayer1Damage/player2Damageと一致する', () => {
      const state = createTestBattleState({ currentDistance: DistanceType.NEAR });
      const p1Cmds: TurnCommands = {
        first: { type: CommandType.WEAPON_ATTACK },
        second: { type: CommandType.WEAPON_ATTACK },
      };
      const p2Cmds: TurnCommands = {
        first: { type: CommandType.WEAPON_ATTACK },
        second: { type: CommandType.WEAPON_ATTACK },
      };
      const { turnResult } = processTurn(state, monster1, monster2, p1Cmds, p2Cmds, NO_EVASION);
      // フェーズ合計 = 全体ダメージ
      const p1PhaseDamage = turnResult.phases[0].player1Damage.damage + turnResult.phases[1].player1Damage.damage;
      const p2PhaseDamage = turnResult.phases[0].player2Damage.damage + turnResult.phases[1].player2Damage.damage;
      expect(p1PhaseDamage).toBe(turnResult.player1Damage.damage);
      expect(p2PhaseDamage).toBe(turnResult.player2Damage.damage);
    });

    it('phases[0]のダメージがフェーズ1のみの結果を反映する', () => {
      // 1st: 武器攻撃 vs 武器攻撃（近距離、ダメージあり）
      // 2nd: 移動のみ（ダメージなし）
      const state = createTestBattleState({ currentDistance: DistanceType.NEAR });
      const p1Cmds: TurnCommands = {
        first: { type: CommandType.WEAPON_ATTACK },
        second: { type: CommandType.RETREAT },
      };
      const p2Cmds: TurnCommands = {
        first: { type: CommandType.WEAPON_ATTACK },
        second: { type: CommandType.RETREAT },
      };
      const { turnResult } = processTurn(state, monster1, monster2, p1Cmds, p2Cmds, NO_EVASION);
      // 1stフェーズ: 両者にダメージあり
      expect(turnResult.phases[0].player1Damage.damage).toBeGreaterThan(0);
      expect(turnResult.phases[0].player2Damage.damage).toBeGreaterThan(0);
      // 2ndフェーズ: 移動のみ → ダメージなし
      expect(turnResult.phases[1].player1Damage.damage).toBe(0);
      expect(turnResult.phases[1].player2Damage.damage).toBe(0);
    });
  });
});
