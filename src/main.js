import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene.js';
import { MainScene } from './scenes/MainScene.js';
import { BattleScene } from './scenes/BattleScene.js';
import { UpgradeScene } from './scenes/UpgradeScene.js';
import { InventoryScene } from './scenes/InventoryScene.js';

const config = {
  type: Phaser.AUTO,
  parent: 'game-container',
  width: 1920,
  height: 1080,
  backgroundColor: '#0a0e1a',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  render: {
    antialias: true,
    roundPixels: false,
    pixelArt: false
  },
  scene: [BootScene, MainScene, BattleScene, UpgradeScene, InventoryScene]
};

new Phaser.Game(config);
