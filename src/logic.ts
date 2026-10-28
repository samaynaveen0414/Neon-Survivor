export type Weapon = "pulse" | "scatter" | "lance";
export interface Stats {
  maxHp: number;
  hp: number;
  speed: number;
  damage: number;
  fireRate: number;
  magnet: number;
  weapon: Weapon;
}
export const initialStats = (): Stats => ({
  maxHp: 100,
  hp: 100,
  speed: 235,
  damage: 22,
  fireRate: 1,
  magnet: 85,
  weapon: "pulse",
});
export const waveAt = (seconds: number) =>
  Math.min(10, 1 + Math.floor(seconds / 35));
// Progress depends only on collected XP; later levels need more kills.
export const xpNeeded = (level: number) => 60 + level * 25;
export function damage(
  s: Stats,
  amount: number,
  invulnerable: boolean,
): boolean {
  if (invulnerable || s.hp <= 0) return false;
  s.hp = Math.max(0, s.hp - amount);
  return true;
}
export const upgrades = [
  {
    id: "power",
    name: "Overcharge",
    text: "+25% weapon damage",
    apply: (s: Stats) => {
      s.damage *= 1.25;
    },
  },
  {
    id: "rapid",
    name: "Quick circuit",
    text: "+20% firing speed",
    apply: (s: Stats) => {
      s.fireRate *= 1.2;
    },
  },
  {
    id: "armor",
    name: "Second wind",
    text: "+20 max health · heal 35",
    apply: (s: Stats) => {
      s.maxHp += 20;
      s.hp = Math.min(s.maxHp, s.hp + 35);
    },
  },
  {
    id: "speed",
    name: "Ghost steps",
    text: "+12% movement speed",
    apply: (s: Stats) => {
      s.speed *= 1.12;
    },
  },
  {
    id: "magnet",
    name: "Gravity well",
    text: "+65 pickup range · heal 15",
    apply: (s: Stats) => {
      s.magnet += 65;
      s.hp = Math.min(s.maxHp, s.hp + 15);
    },
  },
  {
    id: "pulse",
    name: "Pulse driver",
    text: "Equip precise, rapid plasma bolts",
    apply: (s: Stats) => {
      s.weapon = "pulse";
    },
  },
  {
    id: "scatter",
    name: "Prism shotgun",
    text: "Equip a wide five-shot spread",
    apply: (s: Stats) => {
      s.weapon = "scatter";
    },
  },
  {
    id: "lance",
    name: "Ion lance",
    text: "Equip piercing, high-power beams",
    apply: (s: Stats) => {
      s.weapon = "lance";
    },
  },
];
export function choices(s: Stats) {
  return upgrades
    .filter((u) => u.id !== s.weapon)
    .sort(() => Math.random() - 0.5)
    .slice(0, 3);
}
export function direction(x: number, y: number) {
  const n = Math.hypot(x, y);
  return n ? { x: x / n, y: y / n } : { x: 0, y: 0 };
}
