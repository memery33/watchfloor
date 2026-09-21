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
  {
    id: "ua-kapotnya-20sep",
    kind: "drone",
    confidence: "REPORTED",
    fact: "UA long-range strike on Gazprom Neft Moscow Oil Refinery (Kapotnya); AVT-6 / processing / isomerization units hit; large fire. Reuters/UA Gen Staff/Zelensky. Launch site not precisely named — origin is coarse UKRAINE LONG-RANGE.",
    theaters: ["overview", "ukraine", "energy"],
    from: { name: "UKRAINE / LONG-RANGE", lat: 51.0, lon: 33.5 },
    to: { name: "KAPOTNYA / MOSCOW ORF", lat: 55.635, lon: 37.795 },
  },
  {
    id: "ua-sofyino-20sep",
    kind: "drone",
    confidence: "REPORTED",
    fact: "UA also hit Modern Warehouse Technologies logistics complex in Sofyino (Ramensky district) per Fire Point / press.",
    theaters: ["overview", "ukraine"],
    from: { name: "UKRAINE / LONG-RANGE", lat: 51.0, lon: 33.5 },
    to: { name: "SOFYINO", lat: 55.50, lon: 38.18 },
  },
];
