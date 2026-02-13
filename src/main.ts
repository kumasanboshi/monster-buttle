import Phaser from 'phaser';
import { DEFAULT_GAME_CONFIG, GAME_WIDTH, GAME_HEIGHT } from './scenes/gameConfig';
import { BootScene } from './scenes/BootScene';
import { TitleScene } from './scenes/TitleScene';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: DEFAULT_GAME_CONFIG.width,
  height: DEFAULT_GAME_CONFIG.height,
  backgroundColor: DEFAULT_GAME_CONFIG.backgroundColor,
  parent: 'game-container',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
  },
  scene: [BootScene, TitleScene],
  render: {
    pixelArt: DEFAULT_GAME_CONFIG.pixelArt,
  },
};

new Phaser.Game(config);
