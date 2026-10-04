// Upgrade system - dùng vàng để nâng cấp stats nhân vật

export const UPGRADE_TYPES = {
  HP:  { name: 'HP',  icon: '❤', color: 0xff5555, baseCost: 50,  statPerLevel: 0.10 },
  ATK: { name: 'ATK', icon: '⚔', color: 0xff8844, baseCost: 75,  statPerLevel: 0.08 },
  DEF: { name: 'DEF', icon: '🛡', color: 0x66e0c0, baseCost: 60,  statPerLevel: 0.08 },
  SPD: { name: 'SPD', icon: '⚡', color: 0xffd966, baseCost: 100, statPerLevel: 0.05 }
};

export const UpgradeSystem = {
  // Tính giá nâng cấp tiếp theo
  getCost(type, currentLevel) {
    const config = UPGRADE_TYPES[type];
    if (!config) return 0;
    // cost = baseCost * (1 + level * 0.5)^1.2
    const multiplier = Math.pow(1 + currentLevel * 0.5, 1.2);
    return Math.floor(config.baseCost * multiplier);
  },

  // Tính tổng vàng đã dùng để nâng 1 stat lên level N
  getTotalInvested(type, level) {
    let total = 0;
    for (let i = 0; i < level; i++) {
      total += this.getCost(type, i);
    }
    return total;
  },

  // Lấy stat multiplier từ upgrade level
  getStatMultiplier(type, level) {
    const config = UPGRADE_TYPES[type];
    if (!config) return 1.0;
    return 1.0 + level * config.statPerLevel;
  },

  // Nâng cấp 1 stat cho 1 nhân vật
  upgrade(state, charId, type) {
    const rosterEntry = state.roster.find(r => r.id === charId);
    if (!rosterEntry) return { success: false, reason: 'Character not found' };

    // Khởi tạo upgrades nếu chưa có
    if (!rosterEntry.upgrades) {
      rosterEntry.upgrades = { HP: 0, ATK: 0, DEF: 0, SPD: 0 };
    }

    const currentLevel = rosterEntry.upgrades[type] || 0;
    const cost = this.getCost(type, currentLevel);

    if (state.gold < cost) {
      return { success: false, reason: 'Not enough gold', cost };
    }

    state.gold -= cost;
    rosterEntry.upgrades[type] = currentLevel + 1;

    return { success: true, cost, newLevel: currentLevel + 1 };
  },

  // Áp dụng upgrade vào stats của unit khi battle
  applyUpgrades(unit, rosterEntry) {
    if (!rosterEntry || !rosterEntry.upgrades) return unit;

    const hpMult = this.getStatMultiplier('HP', rosterEntry.upgrades.HP || 0);
    const atkMult = this.getStatMultiplier('ATK', rosterEntry.upgrades.ATK || 0);
    const defMult = this.getStatMultiplier('DEF', rosterEntry.upgrades.DEF || 0);
    const spdMult = this.getStatMultiplier('SPD', rosterEntry.upgrades.SPD || 0);

    return {
      ...unit,
      maxHp: Math.floor(unit.maxHp * hpMult),
      hp: Math.floor(unit.maxHp * hpMult),
      atk: Math.floor(unit.atk * atkMult),
      def: Math.floor(unit.def * defMult),
      spd: Math.floor(unit.spd * spdMult)
    };
  }
};
