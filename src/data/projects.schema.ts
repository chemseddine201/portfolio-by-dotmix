/**
 * Flagship projects: typed schema plus the four entries.
 *
 * Content rules (DESIGN.md §10):
 * - exactly 4 projects; #1 is dotMix (enforced by the `FlagshipProjects` tuple type);
 * - Context → Role → Constraint → Outcome, each ≤ 40 words;
 * - every project links to a live demo or a repository;
 * - no invented metrics: unknown values are `REPLACE_ME_*`.
 *
 * Schema extensions beyond the brief, both required:
 * - `id`: stable key for `{each}` (D-112 key resolution uses `item.id`) and the card's DOM anchor;
 * - `imageAlt`: WCAG text alternative for `image`.
 */

export interface CaseStudy {
  /** The situation before: why the project had to exist. */
  readonly context: string;
  /** What you personally owned. */
  readonly role: string;
  /** The hard limit that shaped the solution. */
  readonly constraint: string;
  /** What changed, with evidence a reader can trace. */
  readonly outcome: string;
}

export interface ProjectLinks {
  /** Live demo URL; "" when none exists (then `repo` must be set). */
  readonly demo: string;
  /** Repository URL; "" when private (then `demo` must be set). */
  readonly repo: string;
}

export interface Project {
  readonly id: string;
  readonly title: string;
  readonly caseStudy: CaseStudy;
  /** At most 5 entries: rendered as one row of badges, never as a tag cloud. */
  readonly tech: readonly string[];
  readonly links: ProjectLinks;
  /** Site-absolute path under `public/`, 16:10, AVIF or WebP (SVG placeholders until real screenshots exist). */
  readonly image: string;
  readonly imageAlt: string;
  /** True for private / proprietary systems without public demo or source links. */
  readonly private?: boolean;
}

/** Exactly four flagship projects; the tuple makes a fifth a compile error. */
export type FlagshipProjects = readonly [Project, Project, Project, Project];

export const MAX_TECH_BADGES = 5;
export const MAX_CASE_STUDY_WORDS = 40;
export const PLACEHOLDER_MARK = "REPLACE_ME";

