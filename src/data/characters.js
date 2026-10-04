export const ELEMENTS = {
  EARTH:    { name: 'Earth',    color: 0x8b6f47, glow: 0xc9a876 },
  ICE:      { name: 'Ice',      color: 0x66e0c0, glow: 0xa8fff0 },
  METAL:    { name: 'Metal',    color: 0x8899aa, glow: 0xc0d0e0 },
  SHADOW:   { name: 'Shadow',   color: 0x6a4a9a, glow: 0xb090ff },
  ELECTRIC: { name: 'Electric', color: 0x4dd0e1, glow: 0xa0f0ff },
  NATURE:   { name: 'Nature',   color: 0x6a9a4a, glow: 0xa0e070 },
  FIRE:     { name: 'Fire',     color: 0xff8844, glow: 0xffc080 }
};

export const ROLES = {
  TANK:       'Tank',
  DPS:        'DPS',
  SUPPORT:    'Support',
  ASSASSIN:   'Assassin',
  MAGE:       'Mage',
  HEALER:     'Healer',
  CONTROLLER: 'Controller',
  RANGER:     'Ranger'
};

export const CHARACTERS = [
  { id: 1,  key: 'char-01', name: 'Terranox', element: 'EARTH',    role: 'TANK',       hp: 1200, atk: 80,  def: 150, spd: 60,  rarity: 3, spriteScale: 1.15 },
  { id: 2,  key: 'char-02', name: 'Glacius',  element: 'ICE',      role: 'SUPPORT',    hp: 800,  atk: 70,  def: 90,  spd: 80,  rarity: 3, spriteScale: 1.0 },
  { id: 3,  key: 'char-03', name: 'Ferrum',   element: 'METAL',    role: 'DPS',        hp: 900,  atk: 140, def: 100, spd: 90,  rarity: 4, spriteScale: 1.0 },
  { id: 4,  key: 'char-04', name: 'Umbra',    element: 'SHADOW',   role: 'ASSASSIN',   hp: 700,  atk: 170, def: 60,  spd: 130, rarity: 4, spriteScale: 1.05 },
  { id: 5,  key: 'char-05', name: 'Voltik',   element: 'ELECTRIC', role: 'MAGE',       hp: 750,  atk: 160, def: 70,  spd: 110, rarity: 4, spriteScale: 1.0 },
  { id: 6,  key: 'char-06', name: 'Sylvan',   element: 'NATURE',   role: 'HEALER',     hp: 850,  atk: 60,  def: 85,  spd: 85,  rarity: 3, spriteScale: 1.0 },
  { id: 7,  key: 'char-07', name: 'Noctis',   element: 'SHADOW',   role: 'CONTROLLER', hp: 780,  atk: 130, def: 75,  spd: 115, rarity: 4, spriteScale: 1.0 },
  { id: 8,  key: 'char-08', name: 'Aegis',    element: 'METAL',    role: 'TANK',       hp: 1300, atk: 75,  def: 160, spd: 55,  rarity: 5, spriteScale: 1.0 },
  { id: 9,  key: 'char-09', name: 'Verdant',  element: 'NATURE',   role: 'SUPPORT',    hp: 820,  atk: 90,  def: 95,  spd: 95,  rarity: 3, spriteScale: 1.0 },
  { id: 10, key: 'char-10', name: 'Pyra',     element: 'FIRE',     role: 'DPS',        hp: 880,  atk: 155, def: 80,  spd: 105, rarity: 4, spriteScale: 1.0 },
  { id: 11, key: 'char-11', name: 'Cryos',    element: 'ICE',      role: 'RANGER',     hp: 800,  atk: 145, def: 85,  spd: 100, rarity: 3, spriteScale: 1.0 },
  { id: 12, key: 'char-12', name: 'Nyx',      element: 'SHADOW',   role: 'MAGE',       hp: 760,  atk: 165, def: 70,  spd: 108, rarity: 5, spriteScale: 1.0 }
];

export function getCharacterById(id) {
  return CHARACTERS.find(c => c.id === id);
}

export function getRandomCharacter() {
  return CHARACTERS[Math.floor(Math.random() * CHARACTERS.length)];
}
