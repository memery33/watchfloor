import type { Confidence, Priority, TheaterId } from "./sitrep";

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
  if (event.lon > 70 || event.lon < 20) return false;
  if (Math.abs(event.lat - 60) < 0.2 && Math.abs(event.lon - 100) < 0.2) return false;
  if (event.lat === 0 && event.lon === 0) return false;
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

export function eventsForTheater(events: LiveEvent[], id: TheaterId): LiveEvent[] {
  const clean = events.filter(saneLive);
  if (id === "overview") {
    return clean.filter((event) => event.theater !== "overview").slice(0, 8);
  }
  return clean.filter((event) => event.theater === id).slice(0, 8);
}
