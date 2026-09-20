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
export const TRACKS: Track[] = [
  {
    id: "houthi-riyadh-20sep",
    kind: "missile",
    confidence: "REPORTED",
    fact: "Houthi missile toward Riyadh intercepted — first air-raid alert this round.",
    theaters: ["overview", "iran", "levant", "energy"],
    from: { name: "SAADA / HOUTHI", lat: 16.94, lon: 43.76 },
    to: { name: "RIYADH", lat: 24.71, lon: 46.68 },
  },
  {
    id: "houthi-farasan-claim",
    kind: "missile",
    confidence: "CLAIM",
    fact: "GDELT/press cluster also tagged Farasan / Jizan during the Riyadh claim cycle.",
    theaters: ["overview", "energy"],
    from: { name: "YEMEN / HOUTHI", lat: 16.85, lon: 43.58 },
    to: { name: "FARASAN", lat: 16.70, lon: 42.12 },
  },
];
