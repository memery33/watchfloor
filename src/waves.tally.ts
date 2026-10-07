// Wave tally rows (CoS-approved 2026-10-07). Not wired into the UI; not bundled (outside the sitrep.*.ts glob).
// Watchfloor drone / missile wave layer (tally rows + explicit-pair vectors only).
// Unclassified, open sources only. Not a targeting product.
//
// Rules baked into this file:
// - Every number traces to the cited statement (url). Nothing is estimated or summed
//   across sources. `launched` / `downed` are omitted when the source gives none.
// - Pin coordinates: NGA GeoNames Server (GNS), US Government public domain; UFIs listed per pin.
//   (Pins live in src/layers.ts STRIKES.) Earlier OSM/Nominatim draft lookups were replaced; none remain.
//   Tally places here are names only (no coordinates): they are not drawn. No coordinates => no point.
// - A vector (layers.ts Wave) exists ONLY where the source itself ties a specific launch
//   area (or weapon group from that area) to a specific target place, quoted in `pairs`.
//   Listing launch areas and "main directions" side by side is NOT a pairing: no
//   cross-product of launch areas x targets, ever. count stays null unless the source
//   gives a count for that pair. `vector` = pairs.length > 0.
// - Saudi-led coalition intercept statements: REPORTED only when a named wire carries
//   them, with the note reading "per Saudi-led coalition, via <outlet>"; otherwise CLAIM.
// - Launch areas are recorded at the level the source names them (oblast / city).
// - Times: Kyiv and Moscow are both UTC+3 in this period (EEST / MSK). "L" = local
//   to the reporting party; "Z" = UTC. Post times come from the Telegram post stamp.
//
// Data-source terms (cited, not republished wholesale):
// - Ukraine Air Force (t.me/kpszsu): official state communications; no licence posted.
//   We cite figures with attribution and link to the post. Ukraine's Law No. 2811-IX
//   "On Copyright and Related Rights" (2022), Art. 8, excludes ordinary press reports of
//   news/facts and official documents of state bodies from copyright
//   (https://zakon.rada.gov.ua/laws/show/2811-20). Telegram's ToS governs the platform.
// - Russia MoD (t.me/mod_russia, mil.ru): official statements, CLAIM only; Russian Civil
//   Code Art. 1259(6) excludes official documents and "reports on events and facts of a
//   purely informational nature" from copyright. Cite + link; do not mirror media.
// - Wires (Reuters / AP / AFP): copyrighted, licence needed to republish text/photos.
//   We only cite facts with a link and short attribution — no text or media reuse.
// - Kyiv Independent: copyrighted (all rights reserved). Cite facts + link only.

import type { Confidence, TheaterId } from "./sitrep.types";
import type { Wave as LayerWave } from "./layers";

export interface WavePlace {
  name: string; // exactly as the source names it (English rendering)
  lat?: number; // only from a gazetteer lookup; omitted => no point
  lon?: number;
  geo?: string; // provenance of the coordinate (gazetteer + feature id)
  group?: string; // weapon group the source ties to this launch area, if any
}

export interface WaveTypeCount {
  type: string;
  launched?: number;
  downed?: number; // "shot down / suppressed" (UA) or "intercepted and destroyed" (RU / coalition)
  note?: string;
}

export interface WaveTally {
  id: string;
  theater: TheaterId;
  direction: string; // e.g. "RU→UA", "UA→RU", "YE(Houthi)→KSA"
  reporter: string; // who issued the tally / statement
  dtg: string; // reporting window, local time of the reporter
  dtgZulu?: string; // same window / post time in UTC where derivable
  launch: WavePlace[];
  target: WavePlace[];
  overRegions?: string[]; // RU MoD style "downed over" regions — NOT targets
  counts: { launched?: number; downed?: number; hits?: number; debris?: number; pending?: number };
  byType?: WaveTypeCount[];
  types: string[];
  source: string;
  url: string;
  corroboration?: { name: string; url: string }[];
  confidence: Confidence;
  vector: boolean; // true only if `pairs` is non-empty
  pairs?: WavePair[]; // explicit source-stated launch→target pairings
  note: string;
}

export interface WavePair {
  from: WavePlace;
  to: WavePlace;
  type: string;
  count?: number; // only if the source gives a count for THIS pair
  quote: string; // the source text that ties this launch area to this target
}

