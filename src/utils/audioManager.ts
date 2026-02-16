import { loadSettings } from './settingsManager';

/** Phaser.Sound.BaseSoundManagerの最小インターフェース */
interface SoundManager {
  add(key: string): Sound;
}

/** Phaser.Sound.BaseSoundの最小インターフェース */
interface Sound {
  play(): void;
  stop(): void;
  destroy(): void;
  setVolume(volume: number): void;
  setLoop(loop: boolean): void;
}

/** 現在再生中のBGM */
let currentBgm: Sound | null = null;

/**
 * BGMを再生する
 * 既存のBGMがあれば停止してから新しいBGMをループ再生する
 */
export function playBgm(soundManager: SoundManager, key: string): void {
  // 既存BGM停止
  if (currentBgm) {
    currentBgm.stop();
    currentBgm.destroy();
    currentBgm = null;
  }

  const settings = loadSettings();
  const volume = settings.bgmVolume / 100;

  const sound = soundManager.add(key);
  sound.setLoop(true);
  sound.setVolume(volume);
  sound.play();

  currentBgm = sound;
}

/**
 * BGMを停止・破棄する
 */
export function stopBgm(): void {
  if (!currentBgm) return;

  currentBgm.stop();
  currentBgm.destroy();
  currentBgm = null;
}

/**
 * 再生中のBGMの音量をリアルタイムで変更する
 * @param volume 0〜100の整数
 */
export function setBgmVolume(volume: number): void {
  if (!currentBgm) return;

  currentBgm.setVolume(volume / 100);
}

/**
 * SEをワンショット再生する
 */
export function playSe(soundManager: SoundManager, key: string): void {
  const settings = loadSettings();
  const volume = settings.seVolume / 100;

  const sound = soundManager.add(key);
  sound.setVolume(volume);
  sound.play();
}

/**
 * テスト用: モジュール状態をリセットする
 */
export function _resetForTest(): void {
  currentBgm = null;
}
