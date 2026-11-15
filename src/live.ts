import { THEATERS, type Confidence, type Priority, type TheaterId } from "./sitrep";
import { dayInWindow } from "./timewindow";

export interface LiveOrigin {
  name: string;
  lat: number;
  lon: number;
  inferred: boolean;
}

export interface LiveEvent {
  id: string;
  dtg: string;
  date: string;
  location: string;
  fact: string;
  source: string;
  confidence: Confidence;
  priority: Priority;
  lat: number;
  lon: number;
  event_type: string;
  theater: TheaterId;
  origin: LiveOrigin | null;
  url: string | null;
}

export interface LivePayload {
  generated_at: string;
  note: string;
  events: LiveEvent[];
}

const GENERIC = new Set([
  "russia",
  "iran",
  "iraq",
  "yemen",
  "israel",
  "ukraine",
  "sudan",
  "syria",
  "lebanon",
  "saudi arabia",
  "south sudan",
  "ethiopia",
  "united states",
]);

/** Country centroids at 0.1°, matching fetch_live.py after the enabled presets. */
const CENTROIDS: [number, number][] = [
  [60.0, 100.0],
  [32.0, 53.0],
  [33.0, 44.0],
  [15.5, 47.5],
  [16.0, 30.0],
  [8.0, 30.0],
  [8.0, 38.0],
  [39.8, -98.6], // United States 39.8282, -98.5795
  [27.8, -81.7], // Florida state centroid 27.8333, -81.717
];

/**
 * Match CPython `round(n, 1)`. Ties use the exact binary value, so a decimal
 * that looks like x.x5 can still fall above or below the halfway point.
 */
function roundTenth(n: number): number {
  if (!Number.isFinite(n) || n === 0) return 0;
  const sign = n < 0 ? -1 : 1;
  const buf = new ArrayBuffer(8);
  const f64 = new Float64Array(buf);
  const u64 = new BigUint64Array(buf);
  f64[0] = Math.abs(n);
  const bits = u64[0]!;
  const expBits = Number((bits >> 52n) & 0x7ffn);
  const frac = bits & ((1n << 52n) - 1n);
  let significand: bigint;
  let exp2: number;
  if (expBits === 0) {
    significand = frac;
    exp2 = -1022 - 52;
    if (significand === 0n) return 0;
  } else if (expBits === 0x7ff) {
    return n;
  } else {
    significand = frac | (1n << 52n);
    exp2 = expBits - 1023 - 52;
  }
  if (exp2 > 0) {
    significand <<= BigInt(exp2);
    exp2 = 0;
  }
  const scale = -exp2;
  const digitsInt = significand * 5n ** BigInt(scale);
  if (scale === 0) return sign * Number(digitsInt);
  const qPow = scale - 1;
  if (qPow <= 0) {
    const value = (sign * Number(digitsInt * 10n ** BigInt(-qPow))) / 10;
    return Object.is(value, -0) ? 0 : value;
  }
  const divisor = 10n ** BigInt(qPow);
  const quotient = digitsInt / divisor;
  const remainder = digitsInt % divisor;
  const half = divisor / 2n;
  let rounded = quotient;
  if (remainder > half || (remainder === half && (quotient & 1n) === 1n)) rounded += 1n;
  const value = (sign * Number(rounded)) / 10;
  return Object.is(value, -0) ? 0 : value;
}

function isCentroid(lat: number, lon: number): boolean {
  const rlat = roundTenth(lat);
  const rlon = roundTenth(lon);
  return CENTROIDS.some(([a, b]) => a === rlat && b === rlon);
}

function asClaim(event: LiveEvent): LiveEvent {
  return event.confidence === "CLAIM" ? event : { ...event, confidence: "CLAIM" };
}

export function saneLive(event: LiveEvent): boolean {
  if (event.confidence !== "CLAIM") return false;
  const loc = event.location.split(",")[0].trim().toLowerCase();
  if (GENERIC.has(loc)) return false;
  if (/sheremetyevo|khabarovsk/.test(loc)) return false;
  // No country allowlist. fetch_live.py keeps worldwide rows and tags anything
  // outside a theater box as "overview". Drop unknown theater ids, country
  // centroids, impossible coordinates, and dates outside the 30-day window.
  if (event.theater !== "overview" && !THEATERS.some((t) => t.id === event.theater)) return false;
  if (Math.abs(event.lat) > 90 || Math.abs(event.lon) > 180) return false;
  if (isCentroid(event.lat, event.lon)) return false;
  if (event.lat === 0 && event.lon === 0) return false;
  if (!dayInWindow(event.date, "30D")) return false;
  return true;
}

export async function loadLive(): Promise<LivePayload | null> {
  try {
    const res = await fetch(`./data/live.json?t=${Date.now()}`);
    if (!res.ok) return null;
    const payload = (await res.json()) as LivePayload;
    payload.events = (payload.events ?? []).map(asClaim).filter(saneLive);
    return payload;
  } catch {
    return null;
  }
}

export const LIVE_EVENT_CAP = 300;

export function eventsForTheater(events: LiveEvent[], id: TheaterId): LiveEvent[] {
  const clean = events.map(asClaim).filter(saneLive);
  // Overview is the worldwide catch-all, including rows tagged "overview"
  // because they sit outside every theater box.
  const rows = id === "overview" ? clean : clean.filter((event) => event.theater === id);
  return rows.slice(0, LIVE_EVENT_CAP);
}