// ---------------------------------------------------------------------------
// Places: names only, exactly as the sources name them. Tally rows are not drawn, so they
// carry no coordinates. If a source ever states an explicit launch→target pair, both ends
// get looked up in NGA GeoNames Server (GNS, US Government public domain) with the UFI recorded.
// ---------------------------------------------------------------------------
const P = {
  oryol: { name: "Oryol" },
  millerovo: { name: "Millerovo" },
  bryansk: { name: "Bryansk" },
  shatalovo: { name: "Shatalovo" },
  kursk: { name: "Kursk" },
  primorsko: { name: "Primorsko-Akhtarsk" },
  donetskCity: { name: "Donetsk (temporarily occupied)" },
  donetskObl: { name: "Donetsk oblast (temporarily occupied territory)" },
  hvardiiske: { name: "Hvardiiske (temporarily occupied Crimea)" },
  azov: { name: "Sea of Azov" },
  caspian: { name: "Caspian Sea" },
  rostovObl: { name: "Rostov oblast" },
  bryanskObl: { name: "Bryansk oblast" },
  voronezhObl: { name: "Voronezh oblast" },
  vologdaObl: { name: "Vologda oblast" },
  kurskObl: { name: "Kursk oblast" },
  kyivObl: { name: "Kyiv oblast" },
  kharkivObl: { name: "Kharkiv oblast" },
  poltavaObl: { name: "Poltava oblast" },
  dniproObl: { name: "Dnipropetrovsk oblast" },
  // Saudi Arabia / Yemen — civilian airports and cities named by GACA / coalition / Yemeni govt
  kkia: { name: "King Khalid International Airport, Riyadh" },
  abhaApt: { name: "Abha International Airport" },
  khamis: { name: "Khamis Mushait" },
  jazanApt: { name: "King Abdullah bin Abdulaziz Airport, Jazan" },
  najranApt: { name: "Najran airport" },
  riyadhNorth: { name: "North of Riyadh (as stated)" },
  adenApt: { name: "Aden International Airport" },
  // Gaza — city / area level only, as the IDF names them
  gazaCity: { name: "Gaza City area" },
  khanYunis: { name: "Khan Yunis area" },
  nuseirat: { name: "Nuseirat area" },
} satisfies Record<string, WavePlace>;

const KPSZSU = "Ukraine Air Force (Povitriani Syly ZSU) Telegram @kpszsu";
const MOD = "Russia MoD Telegram @mod_russia";
const UA_TYPES_NIGHT = ["Shahed-type (incl. jet-powered)", "Gerbera", "Parodiya decoy"];

