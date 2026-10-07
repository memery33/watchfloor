export type Confidence = "CONFIRMED" | "REPORTED" | "CLAIM" | "DELTA" | "HOLD";
export type SourceClass = "STATE" | "PRESS" | "MIL CLAIM" | "UN FFM" | "OPEN COMP";
export type Priority = "PRI-1" | "PRI-2" | "PRI-3";

// Theater ids are data, not code. A new theater = one src/sitrep.<id>.ts file
// plus one line in THEATER_ORDER (src/sitrep.ts). See src/theater.template.ts.
export type TheaterId = string;

export interface Kpi {
  label: string;
  value: string;
  tone: "hot" | "warn" | "ok" | "dim";
}

export interface EventItem {
  id: string;
  dtg: string;
  location: string;
  fact: string;
  source: SourceClass;
  confidence: Confidence;
  priority: Priority;
  lat: number;
  lon: number;
}

export interface Marker {
  id: string;
  name: string;
  lat: number;
  lon: number;
  note: string;
  tone: "hot" | "warn" | "ok" | "dim";
}

export interface Theater {
  id: TheaterId;
  name: string;
  short: string;
  status: string;
  pip: "hot" | "warn" | "ok" | "dim";
  map: { lat: number; lon: number; zoom: number };
  kpis: Kpi[];
  watch: string[];
  events: EventItem[];
  markers: Marker[];
}
