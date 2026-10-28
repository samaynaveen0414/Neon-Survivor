import type { Settings } from "./save";
export class Audio {
  context?: AudioContext;
  constructor(public settings: Settings) {}
  unlock() {
    this.context ??= new AudioContext();
    void this.context.resume();
  }
  play(kind: "shot" | "hit" | "hurt" | "level" | "dash") {
    if (!this.context || this.settings.mute || !this.settings.volume) return;
    const c = this.context,
      o = c.createOscillator(),
      g = c.createGain();
    const tones = { shot: 650, hit: 150, hurt: 75, level: 880, dash: 310 };
    o.type = kind === "hurt" ? "sawtooth" : "sine";
    o.frequency.setValueAtTime(tones[kind], c.currentTime);
    o.frequency.exponentialRampToValueAtTime(
      tones[kind] * 0.4,
      c.currentTime + 0.12,
    );
    g.gain.setValueAtTime(
      this.settings.volume * (kind === "shot" ? 0.07 : 0.18),
      c.currentTime,
    );
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.15);
    o.connect(g);
    g.connect(c.destination);
    o.start();
    o.stop(c.currentTime + 0.16);
  }
}
