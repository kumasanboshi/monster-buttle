import {
  CommandType,
  DistanceType,
  StanceType,
  Monster,
  MonsterBattleState,
  BattleState,
  DamageInfo,
  TurnResult,
  TurnCommands,
  calculateDistance,
  calculateNextStance,
} from '../types';
import { resolveCommandInteraction, CommandOutcome } from './commandPriority';
import { isStanceCommand } from './stance';
import { calculateWeaponDamage, calculateSpecialDamage, calculateReflectDamage } from './damage';
import { calculateEvasionRate, isGuaranteedHit } from './evasion';

/**
 * 単一コマンドペア（1st or 2nd）の戦闘結果
 */
interface CommandPairResult {
  distance: DistanceType;
  p1State: MonsterBattleState;
  p2State: MonsterBattleState;
  p1Damage: DamageInfo;
  p2Damage: DamageInfo;
}

/**
 * 攻撃者のコマンド結果に基づいてダメージを計算する
 */
function calculateAttackDamage(
  outcome: CommandOutcome,
  attackerCmd: CommandType,
  defenderCmd: CommandType,
  attackerMonster: Monster,
  defenderMonster: Monster,
  attackerState: MonsterBattleState,
  defenderState: MonsterBattleState,
  distance: DistanceType,
  randomFn: () => number
): { damageToDefender: DamageInfo; damageToAttacker: DamageInfo; attackerStateUpdate: Partial<MonsterBattleState>; defenderStateUpdate: Partial<MonsterBattleState> } {
  const noDamage: DamageInfo = { damage: 0, isEvaded: false, isReflected: false };
  const noUpdate: Partial<MonsterBattleState> = {};

  if (outcome === CommandOutcome.MISS || outcome === CommandOutcome.NO_EFFECT) {
    return { damageToDefender: noDamage, damageToAttacker: noDamage, attackerStateUpdate: noUpdate, defenderStateUpdate: noUpdate };
  }

  if (outcome === CommandOutcome.CANCELLED) {
    // 特殊攻撃が潰された場合、回数は消費する
    const attackerUpdate: Partial<MonsterBattleState> = {};
    if (attackerCmd === CommandType.SPECIAL_ATTACK) {
      attackerUpdate.remainingSpecialCount = Math.max(attackerState.remainingSpecialCount - 1, 0);
    }
    return { damageToDefender: noDamage, damageToAttacker: noDamage, attackerStateUpdate: attackerUpdate, defenderStateUpdate: noUpdate };
  }

  if (outcome === CommandOutcome.COUNTERED) {
    // 特殊攻撃がリフレクターで反射された
    const isExceeded = attackerState.remainingSpecialCount <= 0;
    const specialDamage = calculateSpecialDamage(
      { special: attackerMonster.stats.special, stance: attackerState.currentStance },
      isExceeded
    );

    const attackerUpdate: Partial<MonsterBattleState> = {
      remainingSpecialCount: Math.max(attackerState.remainingSpecialCount - 1, 0),
    };

    // リフレクター側: 反射回数が残っていれば反射ダメージ
    const remainingReflect = defenderMonster.reflector.maxReflectCount - defenderState.usedReflectCount;
    const defenderUpdate: Partial<MonsterBattleState> = {};

    if (remainingReflect > 0) {
      const reflectDamage = calculateReflectDamage(specialDamage, defenderMonster.reflector.reflectRate);
      defenderUpdate.usedReflectCount = defenderState.usedReflectCount + 1;
      return {
        damageToDefender: noDamage,
        damageToAttacker: { damage: reflectDamage, isEvaded: false, isReflected: true },
        attackerStateUpdate: attackerUpdate,
        defenderStateUpdate: defenderUpdate,
      };
    } else {
      // 反射回数切れ: 無効化のみ（反射ダメージなし）
      return {
        damageToDefender: noDamage,
        damageToAttacker: noDamage,
        attackerStateUpdate: attackerUpdate,
        defenderStateUpdate: noUpdate,
      };
    }
  }

  // outcome === HIT
  if (attackerCmd === CommandType.WEAPON_ATTACK) {
    // 回避判定
    const guaranteed = isGuaranteedHit(distance, attackerCmd, defenderCmd);
    if (!guaranteed) {
      const evasionRate = calculateEvasionRate(defenderMonster.stats.speed);
      const roll = randomFn() * 100;
      if (roll < evasionRate) {
        return {
          damageToDefender: { damage: 0, isEvaded: true, isReflected: false },
          damageToAttacker: noDamage,
          attackerStateUpdate: noUpdate,
          defenderStateUpdate: noUpdate,
        };
      }
    }

    const damage = calculateWeaponDamage(
      { strength: attackerMonster.stats.strength, weaponMultiplier: attackerMonster.weapon.multiplier, stance: attackerState.currentStance },
      { toughness: defenderMonster.stats.toughness, stance: defenderState.currentStance }
    );
    return {
      damageToDefender: { damage, isEvaded: false, isReflected: false },
      damageToAttacker: noDamage,
      attackerStateUpdate: noUpdate,
      defenderStateUpdate: noUpdate,
    };
  }

  if (attackerCmd === CommandType.SPECIAL_ATTACK) {
    const isExceeded = attackerState.remainingSpecialCount <= 0;

    // 回避判定
    const evasionRate = calculateEvasionRate(defenderMonster.stats.speed);
    const roll = randomFn() * 100;
    if (roll < evasionRate) {
      return {
        damageToDefender: { damage: 0, isEvaded: true, isReflected: false },
        damageToAttacker: noDamage,
        attackerStateUpdate: { remainingSpecialCount: Math.max(attackerState.remainingSpecialCount - 1, 0) },
        defenderStateUpdate: noUpdate,
      };
    }

    const damage = calculateSpecialDamage(
      { special: attackerMonster.stats.special, stance: attackerState.currentStance },
      isExceeded
    );
    return {
      damageToDefender: { damage, isEvaded: false, isReflected: false },
      damageToAttacker: noDamage,
      attackerStateUpdate: { remainingSpecialCount: Math.max(attackerState.remainingSpecialCount - 1, 0) },
      defenderStateUpdate: noUpdate,
    };
  }

  return { damageToDefender: noDamage, damageToAttacker: noDamage, attackerStateUpdate: noUpdate, defenderStateUpdate: noUpdate };
}

