import { buildShareText, buildShareUrl } from '../../utils/shareUtils';
import { BattleResultType } from '../../types/BattleState';

describe('buildShareText', () => {
  describe('勝利時', () => {
    it('モンスター名と「勝った」が含まれること', () => {
      const text = buildShareText({
        resultType: BattleResultType.PLAYER1_WIN,
        monsterId: 'zaag',
        turnCount: 5,
      });
      expect(text).toContain('レイン');
      expect(text).toContain('勝');
    });

    it('ハッシュタグ #モンスター対戦 が含まれること', () => {
      const text = buildShareText({
        resultType: BattleResultType.PLAYER1_WIN,
        monsterId: 'zaag',
        turnCount: 5,
      });
      expect(text).toContain('#モンスター対戦');
    });

    it('ターン数が含まれること', () => {
      const text = buildShareText({
        resultType: BattleResultType.PLAYER1_WIN,
        monsterId: 'zaag',
        turnCount: 7,
      });
      expect(text).toContain('7');
    });
  });

  describe('敗北時', () => {
    it('モンスター名と「負け」が含まれること', () => {
      const text = buildShareText({
        resultType: BattleResultType.PLAYER2_WIN,
        monsterId: 'zaag',
        turnCount: 3,
      });
      expect(text).toContain('レイン');
      expect(text).toContain('負');
    });

    it('ハッシュタグ #モンスター対戦 が含まれること', () => {
      const text = buildShareText({
        resultType: BattleResultType.PLAYER2_WIN,
        monsterId: 'zaag',
        turnCount: 3,
      });
      expect(text).toContain('#モンスター対戦');
    });

    it('ターン数が含まれること', () => {
      const text = buildShareText({
        resultType: BattleResultType.PLAYER2_WIN,
        monsterId: 'zaag',
        turnCount: 10,
      });
      expect(text).toContain('10');
    });
  });

  describe('引き分け時', () => {
    it('「引き分け」が含まれること', () => {
      const text = buildShareText({
        resultType: BattleResultType.DRAW,
        monsterId: 'zaag',
        turnCount: 8,
      });
      expect(text).toContain('引き分け');
    });

    it('ハッシュタグ #モンスター対戦 が含まれること', () => {
      const text = buildShareText({
        resultType: BattleResultType.DRAW,
        monsterId: 'zaag',
        turnCount: 8,
      });
      expect(text).toContain('#モンスター対戦');
    });
  });

  describe('モンスター名不明時', () => {
    it('monsterIdがundefinedでもエラーにならないこと', () => {
      expect(() => {
        buildShareText({
          resultType: BattleResultType.PLAYER1_WIN,
          monsterId: undefined,
          turnCount: 5,
        });
      }).not.toThrow();
    });

    it('存在しないmonsterIdでもエラーにならないこと', () => {
      expect(() => {
        buildShareText({
          resultType: BattleResultType.PLAYER1_WIN,
          monsterId: 'unknown-monster',
          turnCount: 5,
        });
      }).not.toThrow();
    });

    it('モンスター名が取得できない場合でも文面が生成されること', () => {
      const text = buildShareText({
        resultType: BattleResultType.PLAYER1_WIN,
        monsterId: undefined,
        turnCount: 5,
      });
      expect(text.length).toBeGreaterThan(0);
      expect(text).toContain('#モンスター対戦');
    });
  });
});

describe('buildShareUrl', () => {
  it('https://x.com/intent/tweet?text= で始まること', () => {
    const url = buildShareUrl('テストテキスト');
    expect(url).toMatch(/^https:\/\/x\.com\/intent\/tweet\?text=/);
  });

  it('シェアテキストがURLエンコードされて含まれること', () => {
    const text = 'テストテキスト #モンスター対戦';
    const url = buildShareUrl(text);
    expect(url).toContain(encodeURIComponent(text));
  });

  it('テキストに改行が含まれている場合もエンコードされること', () => {
    const text = '勝った！\n#モンスター対戦';
    const url = buildShareUrl(text);
    expect(url).not.toContain('\n');
    expect(url).toContain(encodeURIComponent(text));
  });
});
