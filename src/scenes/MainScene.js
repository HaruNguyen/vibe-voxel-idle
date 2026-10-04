import Phaser from 'phaser';
import { CHARACTERS, ELEMENTS, getCharacterById } from '../data/characters.js';
import { SaveSystem } from '../systems/SaveSystem.js';
import { IdleSystem } from '../systems/IdleSystem.js';

export class MainScene extends Phaser.Scene {
  constructor() {
    super('MainScene');
  }

  create() {
    const { width, height } = this.scale;
    this.state = SaveSystem.load();

    this.createBackground(width, height);
    this.createTopBar(width);
    this.createTeamDisplay(width, height);
    this.createButtons(width, height);
    this.checkOfflineReward(width, height);

    this.events.on('shutdown', () => SaveSystem.save(this.state));
  }

  createBackground(width, height) {
    // Gradient background
    const g = this.add.graphics();
    g.fillGradientStyle(0x080a14, 0x080a14, 0x1a1a3a, 0x1a1a3a, 1);
    g.fillRect(0, 0, width, height);

    // Stars
    for (let i = 0; i < 60; i++) {
      const star = this.add.circle(
        Math.random() * width,
        Math.random() * height * 0.5,
        1.5 + Math.random() * 2,
        0xffffff,
        0.2 + Math.random() * 0.5
      );
      this.tweens.add({
        targets: star,
        alpha: 0.1,
        duration: 2000 + Math.random() * 2000,
        yoyo: true,
        repeat: -1
      });
    }

    // Radial glow center
    const glow = this.add.graphics();
    for (let i = 10; i > 0; i--) {
      glow.fillStyle(0x66e0c0, 0.008 * i);
      glow.fillCircle(width / 2, height / 2 + 100, 300 + i * 80);
    }

    // Neon grid
    const grid = this.add.graphics();
    grid.lineStyle(1, 0x66e0c0, 0.05);
    for (let x = 0; x < width; x += 80) grid.lineBetween(x, 0, x, height);
    for (let y = 0; y < height; y += 80) grid.lineBetween(0, y, width, y);

    // Title
    this.add.text(width / 2, 80, 'VIBE VOXEL IDLE', {
      fontFamily: 'monospace',
      fontSize: '72px',
      color: '#66e0c0',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 8
    }).setOrigin(0.5).setShadow(0, 0, '#66e0c0', 30, true, true);

    this.add.text(width / 2, 140, 'AFK AUTO-BATTLER', {
      fontFamily: 'monospace',
      fontSize: '22px',
      color: '#8899aa',
      letterSpacing: 8
    }).setOrigin(0.5);
  }

  createTopBar(width) {
    const barY = 220;
    const padding = 50;

    this.goldText = this.add.text(padding, barY, `◆ ${this.state.gold}`, {
      fontFamily: 'monospace',
      fontSize: '42px',
      color: '#ffd966',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 5
    });

    this.stageText = this.add.text(width - padding, barY, `STAGE ${this.state.stage}`, {
      fontFamily: 'monospace',
      fontSize: '42px',
      color: '#66e0c0',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 5
    }).setOrigin(1, 0);

    this.gemsText = this.add.text(width / 2, barY, `✦ ${this.state.gems}`, {
      fontFamily: 'monospace',
      fontSize: '42px',
      color: '#b090ff',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 5
    }).setOrigin(0.5, 0);
  }

  createTeamDisplay(width, height) {
    const teamY = height / 2 - 20;
    const cardW = 280;
    const cardH = 360;
    const spacing = 60;
    const team = this.state.team;
    const totalW = team.length * cardW + (team.length - 1) * spacing;
    const startX = (width - totalW) / 2;

    this.add.text(width / 2, teamY - 240, 'YOUR TEAM', {
      fontFamily: 'monospace',
      fontSize: '26px',
      color: '#8899aa',
      letterSpacing: 6,
      fontStyle: 'bold'
    }).setOrigin(0.5);

    team.forEach((charId, i) => {
      const char = getCharacterById(charId);
      const rosterEntry = this.state.roster.find(r => r.id === charId) || { level: 1, stars: 1 };
      const x = startX + i * (cardW + spacing) + cardW / 2;
      const y = teamY;

      this.createCharacterCard(x, y, cardW, cardH, char, rosterEntry);
    });
  }

