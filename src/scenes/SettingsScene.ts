import { BaseScene } from './BaseScene';
import { SceneKey } from './sceneKeys';
import { GAME_WIDTH, GAME_HEIGHT } from './gameConfig';
import { Settings, EffectSpeed } from '../types/Settings';
import { loadSettings, saveSettings } from '../utils/settingsManager';
import {
  SETTINGS_LAYOUT,
  SETTINGS_COLORS,
  SETTINGS_LABELS,
} from './settingsConfig';
import { setBgmVolume } from '../utils/audioManager';
import { BackgroundImageKey } from '../constants/imageKeys';

/** スライダーUIの内部構造 */
interface SliderUI {
  barBg: Phaser.GameObjects.Rectangle;
  barFill: Phaser.GameObjects.Rectangle;
  handle: Phaser.GameObjects.Rectangle;
  valueText: Phaser.GameObjects.Text;
  value: number;
}

/**
 * 設定画面シーン
 *
 * BGM/SE音量スライダー、演出速度トグル、戻るボタンを表示する。
 */
export class SettingsScene extends BaseScene {
  private settings!: Settings;
  private bgmSlider!: SliderUI;
  private seSlider!: SliderUI;
  private slowBtnBg!: Phaser.GameObjects.Rectangle;
  private normalBtnBg!: Phaser.GameObjects.Rectangle;
  private fastBtnBg!: Phaser.GameObjects.Rectangle;
  private draggingSlider: SliderUI | null = null;

  constructor() {
    super(SceneKey.SETTINGS);
  }

  create(): void {
    if (this.textures.exists(BackgroundImageKey.SETTINGS)) {
      this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, BackgroundImageKey.SETTINGS).setOrigin(0.5);
    }
    this.settings = loadSettings();
    this.draggingSlider = null;

