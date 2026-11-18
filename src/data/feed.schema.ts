/**
 * Build-time syndication data contract.
 * Rendered by `About.tix`. No producer exists yet: the home page passes `EMPTY_FEED`.
 * Never fetched on the client (DESIGN.md §7.4, §9).
 */

export interface FeedPost {
  readonly id: string;
  readonly title: string;
  readonly url: string;
  /** ISO-8601 date. */
  readonly published: string;
}

export type ActivityKind = "push" | "release" | "pull-request" | "issue" | "create" | "other";

export interface ActivityItem {
  readonly id: string;
  readonly kind: ActivityKind;
  /** `owner/name`. */
  readonly repo: string;
  readonly url: string;
  /** One plain-text line, for example "Pushed 3 commits to master". */
  readonly summary: string;
  /** ISO-8601 timestamp. */
  readonly at: string;
}

export interface Feed {
  readonly posts: readonly FeedPost[];
  readonly activity: readonly ActivityItem[];
  /** Where the data came from: a live fetch, the last good cache, or the static fallback. */
  readonly source: "network" | "cache" | "fallback";
  /** ISO-8601 time of the successful fetch; null for the fallback. */
  readonly fetchedAt: string | null;
}

export const MAX_POSTS = 4;
export const MAX_ACTIVITY = 4;

export const EMPTY_FEED: Feed = {
  posts: [],
  activity: [],
  source: "fallback",
  fetchedAt: null
};
