import Phaser from 'phaser';
import { ELEMENTS, getCharacterById } from '../data/characters.js';
import { SaveSystem } from '../systems/SaveSystem.js';
import { TeamSystem, ELEMENT_FILTERS, SORT_MODES } from '../systems/TeamSystem.js';

export class InventoryScene extends Phaser.Scene {
  constructor() {
    super('InventoryScene');
  }

  init(data) {
    this.state = data.state || SaveSystem.load();
    this.elementFilter = 'ALL';
    this.sortMode = 'POWER';
  }

  create() {
    const { width, height } = this.scale;

    this.createBackground(width, height);
    this.createHeader(width);
    this.createFilterBar(width);
    this.createCharacterGrid(width, height);
    this.createTeamPanel(width, height);
    this.createBackButton(width, height);
  }

  createBackground(width, height) {
    const g = this.add.graphics();
    g.fillGradientStyle(0x080a14, 0x080a14, 0x1a1a3a, 0x1a1a3a, 1);
    g.fillRect(0, 0, width, height);

    const glow = this.add.graphics();
    for (let i = 8; i > 0; i--) {
      glow.fillStyle(0x66e0c0, 0.005 * i);
      glow.fillCircle(width / 2, height / 2, 400 + i * 100);
    }

    const grid = this.add.graphics();
    grid.lineStyle(1, 0x66e0c0, 0.04);
    for (let x = 0; x < width; x += 80) grid.lineBetween(x, 0, x, height);
    for (let y = 0; y < height; y += 80) grid.lineBetween(0, y, width, y);
  }

  createHeader(width) {
    this.add.text(width / 2, 50, 'INVENTORY', {
      fontFamily: 'monospace', fontSize: '56px',
      color: '#66e0c0', fontStyle: 'bold',
      stroke: '#000000', strokeThickness: 8
    }).setOrigin(0.5).setShadow(0, 0, '#66e0c0', 20, true, true);

    this.goldText = this.add.text(width - 50, 50, `◆ ${this.state.gold}`, {
      fontFamily: 'monospace', fontSize: '36px', color: '#ffd966',
      fontStyle: 'bold', stroke: '#000000', strokeThickness: 5
    }).setOrigin(1, 0.5);

    this.countText = this.add.text(50, 50, `${this.state.roster.length} / 12 VIBERS`, {
      fontFamily: 'monospace', fontSize: '24px', color: '#8899aa',
      fontStyle: 'bold', stroke: '#000000', strokeThickness: 3
    }).setOrigin(0, 0.5);
  }

