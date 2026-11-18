/**
 * Motion behaviours that enhance the static (SSR) markup. Installed by the Motion island.
 * Compositor-friendly: only classes and CSS custom properties are written; CSS animates
 * transform/opacity/clip-path. Nothing runs under prefers-reduced-motion.
 *
 *   [data-reveal]        slash-wipe in when scrolled into view (siblings in [data-reveal-group] stagger)
 *   [data-tilt]          3D tilt + glare following the pointer
 *   [data-magnetic]      element drifts toward the pointer
 *   [data-spotlight]     writes --sx/--sy (px) so the hero dot field lights up around the pointer
 */

import { installEffects } from "./effects.js";

type Dispose = () => void;

function inView(el: Element): boolean {
  const r = el.getBoundingClientRect();
  return r.top < window.innerHeight && r.bottom > 0;
}

function querySelfAndDescendants<T extends HTMLElement>(root: ParentNode, selector: string): T[] {
  const elements: T[] = [];
  if ("matches" in root && (root as Element).matches(selector)) {
    elements.push(root as unknown as T);
  }
  elements.push(...root.querySelectorAll<T>(selector));
  return elements;
}

interface RevealController {
  enhance(root: ParentNode): void;
  dispose: Dispose;
}

function createRevealController(doc: Document): RevealController {
  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add("is-in");
        io.unobserve(entry.target);
      }
    },
    { rootMargin: "0px 0px -10% 0px", threshold: 0.12 }
  );

  function enhance(root: ParentNode): void {
    const groups = querySelfAndDescendants<HTMLElement>(root, "[data-reveal-group]");
    for (const group of groups) {
      group.querySelectorAll<HTMLElement>("[data-reveal]").forEach((el, i) => {
        el.style.setProperty("--reveal-delay", `${Math.min(i, 8) * 90}ms`);
      });
    }

    const items = querySelfAndDescendants<HTMLElement>(root, "[data-reveal]");
    // Mark what is already visible before hiding anything: no flash of hidden content.
    for (const el of items) {
      if (inView(el)) {
        el.classList.add("is-in");
      } else if (!el.classList.contains("is-in")) {
        io.observe(el);
      }
    }
  }

  enhance(doc);
  doc.documentElement.classList.add("motion-ready");

  return {
    enhance,
    dispose: () => {
      io.disconnect();
      doc.documentElement.classList.remove("motion-ready");
    }
  };
}

function onPointer(el: HTMLElement, move: (x: number, y: number) => void, leave: () => void): Dispose {
  let frame = 0;
  let nx = 0;
  let ny = 0;
  const handleMove = (e: PointerEvent): void => {
    const r = el.getBoundingClientRect();
    nx = ((e.clientX - r.left) / r.width) * 2 - 1;
    ny = ((e.clientY - r.top) / r.height) * 2 - 1;
    if (frame === 0) {
      frame = requestAnimationFrame(() => {
        frame = 0;
        move(nx, ny);
      });
    }
  };
  const handleLeave = (): void => {
    if (frame !== 0) cancelAnimationFrame(frame);
    frame = 0;
    leave();
  };
  el.addEventListener("pointermove", handleMove, { passive: true });
  el.addEventListener("pointerleave", handleLeave);
  return () => {
    el.removeEventListener("pointermove", handleMove);
    el.removeEventListener("pointerleave", handleLeave);
    if (frame !== 0) cancelAnimationFrame(frame);
  };
}

function enhanceTilt(root: ParentNode): Dispose[] {
  return querySelfAndDescendants<HTMLElement>(root, "[data-tilt]").map((el) =>
    onPointer(
      el,
      (x, y) => {
        el.style.setProperty("--rx", `${(-y * 3).toFixed(2)}deg`);
        el.style.setProperty("--ry", `${(x * 4).toFixed(2)}deg`);
        el.style.setProperty("--gx", `${((x + 1) * 50).toFixed(1)}%`);
        el.style.setProperty("--gy", `${((y + 1) * 50).toFixed(1)}%`);
        el.classList.add("is-tilting");
      },
      () => {
        el.style.setProperty("--rx", "0deg");
        el.style.setProperty("--ry", "0deg");
        el.classList.remove("is-tilting");
      }
    )
  );
}

function enhanceMagnetic(root: ParentNode): Dispose[] {
  return querySelfAndDescendants<HTMLElement>(root, "[data-magnetic]").map((el) =>
    onPointer(
      el,
      (x, y) => {
        el.style.setProperty("--mx", `${(x * 8).toFixed(1)}px`);
        el.style.setProperty("--my", `${(y * 6).toFixed(1)}px`);
      },
      () => {
        el.style.setProperty("--mx", "0px");
        el.style.setProperty("--my", "0px");
      }
    )
  );
}

/** Writes the pointer position (px) as --sx/--sy so CSS masks can follow it. */
function enhanceSpotlight(root: ParentNode): Dispose[] {
  return querySelfAndDescendants<HTMLElement>(root, "[data-spotlight]").map((el) =>
    onPointer(
      el,
      (x, y) => {
        el.style.setProperty("--sx", `${(((x + 1) / 2) * el.clientWidth).toFixed(0)}px`);
        el.style.setProperty("--sy", `${(((y + 1) / 2) * el.clientHeight).toFixed(0)}px`);
      },
      () => {
        el.style.removeProperty("--sx");
        el.style.removeProperty("--sy");
      }
    )
  );
}

/** Installs every behaviour; returns one disposer. No-op under reduced motion. */
export function installMotion(root: Document): Dispose {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return () => {};
  const fine = window.matchMedia("(pointer: fine)").matches;

  const revealController = createRevealController(root);
  const pointerDisposers: Dispose[] = [];

  if (fine) {
    pointerDisposers.push(...enhanceTilt(root));
    pointerDisposers.push(...enhanceMagnetic(root));
    pointerDisposers.push(...enhanceSpotlight(root));
  }

  const effectsDisposer = installEffects(root, fine);

  const onHmrApplied = (event: Event): void => {
    const customEvent = event as CustomEvent<{ nodes?: readonly Node[] }>;
    const nodes = customEvent.detail?.nodes ?? [];
    for (const node of nodes) {
      if (node.nodeType === 1) {
        const el = node as Element;
        revealController.enhance(el);
        if (fine) {
          pointerDisposers.push(...enhanceTilt(el));
          pointerDisposers.push(...enhanceMagnetic(el));
          pointerDisposers.push(...enhanceSpotlight(el));
        }
      }
    }
  };

  window.addEventListener("mix:hmr-applied", onHmrApplied);

  return () => {
    window.removeEventListener("mix:hmr-applied", onHmrApplied);
    revealController.dispose();
    effectsDisposer();
    pointerDisposers.forEach((d) => d());
  };
}
