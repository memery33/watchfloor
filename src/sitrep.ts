import type { Theater } from "./sitrep.types";
export type {
  Confidence,
  SourceClass,
  Priority,
  TheaterId,
  Kpi,
  EventItem,
  Marker,
  Theater,
} from "./sitrep.types";

const THEATER_MODULES = import.meta.glob<Record<string, unknown>>("./sitrep.*.ts", { eager: true });

function isTheater(v: unknown): v is Theater {
  return !!v && typeof v === "object" && typeof (v as Theater).id === "string" && "map" in (v as object);
}

const DISCOVERED = new Map<string, Theater>();
for (const mod of Object.values(THEATER_MODULES)) {
  for (const v of Object.values(mod)) if (isTheater(v)) DISCOVERED.set(v.id, v);
}

export const SNAPSHOT = {
  dtgLocal: "2026-10-07 1824L",
  dtgZulu: "2026-10-07 2224Z",
  classification: "UNCLASSIFIED // OSINT // OPEN PRESS",
  watchcon: "ELEVATED",
  priorityTheater: "IRAN / GULF",
  sourceAge: "SNAPSHOT 07 OCT 2026 ~18:24 ET",
  disclaimer:
    "Best-effort open-source COP. Yellow = unverified claim. Dashed arcs are reconstructed from named origin+impact, not radar. Not a targeting product.",
};

// THEATER REGISTRY — rail order. One line per theater; a sitrep.<id>.ts file
// that isn't listed here is staged but hidden. Keys 1–9 follow this order.
export const THEATER_ORDER: string[] = ["overview", "iran", "levant", "ukraine", "sudan", "energy", "afpak"];

export const THEATERS: Theater[] = THEATER_ORDER.flatMap((id) => {
  const t = DISCOVERED.get(id);
  // A typo must not blank the public map: skip loudly instead of throwing.
  if (!t) console.error(`THEATER_ORDER lists "${id}" but no src/sitrep.*.ts exports a Theater with that id`);
  return t ? [t] : [];
});

export const TICKER = THEATERS[0].events.map(
  (e) => `${e.dtg}  ${e.location}  ${e.fact}`,
);
