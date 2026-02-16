import { AudioKey, isAudioKey, BGM_KEYS, SE_KEYS } from '../../constants/audioKeys';

describe('AudioKey', () => {
  it('BGMキーが定義されていること', () => {
    expect(AudioKey.BGM_TITLE).toBe('bgm_title');
    expect(AudioKey.BGM_BATTLE).toBe('bgm_battle');
  });

  it('SEキーが定義されていること', () => {
    expect(AudioKey.SE_ATTACK).toBe('se_attack');
    expect(AudioKey.SE_SELECT).toBe('se_select');
    expect(AudioKey.SE_VICTORY).toBe('se_victory');
    expect(AudioKey.SE_DEFEAT).toBe('se_defeat');
  });

  it('全6種類のキーが定義されていること', () => {
    const values = Object.values(AudioKey);
    expect(values).toHaveLength(6);
  });

  it('すべてのキー値が一意であること', () => {
    const values = Object.values(AudioKey);
    const unique = new Set(values);
    expect(unique.size).toBe(values.length);
  });
});

describe('BGM_KEYS', () => {
  it('BGMキーのみを含むこと', () => {
    expect(BGM_KEYS).toContain(AudioKey.BGM_TITLE);
    expect(BGM_KEYS).toContain(AudioKey.BGM_BATTLE);
    expect(BGM_KEYS).toHaveLength(2);
  });
});

describe('SE_KEYS', () => {
  it('SEキーのみを含むこと', () => {
    expect(SE_KEYS).toContain(AudioKey.SE_ATTACK);
    expect(SE_KEYS).toContain(AudioKey.SE_SELECT);
    expect(SE_KEYS).toContain(AudioKey.SE_VICTORY);
    expect(SE_KEYS).toContain(AudioKey.SE_DEFEAT);
    expect(SE_KEYS).toHaveLength(4);
  });
});

describe('isAudioKey', () => {
  it('有効なAudioKeyに対してtrueを返すこと', () => {
    expect(isAudioKey('bgm_title')).toBe(true);
    expect(isAudioKey('bgm_battle')).toBe(true);
    expect(isAudioKey('se_attack')).toBe(true);
    expect(isAudioKey('se_select')).toBe(true);
    expect(isAudioKey('se_victory')).toBe(true);
    expect(isAudioKey('se_defeat')).toBe(true);
  });

  it('無効な文字列に対してfalseを返すこと', () => {
    expect(isAudioKey('invalid')).toBe(false);
    expect(isAudioKey('')).toBe(false);
    expect(isAudioKey('bgm_unknown')).toBe(false);
  });
});
