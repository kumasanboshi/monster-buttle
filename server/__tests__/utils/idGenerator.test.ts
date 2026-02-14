import { generateRoomId } from '../../src/utils/idGenerator';

describe('generateRoomId', () => {
  it('デフォルトで6文字のIDを生成する', () => {
    const id = generateRoomId();
    expect(id).toHaveLength(6);
  });

  it('指定した長さのIDを生成する', () => {
    const id = generateRoomId(8);
    expect(id).toHaveLength(8);
  });

  it('紛らわしい文字（0, O, 1, l, I）を含まない', () => {
    const confusingChars = ['0', 'O', '1', 'l', 'I'];
    // 十分な回数テストして統計的に確認
    for (let i = 0; i < 100; i++) {
      const id = generateRoomId();
      for (const char of confusingChars) {
        expect(id).not.toContain(char);
      }
    }
  });

  it('英数字のみで構成される', () => {
    for (let i = 0; i < 100; i++) {
      const id = generateRoomId();
      expect(id).toMatch(/^[A-Za-z0-9]+$/);
    }
  });

  it('呼び出すたびに異なるIDを生成する', () => {
    const ids = new Set<string>();
    for (let i = 0; i < 100; i++) {
      ids.add(generateRoomId());
    }
    // 100回生成して重複がないことを確認（衝突確率は極めて低い）
    expect(ids.size).toBe(100);
  });
});