    this.createTitle();
    this.bgmSlider = this.createSlider(
      SETTINGS_LAYOUT.sliderStartY,
      SETTINGS_LABELS.bgmVolume,
      this.settings.bgmVolume
    );
    this.seSlider = this.createSlider(
      SETTINGS_LAYOUT.sliderStartY + SETTINGS_LAYOUT.sliderSpacing,
      SETTINGS_LABELS.seVolume,
      this.settings.seVolume
    );
    this.createEffectSpeedToggle();
    this.createBackButton();
    this.setupDragHandlers();
  }

  /** タイトル表示 */
  private createTitle(): void {
    this.add
      .text(GAME_WIDTH / 2, SETTINGS_LAYOUT.titleY, SETTINGS_LABELS.title, {
        fontSize: '40px',
        color: SETTINGS_COLORS.titleText,
        fontFamily: 'Arial, sans-serif',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
  }

  /** スライダーを生成 */
  private createSlider(y: number, label: string, initialValue: number): SliderUI {
    const { sliderLabelX, sliderBarX, sliderBarWidth, sliderBarHeight } =
      SETTINGS_LAYOUT;

    // ラベル
    this.add
      .text(sliderLabelX, y, label, {
        fontSize: '22px',
        color: SETTINGS_COLORS.labelText,
        fontFamily: 'Arial, sans-serif',
      })
      .setOrigin(0.5);

    // バー背景
    const barBg = this.add.rectangle(
      sliderBarX + sliderBarWidth / 2,
      y,
      sliderBarWidth,
      sliderBarHeight,
      SETTINGS_COLORS.sliderBarBg
    );

    // バー充填
    const fillWidth = (initialValue / 100) * sliderBarWidth;
    const barFill = this.add.rectangle(
      sliderBarX + fillWidth / 2,
      y,
      fillWidth,
      sliderBarHeight,
      SETTINGS_COLORS.sliderBarFill
    );

    // ハンドル
    const handleX = sliderBarX + fillWidth;
    const handle = this.add
      .rectangle(handleX, y, 16, 24, SETTINGS_COLORS.sliderHandle)
      .setInteractive({ draggable: true, useHandCursor: true });

    // 値テキスト
    const valueText = this.add
      .text(sliderBarX + sliderBarWidth + 40, y, `${initialValue}`, {
        fontSize: '18px',
        color: SETTINGS_COLORS.buttonText,
        fontFamily: 'Arial, sans-serif',
      })
      .setOrigin(0.5);

    return { barBg, barFill, handle, valueText, value: initialValue };
  }

  /** 演出速度トグルを生成 */
  private createEffectSpeedToggle(): void {
    const y = SETTINGS_LAYOUT.effectSpeedY;

    // ラベル
    this.add
      .text(SETTINGS_LAYOUT.sliderLabelX, y, SETTINGS_LABELS.effectSpeed, {
        fontSize: '22px',
        color: SETTINGS_COLORS.labelText,
        fontFamily: 'Arial, sans-serif',
      })
      .setOrigin(0.5);

    const btnWidth = 90;
    const btnHeight = 36;
    const btnSpacing = 110;
    const baseX = SETTINGS_LAYOUT.sliderBarX + 45;

    const makeBtn = (x: number, label: string, active: boolean): Phaser.GameObjects.Rectangle => {
      const bg = this.add
        .rectangle(
          x,
          y,
          btnWidth,
          btnHeight,
          active ? SETTINGS_COLORS.effectSpeedButtonActive : SETTINGS_COLORS.effectSpeedButton
        )
        .setInteractive({ useHandCursor: true });
      this.add
        .text(x, y, label, {
          fontSize: '18px',
          color: SETTINGS_COLORS.buttonText,
          fontFamily: 'Arial, sans-serif',
        })
        .setOrigin(0.5);
      return bg;
    };

    // 遅いボタン
    this.slowBtnBg = makeBtn(baseX, SETTINGS_LABELS.effectSpeedSlow, this.settings.effectSpeed === EffectSpeed.SLOW);
    this.slowBtnBg.on('pointerdown', () => {
      this.settings.effectSpeed = EffectSpeed.SLOW;
      this.updateEffectSpeedButtons();
      this.saveCurrentSettings();
    });

    // 通常ボタン
    this.normalBtnBg = makeBtn(baseX + btnSpacing, SETTINGS_LABELS.effectSpeedNormal, this.settings.effectSpeed === EffectSpeed.NORMAL);
    this.normalBtnBg.on('pointerdown', () => {
      this.settings.effectSpeed = EffectSpeed.NORMAL;
      this.updateEffectSpeedButtons();
      this.saveCurrentSettings();
    });

    // 高速ボタン
    this.fastBtnBg = makeBtn(baseX + btnSpacing * 2, SETTINGS_LABELS.effectSpeedFast, this.settings.effectSpeed === EffectSpeed.FAST);
    this.fastBtnBg.on('pointerdown', () => {
      this.settings.effectSpeed = EffectSpeed.FAST;
      this.updateEffectSpeedButtons();
      this.saveCurrentSettings();
    });
  }

  /** 戻るボタンを生成 */
  private createBackButton(): void {
    const text = this.add
      .text(GAME_WIDTH / 2, SETTINGS_LAYOUT.backButtonY, SETTINGS_LABELS.back, {
        fontSize: '28px',
        color: '#cccccc',
        fontFamily: 'Arial, sans-serif',
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    text.on('pointerover', () => {
      text.setColor('#ffffff');
      text.setScale(1.1);
    });

    text.on('pointerout', () => {
      text.setColor('#cccccc');
      text.setScale(1.0);
    });

    text.on('pointerdown', () => {
      this.saveCurrentSettings();
      this.transitionTo(SceneKey.TITLE);
    });
  }

  /** ドラッグハンドラを設定 */
  private setupDragHandlers(): void {
    this.input.on(
      'drag',
      (_pointer: Phaser.Input.Pointer, gameObject: Phaser.GameObjects.GameObject, dragX: number) => {
        const slider = this.getSliderByHandle(gameObject);
        if (!slider) return;

        const { sliderBarX, sliderBarWidth } = SETTINGS_LAYOUT;
        const clampedX = Math.max(sliderBarX, Math.min(dragX, sliderBarX + sliderBarWidth));

        // ハンドル位置を更新
        (gameObject as Phaser.GameObjects.Rectangle).x = clampedX;

        // 値を計算（0〜100）
        const value = Math.round(((clampedX - sliderBarX) / sliderBarWidth) * 100);
        this.updateSliderValue(slider, value);
      }
    );

    this.input.on(
      'dragend',
      (_pointer: Phaser.Input.Pointer, gameObject: Phaser.GameObjects.GameObject) => {
        const slider = this.getSliderByHandle(gameObject);
        if (slider) {
          this.saveCurrentSettings();
        }
      }
    );
  }

  /** ハンドルからスライダーを特定 */
  private getSliderByHandle(
    gameObject: Phaser.GameObjects.GameObject
  ): SliderUI | null {
    if (gameObject === this.bgmSlider?.handle) return this.bgmSlider;
    if (gameObject === this.seSlider?.handle) return this.seSlider;
    return null;
  }

  /** スライダー値を更新 */
  private updateSliderValue(slider: SliderUI, value: number): void {
    slider.value = value;
    const { sliderBarX, sliderBarWidth } = SETTINGS_LAYOUT;
    const fillWidth = (value / 100) * sliderBarWidth;
    slider.barFill.x = sliderBarX + fillWidth / 2;
    slider.barFill.setScale(fillWidth / sliderBarWidth, 1);
    slider.valueText.setText(`${value}`);

    if (slider === this.bgmSlider) {
      this.settings.bgmVolume = value;
      setBgmVolume(value);
    } else if (slider === this.seSlider) {
      this.settings.seVolume = value;
    }
  }

  /** 演出速度ボタンの表示を更新 */
  private updateEffectSpeedButtons(): void {
    const speed = this.settings.effectSpeed;
    this.slowBtnBg.setFillStyle(
      speed === EffectSpeed.SLOW
        ? SETTINGS_COLORS.effectSpeedButtonActive
        : SETTINGS_COLORS.effectSpeedButton
    );
    this.normalBtnBg.setFillStyle(
      speed === EffectSpeed.NORMAL
        ? SETTINGS_COLORS.effectSpeedButtonActive
        : SETTINGS_COLORS.effectSpeedButton
    );
    this.fastBtnBg.setFillStyle(
      speed === EffectSpeed.FAST
        ? SETTINGS_COLORS.effectSpeedButtonActive
        : SETTINGS_COLORS.effectSpeedButton
    );
  }

  /** 現在の設定を保存 */
  private saveCurrentSettings(): void {
    saveSettings(this.settings);
  }
}