/**
 * 単一コマンドペア（1st or 2nd）を処理する
 */
function processCommandPair(
  distance: DistanceType,
  p1State: MonsterBattleState,
  p2State: MonsterBattleState,
  monster1: Monster,
  monster2: Monster,
  p1Cmd: CommandType,
  p2Cmd: CommandType,
  randomFn: () => number
): CommandPairResult {
  // 1. 距離更新
  const newDistance = calculateDistance(distance, p1Cmd, p2Cmd);

  // 2. スタンス更新
  const newP1Stance = isStanceCommand(p1Cmd)
    ? calculateNextStance(p1State.currentStance, p1Cmd as CommandType.STANCE_A | CommandType.STANCE_B)
    : p1State.currentStance;
  const newP2Stance = isStanceCommand(p2Cmd)
    ? calculateNextStance(p2State.currentStance, p2Cmd as CommandType.STANCE_A | CommandType.STANCE_B)
    : p2State.currentStance;

  // スタンス更新後の状態
  let updatedP1State = { ...p1State, currentStance: newP1Stance };
  let updatedP2State = { ...p2State, currentStance: newP2Stance };

  // 3. コマンド優先順位判定（更新後の距離で判定）
  const resolution = resolveCommandInteraction(newDistance, p1Cmd, p2Cmd);

  // 4. P1のコマンド結果によるダメージ計算（P1が攻撃、P2が防御）
  const p1Attack = calculateAttackDamage(
    resolution.p1Outcome, p1Cmd, p2Cmd,
    monster1, monster2, updatedP1State, updatedP2State,
    newDistance, randomFn
  );

  // 5. P2のコマンド結果によるダメージ計算（P2が攻撃、P1が防御）
  const p2Attack = calculateAttackDamage(
    resolution.p2Outcome, p2Cmd, p1Cmd,
    monster2, monster1, updatedP2State, updatedP1State,
    newDistance, randomFn
  );

  // 6. 状態の適用
  // P1の状態更新（P1の攻撃による自身の更新 + P2の攻撃による相手更新）
  updatedP1State = {
    ...updatedP1State,
    ...p1Attack.attackerStateUpdate,
    ...p2Attack.defenderStateUpdate,
  };
  // P2の状態更新
  updatedP2State = {
    ...updatedP2State,
    ...p2Attack.attackerStateUpdate,
    ...p1Attack.defenderStateUpdate,
  };

  // ダメージ: P1が受けるダメージ = P2の攻撃がP1に与えるダメージ + P1自身の反射ダメージ
  const p1TotalDamage = p2Attack.damageToDefender.damage + p1Attack.damageToAttacker.damage;
  const p2TotalDamage = p1Attack.damageToDefender.damage + p2Attack.damageToAttacker.damage;

  // HP更新
  updatedP1State = {
    ...updatedP1State,
    currentHp: Math.max(updatedP1State.currentHp - p1TotalDamage, 0),
  };
  updatedP2State = {
    ...updatedP2State,
    currentHp: Math.max(updatedP2State.currentHp - p2TotalDamage, 0),
  };

  // DamageInfo合成
  const p1DamageInfo: DamageInfo = {
    damage: p1TotalDamage,
    isEvaded: p2Attack.damageToDefender.isEvaded,
    isReflected: p1Attack.damageToAttacker.isReflected,
  };
  const p2DamageInfo: DamageInfo = {
    damage: p2TotalDamage,
    isEvaded: p1Attack.damageToDefender.isEvaded,
    isReflected: p2Attack.damageToAttacker.isReflected,
  };

  return {
    distance: newDistance,
    p1State: updatedP1State,
    p2State: updatedP2State,
    p1Damage: p1DamageInfo,
    p2Damage: p2DamageInfo,
  };
}