// ---------------------------------------------------------------------------
// UKRAINE — RU→UA waves (Ukraine Air Force daily tallies), 1–7 Oct 2026
// Confidence: REPORTED where the Kyiv Independent carried the AF figures
// (checked article by article); CLAIM otherwise.
// ---------------------------------------------------------------------------
export const WAVES_UKRAINE_RU_UA: WaveTally[] = [
  {
    id: "ua-af-n0110",
    theater: "ukraine",
    direction: "RU→UA",
    reporter: KPSZSU,
    dtg: "30 SEP 1800L – 01 OCT 0800L (Kyiv)",
    dtgZulu: "30 SEP 1500Z – 01 OCT 0500Z; posted 01 OCT 0500Z",
    launch: [P.oryol, P.millerovo, P.bryansk, P.shatalovo, P.donetskObl, P.hvardiiske],
    target: [],
    counts: { launched: 107, downed: 87, hits: 11, debris: 4 },
    byType: [{ type: "Shahed-type jet-powered", launched: 63 }],
    types: UA_TYPES_NIGHT,
    source: KPSZSU,
    url: "https://t.me/kpszsu/82077",
    corroboration: [{ name: "Kyiv Independent, 1 Oct", url: "https://kyivindependent.com/russian-attacks-kill-at-least-6-injure-38-across-ukraine-amid-another-overnight-drone-barrage-nationwide/" }],
    confidence: "REPORTED",
    vector: false,
    note: "Preliminary as of 0800L; attack ongoing. AF post names no main target direction → no vector.",
  },
  {
    id: "ua-af-d0110",
    theater: "ukraine",
    direction: "RU→UA",
    reporter: KPSZSU,
    dtg: "01 OCT 0630L – 1800L (Kyiv), daytime",
    dtgZulu: "01 OCT 0330Z – 1500Z; posted 01 OCT 1510Z",
    launch: [],
    target: [],
    counts: { launched: 97, downed: 78 },
    byType: [{ type: "Shahed-type jet-powered", launched: 66, downed: 55 }],
    types: ["Shahed-type (incl. jet-powered)", "Gerbera", "other drones"],
    source: KPSZSU,
    url: "https://t.me/kpszsu/82167",
    corroboration: [{ name: "Ukrinform (not a wire per house rule)", url: "https://www.ukrinform.net/rubric-ato/4170133-ukrainian-air-defenses-neutralize-78-out-of-97-russian-drones-on-oct-1.html" }],
    confidence: "CLAIM",
    vector: false,
    note: "Daytime tally; no launch areas or targets named. Not found in Reuters/AP/Kyiv Independent → CLAIM. ~10 drones still airborne at 1800L.",
  },
  {
    id: "ua-af-n0210",
    theater: "ukraine",
    direction: "RU→UA",
    reporter: KPSZSU,
    dtg: "01 OCT 1800L – 02 OCT 0800L (Kyiv)",
    dtgZulu: "01 OCT 1500Z – 02 OCT 0500Z; posted 02 OCT 0459Z",
    launch: [P.bryansk, P.primorsko, P.donetskObl, P.hvardiiske],
    target: [],
    counts: { launched: 108, downed: 88, hits: 11, debris: 5 },
    byType: [{ type: "Shahed-type jet-powered", launched: 47 }],
    types: UA_TYPES_NIGHT,
    source: KPSZSU,
    url: "https://t.me/kpszsu/82252",
    corroboration: [{ name: "Kyiv Independent, 2 Oct", url: "https://kyivindependent.com/russian-attacks-kill-2-injure-27-across-ukraine-hit-passenger-bus-with-fpv-drone-in-kramatorsk/" }],
    confidence: "REPORTED",
    vector: false,
    note: "No main target direction named → no vector.",
  },
  {
    id: "ua-af-n0310",
    theater: "ukraine",
    direction: "RU→UA",
    reporter: KPSZSU,
    dtg: "02 OCT 1800L – 03 OCT 0900L (Kyiv)",
    dtgZulu: "02 OCT 1500Z – 03 OCT 0600Z; posted 03 OCT 0601Z",
    launch: [P.bryansk, P.primorsko, P.donetskCity, P.hvardiiske],
    target: [],
    counts: { launched: 157, downed: 131, hits: 12, debris: 5 },
    byType: [{ type: "Shahed-type jet-powered", launched: 45 }],
    types: [...UA_TYPES_NIGHT, "Banderol (loitering munition, morning, Odesa oblast — uncounted)"],
    source: KPSZSU,
    url: "https://t.me/kpszsu/82542",
    corroboration: [{ name: "Kyiv Independent, 3 Oct", url: "https://kyivindependent.com/russian-strikes-kill-8-injure-81-across-ukraine-hit-kyiv-bridge-2/" }],
    confidence: "REPORTED",
    vector: false,
    note: "Same post: morning Banderol loitering-munition attack on Odesa oblast, no count given. No main target direction → no vector.",
  },
  {
    id: "ua-af-n0410",
    theater: "ukraine",
    direction: "RU→UA",
    reporter: KPSZSU,
    dtg: "03 OCT 1800L – 04 OCT 0830L (Kyiv)",
    dtgZulu: "03 OCT 1500Z – 04 OCT 0530Z; posted 04 OCT 0542Z",
    launch: [P.oryol, P.kursk, P.millerovo, P.primorsko, P.donetskCity, P.hvardiiske],
    target: [],
    counts: { launched: 135, downed: 125, hits: 5, debris: 5 },
    byType: [
      { type: "Shahed / Gerbera / other drones", downed: 123 },
      { type: "Shahed-type jet-powered", launched: 52 },
      { type: "Banderol / Dan-T", downed: 2, note: "launch count not given separately" },
    ],
    types: [...UA_TYPES_NIGHT, "Banderol / Dan-T"],
    source: KPSZSU,
    url: "https://t.me/kpszsu/82681",
    corroboration: [{ name: "Kyiv Independent, 4 Oct", url: "https://kyivindependent.com/russian-attacks-kill-at-least-5-injure-30-across-ukraine/" }],
    confidence: "REPORTED",
    vector: false,
    note: "Headline 125 = 123 drones + 2 Banderol/Dan-T. 135 is the strike-UAV launch figure as stated. Zelensky (via UA.NEWS) named Kyiv, Dnipropetrovsk, Kharkiv, Donetsk, Sumy, Zaporizhzhia as targets — different source from the tally, so no vector.",
  },
  {
    id: "ua-af-n0510",
    theater: "ukraine",
    direction: "RU→UA",
    reporter: KPSZSU,
    dtg: "04 OCT 1800L – 05 OCT 0800L (Kyiv)",
    dtgZulu: "04 OCT 1500Z – 05 OCT 0500Z; posted 05 OCT 0457Z",
    launch: [P.oryol, P.kursk, P.shatalovo, P.millerovo, P.primorsko, P.donetskCity, P.hvardiiske],
    target: [],
    counts: { launched: 205, downed: 172, hits: 13, debris: 3 },
    byType: [{ type: "Shahed-type jet-powered", launched: 49 }],
    types: [...UA_TYPES_NIGHT, "Banderol / Dan-T"],
    source: KPSZSU,
    url: "https://t.me/kpszsu/82937",
    corroboration: [{ name: "Kyiv Independent, 5 Oct", url: "https://kyivindependent.com/kharkiv-targeted-in-deadly-banderol-strike-as-russia-kills-5-injures-61-across-ukraine-over-past-day/" }],
    confidence: "REPORTED",
    vector: false,
    note: "KI adds 'as well as two Banderol loitering munitions' downed; the AF post itself says 172 drones only — AF figure used. No target direction → no vector.",
  },
  {
    id: "ua-af-n0610",
    theater: "ukraine",
    direction: "RU→UA",
    reporter: KPSZSU,
    dtg: "05 OCT 1800L – 06 OCT 0800L (Kyiv)",
    dtgZulu: "05 OCT 1500Z – 06 OCT 0500Z; posted 06 OCT 0501Z",
    launch: [P.oryol, P.kursk, P.shatalovo, P.millerovo, P.primorsko, P.donetskCity, P.hvardiiske, P.azov],
    target: [],
    counts: { launched: 137, downed: 114, hits: 17, debris: 4 },
    byType: [{ type: "Shahed-type jet-powered", launched: 49 }],
    types: [...UA_TYPES_NIGHT, "Banderol / Dan-T"],
    source: KPSZSU,
    url: "https://t.me/kpszsu/83263",
    corroboration: [{ name: "Kyiv Independent, 6 Oct", url: "https://kyivindependent.com/russian-strikes-kill-13-injure-104-across-ukraine-damage-kryvyi-rih-hospital/" }],
    confidence: "REPORTED",
    vector: false,
    note: "Launch from 'the waters of the Sea of Azov' — water body, name only. No target direction → no vector.",
  },
  {
    id: "ua-af-n0710",
    theater: "ukraine",
    direction: "RU→UA",
    reporter: KPSZSU,
    dtg: "06 OCT 1800L – 07 OCT 0900L (Kyiv)",
    dtgZulu: "06 OCT 1500Z – 07 OCT 0600Z; posted 07 OCT 0604Z",
    launch: [
      { ...P.rostovObl, group: "Zircon/Oniks anti-ship missiles" },
      { ...P.bryanskObl, group: "Iskander-M / S-400 / KN-23 ballistic" },
      { ...P.voronezhObl, group: "Iskander-M / S-400 / KN-23 ballistic" },
      { ...P.vologdaObl, group: "Kh-101 (air-launched cruise)" },
      { ...P.kurskObl, group: "Iskander-K (ground-launched cruise)" },
      { ...P.caspian, group: "Kalibr (sea-launched cruise)" },
      { ...P.oryol, group: "strike UAVs" },
      { ...P.primorsko, group: "strike UAVs" },
      { ...P.donetskCity, group: "strike UAVs" },
      { ...P.hvardiiske, group: "strike UAVs" },
    ],
    target: [P.kyivObl, P.kharkivObl, P.poltavaObl, P.dniproObl],
    counts: { downed: 161, hits: 18, debris: 5, pending: 6 },
    byType: [
      { type: "Iskander-M / KN-23 / S-400 ballistic + Zircon/Oniks", downed: 5, note: "launch count not given" },
      { type: "Kh-101 / Iskander-K / Kalibr cruise", launched: 48, downed: 39, note: "6 more cruise missiles 'being clarified'" },
      { type: "Shahed-type / Gerbera / Parodiya", launched: 130, downed: 117 },
      { type: "of which Shahed jet-powered", launched: 46, downed: 38 },
    ],
    types: ["Zircon/Oniks", "Iskander-M", "S-400", "KN-23", "Kh-101", "Iskander-K", "Kalibr", "Shahed-type (incl. jet-powered)", "Gerbera", "Parodiya decoy"],
    source: KPSZSU,
    url: "https://t.me/kpszsu/83516",
    corroboration: [
      { name: "Kyiv Independent, 7 Oct", url: "https://kyivindependent.com/russia-slams-kyiv-in-mass-missile-drone-attack-on-putins-74th-birthday/" },
      { name: "Ukrainska Pravda, 7 Oct", url: "https://www.pravda.com.ua/eng/news/2026/10/07/8056828/" },
    ],
    confidence: "REPORTED",
    vector: false,
    pairs: [],
    note: "NO VECTOR: re-read 7 Oct ~19:25 ET. The post lists launch areas per weapon group and, separately, 'Основні напрямки удару – Київщина, Харківщина, Полтавщина, Дніпропетровщина' (main strike directions) for the whole attack; it never ties a launch area or group to a target. The Kyiv Independent piece adds no pairing (only 'drones headed toward Ukraine's capital at 9 p.m.' with no launch area). TOTALS per post (as of 0900L): 48 cruise missiles Kh-101/Iskander-K/Kalibr launched, 39 shot down/suppressed, 6 more 'being clarified'; 130 strike UAVs launched (46 jet), 117 downed (38 jet); 5 ballistic/anti-ship (Iskander-M/KN-23/S-400/Zircon/Oniks) downed, launch count not stated; hits at 18 locations, debris at 5; 161 targets downed in all. Main directions per AF: Kyiv, Kharkiv, Poltava, Dnipropetrovsk oblasts. Total launched not stated (ballistic/anti-ship launch counts absent). KI writes 'as of 10 a.m.'; AF post says 0900L. Launch areas are oblast/city level as named; Caspian Sea has no point. RU MoD claimed the same night it hit military-industrial and Odesa port targets (via NBC/AP) — CLAIM, not represented as a vector.",
  },
];

