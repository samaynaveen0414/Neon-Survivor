import { test } from "node:test";
import assert from "node:assert/strict";
import {
  damage,
  initialStats,
  upgrades,
  waveAt,
  xpNeeded,
  direction,
  choices,
} from "./logic";
test("damage respects invulnerability, clamps health, and rejects dead targets", () => {
  const s = initialStats();
  assert.equal(damage(s, 30, true), false);
  assert.equal(s.hp, 100);
  assert.equal(damage(s, 30, false), true);
  assert.equal(s.hp, 70);
  damage(s, 200, false);
  assert.equal(s.hp, 0);
  assert.equal(damage(s, 10, false), false);
});
test("upgrades apply damage, healing cap, speed, and weapon replacement", () => {
  const s = initialStats();
  upgrades.find((u) => u.id === "power")!.apply(s);
  assert.equal(s.damage, 27.5);
  s.hp = 99;
  upgrades.find((u) => u.id === "armor")!.apply(s);
  assert.equal(s.maxHp, 120);
  assert.equal(s.hp, 120);
  upgrades.find((u) => u.id === "scatter")!.apply(s);
  assert.equal(s.weapon, "scatter");
  assert.equal(s.damage, 27.5);
});
test("waves advance at 35 second boundaries and cap at boss wave", () => {
  assert.equal(waveAt(0), 1);
  assert.equal(waveAt(34.99), 1);
  assert.equal(waveAt(35), 2);
  assert.equal(waveAt(315), 10);
  assert.equal(waveAt(900), 10);
});
test("diagonal movement is normalized and idle has no drift", () => {
  assert.equal(Math.hypot(...Object.values(direction(1, 1))), 1);
  assert.deepEqual(direction(0, 0), { x: 0, y: 0 });
});
test("level requirements increase and choices have unique applicable upgrades", () => {
  assert.ok(xpNeeded(4) > xpNeeded(3));
  const options = choices(initialStats());
  assert.equal(options.length, 3);
  assert.equal(new Set(options.map((u) => u.id)).size, 3);
  assert.ok(options.every((u) => u.id !== "pulse"));
});

import { Game } from "./game";
import type { Input } from "./input";
import type { Audio } from "./audio";
function harness() {
  const input = {
    keys: new Set<string>(),
    mouse: { x: 900, y: 380 },
    shooting: false,
    dash: false,
  } as Input;
  const events = { levels: 0, end: null as boolean | null };
  const g = new Game(
    input,
    { play() {} } as unknown as Audio,
    () => events.levels++,
    (win) => (events.end = win),
  );
  return { g, input, events };
}
test("movement is frame rate independent and dash retains its direction", () => {
  const a = harness(),
    b = harness();
  a.input.keys.add("KeyD");
  b.input.keys.add("KeyD");
  for (let i = 0; i < 120; i++) a.g.update(1 / 120);
  for (let i = 0; i < 60; i++) b.g.update(1 / 60);
  assert.ok(Math.abs(a.g.x - b.g.x) < 0.001);
  a.input.dash = true;
  a.g.update(1 / 120);
  assert.equal(a.g.dashCd, 3);
  assert.ok(a.g.inv > 0);
  const x = a.g.x;
  a.input.keys.clear();
  a.g.update(1 / 120);
  assert.ok(a.g.x > x);
});
test("shots kill, award score, and collected XP triggers level choice", () => {
  const { g, input, events } = harness();
  g.enemies.push({
    id: 42,
    x: 680,
    y: 380,
    r: 16,
    type: 0,
    hp: 10,
    max: 10,
    timer: 2,
    flash: 0,
  });
  input.shooting = true;
  for (let i = 0; i < 20; i++) g.update(1 / 120);
  assert.equal(g.kills, 1);
  assert.ok(g.score >= 100);
  g.gems.push({ x: g.x, y: g.y, value: xpNeeded(g.level) });
  g.update(1 / 120);
  assert.equal(events.levels, 1);
  assert.equal(g.level, 2);
});
test("weapon patterns differ and lance pierces", () => {
  const { g } = harness();
  g.stats.weapon = "scatter";
  g.fire(0);
  assert.equal(g.bullets.length, 5);
  assert.ok(g.bullets[0].vy < 0);
  g.bullets = [];
  g.stats.weapon = "lance";
  g.fire(0);
  assert.equal(g.bullets.length, 1);
  assert.ok(g.bullets[0].pierce);
  assert.ok(g.bullets[0].damage > g.stats.damage);
});
test("boss spawns once at 5:15 and boss death causes victory", () => {
  const { g, events } = harness();
  g.time = 315;
  g.spawn = 999;
  g.update(1 / 120);
  assert.equal(g.enemies.filter((e) => e.type === 3).length, 1);
  g.update(1 / 120);
  assert.equal(g.enemies.filter((e) => e.type === 3).length, 1);
  const boss = g.enemies[0];
  boss.x = 650;
  boss.y = 380;
  boss.hp = 1;
  g.fire(0);
  for (let i = 0; i < 20 && events.end === null; i++) g.update(1 / 120);
  assert.equal(events.end, true);
});
test("invulnerability blocks repeated hits and lethal damage ends run", () => {
  const { g, events } = harness();
  g.hurt(15);
  g.hurt(15);
  assert.equal(g.stats.hp, 85);
  g.inv = 0;
  g.hurt(200);
  assert.equal(events.end, false);
});

import { readSave, save } from "./save";
test("settings and best score persist; malformed storage recovers safely", () => {
  let stored = "";
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: {
      getItem: () => stored,
      setItem: (_key: string, value: string) => {
        stored = value;
      },
    },
  });
  const settings = { volume: 0.2, mute: true, shake: false, reduced: true };
  save(4321, settings);
  assert.deepEqual(readSave(), { best: 4321, settings });
  stored = "{broken";
  assert.equal(readSave().best, 0);
  stored = JSON.stringify({ best: -10, settings: { volume: 300 } });
  assert.equal(readSave().best, 0);
  assert.equal(readSave().settings.volume, 1);
});

test("leveling depends only on XP and triggers immediately without a timer", () => {
  const { g, events } = harness();
  g.spawn = 999;
  assert.equal(xpNeeded(1), 85);
  assert.equal(xpNeeded(2), 110);
  assert.equal(xpNeeded(3), 135);
  g.time = 100;
  g.xp = xpNeeded(1) - 1;
  g.update(1 / 120);
  assert.equal(events.levels, 0);
  g.gems.push({ x: g.x, y: g.y, value: 1 });
  g.update(1 / 120);
  assert.equal(events.levels, 1);
  assert.equal(g.xp, 0);
  // A second earned level is available on the next update, with no cooldown.
  g.xp = xpNeeded(2) + 7;
  g.update(1 / 120);
  assert.equal(events.levels, 2);
  assert.equal(g.xp, 7);
});

test("a new run can level immediately if sufficient XP is collected", () => {
  const {g, events} = harness();
  g.gems.push({x: g.x, y: g.y, value: xpNeeded(1)});
  g.update(1 / 120);
  assert.equal(g.level, 2);
  assert.equal(events.levels, 1);
  assert.ok(g.time < 1);
});
