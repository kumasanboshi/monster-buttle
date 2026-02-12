import {
  SCENE_TRANSITIONS,
  getAvailableTransitions,
  isValidTransition,
} from '../../scenes/sceneTransitions';
import { SceneKey } from '../../scenes/sceneKeys';

describe('SCENE_TRANSITIONS', () => {
  it('すべての遷移が有効なシーンキーを参照していること', () => {
    const validKeys = Object.values(SceneKey);
    for (const transition of SCENE_TRANSITIONS) {
      expect(validKeys).toContain(transition.from);
      expect(validKeys).toContain(transition.to);
    }
  });

  it('BOOT からの遷移先が TITLE のみであること', () => {
    const targets = SCENE_TRANSITIONS.filter((t) => t.from === SceneKey.BOOT).map((t) => t.to);
    expect(targets).toEqual([SceneKey.TITLE]);
  });

  it('TITLE からの遷移先に MODE_SELECT と SETTINGS が含まれること', () => {
    const targets = SCENE_TRANSITIONS.filter((t) => t.from === SceneKey.TITLE).map((t) => t.to);
    expect(targets).toContain(SceneKey.MODE_SELECT);
    expect(targets).toContain(SceneKey.SETTINGS);
  });

  it('MODE_SELECT からの遷移先に CHARACTER_SELECT と TITLE が含まれること', () => {
    const targets = SCENE_TRANSITIONS.filter((t) => t.from === SceneKey.MODE_SELECT).map((t) => t.to);
    expect(targets).toContain(SceneKey.CHARACTER_SELECT);
    expect(targets).toContain(SceneKey.TITLE);
  });

  it('CHARACTER_SELECT からの遷移先に BATTLE と MODE_SELECT が含まれること', () => {
    const targets = SCENE_TRANSITIONS.filter((t) => t.from === SceneKey.CHARACTER_SELECT).map((t) => t.to);
    expect(targets).toContain(SceneKey.BATTLE);
    expect(targets).toContain(SceneKey.MODE_SELECT);
  });

  it('BATTLE からの遷移先が RESULT のみであること', () => {
    const targets = SCENE_TRANSITIONS.filter((t) => t.from === SceneKey.BATTLE).map((t) => t.to);
    expect(targets).toEqual([SceneKey.RESULT]);
  });

  it('RESULT からの遷移先に TITLE と CHARACTER_SELECT が含まれること', () => {
    const targets = SCENE_TRANSITIONS.filter((t) => t.from === SceneKey.RESULT).map((t) => t.to);
    expect(targets).toContain(SceneKey.TITLE);
    expect(targets).toContain(SceneKey.CHARACTER_SELECT);
  });

  it('SETTINGS からの遷移先が TITLE のみであること', () => {
    const targets = SCENE_TRANSITIONS.filter((t) => t.from === SceneKey.SETTINGS).map((t) => t.to);
    expect(targets).toEqual([SceneKey.TITLE]);
  });
});

describe('getAvailableTransitions', () => {
  it('BOOT から遷移可能なシーンが [TITLE] であること', () => {
    expect(getAvailableTransitions(SceneKey.BOOT)).toEqual([SceneKey.TITLE]);
  });

  it('TITLE から遷移可能なシーンに MODE_SELECT と SETTINGS が含まれること', () => {
    const transitions = getAvailableTransitions(SceneKey.TITLE);
    expect(transitions).toContain(SceneKey.MODE_SELECT);
    expect(transitions).toContain(SceneKey.SETTINGS);
  });
});

describe('isValidTransition', () => {
  it('許可された遷移に対して true を返すこと', () => {
    expect(isValidTransition(SceneKey.BOOT, SceneKey.TITLE)).toBe(true);
    expect(isValidTransition(SceneKey.TITLE, SceneKey.MODE_SELECT)).toBe(true);
    expect(isValidTransition(SceneKey.BATTLE, SceneKey.RESULT)).toBe(true);
  });

  it('許可されていない遷移に対して false を返すこと', () => {
    expect(isValidTransition(SceneKey.BOOT, SceneKey.BATTLE)).toBe(false);
    expect(isValidTransition(SceneKey.TITLE, SceneKey.RESULT)).toBe(false);
  });

  it('BOOT → BATTLE のような不正な遷移に false を返すこと', () => {
    expect(isValidTransition(SceneKey.BOOT, SceneKey.BATTLE)).toBe(false);
  });

  it('同一シーンへの遷移に false を返すこと', () => {
    expect(isValidTransition(SceneKey.TITLE, SceneKey.TITLE)).toBe(false);
    expect(isValidTransition(SceneKey.BOOT, SceneKey.BOOT)).toBe(false);
  });
});