// ---------------------------------------------------------------------------
// UKRAINE — UA→RU: Russia MoD "intercepted and destroyed" claims, 1–7 Oct 2026.
// Always CLAIM. MoD names only the regions over which drones were downed (not
// targets) and names no launch areas → never a vector. "aircraft-type UAVs".
// ---------------------------------------------------------------------------
const mod = (
  id: string,
  dtg: string,
  dtgZulu: string,
  downed: number,
  overRegions: string[],
  post: number,
  note = "",
): WaveTally => ({
  id,
  theater: "ukraine",
  direction: "UA→RU",
  reporter: MOD,
  dtg,
  dtgZulu,
  launch: [],
  target: [],
  overRegions,
  counts: { downed },
  types: ["Ukrainian 'aircraft-type' UAVs (MoD wording)"],
  source: MOD,
  url: `https://t.me/mod_russia/${post}`,
  confidence: "CLAIM",
  vector: false,
  note: note || "Russian MoD intercept claim; regions are where MoD says drones were downed, not targets.",
});

export const WAVES_UKRAINE_UA_RU_MOD: WaveTally[] = [
  mod("ru-mod-n0110", "30 SEP 2000 MSK – 01 OCT 0800 MSK", "30 SEP 1700Z – 01 OCT 0500Z; posted 01 OCT 0534Z", 330,
    ["Bryansk", "Belgorod", "Smolensk", "Kaluga", "Tula", "Kursk", "Tver", "Lipetsk", "Oryol", "Tambov", "Astrakhan oblasts", "Moscow region", "Crimea (MoD: 'Republic of Crimea')", "Black Sea"], 67797),
  mod("ru-mod-d0110", "01 OCT 0800–2000 MSK", "01 OCT 0500Z–1700Z; posted 01 OCT 1742Z", 227,
    ["Kaluga", "Bryansk", "Kursk", "Belgorod", "Tula", "Voronezh", "Tambov", "Rostov", "Saratov", "Samara oblasts", "Krasnodar Krai", "Moscow region", "Crimea", "Black Sea"], 67835),
  mod("ru-mod-n0210", "01 OCT 2000 MSK – 02 OCT 0800 MSK", "01 OCT 1700Z – 02 OCT 0500Z; posted 02 OCT 0559Z", 646,
    ["Belgorod", "Bryansk", "Kursk", "Voronezh", "Kaluga", "Tula", "Oryol", "Rostov", "Saratov", "Volgograd", "Ulyanovsk", "Samara", "Astrakhan oblasts", "Crimea", "Black Sea", "Sea of Azov"], 67844),
  mod("ru-mod-d0210", "02 OCT 0800–2000 MSK", "02 OCT 0500Z–1700Z; posted 02 OCT 1747Z", 209,
    ["Astrakhan", "Belgorod", "Bryansk", "Voronezh", "Kaluga", "Kursk", "Nizhny Novgorod", "Oryol", "Penza", "Samara", "Saratov", "Tula oblasts", "Chuvash Republic", "Crimea", "Black Sea"], 67874),
  mod("ru-mod-n0310", "02 OCT 2000 MSK – 03 OCT 0800 MSK", "02 OCT 1700Z – 03 OCT 0500Z; posted 03 OCT 0543Z", 218,
    ["Astrakhan", "Belgorod", "Bryansk", "Voronezh", "Kaluga", "Kursk", "Oryol", "Rostov", "Ryazan", "Smolensk", "Tula oblasts", "Moscow region", "Krasnodar Krai", "Crimea", "Sea of Azov", "Black Sea"], 67892),
  mod("ru-mod-d0310", "03 OCT 0800–2000 MSK", "03 OCT 0500Z–1700Z; posted 03 OCT 1710Z", 244,
    ["Belgorod", "Bryansk", "Kaluga", "Kursk", "Oryol", "Smolensk", "Tula oblasts", "Moscow region", "Republic of Adygea", "Crimea", "Krasnodar Krai", "Sea of Azov", "Black Sea"], 67908),
  mod("ru-mod-n0410", "03 OCT 2000 MSK – 04 OCT 0800 MSK", "03 OCT 1700Z – 04 OCT 0500Z; posted 04 OCT 0524Z", 559,
    ["Astrakhan", "Belgorod", "Bryansk", "Volgograd", "Voronezh", "Kaluga", "Kursk", "Oryol", "Rostov", "Smolensk", "Tula oblasts", "Moscow region", "Republic of Adygea", "Crimea", "Krasnodar Krai", "Sea of Azov", "Black Sea"], 67914),
  mod("ru-mod-d0410", "04 OCT 0800–2000 MSK", "04 OCT 0500Z–1700Z; posted 04 OCT 1739Z", 280,
    ["Kursk", "Belgorod", "Smolensk", "Bryansk", "Kaluga", "Tula", "Oryol", "Rostov oblasts", "Moscow region", "Krasnodar Krai", "Crimea", "Black Sea", "Sea of Azov"], 67945),
  mod("ru-mod-n0510", "04 OCT 2000 MSK – 05 OCT 0800 MSK", "04 OCT 1700Z – 05 OCT 0500Z; posted 05 OCT 0538Z", 199,
    ["Belgorod", "Bryansk", "Kaluga", "Kursk", "Oryol", "Ryazan", "Tula", "Rostov oblasts", "Moscow region", "Krasnodar Krai", "Crimea", "Black Sea"], 67953),
  mod("ru-mod-d0510", "05 OCT 0800–2000 MSK", "05 OCT 0500Z–1700Z; posted 05 OCT 1744Z", 343,
    ["Belgorod", "Bryansk", "Kaluga", "Kursk", "Oryol", "Tula oblasts", "Moscow region", "Krasnodar Krai", "Stavropol Krai", "Crimea", "Black Sea"], 67969),
  mod("ru-mod-n0610", "05 OCT 2000 MSK – 06 OCT 0900 MSK", "05 OCT 1700Z – 06 OCT 0600Z; posted 06 OCT 0645Z", 868,
    ["Belgorod", "Bryansk", "Kaluga", "Kursk", "Lipetsk", "Oryol", "Ryazan", "Smolensk", "Tver", "Tula oblasts", "Moscow region", "Crimea", "Sea of Azov"], 67978,
    "Largest MoD claim of the week; window runs to 0900 MSK (not 0800). Reuters (via The Hindu) carried it as 'nearly 900'. Moscow mayor Sobyanin separately claimed 650 drones flew toward the Moscow region, 105 downed approaching Moscow (Kyiv Independent) — also CLAIM, overlapping, not additive."),
  mod("ru-mod-d0610", "06 OCT 0800–2000 MSK", "06 OCT 0500Z–1700Z; posted 06 OCT 1722Z", 110,
    ["Belgorod", "Bryansk", "Kursk", "Tula", "Ryazan", "Oryol", "Lipetsk", "Rostov oblasts", "Moscow region", "Crimea"], 67999),
  mod("ru-mod-n0710", "night 06–07 OCT (window not stated in post)", "posted 07 OCT 0542Z", 311,
    ["Belgorod", "Bryansk", "Kursk", "Tula", "Oryol", "Lipetsk", "Voronezh", "Smolensk", "Tambov", "Kaluga", "Saratov", "Samara", "Penza", "Rostov", "Volgograd oblasts", "Perm Krai", "Crimea", "Black Sea", "Sea of Azov"], 68007,
    "Post omits the time window ('during the past night'). Zelensky said the same day Ukraine hit oil facilities and a training ground in Perm, Samara and Astrakhan regions (NBC) — UA claim, not a vector."),
  mod("ru-mod-d0710", "07 OCT 0800–2000 MSK", "07 OCT 0500Z–1700Z; posted 07 OCT 1751Z", 59,
    ["Belgorod", "Bryansk", "Kaluga", "Kursk", "Rostov", "Smolensk", "Tver", "Tula oblasts", "Crimea", "Black Sea"], 68026),
];

