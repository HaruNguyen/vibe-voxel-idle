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
    const g = this.add.graphics();
    g.fillGradientStyle(0x0a0e1a, 0x0a0e1a, 0x121a2e, 0x121a2e, 1);
    g.fillRect(0, 0, width, height);

    const grid = this.add.graphics();
    grid.lineStyle(1, 0x66e0c0, 0.08);
    const gridSize = 60;
    for (let x = 0; x < width; x += gridSize) grid.lineBetween(x, 0, x, height);
    for (let y = 0; y < height; y += gridSize) grid.lineBetween(0, y, width, y);

    this.add.text(width / 2, 40, 'VIBE VOXEL IDLE', {
      fontFamily: 'monospace',
      fontSize: '32px',
      color: '#66e0c0',
      fontStyle: 'bold'
    }).setOrigin(0.5).setShadow(0, 0, '#66e0c0', 12, true, true);

    this.add.text(width / 2, 70, 'AFK AUTO-BATTLER', {
      fontFamily: 'monospace',
      fontSize: '12px',
      color: '#8899aa'
    }).setOrigin(0.5);
  }

  createTopBar(width) {
    const barY = 100;
    const padding = 20;

    this.goldText = this.add.text(padding, barY, `◆ ${this.state.gold}`, {
      fontFamily: 'monospace',
      fontSize: '20px',
      color: '#ffd966'
    });

    this.stageText = this.add.text(width - padding, barY, `STAGE ${this.state.stage}`, {
      fontFamily: 'monospace',
      fontSize: '20px',
      color: '#66e0c0'
    }).setOrigin(1, 0);

    this.gemsText = this.add.text(width / 2, barY, `✦ ${this.state.gems}`, {
      fontFamily: 'monospace',
      fontSize: '20px',
      color: '#b090ff'
    }).setOrigin(0.5, 0);
  }

  createTeamDisplay(width, height) {
    const teamY = height / 2 - 30;
    const cardW = 140;
    const cardH = 180;
    const spacing = 30;
    const team = this.state.team;
    const totalW = team.length * cardW + (team.length - 1) * spacing;
    const startX = (width - totalW) / 2;

    this.add.text(width / 2, teamY - 120, 'YOUR TEAM', {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#8899aa'
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

    this.add.rectangle(x, y, w, h, 0x121a2e, 0.95)
      .setStrokeStyle(2, element.glow, 0.8);

    const img = this.add.image(x, y - 25, char.key);
    img.setDisplaySize(w - 20, w - 20);

    this.add.text(x, y + h / 2 - 55, char.name, {
      fontFamily: 'monospace',
      fontSize: '16px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    this.add.text(x, y + h / 2 - 35, `${element.name.toUpperCase()} · ${char.role}`, {
      fontFamily: 'monospace',
      fontSize: '10px',
      color: '#' + element.glow.toString(16).padStart(6, '0')
    }).setOrigin(0.5);

    this.add.text(x, y + h / 2 - 15, `Lv.${rosterEntry.level}  ★${rosterEntry.stars}`, {
      fontFamily: 'monospace',
      fontSize: '11px',
      color: '#ffd966'
    }).setOrigin(0.5);
  }

    createButtons(width, height) {
    const btnY = height - 80;
    const btnW = 150;
    const btnH = 55;
    const spacing = 20;
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
      .setStrokeStyle(2, color, 1)
      .setInteractive({ useHandCursor: true });

    const txt = this.add.text(x, y, label, {
      fontFamily: 'monospace',
      fontSize: '18px',
      color: '#' + color.toString(16).padStart(6, '0'),
      fontStyle: 'bold'
    }).setOrigin(0.5);

    btn.on('pointerover', () => {
      btn.setFillStyle(color, 0.15);
      txt.setScale(1.05);
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
      fontSize: '22px',
      color: '#ffffff',
      backgroundColor: '#121a2e',
      padding: { x: 20, y: 15 }
    }).setOrigin(0.5).setDepth(1000);

    toast.setAlpha(0);
    this.tweens.add({
      targets: toast,
      alpha: 1,
      duration: 200,
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
    const overlay = this.add.rectangle(0, 0, width, height, 0x000000, 0.7)
      .setOrigin(0).setDepth(900);

    this.add.rectangle(width / 2, height / 2, 420, 260, 0x121a2e)
      .setStrokeStyle(2, 0x66e0c0).setDepth(901);

    this.add.text(width / 2, height / 2 - 80, 'WELCOME BACK!', {
      fontFamily: 'monospace', fontSize: '24px', color: '#66e0c0', fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(902);

    this.add.text(width / 2, height / 2 - 30, `Away for ${timeStr}`, {
      fontFamily: 'monospace', fontSize: '14px', color: '#8899aa'
    }).setOrigin(0.5).setDepth(902);

    this.add.text(width / 2, height / 2 + 20, `+${gold} GOLD`, {
      fontFamily: 'monospace', fontSize: '32px', color: '#ffd966', fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(902);

    const btn = this.add.rectangle(width / 2, height / 2 + 90, 160, 44, 0x1a2030)
      .setStrokeStyle(2, 0x66e0c0).setInteractive({ useHandCursor: true }).setDepth(902);

    this.add.text(width / 2, height / 2 + 90, 'CLAIM', {
      fontFamily: 'monospace', fontSize: '16px', color: '#66e0c0', fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(903);

    btn.on('pointerdown', () => {
      overlay.destroy();
      this.scene.restart();
    });
  }
}
