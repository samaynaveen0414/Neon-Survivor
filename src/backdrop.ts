/** Cached procedural scenery: no network assets or per-frame texture generation. */
export function createBackdrop(): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = 1200;
  canvas.height = 760;
  const c = canvas.getContext("2d")!;
  c.fillStyle = "#060a18";
  c.fillRect(0, 0, 1200, 760);
  function cloud(x: number, y: number, radius: number, color: string) {
    const glow = c.createRadialGradient(x, y, 0, x, y, radius);
    glow.addColorStop(0, color);
    glow.addColorStop(1, "#00000000");
    c.fillStyle = glow;
    c.fillRect(0, 0, 1200, 760);
  }
  cloud(930, 170, 520, "#26366b88");
  cloud(190, 660, 430, "#4a246355");
  cloud(580, 390, 340, "#123e482b");
  // Seeded stars stay still across runs and respect reduced-motion preferences.
  let seed = 7301;
  function random() {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  }
  for (let i = 0; i < 230; i++) {
    const x = random() * 1200,
      y = random() * 760;
    const radius = random() > 0.94 ? 1.35 : 0.45 + random() * 0.55;
    c.fillStyle = `rgba(160,191,224,${0.16 + random() * 0.35})`;
    c.beginPath();
    c.arc(x, y, radius, 0, Math.PI * 2);
    c.fill();
    if (radius > 1) {
      c.strokeStyle = "#a0bfe02b";
      c.lineWidth = 0.6;
      c.beginPath();
      c.moveTo(x - 4, y);
      c.lineTo(x + 4, y);
      c.moveTo(x, y - 4);
      c.lineTo(x, y + 4);
      c.stroke();
    }
  }
  function planet(
    x: number,
    y: number,
    r: number,
    colors: string[],
    ring = false,
  ) {
    c.save();
    c.translate(x, y);
    c.rotate(-0.32);
    cloudLocal();
    function cloudLocal() {
      const halo = c.createRadialGradient(0, 0, r * 0.95, 0, 0, r * 1.2);
      halo.addColorStop(0, colors[0] + "40");
      halo.addColorStop(1, "#00000000");
      c.fillStyle = halo;
      c.beginPath();
      c.arc(0, 0, r * 1.2, 0, Math.PI * 2);
      c.fill();
    }
    const drawRing = (start: number, end: number) => {
      for (let i = 0; i < 5; i++) {
        c.strokeStyle = i % 2 ? "#6684b52b" : "#7789bf40";
        c.lineWidth = i === 2 ? 6 : 2;
        c.beginPath();
        c.ellipse(
          0,
          0,
          r * (1.55 + i * 0.065),
          r * (0.35 + i * 0.018),
          0,
          start,
          end,
        );
        c.stroke();
      }
    };
    if (ring) drawRing(Math.PI, Math.PI * 2);
    c.save();
    c.beginPath();
    c.arc(0, 0, r, 0, Math.PI * 2);
    c.clip();
    const surface = c.createRadialGradient(
      -r * 0.48,
      -r * 0.5,
      r * 0.05,
      r * 0.2,
      r * 0.12,
      r * 1.2,
    );
    surface.addColorStop(0, colors[0]);
    surface.addColorStop(0.52, colors[1]);
    surface.addColorStop(1, "#080c1b");
    c.fillStyle = surface;
    c.fillRect(-r, -r, r * 2, r * 2);
    for (let i = 0; i < 15; i++) {
      c.strokeStyle = i % 2 ? "#94bdd30b" : "#02071420";
      c.lineWidth = 3 + random() * 8;
      c.beginPath();
      c.ellipse(
        -r * 0.15,
        -r + i * r * 0.15,
        r * 1.3,
        r * 0.17,
        0.1,
        0,
        Math.PI * 2,
      );
      c.stroke();
    }
    const shade = c.createLinearGradient(-r, -r, r * 0.65, r * 0.3);
    shade.addColorStop(0, "#00000000");
    shade.addColorStop(0.4, "#02061110");
    shade.addColorStop(1, "#020611c0");
    c.fillStyle = shade;
    c.fillRect(-r, -r, r * 2, r * 2);
    c.restore();
    c.strokeStyle = colors[0] + "50";
    c.lineWidth = 1;
    c.beginPath();
    c.arc(0, 0, r, 0, Math.PI * 2);
    c.stroke();
    if (ring) drawRing(0, Math.PI);
    c.restore();
  }
  planet(1045, 190, 138, ["#3b647f", "#172f48"], true);
  planet(145, 674, 104, ["#65466f", "#2c2447"]);
  planet(332, 142, 24, ["#566079", "#262e46"]);
  // Quiet orbital guides replace the dominant arcade grid.
  c.strokeStyle = "#405b7a19";
  c.lineWidth = 1;
  c.beginPath();
  c.ellipse(1045, 190, 365, 295, -0.32, 0.5, 3.8);
  c.stroke();
  return canvas;
}