// ---------------------------------------------------------------------------
// SAUDI / GULF + YEMEN (Houthi). No per-wave launch site is named by any source
// → no vectors. Coalition spokesman: Houthi missile threats originate from Sanaa,
// Saada and Amran (general statement, not tied to a specific launch).
// GACA statements (damage/casualties at its own airports) = REPORTED via outlets.
// Saudi-led coalition intercept statements (CoS rule, 7 Oct): REPORTED only when a named
// wire carries them, note reads "per Saudi-led coalition, via <outlet>"; else CLAIM.
// Houthi (Saree) statements = always CLAIM.
// ---------------------------------------------------------------------------
export const WAVES_GULF_YEMEN: WaveTally[] = [
  {
    id: "ksa-gaca-0510",
    theater: "yemen",
    direction: "YE(Houthi)→KSA",
    reporter: "Saudi General Authority of Civil Aviation (GACA)",
    dtg: "05 OCT evening (Mon), statement 06 OCT",
    launch: [],
    target: [P.jazanApt, P.najranApt],
    counts: {},
    types: ["not specified by GACA"],
    source: "GACA statement via Al Jazeera",
    url: "https://www.aljazeera.com/news/2026/10/6/saudi-arabia-says-three-wounded-in-attacks-on-airports-near-yemen-border",
    corroboration: [{ name: "Asharq Al-Awsat", url: "https://english.aawsat.com/node/5326514" }],
    confidence: "REPORTED",
    vector: false,
    note: "GACA: two attacks hit Jazan and Najran airports; 3 minor injuries, material damage. GACA names no attacker; Houthis claimed strikes on southern Saudi sites. No launch/intercept counts.",
  },
  {
    id: "ye-saree-0510",
    theater: "yemen",
    direction: "YE(Houthi)→KSA",
    reporter: "Houthi military spokesman Yahya Saree",
    dtg: "statement dated 05 OCT (published 06 OCT)",
    launch: [],
    target: [
      P.kkia,
      { name: "Aramco refinery, Rabigh (claimed)" },
      P.abhaApt,
      { name: "Khamis Mushait air base (claimed)" },
      { name: "Aqifa camp, Asir (claimed)" },
      { name: "'critical sites' in Najran and Jizan (claimed)" },
    ],
    counts: {},
    types: ["ballistic missiles", "cruise missiles", "drones"],
    source: "Houthi statement (Al-Thawra Net)",
    url: "https://en.althawranews.net/2026/10/armed-forces-target-king-khalid-airport-in-riyadh-aramco-refinery-in-rabigh-abha-airport-khamis-mushait-airbase-sensitive-sites-in-asir-najran-jizan/",
    confidence: "CLAIM",
    vector: false,
    note: "'Three operations' with 'a large number' of missiles and drones — no counts. Rabigh hit not confirmed by Saudi/Aramco in sources read. Military-site names kept without points.",
  },
  {
    id: "ye-saree-0610-dughayrir",
    theater: "yemen",
    direction: "YE(Houthi)→KSA",
    reporter: "Houthi military spokesman Yahya Saree",
    dtg: "06 OCT (CGTN 1714 Beijing = 0914Z)",
    launch: [],
    target: [{ name: "Al-Dughayrir camp, Jizan (claimed)" }],
    counts: {},
    types: ["ballistic missiles"],
    source: "Saree statement via CGTN",
    url: "https://news.cgtn.com/news/2026-10-06/news-1R1r2EGPXxe/p.html",
    confidence: "CLAIM",
    vector: false,
    note: "'A number of ballistic missiles'; casualty claim unverified. No point (military camp, single-party claim).",
  },
  {
    id: "ksa-coal-0610-khamis",
    theater: "yemen",
    direction: "YE(Houthi)→KSA",
    reporter: "Saudi-led coalition spokesman Maj. Gen. Turki al-Maliki (X)",
    dtg: "06 OCT (Tue)",
    launch: [],
    target: [P.khamis],
    counts: { launched: 1, downed: 1 },
    types: ["ballistic missile"],
    source: "Saudi-led coalition statement via Anadolu Agency",
    url: "https://www.aa.com.tr/en/middle-east/saudi-led-coalition-intercepts-houthi-ballistic-missile-targeting-khamis-mushait/4080057",
    corroboration: [{ name: "Saudi Gazette", url: "https://saudigazette.com.sa/article/665179/saudi-arabia/houthi-ballistic-missile-intercepted-over-khamis-mushait" }],
    confidence: "REPORTED",
    vector: false,
    note: "Per Saudi-led coalition, via Anadolu Agency (wire): one ballistic missile 'fired toward Khamis Mushait', intercepted and destroyed. Launch point not given. REPORTED because a named wire (AA) carried it; Saudi Gazette also carried it.",
  },
  {
    id: "ksa-gaca-0607",
    theater: "yemen",
    direction: "YE(Houthi)→KSA",
    reporter: "Saudi General Authority of Civil Aviation (GACA)",
    dtg: "06–07 OCT (Tue–Wed), statement 07 OCT",
    launch: [],
    target: [P.abhaApt, P.kkia],
    counts: {},
    types: ["not specified by GACA"],
    source: "GACA statement via Al Jazeera",
    url: "https://www.aljazeera.com/news/2026/10/7/saudi-arabia-says-three-foreign-nationals-killed-in-attacks-on-airports",
    corroboration: [{ name: "AFP", url: "https://www.afp.com/en/saudi-arabia-says-three-dead-airports-after-houthis-claim-attacks" }],
    confidence: "REPORTED",
    vector: false,
    note: "GACA: Abha airport attack killed 2 (Moroccan, Algerian), injured 28; KKIA attack killed 1 (Sudanese), injured 8. No launch/intercept counts.",
  },
  {
    id: "ye-saree-0710",
    theater: "yemen",
    direction: "YE(Houthi)→KSA",
    reporter: "Houthi military spokesman Yahya Saree (X)",
    dtg: "early 07 OCT",
    launch: [],
    target: [
      P.kkia,
      P.abhaApt,
      { name: "Khamis Mushait air base (claimed)" },
      { name: "Dagharir camp, Jizan (claimed)" },
      { name: "Aakifah camp, Asir (claimed)" },
      { name: "Al-Mawsim camp, Jizan (claimed)" },
    ],
    counts: {},
    types: ["drones", "ballistic missiles"],
    source: "Saree statements via Anadolu (A News)",
    url: "https://www.anews.com.tr/middle-east/2026/10/07/yemens-houthis-claim-attacks-on-saudi-airports-military-bases",
    confidence: "CLAIM",
    vector: false,
    note: "'Several drones' at KKIA; ballistic missiles + drones at Abha airport / Khamis Mushait; 'a large number' at the three camps. No counts.",
  },
  {
    id: "ksa-coal-0710-riyadh",
    theater: "yemen",
    direction: "YE(Houthi)→KSA",
    reporter: "Saudi-led coalition spokesman Maj. Gen. Turki al-Maliki (X)",
    dtg: "07 OCT (Wed)",
    launch: [],
    target: [P.riyadhNorth],
    counts: { downed: 1 },
    types: ["ballistic missile"],
    source: "Saudi-led coalition statement via AFP (carried by Al-Monitor)",
    url: "https://www.al-monitor.com/originals/2026/10/saudi-coalition-says-shot-down-houthi-missile",
    corroboration: [{ name: "Al Jazeera / Reuters", url: "https://www.aljazeera.com/news/2026/10/7/yemens-houthis-attack-aden-airport-saudi-forces-down-missile-near-riyadh" }],
    confidence: "REPORTED",
    vector: false,
    note: "Per Saudi-led coalition, via AFP (wire; text carried by Al-Monitor): one ballistic missile intercepted and destroyed 'north of Riyadh'; coalition says it tracked the launch platform over Sanaa. Not a source-stated launch→target pair with two points ('north of Riyadh' has no point), so no vector. REPORTED because a named wire (AFP) carried it; Reuters via Al Jazeera also reported the interception.",
  },
  {
    id: "ye-moT-0710-aden",
    theater: "yemen",
    direction: "Houthi→Aden (govt-held)",
    reporter: "Yemen (govt) Ministry of Transport",
    dtg: "07 OCT",
    launch: [],
    target: [P.adenApt],
    counts: {},
    byType: [{ type: "ballistic missiles", launched: 2, note: "'at least two'" }, { type: "drones", note: "'several'" }],
    types: ["ballistic missiles", "drones"],
    source: "Ministry of Transport statement via Al Jazeera / Reuters",
    url: "https://www.aljazeera.com/news/2026/10/7/yemens-houthis-attack-aden-airport-saudi-forces-down-missile-near-riyadh",
    corroboration: [{ name: "AP", url: "https://apnews.com/article/yemen-houthis-saudi-airport-aden-rebels-f22f20dd78b03b741dfa1279881cedbb" }],
    confidence: "REPORTED",
    vector: false,
    note: "'At least two' is a floor, recorded as 2 only in byType. One missile landed near the runway; Cairo flight diverted to Jeddah (ministry). Houthis say they targeted Saudi supplies at Badr camp near the airport (CLAIM).",
  },
];

