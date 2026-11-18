/**
 * Interactive hero behaviours (fine pointers only):
 *   [data-xray]   --split follows the cursor (source left of the scan line, DOM right of it)
 *   [data-field]  spring-physics letters ([data-field-ch]) repel from the cursor and settle back
 */

type Dispose = () => void;

function installXray(root: Document): Dispose {
  const disposers = [...root.querySelectorAll<HTMLElement>("[data-xray]")].map((el) => {
    const move = (e: PointerEvent): void => {
      const r = el.getBoundingClientRect();
      const pct = Math.max(0, Math.min(100, ((e.clientX - r.left) / r.width) * 100));
      el.classList.add("is-manual");
      el.style.setProperty("--split", `${pct.toFixed(2)}%`);
    };
    const leave = (): void => {
      el.style.setProperty("--split", "0%");
    };
    el.addEventListener("pointermove", move, { passive: true });
    el.addEventListener("pointerleave", leave);
    return () => {
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerleave", leave);
    };
  });
  return () => disposers.forEach((d) => d());
}

interface Spring {
  x: number;
  y: number;
  vx: number;
  vy: number;
  cx: number;
  cy: number;
}

function startField(el: HTMLElement): Dispose {
  const letters = [...el.querySelectorAll<HTMLElement>("[data-field-ch]")];
  const springs: Spring[] = letters.map(() => ({ x: 0, y: 0, vx: 0, vy: 0, cx: 0, cy: 0 }));
  let mx = -9999;
  let my = -9999;
  let frame = 0;
  let visible = true;

  const measure = (): void => {
    const base = el.getBoundingClientRect();
    letters.forEach((letter, i) => {
      const s = springs[i];
      if (s === undefined) return;
      const r = letter.getBoundingClientRect();
      s.cx = r.left - base.left + r.width / 2 - s.x;
      s.cy = r.top - base.top + r.height / 2 - s.y;
    });
  };

  const tick = (now: number): void => {
    frame = 0;
    if (!visible) return;
    letters.forEach((letter, i) => {
      const s = springs[i];
      if (s === undefined) return;
      const dx = s.cx - mx;
      const dy = s.cy - my;
      const d = Math.hypot(dx, dy) || 1;
      const R = 160;
      let tx = 0;
      let ty = Math.sin(now / 700 + i * 0.45) * 2.5;
      let heat = 0;
      if (d < R) {
        const f = 1 - d / R;
        const push = f * f * 46;
        tx += (dx / d) * push;
        ty += (dy / d) * push;
        heat = f;
      }
      s.vx = (s.vx + (tx - s.x) * 0.14) * 0.76;
      s.vy = (s.vy + (ty - s.y) * 0.14) * 0.76;
      s.x += s.vx;
      s.y += s.vy;
      letter.style.transform = `translate(${s.x.toFixed(2)}px, ${s.y.toFixed(2)}px) scale(${(1 + heat * 0.22).toFixed(3)})`;
      letter.style.setProperty("--heat", heat.toFixed(3));
    });
    frame = requestAnimationFrame(tick);
  };

  const move = (e: PointerEvent): void => {
    const r = el.getBoundingClientRect();
    mx = e.clientX - r.left;
    my = e.clientY - r.top;
    el.style.setProperty("--fx", `${mx.toFixed(0)}px`);
    el.style.setProperty("--fy", `${my.toFixed(0)}px`);
  };
  const leave = (): void => {
    mx = -9999;
    my = -9999;
  };

  const ro = new ResizeObserver(measure);
  ro.observe(el);
  const io = new IntersectionObserver((entries) => {
    visible = entries.some((entry) => entry.isIntersecting);
    if (visible) {
      measure();
      if (frame === 0) frame = requestAnimationFrame(tick);
    }
  });
  io.observe(el);
  el.addEventListener("pointermove", move, { passive: true });
  el.addEventListener("pointerleave", leave);
  measure();
  frame = requestAnimationFrame(tick);

  return () => {
    if (frame !== 0) cancelAnimationFrame(frame);
    ro.disconnect();
    io.disconnect();
    el.removeEventListener("pointermove", move);
    el.removeEventListener("pointerleave", leave);
  };
}

export function installHeroFx(root: Document): Dispose {
  const disposers: Dispose[] = [installXray(root)];
  for (const el of root.querySelectorAll<HTMLElement>("[data-field]")) disposers.push(startField(el));
  return () => disposers.forEach((d) => d());
}