  createCharacterCard(x, y, w, h, char, rosterEntry) {
    const element = ELEMENTS[char.element];

    // Card background - glow effect
    const glowBg = this.add.rectangle(x, y, w + 8, h + 8, element.glow, 0.15);

    // Card border
    const card = this.add.rectangle(x, y, w, h, 0x0a0e1a, 0.9)
      .setStrokeStyle(3, element.glow, 1);

    // Character sprite - BIG and centered
    const charScale = char.spriteScale || 1.0;
    const img = this.add.image(x, y - 40, char.key);
    img.setDisplaySize(240 * charScale, 240 * charScale);

    // Element icon top-right
    this.add.text(x + w / 2 - 30, y - h / 2 + 30, this.getElementIcon(char.element), {
      fontFamily: 'monospace',
      fontSize: '32px',
      color: '#' + element.glow.toString(16).padStart(6, '0'),
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5);

    // Name
    this.add.text(x, y + h / 2 - 80, char.name, {
      fontFamily: 'monospace',
      fontSize: '28px',
      color: '#ffffff',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5);

    // Element + Role
    this.add.text(x, y + h / 2 - 45, `${element.name.toUpperCase()} · ${char.role}`, {
      fontFamily: 'monospace',
      fontSize: '16px',
      color: '#' + element.glow.toString(16).padStart(6, '0'),
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // Level + Stars
    this.add.text(x, y + h / 2 - 15, `Lv.${rosterEntry.level}  ★${rosterEntry.stars}`, {
      fontFamily: 'monospace',
      fontSize: '18px',
      color: '#ffd966',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // Hover effect
    card.setInteractive({ useHandCursor: true });
    card.on('pointerover', () => {
      this.tweens.add({ targets: [card, glowBg], scale: 1.05, duration: 150 });
    });
    card.on('pointerout', () => {
      this.tweens.add({ targets: [card, glowBg], scale: 1, duration: 150 });
    });
  }

  getElementIcon(element) {
    const icons = {
      EARTH: '◆', ICE: '❄', METAL: '⚙', SHADOW: '☾',
      ELECTRIC: '⚡', NATURE: '❀', FIRE: '✹'
    };
    return icons[element] || '◆';
  }

  createButtons(width, height) {
    const btnY = height - 140;
    const btnW = 320;
    const btnH = 90;
    const spacing = 40;
    const totalW = 3 * btnW + 2 * spacing;
    const startX = (width - totalW) / 2;

    this.createButton(startX + btnW / 2, btnY, btnW, btnH, 'BATTLE', 0x66e0c0, () => {
      SaveSystem.save(this.state);
      this.scene.start('BattleScene', { state: this.state });
    });

    this.createButton(startX + btnW + spacing + btnW / 2, btnY, btnW, btnH, 'UPGRADE', 0xffd966, () => {
      SaveSystem.save(this.state);
      this.scene.start('UpgradeScene', { state: this.state });
    });

    this.createButton(startX + 2 * (btnW + spacing) + btnW / 2, btnY, btnW, btnH, 'GACHA', 0xb090ff, () => {
      this.openGacha();
    });
  }

  createButton(x, y, w, h, label, color, onClick) {
    const btn = this.add.rectangle(x, y, w, h, 0x1a2030)
      .setStrokeStyle(3, color, 1)
      .setInteractive({ useHandCursor: true });

    const txt = this.add.text(x, y, label, {
      fontFamily: 'monospace',
      fontSize: '32px',
      color: '#' + color.toString(16).padStart(6, '0'),
      fontStyle: 'bold',
      letterSpacing: 3
    }).setOrigin(0.5);

    btn.on('pointerover', () => {
      btn.setFillStyle(color, 0.2);
      txt.setScale(1.08);
    });
    btn.on('pointerout', () => {
      btn.setFillStyle(0x1a2030, 1);
      txt.setScale(1);
    });
    btn.on('pointerdown', onClick);

    return { btn, txt };
  }

  openGacha() {
    if (this.state.gold < 100) {
      this.showToast('NOT ENOUGH GOLD (100 needed)');
      return;
    }
    this.state.gold -= 100;
    this.goldText.setText(`◆ ${this.state.gold}`);

    const randomChar = CHARACTERS[Math.floor(Math.random() * CHARACTERS.length)];
    this.showToast(`YOU GOT: ${randomChar.name}!`);

    if (!this.state.roster.find(r => r.id === randomChar.id)) {
      this.state.roster.push({ id: randomChar.id, level: 1, stars: 1 });
    }
    SaveSystem.save(this.state);
  }

  showToast(message) {
    const { width, height } = this.scale;
    const toast = this.add.text(width / 2, height / 2, message, {
      fontFamily: 'monospace',
      fontSize: '40px',
      color: '#ffffff',
      backgroundColor: '#121a2e',
      padding: { x: 40, y: 24 },
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5).setDepth(1000);

    toast.setAlpha(0);
    this.tweens.add({
      targets: toast,
      alpha: 1,
      duration: 250,
      yoyo: true,
      hold: 1200,
      onComplete: () => toast.destroy()
    });
  }

  checkOfflineReward(width, height) {
    const reward = IdleSystem.calculateOfflineReward(this.state);
    if (reward.gold > 0 && reward.seconds > 30) {
      this.state.gold += reward.gold;
      this.goldText.setText(`◆ ${this.state.gold}`);
      SaveSystem.save(this.state);

      const mins = Math.floor(reward.seconds / 60);
      const secs = reward.seconds % 60;
      const timeStr = mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;

      this.showOfflinePopup(width, height, reward.gold, timeStr);
    }
  }

  showOfflinePopup(width, height, gold, timeStr) {
    const overlay = this.add.rectangle(0, 0, width, height, 0x000000, 0.8)
      .setOrigin(0).setDepth(900);

    this.add.rectangle(width / 2, height / 2, 720, 480, 0x121a2e)
      .setStrokeStyle(4, 0x66e0c0).setDepth(901);

    this.add.text(width / 2, height / 2 - 150, 'WELCOME BACK!', {
      fontFamily: 'monospace', fontSize: '48px', color: '#66e0c0', fontStyle: 'bold',
      stroke: '#000000', strokeThickness: 5
    }).setOrigin(0.5).setDepth(902);

    this.add.text(width / 2, height / 2 - 70, `Away for ${timeStr}`, {
      fontFamily: 'monospace', fontSize: '24px', color: '#8899aa'
    }).setOrigin(0.5).setDepth(902);

    this.add.text(width / 2, height / 2 + 20, `+${gold} GOLD`, {
      fontFamily: 'monospace', fontSize: '56px', color: '#ffd966', fontStyle: 'bold',
      stroke: '#000000', strokeThickness: 5
    }).setOrigin(0.5).setDepth(902);

    const btn = this.add.rectangle(width / 2, height / 2 + 150, 280, 70, 0x1a2030)
      .setStrokeStyle(3, 0x66e0c0)
      .setInteractive({ useHandCursor: true }).setDepth(902);

    this.add.text(width / 2, height / 2 + 150, 'CLAIM', {
      fontFamily: 'monospace', fontSize: '28px', color: '#66e0c0', fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(903);

    btn.on('pointerdown', () => {
      overlay.destroy();
      this.scene.restart();
    });
  }
}
