export class Input {
  keys = new Set<string>();
  mouse = { x: 600, y: 350 };
  shooting = false;
  dash = false;
  constructor(
    canvas: HTMLCanvasElement,
    public pause: () => void,
  ) {
    window.addEventListener("keydown", (e) => {
      if (
        ["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(
          e.code,
        ) &&
        !(e.target instanceof HTMLInputElement)
      )
        e.preventDefault();
      this.keys.add(e.code);
      if (e.code === "Space" && !e.repeat) this.dash = true;
      if (e.code === "Escape" && !e.repeat) this.pause();
    });
    window.addEventListener("keyup", (e) => this.keys.delete(e.code));
    canvas.addEventListener("pointermove", (e) => {
      const r = canvas.getBoundingClientRect();
      this.mouse = {
        x: ((e.clientX - r.left) / r.width) * 1200,
        y: ((e.clientY - r.top) / r.height) * 760,
      };
    });
    canvas.addEventListener("pointerdown", (e) => {
      const r = canvas.getBoundingClientRect();
      this.mouse = {
        x: ((e.clientX - r.left) / r.width) * 1200,
        y: ((e.clientY - r.top) / r.height) * 760,
      };
      if (e.button === 0) this.shooting = true;
    });
    window.addEventListener("pointerup", () => (this.shooting = false));
  }
  clear() {
    this.keys.clear();
    this.shooting = false;
    this.dash = false;
  }
}