export const projects: FlagshipProjects = [
  {
    id: "dotmix",
    title: "dotMix",
    caseStudy: {
      context:
        "Many UI frameworks pay for Virtual DOM diffing or runtime template interpretation on every update. dotMix asks what a UI language looks like when the compiler does that work ahead of time.",
      role:
        "Creator and architect: the .mix/.tix language, the compiler pipeline, the reactive runtime, and the phase-gate governance every change must pass.",
      constraint:
        "Zero runtime dependencies, no Virtual DOM, a platform-neutral reactive core, and .tix type checking delegated to the official TypeScript Compiler API instead of a home-grown checker.",
      outcome:
        "18 workspace packages spanning compiler, runtime, router, SSR, CRDT sync and an LSP. @dotmix/runtime has zero dependencies; its 38 dist modules total 24 KB brotli (measured 2026-11-11). This site is compiled by it."
    },
    tech: ["TypeScript", "Compilers", "Signals", "SSR", "CRDT"],
    links: {
      demo: "",
      repo: "https://github.com/chemseddine201/dotMix"
    },
    image: "/images/projects/dotmix.svg",
    imageAlt: "dotMix terminal preview card showing compiler-native UI framework"
  },
  {
    id: "flymd",
    title: "FlyMD",
    caseStudy: {
      context:
        "Technical engineering workflows across multi-agent AI environments suffer from context loss and high memory overhead when supervising Markdown documentation and architectural handoffs.",
      role:
        "Creator and lead architect: built the Tauri v2 and Rust desktop application, the multi-agent debate supervisor, and the role-aware epistemic cache engine.",
      constraint:
        "Must maintain a featherweight ~35 MB RAM footprint on local machines while providing evidence-graded debate flows and local-first cache persistence.",
      outcome:
        "Shipped FlyMD v2.3 with native Rust performance, bilingual Arabic and English documentation, and offline-first multi-agent supervisor workflows without cloud lock-in."
    },
    tech: ["Rust", "Tauri", "TypeScript", "Markdown", "AI Studio"],
    links: {
      demo: "",
      repo: "https://github.com/chemseddine201/flyMD"
    },
    image: "/images/projects/flymd.svg",
    imageAlt: "FlyMD preview card showing Tauri v2 and Rust Markdown supervisor"
  },
  {
    id: "react-fishbone-chart",
    title: "React Fishbone Chart",
    caseStudy: {
      context:
        "Quality engineering and industrial root-cause analysis teams needed dynamic, multi-level Ishikawa diagrams rendered natively within React web applications.",
      role:
        "Author and maintainer: developed the recursive layout calculation engine, dynamic SVG coordinate rendering pipeline, and npm package distribution.",
      constraint:
        "Calculating multi-tier branching angles and responsive text measurements entirely in SVG without triggering layout thrashing or external rendering dependencies.",
      outcome:
        "Published react-fishbone-chart2 on npm (v2.0.8) with customizable branch hierarchies, dual ESM/CJS packaging, and clean TypeScript type definitions."
    },
    tech: ["React", "TypeScript", "SVG", "Rollup", "npm"],
    links: {
      demo: "",
      repo: "https://github.com/chemseddine201/react-fishbone-chart2"
    },
    image: "/images/projects/fishbone.svg",
    imageAlt: "React Fishbone Chart preview card showing interactive Ishikawa diagram"
  },
  {
    id: "0adb-remote",
    title: "Free ADB Remote",
    caseStudy: {
      context:
        "Managing and navigating Android TV boxes remotely typically requires tethered ADB cables or closed-source, ad-heavy controller utilities.",
      role:
        "Solo author: built the pure Java ADB wire protocol client, the foreground connection daemon, and the privileged NanoHTTPD management microservice.",
      constraint:
        "Zero third-party ADB binaries or native wrappers: protocol handshakes, RSA key authentication, and socket streams had to run in pure Java on Android API 26+.",
      outcome:
        "Open-sourced on GitHub with one-time RSA trust pairing, auto-reconnect logic, LRU package caching, and complete remote navigation over WiFi."
    },
    tech: ["Java", "Android", "ADB Protocol", "NanoHTTPD", "Networking"],
    links: {
      demo: "",
      repo: "https://github.com/chemseddine201/0adb-remote"
    },
    image: "/images/projects/adb-remote.svg",
    imageAlt: "Free ADB Remote preview card showing Java Android ADB controller"
  }
];

