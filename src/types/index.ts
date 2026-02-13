/**
 * 型定義モジュール
 *
 * バトルシステムのすべての型定義をエクスポートします。
 */

// Command types
export { CommandType, Command, TurnCommands } from './Command';

// Distance types
export { DistanceType, moveCloser, moveFarther, calculateDistance } from './Distance';

// Stance types
export { StanceType, StanceModifiers, STANCE_MODIFIERS, calculateNextStance } from './Stance';

// Equipment types
export { Weapon, Reflector, EquipmentSet, EquipmentType } from './Equipment';

// Monster types
export { MonsterStats, Monster, MonsterBattleState } from './Monster';

// BattleState types
export { BattleState, DamageInfo, TurnResult, CommandPhaseResult, BattleResultType, BattleResult } from './BattleState';

// BattleEffect types
export { BattleEffectType, BattleEffect, BattleEffectSequence } from './BattleEffect';
export type { EffectTarget } from './BattleEffect';

// GameMode types
export { GameMode } from './GameMode';
