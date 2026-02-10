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
export { BattleState, DamageInfo, TurnResult, BattleResultType, BattleResult } from './BattleState';