// ---------------------------------------------------------------------------
// LEVANT — IDF statements. No IDF statement this week (30 Sep–7 Oct) on launches
// from Yemen or Iran, or on projectiles crossing from Lebanon (checked t.me/s/idfofficial).
// IDF strike statements are the IDF's own claims → CLAIM, except where a wire carried
// the IDF comment (REPORTED). Area-level points only, as named.
// ---------------------------------------------------------------------------
const idf = (id: string, dtg: string, area: WavePlace, post: number, note: string): WaveTally => ({
  id,
  theater: "levant",
  direction: "IL→Gaza",
  reporter: "IDF (Telegram @idfofficial)",
  dtg,
  launch: [],
  target: [area],
  counts: {},
  types: ["air strike (IDF statement)"],
  source: "IDF statement",
  url: `https://t.me/idfofficial/${post}`,
  confidence: "CLAIM",
  vector: false,
  note,
});

export const WAVES_LEVANT: WaveTally[] = [
  idf("idf-0110-gaza", "strike 30 SEP (Wed), stmt 01 OCT", P.gazaCity, 19292, "IDF says aerial strike killed a Hamas platoon commander."),
  idf("idf-0110-ky", "strike 30 SEP (Wed), stmt 01 OCT", P.khanYunis, 19298, "IDF says strike killed a PIJ rocket-array member."),
  idf("idf-0210-ky", "strike 01 OCT (Thu), stmt 02 OCT", P.khanYunis, 19304, "IDF/ISA say strike killed a Hamas sniper."),
  idf("idf-0310-gaza", "strikes 02 OCT (Fri), stmt 03 OCT", P.gazaCity, 19305, "IDF says two strikes in the Gaza City area killed two PIJ commanders."),
  idf("idf-0510-nus", "strike 02 OCT (Fri), stmt 05 OCT", P.nuseirat, 19317, "IDF/ISA say strike killed a Hamas Nukhba platoon commander."),
  idf("idf-0410-ky", "strikes 03–04 OCT (Sat–Sun), stmts 04 OCT", P.khanYunis, 19312, "IDF says strikes on 3 and 4 Oct killed two Hamas members; a separate 4 Oct Khan Yunis strike in post 19311."),
  {
    id: "idf-0610-gaza-reuters",
    theater: "levant",
    direction: "IL→Gaza",
    reporter: "Israeli military (to Reuters)",
    dtg: "06 OCT",
    launch: [],
    target: [P.gazaCity],
    counts: {},
    types: ["air strike"],
    source: "Reuters via Al Arabiya",
    url: "https://english.alarabiya.net/News/middle-east/2026/10/06/israeli-strikes-kill-two-people-in-gaza-medics-say",
    confidence: "REPORTED",
    vector: false,
    note: "Medics: 2 killed, one near al-Shifa Hospital; Israeli military told Reuters both strikes targeted militants.",
  },
  {
    id: "idf-0710-leb-false",
    theater: "levant",
    direction: "IL (air defence), S. Lebanon",
    reporter: "IDF (Telegram @idfofficial)",
    dtg: "07 OCT (post 1820Z)",
    launch: [],
    target: [{ name: "southern Lebanon, IDF operating area (no point)" }],
    counts: {},
    types: ["interceptor launch at a false target"],
    source: "IDF statement",
    url: "https://t.me/idfofficial/19331",
    confidence: "CLAIM",
    vector: false,
    note: "IDF: an interceptor was launched toward a false target; no sirens. Not a hostile launch.",
  },
];

