/*
 * NEW THEATER TEMPLATE — not loaded by the app (name doesn't match sitrep.*.ts).
 *
 * 1. Copy to src/sitrep.<id>.ts (e.g. sitrep.korea.ts) and rename the const.
 * 2. Fill name/short/status/map. Leave kpis/events/markers empty until Sitrep
 *    has named sources — an empty theater renders and builds fine.
 * 3. Add "<id>" to THEATER_ORDER in src/sitrep.ts. That's the only other edit.
 *
 * Rules: no coord = no marker. Every event needs a named source and a confidence
 * tag; CLAIM stays yellow until corroborated. No classified/FOUO/private Telegram.
 */
import type { Theater } from "./sitrep.types";

export const THEATER_TEMPLATE: Theater = {
  id: "template",
  name: "NEW THEATER / REGION",
  short: "NEW",
  status: "STANDBY — NO VERIFIED EVENTS",
  pip: "dim",
  map: { lat: 0, lon: 0, zoom: 5 },
  kpis: [],
  watch: [],
  events: [],
  markers: [],
};
