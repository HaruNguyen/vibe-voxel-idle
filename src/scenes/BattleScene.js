import Phaser from 'phaser';
import { ELEMENTS } from '../data/characters.js';
import { SaveSystem } from '../systems/SaveSystem.js';
import { createUnit, generateEnemyTeam, simulateBattle } from '../systems/BattleSystem.js';

export class BattleScene extends Phaser.Scene {
  constructor() {
    super('BattleScene');
  }

  init(data) {
    this.state = data.state || SaveSystem.load();
  }

  create() {
    const { width, height } = this.scale;

    this.createBackground(width, height);

    this.teamA = this.state.team.map(id => {
      const roster = this.state.roster.find(r => r.id === id);
      return createUnit(id, roster ? roster.level : 1, 'A');
    });
    this.teamB = generateEnemyTeam(this.state.stage);

    const result = simulateBattle(this.teamA, this.teamB);
    this.battleLog = result.log;
    this.winner = result.winner;

    this.unitSprites = {};
    this.unitHpBars = {};
    this.unitHpTexts = {};

    this.renderTeam(this.teamA, 'A', width, height);
    this.renderTeam(this.teamB, 'B', width, height);

    this.add.text(width / 2, height / 2 - 20, 'VS', {
      fontFamily: 'monospace', fontSize: '48px', color: '#66e0c0', fontStyle: 'bold'
    }).setOrigin(0.5).setAlpha(0.3);

    this.playBattleLog();
  }

  createBackground(width, height) {
    const g = this.add.graphics();
    g.fillGradientStyle(0x0a0e1a, 0x0a0e1a, 0x1a1030, 0x1a1030, 1);
    g.fillRect(0, 0, width, height);

    const grid = this.add.graphics();
    grid.lineStyle(1, 0x66e0c0, 0.06);
    for (let x = 0; x < width; x += 50) grid.lineBetween(x, 0, x, height);
    for (let y = 0; y < height; y += 50) grid.lineBetween(0, y, width, y);

    this.add.text(width / 2, 30, `STAGE ${this.state.stage}`, {
      fontFamily: 'monospace', fontSize: '20px', color: '#8899aa'
    }).setOrigin(0.5);
  }

  renderTeam(team, side, width, height) {
    const isA = side === 'A';
    const baseY = height / 2 + 80;
    const spacing = 130;
    const centerX = isA ? width / 2 - 220 : width / 2 + 220;
    const startX = centerX - (team.length - 1) * spacing / 2;

    team.forEach((unit, i) => {
      const x = startX + i * spacing;
      const y = baseY + (isA ? 0 : 30);

      const img = this.add.image(x, y, unit.key).setDisplaySize(90, 90);
      if (!isA) img.setFlipX(true);

      const barW = 100;
      this.add.rectangle(x, y + 60, barW, 8, 0x1a2030).setOrigin(0.5);
      const hpBar = this.add.rectangle(x - barW / 2, y + 60, barW, 8, 0x66e0c0)
        .setOrigin(0, 0.5);

      const hpText = this.add.text(x, y + 78, `${unit.hp}/${unit.maxHp}`, {
        fontFamily: 'monospace', fontSize: '10px', color: '#ffffff'
      }).setOrigin(0.5);

      const key = unit.id + side;
      this.unitSprites[key] = img;
      this.unitHpBars[key] = hpBar;
      this.unitHpTexts[key] = hpText;
      hpBar.maxWidth = barW;
      hpBar.baseX = x - barW / 2;
    });
  }

  playBattleLog() {
    let index = 0;
    const stepDelay = 500;

    const nextStep = () => {
      if (index >= this.battleLog.length) {
        this.time.delayedCall(800, () => this.showResult());
        return;
      }

      const event = this.battleLog[index];
      index++;

      if (event.type === 'attack') {
        this.animateAttack(event);
        this.time.delayedCall(stepDelay, nextStep);
      } else if (event.type === 'ko') {
        this.animateKO(event);
        this.time.delayedCall(stepDelay, nextStep);
      } else {
        nextStep();
      }
    };

    nextStep();
  }

