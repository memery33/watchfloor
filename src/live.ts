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
]);

export function saneLive(event: LiveEvent): boolean {
  const loc = event.location.split(",")[0].trim().toLowerCase();
  if (GENERIC.has(loc)) return false;
  if (/sheremetyevo|khabarovsk/.test(loc)) return false;
  // No country allowlist. fetch_live.py keeps worldwide rows and tags anything
  // outside a theater box as "overview". Drop unknown theater ids, country
  // centroids, impossible coordinates, and dates outside the 30-day window.
  if (event.theater !== "overview" && !THEATERS.some((t) => t.id === event.theater)) return false;
  if (Math.abs(event.lat) > 90 || Math.abs(event.lon) > 180) return false;
  if (Math.abs(event.lat - 60) < 0.2 && Math.abs(event.lon - 100) < 0.2) return false;
  if (event.lat === 0 && event.lon === 0) return false;
  if (!dayInWindow(event.date, "30D")) return false;
  return true;
}

export async function loadLive(): Promise<LivePayload | null> {
  try {
    const res = await fetch(`./data/live.json?t=${Date.now()}`);
    if (!res.ok) return null;
    const payload = (await res.json()) as LivePayload;
    payload.events = (payload.events ?? []).filter(saneLive);
    return payload;
  } catch {
    return null;
  }
}

export const LIVE_EVENT_CAP = 300;

export function eventsForTheater(events: LiveEvent[], id: TheaterId): LiveEvent[] {
  const clean = events.filter(saneLive);
  // Overview is the worldwide catch-all, including rows tagged "overview"
  // because they sit outside every theater box.
  const rows = id === "overview" ? clean : clean.filter((event) => event.theater === id);
  return rows.slice(0, LIVE_EVENT_CAP);
}
