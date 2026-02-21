import { Monster, Weapon, Reflector, EquipmentType } from '../types';

/**
 * 装備プリセット（タイプA/B）
 */
export const EQUIPMENT_PRESETS: Record<
  EquipmentType,
  { weapon: Weapon; reflector: Reflector }
> = {
  A: {
    weapon: { name: 'タイプA武器', multiplier: 1.6 },
    reflector: { name: 'タイプAリフレクター', maxReflectCount: 2, reflectRate: 0.5 },
  },
  B: {
    weapon: { name: 'タイプB武器', multiplier: 1.4 },
    reflector: { name: 'タイプBリフレクター', maxReflectCount: 3, reflectRate: 0.6 },
  },
};

/**
 * 8魂格のモンスターデータベース
 */
export const MONSTER_DATABASE: Monster[] = [
  {
    id: 'zaag',
    name: 'レイン',
    species: 'ザーグ',
    stats: { hp: 375, strength: 50, special: 50, speed: 40, toughness: 50, specialAttackCount: 7 },
    weapon: { name: '幻銀の剣', multiplier: EQUIPMENT_PRESETS.A.weapon.multiplier },
    reflector: {
      name: '幻銀の盾',
      maxReflectCount: EQUIPMENT_PRESETS.A.reflector.maxReflectCount,
      reflectRate: EQUIPMENT_PRESETS.A.reflector.reflectRate,
    },
  },
  {
    id: 'gardan',
    name: 'ドルグ',
    species: 'ガルダン',
    stats: {
      hp: 420,
      strength: 75,
      special: 25,
      speed: 15,
      toughness: 55,
      specialAttackCount: 5,
    },
    weapon: { name: '岩砕の拳', multiplier: EQUIPMENT_PRESETS.A.weapon.multiplier },
    reflector: {
      name: '岩壁の護り',
      maxReflectCount: EQUIPMENT_PRESETS.A.reflector.maxReflectCount,
      reflectRate: EQUIPMENT_PRESETS.A.reflector.reflectRate,
    },
  },
  {
    id: 'roona',
    name: 'シエル',
    species: 'ルーナ',
    stats: {
      hp: 270,
      strength: 20,
      special: 80,
      speed: 45,
      toughness: 25,
      specialAttackCount: 9,
    },
    weapon: { name: '星霊の杖', multiplier: EQUIPMENT_PRESETS.B.weapon.multiplier },
    reflector: {
      name: '星霊の障壁',
      maxReflectCount: EQUIPMENT_PRESETS.B.reflector.maxReflectCount,
      reflectRate: EQUIPMENT_PRESETS.B.reflector.reflectRate,
    },
  },
  {
    id: 'zephyr',
    name: 'カイ',
    species: 'ゼフィル',
    stats: {
      hp: 300,
      strength: 45,
      special: 40,
      speed: 50,
      toughness: 30,
      specialAttackCount: 7,
    },
    weapon: { name: '疾風の爪', multiplier: EQUIPMENT_PRESETS.A.weapon.multiplier },
    reflector: {
      name: '疾風の羽',
      maxReflectCount: EQUIPMENT_PRESETS.A.reflector.maxReflectCount,
      reflectRate: EQUIPMENT_PRESETS.A.reflector.reflectRate,
    },
  },
  {
    id: 'balga',
    name: 'ゲンブ',
    species: 'バルガ',
    stats: {
      hp: 405,
      strength: 35,
      special: 30,
      speed: 15,
      toughness: 65,
      specialAttackCount: 6,
    },
    weapon: { name: '玄武の牙', multiplier: EQUIPMENT_PRESETS.B.weapon.multiplier },
    reflector: {
      name: '玄武の甲羅',
      maxReflectCount: EQUIPMENT_PRESETS.B.reflector.maxReflectCount,
      reflectRate: EQUIPMENT_PRESETS.B.reflector.reflectRate,
    },
  },
  {
    id: 'morsu',
    name: 'ユグド',
    species: 'モルス',
    stats: {
      hp: 525,
      strength: 30,
      special: 35,
      speed: 20,
      toughness: 55,
      specialAttackCount: 8,
    },
    weapon: { name: '古樹の腕', multiplier: EQUIPMENT_PRESETS.B.weapon.multiplier },
    reflector: {
      name: '古樹の根',
      maxReflectCount: EQUIPMENT_PRESETS.B.reflector.maxReflectCount,
      reflectRate: EQUIPMENT_PRESETS.B.reflector.reflectRate,
    },
  },
  {
    id: 'graon',
    name: 'ボルグ',
    species: 'グラオン',
    stats: {
      hp: 345,
      strength: 70,
      special: 15,
      speed: 25,
      toughness: 65,
      specialAttackCount: 5,
    },
    weapon: { name: '蛮族の戦斧', multiplier: EQUIPMENT_PRESETS.A.weapon.multiplier },
    reflector: {
      name: '蛮族の護符',
      maxReflectCount: EQUIPMENT_PRESETS.A.reflector.maxReflectCount,
      reflectRate: EQUIPMENT_PRESETS.A.reflector.reflectRate,
    },
  },
  {
    id: 'igna',
    name: 'アーシュ',
    species: 'イグナ',
    stats: {
      hp: 255,
      strength: 15,
      special: 75,
      speed: 50,
      toughness: 20,
      specialAttackCount: 10,
    },
    weapon: { name: '焔の爪', multiplier: EQUIPMENT_PRESETS.B.weapon.multiplier },
    reflector: {
      name: '焔の羽',
      maxReflectCount: EQUIPMENT_PRESETS.B.reflector.maxReflectCount,
      reflectRate: EQUIPMENT_PRESETS.B.reflector.reflectRate,
    },
  },
];

/**
 * 能力UP値の型（specialAttackCountは成長しない）
 */
interface AbilityUpValue {
  hp: number;
  strength: number;
  special: number;
  speed: number;
  toughness: number;
}

/**
 * 種族別の1段階あたり能力UP値（最大7段階）
 */
export const ABILITY_UP_VALUES: Record<string, AbilityUpValue> = {
  zaag: { hp: 15, strength: 5, special: 5, speed: 4, toughness: 5 },
  gardan: { hp: 15, strength: 8, special: 2, speed: 1, toughness: 5 },
  roona: { hp: 10, strength: 1, special: 8, speed: 4, toughness: 2 },
  zephyr: { hp: 12, strength: 4, special: 4, speed: 5, toughness: 3 },
  balga: { hp: 15, strength: 3, special: 2, speed: 1, toughness: 8 },
  morsu: { hp: 20, strength: 2, special: 3, speed: 2, toughness: 5 },
  graon: { hp: 13, strength: 7, special: 1, speed: 2, toughness: 6 },
  igna: { hp: 10, strength: 1, special: 8, speed: 5, toughness: 1 },
};

/**
 * IDでモンスターを取得
 */
export function getMonsterById(id: string): Monster | undefined {
  return MONSTER_DATABASE.find((m) => m.id === id);
}
