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
    g.fillGradientStyle(0x0a0e1a, 0x0a0e1a, 0x1a1030, 0x1a1030, 1);
    g.fillRect(0, 0, width, height);

    const grid = this.add.graphics();
    grid.lineStyle(1, 0x66e0c0, 0.06);
    for (let x = 0; x < width; x += 50) grid.lineBetween(x, 0, x, height);
    for (let y = 0; y < height; y += 50) grid.lineBetween(0, y, width, y);
  }

  createHeader(width) {
    this.add.text(width / 2, 30, 'UPGRADE', {
      fontFamily: 'monospace', fontSize: '28px',
      color: '#66e0c0', fontStyle: 'bold',
      stroke: '#000000', strokeThickness: 3
    }).setOrigin(0.5);

    this.goldText = this.add.text(width - 20, 30, `◆ ${this.state.gold}`, {
      fontFamily: 'monospace', fontSize: '22px', color: '#ffd966'
    }).setOrigin(1, 0.5);
  }

  createCharSelector(width, height) {
    const y = 90;
    const cardW = 70;
    const cardH = 70;
    const spacing = 8;
    const chars = this.state.roster;
    const totalW = chars.length * (cardW + spacing) - spacing;
    const startX = Math.max(20, (width - totalW) / 2);

    chars.forEach((entry, i) => {
      const char = getCharacterById(entry.id);
      if (!char) return;

      const x = startX + i * (cardW + spacing) + cardW / 2;
      const isSelected = entry.id === this.selectedCharId;
      const element = ELEMENTS[char.element];

      const bg = this.add.rectangle(x, y, cardW, cardH,
        isSelected ? element.color : 0x1a2030, isSelected ? 0.4 : 1)
        .setStrokeStyle(2, isSelected ? element.glow : 0x333333)
        .setInteractive({ useHandCursor: true });

      const img = this.add.image(x, y, char.key).setDisplaySize(cardW - 10, cardH - 10);

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
    const panelY = 200;

    // Character preview
    this.add.image(width / 2, panelY + 40, char.key).setDisplaySize(140, 140);

    this.add.text(width / 2, panelY + 130, char.name, {
      fontFamily: 'monospace', fontSize: '22px',
      color: '#ffffff', fontStyle: 'bold'
    }).setOrigin(0.5);

    this.add.text(width / 2, panelY + 155, `${element.name} · ${char.role}`, {
      fontFamily: 'monospace', fontSize: '12px',
      color: '#' + element.glow.toString(16).padStart(6, '0')
    }).setOrigin(0.5);

    this.add.text(width / 2, panelY + 175, `Lv.${entry.level}  ★${entry.stars}`, {
      fontFamily: 'monospace', fontSize: '14px', color: '#ffd966'
    }).setOrigin(0.5);

    // Upgrade rows
    const startY = panelY + 210;
    const rowH = 62;
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

    const rowW = 500;
    const rowX = width / 2 - rowW / 2;

    // Row background
    this.add.rectangle(width / 2, y, rowW, 54, 0x121a2e)
      .setStrokeStyle(1, config.color, 0.4);

    // Icon + Name
    this.add.text(rowX + 15, y - 10, config.icon, {
      fontSize: '20px'
    }).setOrigin(0, 0.5);

    this.add.text(rowX + 50, y - 12, config.name, {
      fontFamily: 'monospace', fontSize: '15px',
      color: '#' + config.color.toString(16).padStart(6, '0'),
      fontStyle: 'bold'
    }).setOrigin(0, 0.5);

    // Current value
    const baseStat = char[type.toLowerCase()];
    const currentMult = UpgradeSystem.getStatMultiplier(type, currentLevel);
    const currentValue = Math.floor(baseStat * currentMult);
    const nextMult = UpgradeSystem.getStatMultiplier(type, currentLevel + 1);
    const nextValue = Math.floor(baseStat * nextMult);

    this.add.text(rowX + 130, y - 12, `Lv.${currentLevel}`, {
      fontFamily: 'monospace', fontSize: '13px', color: '#8899aa'
    }).setOrigin(0, 0.5);

    this.add.text(rowX + 200, y - 12, `${currentValue}`, {
      fontFamily: 'monospace', fontSize: '16px', color: '#ffffff', fontStyle: 'bold'
    }).setOrigin(0, 0.5);

    this.add.text(rowX + 260, y - 12, `→ ${nextValue}`, {
      fontFamily: 'monospace', fontSize: '14px',
      color: '#' + config.color.toString(16).padStart(6, '0')
    }).setOrigin(0, 0.5);

    // Upgrade button
    const btnX = rowX + rowW - 100;
    const btn = this.add.rectangle(btnX, y, 160, 42,
      canAfford ? 0x1a2030 : 0x0a0e1a)
      .setStrokeStyle(2, canAfford ? config.color : 0x333333)
      .setInteractive({ useHandCursor: canAfford });

    const costText = this.add.text(btnX, y, `◆ ${cost}`, {
      fontFamily: 'monospace', fontSize: '15px',
      color: canAfford ? '#ffd966' : '#555555',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    if (canAfford) {
      btn.on('pointerover', () => btn.setFillStyle(config.color, 0.2));
      btn.on('pointerout', () => btn.setFillStyle(0x1a2030));
      btn.on('pointerdown', () => {
        const result = UpgradeSystem.upgrade(this.state, this.selectedCharId, type);
        if (result.success) {
          SaveSystem.save(this.state);
          this.showToast(`+1 ${type} (Lv.${result.newLevel})`, config.color);
          this.time.delayedCall(300, () => {
            this.scene.restart({ state: this.state, charId: this.selectedCharId });
          });
        }
      });
    }
  }

  createBackButton(width, height) {
    const btn = this.add.rectangle(80, height - 40, 120, 45, 0x1a2030)
      .setStrokeStyle(2, 0x8899aa)
      .setInteractive({ useHandCursor: true });

    this.add.text(80, height - 40, '← BACK', {
      fontFamily: 'monospace', fontSize: '15px', color: '#8899aa'
    }).setOrigin(0.5);

    btn.on('pointerdown', () => {
      SaveSystem.save(this.state);
      this.scene.start('MainScene');
    });
  }

  showToast(message, color) {
    const { width } = this.scale;
    const toast = this.add.text(width / 2, 550, message, {
      fontFamily: 'monospace', fontSize: '20px',
      color: '#' + color.toString(16).padStart(6, '0'),
      backgroundColor: '#121a2e',
      padding: { x: 20, y: 12 },
      fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(1000);

    toast.setAlpha(0);
    this.tweens.add({
      targets: toast, alpha: 1, duration: 200,
      yoyo: true, hold: 800,
      onComplete: () => toast.destroy()
    });
  }
}
