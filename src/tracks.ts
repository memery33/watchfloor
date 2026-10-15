import type { Confidence, TheaterId } from "./sitrep";

export interface Track {
  id: string;
  kind: "missile" | "drone" | "strike";
  confidence: Confidence;
  fact: string;
  theaters: TheaterId[];
  from: { name: string; lat: number; lon: number };
  to: { name: string; lat: number; lon: number };
}

// Reconstructed OSINT vectors — origin and impact both named.
// Dashed yellow = claim. Solid amber = reported. Never treat as radar.
// 2026-10-15 refresh: the four 20 Sep tracks aged out. No new track: no Oct 7-15 source
// names both a launch site and an impact point.
export const TRACKS: Track[] = [];