// IRAN theater: no drone/missile wave with a named tally source this week. Tanker
// attacks (UKMTO) carry no attribution; Iranian blast-sound reports are not waves.
export const WAVES_IRAN: WaveTally[] = [];

export const WAVE_TALLIES: WaveTally[] = [
  ...WAVES_UKRAINE_RU_UA,
  ...WAVES_UKRAINE_UA_RU_MOD,
  ...WAVES_GULF_YEMEN,
  ...WAVES_LEVANT,
  ...WAVES_IRAN,
];

// ---------------------------------------------------------------------------
// Adapter → src/layers.ts `Wave` (one from→to per arrow). Built ONLY from explicit,
// source-stated `pairs` whose both ends have gazetteer points. No cross-product.
// This week no tally contains an explicit pairing, so the result is [].
// ---------------------------------------------------------------------------
function hasPoint(p: WavePlace): p is WavePlace & { lat: number; lon: number } {
  return typeof p.lat === "number" && typeof p.lon === "number";
}

const THEATER_LINKS: Record<string, TheaterId[]> = {
  ukraine: ["overview", "ukraine"],
  yemen: ["overview", "yemen"],
  levant: ["overview", "levant"],
  iran: ["overview", "iran"],
};

export const LAYER_WAVES_DRAFT: LayerWave[] = WAVE_TALLIES.flatMap((w) =>
  (w.pairs ?? [])
    .filter((pr) => hasPoint(pr.from) && hasPoint(pr.to))
    .map(
      (pr, i): LayerWave => ({
        id: `${w.id}-p${i + 1}`,
        theaters: THEATER_LINKS[w.theater] ?? [w.theater],
        dtg: w.dtg,
        from: { name: pr.from.name, lat: pr.from.lat as number, lon: pr.from.lon as number },
        to: { name: pr.to.name, lat: pr.to.lat as number, lon: pr.to.lon as number },
        count: pr.count ?? null,
        type: pr.type,
        confidence: w.confidence,
        source: w.source,
        url: w.url,
      }),
    ),
);
