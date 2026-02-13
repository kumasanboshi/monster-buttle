import { CommandType, DistanceType, TurnResult, CommandPhaseResult, DamageInfo } from '../types';
import { BattleEffect, BattleEffectType, BattleEffectSequence, EffectTarget } from '../types/BattleEffect';

/**
 * コマンドが攻撃コマンドかどうか
 */
function isAttackCommand(cmd: CommandType): boolean {
  return cmd === CommandType.WEAPON_ATTACK || cmd === CommandType.SPECIAL_ATTACK;
}

/**
 * P1の攻撃コマンドに対応するエフェクトタイプを取得
 */
function getAttackEffectType(cmd: CommandType): BattleEffectType | null {
  if (cmd === CommandType.WEAPON_ATTACK) return BattleEffectType.WEAPON_ATTACK;
  if (cmd === CommandType.SPECIAL_ATTACK) return BattleEffectType.SPECIAL_ATTACK;
  return null;
}

/**
 * 1フェーズ分のエフェクトを解決する
 */
function resolvePhaseEffects(
  phase: CommandPhaseResult,
  distanceBefore: DistanceType
): BattleEffect[] {
  const effects: BattleEffect[] = [];

  // 1. 距離移動エフェクト
  if (phase.distanceAfter !== distanceBefore) {
    effects.push({
      type: BattleEffectType.DISTANCE_MOVE,
      target: 'player', // 距離移動は両者に適用されるのでplayerで代表
      distanceFrom: distanceBefore,
      distanceTo: phase.distanceAfter,
    });
  }

  // 2. P1のコマンドによるエフェクト
  resolvePlayerAttackEffects(
    phase.player1Command,
    phase.player2Command,
    phase.player2Damage,
    phase.player1Damage,
    'enemy',  // P1の攻撃ターゲットはenemy
    'player', // P1自身へのダメージターゲット
    effects
  );

  // 3. P2のコマンドによるエフェクト
  resolvePlayerAttackEffects(
    phase.player2Command,
    phase.player1Command,
    phase.player1Damage,
    phase.player2Damage,
    'player', // P2の攻撃ターゲットはplayer
    'enemy',  // P2自身へのダメージターゲット
    effects
  );

  return effects;
}

/**
 * 片方のプレイヤーの攻撃に基づくエフェクトを解決
 */
function resolvePlayerAttackEffects(
  attackerCmd: CommandType,
  defenderCmd: CommandType,
  damageToDefender: DamageInfo,
  damageToAttacker: DamageInfo,
  defenderTarget: EffectTarget,
  attackerTarget: EffectTarget,
  effects: BattleEffect[]
): void {
  // リフレクター判定: 攻撃者が特殊攻撃 & 攻撃者が反射ダメージを受けた
  if (attackerCmd === CommandType.SPECIAL_ATTACK && damageToAttacker.isReflected) {
    effects.push({
      type: BattleEffectType.REFLECTOR,
      target: defenderTarget, // リフレクター側のエフェクト
    });
    if (damageToAttacker.damage > 0) {
      effects.push({
        type: BattleEffectType.DAMAGE_NUMBER,
        target: attackerTarget,
        value: damageToAttacker.damage,
      });
    }
    return;
  }

  // 回避判定
  if (isAttackCommand(attackerCmd) && damageToDefender.isEvaded) {
    effects.push({
      type: BattleEffectType.EVASION,
      target: defenderTarget,
    });
    return;
  }

  // 通常攻撃エフェクト
  const attackEffectType = getAttackEffectType(attackerCmd);
  if (attackEffectType && damageToDefender.damage > 0) {
    effects.push({
      type: attackEffectType,
      target: defenderTarget,
    });
    effects.push({
      type: BattleEffectType.DAMAGE_NUMBER,
      target: defenderTarget,
      value: damageToDefender.damage,
    });
  }
}

/**
 * TurnResultからバトルエフェクトシーケンスを生成する
 *
 * @param turnResult ターン処理の結果
 * @param currentDistance ターン開始時の距離
 * @returns フェーズごとのエフェクト配列
 */
export function resolveBattleEffects(
  turnResult: TurnResult,
  currentDistance: DistanceType
): BattleEffectSequence {
  const [phase1, phase2] = turnResult.phases;

  const phase1Effects = resolvePhaseEffects(phase1, currentDistance);
  const phase2Effects = resolvePhaseEffects(phase2, phase1.distanceAfter);

  return [phase1Effects, phase2Effects];
}