/**
 * DamageInfoを合算する（ターン全体の累積ダメージ）
 */
function mergeDamageInfo(first: DamageInfo, second: DamageInfo): DamageInfo {
  return {
    damage: first.damage + second.damage,
    isEvaded: first.isEvaded || second.isEvaded,
    isReflected: first.isReflected || second.isReflected,
  };
}

/**
 * TCBターン処理のメイン関数
 * 1stコマンドと2ndコマンドを順番に処理し、バトル状態とターン結果を返す
 */
export function processTurn(
  state: BattleState,
  monster1: Monster,
  monster2: Monster,
  p1Commands: TurnCommands,
  p2Commands: TurnCommands,
  randomFn: () => number = Math.random
): { newState: BattleState; turnResult: TurnResult } {
  // 1stコマンド処理
  const firstResult = processCommandPair(
    state.currentDistance,
    state.player1,
    state.player2,
    monster1,
    monster2,
    p1Commands.first.type,
    p2Commands.first.type,
    randomFn
  );

  // 2ndコマンド処理（1stの結果を入力として使用）
  const secondResult = processCommandPair(
    firstResult.distance,
    firstResult.p1State,
    firstResult.p2State,
    monster1,
    monster2,
    p1Commands.second.type,
    p2Commands.second.type,
    randomFn
  );

  // ターン結果構築
  const turnResult: TurnResult = {
    turnNumber: state.currentTurn,
    player1Commands: p1Commands,
    player2Commands: p2Commands,
    distanceAfter: secondResult.distance,
    player1Damage: mergeDamageInfo(firstResult.p1Damage, secondResult.p1Damage),
    player2Damage: mergeDamageInfo(firstResult.p2Damage, secondResult.p2Damage),
    player1StanceAfter: secondResult.p1State.currentStance,
    player2StanceAfter: secondResult.p2State.currentStance,
  };

  // 新しいバトル状態
  const newState: BattleState = {
    player1: secondResult.p1State,
    player2: secondResult.p2State,
    currentDistance: secondResult.distance,
    currentTurn: state.currentTurn + 1,
    remainingTime: state.remainingTime,
    isFinished: state.isFinished,
  };

  return { newState, turnResult };
}
