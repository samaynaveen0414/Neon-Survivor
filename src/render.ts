import { createBackdrop } from "./backdrop";
import type { Game } from "./game";
import type { Settings } from "./save";
export class Renderer {
  ctx: CanvasRenderingContext2D;
  backdrop = createBackdrop();
  constructor(public canvas: HTMLCanvasElement) {
    this.ctx = canvas.getContext("2d")!;
    window.addEventListener("resize", () => this.resize());
    this.resize();
  }
  resize() {
    const r = this.canvas.getBoundingClientRect(),
      d = Math.min(2, devicePixelRatio || 1);
    this.canvas.width = Math.round(r.width * d);
    this.canvas.height = Math.round(r.height * d);
  }
  draw(g: Game | undefined, s: Settings) {
    const c = this.ctx;
    c.setTransform(
      this.canvas.width / 1200,
      0,
      0,
      this.canvas.height / 760,
      0,
      0,
    );
    c.drawImage(this.backdrop, 0, 0);
    c.save();
    if (g && s.shake && !s.reduced && g.shake)
      c.translate(
        (Math.random() - 0.5) * g.shake,
        (Math.random() - 0.5) * g.shake,
      );
    c.strokeStyle = "#14233340";
    c.lineWidth = 1;
    c.beginPath();
    for (let x = 0; x <= 1200; x += 40) {
      c.moveTo(x, 0);
      c.lineTo(x, 760);
    }
    for (let y = 0; y <= 760; y += 40) {
      c.moveTo(0, y);
      c.lineTo(1200, y);
    }
    c.stroke();
    const gradient = c.createRadialGradient(600, 380, 80, 600, 380, 700);
    gradient.addColorStop(0, "#112d3828");
    gradient.addColorStop(1, "#02040b40");
    c.fillStyle = gradient;
    c.fillRect(0, 0, 1200, 760);
    c.strokeStyle = "#235464";
    c.strokeRect(12, 58, 1176, 690);
    c.fillStyle = "#4b6e7d";
    c.font = "11px monospace";
    c.fillText("SECTOR 07 / THE LAST SIGNAL", 32, 728);
    c.textAlign = "right";
    c.fillText("SURVIVE · EVOLVE · OVERCOME", 1168, 728);
    c.textAlign = "left";
    if (!g) {
      c.restore();
      return;
    }
    for (const gem of g.gems) {
      c.fillStyle = "#58eeb7";
      c.beginPath();
      c.moveTo(gem.x, gem.y - 5);
      c.lineTo(gem.x + 4, gem.y);
      c.lineTo(gem.x, gem.y + 5);
      c.lineTo(gem.x - 4, gem.y);
      c.fill();
    }
    for (const e of g.enemies) {
      c.save();
      c.translate(e.x, e.y);
      c.strokeStyle = e.flash
        ? "#fff"
        : e.type === 3
          ? "#ffc765"
          : e.type === 2
            ? "#b68cff"
            : e.type === 1
              ? "#ffc765"
              : "#ff587c";
      c.fillStyle = e.flash
        ? "#fff"
        : e.type === 3
          ? "#39231b"
          : e.type === 2
            ? "#271e42"
            : "#361525";
      c.lineWidth = 2;
      c.beginPath();
      const n = e.type === 0 ? 4 : e.type === 1 ? 3 : e.type === 2 ? 6 : 8;
      for (let i = 0; i < n; i++) {
        const a =
          (i * Math.PI * 2) / n + (e.type === 0 ? Math.PI / 4 : -Math.PI / 2);
        const x = Math.cos(a) * e.r,
          y = Math.sin(a) * e.r;
        i ? c.lineTo(x, y) : c.moveTo(x, y);
      }
      c.closePath();
      c.fill();
      c.stroke();
      c.fillStyle = c.strokeStyle;
      c.fillRect(-3, -3, 6, 6);
      if (e.hp < e.max) {
        c.fillStyle = "#293242";
        c.fillRect(-e.r, -e.r - 10, e.r * 2, 3);
        c.fillStyle = "#ff668c";
        c.fillRect(-e.r, -e.r - 10, (e.r * 2 * e.hp) / e.max, 3);
      }
      c.restore();
    }
    for (const b of g.bullets) {
      c.strokeStyle = b.enemy
        ? "#c69aff"
        : g.stats.weapon === "scatter"
          ? "#ffc765"
          : "#6ffff0";
      c.lineWidth = b.enemy ? 6 : b.pierce ? 4 : 3;
      c.beginPath();
      c.moveTo(b.x, b.y);
      const l = b.pierce ? 0.035 : 0.012;
      c.lineTo(b.x - b.vx * l, b.y - b.vy * l);
      c.stroke();
    }
    if (!s.reduced)
      for (const p of g.sparks) {
        c.globalAlpha = Math.max(0, p.life / 0.35);
        c.fillStyle = p.color;
        c.fillRect(p.x, p.y, 3, 3);
      }
    c.globalAlpha = 1;
    c.save();
    c.translate(g.x, g.y);
    c.rotate(Math.atan2(g.input.mouse.y - g.y, g.input.mouse.x - g.x));
    c.globalAlpha = g.inv > 0 && Math.floor(g.inv * 16) % 2 ? 0.4 : 1;
    c.shadowColor = "#5cffe1";
    c.shadowBlur = s.reduced ? 0 : 14;
    c.fillStyle = g.dashTime > 0 ? "#fff" : "#5cffe1";
    c.beginPath();
    c.moveTo(20, 0);
    c.lineTo(-11, -12);
    c.lineTo(-6, 0);
    c.lineTo(-11, 12);
    c.closePath();
    c.fill();
    c.shadowBlur = 0;
    c.fillStyle = "#123d42";
    c.fillRect(-5, -3, 10, 6);
    c.restore();
    c.strokeStyle = "#76b9bc";
    c.lineWidth = 1;
    const m = g.input.mouse;
    c.beginPath();
    c.arc(m.x, m.y, 8, 0, Math.PI * 2);
    c.moveTo(m.x - 12, m.y);
    c.lineTo(m.x - 5, m.y);
    c.moveTo(m.x + 5, m.y);
    c.lineTo(m.x + 12, m.y);
    c.stroke();
    const boss = g.enemies.find((e) => e.type === 3);
    if (boss) {
      c.fillStyle = "#101622";
      c.fillRect(350, 85, 500, 26);
      c.fillStyle = "#ffc765";
      c.fillRect(354, 89, (492 * boss.hp) / boss.max, 18);
      c.fillStyle = "#fff";
      c.font = "bold 11px monospace";
      c.textAlign = "center";
      c.fillText("THE NULL ENGINE", 600, 102);
      c.textAlign = "left";
    }
    c.restore();
  }
}
