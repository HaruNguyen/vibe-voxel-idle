import { getCharacterById } from '../data/characters.js';
import { UpgradeSystem } from './UpgradeSystem.js';

const ADVANTAGE = {
  EARTH:    { ELECTRIC: 1.5, NATURE: 0.75 },
  ICE:      { NATURE: 1.5, FIRE: 0.75 },
  METAL:    { ICE: 1.5, ELECTRIC: 0.75 },
  SHADOW:   { METAL: 1.5, NATURE: 0.75 },
  ELECTRIC: { ICE: 1.5, EARTH: 0.75 },
  NATURE:   { EARTH: 1.5, FIRE: 0.75 },
  FIRE:     { METAL: 1.5, ICE: 0.75 }
};

export function getElementMultiplier(atkElement, defElement) {
  if (ADVANTAGE[atkElement] && ADVANTAGE[atkElement][defElement]) {
    return ADVANTAGE[atkElement][defElement];
  }
  return 1.0;
}

export function createUnit(charId, level, team, rosterEntry = null) {
  const char = getCharacterById(charId);
  const levelBonus = 1 + (level - 1) * 0.15;

  let unit = {
    ...char,
    level,
    team,
    maxHp: Math.floor(char.hp * levelBonus),
    hp: Math.floor(char.hp * levelBonus),
    atk: Math.floor(char.atk * levelBonus),
    def: Math.floor(char.def * levelBonus),
    spd: char.spd,
    alive: true
  };

  // Apply upgrades if rosterEntry provided
  if (rosterEntry) {
    unit = UpgradeSystem.applyUpgrades(unit, rosterEntry);
  }

  return unit;
}

function performAttack(attacker, defender) {
  const mult = getElementMultiplier(attacker.element, defender.element);
  const baseDamage = attacker.atk * mult;
  const mitigated = baseDamage * (100 / (100 + defender.def));
  const variance = 0.9 + Math.random() * 0.2;
  const damage = Math.max(1, Math.floor(mitigated * variance));

  defender.hp -= damage;
  if (defender.hp <= 0) {
    defender.hp = 0;
    defender.alive = false;
  }
  return damage;
}

export function simulateBattle(teamA, teamB) {
  const log = [];
  let turn = 0;
  const maxTurns = 200;

  const unitsA = teamA.map(u => ({ ...u }));
  const unitsB = teamB.map(u => ({ ...u }));

  while (turn < maxTurns) {
    const allUnits = [...unitsA, ...unitsB]
      .filter(u => u.alive)
      .sort((a, b) => b.spd - a.spd);

    if (unitsA.every(u => !u.alive)) {
      log.push({ type: 'end', winner: 'B' });
      break;
    }
    if (unitsB.every(u => !u.alive)) {
      log.push({ type: 'end', winner: 'A' });
      break;
    }

    for (const unit of allUnits) {
      if (!unit.alive) continue;

      const enemies = (unit.team === 'A' ? unitsB : unitsA).filter(u => u.alive);
      if (enemies.length === 0) break;

      const target = enemies[Math.floor(Math.random() * enemies.length)];
      const damage = performAttack(unit, target);

      log.push({
        type: 'attack',
        attackerId: unit.id,
        attackerTeam: unit.team,
        targetId: target.id,
        targetTeam: target.team,
        damage,
        targetHp: target.hp,
        targetAlive: target.alive
      });

      if (!target.alive) {
        log.push({ type: 'ko', unitId: target.id, team: target.team });
      }
    }

    turn++;
  }

  let winner = 'draw';
  if (unitsA.some(u => u.alive) && !unitsB.some(u => u.alive)) winner = 'A';
  else if (unitsB.some(u => u.alive) && !unitsA.some(u => u.alive)) winner = 'B';

  return { log, winner, teamA: unitsA, teamB: unitsB };
}

export function generateEnemyTeam(stage) {
  const count = Math.min(3 + Math.floor(stage / 5), 5);
  const baseLevel = 1 + Math.floor(stage / 2);
  const team = [];

  for (let i = 0; i < count; i++) {
    const charId = 1 + Math.floor(Math.random() * 12);
    const level = baseLevel + Math.floor(Math.random() * 3);
    team.push(createUnit(charId, level, 'B'));
  }
  return team;
}
