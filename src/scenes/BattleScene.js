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

    this.createParallaxBackground(width, height);
    this.createPerspectiveFloor(width, height);
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
    this.unitReflections = {};
    this.unitHpBars = {};
    this.unitHpTexts = {};
    this.unitGlows = {};
    this.unitAuras = {};
    this.unitHomePositions = {};
    this.unitElementIcons = {};

    this.renderTeam(this.teamA, 'A', width, height);
    this.renderTeam(this.teamB, 'B', width, height);

    // VS banner
    const vs = this.add.text(width / 2, height / 2 - 20, 'VS', {
      fontFamily: 'monospace', fontSize: '64px', color: '#66e0c0', fontStyle: 'bold'
    }).setOrigin(0.5).setAlpha(0).setScale(0.3);

    this.tweens.add({
      targets: vs, alpha: 0.5, scale: 1,
      duration: 400, ease: 'Back.easeOut'
    });

    this.startIdleAnimations();

    this.time.delayedCall(900, () => this.playBattleLog());
  }

  // ===== 2.5D BACKGROUND =====

  createParallaxBackground(width, height) {
    // Sky gradient (bottom layer)
    const sky = this.add.graphics();
    sky.fillGradientStyle(0x0a0e1a, 0x0a0e1a, 0x1a1030, 0x1a1030, 1);
    sky.fillRect(0, 0, width, height);

    // Far background - mountains/city silhouette
    const farBg = this.add.graphics();
    farBg.fillStyle(0x151d30, 1);
    for (let x = 0; x < width; x += 120) {
      const h = 80 + Math.random() * 100;
      farBg.fillTriangle(x, height * 0.5, x + 60, height * 0.5 - h, x + 120, height * 0.5);
    }

    // Mid background - fog layer
    const midBg = this.add.graphics();
    midBg.fillStyle(0x1a2540, 0.5);
    midBg.fillRect(0, height * 0.35, width, height * 0.3);

    // Radial glow at center
    const glow = this.add.graphics();
    for (let i = 8; i > 0; i--) {
      glow.fillStyle(0x66e0c0, 0.008 * i);
      glow.fillCircle(width / 2, height / 2, 200 + i * 40);
    }
  }

  createPerspectiveFloor(width, height) {
    // Main arena floor with perspective tilt
    const floorY = height * 0.55;
    const floorH = height * 0.45;

    // Floor gradient
    const floor = this.add.graphics();
    floor.fillGradientStyle(0x0a0e1a, 0x0a0e1a, 0x121a2e, 0x121a2e, 1);
    floor.fillRect(0, floorY, width, floorH);

    // Perspective grid lines - horizontal
    const grid = this.add.graphics();
    grid.lineStyle(1, 0x66e0c0, 0.15);

    // Horizontal lines - closer together toward horizon
    for (let i = 0; i <= 12; i++) {
      const t = i / 12;
      const y = floorY + Math.pow(t, 1.8) * floorH;
      grid.lineBetween(0, y, width, y);
    }

    // Vertical lines - converge to center
    for (let i = -10; i <= 10; i++) {
      const topX = width / 2 + i * 30;
      const bottomX = width / 2 + i * 90;
      grid.lineBetween(topX, floorY, bottomX, height);
    }

    // Neon edge at horizon
    const edge = this.add.graphics();
    edge.lineStyle(2, 0x66e0c0, 0.6);
    edge.lineBetween(0, floorY, width, floorY);

    // Glow above horizon
    const glowLine = this.add.graphics();
    for (let i = 0; i < 5; i++) {
      glowLine.lineStyle(2, 0x66e0c0, 0.15 - i * 0.03);
      glowLine.lineBetween(0, floorY - i, width, floorY - i);
    }
  }

  createAmbientParticles(width, height) {
    // Floating dust particles across the screen
    for (let i = 0; i < 30; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      const size = 1 + Math.random() * 2;
      const particle = this.add.circle(x, y, size, 0x66e0c0, 0.3);

      this.tweens.add({
        targets: particle,
        x: x + (Math.random() - 0.5) * 100,
        y: y - 50 - Math.random() * 100,
        alpha: 0,
        duration: 4000 + Math.random() * 4000,
        delay: Math.random() * 3000,
        repeat: -1,
        ease: 'Linear',
        onRepeat: () => {
          particle.x = Math.random() * width;
          particle.y = height + 10;
          particle.alpha = 0.3;
        }
      });
    }
  }

  // ===== TEAM RENDERING =====

  renderTeam(team, side, width, height) {
    const isA = side === 'A';
    const baseY = height / 2 + 90;
    const spacing = 140;
    const centerX = isA ? width / 2 - 220 : width / 2 + 220;
    const startX = centerX - (team.length - 1) * spacing / 2;

    team.forEach((unit, i) => {
      const x = startX + i * spacing;
      const y = baseY + (isA ? 0 : 20);
      const element = ELEMENTS[unit.element];

      // Floor reflection (blurred, flipped, below unit)
      const reflection = this.add.image(x, y + 55, unit.key);
      reflection.setDisplaySize(90, 90);
      reflection.setFlipY(true);
      reflection.setAlpha(0.2);
      reflection.setTint(0x66e0c0);

      // Shadow (elliptical)
      const shadow = this.add.ellipse(x, y + 52, 70, 15, 0x000000, 0.5);

      // Elemental glow behind unit
      const glowCircle = this.add.circle(x, y, 55, element.color, 0.15);

      // Rotating aura (2 arcs)
      const aura = this.add.graphics();
      aura.lineStyle(2, element.glow, 0.4);
      aura.beginPath();
      aura.arc(x, y, 58, 0, Math.PI * 0.7);
      aura.strokePath();
      aura.beginPath();
      aura.arc(x, y, 58, Math.PI, Math.PI * 1.7);
      aura.strokePath();

      // Unit image
      const img = this.add.image(x, y, unit.key);
      img.setDisplaySize(90, 90);
      img.baseScale = img.scaleX;
      if (!isA) img.setFlipX(true);

      // Element icon
      const icon = this.add.text(x, y - 60, ELEMENT_ICONS[unit.element], {
        fontFamily: 'monospace', fontSize: '20px',
        color: '#' + element.glow.toString(16).padStart(6, '0')
      }).setOrigin(0.5);

      // HP bar
      const barW = 100;
      this.add.rectangle(x, y + 68, barW, 10, 0x1a2030)
        .setOrigin(0.5).setStrokeStyle(1, 0x66e0c0, 0.4);

      const hpBar = this.add.rectangle(x - barW / 2, y + 68, barW, 10, 0x66e0c0)
        .setOrigin(0, 0.5);

      const hpText = this.add.text(x, y + 84, `${unit.hp}/${unit.maxHp}`, {
        fontFamily: 'monospace', fontSize: '10px', color: '#ffffff'
      }).setOrigin(0.5);

      const key = unit.id + side;
      this.unitSprites[key] = img;
      this.unitShadows[key] = shadow;
      this.unitReflections[key] = reflection;
      this.unitHpBars[key] = hpBar;
      this.unitHpTexts[key] = hpText;
      this.unitGlows[key] = glowCircle;
      this.unitAuras = this.unitAuras || {};
      this.unitAuras[key] = aura;
      this.unitHomePositions[key] = { x, y };
      this.unitElementIcons[key] = icon;

      hpBar.maxWidth = barW;
      hpBar.baseX = x - barW / 2;
    });
  }

  startIdleAnimations() {
    // Breathing
    Object.values(this.unitSprites).forEach((sprite, idx) => {
      this.tweens.add({
        targets: sprite,
        y: sprite.y - 4,
        duration: 1200 + idx * 100,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
    });

    // Glow pulse
    Object.values(this.unitGlows).forEach((glow, idx) => {
      this.tweens.add({
        targets: glow,
        alpha: 0.35,
        scale: 1.15,
        duration: 1400 + idx * 80,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
    });

    // Aura rotation
    Object.values(this.unitAuras).forEach((aura, idx) => {
      this.tweens.add({
        targets: aura,
        angle: 360,
        duration: 8000 + idx * 500,
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
    const targetReflection = this.unitReflections[targetKey];

    if (!attacker || !target) return;

    const home = this.unitHomePositions[attackerKey];
    if (!home) return;

    const attackerUnit = event.attackerTeam === 'A'
      ? this.teamA.find(u => u.id === event.attackerId)
      : this.teamB.find(u => u.id === event.attackerId);

    const element = attackerUnit ? ELEMENTS[attackerUnit.element] : ELEMENTS.METAL;

    const dx = target.x - home.x;
    const dy = target.y - home.y;
    const lungeX = home.x + dx * 0.55;
    const lungeY = home.y + dy * 0.55;

    const baseScale = attacker.baseScale || 0.0833;

    // Anticipation
    this.tweens.add({
      targets: attacker,
      x: home.x - dx * 0.05,
      y: home.y - dy * 0.05,
      scaleX: baseScale * 1.05,
      scaleY: baseScale * 1.05,
      duration: 120,
      ease: 'Quad.easeOut',
      onComplete: () => {
        // Lunge
        this.tweens.add({
          targets: attacker,
          x: lungeX,
          y: lungeY,
          scaleX: baseScale * 1.2,
          scaleY: baseScale * 1.2,
          duration: 180,
          ease: 'Power2.easeOut',
          onComplete: () => {
            this.spawnImpactParticles(target.x, target.y, element);
            this.flashElementalGlow(targetKey, element);

            this.tweens.add({
              targets: attacker,
              x: home.x,
              y: home.y,
              scaleX: baseScale,
              scaleY: baseScale,
              duration: 240,
              ease: 'Power2.easeIn'
            });
          }
        });
      }
    });

    this.time.delayedCall(300, () => {
      const damageColor = event.damage >= 100 ? '#ffaa00'
                        : event.damage >= 50 ? '#ff6666'
                        : '#ffffff';

      const dmgText = this.add.text(target.x, target.y - 30, `-${event.damage}`, {
        fontFamily: 'monospace',
        fontSize: event.damage >= 100 ? '26px' : '20px',
        color: damageColor,
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 4
      }).setOrigin(0.5).setScale(0.3);

      this.tweens.add({
        targets: dmgText,
        scale: 1.2,
        duration: 150,
        ease: 'Back.easeOut',
        onComplete: () => {
          this.tweens.add({
            targets: dmgText,
            y: target.y - 90,
            scale: 0.9,
            alpha: 0,
            duration: 800,
            ease: 'Power2.easeOut',
            onComplete: () => dmgText.destroy()
          });
        }
      });

      // Shake target + reflection
      const targets = [target];
      if (targetReflection) targets.push(targetReflection);

      this.tweens.add({
        targets: targets,
        x: target.x + (Math.random() - 0.5) * 12,
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

      if (event.damage >= 80) {
        this.cameras.main.shake(180, 0.004);
      } else {
        this.cameras.main.shake(100, 0.002);
      }

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
      if (hpText) hpText.setText(`${Math.max(0, event.targetHp)}`);
    });
  }

  spawnImpactParticles(x, y, element) {
    const colors = PARTICLE_COLORS[element.name.toUpperCase()] || PARTICLE_COLORS.METAL;

    for (let i = 0; i < 8; i++) {
      const angle = (Math.PI * 2 * i) / 8 + Math.random() * 0.5;
      const dist = 40 + Math.random() * 40;
      const color = colors[Math.floor(Math.random() * colors.length)];

      const particle = this.add.circle(x, y, 3 + Math.random() * 3, color, 1);

      this.tweens.add({
        targets: particle,
        x: x + Math.cos(angle) * dist,
        y: y + Math.sin(angle) * dist,
        alpha: 0,
        scale: 0.2,
        duration: 400 + Math.random() * 200,
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
    glow.setAlpha(0.6);

    this.time.delayedCall(150, () => {
      glow.fillColor = originalColor;
    });
  }

  animateKO(event) {
    const key = event.unitId + event.team;
    const sprite = this.unitSprites[key];
    const glow = this.unitGlows[key];
    const shadow = this.unitShadows[key];
    const reflection = this.unitReflections[key];
    const hpBar = this.unitHpBars[key];
    const hpText = this.unitHpTexts[key];
    const icon = this.unitElementIcons[key];
    const aura = this.unitAuras ? this.unitAuras[key] : null;

    if (!sprite) return;

    const unit = event.team === 'A'
      ? this.teamA.find(u => u.id === event.unitId)
      : this.teamB.find(u => u.id === event.unitId);
    if (unit) {
      this.spawnImpactParticles(sprite.x, sprite.y, ELEMENTS[unit.element]);
    }

    const baseScale = sprite.baseScale || 0.0833;

    this.tweens.add({
      targets: sprite,
      alpha: 0,
      angle: 90,
      y: sprite.y + 40,
      scaleX: baseScale * 0.6,
      scaleY: baseScale * 0.6,
      duration: 700,
      ease: 'Power2.easeIn'
    });

    if (glow) this.tweens.add({ targets: glow, alpha: 0, scale: 0.3, duration: 500 });
    if (shadow) this.tweens.add({ targets: shadow, alpha: 0, scaleX: 0.3, duration: 500 });
    if (reflection) this.tweens.add({ targets: reflection, alpha: 0, duration: 500 });
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
    this.tweens.add({ targets: overlay, alpha: 0.75, duration: 400 });

    const popupColor = isWin ? 0x66e0c0 : 0xff5555;
    const popupText = isWin ? '★ VICTORY ★' : 'DEFEAT';
    const rewardText = isWin
      ? `+${50 + (this.state.stage - 1) * 10} GOLD`
      : '+10 GOLD';

    const popup = this.add.rectangle(width / 2, height / 2, 440, 280, 0x121a2e)
      .setStrokeStyle(3, popupColor).setDepth(901).setScale(0.5);

    this.tweens.add({
      targets: popup, scale: 1,
      duration: 400, ease: 'Back.easeOut'
    });

    const titleText = this.add.text(width / 2, height / 2 - 90, popupText, {
      fontFamily: 'monospace', fontSize: '38px',
      color: '#' + popupColor.toString(16).padStart(6, '0'),
      fontStyle: 'bold',
      stroke: '#000000', strokeThickness: 4
    }).setOrigin(0.5).setDepth(902).setAlpha(0);

    const rewardLabel = this.add.text(width / 2, height / 2 - 25, rewardText, {
      fontFamily: 'monospace', fontSize: '26px',
      color: '#ffd966', fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(902).setAlpha(0);

    let extraLine;
    if (isWin) {
      extraLine = this.add.text(width / 2, height / 2 + 15, `Stage ${this.state.stage} unlocked!`, {
        fontFamily: 'monospace', fontSize: '14px', color: '#8899aa'
      }).setOrigin(0.5).setDepth(902).setAlpha(0);
    }

    const btn = this.add.rectangle(width / 2, height / 2 + 90, 220, 50, 0x1a2030)
      .setStrokeStyle(2, popupColor)
      .setInteractive({ useHandCursor: true }).setDepth(902).setAlpha(0);

    const btnText = this.add.text(width / 2, height / 2 + 90, 'CONTINUE', {
      fontFamily: 'monospace', fontSize: '18px',
      color: '#' + popupColor.toString(16).padStart(6, '0'),
      fontStyle: 'bold'
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
    for (let i = 0; i < 40; i++) {
      const x = Math.random() * width;
      const y = -20;
      const color = colors[Math.floor(Math.random() * colors.length)];
      const confetti = this.add.rectangle(x, y, 8, 12, color)
        .setDepth(950).setAngle(Math.random() * 360);

      this.tweens.add({
        targets: confetti,
        y: height + 20,
        x: x + (Math.random() - 0.5) * 200,
        angle: confetti.angle + 720,
        duration: 2000 + Math.random() * 1500,
        delay: i * 40,
        ease: 'Linear',
        onComplete: () => confetti.destroy()
      });
    }
  }
}
