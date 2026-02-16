import { detectDevice, isPortraitOrientation, DeviceInfo } from '../../utils/deviceDetector';

// window/navigator のモックヘルパー
function mockEnvironment(opts: {
  maxTouchPoints?: number;
  innerWidth?: number;
  innerHeight?: number;
}) {
  Object.defineProperty(navigator, 'maxTouchPoints', {
    value: opts.maxTouchPoints ?? 0,
    configurable: true,
  });
  Object.defineProperty(window, 'innerWidth', {
    value: opts.innerWidth ?? 1024,
    configurable: true,
  });
  Object.defineProperty(window, 'innerHeight', {
    value: opts.innerHeight ?? 768,
    configurable: true,
  });
}

describe('deviceDetector', () => {
  describe('detectDevice', () => {
    it('タッチ対応+小画面でモバイル判定', () => {
      mockEnvironment({ maxTouchPoints: 2, innerWidth: 375, innerHeight: 667 });
      const info: DeviceInfo = detectDevice();
      expect(info.isMobile).toBe(true);
      expect(info.hasTouchScreen).toBe(true);
      expect(info.screenWidth).toBe(375);
      expect(info.screenHeight).toBe(667);
    });

    it('タッチ非対応+大画面でデスクトップ判定', () => {
      mockEnvironment({ maxTouchPoints: 0, innerWidth: 1920, innerHeight: 1080 });
      const info: DeviceInfo = detectDevice();
      expect(info.isMobile).toBe(false);
      expect(info.hasTouchScreen).toBe(false);
      expect(info.screenWidth).toBe(1920);
      expect(info.screenHeight).toBe(1080);
    });

    it('画面の向きを正しく判定', () => {
      mockEnvironment({ maxTouchPoints: 2, innerWidth: 667, innerHeight: 375 });
      const info: DeviceInfo = detectDevice();
      expect(info.isPortrait).toBe(false);

      mockEnvironment({ maxTouchPoints: 2, innerWidth: 375, innerHeight: 667 });
      const info2: DeviceInfo = detectDevice();
      expect(info2.isPortrait).toBe(true);
    });

    it('画面サイズを返す', () => {
      mockEnvironment({ maxTouchPoints: 0, innerWidth: 1440, innerHeight: 900 });
      const info: DeviceInfo = detectDevice();
      expect(info.screenWidth).toBe(1440);
      expect(info.screenHeight).toBe(900);
    });
  });

  describe('isPortraitOrientation', () => {
    it('height > widthでtrue', () => {
      mockEnvironment({ innerWidth: 375, innerHeight: 667 });
      expect(isPortraitOrientation()).toBe(true);
    });

    it('width >= heightでfalse', () => {
      mockEnvironment({ innerWidth: 1024, innerHeight: 768 });
      expect(isPortraitOrientation()).toBe(false);

      mockEnvironment({ innerWidth: 800, innerHeight: 800 });
      expect(isPortraitOrientation()).toBe(false);
    });
  });
});
