import {
  initialStats,
  damage,
  direction,
  waveAt,
  xpNeeded,
  choices,
  type Stats,
} from "./logic";
import type { Input } from "./input";
import type { Audio } from "./audio";
export interface Enemy {
  id: number;
  x: number;
  y: number;
  hp: number;
  max: number;
  r: number;
  type: number;
  timer: number;
  flash: number;
}
export interface Bullet {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  damage: number;
  enemy: boolean;
  pierce: boolean;
  hit: Set<number>;
}
export interface Spark {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
}
export class Game {
  stats: Stats = initialStats();
  x = 600;
  y = 380;
  time = 0;
  level = 1;
  xp = 0;
  score = 0;
  kills = 0;
  wave = 1;
  inv = 0;
  dashCd = 0;
  dashTime = 0;
  dashX = 0;
  dashY = 0;
  shotCd = 0;
  spawn = 1;
  id = 0;
  bossSpawned = false;
  shake = 0;
  ended = false;
  enemies: Enemy[] = [];
  bullets: Bullet[] = [];
  gems: { x: number; y: number; value: number }[] = [];
  sparks: Spark[] = [];
  constructor(
    public input: Input,
    public audio: Audio,
    public onLevel: (options: ReturnType<typeof choices>) => void,
    public onEnd: (win: boolean) => void,
  ) {}
  burst(x: number, y: number, color: string, n = 6) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2,
        s = 40 + Math.random() * 140;
      this.sparks.push({
        x,
        y,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s,
        life: 0.35,
        color,
      });
    }
    if (this.sparks.length > 180)
      this.sparks.splice(0, this.sparks.length - 180);
  }
  hurt(n: number) {
    if (damage(this.stats, n, this.inv > 0)) {
      this.inv = 0.85;
      this.shake = 7;
      this.audio.play("hurt");
      this.burst(this.x, this.y, "#ff527d", 12);
      if (this.stats.hp <= 0) {
        this.ended = true;
        this.onEnd(false);
      }
    }
  }
  addEnemy(type: number) {
    const a = Math.random() * Math.PI * 2;
    const r = type === 3 ? 42 : type === 2 ? 19 : type === 1 ? 12 : 16;
    const hp =
      type === 3
        ? 5200
        : (type === 2 ? 65 : type === 1 ? 24 : 38) *
          (1 + (this.wave - 1) * 0.16);
    this.enemies.push({
      id: this.id++,
      x: 600 + Math.cos(a) * 740,
      y: 380 + Math.sin(a) * 500,
      hp,
      max: hp,
      r,
      type,
      timer: 1.5 + Math.random(),
      flash: 0,
    });
  }
  fire(a: number, enemy = false, x = this.x, y = this.y) {
    const weapon = this.stats.weapon;
    const count = !enemy && weapon === "scatter" ? 5 : 1;
    for (let i = 0; i < count; i++) {
      const angle = a + (i - (count - 1) / 2) * 0.14;
      this.bullets.push({
        x,
        y,
        vx: Math.cos(angle) * (enemy ? 220 : weapon === "lance" ? 1000 : 680),
        vy: Math.sin(angle) * (enemy ? 220 : weapon === "lance" ? 1000 : 680),
        life: enemy ? 5 : weapon === "scatter" ? 0.58 : 1.35,
        damage: enemy
          ? 12
          : this.stats.damage *
            (weapon === "scatter" ? 0.6 : weapon === "lance" ? 2.3 : 1),
        enemy,
        pierce: !enemy && weapon === "lance",
        hit: new Set(),
      });
    }
  }
  update(dt: number) {
    if (this.ended) return;
    this.time += dt;
    this.wave = waveAt(this.time);
    this.inv = Math.max(0, this.inv - dt);
    this.dashCd = Math.max(0, this.dashCd - dt);
    this.dashTime = Math.max(0, this.dashTime - dt);
    this.shotCd -= dt;
    this.shake = Math.max(0, this.shake - dt * 22);
    const k = this.input.keys;
    let d = direction(
      Number(k.has("KeyD") || k.has("ArrowRight")) -
        Number(k.has("KeyA") || k.has("ArrowLeft")),
      Number(k.has("KeyS") || k.has("ArrowDown")) -
        Number(k.has("KeyW") || k.has("ArrowUp")),
    );
    if (this.input.dash && this.dashCd === 0) {
      if (!d.x && !d.y)
        d = direction(this.input.mouse.x - this.x, this.input.mouse.y - this.y);
      this.dashX = d.x;
      this.dashY = d.y;
      this.dashTime = 0.18;
      this.dashCd = 3;
      this.inv = Math.max(this.inv, 0.22);
      this.audio.play("dash");
      this.burst(this.x, this.y, "#5fffe0");
    }
    this.input.dash = false;
    if (this.dashTime > 0) d = { x: this.dashX, y: this.dashY };
    this.x = Math.max(
      22,
      Math.min(
        1178,
        this.x + d.x * this.stats.speed * dt * (this.dashTime > 0 ? 3.6 : 1),
      ),
    );
    this.y = Math.max(
      70,
      Math.min(
        738,
        this.y + d.y * this.stats.speed * dt * (this.dashTime > 0 ? 3.6 : 1),
      ),
    );
    if (this.input.shooting && this.shotCd <= 0) {
      this.fire(
        Math.atan2(this.input.mouse.y - this.y, this.input.mouse.x - this.x),
      );
      this.shotCd =
        (this.stats.weapon === "scatter"
          ? 0.56
          : this.stats.weapon === "lance"
            ? 0.62
            : 0.18) / this.stats.fireRate;
      this.audio.play("shot");
    }
    this.spawn -= dt;
    if (this.spawn <= 0 && this.time < 315) {
      this.addEnemy(
        this.wave < 2
          ? 0
          : Math.random() < 0.25
            ? 2
            : Math.random() < 0.35
              ? 1
              : 0,
      );
      this.spawn = Math.max(0.24, 1.65 - this.wave * 0.145);
    }
    if (this.time >= 315 && !this.bossSpawned) {
      this.bossSpawned = true;
      this.addEnemy(3);
    }
    for (const e of this.enemies) {
      if (e.hp <= 0) continue;
      e.flash = Math.max(0, e.flash - dt);
      e.timer -= dt;
      const v = direction(this.x - e.x, this.y - e.y),
        dist = Math.hypot(this.x - e.x, this.y - e.y);
      const speed =
        e.type === 3
          ? 44
          : e.type === 2
            ? dist < 280
              ? -28
              : 48
            : e.type === 1
              ? e.timer < 0.5
                ? 220
                : 102
              : 65 + this.wave * 3;
      e.x += v.x * speed * dt;
      e.y += v.y * speed * dt;
      if (e.type === 1 && e.timer <= 0) e.timer = 2.4;
      if ((e.type === 2 || e.type === 3) && e.timer <= 0) {
        if (e.type === 3) {
          for (let i = 0; i < 16; i++)
            this.fire((i * Math.PI) / 8 + this.time * 0.3, true, e.x, e.y);
          e.timer = 1.35;
        } else {
          this.fire(Math.atan2(v.y, v.x), true, e.x, e.y);
          e.timer = 2.6;
        }
      }
      if (dist < e.r + 13) this.hurt(e.type === 3 ? 25 : 15);
      if (this.ended) return;
    }
    for (const b of this.bullets) {
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.life -= dt;
      if (b.enemy) {
        if (Math.hypot(b.x - this.x, b.y - this.y) < 18) {
          this.hurt(b.damage);
          if (this.ended) return;
          b.life = 0;
        }
      } else
        for (const e of this.enemies) {
          if (e.hp <= 0 || b.hit.has(e.id)) continue;
          if (Math.hypot(b.x - e.x, b.y - e.y) < e.r + 5) {
            b.hit.add(e.id);
            e.hp -= b.damage;
            e.flash = 0.09;
            this.burst(b.x, b.y, e.type === 3 ? "#ffbb55" : "#ff527d", 3);
            if (!b.pierce) {
              b.life = 0;
            }
            if (e.hp <= 0) {
              this.kills++;
              this.score += e.type === 3 ? 5000 : 100 + e.type * 35;
              this.gems.push({ x: e.x, y: e.y, value: e.type === 3 ? 50 : 5 });
              this.audio.play("hit");
              if (e.type === 3) {
                this.ended = true;
                this.onEnd(true);
                return;
              }
            }
            if (!b.pierce) break;
          }
        }
    }
    this.enemies = this.enemies.filter((e) => e.hp > 0);
    this.bullets = this.bullets.filter(
      (b) => b.life > 0 && b.x > -200 && b.x < 1400 && b.y > -200 && b.y < 960,
    );
    for (const g of this.gems) {
      const dist = Math.hypot(g.x - this.x, g.y - this.y);
      if (dist < this.stats.magnet) {
        const v = direction(this.x - g.x, this.y - g.y);
        g.x += v.x * 420 * dt;
        g.y += v.y * 420 * dt;
      }
      if (dist < 22) {
        this.xp += g.value;
        this.score += g.value * 2;
        g.value = 0;
      }
    }
    this.gems = this.gems.filter((g) => g.value > 0);
    if (this.gems.length > 250) {
      const g = this.gems.shift()!;
      this.gems[0].value += g.value;
    }
    for (const p of this.sparks) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
    }
    this.sparks = this.sparks.filter((p) => p.life > 0);
    if (this.xp >= xpNeeded(this.level)) {
      this.xp -= xpNeeded(this.level);
      this.level++;
      this.audio.play("level");
      this.onLevel(choices(this.stats));
    }
  }
}
