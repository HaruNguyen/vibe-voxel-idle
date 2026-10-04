import Phaser from 'phaser';
import { ELEMENTS, getCharacterById } from '../data/characters.js';
import { SaveSystem } from '../systems/SaveSystem.js';
import { UpgradeSystem, UPGRADE_TYPES } from '../systems/UpgradeSystem.js';

export class UpgradeScene extends Phaser.Scene {
  constructor() {
    super('UpgradeScene');
  }

  init(data) {
    this.state = data.state || SaveSystem.load();
    this.selectedCharId = data.charId || this.state.team[0];
  }

  create() {
    const { width, height } = this.scale;

    this.createBackground(width, height);
    this.createHeader(width);
    this.createCharSelector(width, height);
    this.createUpgradePanel(width, height);
    this.createBackButton(width, height);
  }

  createBackground(width, height) {
    const g = this.add.graphics();
    g.fillGradientStyle(0x080a14, 0x080a14, 0x1a1a3a, 0x1a1a3a, 1);
    g.fillRect(0, 0, width, height);

    const glow = this.add.graphics();
    for (let i = 8; i > 0; i--) {
      glow.fillStyle(0x66e0c0, 0.006 * i);
      glow.fillCircle(width / 2, height / 2, 400 + i * 100);
    }

    const grid = this.add.graphics();
    grid.lineStyle(1, 0x66e0c0, 0.05);
    for (let x = 0; x < width; x += 80) grid.lineBetween(x, 0, x, height);
    for (let y = 0; y < height; y += 80) grid.lineBetween(0, y, width, y);
  }

  createHeader(width) {
    this.add.text(width / 2, 60, 'UPGRADE', {
      fontFamily: 'Orbitron, monospace',
      fontSize: '64px',
      color: '#66e0c0', fontStyle: 'bold',
      stroke: '#000000', strokeThickness: 8
    }).setOrigin(0.5).setShadow(0, 0, '#66e0c0', 25, true, true);

    this.goldText = this.add.text(width - 50, 60, `◆ ${this.state.gold}`, {
      fontFamily: 'JetBrains Mono, monospace',
      fontSize: '44px', color: '#ffd966',
      fontStyle: 'bold', stroke: '#000000', strokeThickness: 5
    }).setOrigin(1, 0.5);
  }

  createCharSelector(width, height) {
    const y = 200;
    const cardW = 120;
    const cardH = 120;
    const spacing = 16;
    const chars = this.state.roster;
    const totalW = chars.length * (cardW + spacing) - spacing;
    const startX = Math.max(40, (width - totalW) / 2);

    chars.forEach((entry, i) => {
      const char = getCharacterById(entry.id);
      if (!char) return;

      const x = startX + i * (cardW + spacing) + cardW / 2;
      const isSelected = entry.id === this.selectedCharId;
      const element = ELEMENTS[char.element];

      this.add.rectangle(x, y, cardW + 6, cardH + 6,
        element.glow, isSelected ? 0.3 : 0);

      const bg = this.add.rectangle(x, y, cardW, cardH,
        isSelected ? element.color : 0x1a2030, isSelected ? 0.4 : 1)
        .setStrokeStyle(isSelected ? 4 : 2, isSelected ? element.glow : 0x333333)
        .setInteractive({ useHandCursor: true });

      this.add.image(x, y, char.key).setDisplaySize(cardW - 20, cardH - 20);

      bg.on('pointerdown', () => {
        this.selectedCharId = entry.id;
        this.scene.restart({ state: this.state, charId: entry.id });
      });
    });
  }

  createUpgradePanel(width, height) {
    const char = getCharacterById(this.selectedCharId);
    const entry = this.state.roster.find(r => r.id === this.selectedCharId);
    if (!char || !entry) return;

    const element = ELEMENTS[char.element];
    const panelY = 400;

    const glow = this.add.graphics();
    for (let i = 5; i > 0; i--) {
      glow.fillStyle(element.glow, 0.05 * i);
      glow.fillCircle(width / 2, panelY, 100 + i * 30);
    }

    const charScale = char.spriteScale || 1.0;
    this.add.image(width / 2, panelY, char.key).setDisplaySize(240 * charScale, 240 * charScale);

    this.add.text(width / 2, panelY + 170, char.name, {
      fontFamily: 'Orbitron, monospace',
      fontSize: '40px',
      color: '#ffffff', fontStyle: 'bold',
      stroke: '#000000', strokeThickness: 5
    }).setOrigin(0.5);

    this.add.text(width / 2, panelY + 215, `${element.name} · ${char.role}`, {
      fontFamily: 'Rajdhani, monospace',
      fontSize: '24px',
      color: '#' + element.glow.toString(16).padStart(6, '0'),
      fontStyle: '600', letterSpacing: 3
    }).setOrigin(0.5);

    this.add.text(width / 2, panelY + 250, `Lv.${entry.level}  ★${entry.stars}`, {
      fontFamily: 'JetBrains Mono, monospace',
      fontSize: '26px', color: '#ffd966',
      fontStyle: 'bold', stroke: '#000000', strokeThickness: 3
    }).setOrigin(0.5);

    const startY = panelY + 330;
    const rowH = 100;
    const types = ['HP', 'ATK', 'DEF', 'SPD'];

    types.forEach((type, i) => {
      this.createUpgradeRow(width, startY + i * rowH, type, char, entry);
    });
  }

