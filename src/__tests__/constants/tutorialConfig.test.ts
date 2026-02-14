import {
  TUTORIAL_TURNS,
  TUTORIAL_STAGE_NUMBER,
  TUTORIAL_LAST_FIXED_TURN,
  TUTORIAL_FREE_BATTLE_MESSAGE,
  TutorialTurnDef,
} from '../../constants/tutorialConfig';
import { CommandType } from '../../types/Command';

describe('TUTORIAL_TURNS', () => {
  it('5ターン分の定義があること', () => {
    expect(TUTORIAL_TURNS).toHaveLength(5);
  });

  it('ターン番号が1〜5の連番であること', () => {
    TUTORIAL_TURNS.forEach((def, index) => {
      expect(def.turn).toBe(index + 1);
    });
  });

  it('ターン1: 前進・前進 vs 前進・前進', () => {
    const t = TUTORIAL_TURNS[0];
    expect(t.playerCommands).toEqual({ first: CommandType.ADVANCE, second: CommandType.ADVANCE });
    expect(t.enemyCommands).toEqual({ first: CommandType.ADVANCE, second: CommandType.ADVANCE });
    expect(t.popupMessage).toBe('前進で距離を詰めよう');
  });

  it('ターン2: 武器攻撃・武器攻撃 vs 前進・前進', () => {
    const t = TUTORIAL_TURNS[1];
    expect(t.playerCommands).toEqual({ first: CommandType.WEAPON_ATTACK, second: CommandType.WEAPON_ATTACK });
    expect(t.enemyCommands).toEqual({ first: CommandType.ADVANCE, second: CommandType.ADVANCE });
    expect(t.popupMessage).toBe('武器攻撃で攻撃しよう');
  });

  it('ターン3: 特殊攻撃・特殊攻撃 vs 後退・後退', () => {
    const t = TUTORIAL_TURNS[2];
    expect(t.playerCommands).toEqual({ first: CommandType.SPECIAL_ATTACK, second: CommandType.SPECIAL_ATTACK });
    expect(t.enemyCommands).toEqual({ first: CommandType.RETREAT, second: CommandType.RETREAT });
    expect(t.popupMessage).toBe('特殊攻撃は距離に関係なく当たる');
  });

  it('ターン4: リフレクター・リフレクター vs 特殊攻撃・特殊攻撃', () => {
    const t = TUTORIAL_TURNS[3];
    expect(t.playerCommands).toEqual({ first: CommandType.REFLECTOR, second: CommandType.REFLECTOR });
    expect(t.enemyCommands).toEqual({ first: CommandType.SPECIAL_ATTACK, second: CommandType.SPECIAL_ATTACK });
    expect(t.popupMessage).toBe('リフレクターで特殊攻撃を跳ね返せ');
  });

  it('ターン5: スタンスA・武器攻撃 vs 前進・前進', () => {
    const t = TUTORIAL_TURNS[4];
    expect(t.playerCommands).toEqual({ first: CommandType.STANCE_A, second: CommandType.WEAPON_ATTACK });
    expect(t.enemyCommands).toEqual({ first: CommandType.ADVANCE, second: CommandType.ADVANCE });
    expect(t.popupMessage).toBe('スタンス切替で攻撃力UP');
  });

  it('すべてのコマンドが有効なCommandTypeであること', () => {
    const validCommands = Object.values(CommandType);
    TUTORIAL_TURNS.forEach((def) => {
      expect(validCommands).toContain(def.playerCommands.first);
      expect(validCommands).toContain(def.playerCommands.second);
      expect(validCommands).toContain(def.enemyCommands.first);
      expect(validCommands).toContain(def.enemyCommands.second);
    });
  });

  it('すべてのポップアップメッセージが空でないこと', () => {
    TUTORIAL_TURNS.forEach((def) => {
      expect(def.popupMessage.length).toBeGreaterThan(0);
    });
  });
});

describe('チュートリアル定数', () => {
  it('TUTORIAL_STAGE_NUMBERが1であること', () => {
    expect(TUTORIAL_STAGE_NUMBER).toBe(1);
  });

  it('TUTORIAL_LAST_FIXED_TURNが5であること', () => {
    expect(TUTORIAL_LAST_FIXED_TURN).toBe(5);
  });

  it('TUTORIAL_FREE_BATTLE_MESSAGEが定義されていること', () => {
    expect(TUTORIAL_FREE_BATTLE_MESSAGE).toBe('自由に戦ってみよう！');
  });
});
