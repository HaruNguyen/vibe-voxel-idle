const SAVE_KEY = 'vibe-voxel-idle-save-v1';

export const SaveSystem = {
  defaultState() {
    return {
      gold: 0,
      gems: 0,
      stage: 1,
      lastOnline: Date.now(),
      roster: [
        { id: 1, level: 1, stars: 1 },
        { id: 2, level: 1, stars: 1 },
        { id: 6, level: 1, stars: 1 }
      ],
      team: [1, 2, 6],
      totalBattles: 0,
      totalWins: 0
    };
  },

  load() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return this.defaultState();
      const data = JSON.parse(raw);
      return { ...this.defaultState(), ...data };
    } catch (e) {
      console.warn('Save load failed, using default', e);
      return this.defaultState();
    }
  },

  save(state) {
    try {
      state.lastOnline = Date.now();
      localStorage.setItem(SAVE_KEY, JSON.stringify(state));
    } catch (e) {
      console.warn('Save failed', e);
    }
  },

  reset() {
    localStorage.removeItem(SAVE_KEY);
  }
};
