/**
 * Feature flags: a small signal-backed store for trying experimental dotMix features in production.
 *
 * dotMix ships no flag primitive (Dogfooding Log DF-007), so this lives in userland and is built
 * only from public `@dotmix/runtime` APIs. Semantics:
 * - SSR and the static build always use the declared defaults, so the HTML is deterministic;
 * - in the browser, overrides come from `?ff=name,-other` and then `localStorage["mix:ff"]`;
 * - each flag is a signal, so templates that read `flags.isOn(...)` update surgically.
 */

import { signal } from "@dotmix/runtime";
import type { Signal } from "@dotmix/runtime";

export interface FlagSpec {
  readonly defaultOn: boolean;
  readonly description: string;
  /** `portfolio`: site behaviour. `dotmix-experimental`: exercises an unproven framework path. */
  readonly kind: "portfolio" | "dotmix-experimental";
}

export const FLAG_SPECS = {
  cursorDot: {
    defaultOn: true,
    description: "6px difference-blend cursor (DESIGN.md §6)",
    kind: "portfolio"
  },
  motion: {
    defaultOn: true,
    description: "Scroll reveals, tilt, magnetic CTAs, parallax (DESIGN.md §8)",
    kind: "portfolio"
  }
} as const satisfies Record<string, FlagSpec>;

export type FlagName = keyof typeof FLAG_SPECS;
export type FlagOverrides = Partial<Record<FlagName, boolean>>;

const FLAG_NAMES = Object.keys(FLAG_SPECS) as FlagName[];
const STORAGE_KEY = "mix:ff";

function isFlagName(value: string): value is FlagName {
  return (FLAG_NAMES as string[]).includes(value);
}

/** Parses `name,-other,+third` (a leading "-" means off). Unknown names are ignored. */
export function parseFlagList(list: string): FlagOverrides {
  const result: FlagOverrides = {};
  for (const raw of list.split(",")) {
    const token = raw.trim();
    if (token === "") continue;
    const off = token.startsWith("-");
    const name = off || token.startsWith("+") ? token.slice(1) : token;
    if (isFlagName(name)) result[name] = !off;
  }
  return result;
}

/** Browser-only override sources. Storage access is wrapped: private mode can throw. */
export function readBrowserOverrides(): FlagOverrides {
  if (typeof window === "undefined") return {};
  let stored: FlagOverrides = {};
  try {
    stored = parseFlagList(window.localStorage.getItem(STORAGE_KEY) ?? "");
  } catch {
    stored = {};
  }
  const fromQuery = parseFlagList(new URLSearchParams(window.location.search).get("ff") ?? "");
  return { ...stored, ...fromQuery };
}

export interface FlagStore {
  isOn(name: FlagName): boolean;
  set(name: FlagName, on: boolean): void;
  snapshot(): Readonly<Record<FlagName, boolean>>;
}

/**
 * App-wide store. On the server this holds the defaults (deterministic HTML);
 * in the browser it applies `?ff=` and localStorage overrides at module load.
 */
export const flags: FlagStore = createFlagStore(readBrowserOverrides());

export function createFlagStore(overrides: FlagOverrides = {}): FlagStore {
  const cells = new Map<FlagName, Signal<boolean>>();
  for (const name of FLAG_NAMES) {
    cells.set(name, signal(overrides[name] ?? FLAG_SPECS[name].defaultOn));
  }
  const cell = (name: FlagName): Signal<boolean> => {
    const found = cells.get(name);
    if (found === undefined) throw new Error(`Unknown feature flag "${name}"`);
    return found;
  };
  return {
    isOn: (name) => cell(name)(),
    set: (name, on) => {
      cell(name).set(on);
    },
    snapshot: () => {
      const out = {} as Record<FlagName, boolean>;
      for (const name of FLAG_NAMES) out[name] = cell(name)();
      return out;
    }
  };
}
