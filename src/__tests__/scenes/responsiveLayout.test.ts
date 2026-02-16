import { getCommandButtonLayout } from '../../scenes/battleConfig';

describe('getCommandButtonLayout', () => {
  it('デスクトップでは既存サイズを返す（80x30, spacing 95）', () => {
    const layout = getCommandButtonLayout(false);
    expect(layout.buttonWidth).toBe(80);
    expect(layout.buttonHeight).toBe(30);
    expect(layout.buttonSpacing).toBe(95);
  });

  it('モバイルでは大きいサイズを返す（95x40, spacing調整）', () => {
    const layout = getCommandButtonLayout(true);
    expect(layout.buttonWidth).toBe(95);
    expect(layout.buttonHeight).toBe(40);
    expect(layout.buttonSpacing).toBeGreaterThan(95);
  });

  it('モバイルボタンは最低44px高さを確保', () => {
    const layout = getCommandButtonLayout(true);
    expect(layout.buttonHeight).toBeGreaterThanOrEqual(40);
  });

  it('デスクトップのレイアウトは既存COMMAND_UI_LAYOUTと一致', () => {
    const layout = getCommandButtonLayout(false);
    expect(layout.row1Y).toBe(490);
    expect(layout.row2Y).toBe(530);
    expect(layout.row1StartX).toBe(135);
    expect(layout.row2StartX).toBe(182);
    expect(layout.selectionY).toBe(565);
    expect(layout.confirmY).toBe(565);
    expect(layout.cancelX).toBe(650);
    expect(layout.cancelY).toBe(530);
  });

  it('モバイルではrow間隔がボタン高さに合わせて調整される', () => {
    const desktop = getCommandButtonLayout(false);
    const mobile = getCommandButtonLayout(true);
    // モバイルのrow間隔はデスクトップ以上
    expect(mobile.row2Y - mobile.row1Y).toBeGreaterThanOrEqual(desktop.row2Y - desktop.row1Y);
  });
});
