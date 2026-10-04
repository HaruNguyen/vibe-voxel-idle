import Phaser from 'phaser';
import { ELEMENTS } from '../data/characters.js';
import { SaveSystem } from '../systems/SaveSystem.js';
import { createUnit, generateEnemyTeam, simulateBattle } from '../systems/BattleSystem.js';

const PARTICLE_COLORS = {
  EARTH:    [0x8b6f47, 0xc9a876, 0x6b5030],
  ICE:      [0x66e0c0, 0xa8fff0, 0x4dd0e1],
  METAL:    [0x8899aa, 0xc0d0e0, 0x606a7a],
  SHADOW:   [0x6a4a9a, 0xb090ff, 0x3a2a5a],
  ELECTRIC: [0x4dd0e1, 0xa0f0ff, 0xfff080],
  NATURE:   [0x6a9a4a, 0xa0e070, 0x4a7a2a],
  FIRE:     [0xff8844, 0xffc080, 0xff4444]
};

const ELEMENT_ICONS = {
  EARTH: '◆', ICE: '❄', METAL: '⚙', SHADOW: '☾',
  ELECTRIC: '⚡', NATURE: '❀', FIRE: '✹'
};

export class BattleScene extends Phaser.Scene {
  constructor() {
    super('BattleScene');
  }

  init(data) {
    this.state = data.state || SaveSystem.load();
  }

  create() {
    const { width, height } = this.scale;

    this.createArenaBackground(width, height);
    this.createArenaFloor(width, height);
    this.createAmbientParticles(width, height);

    this.teamA = this.state.team.map(id => {
      const roster = this.state.roster.find(r => r.id === id);
      return createUnit(id, roster ? roster.level : 1, 'A', roster);
    });
    this.teamB = generateEnemyTeam(this.state.stage);

    const result = simulateBattle(this.teamA, this.teamB);
    this.battleLog = result.log;
    this.winner = result.winner;

    this.unitSprites = {};
    this.unitShadows = {};
    this.unitHpBars = {};
    this.unitHpTexts = {};
    this.unitGlows = {};
    this.unitAuras = {};
    this.unitHomePositions = {};
    this.unitElementIcons = {};

    this.renderTeam(this.teamA, 'A', width, height);
    this.renderTeam(this.teamB, 'B', width, height);

    // Stage banner
    this.add.text(width / 2, 60, `STAGE ${this.state.stage}`, {
      fontFamily: 'monospace', fontSize: '36px', color: '#8899aa',
      fontStyle: 'bold', stroke: '#000000', strokeThickness: 4
    }).setOrigin(0.5);

    // VS banner animated
    const vs = this.add.text(width / 2, height / 2 - 80, 'VS', {
      fontFamily: 'monospace', fontSize: '140px', color: '#66e0c0', fontStyle: 'bold',
      stroke: '#000000', strokeThickness: 10
    }).setOrigin(0.5).setAlpha(0).setScale(0.3);

    this.tweens.add({
      targets: vs, alpha: 0.85, scale: 1,
      duration: 500, ease: 'Back.easeOut'
    });

    this.startIdleAnimations();

    this.time.delayedCall(1000, () => this.playBattleLog());
  }

  // ===== ARENA BACKGROUND =====

  createArenaBackground(width, height) {
    // Sky gradient
    const sky = this.add.graphics();
    sky.fillGradientStyle(0x080a14, 0x080a14, 0x1a1a3a, 0x1a1a3a, 1);
    sky.fillRect(0, 0, width, height);

    // Stars in sky
    for (let i = 0; i < 80; i++) {
      const star = this.add.circle(
        Math.random() * width,
        Math.random() * height * 0.4,
        1.5 + Math.random() * 2,
        0xffffff,
        0.3 + Math.random() * 0.5
      );
      this.tweens.add({
        targets: star,
        alpha: 0.1,
        duration: 1500 + Math.random() * 2000,
        yoyo: true,
        repeat: -1
      });
    }

    // Far mountains silhouette
    const farMountains = this.add.graphics();
    farMountains.fillStyle(0x0f1424, 0.8);
    farMountains.beginPath();
    farMountains.moveTo(0, height * 0.5);
    for (let x = 0; x <= width; x += 120) {
      const h = 120 + Math.sin(x * 0.01) * 80 + Math.random() * 60;
      farMountains.lineTo(x, height * 0.5 - h);
    }
    farMountains.lineTo(width, height * 0.5);
    farMountains.closePath();
    farMountains.fillPath();

    // Near mountains silhouette
    const nearMountains = this.add.graphics();
    nearMountains.fillStyle(0x15192e, 1);
    nearMountains.beginPath();
    nearMountains.moveTo(0, height * 0.55);
    for (let x = 0; x <= width; x += 160) {
      const h = 80 + Math.sin(x * 0.008 + 1) * 60 + Math.random() * 40;
      nearMountains.lineTo(x, height * 0.55 - h);
    }
    nearMountains.lineTo(width, height * 0.55);
    nearMountains.closePath();
    nearMountains.fillPath();

    // Central radial glow (arena light)
    const glow = this.add.graphics();
    for (let i = 12; i > 0; i--) {
      glow.fillStyle(0x66e0c0, 0.006 * i);
      glow.fillCircle(width / 2, height * 0.65, 300 + i * 100);
    }
  }

