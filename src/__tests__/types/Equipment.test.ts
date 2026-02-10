import {
  Weapon,
  Reflector,
  EquipmentSet,
  EquipmentType,
} from '../../types/Equipment';

describe('Equipment Types', () => {
  describe('Weapon', () => {
    it('should have name and multiplier properties', () => {
      const weapon: Weapon = {
        name: 'Test Weapon',
        multiplier: 1.6,
      };
      expect(weapon).toHaveProperty('name');
      expect(weapon).toHaveProperty('multiplier');
    });

    it('should accept valid weapon multiplier (1.4 or 1.6)', () => {
      const weaponA: Weapon = {
        name: 'Type A Weapon',
        multiplier: 1.6,
      };
      const weaponB: Weapon = {
        name: 'Type B Weapon',
        multiplier: 1.4,
      };
      expect(weaponA.multiplier).toBe(1.6);
      expect(weaponB.multiplier).toBe(1.4);
    });

    it('should validate multiplier as positive number', () => {
      const weapon: Weapon = {
        name: 'Test Weapon',
        multiplier: 1.5,
      };
      expect(weapon.multiplier).toBeGreaterThan(0);
    });
  });

  describe('Reflector', () => {
    it('should have name, maxReflectCount, and reflectRate properties', () => {
      const reflector: Reflector = {
        name: 'Test Reflector',
        maxReflectCount: 2,
        reflectRate: 0.5,
      };
      expect(reflector).toHaveProperty('name');
      expect(reflector).toHaveProperty('maxReflectCount');
      expect(reflector).toHaveProperty('reflectRate');
    });

    it('should accept valid reflect count (2 or 3)', () => {
      const reflectorA: Reflector = {
        name: 'Type A Reflector',
        maxReflectCount: 2,
        reflectRate: 0.5,
      };
      const reflectorB: Reflector = {
        name: 'Type B Reflector',
        maxReflectCount: 3,
        reflectRate: 0.6,
      };
      expect(reflectorA.maxReflectCount).toBe(2);
      expect(reflectorB.maxReflectCount).toBe(3);
    });

    it('should accept valid reflect rate (0.5 or 0.6)', () => {
      const reflectorA: Reflector = {
        name: 'Type A Reflector',
        maxReflectCount: 2,
        reflectRate: 0.5,
      };
      const reflectorB: Reflector = {
        name: 'Type B Reflector',
        maxReflectCount: 3,
        reflectRate: 0.6,
      };
      expect(reflectorA.reflectRate).toBe(0.5);
      expect(reflectorB.reflectRate).toBe(0.6);
    });

    it('should validate reflectRate between 0.0 and 1.0', () => {
      const reflector: Reflector = {
        name: 'Test Reflector',
        maxReflectCount: 2,
        reflectRate: 0.5,
      };
      expect(reflector.reflectRate).toBeGreaterThanOrEqual(0.0);
      expect(reflector.reflectRate).toBeLessThanOrEqual(1.0);
    });

    it('should validate maxReflectCount as positive integer', () => {
      const reflector: Reflector = {
        name: 'Test Reflector',
        maxReflectCount: 2,
        reflectRate: 0.5,
      };
      expect(reflector.maxReflectCount).toBeGreaterThan(0);
      expect(Number.isInteger(reflector.maxReflectCount)).toBe(true);
    });
  });

  describe('EquipmentSet', () => {
    it('should contain both weapon and reflector', () => {
      const equipmentSet: EquipmentSet = {
        weapon: {
          name: 'Test Weapon',
          multiplier: 1.6,
        },
        reflector: {
          name: 'Test Reflector',
          maxReflectCount: 2,
          reflectRate: 0.5,
        },
      };
      expect(equipmentSet).toHaveProperty('weapon');
      expect(equipmentSet).toHaveProperty('reflector');
    });

    it('should represent Type A equipment (multiplier: 1.6, count: 2, rate: 0.5)', () => {
      const equipmentSetA: EquipmentSet = {
        weapon: {
          name: 'Type A Weapon',
          multiplier: 1.6,
        },
        reflector: {
          name: 'Type A Reflector',
          maxReflectCount: 2,
          reflectRate: 0.5,
        },
      };
      expect(equipmentSetA.weapon.multiplier).toBe(1.6);
      expect(equipmentSetA.reflector.maxReflectCount).toBe(2);
      expect(equipmentSetA.reflector.reflectRate).toBe(0.5);
    });

    it('should represent Type B equipment (multiplier: 1.4, count: 3, rate: 0.6)', () => {
      const equipmentSetB: EquipmentSet = {
        weapon: {
          name: 'Type B Weapon',
          multiplier: 1.4,
        },
        reflector: {
          name: 'Type B Reflector',
          maxReflectCount: 3,
          reflectRate: 0.6,
        },
      };
      expect(equipmentSetB.weapon.multiplier).toBe(1.4);
      expect(equipmentSetB.reflector.maxReflectCount).toBe(3);
      expect(equipmentSetB.reflector.reflectRate).toBe(0.6);
    });
  });

  describe('EquipmentType', () => {
    it('should accept type A', () => {
      const typeA: EquipmentType = 'A';
      expect(typeA).toBe('A');
    });

    it('should accept type B', () => {
      const typeB: EquipmentType = 'B';
      expect(typeB).toBe('B');
    });
  });
});
