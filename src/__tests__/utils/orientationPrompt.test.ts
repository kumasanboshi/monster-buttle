import {
  shouldShowOrientationPrompt,
  ORIENTATION_PROMPT_MESSAGE,
} from '../../utils/orientationPrompt';

describe('OrientationPrompt', () => {
  it('モバイル+縦画面で表示', () => {
    expect(
      shouldShowOrientationPrompt({ isMobile: true, isPortrait: true })
    ).toBe(true);
  });

  it('モバイル+横画面で非表示', () => {
    expect(
      shouldShowOrientationPrompt({ isMobile: true, isPortrait: false })
    ).toBe(false);
  });

  it('デスクトップでは非表示', () => {
    expect(
      shouldShowOrientationPrompt({ isMobile: false, isPortrait: true })
    ).toBe(false);
    expect(
      shouldShowOrientationPrompt({ isMobile: false, isPortrait: false })
    ).toBe(false);
  });

  it('プロンプトメッセージが定義されている', () => {
    expect(ORIENTATION_PROMPT_MESSAGE).toBeTruthy();
    expect(typeof ORIENTATION_PROMPT_MESSAGE).toBe('string');
  });
});
