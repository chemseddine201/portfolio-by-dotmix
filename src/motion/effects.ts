/**
 * Effects ported (not installed) from Magic UI / React Bits patterns, rewritten as small
 * framework-free behaviours over SSR markup. The page stays React-free (charter non-goal).
 *
 *   [data-decrypt]   text resolves from compiler glyphs into its final characters (React Bits DecryptedText)
 *   [data-count]     number counts up when scrolled into view (React Bits CountUp)
 *   [data-dock]      macOS-style magnification on hover (React Bits Dock)
 *   [data-velocity]  marquee speed follows scroll velocity (Magic UI ScrollVelocity)
 *   .btn             click ripple (interaction-design feedback pattern)
 */

import { installHeroFx } from "./hero-fx.js";

type Dispose = () => void;

const GLYPHS = "{}<>/$~;:()[]=+*#%&|!?01";

function decryptOne(el: HTMLElement, delayMs: number): Dispose {
  const final = el.textContent ?? "";
  const width = el.getBoundingClientRect().width;
  el.style.minWidth = `${width}px`; // no layout shift while glyphs swap
  let frame = 0;
  let start = 0;
  const duration = 260 + final.length * 45;
  const tick = (now: number): void => {
    if (start === 0) start = now;
    const t = now - start - delayMs;
    if (t < 0) {
      frame = requestAnimationFrame(tick);
      return;
    }
    const settled = Math.floor((t / duration) * final.length);
    let out = "";
    for (let i = 0; i < final.length; i++) {
      const ch = final[i] ?? "";
      out += i < settled || ch === " " ? ch : GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
    }
    el.textContent = out;
    if (settled < final.length) {
      frame = requestAnimationFrame(tick);
    } else {
      el.textContent = final;
      el.style.minWidth = "";
      el.classList.add("is-decrypted");
    }
  };
  frame = requestAnimationFrame(tick);
  return () => {
    cancelAnimationFrame(frame);
    el.textContent = final;
  };
}

function installDecrypt(root: Document): Dispose {
  const disposers = [...root.querySelectorAll<HTMLElement>("[data-decrypt]")].map((el, i) =>
    decryptOne(el, 180 + i * 90)
  );
  return () => disposers.forEach((d) => d());
}

function installCount(root: Document): Dispose {
  const els = [...root.querySelectorAll<HTMLElement>("[data-count]")];
  const frames = new Set<number>();
  const run = (el: HTMLElement): void => {
    const to = Number(el.dataset.count ?? "0");
    const decimals = Number(el.dataset.decimals ?? "0");
    const start = performance.now();
    const step = (now: number): void => {
      const p = Math.min(1, (now - start) / 1400);
      const eased = 1 - Math.pow(1 - p, 4);
      el.textContent = (to * eased).toFixed(decimals);
      if (p < 1) frames.add(requestAnimationFrame(step));
    };
    frames.add(requestAnimationFrame(step));
  };
  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        io.unobserve(entry.target);
        run(entry.target as HTMLElement);
      }
    },
    { threshold: 0.6 }
  );
  for (const el of els) io.observe(el);
  return () => {
    io.disconnect();
    frames.forEach((f) => cancelAnimationFrame(f));
  };
}

function installDock(root: Document): Dispose {
  const dock = root.querySelector<HTMLElement>("[data-dock]");
  if (dock === null) return () => {};
  const items = [...dock.querySelectorAll<HTMLElement>("[data-dock-item]")];
  let frame = 0;
  let px = 0;
  const apply = (): void => {
    frame = 0;
    for (const item of items) {
      const r = item.getBoundingClientRect();
      const d = Math.abs(px - (r.left + r.width / 2));
      const s = 1 + 0.55 * Math.max(0, 1 - d / 140);
      item.style.setProperty("--s", s.toFixed(3));
    }
  };
  const move = (e: PointerEvent): void => {
    px = e.clientX;
    if (frame === 0) frame = requestAnimationFrame(apply);
  };
  const leave = (): void => {
    for (const item of items) item.style.setProperty("--s", "1");
  };
  dock.addEventListener("pointermove", move, { passive: true });
  dock.addEventListener("pointerleave", leave);
  return () => {
    dock.removeEventListener("pointermove", move);
    dock.removeEventListener("pointerleave", leave);
    if (frame !== 0) cancelAnimationFrame(frame);
  };
}

