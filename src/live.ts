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

export async function loadLive(): Promise<LivePayload | null> {
  try {
    const res = await fetch(`./data/live.json?t=${Date.now()}`);
    if (!res.ok) return null;
    return (await res.json()) as LivePayload;
  } catch {
    return null;
  }
}

export function eventsForTheater(events: LiveEvent[], id: TheaterId): LiveEvent[] {
  if (id === "overview") return events.slice(0, 10);
  return events.filter((event) => event.theater === id).slice(0, 10);
}