export const advancedPrivateProjects: readonly Project[] = [
  {
    id: "arselli-topup",
    title: "Arselli Topup & USSD Gateway",
    caseStudy: {
      context:
        "High-volume mobile voucher distribution and airtime topup required automated, low-latency execution across telecom operator USSD protocols.",
      role:
        "Fullstack architect: engineered the NestJS backend, Redis concurrency queue, MariaDB transaction storage, and real-time operations console.",
      constraint:
        "Operator modem timing limits, strict concurrency locking to prevent double-charging, and automated failover handling without human intervention.",
      outcome:
        "Deployed high-throughput recharge gateway handling automated request queues, real-time balance queries, and end-to-end audit logging under NDA."
    },
    tech: ["TypeScript", "NestJS", "Redis", "MariaDB", "USSD"],
    links: { demo: "", repo: "" },
    private: true,
    image: "/images/projects/arselli.svg",
    imageAlt: "Arselli Topup preview card showing telecom automation and USSD execution gateway"
  },
  {
    id: "tarssil-card-scanner",
    title: "Tarssil OCR Scanner & Auto-Recharge",
    caseStudy: {
      context:
        "Mobile phone retailers spend excessive time manually typing 14-to-16 digit scratch card voucher codes during peak transaction hours.",
      role:
        "Mobile engineer: designed the native Android camera pipeline, real-time viewfinder box crop, OCR digit extraction, and auto-dialer.",
      constraint:
        "Accurate digit recognition under diverse camera lighting, worn scratch vouchers, and low-end Android device camera sensors.",
      outcome:
        "Shipped native Android client with sub-second voucher crop recognition, zero manual typing, and instant USSD dial execution."
    },
    tech: ["Java", "Android", "Computer Vision", "OCR", "USSD"],
    links: { demo: "", repo: "" },
    private: true,
    image: "/images/projects/card-scanner.svg",
    imageAlt: "Tarssil Card Scanner preview card showing Android OCR voucher crop and auto-recharge"
  },
  {
    id: "flexer-telecom",
    title: "Flexer Airtime Distribution Engine",
    caseStudy: {
      context:
        "Telecom multi-tier retail networks needed a centralized platform to manage balance quotas, retailer hierarchies, and automated flexy transfers.",
      role:
        "Backend and system architect: built the modular Laravel core, balance ledger journal, role permissions, and reactive TypeScript UI.",
      constraint:
        "Financial ledger precision with zero balance drift across distributed sub-dealers, concurrent transfers, and high database write loads.",
      outcome:
        "Architected robust double-entry balance ledger with real-time transfer auditing, sub-account quota limits, and responsive operations frontend."
    },
    tech: ["PHP", "Laravel", "TypeScript", "MySQL", "Fintech"],
    links: { demo: "", repo: "" },
    private: true,
    image: "/images/projects/flexer.svg",
    imageAlt: "Flexer Airtime Distribution preview card showing telecom ledger and balance management"
  }
];

export interface ProjectIssue {
  readonly projectId: string;
  readonly severity: "error" | "placeholder";
  readonly message: string;
}

function countWords(text: string): number {
  let words = 0;
  let inWord = false;
  for (const ch of text) {
    const isSpace = ch === " " || ch === "\n" || ch === "\t" || ch === "\r";
    if (!isSpace && !inWord) words += 1;
    inWord = !isSpace;
  }
  return words;
}

function isUsableUrl(url: string): boolean {
  return url.startsWith("https://") && !url.includes(PLACEHOLDER_MARK);
}

/**
 * Content check for the project list. Not wired into `npm run build` yet.
 * `error` fails the production build; `placeholder` is reported but allowed in drafts.
 */
export function validateProjects(list: readonly Project[]): readonly ProjectIssue[] {
  const issues: ProjectIssue[] = [];
  const seen = new Set<string>();
  for (const project of list) {
    const add = (severity: ProjectIssue["severity"], message: string): void => {
      issues.push({ projectId: project.id, severity, message });
    };
    if (seen.has(project.id)) add("error", `duplicate id "${project.id}"`);
    seen.add(project.id);
    if (!project.private && !isUsableUrl(project.links.demo) && !isUsableUrl(project.links.repo)) {
      add("error", "needs at least one https demo or repo link");
    }
    if (project.tech.length > MAX_TECH_BADGES) {
      add("error", `tech has ${project.tech.length} entries (max ${MAX_TECH_BADGES})`);
    }
    for (const [part, text] of Object.entries(project.caseStudy)) {
      const words = countWords(text);
      if (words > MAX_CASE_STUDY_WORDS) add("error", `caseStudy.${part} is ${words} words (max ${MAX_CASE_STUDY_WORDS})`);
    }
    const flat = JSON.stringify(project);
    if (flat.includes(PLACEHOLDER_MARK)) add("placeholder", "contains REPLACE_ME content");
  }
  if (list.length >= 4 && list[0]?.id !== "dotmix" && !list[0]?.private) {
    issues.push({ projectId: list[0]?.id ?? "?", severity: "error", message: "project #1 must be dotMix" });
  }
  return issues;
}
