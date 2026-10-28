export interface Settings {
  volume: number;
  mute: boolean;
  shake: boolean;
  reduced: boolean;
}
const defaults: Settings = {
  volume: 0.35,
  mute: false,
  shake: true,
  reduced:
    typeof matchMedia !== "undefined" &&
    matchMedia("(prefers-reduced-motion: reduce)").matches,
};
export function readSave(): { best: number; settings: Settings } {
  try {
    const v = JSON.parse(localStorage.getItem("neon-survivor-v1") || "{}");
    return {
      best: Number.isFinite(v.best) ? Math.max(0, v.best) : 0,
      settings: {
        volume:
          typeof v.settings?.volume === "number"
            ? Math.max(0, Math.min(1, v.settings.volume))
            : defaults.volume,
        mute: v.settings?.mute === true,
        shake: v.settings?.shake !== false,
        reduced:
          typeof v.settings?.reduced === "boolean"
            ? v.settings.reduced
            : defaults.reduced,
      },
    };
  } catch {
    return { best: 0, settings: { ...defaults } };
  }
}
export function save(best: number, settings: Settings) {
  try {
    localStorage.setItem(
      "neon-survivor-v1",
      JSON.stringify({ best, settings }),
    );
  } catch {
    /* Private browsing may disable persistence. */
  }
}
