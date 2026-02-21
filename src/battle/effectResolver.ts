import { CommandType, DistanceType, TurnResult, CommandPhaseResult, DamageInfo, StanceType } from '../types';
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
  distanceBefore: DistanceType,
  stanceAfter: { player1: StanceType, player2: StanceType }
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

  // 2. リフレクター構えエフェクト（攻撃が来なかった場合のみ）
  if (phase.player1Command === CommandType.REFLECTOR && !isAttackCommand(phase.player2Command)) {
    effects.push({
      type: BattleEffectType.REFLECTOR_DEPLOY,
      target: 'player',
    });
  }
  if (phase.player2Command === CommandType.REFLECTOR && !isAttackCommand(phase.player1Command)) {
    effects.push({
      type: BattleEffectType.REFLECTOR_DEPLOY,
      target: 'enemy',
    });
  }

  // 3. P1のスタンス変更エフェクト
  if (phase.player1Command === CommandType.STANCE_A || phase.player1Command === CommandType.STANCE_B) {
    effects.push({
      type: BattleEffectType.STANCE_CHANGE,
      target: 'player',
      stanceTo: stanceAfter.player1,
    });
  }

  // 4. P2のスタンス変更エフェクト
  if (phase.player2Command === CommandType.STANCE_A || phase.player2Command === CommandType.STANCE_B) {
    effects.push({
      type: BattleEffectType.STANCE_CHANGE,
      target: 'enemy',
      stanceTo: stanceAfter.player2,
    });
  }

  // 5. P1のコマンドによる攻撃エフェクト
  resolvePlayerAttackEffects(
    phase.player1Command,
    phase.player2Command,
    phase.player2Damage,
    phase.player1Damage,
    'enemy',  // P1の攻撃ターゲットはenemy
    'player', // P1自身へのダメージターゲット
    effects
  );

  // 6. P2のコマンドによる攻撃エフェクト
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
  // リフレクター反射成功: 攻撃者が特殊攻撃 & 反射ダメージを受けた
  // → 連続アニメーション（発射→盾構え→跳ね返り→被弾）で表現
  if (attackerCmd === CommandType.SPECIAL_ATTACK && damageToAttacker.isReflected) {
    effects.push({
      type: BattleEffectType.SPECIAL_REFLECT,
      target: defenderTarget,       // リフレクター保持者（盾を構える側）
      reflectedDamage: damageToAttacker.damage,
    });
    return;
  }

  // リフレクター残回数切れブロック: 特殊攻撃を無効化したが反射できなかった
  if (attackerCmd === CommandType.SPECIAL_ATTACK && defenderCmd === CommandType.REFLECTOR && !damageToAttacker.isReflected) {
    effects.push({
      type: BattleEffectType.REFLECTOR_BLOCK,
      target: defenderTarget, // ブロックしたのは防御側
    });
    return;
  }

  // 特殊攻撃が回避されたケース（溜め→光球→着弾瞬間回避演出）
  if (attackerCmd === CommandType.SPECIAL_ATTACK && damageToDefender.isEvaded) {
    effects.push({
      type: BattleEffectType.SPECIAL_EVASION,
      target: defenderTarget,
    });
    return;
  }

  // 回避判定（武器攻撃のみ: 特殊攻撃はSPECIAL_EVASIONで上の分岐にて処理済み）
  if (attackerCmd === CommandType.WEAPON_ATTACK && damageToDefender.isEvaded) {
    effects.push({
      type: BattleEffectType.EVASION,
      target: defenderTarget,
    });
    return;
  }

  // 武器攻撃で特殊攻撃が潰されたケース（溜め→fizzle演出）
  if (attackerCmd === CommandType.SPECIAL_ATTACK && damageToDefender.damage === 0) {
    effects.push({
      type: BattleEffectType.SPECIAL_CHARGE_FIZZLE,
      target: attackerTarget, // 溜めていたのは攻撃側
    });
    return;
  }

  // 通常攻撃エフェクト
  const attackEffectType = getAttackEffectType(attackerCmd);
  if (attackEffectType && damageToDefender.damage > 0) {
    effects.push({
      type: attackEffectType,
      target: defenderTarget,
      // SPECIAL_ATTACKは命中タイミングでダメージ数値を表示するため、valueを埋め込む
      // WEAPON_ATTACKは直後にDAMAGE_NUMBERを別エフェクトとして並行再生
      value: attackerCmd === CommandType.SPECIAL_ATTACK ? damageToDefender.damage : undefined,
    });
    if (attackerCmd !== CommandType.SPECIAL_ATTACK) {
      effects.push({
        type: BattleEffectType.DAMAGE_NUMBER,
        target: defenderTarget,
        value: damageToDefender.damage,
      });
    }
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

  const stanceAfter = {
    player1: turnResult.player1StanceAfter,
    player2: turnResult.player2StanceAfter,
  };

  const phase1Effects = resolvePhaseEffects(phase1, currentDistance, stanceAfter);
  const phase2Effects = resolvePhaseEffects(phase2, phase1.distanceAfter, stanceAfter);

  return [phase1Effects, phase2Effects];
}
