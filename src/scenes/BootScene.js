import Phaser from 'phaser';
import { CHARACTERS } from '../data/characters.js';

// Import tất cả ảnh — Vite sẽ bundle chúng vào build
import char01 from '../assets/characters/char-01.png';
import char02 from '../assets/characters/char-02.png';
import char03 from '../assets/characters/char-03.png';
import char04 from '../assets/characters/char-04.png';
import char05 from '../assets/characters/char-05.png';
import char06 from '../assets/characters/char-06.png';
import char07 from '../assets/characters/char-07.png';
import char08 from '../assets/characters/char-08.png';
import char09 from '../assets/characters/char-09.png';
import char10 from '../assets/characters/char-10.png';
import char11 from '../assets/characters/char-11.png';
import char12 from '../assets/characters/char-12.png';

const IMAGE_MAP = {
  'char-01': char01,
  'char-02': char02,
  'char-03': char03,
  'char-04': char04,
  'char-05': char05,
  'char-06': char06,
  'char-07': char07,
  'char-08': char08,
  'char-09': char09,
  'char-10': char10,
  'char-11': char11,
  'char-12': char12
};

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
      this.load.image(char.key, IMAGE_MAP[char.key]);
    });
  }

  create() {
    this.scene.start('MainScene');
  }
}