  animateAttack(event) {
    const attackerKey = event.attackerId + event.attackerTeam;
    const targetKey = event.targetId + event.targetTeam;
    const attacker = this.unitSprites[attackerKey];
    const target = this.unitSprites[targetKey];

    if (!attacker || !target) return;

    const dx = target.x - attacker.x;
    const dy = target.y - attacker.y;

    this.tweens.add({
      targets: attacker,
      x: attacker.x + dx * 0.3,
      y: attacker.y + dy * 0.3,
      duration: 150,
      yoyo: true,
      ease: 'Power2'
    });

    this.time.delayedCall(150, () => {
      const damageText = this.add.text(target.x, target.y - 30, `-${event.damage}`, {
        fontFamily: 'monospace', fontSize: '18px', color: '#ff5555', fontStyle: 'bold'
      }).setOrigin(0.5);

      this.tweens.add({
        targets: damageText,
        y: target.y - 70,
        alpha: 0,
        duration: 700,
        onComplete: () => damageText.destroy()
      });

      this.tweens.add({
        targets: target,
        alpha: 0.4,
        duration: 100,
        yoyo: true
      });

      const hpBar = this.unitHpBars[targetKey];
      const hpText = this.unitHpTexts[targetKey];
      const unit = event.targetTeam === 'A'
        ? this.teamA.find(u => u.id === event.targetId)
        : this.teamB.find(u => u.id === event.targetId);

      if (hpBar && unit) {
        const ratio = Math.max(0, event.targetHp / unit.maxHp);
        hpBar.width = hpBar.maxWidth * ratio;
      }
      if (hpText) hpText.setText(`${Math.max(0, event.targetHp)}`);
    });
  }

  animateKO(event) {
    const key = event.unitId + event.team;
    const sprite = this.unitSprites[key];
    if (!sprite) return;

    this.tweens.add({
      targets: sprite,
      alpha: 0,
      angle: 90,
      duration: 500
    });
  }

  showResult() {
    const { width, height } = this.scale;
    const isWin = this.winner === 'A';

    if (isWin) {
      this.state.gold += 50 + this.state.stage * 10;
      this.state.stage += 1;
      this.state.totalWins += 1;
    } else {
      this.state.gold += 10;
    }
    this.state.totalBattles += 1;
    SaveSystem.save(this.state);

    this.add.rectangle(0, 0, width, height, 0x000000, 0.7).setOrigin(0);

    const popupColor = isWin ? 0x66e0c0 : 0xff5555;
    const popupText = isWin ? 'VICTORY!' : 'DEFEAT';
    const rewardText = isWin
      ? `+${50 + (this.state.stage - 1) * 10} GOLD`
      : '+10 GOLD';

    this.add.rectangle(width / 2, height / 2, 420, 260, 0x121a2e)
      .setStrokeStyle(2, popupColor);

    this.add.text(width / 2, height / 2 - 80, popupText, {
      fontFamily: 'monospace', fontSize: '36px',
      color: '#' + popupColor.toString(16).padStart(6, '0'),
      fontStyle: 'bold'
    }).setOrigin(0.5);

    this.add.text(width / 2, height / 2 - 20, rewardText, {
      fontFamily: 'monospace', fontSize: '24px', color: '#ffd966', fontStyle: 'bold'
    }).setOrigin(0.5);

    if (isWin) {
      this.add.text(width / 2, height / 2 + 20, `Stage ${this.state.stage} unlocked!`, {
        fontFamily: 'monospace', fontSize: '14px', color: '#8899aa'
      }).setOrigin(0.5);
    }

    const btn = this.add.rectangle(width / 2, height / 2 + 90, 200, 48, 0x1a2030)
      .setStrokeStyle(2, popupColor)
      .setInteractive({ useHandCursor: true });

    this.add.text(width / 2, height / 2 + 90, 'CONTINUE', {
      fontFamily: 'monospace', fontSize: '16px',
      color: '#' + popupColor.toString(16).padStart(6, '0'),
      fontStyle: 'bold'
    }).setOrigin(0.5);

    btn.on('pointerdown', () => {
      this.scene.start('MainScene');
    });
  }
}
