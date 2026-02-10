import { CommandType, Command, TurnCommands } from '../../types/Command';

describe('Command Types', () => {
  describe('CommandType enum', () => {
    it('should have ADVANCE command', () => {
      expect(CommandType.ADVANCE).toBe('ADVANCE');
    });

    it('should have RETREAT command', () => {
      expect(CommandType.RETREAT).toBe('RETREAT');
    });

    it('should have WEAPON_ATTACK command', () => {
      expect(CommandType.WEAPON_ATTACK).toBe('WEAPON_ATTACK');
    });

    it('should have SPECIAL_ATTACK command', () => {
      expect(CommandType.SPECIAL_ATTACK).toBe('SPECIAL_ATTACK');
    });

    it('should have REFLECTOR command', () => {
      expect(CommandType.REFLECTOR).toBe('REFLECTOR');
    });

    it('should have STANCE_A command', () => {
      expect(CommandType.STANCE_A).toBe('STANCE_A');
    });

    it('should have STANCE_B command', () => {
      expect(CommandType.STANCE_B).toBe('STANCE_B');
    });

    it('should have exactly 7 command types', () => {
      const commandTypes = Object.values(CommandType);
      expect(commandTypes).toHaveLength(7);
    });
  });

  describe('Command', () => {
    it('should represent a single command action', () => {
      const command: Command = {
        type: CommandType.WEAPON_ATTACK,
      };
      expect(command).toHaveProperty('type');
      expect(command.type).toBe(CommandType.WEAPON_ATTACK);
    });

    it('should have a type property of CommandType', () => {
      const command: Command = {
        type: CommandType.ADVANCE,
      };
      expect(Object.values(CommandType)).toContain(command.type);
    });
  });

  describe('TurnCommands', () => {
    it('should contain first and second command', () => {
      const turnCommands: TurnCommands = {
        first: { type: CommandType.WEAPON_ATTACK },
        second: { type: CommandType.REFLECTOR },
      };
      expect(turnCommands).toHaveProperty('first');
      expect(turnCommands).toHaveProperty('second');
    });

    it('should allow any combination of two commands', () => {
      const turnCommands: TurnCommands = {
        first: { type: CommandType.ADVANCE },
        second: { type: CommandType.SPECIAL_ATTACK },
      };
      expect(turnCommands.first.type).toBe(CommandType.ADVANCE);
      expect(turnCommands.second.type).toBe(CommandType.SPECIAL_ATTACK);
    });

    it('should allow same command twice', () => {
      const turnCommands: TurnCommands = {
        first: { type: CommandType.WEAPON_ATTACK },
        second: { type: CommandType.WEAPON_ATTACK },
      };
      expect(turnCommands.first.type).toBe(turnCommands.second.type);
    });
  });
});
