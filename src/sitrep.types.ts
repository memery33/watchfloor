export type Confidence = "CONFIRMED" | "REPORTED" | "CLAIM" | "DELTA" | "HOLD";
export type SourceClass = "STATE" | "PRESS" | "MIL CLAIM" | "UN FFM" | "OPEN COMP";
export type Priority = "PRI-1" | "PRI-2" | "PRI-3";

export type TheaterId =
  | "overview"
  | "iran"
  | "levant"
  | "ukraine"
  | "sudan"
  | "energy"
  | "afpak";

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
