import Phaser from 'phaser';
import { CHARACTERS } from '../data/characters.js';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  preload() {
    const { width, height } = this.scale;

    this.add.text(width / 2, height / 2 - 40, 'LOADING VIBERS...', {
      fontFamily: 'monospace',
      fontSize: '24px',
      color: '#66e0c0'
    }).setOrigin(0.5);

    const barW = 400;
    const barH = 20;
    const barX = (width - barW) / 2;
    const barY = height / 2 + 20;
    this.add.rectangle(barX, barY, barW, barH, 0x1a2030).setOrigin(0, 0.5);
    const fillBar = this.add.rectangle(barX, barY, 0, barH, 0x66e0c0).setOrigin(0, 0.5);

    this.load.on('progress', (value) => {
      fillBar.width = barW * value;
    });

    CHARACTERS.forEach(char => {
      this.load.image(char.key, `./assets/characters/${char.key}.png`);
    });
  }

  create() {
    this.scene.start('MainScene');
  }
}