  createUpgradeRow(width, y, type, char, entry) {
    const config = UPGRADE_TYPES[type];
    const currentLevel = entry.upgrades ? (entry.upgrades[type] || 0) : 0;
    const cost = UpgradeSystem.getCost(type, currentLevel);
    const canAfford = this.state.gold >= cost;

    const rowW = 1000;
    const rowX = width / 2 - rowW / 2;

    this.add.rectangle(width / 2, y, rowW, 90, 0x0a0e1a)
      .setStrokeStyle(2, config.color, canAfford ? 0.6 : 0.2);

    this.add.text(rowX + 30, y, config.icon, {
      fontSize: '38px'
    }).setOrigin(0, 0.5);

    this.add.text(rowX + 90, y, config.name, {
      fontFamily: 'Orbitron, monospace',
      fontSize: '26px',
      color: '#' + config.color.toString(16).padStart(6, '0'),
      fontStyle: 'bold',
      stroke: '#000000', strokeThickness: 3
    }).setOrigin(0, 0.5);

    const baseStat = char[type.toLowerCase()];
    const currentMult = UpgradeSystem.getStatMultiplier(type, currentLevel);
    const currentValue = Math.floor(baseStat * currentMult);
    const nextMult = UpgradeSystem.getStatMultiplier(type, currentLevel + 1);
    const nextValue = Math.floor(baseStat * nextMult);

    this.add.text(rowX + 230, y, `Lv.${currentLevel}`, {
      fontFamily: 'JetBrains Mono, monospace',
      fontSize: '20px', color: '#8899aa'
    }).setOrigin(0, 0.5);

    this.add.text(rowX + 350, y, `${currentValue}`, {
      fontFamily: 'JetBrains Mono, monospace',
      fontSize: '30px', color: '#ffffff',
      fontStyle: 'bold', stroke: '#000000', strokeThickness: 3
    }).setOrigin(0, 0.5);

    this.add.text(rowX + 470, y, `→ ${nextValue}`, {
      fontFamily: 'JetBrains Mono, monospace',
      fontSize: '24px',
      color: '#' + config.color.toString(16).padStart(6, '0'),
      fontStyle: 'bold'
    }).setOrigin(0, 0.5);

    const btnX = rowX + rowW - 130;
    const btn = this.add.rectangle(btnX, y, 220, 66,
      canAfford ? 0x1a2030 : 0x0a0e1a)
      .setStrokeStyle(canAfford ? 3 : 2, canAfford ? config.color : 0x333333)
      .setInteractive({ useHandCursor: canAfford });

    this.add.text(btnX, y, `◆ ${cost}`, {
      fontFamily: 'JetBrains Mono, monospace',
      fontSize: '24px',
      color: canAfford ? '#ffd966' : '#555555',
      fontStyle: 'bold', stroke: '#000000', strokeThickness: 3
    }).setOrigin(0.5);

    if (canAfford) {
      btn.on('pointerover', () => btn.setFillStyle(config.color, 0.25));
      btn.on('pointerout', () => btn.setFillStyle(0x1a2030));
      btn.on('pointerdown', () => {
        const result = UpgradeSystem.upgrade(this.state, this.selectedCharId, type);
        if (result.success) {
          SaveSystem.save(this.state);
          this.showToast(`+1 ${type} → Lv.${result.newLevel}`, config.color);
          this.time.delayedCall(300, () => {
            this.scene.restart({ state: this.state, charId: this.selectedCharId });
          });
        }
      });
    }
  }

  createBackButton(width, height) {
    const btn = this.add.rectangle(160, height - 80, 220, 70, 0x1a2030)
      .setStrokeStyle(3, 0x8899aa)
      .setInteractive({ useHandCursor: true });

    this.add.text(160, height - 80, '← BACK', {
      fontFamily: 'Rajdhani, monospace',
      fontSize: '24px', color: '#8899aa',
      fontStyle: '600', letterSpacing: 3
    }).setOrigin(0.5);

    btn.on('pointerover', () => btn.setFillStyle(0x8899aa, 0.2));
    btn.on('pointerout', () => btn.setFillStyle(0x1a2030));
    btn.on('pointerdown', () => {
      SaveSystem.save(this.state);
      this.scene.start('MainScene');
    });
  }

  showToast(message, color) {
    const { width } = this.scale;
    const toast = this.add.text(width / 2, 950, message, {
      fontFamily: 'Rajdhani, monospace',
      fontSize: '36px',
      color: '#' + color.toString(16).padStart(6, '0'),
      backgroundColor: '#121a2e',
      padding: { x: 40, y: 24 },
      fontStyle: '600',
      stroke: '#000000', strokeThickness: 4
    }).setOrigin(0.5).setDepth(1000);

    toast.setAlpha(0);
    this.tweens.add({
      targets: toast, alpha: 1, duration: 200,
      yoyo: true, hold: 800,
      onComplete: () => toast.destroy()
    });
  }
}
