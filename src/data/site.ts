/**
 * Site identity: the single source of truth for SEO metadata, the hero, contact and chrome.
 * Every `REPLACE_ME_*` value must be filled by the owner. Nothing here is guessed.
 */

import { buildInfo } from "./build-info.js";

export interface SiteIdentity {
  /** Your public name, for the title format `Name — Role`. */
  readonly name: string;
  /** Short role, for the title and JSON-LD `jobTitle` (e.g. "Compiler & Frontend Engineer"). */
  readonly role: string;
  /** Hero headline, ≤ 8 words of role clarity (DESIGN.md §7.1). */
  readonly roleLine: string;
  /** Hero supporting sentence, ≤ 25 words. */
  readonly summary: string;
  /** Meta description, ≤ 155 characters. */
  readonly description: string;
  /** Canonical origin, no trailing slash (e.g. "https://example.dev"). */
  readonly siteUrl: string;
  readonly email: string;
  /** Facebook profile: a full URL or just the username (e.g. "john.doe"). */
  readonly facebookUrl: string;
  /** WhatsApp number in international format; a leading "+" and spaces are fine. */
  readonly whatsappNumber: string;
  /** Booking link for "Book a call". */
  readonly calendarUrl: string;
  /** One-line availability note; "" hides it. */
  readonly availability: string;
  /** GitHub handle for build-time activity syndication. Taken from this repo's `origin` remote. */
  readonly githubUser: string;
  /** RSS 2.0 or Atom feed URL for build-time post syndication; "" disables it. */
  readonly feedUrl: string;
  /** Human-facing blog URL, linked from the syndication fallback. */
  readonly blogUrl: string;
  /** Site-absolute path to the 1200×630 OpenGraph image (a playground screenshot, Phase 5). */
  readonly ogImage: string;
  readonly locale: string;
}

/**
 * Contact values come from .env through scripts/write-build-info.mjs (src/data/build-info.ts), so they
 * never live in source. An empty value hides its contact item.
 */
const { contact } = buildInfo;

export const site: SiteIdentity = {
  name: "Chemseddine Z.",
  role: "Fullstack Developer",
  roleLine: "fullstack Web Developer · AI Vibe Coder",
  summary: "I turn ideas into fullstack products, PHP and Java or Javascript behind, React and TypeScript in front, shipped faster with AI as my pair programmer.",
  description: "Chemseddine Z., fullstack developer and AI vibe coder. PHP, Java, JavaScript, TypeScript, React, Laravel and Netty.",
  siteUrl: buildInfo.siteUrl,
  email: contact.email,
  facebookUrl: contact.facebookUrl,
  whatsappNumber: contact.whatsappNumber,
  calendarUrl: contact.calendarUrl,
  availability: "Available",
  githubUser: "chemseddine201",
  feedUrl: "#",
  blogUrl: "#",
  ogImage: "/og/playground.png",
  locale: "en"
};

/** True when a field holds a real value (not a REPLACE_ME placeholder or empty). */
export function isFilled(value: string): boolean {
  return value !== "" && !value.includes("REPLACE_ME");
}

/** Facebook link from a full URL or a bare username. */
export function facebookHref(value: string): string {
  return value.startsWith("http") ? value : `https://www.facebook.com/${value.replace(/^@/, "")}`;
}

/** Short display form: "fb.com/<username>". */
export function facebookDisplay(value: string): string {
  const user = value.startsWith("http") ? (value.split("facebook.com/")[1] ?? value) : value.replace(/^@/, "");
  return `fb.com/${user.replace(/\/$/, "")}`;
}

/** wa.me needs digits only ("+1 555…" → "1555…"). */
export function whatsappHref(value: string): string {
  return `https://wa.me/${value.replace(/[^0-9]/g, "")}`;
}

/** Display form with exactly one leading "+". */
export function whatsappDisplay(value: string): string {
  return value.startsWith("+") ? value : `+${value}`;
}

/** `Name — Role`, the title format required by the brief. */
export function pageTitle(identity: SiteIdentity = site): string {
  return `${identity.name} — ${identity.role}`;
}