  createArenaFloor(width, height) {
    const floorY = height * 0.55;
    const floorH = height * 0.45;

    // Floor base gradient
    const floor = this.add.graphics();
    floor.fillGradientStyle(0x0a0e1a, 0x0a0e1a, 0x1a2540, 0x1a2540, 1);
    floor.fillRect(0, floorY, width, floorH);

    // Perspective grid - horizontal lines
    const grid = this.add.graphics();
    grid.lineStyle(2, 0x66e0c0, 0.12);
    for (let i = 0; i <= 15; i++) {
      const t = i / 15;
      const y = floorY + Math.pow(t, 1.6) * floorH;
      grid.lineBetween(0, y, width, y);
    }

    // Perspective grid - vertical converging lines
    for (let i = -15; i <= 15; i++) {
      const topX = width / 2 + i * 50;
      const bottomX = width / 2 + i * 170;
      grid.lineBetween(topX, floorY, bottomX, height);
    }

    // Glowing horizon line
    const edgeGlow = this.add.graphics();
    for (let i = 0; i < 10; i++) {
      edgeGlow.lineStyle(2, 0x66e0c0, 0.25 - i * 0.025);
      edgeGlow.lineBetween(0, floorY - i, width, floorY - i);
      edgeGlow.lineBetween(0, floorY + i, width, floorY + i);
    }

    // Bright center line
    edgeGlow.lineStyle(4, 0x66e0c0, 0.9);
    edgeGlow.lineBetween(0, floorY, width, floorY);

    // Pulse on horizon
    const pulse = this.add.graphics();
    pulse.lineStyle(3, 0xa8fff0, 0.6);
    pulse.lineBetween(0, floorY, width, floorY);
    this.tweens.add({
      targets: pulse,
      alpha: 0.2,
      duration: 2000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  }

  createAmbientParticles(width, height) {
    for (let i = 0; i < 50; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      const size = 2 + Math.random() * 3;
      const particle = this.add.circle(x, y, size, 0x66e0c0, 0.4);

      this.tweens.add({
        targets: particle,
        x: x + (Math.random() - 0.5) * 150,
        y: y - 150 - Math.random() * 200,
        alpha: 0,
        duration: 5000 + Math.random() * 5000,
        delay: Math.random() * 3000,
        repeat: -1,
        ease: 'Linear',
        onRepeat: () => {
          particle.x = Math.random() * width;
          particle.y = height + 10;
          particle.alpha = 0.4;
        }
      });
    }
  }

  // ===== TEAM RENDERING =====

  renderTeam(team, side, width, height) {
    const isA = side === 'A';
    const baseY = height / 2 + 140;
    const spacing = 260;
    const centerX = isA ? width / 2 - 520 : width / 2 + 520;
    const startX = centerX - (team.length - 1) * spacing / 2;

    team.forEach((unit, i) => {
      const x = startX + i * spacing;
      const y = baseY + (isA ? 0 : 40);
      const element = ELEMENTS[unit.element];

      // Shadow ellipse under character
      const shadow = this.add.ellipse(x, y + 95, 160, 30, 0x000000, 0.5);

      // Elemental glow behind character
      const glowCircle = this.add.circle(x, y, 120, element.color, 0.12);

      // Rotating aura ring
      const aura = this.add.graphics();
      aura.lineStyle(3, element.glow, 0.5);
      aura.beginPath();
      aura.arc(x, y, 125, 0, Math.PI * 0.65);
      aura.strokePath();
      aura.beginPath();
      aura.arc(x, y, 125, Math.PI, Math.PI * 1.65);
      aura.strokePath();

      // Character sprite - BIG with per-character scale
      const charScale = unit.spriteScale || 1.0;
      const img = this.add.image(x, y, unit.key);
      img.setDisplaySize(240 * charScale, 240 * charScale);
      img.baseScale = img.scaleX;
      if (!isA) img.setFlipX(true);

      // Element icon above
      const icon = this.add.text(x, y - 145, ELEMENT_ICONS[unit.element], {
        fontFamily: 'monospace', fontSize: '40px',
        color: '#' + element.glow.toString(16).padStart(6, '0'),
        stroke: '#000000', strokeThickness: 5
      }).setOrigin(0.5);

      // HP bar
      const barW = 200;
      const barBg = this.add.rectangle(x, y + 145, barW, 20, 0x000000, 0.7)
        .setOrigin(0.5).setStrokeStyle(2, 0x66e0c0, 0.7);

      const hpBar = this.add.rectangle(x - barW / 2, y + 145, barW, 20, 0x66e0c0)
        .setOrigin(0, 0.5);

      const hpText = this.add.text(x, y + 180, `${unit.hp}/${unit.maxHp}`, {
        fontFamily: 'monospace', fontSize: '18px', color: '#ffffff',
        fontStyle: 'bold', stroke: '#000000', strokeThickness: 4
      }).setOrigin(0.5);

      const key = unit.id + side;
      this.unitSprites[key] = img;
      this.unitShadows[key] = shadow;
      this.unitHpBars[key] = hpBar;
      this.unitHpTexts[key] = hpText;
      this.unitGlows[key] = glowCircle;
      this.unitAuras[key] = aura;
      this.unitHomePositions[key] = { x, y };
      this.unitElementIcons[key] = icon;

      hpBar.maxWidth = barW;
      hpBar.baseX = x - barW / 2;
    });
  }

  startIdleAnimations() {
    Object.values(this.unitSprites).forEach((sprite, idx) => {
      this.tweens.add({
        targets: sprite,
        y: sprite.y - 8,
        duration: 1400 + idx * 100,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
    });

    Object.values(this.unitGlows).forEach((glow, idx) => {
      this.tweens.add({
        targets: glow,
        alpha: 0.3,
        scale: 1.2,
        duration: 1600 + idx * 80,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
    });

    Object.values(this.unitAuras).forEach((aura, idx) => {
      this.tweens.add({
        targets: aura,
        angle: 360,
        duration: 10000 + idx * 500,
        repeat: -1,
        ease: 'Linear'
      });
    });
  }

  // ===== BATTLE LOG =====

  playBattleLog() {
    let index = 0;
    const stepDelay = 550;

    const nextStep = () => {
      if (index >= this.battleLog.length) {
        this.time.delayedCall(900, () => this.showResult());
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

    const home = this.unitHomePositions[attackerKey];
    if (!home) return;

    const attackerUnit = event.attackerTeam === 'A'
      ? this.teamA.find(u => u.id === event.attackerId)
      : this.teamB.find(u => u.id === event.attackerId);

    const element = attackerUnit ? ELEMENTS[attackerUnit.element] : ELEMENTS.METAL;

    const dx = target.x - home.x;
    const dy = target.y - home.y;
    const lungeX = home.x + dx * 0.5;
    const lungeY = home.y + dy * 0.5;

    const baseScale = attacker.baseScale || 0.22;

    // Anticipation
    this.tweens.add({
      targets: attacker,
      x: home.x - dx * 0.08,
      y: home.y - dy * 0.08,
      scaleX: baseScale * 1.05,
      scaleY: baseScale * 1.05,
      duration: 120,
      ease: 'Quad.easeOut',
      onComplete: () => {
        // Lunge with trail
        const trail = this.add.rectangle(attacker.x, attacker.y, 200, 40, element.glow, 0.6)
          .setDepth(attacker.depth - 1);

        this.tweens.add({
          targets: attacker,
          x: lungeX,
          y: lungeY,
          scaleX: baseScale * 1.25,
          scaleY: baseScale * 1.25,
          duration: 200,
          ease: 'Power2.easeOut',
          onComplete: () => {
            this.spawnImpactParticles(target.x, target.y, element);
            this.flashElementalGlow(targetKey, element);
            this.cameras.main.shake(150, 0.004);

            this.tweens.add({
              targets: attacker,
              x: home.x,
              y: home.y,
              scaleX: baseScale,
              scaleY: baseScale,
              duration: 260,
              ease: 'Power2.easeIn'
            });
          }
        });

        this.tweens.add({
          targets: trail,
          alpha: 0,
          duration: 350,
          onComplete: () => trail.destroy()
        });
      }
    });

    this.time.delayedCall(320, () => {
      const damageColor = event.damage >= 100 ? '#ffaa00'
                        : event.damage >= 50 ? '#ff6666'
                        : '#ffffff';

      const dmgText = this.add.text(target.x, target.y - 80, `-${event.damage}`, {
        fontFamily: 'monospace',
        fontSize: event.damage >= 100 ? '60px' : '44px',
        color: damageColor,
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 8
      }).setOrigin(0.5).setScale(0.3).setDepth(1000);

      this.tweens.add({
        targets: dmgText,
        scale: 1.2,
        duration: 150,
        ease: 'Back.easeOut',
        onComplete: () => {
          this.tweens.add({
            targets: dmgText,
            y: target.y - 200,
            scale: 0.9,
            alpha: 0,
            duration: 800,
            ease: 'Power2.easeOut',
            onComplete: () => dmgText.destroy()
          });
        }
      });

      this.tweens.add({
        targets: target,
        x: target.x + (Math.random() - 0.5) * 28,
        y: target.y + (Math.random() - 0.5) * 28,
        angle: (Math.random() - 0.5) * 12,
        duration: 60,
        yoyo: true,
        repeat: 3,
        ease: 'Sine.easeInOut'
      });

      this.tweens.add({
        targets: target,
        alpha: 0.25,
        duration: 80,
        yoyo: true,
        repeat: 2,
        ease: 'Quad.easeOut'
      });

      const hpBar = this.unitHpBars[targetKey];
      const hpText = this.unitHpTexts[targetKey];
      const unit = event.targetTeam === 'A'
        ? this.teamA.find(u => u.id === event.targetId)
        : this.teamB.find(u => u.id === event.targetId);

      if (hpBar && unit) {
        const ratio = Math.max(0, event.targetHp / unit.maxHp);
        this.tweens.add({
          targets: hpBar,
          width: hpBar.maxWidth * ratio,
          duration: 250,
          ease: 'Power2.easeOut'
        });

        if (ratio <= 0.25) hpBar.fillColor = 0xff4444;
        else if (ratio <= 0.5) hpBar.fillColor = 0xffaa44;
        else hpBar.fillColor = 0x66e0c0;
      }
      if (hpText) hpText.setText(`${Math.max(0, event.targetHp)}/${unit ? unit.maxHp : '?'}`);
    });
  }

  spawnImpactParticles(x, y, element) {
    const colors = PARTICLE_COLORS[element.name.toUpperCase()] || PARTICLE_COLORS.METAL;

    // Central burst ring
    const ring = this.add.circle(x, y, 20, 0xffffff, 0.8).setDepth(999);
    this.tweens.add({
      targets: ring,
      scale: 6,
      alpha: 0,
      duration: 500,
      ease: 'Power2.easeOut',
      onComplete: () => ring.destroy()
    });

    // Radial particles
    for (let i = 0; i < 16; i++) {
      const angle = (Math.PI * 2 * i) / 16 + Math.random() * 0.4;
      const dist = 100 + Math.random() * 120;
      const color = colors[Math.floor(Math.random() * colors.length)];

      const particle = this.add.circle(x, y, 4 + Math.random() * 6, color, 1).setDepth(999);

      this.tweens.add({
        targets: particle,
        x: x + Math.cos(angle) * dist,
        y: y + Math.sin(angle) * dist,
        alpha: 0,
        scale: 0.2,
        duration: 600 + Math.random() * 300,
        ease: 'Power2.easeOut',
        onComplete: () => particle.destroy()
      });
    }
  }

  flashElementalGlow(targetKey, element) {
    const glow = this.unitGlows[targetKey];
    if (!glow) return;

    const originalColor = glow.fillColor;
    glow.fillColor = 0xffffff;
    glow.setAlpha(0.8);

    this.time.delayedCall(200, () => {
      glow.fillColor = originalColor;
    });
  }

  animateKO(event) {
    const key = event.unitId + event.team;
    const sprite = this.unitSprites[key];
    const glow = this.unitGlows[key];
    const shadow = this.unitShadows[key];
    const hpBar = this.unitHpBars[key];
    const hpText = this.unitHpTexts[key];
    const icon = this.unitElementIcons[key];
    const aura = this.unitAuras[key];

    if (!sprite) return;

    const unit = event.team === 'A'
      ? this.teamA.find(u => u.id === event.unitId)
      : this.teamB.find(u => u.id === event.unitId);
    if (unit) {
      this.spawnImpactParticles(sprite.x, sprite.y, ELEMENTS[unit.element]);
    }

    const baseScale = sprite.baseScale || 0.22;

    this.tweens.add({
      targets: sprite,
      alpha: 0,
      angle: 90,
      y: sprite.y + 100,
      scaleX: baseScale * 0.5,
      scaleY: baseScale * 0.5,
      duration: 700,
      ease: 'Power2.easeIn'
    });

    if (glow) this.tweens.add({ targets: glow, alpha: 0, scale: 0.3, duration: 500 });
    if (shadow) this.tweens.add({ targets: shadow, alpha: 0, scaleX: 0.3, duration: 500 });
    if (hpBar) this.tweens.add({ targets: hpBar, alpha: 0, duration: 300 });
    if (hpText) this.tweens.add({ targets: hpText, alpha: 0, duration: 300 });
    if (icon) this.tweens.add({ targets: icon, alpha: 0, duration: 300 });
    if (aura) this.tweens.add({ targets: aura, alpha: 0, duration: 300 });
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

    const overlay = this.add.rectangle(0, 0, width, height, 0x000000, 0)
      .setOrigin(0).setDepth(900);
    this.tweens.add({ targets: overlay, alpha: 0.8, duration: 400 });

    const popupColor = isWin ? 0x66e0c0 : 0xff5555;
    const popupText = isWin ? '★ VICTORY ★' : 'DEFEAT';
    const rewardText = isWin
      ? `+${50 + (this.state.stage - 1) * 10} GOLD`
      : '+10 GOLD';

    this.add.rectangle(width / 2, height / 2, 880, 580, 0x0a0e1a)
      .setStrokeStyle(6, popupColor).setDepth(901);

    const titleText = this.add.text(width / 2, height / 2 - 180, popupText, {
      fontFamily: 'monospace', fontSize: '84px',
      color: '#' + popupColor.toString(16).padStart(6, '0'),
      fontStyle: 'bold',
      stroke: '#000000', strokeThickness: 10
    }).setOrigin(0.5).setDepth(902).setAlpha(0);

    const rewardLabel = this.add.text(width / 2, height / 2 - 50, rewardText, {
      fontFamily: 'monospace', fontSize: '56px',
      color: '#ffd966', fontStyle: 'bold',
      stroke: '#000000', strokeThickness: 6
    }).setOrigin(0.5).setDepth(902).setAlpha(0);

    let extraLine;
    if (isWin) {
      extraLine = this.add.text(width / 2, height / 2 + 40, `Stage ${this.state.stage} unlocked!`, {
        fontFamily: 'monospace', fontSize: '28px', color: '#8899aa'
      }).setOrigin(0.5).setDepth(902).setAlpha(0);
    }

    const btn = this.add.rectangle(width / 2, height / 2 + 180, 440, 100, 0x1a2030)
      .setStrokeStyle(4, popupColor)
      .setInteractive({ useHandCursor: true }).setDepth(902).setAlpha(0);

    const btnText = this.add.text(width / 2, height / 2 + 180, 'CONTINUE', {
      fontFamily: 'monospace', fontSize: '36px',
      color: '#' + popupColor.toString(16).padStart(6, '0'),
      fontStyle: 'bold', letterSpacing: 4
    }).setOrigin(0.5).setDepth(903).setAlpha(0);

    this.time.delayedCall(400, () => {
      this.tweens.add({ targets: titleText, alpha: 1, duration: 300, ease: 'Back.easeOut' });
    });
    this.time.delayedCall(600, () => {
      this.tweens.add({ targets: rewardLabel, alpha: 1, duration: 250 });
      if (extraLine) this.tweens.add({ targets: extraLine, alpha: 1, duration: 250 });
    });
    this.time.delayedCall(800, () => {
      this.tweens.add({ targets: btn, alpha: 1, duration: 250 });
      this.tweens.add({ targets: btnText, alpha: 1, duration: 250 });
    });

    btn.on('pointerover', () => btn.setFillStyle(popupColor, 0.2));
    btn.on('pointerout', () => btn.setFillStyle(0x1a2030, 1));
    btn.on('pointerdown', () => this.scene.start('MainScene'));

    if (isWin) this.spawnConfetti(width, height);
  }

  spawnConfetti(width, height) {
    const colors = [0x66e0c0, 0xffd966, 0xb090ff, 0xff8844, 0x4dd0e1];
    for (let i = 0; i < 80; i++) {
      const x = Math.random() * width;
      const y = -20;
      const color = colors[Math.floor(Math.random() * colors.length)];
      const confetti = this.add.rectangle(x, y, 14, 22, color)
        .setDepth(950).setAngle(Math.random() * 360);

      this.tweens.add({
        targets: confetti,
        y: height + 40,
        x: x + (Math.random() - 0.5) * 400,
        angle: confetti.angle + 720,
        duration: 2500 + Math.random() * 1500,
        delay: i * 25,
        ease: 'Linear',
        onComplete: () => confetti.destroy()
      });
    }
  }
}
