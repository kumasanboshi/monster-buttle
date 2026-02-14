import { SceneKey, ALL_SCENE_KEYS } from '../../scenes/sceneKeys';

describe('SceneKey', () => {
  it('PROJECT.md の画面構成に対応する8つのシーンキーが定義されていること', () => {
    const keys = Object.values(SceneKey);
    expect(keys).toHaveLength(8);
  });

  it('BOOT シーンキーが定義されていること', () => {
    expect(SceneKey.BOOT).toBe('BOOT');
  });

  it('TITLE シーンキーが定義されていること', () => {
    expect(SceneKey.TITLE).toBe('TITLE');
  });

  it('MODE_SELECT シーンキーが定義されていること', () => {
    expect(SceneKey.MODE_SELECT).toBe('MODE_SELECT');
  });

  it('CHARACTER_SELECT シーンキーが定義されていること', () => {
    expect(SceneKey.CHARACTER_SELECT).toBe('CHARACTER_SELECT');
  });

  it('BATTLE シーンキーが定義されていること', () => {
    expect(SceneKey.BATTLE).toBe('BATTLE');
  });

  it('RESULT シーンキーが定義されていること', () => {
    expect(SceneKey.RESULT).toBe('RESULT');
  });

  it('SETTINGS シーンキーが定義されていること', () => {
    expect(SceneKey.SETTINGS).toBe('SETTINGS');
  });

  it('DIFFICULTY_SELECT シーンキーが定義されていること', () => {
    expect(SceneKey.DIFFICULTY_SELECT).toBe('DIFFICULTY_SELECT');
  });

  it('すべてのシーンキーが一意であること', () => {
    const values = Object.values(SceneKey);
    const uniqueValues = new Set(values);
    expect(uniqueValues.size).toBe(values.length);
  });
});

describe('ALL_SCENE_KEYS', () => {
  it('全シーンキーを配列として含むこと', () => {
    expect(Array.isArray(ALL_SCENE_KEYS)).toBe(true);
    expect(ALL_SCENE_KEYS).toHaveLength(8);
  });

  it('SceneKey enum の全値を網羅していること', () => {
    const enumValues = Object.values(SceneKey);
    for (const key of enumValues) {
      expect(ALL_SCENE_KEYS).toContain(key);
    }
  });

  it('BOOT が先頭であること（最初に登録されるシーン）', () => {
    expect(ALL_SCENE_KEYS[0]).toBe(SceneKey.BOOT);
  });
});
