/** Static X claims feed. Read-only. Never plotted. */

export const X_CLAIMS_PER_HANDLE = 50;

/** Config list. A permalink is accepted only when the handle is one of these. */
export const X_HANDLES = [
  "hey_itsmyturn",
  "GeoConfirmed",
  "sentdefender",
  "Osinttechnical",
  "Faytuks",
  "NOELreports",
] as const;

export type XHandle = (typeof X_HANDLES)[number];

const HANDLE_BY_LOWER = new Map(X_HANDLES.map((handle) => [handle.toLowerCase(), handle]));
const EXCERPT_MAX = 140; // JavaScript string length, UTF-16 code units

/** Only this shape may become a claim link. twitter.com is not accepted here. ASCII digits only. Handle match is case-insensitive. */
const X_POST_URL = /^https:\/\/x\.com\/([A-Za-z0-9_]+)\/status\/([0-9]+)$/;

export interface XClaimPost {
  id: string;
  url: string;
  created_at: string;
  handle: string;
  type: string;
  excerpt: string;
  confidence: "CLAIM";
}

export interface XClaimsPayload {
  generated_at: string;
  handles?: string[];
  /** Older files named a single account. Posts are validated individually. */
  handle?: string;
  note: string;
  posts: XClaimPost[];
}

const KEEP = new Set(["original", "quote"]);

export interface ParsedXPostUrl {
  url: string;
  handle: XHandle;
  id: string;
}

export function parseXPostUrl(raw: unknown): ParsedXPostUrl | null {
  if (typeof raw !== "string") return null;
  const match = X_POST_URL.exec(raw.trim());
  if (!match) return null;
  const handle = HANDLE_BY_LOWER.get(match[1].toLowerCase());
  if (!handle) return null;
  const id = match[2];
  return { url: `https://x.com/${handle}/status/${id}`, handle, id };
}

export function xPostUrl(raw: unknown): string | null {
  return parseXPostUrl(raw)?.url ?? null;
}

function sanePost(post: XClaimPost): post is XClaimPost {
  const parsed = parseXPostUrl(post?.url);
  if (!parsed) return false;
  if (post.id !== parsed.id || post.handle.toLowerCase() !== parsed.handle.toLowerCase()) return false;
  if (!KEEP.has(post.type) || post.confidence !== "CLAIM") return false;
  if (typeof post.created_at !== "string" || !Number.isFinite(Date.parse(post.created_at))) return false;
  if (typeof post.excerpt !== "string") return false;
  if (post.excerpt.length === 0 || post.excerpt.length > EXCERPT_MAX || post.excerpt.trim().length === 0) return false;
  return true;
}

export async function loadXClaims(): Promise<XClaimsPayload | null> {
  try {
    const res = await fetch("./data/claims_x.json");
    if (!res.ok) return null;
    const payload = (await res.json()) as XClaimsPayload;
    const sorted = (payload.posts ?? [])
      .filter(sanePost)
      .sort((a, b) => (a.created_at < b.created_at ? 1 : a.created_at > b.created_at ? -1 : a.id < b.id ? 1 : -1));
    const seen = new Set<string>();
    const counts = new Map<string, number>();
    const posts: XClaimPost[] = [];
    for (const post of sorted) {
      const parsed = parseXPostUrl(post.url);
      if (!parsed || seen.has(parsed.id)) continue;
      seen.add(parsed.id);
      const n = counts.get(parsed.handle) ?? 0;
      if (n >= X_CLAIMS_PER_HANDLE) continue;
      counts.set(parsed.handle, n + 1);
      posts.push({ ...post, id: parsed.id, url: parsed.url, handle: parsed.handle });
    }
    return { ...payload, posts };
  } catch {
    return null;
  }
}
