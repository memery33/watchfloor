import type { Confidence } from "./sitrep";
import type { LiveEvent } from "./live";
import type { Track } from "./tracks";

export const COLORS = {
  claim: "#ffe36b",
  reported: "#ffbf3c",
  confirmed: "#ff4d3c",
  delta: "#6fe3ff",
  hold: "#3cff8a",
  dim: "#6d7d8c",
};

export function colorForConfidence(c: Confidence): string {
  if (c === "CLAIM") return COLORS.claim;
  if (c === "REPORTED") return COLORS.reported;
  if (c === "CONFIRMED") return COLORS.confirmed;
  if (c === "DELTA") return COLORS.delta;
  return COLORS.hold;
}

export function dashForConfidence(c: Confidence): string | undefined {
  return c === "CLAIM" || c === "DELTA" ? "6 6" : undefined;
}

export function arcPoints(
  from: { lat: number; lon: number },
  to: { lat: number; lon: number },
  n = 28,
): [number, number][] {
  const lat1 = from.lat;
  const lon1 = from.lon;
  const lat2 = to.lat;
  const lon2 = to.lon;
  const dx = lon2 - lon1;
  const dy = lat2 - lat1;
  const dist = Math.hypot(dx, dy) || 1;
  const offset = dist * 0.22;
  const cx = (lat1 + lat2) / 2 - (dx / dist) * offset;
  const cy = (lon1 + lon2) / 2 + (dy / dist) * offset;
  const pts: [number, number][] = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const u = 1 - t;
    const lat = u * u * lat1 + 2 * u * t * cx + t * t * lat2;
    const lon = u * u * lon1 + 2 * u * t * cy + t * t * lon2;
    pts.push([lat, lon]);
  }
  return pts;
}

export function liveAge(iso: string | undefined): string {
  if (!iso) return "LIVE OVERLAY OFFLINE";
  const then = Date.parse(iso);
  if (!Number.isFinite(then)) return "LIVE OVERLAY STALE";
  const min = Math.max(0, Math.round((Date.now() - then) / 60000));
  if (min < 2) return "LIVE OVERLAY  <1m";
  if (min < 120) return `LIVE OVERLAY  ${min}m`;
  return `LIVE OVERLAY  ${Math.round(min / 60)}h`;
}

export function trackFits(track: Track, theaterId: string): boolean {
  return track.theaters.includes(theaterId as Track["theaters"][number]);
}

export function liveFits(event: LiveEvent, theaterId: string): boolean {
  if (theaterId === "overview") return true;
  return event.theater === theaterId;
}
