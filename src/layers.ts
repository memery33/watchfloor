import type { FeatureCollection } from "geojson";
import type { Confidence, TheaterId } from "./sitrep";

// Map layers beyond the curated sitrep + GDELT claim overlay.
// Every layer is OSINT from a named public source. Not radar. Not a targeting product.
// Data owners: WAVES, STRIKES, FRONTS = Sitrep. fires.json, ships.json = Live.
// A layer goes live only after CoS approves it; empty arrays render nothing.

export type LayerId = "vectors" | "strikes" | "fronts" | "fires" | "ships";

export interface Endpoint {
  name: string;
  lat: number;
  lon: number;
}

// Daily drone / missile wave rebuilt from an official tally (UA Air Force, RU MoD,
// IDF, Saudi/GACA; Houthi statements stay CLAIM). Both ends named or it is not drawn.
export interface Wave {
  id: string;
  theaters: TheaterId[];
  dtg: string;
  from: Endpoint; // launch area
  to: Endpoint; // target region
  count: number | null; // null = tally gave no number; label shows type only
  type: string; // e.g. "Shahed", "ballistic", "cruise"
  confidence: Confidence;
  source: string; // named issuer, e.g. "Ukraine Air Force"
  url?: string;
}

// Geolocated strike pin from a named geolocator (GeoConfirmed, Sudans Post, ...).
export interface StrikePin {
  id: string;
  theaters: TheaterId[];
  dtg: string;
  name: string;
  lat: number;
  lon: number;
  confidence: Confidence;
  fact: string;
  geolocator: string;
  url: string; // the geolocator's own post or page; required
}

// Commercial-use rule (Michael, 2026-10-07): Watchfloor is built to sell. A source
// draws only if its license allows commercial use ("yes"). "paid" (paid license
// needed) and "no" stay hidden even when the data is in the repo. Register: docs/sources.md.
export type CommercialUse = "yes" | "no" | "paid";

// Front-line / control polygons. Drawn ONLY when licenseCleared is true
// (Ship's license review), commercialUse is "yes", and data is present.
// Attribution goes in the map footer.
export interface FrontSource {
  id: string;
  theater: TheaterId;
  name: string;
  license: string;
  url: string;
  asOf: string;
  licenseCleared: boolean;
  commercialUse: CommercialUse;
  data: FeatureCollection | null;
}

export const WAVES: Wave[] = [];
export const STRIKES: StrikePin[] = [];
export const FRONTS: FrontSource[] = [];

// ---- Live-owned payloads (public/data/*.json). Missing file = layer stays empty. ----

export interface FirePoint {
  lat: number;
  lon: number;
  acq: string; // ISO acquisition time
  theater: TheaterId;
  frp?: number;
}
export interface FirePayload {
  generated_at: string;
  source: string; // must name a VIIRS product
  attribution: string;
  commercial_use: CommercialUse; // must be "yes" or the layer stays empty
  points: FirePoint[];
}

export interface ShipPoint {
  lat: number;
  lon: number;
  at: string; // ISO position time, already delayed upstream
  kind: string; // "tanker", "cargo", ... never a name or identifier
  theater: TheaterId;
}
export interface ShipPayload {
  generated_at: string;
  delay_minutes: number;
  attribution: string;
  commercial_use: CommercialUse; // must be "yes" or the layer stays empty
  points: ShipPoint[];
}

export const MIN_SHIP_DELAY_MIN = 60;

export interface LayerMeta {
  label: string;
  desktop: boolean; // default on at >980px
  phone: boolean; // default on at <=980px
  cap: [number, number]; // max features drawn per theater [desktop, phone]
}

// Defaults keep the map readable: vectors + strikes on; fronts on desktop only;
// fires and ships off until someone asks for them. Caps are the phone budget.
export const LAYER_META: Record<LayerId, LayerMeta> = {
  vectors: { label: "VECTORS / WAVES (NOT RADAR)", desktop: true, phone: true, cap: [60, 25] },
  strikes: { label: "GEOLOCATED STRIKES", desktop: true, phone: true, cap: [200, 60] },
  fronts: { label: "FRONT LINES / CONTROL", desktop: true, phone: false, cap: [1, 1] },
  fires: { label: "THERMAL ANOMALY (NOT CONFIRMED STRIKE)", desktop: false, phone: false, cap: [400, 120] },
  ships: { label: "SHIPS (\u22651H DELAYED)", desktop: false, phone: false, cap: [300, 80] },
};
export const LAYER_ORDER: LayerId[] = ["vectors", "strikes", "fronts", "fires", "ships"];

function finiteCoord(lat: unknown, lon: unknown): boolean {
  return typeof lat === "number" && typeof lon === "number" && Math.abs(lat) <= 90 && Math.abs(lon) <= 180;
}

export function waveDrawable(w: Wave): boolean {
  return Boolean(w.from?.name && w.to?.name && finiteCoord(w.from.lat, w.from.lon) && finiteCoord(w.to.lat, w.to.lon));
}

export function waveLabel(w: Wave): string {
  const type = w.type.toUpperCase();
  return w.count != null && w.count > 0 ? `${w.count}\u00d7 ${type}` : type;
}

export function strikeDrawable(s: StrikePin): boolean {
  return Boolean(s.geolocator && /^https:\/\//.test(s.url) && finiteCoord(s.lat, s.lon));
}

export function frontDrawable(f: FrontSource): boolean {
  return f.licenseCleared === true && f.commercialUse === "yes" && f.data != null && Boolean(f.license && f.url);
}

async function getJson<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`./${path}?t=${Date.now()}`);
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export async function loadFires(): Promise<FirePayload | null> {
  const p = await getJson<FirePayload>("data/fires.json");
  if (!p || !Array.isArray(p.points) || !/VIIRS/i.test(p.source ?? "") || p.commercial_use !== "yes") return null;
  p.points = p.points.filter((x) => finiteCoord(x.lat, x.lon) && typeof x.theater === "string");
  return p;
}

export async function loadShips(): Promise<ShipPayload | null> {
  const p = await getJson<ShipPayload>("data/ships.json");
  if (!p || !Array.isArray(p.points) || !(p.delay_minutes >= MIN_SHIP_DELAY_MIN) || p.commercial_use !== "yes") return null;
  // Backstop only; the fetcher must enforce the delay server-side.
  const newest = Date.now() - MIN_SHIP_DELAY_MIN * 60_000;
  p.points = p.points
    .filter((x) => finiteCoord(x.lat, x.lon) && Date.parse(x.at) <= newest)
    .map((x) => ({ lat: x.lat, lon: x.lon, at: x.at, kind: String(x.kind ?? "vessel"), theater: x.theater }));
  return p;
}