function installVelocity(root: Document): Dispose {
  const tracks = [...root.querySelectorAll<HTMLElement>("[data-velocity] .marquee-track")];
  let lastY = window.scrollY;
  let lastT = performance.now();
  let boost = 0;
  let frame = 0;
  const loop = (now: number): void => {
    const dy = Math.abs(window.scrollY - lastY);
    const dt = Math.max(16, now - lastT);
    lastY = window.scrollY;
    lastT = now;
    boost = boost * 0.9 + Math.min(6, (dy / dt) * 4) * 0.1;
    for (const track of tracks) {
      for (const anim of track.getAnimations()) anim.playbackRate = 1 + boost;
    }
    frame = requestAnimationFrame(loop);
  };
  if (tracks.length > 0) frame = requestAnimationFrame(loop);
  return () => cancelAnimationFrame(frame);
}

function installRipple(root: Document): Dispose {
  const onDown = (e: PointerEvent): void => {
    const target = e.target instanceof Element ? e.target.closest<HTMLElement>(".btn") : null;
    if (target === null) return;
    const r = target.getBoundingClientRect();
    const ripple = root.createElement("span");
    ripple.className = "ripple";
    ripple.style.left = `${e.clientX - r.left}px`;
    ripple.style.top = `${e.clientY - r.top}px`;
    target.appendChild(ripple);
    ripple.addEventListener("animationend", () => ripple.remove(), { once: true });
  };
  root.addEventListener("pointerdown", onDown);
  return () => root.removeEventListener("pointerdown", onDown);
}

/** Dock slides away while scrolling down (content stays readable on phones) and returns on scroll up. */
function installDockAutoHide(root: Document): Dispose {
  const dock = root.querySelector<HTMLElement>("[data-dock]");
  if (dock === null) return () => {};
  let lastY = window.scrollY;
  let frame = 0;
  const onScroll = (): void => {
    if (frame !== 0) return;
    frame = requestAnimationFrame(() => {
      frame = 0;
      const y = window.scrollY;
      const nearBottom = y + window.innerHeight >= root.documentElement.scrollHeight - 80;
      if (y > lastY + 6 && y > 240 && !nearBottom) dock.classList.add("is-hidden");
      else if (y < lastY - 6 || nearBottom || y <= 240) dock.classList.remove("is-hidden");
      lastY = y;
    });
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  return () => {
    window.removeEventListener("scroll", onScroll);
    if (frame !== 0) cancelAnimationFrame(frame);
  };
}

/** [data-copy-value] buttons copy their value and confirm with "copied ✓". */
function installCopy(root: Document): Dispose {
  const timers = new Set<number>();
  const onClick = (e: MouseEvent): void => {
    const btn = e.target instanceof Element ? e.target.closest<HTMLElement>("[data-copy-value]") : null;
    if (btn === null) return;
    const value = btn.dataset.copyValue ?? "";
    const label = btn.textContent ?? "copy";
    void navigator.clipboard?.writeText(value).then(() => {
      btn.textContent = "copied ✓";
      btn.classList.add("is-copied");
      timers.add(
        window.setTimeout(() => {
          btn.textContent = label;
          btn.classList.remove("is-copied");
        }, 1800)
      );
    });
  };
  root.addEventListener("click", onClick);
  return () => {
    root.removeEventListener("click", onClick);
    timers.forEach((t) => window.clearTimeout(t));
  };
}

/** Effects that are safe on every pointer type. */
export function installEffects(root: Document, finePointer: boolean): Dispose {
  const disposers: Dispose[] = [installDecrypt(root), installCount(root), installVelocity(root), installRipple(root), installDockAutoHide(root), installCopy(root)];
  if (finePointer) disposers.push(installDock(root), installHeroFx(root));
  return () => disposers.forEach((d) => d());
}
