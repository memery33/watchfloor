/** Static X claims feed. Read-only. Never plotted. */

export const X_CLAIMS_LIMIT = 50;

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
  handle: string;
  note: string;
  posts: XClaimPost[];
}

const KEEP = new Set(["original", "quote"]);

export async function loadXClaims(): Promise<XClaimsPayload | null> {
  try {
    const res = await fetch("./data/claims_x.json");
    if (!res.ok) return null;
    const payload = (await res.json()) as XClaimsPayload;
    const posts = (payload.posts ?? [])
      .filter((p) => p && KEEP.has(p.type) && p.confidence === "CLAIM" && typeof p.excerpt === "string")
      .sort((a, b) => (a.created_at < b.created_at ? 1 : a.created_at > b.created_at ? -1 : 0));
    return { ...payload, posts };
  } catch {
    return null;
  }
}
