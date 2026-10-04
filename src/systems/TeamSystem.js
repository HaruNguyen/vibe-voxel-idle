import { getCharacterById, CHARACTERS } from '../data/characters.js';

export const ELEMENT_FILTERS = [
  { key: 'ALL',      name: 'All',      color: 0xffffff },
  { key: 'EARTH',    name: 'Earth',    color: 0x8b6f47 },
  { key: 'ICE',      name: 'Ice',      color: 0x66e0c0 },
  { key: 'METAL',    name: 'Metal',    color: 0x8899aa },
  { key: 'SHADOW',   name: 'Shadow',   color: 0x6a4a9a },
  { key: 'ELECTRIC', name: 'Electric', color: 0x4dd0e1 },
  { key: 'NATURE',   name: 'Nature',   color: 0x6a9a4a },
  { key: 'FIRE',     name: 'Fire',     color: 0xff8844 }
];

export const SORT_MODES = [
  { key: 'POWER', name: 'Power' },
  { key: 'LEVEL', name: 'Level' },
  { key: 'RARITY', name: 'Rarity' },
  { key: 'NAME', name: 'Name' }
];

export const TeamSystem = {
  // Calculate total power of a character based on stats + upgrades + level
  calculatePower(entry) {
    const char = getCharacterById(entry.id);
    if (!char) return 0;

    // Base stats
    let hp = char.hp;
    let atk = char.atk;
    let def = char.def;
    let spd = char.spd;

    // Apply upgrades
    if (entry.upgrades) {
      const hpMult = 1 + (entry.upgrades.HP || 0) * 0.10;
      const atkMult = 1 + (entry.upgrades.ATK || 0) * 0.08;
      const defMult = 1 + (entry.upgrades.DEF || 0) * 0.08;
      const spdMult = 1 + (entry.upgrades.SPD || 0) * 0.05;
      hp = Math.floor(hp * hpMult);
      atk = Math.floor(atk * atkMult);
      def = Math.floor(def * defMult);
      spd = Math.floor(spd * spdMult);
    }

    // Apply level bonus
    const levelMult = 1 + (entry.level - 1) * 0.15;
    hp = Math.floor(hp * levelMult);
    atk = Math.floor(atk * levelMult);
    def = Math.floor(def * levelMult);

    // Apply stars
    const starMult = 1 + (entry.stars - 1) * 0.1;
    hp = Math.floor(hp * starMult);
    atk = Math.floor(atk * starMult);
    def = Math.floor(def * starMult);

    // Power formula
    return Math.floor(hp * 0.1 + atk * 2 + def * 1.5 + spd * 1);
  },

  // Get total power of team
  getTeamPower(state) {
    return state.team.reduce((sum, id) => {
      const entry = state.roster.find(r => r.id === id);
      if (!entry) return sum;
      return sum + this.calculatePower(entry);
    }, 0);
  },

  // Filter roster by element
  filterRoster(roster, elementFilter) {
    if (elementFilter === 'ALL') return roster;
    return roster.filter(entry => {
      const char = getCharacterById(entry.id);
      return char && char.element === elementFilter;
    });
  },

  // Sort roster
  sortRoster(roster, sortMode) {
    const sorted = [...roster];
    switch (sortMode) {
      case 'POWER':
        return sorted.sort((a, b) => this.calculatePower(b) - this.calculatePower(a));
      case 'LEVEL':
        return sorted.sort((a, b) => b.level - a.level);
      case 'RARITY':
        return sorted.sort((a, b) => {
          const charA = getCharacterById(a.id);
          const charB = getCharacterById(b.id);
          return (charB?.rarity || 0) - (charA?.rarity || 0);
        });
      case 'NAME':
        return sorted.sort((a, b) => {
          const charA = getCharacterById(a.id);
          const charB = getCharacterById(b.id);
          return (charA?.name || '').localeCompare(charB?.name || '');
        });
      default:
        return sorted;
    }
  },

  // Auto-pick best team from roster
  autoPickTeam(state, teamSize = 3) {
    const sorted = this.sortRoster(state.roster, 'POWER');
    return sorted.slice(0, teamSize).map(entry => entry.id);
  },

  // Check if character is in team
  isInTeam(state, charId) {
    return state.team.includes(charId);
  },

  // Add character to team (if not full)
  addToTeam(state, charId, maxTeamSize = 5) {
    if (state.team.includes(charId)) return { success: false, reason: 'Already in team' };
    if (state.team.length >= maxTeamSize) return { success: false, reason: 'Team is full' };
    state.team.push(charId);
    return { success: true };
  },

  // Remove character from team
  removeFromTeam(state, charId) {
    const idx = state.team.indexOf(charId);
    if (idx === -1) return { success: false, reason: 'Not in team' };
    if (state.team.length <= 1) return { success: false, reason: 'Team needs at least 1' };
    state.team.splice(idx, 1);
    return { success: true };
  }
};
