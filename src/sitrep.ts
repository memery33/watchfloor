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

import { THEATER_OVERVIEW } from "./sitrep.overview";
import { THEATER_IRAN } from "./sitrep.iran";
import { THEATER_LEVANT } from "./sitrep.levant";
import { THEATER_UKRAINE } from "./sitrep.ukraine";
import { THEATER_SUDAN } from "./sitrep.sudan";
import { THEATER_ENERGY } from "./sitrep.energy";
import { THEATER_AFPAK } from "./sitrep.afpak";

export const SNAPSHOT = {
  dtgLocal: "2026-09-24 0951L",
  dtgZulu: "2026-09-24 1351Z",
  classification: "UNCLASSIFIED // OSINT // OPEN PRESS",
  watchcon: "ELEVATED",
  priorityTheater: "IRAN / GULF",
  sourceAge: "SNAPSHOT 24 SEP 2026 ~09:51 ET",
  disclaimer:
    "Best-effort open-source COP. Yellow = unverified claim. Dashed arcs are reconstructed from named origin+impact, not radar. Not a targeting product.",
};

export const THEATERS: Theater[] = [
  THEATER_OVERVIEW,
  THEATER_IRAN,
  THEATER_LEVANT,
  THEATER_UKRAINE,
  THEATER_SUDAN,
  THEATER_ENERGY,
  THEATER_AFPAK,
];

export const TICKER = THEATERS[0].events.map(
  (e) => `${e.dtg}  ${e.location}  ${e.fact}`,
);
