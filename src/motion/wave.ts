/**
 * Wave field engine: a grid of cells; waves expand from clicks (and ambient random points),
 * the cursor adds a soft glow. Pauses off-screen; draws one static frame under reduced motion.
 */

interface Wave {
  x: number;
  y: number;
  t0: number;
}

const CELL = 26;
const SPEED = 0.42; // px per ms
const SIGMA = 26;
const LIFE = 2600;

export function startWave(canvas: HTMLCanvasElement): () => void {
  const ctx = canvas.getContext("2d");
  const host = canvas.parentElement?.parentElement ?? canvas;
  if (ctx === null) return () => {};
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const waves: Wave[] = [];
  let w = 0;
  let h = 0;
  let px = -9999;
  let py = -9999;
  let frame = 0;
  let visible = true;
  let lastAuto = 0;

  const resize = (): void => {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    w = canvas.clientWidth;
    h = canvas.clientHeight;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };

  const draw = (now: number): void => {
    ctx.clearRect(0, 0, w, h);
    while (waves.length > 0 && now - (waves[0]?.t0 ?? now) > LIFE) waves.shift();
    for (let y = CELL / 2; y < h; y += CELL) {
      for (let x = CELL / 2; x < w; x += CELL) {
        let energy = 0;
        for (const wave of waves) {
          const age = now - wave.t0;
          const d = Math.hypot(x - wave.x, y - wave.y) - age * SPEED;
          energy += Math.exp(-(d * d) / (2 * SIGMA * SIGMA)) * (1 - age / LIFE);
        }
        const dc = Math.hypot(x - px, y - py);
        energy += Math.max(0, 1 - dc / 150) * 0.55;
        const e = Math.min(1, energy);
        const size = 2 + e * 5;
        ctx.fillStyle = e > 0.02 ? `rgba(134, 239, 172, ${0.08 + e * 0.85})` : "rgba(255, 255, 255, 0.07)";
        ctx.fillRect(x - size / 2, y - size / 2, size, size);
      }
    }
  };

  const loop = (now: number): void => {
    frame = 0;
    if (!visible) return;
    if (now - lastAuto > 2300) {
      lastAuto = now;
      waves.push({ x: Math.random() * w, y: Math.random() * h, t0: now });
    }
    draw(now);
    frame = requestAnimationFrame(loop);
  };

  const onMove = (e: PointerEvent): void => {
    const r = canvas.getBoundingClientRect();
    px = e.clientX - r.left;
    py = e.clientY - r.top;
  };
  const onLeave = (): void => {
    px = -9999;
    py = -9999;
  };
  const onDown = (e: PointerEvent): void => {
    const r = canvas.getBoundingClientRect();
    waves.push({ x: e.clientX - r.left, y: e.clientY - r.top, t0: performance.now() });
  };

  const ro = new ResizeObserver(() => {
    resize();
    if (reduced) draw(performance.now());
  });
  ro.observe(canvas);
  resize();

  if (reduced) {
    draw(performance.now());
    return () => ro.disconnect();
  }

  const io = new IntersectionObserver((entries) => {
    visible = entries.some((entry) => entry.isIntersecting);
    if (visible && frame === 0) frame = requestAnimationFrame(loop);
  });
  io.observe(canvas);
  host.addEventListener("pointermove", onMove, { passive: true });
  host.addEventListener("pointerleave", onLeave);
  host.addEventListener("pointerdown", onDown);
  frame = requestAnimationFrame(loop);

  return () => {
    if (frame !== 0) cancelAnimationFrame(frame);
    ro.disconnect();
    io.disconnect();
    host.removeEventListener("pointermove", onMove);
    host.removeEventListener("pointerleave", onLeave);
    host.removeEventListener("pointerdown", onDown);
  };
}
