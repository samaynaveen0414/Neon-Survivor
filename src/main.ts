import "./style.css";
import { Game } from "./game";
import { Renderer } from "./render";
import { Input } from "./input";
import { Audio } from "./audio";
import { readSave, save } from "./save";
import { xpNeeded, type choices } from "./logic";
const canvas = document.querySelector<HTMLCanvasElement>("#arena")!,
  overlay = document.querySelector<HTMLElement>("#overlay")!,
  hud = document.querySelector<HTMLElement>("#hud")!;
const data = readSave(),
  audio = new Audio(data.settings),
  renderer = new Renderer(canvas);
let game: Game | undefined;
let state:
  "menu" | "playing" | "paused" | "upgrade" | "ended" | "settings" | "help" =
  "menu";
const input = new Input(canvas, () => {
  if (state === "playing") pause();
  else if (state === "paused") resume();
  else if (state === "settings" || state === "help") menu();
});
function display(html: string) {
  overlay.innerHTML = html;
  requestAnimationFrame(() =>
    overlay.querySelector<HTMLButtonElement>("button")?.focus(),
  );
}
function bind(id: string, fn: () => void) {
  document.getElementById(id)?.addEventListener("click", () => {
    audio.unlock();
    fn();
  });
}
function menu() {
  state = "menu";
  game = undefined;
  input.clear();
  hud.innerHTML = "";
  display(
    `<section class="panel title-panel"><div class="eyebrow">An arcade survival experience</div><div class="brand-icon"><span>⌁</span></div><h1>NEON<br><span>SURVIVOR</span></h1><p>The city went dark. You didn’t.<br>Outrun the swarm. Build your arsenal. Break the Null Engine.</p><div class="actions"><button class="primary" id="play">Play →</button><button id="help">How to Play</button><button id="settings">Settings</button></div><div class="best">PERSONAL BEST <strong>${data.best.toLocaleString()}</strong></div><div class="subline"><span>10 WAVES</span><span>3 WEAPONS</span><span>ONE LAST SIGNAL</span></div><div class="hint">Keyboard + mouse required · A run takes about 6–8 minutes</div></section>`,
  );
  bind("play", start);
  bind("help", help);
  bind("settings", settings);
}
function start() {
  audio.unlock();
  input.clear();
  game = new Game(input, audio, level, end);
  state = "playing";
  overlay.innerHTML = "";
}
function resume() {
  input.clear();
  state = "playing";
  overlay.innerHTML = "";
}
function pause() {
  if (state !== "playing") return;
  state = "paused";
  input.clear();
  display(
    `<section class="panel"><div class="eyebrow">Signal suspended</div><h2>Take a breath.</h2><p>Your run is paused. The arena can wait.</p><button class="primary wide" id="resume">Resume</button><div class="actions"><button id="restart">Restart</button><button id="menu">Main menu</button></div><p class="hint">ESC to resume</p></section>`,
  );
  bind("resume", resume);
  bind("restart", start);
  bind("menu", menu);
}
function help() {
  state = "help";
  display(
    `<section class="panel"><div class="eyebrow">Field manual</div><h2>Keep the signal alive.</h2><div class="controls"><b>WASD / arrows</b><span>Move in any direction</span><b>Mouse</b><span>Aim your weapon</span><b>Click / hold</b><span>Fire continuously</span><b>Space</b><span>Dash · 3 second cooldown</span><b>Escape</b><span>Pause / resume</span></div><p>Collect green crystals to level up. Each level requires more XP. Upgrades appear immediately when you collect enough; extra XP carries over. Choose one of three upgrades while combat pauses. Weapon upgrades replace your current weapon; damage and firing upgrades carry over.</p><p>Pink diamonds pursue. Amber triangles rush. Purple hexagons fire from range. At 5:15, destroy the golden <span class="warning">Null Engine</span> to win.</p><p class="hint">Dash through danger with brief invulnerability. Keep moving!</p><button id="back" class="primary wide">Got it</button></section>`,
  );
  bind("back", menu);
}
function settings() {
  state = "settings";
  const s = data.settings;
  display(
    `<section class="panel"><div class="eyebrow">Tune your experience</div><h2>Settings</h2><label>Volume <input id="volume" aria-label="Volume" type="range" min="0" max="100" value="${s.volume * 100}"></label><label>Mute sound <input id="mute" type="checkbox" ${s.mute ? "checked" : ""}></label><label>Screen shake <input id="shake" type="checkbox" ${s.shake ? "checked" : ""}></label><label>Reduced motion <input id="reduced" type="checkbox" ${s.reduced ? "checked" : ""}></label><p>Reduced motion removes particles and screen shake. Settings save automatically on this browser.</p><button id="back" class="primary wide">Done</button></section>`,
  );
  for (const key of ["volume", "mute", "shake", "reduced"] as const) {
    document.getElementById(key)!.addEventListener("input", (e) => {
      const target = e.target as HTMLInputElement;
      if (key === "volume") s.volume = Number(target.value) / 100;
      else s[key] = target.checked;
      save(data.best, s);
    });
  }
  bind("back", menu);
}
function level(options: ReturnType<typeof choices>) {
  if (state !== "playing") return;
  state = "upgrade";
  input.clear();
  display(
    `<section class="panel upgrades"><div class="eyebrow">Signal amplified · Level ${game!.level}</div><h2>Build your advantage.</h2><p>Choose one upgrade. Combat resumes when you’re ready.</p><div class="cards">${options.map((u, i) => `<button class="card" id="upgrade-${i}"><small>0${i + 1} / UPGRADE</small><strong>${u.name}</strong><p>${u.text}</p></button>`).join("")}</div></section>`,
  );
  options.forEach((u, i) =>
    bind(`upgrade-${i}`, () => {
      u.apply(game!.stats);
      resume();
    }),
  );
}
function end(win: boolean) {
  if (state === "ended") return;
  state = "ended";
  input.clear();
  const g = game!;
  const best = g.score > data.best;
  data.best = Math.max(data.best, g.score);
  save(data.best, data.settings);
  display(
    `<section class="panel"><div class="eyebrow">${win ? "The signal survives" : "Signal lost"}</div><h2>${win ? "You broke the darkness." : "One more run?"}</h2><p>${win ? "The Null Engine is silent. The city has a future." : "Every run is a new build. Find your edge and try again."}</p><div class="stats"><div class="stat">SCORE<strong>${g.score.toLocaleString()}</strong></div><div class="stat">SURVIVED<strong>${format(g.time)}</strong></div><div class="stat">ELIMINATIONS<strong>${g.kills}</strong></div><div class="stat">LEVEL / WAVE<strong>${g.level} / ${g.wave}</strong></div></div><p class="eyebrow">${best ? "New personal best" : `Personal best · ${data.best.toLocaleString()}`}</p><div class="actions"><button id="again" class="primary">Play Again</button><button id="menu">Main menu</button></div></section>`,
  );
  bind("again", start);
  bind("menu", menu);
}
function format(t: number) {
  return `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, "0")}`;
}
function updateHud() {
  if (!game) return;
  const g = game;
  hud.innerHTML = `<div class="hud-block">HULL <strong>${Math.ceil(g.stats.hp)} / ${g.stats.maxHp}</strong><div class="bar hp"><i style="width:${(100 * g.stats.hp) / g.stats.maxHp}%"></i></div></div><div class="hud-block">LEVEL ${g.level}<strong>${g.xp} / ${xpNeeded(g.level)}</strong><div class="bar"><i style="width:${(100 * g.xp) / xpNeeded(g.level)}%"></i></div></div><div class="hud-extra">WAVE <b>${String(g.wave).padStart(2, "0")}</b> / 10<br>${format(g.time)} · ${g.stats.weapon.toUpperCase()}</div><div class="hud-right">${g.score.toLocaleString()} PTS<br><span style="color:#64f4ce">${g.dashCd > 0 ? `DASH ${g.dashCd.toFixed(1)}s` : "DASH READY [SPACE]"}</span></div><button id="pause-btn" aria-label="Pause game">Ⅱ ESC</button>`;
  document.getElementById("pause-btn")!.onclick = pause;
}
window.addEventListener("blur", () => {
  input.clear();
  pause();
});
document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    input.clear();
    pause();
  }
});
let last = performance.now(),
  hudTime = 0,
  accumulator = 0;
function frame(now: number) {
  const dt = Math.min((now - last) / 1000, 0.1);
  last = now;
  accumulator += dt;
  while (accumulator >= 1 / 120) {
    if (state === "playing") game!.update(1 / 120);
    accumulator -= 1 / 120;
  }
  renderer.draw(game, data.settings);
  hudTime += dt;
  if (game && hudTime > 0.1) {
    updateHud();
    hudTime = 0;
  }
  requestAnimationFrame(frame);
}
menu();
requestAnimationFrame(frame);