  createFilterBar(width) {
    const filterY = 130;

    // Element filter label
    this.add.text(50, filterY, 'FILTER:', {
      fontFamily: 'monospace', fontSize: '18px', color: '#8899aa',
      fontStyle: 'bold'
    }).setOrigin(0, 0.5);

    // Filter buttons
    const filterX = 160;
    const btnW = 130;
    const btnH = 44;
    const spacing = 10;

    this.filterButtons = {};
    ELEMENT_FILTERS.forEach((filter, i) => {
      const x = filterX + i * (btnW + spacing) + btnW / 2;
      const isActive = filter.key === this.elementFilter;

      const btn = this.add.rectangle(x, filterY, btnW, btnH,
        isActive ? filter.color : 0x1a2030, isActive ? 0.3 : 1)
        .setStrokeStyle(2, isActive ? filter.color : 0x333333)
        .setInteractive({ useHandCursor: true });

      const label = this.add.text(x, filterY, filter.name.toUpperCase(), {
        fontFamily: 'monospace', fontSize: '14px',
        color: isActive ? '#' + filter.color.toString(16).padStart(6, '0') : '#8899aa',
        fontStyle: 'bold'
      }).setOrigin(0.5);

      btn.on('pointerdown', () => {
        this.elementFilter = filter.key;
        this.scene.restart({ state: this.state });
      });

      this.filterButtons[filter.key] = { btn, label };
    });

    // Sort dropdown (cycle through modes)
    const sortY = filterY + 60;
    this.add.text(50, sortY, 'SORT:', {
      fontFamily: 'monospace', fontSize: '18px', color: '#8899aa',
      fontStyle: 'bold'
    }).setOrigin(0, 0.5);

    const sortX = 160;
    const currentSort = SORT_MODES.find(s => s.key === this.sortMode);
    const sortBtn = this.add.rectangle(sortX + 100, sortY, 200, 44, 0x1a2030)
      .setStrokeStyle(2, 0x66e0c0)
      .setInteractive({ useHandCursor: true });

    this.add.text(sortX + 100, sortY, `▼ ${currentSort.name.toUpperCase()}`, {
      fontFamily: 'monospace', fontSize: '16px', color: '#66e0c0',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    sortBtn.on('pointerdown', () => {
      const idx = SORT_MODES.findIndex(s => s.key === this.sortMode);
      this.sortMode = SORT_MODES[(idx + 1) % SORT_MODES.length].key;
      this.scene.restart({ state: this.state });
    });
  }

  createCharacterGrid(width, height) {
    const gridY = 260;
    const cardW = 140;
    const cardH = 180;
    const spacingX = 20;
    const spacingY = 20;
    const cols = 8;
    const startX = (width - (cols * cardW + (cols - 1) * spacingX)) / 2;

    const filtered = TeamSystem.filterRoster(this.state.roster, this.elementFilter);
    const sorted = TeamSystem.sortRoster(filtered, this.sortMode);

    // Empty message
    if (sorted.length === 0) {
      this.add.text(width / 2, gridY + 100, 'NO VIBERS IN THIS CATEGORY', {
        fontFamily: 'monospace', fontSize: '24px', color: '#666666',
        fontStyle: 'bold'
      }).setOrigin(0.5);
      return;
    }

    sorted.forEach((entry, i) => {
      const char = getCharacterById(entry.id);
      if (!char) return;

      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = startX + col * (cardW + spacingX) + cardW / 2;
      const y = gridY + row * (cardH + spacingY) + cardH / 2;

      this.createCharacterCard(x, y, cardW, cardH, char, entry);
    });
  }

  createCharacterCard(x, y, w, h, char, entry) {
    const element = ELEMENTS[char.element];
    const isInTeam = TeamSystem.isInTeam(this.state, entry.id);

    // Card background
    this.add.rectangle(x, y, w, h, 0x0a0e1a, 0.95)
      .setStrokeStyle(isInTeam ? 4 : 2, isInTeam ? 0xffd966 : element.glow);

    // Character sprite
    const charScale = char.spriteScale || 1.0;
    const img = this.add.image(x, y - 20, char.key);
    img.setDisplaySize(120 * charScale, 120 * charScale);

    // Name
    this.add.text(x, y + h / 2 - 35, char.name, {
      fontFamily: 'monospace', fontSize: '16px', color: '#ffffff',
      fontStyle: 'bold', stroke: '#000000', strokeThickness: 3
    }).setOrigin(0.5);

    // Level + Stars
    this.add.text(x, y + h / 2 - 12, `Lv.${entry.level}  ★${entry.stars}`, {
      fontFamily: 'monospace', fontSize: '13px', color: '#ffd966'
    }).setOrigin(0.5);

    // Team badge (if in team)
    if (isInTeam) {
      this.add.text(x + w / 2 - 15, y - h / 2 + 15, '★', {
        fontFamily: 'monospace', fontSize: '24px', color: '#ffd966',
        stroke: '#000000', strokeThickness: 3
      }).setOrigin(0.5);
    }

    // Interactive click
    const hitArea = this.add.rectangle(x, y, w, h, 0x000000, 0)
      .setInteractive({ useHandCursor: true });

    hitArea.on('pointerdown', () => {
      if (isInTeam) {
        const result = TeamSystem.removeFromTeam(this.state, entry.id);
        if (result.success) {
          SaveSystem.save(this.state);
          this.scene.restart({ state: this.state });
        }
      } else {
        const result = TeamSystem.addToTeam(this.state, entry.id, 5);
        if (result.success) {
          SaveSystem.save(this.state);
          this.scene.restart({ state: this.state });
        }
      }
    });

    hitArea.on('pointerover', () => {
      img.setScale(img.scaleX * 1.1, img.scaleY * 1.1);
    });
    hitArea.on('pointerout', () => {
      img.setScale(img.scaleX / 1.1, img.scaleY / 1.1);
    });
  }

  createTeamPanel(width, height) {
    const panelY = height - 220;
    const panelH = 180;

    // Panel background
    this.add.rectangle(width / 2, panelY, width - 100, panelH, 0x0a0e1a, 0.8)
      .setStrokeStyle(2, 0x66e0c0, 0.5);

    // Title
    this.add.text(60, panelY - panelH / 2 + 25, `YOUR TEAM (${this.state.team.length}/5)`, {
      fontFamily: 'monospace', fontSize: '22px', color: '#66e0c0',
      fontStyle: 'bold', stroke: '#000000', strokeThickness: 3
    }).setOrigin(0, 0.5);

    // Power score
    const power = TeamSystem.getTeamPower(this.state);
    this.add.text(width - 60, panelY - panelH / 2 + 25, `POWER: ${power.toLocaleString()}`, {
      fontFamily: 'monospace', fontSize: '22px', color: '#ffd966',
      fontStyle: 'bold', stroke: '#000000', strokeThickness: 3
    }).setOrigin(1, 0.5);

    // Team slots
    const slotSize = 90;
    const slotSpacing = 20;
    const slotsY = panelY + 10;
    const totalSlotsW = 5 * slotSize + 4 * slotSpacing;
    const startSlotX = width / 2 - totalSlotsW / 2 + slotSize / 2;

    for (let i = 0; i < 5; i++) {
      const x = startSlotX + i * (slotSize + slotSpacing);
      const charId = this.state.team[i];

      if (charId) {
        const char = getCharacterById(charId);
        const element = ELEMENTS[char.element];

        this.add.rectangle(x, slotsY, slotSize, slotSize, 0x1a2030)
          .setStrokeStyle(2, element.glow);

        const img = this.add.image(x, slotsY, char.key);
        img.setDisplaySize(slotSize - 15, slotSize - 15);

        // Remove button
        const removeBtn = this.add.circle(x + slotSize / 2 - 12, slotsY - slotSize / 2 + 12, 12, 0xff5555)
          .setInteractive({ useHandCursor: true });

        this.add.text(x + slotSize / 2 - 12, slotsY - slotSize / 2 + 12, '×', {
          fontFamily: 'monospace', fontSize: '18px', color: '#ffffff',
          fontStyle: 'bold'
        }).setOrigin(0.5);

        removeBtn.on('pointerdown', () => {
          const result = TeamSystem.removeFromTeam(this.state, charId);
          if (result.success) {
            SaveSystem.save(this.state);
            this.scene.restart({ state: this.state });
          }
        });
      } else {
        this.add.rectangle(x, slotsY, slotSize, slotSize, 0x0a0e1a, 0.5)
          .setStrokeStyle(2, 0x333333, 0.5);

        this.add.text(x, slotsY, '+', {
          fontFamily: 'monospace', fontSize: '36px', color: '#444444'
        }).setOrigin(0.5);
      }
    }

    // Action buttons
    const btnY = panelY + 85;
    const btnW = 180;
    const btnH = 44;
    const btnSpacing = 20;
    const btnStartX = width / 2 - (3 * btnW + 2 * btnSpacing) / 2 + btnW / 2;

    this.createActionButton(btnStartX, btnY, btnW, btnH, 'AUTO', 0x66e0c0, () => {
      this.state.team = TeamSystem.autoPickTeam(this.state, 3);
      SaveSystem.save(this.state);
      this.scene.restart({ state: this.state });
    });

    this.createActionButton(btnStartX + btnW + btnSpacing, btnY, btnW, btnH, 'CLEAR', 0xff5555, () => {
      if (this.state.team.length > 1) {
        this.state.team = [this.state.team[0]];
        SaveSystem.save(this.state);
        this.scene.restart({ state: this.state });
      }
    });

    this.createActionButton(btnStartX + 2 * (btnW + btnSpacing), btnY, btnW, btnH, 'DONE', 0xffd966, () => {
      SaveSystem.save(this.state);
      this.scene.start('MainScene');
    });
  }

  createActionButton(x, y, w, h, label, color, onClick) {
    const btn = this.add.rectangle(x, y, w, h, 0x1a2030)
      .setStrokeStyle(2, color)
      .setInteractive({ useHandCursor: true });

    this.add.text(x, y, label, {
      fontFamily: 'monospace', fontSize: '18px',
      color: '#' + color.toString(16).padStart(6, '0'),
      fontStyle: 'bold', letterSpacing: 2
    }).setOrigin(0.5);

    btn.on('pointerover', () => btn.setFillStyle(color, 0.2));
    btn.on('pointerout', () => btn.setFillStyle(0x1a2030, 1));
    btn.on('pointerdown', onClick);
  }

  createBackButton(width, height) {
    const btn = this.add.rectangle(120, 50, 180, 50, 0x1a2030)
      .setStrokeStyle(2, 0x8899aa)
      .setInteractive({ useHandCursor: true });

    this.add.text(120, 50, '← BACK', {
      fontFamily: 'monospace', fontSize: '18px', color: '#8899aa',
      fontStyle: 'bold', letterSpacing: 3
    }).setOrigin(0.5);

    btn.on('pointerover', () => btn.setFillStyle(0x8899aa, 0.2));
    btn.on('pointerout', () => btn.setFillStyle(0x1a2030));
    btn.on('pointerdown', () => {
      SaveSystem.save(this.state);
      this.scene.start('MainScene');
    });
  }
}
