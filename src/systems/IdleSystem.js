const GOLD_PER_SECOND = 0.5;
const MAX_OFFLINE_HOURS = 12;

export const IdleSystem = {
  calculateOfflineReward(state) {
    const now = Date.now();
    const elapsedMs = now - (state.lastOnline || now);
    const elapsedSec = Math.max(0, elapsedMs / 1000);
    const maxSec = MAX_OFFLINE_HOURS * 3600;
    const cappedSec = Math.min(elapsedSec, maxSec);
    const gold = Math.floor(cappedSec * GOLD_PER_SECOND);

    return {
      seconds: Math.floor(elapsedSec),
      cappedSeconds: Math.floor(cappedSec),
      gold,
      capped: elapsedSec > maxSec
    };
  },

  markOffline(state) {
    state.lastOnline = Date.now();
    return state;
  }
};
