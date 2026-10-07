import type { FeatureCollection } from "geojson";
import type { Confidence, TheaterId } from "./sitrep";

// Map layers beyond the curated sitrep + GDELT claim overlay.
// Every layer is OSINT from a named public source. Not radar. Not a targeting product.
// Data owners: WAVES, STRIKES, FRONTS = Sitrep. fires.json, ships.json = Live.
// A layer goes live only after CoS approves it; empty arrays render nothing.

export type LayerId = "vectors" | "strikes" | "fronts" | "fires" | "ships";

export interface Endpoint {
  name: string;
  lat: number;
  lon: number;
}

// Daily drone / missile wave rebuilt from an official tally (UA Air Force, RU MoD,
// IDF, Saudi/GACA; Houthi statements stay CLAIM). Both ends named or it is not drawn.
export interface Wave {
  id: string;
  theaters: TheaterId[];
  dtg: string;
  from: Endpoint; // launch area
  to: Endpoint; // target region
  count: number | null; // null = tally gave no number; label shows type only
  type: string; // e.g. "Shahed", "ballistic", "cruise"
  confidence: Confidence;
  source: string; // named issuer, e.g. "Ukraine Air Force"
  url?: string;
}

// Geolocated strike pin from a named geolocator (GeoConfirmed, Sudans Post, ...).
export interface StrikePin {
  id: string;
  theaters: TheaterId[];
  dtg: string;
  name: string;
  lat: number;
  lon: number;
  confidence: Confidence;
  fact: string;
  geolocator: string;
  url: string; // the geolocator's own post or page; required
}

// Commercial-use rule (Michael, 2026-10-07): Watchfloor is built to sell. A source
// draws only if its license allows commercial use ("yes"). "paid" (paid license
// needed) and "no" stay hidden even when the data is in the repo. Register: docs/sources.md.
export type CommercialUse = "yes" | "no" | "paid";

// Front-line / control polygons. Drawn ONLY when licenseCleared is true
// (Ship's license review), commercialUse is "yes", and data is present.
// Attribution goes in the map footer.
export interface FrontSource {
  id: string;
  theater: TheaterId;
  name: string;
  license: string;
  url: string;
  asOf: string;
  licenseCleared: boolean;
  commercialUse: CommercialUse;
  data: FeatureCollection | null;
}

// DRAFT (Sitrep, 2026-10-07), pending CoS approval. EMPTY ON PURPOSE.
// A Wave exists only where the source itself ties a specific launch area (or weapon group from
// it) to a specific target place. No tally this week does that. The only post naming both
// (UA Air Force t.me/kpszsu/83516, night 6->7 Oct) lists launch areas per weapon group and,
// separately, "main strike directions" (Kyiv, Kharkiv, Poltava, Dnipropetrovsk oblasts) for the
// whole attack. Pairing them would invent links, so no cross-product is drawn. Launch areas,
// directions and totals are kept as tally rows in src/waves.tally.ts.
export const WAVES: Wave[] = [];
// Pin coordinates: NGA GeoNames Server (GNS), US Government public domain; UFIs listed per pin.
// GNS: "There are no licensing requirements or restrictions in place for the use of the GNS data."
// (https://geonames.nga.mil/). Earlier OSM/Nominatim draft lookups were replaced; none remain.
// Each pin is the GNS populated-place point (fc P) for a town where a named outlet or official
// body placed the strike. The outlet is named at the start of `fact`, and `url` is its article/post.
// No coordinates from GeoConfirmed, DeepStateMap or ISW. Several pins can share a town point.
export const STRIKES: StrikePin[] = [
  {
    id: "ua-0110-odesa",
    theaters: ["ukraine"],
    dtg: "01 OCT",
    name: "ODESA — BUSINESS CENTRE HIT",
    lat: 46.48,
    lon: 30.731, // Odesa: NGA GNS UFI -1049092, UNI -1556464 (PPLA)
    confidence: "REPORTED",
    fact: "Kyiv Independent: a Russian strike hit a business center in Odesa, injuring one person and starting a fire (State Emergency Service).",
    geolocator: "Watchfloor (town-level placement)",
    url: "https://kyivindependent.com/russian-attacks-kill-at-least-6-injure-38-across-ukraine-amid-another-overnight-drone-barrage-nationwide/",
  },
  {
    id: "ua-0110-kyiv",
    theaters: ["ukraine"],
    dtg: "01 OCT",
    name: "KYIV — RESIDENTIAL BUILDING, WAREHOUSE FIRES",
    lat: 50.434,
    lon: 30.516, // Kyiv: NGA GNS UFI -1044367, UNI 10809489 (PPLC)
    confidence: "REPORTED",
    fact: "Kyiv Independent: fires broke out in a residential building (Solomianskyi district) and a warehouse (Obolonskyi district); one man injured (State Emergency Service).",
    geolocator: "Watchfloor (town-level placement)",
    url: "https://kyivindependent.com/russian-attacks-kill-at-least-6-injure-38-across-ukraine-amid-another-overnight-drone-barrage-nationwide/",
  },
  {
    id: "ua-0210-kramatorsk",
    theaters: ["ukraine"],
    dtg: "02 OCT",
    name: "KRAMATORSK — PASSENGER BUS HIT BY FPV DRONE",
    lat: 48.731,
    lon: 37.568, // Kramatorsk: NGA GNS UFI -1043300, UNI 19773582 (PPLA2)
    confidence: "REPORTED",
    fact: "Kyiv Independent: a Russian FPV drone struck a passenger bus on its route at about 07:08 local, injuring two (Kramatorsk City Council).",
    geolocator: "Watchfloor (town-level placement)",
    url: "https://kyivindependent.com/russian-attacks-kill-2-injure-27-across-ukraine-hit-passenger-bus-with-fpv-drone-in-kramatorsk/",
  },
  {
    id: "ua-0210-kyiv",
    theaters: ["ukraine"],
    dtg: "02 OCT",
    name: "KYIV — HIGH-RISE HIT; SOUTHERN BRIDGE STRUCK AGAIN",
    lat: 50.434,
    lon: 30.516, // Kyiv: NGA GNS UFI -1044367, UNI 10809489 (PPLC)
    confidence: "REPORTED",
    fact: "Kyiv Independent: an overnight attack damaged a 25-storey residential building in Darnytskyi district, killing one and injuring two; Mayor Klitschko said the Southern Bridge was struck again.",
    geolocator: "Watchfloor (town-level placement)",
    url: "https://kyivindependent.com/russian-strike-kills-1-injures-2-in-kyiv-as-southern-bridge-hit-again-overnight/",
  },
  {
    id: "ua-0310-kyiv",
    theaters: ["ukraine"],
    dtg: "03 OCT",
    name: "KYIV — NORTHERN BRIDGE STRUCK",
    lat: 50.434,
    lon: 30.516, // Kyiv: NGA GNS UFI -1044367, UNI 10809489 (PPLC)
    confidence: "REPORTED",
    fact: "Kyiv Independent: Russian forces struck the Northern Bridge over the Dnipro; two injured (Mayor Klitschko). KI reports a further drone hit on the bridge roadway on 4 Oct.",
    geolocator: "Watchfloor (town-level placement)",
    url: "https://kyivindependent.com/russian-strikes-kill-8-injure-81-across-ukraine-hit-kyiv-bridge-2/",
  },
  {
    id: "ua-0310-kharkiv",
    theaters: ["ukraine"],
    dtg: "02–03 OCT",
    name: "KHARKIV — GLIDE BOMBS ON THREE AREAS",
    lat: 49.982,
    lon: 36.255, // Kharkiv: NGA GNS UFI -1041320, UNI -1543525 (PPLA)
    confidence: "REPORTED",
    fact: "Kyiv Independent: glide bombs struck three areas of Kharkiv, killing two and injuring 42 (Governor Syniehubov).",
    geolocator: "Watchfloor (town-level placement)",
    url: "https://kyivindependent.com/russian-strikes-kill-8-injure-81-across-ukraine-hit-kyiv-bridge-2/",
  },
  {
    id: "ua-0310-dnipro",
    theaters: ["ukraine"],
    dtg: "02–03 OCT",
    name: "DNIPRO — RESIDENTIAL BUILDING HIT",
    lat: 48.473,
    lon: 35.042, // Dnipro: NGA GNS UFI -1037865, UNI 17731397 (PPLA)
    confidence: "REPORTED",
    fact: "Kyiv Independent: a Russian strike on a residential building injured four women; a business center was struck the same evening (Governor Hanzha).",
    geolocator: "Watchfloor (town-level placement)",
    url: "https://kyivindependent.com/russian-strikes-kill-8-injure-81-across-ukraine-hit-kyiv-bridge-2/",
  },
  {
    id: "ua-0410-sumy",
    theaters: ["ukraine"],
    dtg: "04 OCT",
    name: "SUMY — MEDICAL-SUPPLIES WAREHOUSE HIT",
    lat: 50.917,
    lon: 34.799, // Sumy: NGA GNS UFI -1055659, UNI -1567329 (PPLA)
    confidence: "REPORTED",
    fact: "Kyiv Independent: a Russian drone attack on a warehouse storing medical supplies killed a 52-year-old employee and injured three (local authorities).",
    geolocator: "Watchfloor (town-level placement)",
    url: "https://kyivindependent.com/russian-attacks-kill-at-least-5-injure-30-across-ukraine/",
  },
  {
    id: "ua-0410-pavlohrad",
    theaters: ["ukraine"],
    dtg: "03–04 OCT",
    name: "PAVLOHRAD — FOOD WAREHOUSES HIT",
    lat: 48.53,
    lon: 35.87, // Pavlohrad: NGA GNS UFI -1049945, UNI 9120727 (PPLA2)
    confidence: "REPORTED",
    fact: "Kyiv Independent: a strike hit food warehouses in Pavlohrad and caused a fire, injuring two (local authorities).",
    geolocator: "Watchfloor (town-level placement)",
    url: "https://kyivindependent.com/russian-attacks-kill-at-least-5-injure-30-across-ukraine/",
  },
  {
    id: "ua-0410-kharkiv",
    theaters: ["ukraine"],
    dtg: "04 OCT",
    name: "KHARKIV — BANDEROL STRIKE",
    lat: 49.982,
    lon: 36.255, // Kharkiv: NGA GNS UFI -1041320, UNI -1543525 (PPLA)
    confidence: "REPORTED",
    fact: "Kyiv Independent: an evening strike with Banderol missiles killed a 42-year-old man and injured eight (Governor Syniehubov).",
    geolocator: "Watchfloor (town-level placement)",
    url: "https://kyivindependent.com/kharkiv-targeted-in-deadly-banderol-strike-as-russia-kills-5-injures-61-across-ukraine-over-past-day/",
  },
  {
    id: "ua-0510-kharkiv",
    theaters: ["ukraine"],
    dtg: "05 OCT",
    name: "KHARKIV — GLIDE BOMBS, SLOBIDSKYI DISTRICT",
    lat: 49.982,
    lon: 36.255, // Kharkiv: NGA GNS UFI -1041320, UNI -1543525 (PPLA)
    confidence: "REPORTED",
    fact: "Kyiv Independent: at least three glide bombs hit Kharkiv's Slobidskyi district (Mayor Terekhov); dozens injured.",
    geolocator: "Watchfloor (town-level placement)",
    url: "https://kyivindependent.com/russian-strikes-kill-13-injure-104-across-ukraine-damage-kryvyi-rih-hospital/",
  },
  {
    id: "ua-0610-kryvyirih",
    theaters: ["ukraine"],
    dtg: "05–06 OCT",
    name: "KRYVYI RIH — HOSPITAL HIT",
    lat: 47.91,
    lon: 33.392, // Kryvyi Rih: NGA GNS UFI -1043968, UNI 19901409 (PPLA2)
    confidence: "REPORTED",
    fact: "Kyiv Independent: Russia attacked a hospital in Kryvyi Rih with Banderol missiles (Oleksandr Vilkul); four injured, including two medical workers (Governor Hanzha).",
    geolocator: "Watchfloor (town-level placement)",
    url: "https://kyivindependent.com/russian-strikes-kill-13-injure-104-across-ukraine-damage-kryvyi-rih-hospital/",
  },
  {
    id: "ua-0710-pryluky",
    theaters: ["ukraine"],
    dtg: "07 OCT",
    name: "PRYLUKY — APARTMENT BLOCK HIT BY CRUISE MISSILE",
    lat: 50.595,
    lon: 32.384, // Pryluky: NGA GNS UFI -1051731, UNI -1560811 (PPLA2)
    confidence: "REPORTED",
    fact: "Kyiv Independent: a Russian cruise missile hit a five-storey residential building, killing at least 20 including five children and wounding at least 55 (Zelensky, State Emergency Service).",
    geolocator: "Watchfloor (town-level placement)",
    url: "https://kyivindependent.com/russia-slams-kyiv-in-mass-missile-drone-attack-on-putins-74th-birthday/",
  },
  {
    id: "ua-0710-kremenchuk",
    theaters: ["ukraine"],
    dtg: "07 OCT",
    name: "KREMENCHUK — HIGH-RISES HIT",
    lat: 49.102,
    lon: 33.434, // Kremenchuk: NGA GNS UFI -1043663, UNI -1547468 (PPLA2)
    confidence: "REPORTED",
    fact: "Kyiv Independent: ballistic and cruise missile strikes damaged four high-rise buildings, killing two and injuring 47 (Zelensky; Poltava regional prosecutor; Poltava OVA head Diakivnych).",
    geolocator: "Watchfloor (town-level placement)",
    url: "https://kyivindependent.com/russia-slams-kyiv-in-mass-missile-drone-attack-on-putins-74th-birthday/",
  },
  {
    id: "ua-0710-dnipro",
    theaters: ["ukraine"],
    dtg: "07 OCT",
    name: "DNIPRO — APARTMENT BUILDINGS DAMAGED",
    lat: 48.473,
    lon: 35.042, // Dnipro: NGA GNS UFI -1037865, UNI 17731397 (PPLA)
    confidence: "REPORTED",
    fact: "Kyiv Independent: Russian missile strikes damaged five apartment buildings in Dnipro (Zelensky).",
    geolocator: "Watchfloor (town-level placement)",
    url: "https://kyivindependent.com/russia-slams-kyiv-in-mass-missile-drone-attack-on-putins-74th-birthday/",
  },
  {
    id: "ua-0710-oleksandriia",
    theaters: ["ukraine"],
    dtg: "07 OCT",
    name: "OLEKSANDRIIA — OVERNIGHT ATTACK",
    lat: 48.675,
    lon: 33.111, // Oleksandriia: NGA GNS UFI -1049208, UNI 19901363 (PPLA2)
    confidence: "REPORTED",
    fact: "Kyiv Independent: an early-morning attack killed two and injured three; one man missing (Governor Raykovich).",
    geolocator: "Watchfloor (town-level placement)",
    url: "https://kyivindependent.com/russia-slams-kyiv-in-mass-missile-drone-attack-on-putins-74th-birthday/",
  },
  {
    id: "ua-0710-kyiv",
    theaters: ["ukraine"],
    dtg: "07 OCT",
    name: "KYIV — MISSILE AND DRONE ATTACK",
    lat: 50.434,
    lon: 30.516, // Kyiv: NGA GNS UFI -1044367, UNI 10809489 (PPLC)
    confidence: "REPORTED",
    fact: "Kyiv Independent: the attack on the capital killed at least four and injured 13; warehouses hit in Podil, a non-residential area in Obolon (Mayor Klitschko).",
    geolocator: "Watchfloor (town-level placement)",
    url: "https://kyivindependent.com/russia-slams-kyiv-in-mass-missile-drone-attack-on-putins-74th-birthday/",
  },
  {
    id: "ksa-0510-jazan",
    theaters: ["yemen"],
    dtg: "05 OCT",
    name: "JAZAN — AIRPORT ATTACKED",
    lat: 16.889,
    lon: 42.551, // Jazan: NGA GNS UFI -3096152, UNI -4368264 (PPLA)
    confidence: "REPORTED",
    fact: "Al Jazeera: Saudi civil aviation authority (GACA) said attacks hit Jazan and Najran airports; three minor injuries and material damage.",
    geolocator: "Watchfloor (town-level placement)",
    url: "https://www.aljazeera.com/news/2026/10/6/saudi-arabia-says-three-wounded-in-attacks-on-airports-near-yemen-border",
  },
  {
    id: "ksa-0510-najran",
    theaters: ["yemen"],
    dtg: "05 OCT",
    name: "NAJRAN — AIRPORT ATTACKED",
    lat: 17.493,
    lon: 44.128, // Najran: NGA GNS UFI -3097837, UNI -4371733 (PPLA)
    confidence: "REPORTED",
    fact: "Al Jazeera: Saudi civil aviation authority (GACA) said attacks hit Jazan and Najran airports; three minor injuries and material damage — pin at city; airport ~33 km NE.",
    geolocator: "Watchfloor (town-level placement)",
    url: "https://www.aljazeera.com/news/2026/10/6/saudi-arabia-says-three-wounded-in-attacks-on-airports-near-yemen-border",
  },
  {
    id: "ksa-0710-abha",
    theaters: ["yemen"],
    dtg: "06–07 OCT",
    name: "ABHA — AIRPORT ATTACKED",
    lat: 18.216,
    lon: 42.505, // Abha: NGA GNS UFI -3090713, UNI -4357394 (PPLA)
    confidence: "REPORTED",
    fact: "Al Jazeera: GACA said an attack on Abha airport killed two and injured 28.",
    geolocator: "Watchfloor (town-level placement)",
    url: "https://www.aljazeera.com/news/2026/10/7/saudi-arabia-says-three-foreign-nationals-killed-in-attacks-on-airports",
  },
  {
    id: "ye-0710-aden",
    theaters: ["yemen"],
    dtg: "07 OCT",
    name: "ADEN — AIRPORT ATTACKED",
    lat: 12.78,
    lon: 45.039, // Aden: NGA GNS UFI 420687, UNI 538133 (PPLA)
    confidence: "REPORTED",
    fact: "Al Jazeera: Yemen's transport ministry said at least two ballistic missiles and several drones targeted Aden airport; one missile landed near the runway.",
    geolocator: "Watchfloor (town-level placement)",
    url: "https://www.aljazeera.com/news/2026/10/7/yemens-houthis-attack-aden-airport-saudi-forces-down-missile-near-riyadh",
  },
  {
    id: "il-3009-gaza",
    theaters: ["levant"],
    dtg: "30 SEP",
    name: "GAZA CITY AREA — IDF STRIKE",
    lat: 31.507,
    lon: 34.456, // Gaza City: NGA GNS UFI -797155, UNI -1153426 (PPL)
    confidence: "CLAIM",
    fact: "IDF statement (1 Oct): a 30 Sep aerial strike in the Gaza City area killed a Hamas platoon commander.",
    geolocator: "Watchfloor (town-level placement)",
    url: "https://t.me/idfofficial/19292",
  },
  {
    id: "il-3009-khanyunis",
    theaters: ["levant"],
    dtg: "30 SEP",
    name: "KHAN YUNIS AREA — IDF STRIKE",
    lat: 31.34,
    lon: 34.306, // Khan Yunis: NGA GNS UFI -797165, UNI -1153463 (PPL)
    confidence: "CLAIM",
    fact: "IDF statement (1 Oct): a 30 Sep strike in the Khan Yunis area killed a PIJ rocket-array member.",
    geolocator: "Watchfloor (town-level placement)",
    url: "https://t.me/idfofficial/19298",
  },
  {
    id: "il-0110-khanyunis",
    theaters: ["levant"],
    dtg: "01 OCT",
    name: "KHAN YUNIS AREA — IDF STRIKE",
    lat: 31.34,
    lon: 34.306, // Khan Yunis: NGA GNS UFI -797165, UNI -1153463 (PPL)
    confidence: "CLAIM",
    fact: "IDF/ISA statement: a strike in the Khan Yunis area killed a Hamas sniper.",
    geolocator: "Watchfloor (town-level placement)",
    url: "https://t.me/idfofficial/19304",
  },
  {
    id: "il-0210-gaza",
    theaters: ["levant"],
    dtg: "02 OCT",
    name: "GAZA CITY AREA — TWO IDF STRIKES",
    lat: 31.507,
    lon: 34.456, // Gaza City: NGA GNS UFI -797155, UNI -1153426 (PPL)
    confidence: "CLAIM",
    fact: "IDF statement: two strikes in the Gaza City area killed two PIJ commanders.",
    geolocator: "Watchfloor (town-level placement)",
    url: "https://t.me/idfofficial/19305",
  },
  {
    id: "il-0210-nuseirat",
    theaters: ["levant"],
    dtg: "02 OCT",
    name: "NUSEIRAT — IDF STRIKE",
    lat: 31.449,
    lon: 34.393, // Nuseirat: NGA GNS UFI -797180, UNI 12972913 (PPL)
    confidence: "CLAIM",
    fact: "IDF/ISA statement (5 Oct): a 2 Oct strike in Nuseirat killed a Hamas Nukhba platoon commander.",
    geolocator: "Watchfloor (town-level placement)",
    url: "https://t.me/idfofficial/19317",
  },
  {
    id: "il-0410-khanyunis",
    theaters: ["levant"],
    dtg: "03–04 OCT",
    name: "KHAN YUNIS AREA — IDF STRIKES",
    lat: 31.34,
    lon: 34.306, // Khan Yunis: NGA GNS UFI -797165, UNI -1153463 (PPL)
    confidence: "CLAIM",
    fact: "IDF statement: strikes on 3 and 4 Oct in the Khan Yunis area killed two Hamas members.",
    geolocator: "Watchfloor (town-level placement)",
    url: "https://t.me/idfofficial/19312",
  },
  {
    id: "il-0610-gaza",
    theaters: ["levant"],
    dtg: "06 OCT",
    name: "GAZA CITY — STRIKES, 2 KILLED",
    lat: 31.507,
    lon: 34.456, // Gaza City: NGA GNS UFI -797155, UNI -1153426 (PPL)
    confidence: "REPORTED",
    fact: "Reuters (via Al Arabiya): medics said Israeli strikes killed two people in Gaza, one near al-Shifa Hospital; the Israeli military told Reuters it targeted militants.",
    geolocator: "Watchfloor (town-level placement)",
    url: "https://english.alarabiya.net/News/middle-east/2026/10/06/israeli-strikes-kill-two-people-in-gaza-medics-say",
  },
];
// DRAFT catalog only (Sitrep, 2026-10-07). No geometry, nothing drawable (licenseCleared false,
// data null). Per CoS: no DeepStateMap, ISW or ACLED geometry. "paid" = paid licence or written
// permission needed, so not ingested for now. Register: docs/sources.md.
export const FRONTS: FrontSource[] = [
  {
    id: "ua-deepstatemap",
    theater: "ukraine",
    name: "DeepStateMap.live",
    license: "DeepStateMap licence: commercial API use needs prior approval; identical copies of its objects prohibited",
    url: "https://deepstatemap.live/license-en.html",
    asOf: "2026-10-07 (terms read)",
    licenseCleared: false,
    commercialUse: "paid",
    data: null,
  },
  {
    id: "ua-isw-ctp",
    theater: "ukraine",
    name: "ISW / AEI Critical Threats Project",
    license: "ISW fair use & attribution policy: commercial use or use in mapping platforms needs written permission",
    url: "https://understandingwar.org/fair-use-and-attribution-policy/",
    asOf: "2026-10-07 (terms read)",
    licenseCleared: false,
    commercialUse: "paid",
    data: null,
  },
  {
    id: "ua-liveuamap",
    theater: "ukraine",
    name: "Liveuamap",
    license: "Liveuamap ToS allows use with reference; API is a paid enterprise product; commercial terms unclear",
    url: "https://liveuamap.com/about",
    asOf: "2026-10-07 (terms read)",
    licenseCleared: false,
    commercialUse: "paid",
    data: null,
  },
  {
    id: "ua-wikimedia-commons",
    theater: "ukraine",
    name: "Wikimedia Commons, Russo-Ukrainian War map",
    license: "CC BY-SA 4.0 (share-alike); stale (18 Mar 2025); control data sourced from ISW maps",
    url: "https://commons.wikimedia.org/wiki/File:Russo-Ukrainian_War_map_without_Ukrainian-recaptured_layer.svg",
    asOf: "2026-10-07 (terms read)",
    licenseCleared: false,
    commercialUse: "yes",
    data: null,
  },
  {
    id: "sudan-war-monitor",
    theater: "sudan",
    name: "Sudan War Monitor (with OSINT Sudan)",
    license: "No licence published; paid Substack; ask permission",
    url: "https://sudanwarmonitor.com/p/map-of-the-areas-of-control-in-sudan-2ea",
    asOf: "2026-10-07 (terms read)",
    licenseCleared: false,
    commercialUse: "paid",
    data: null,
  },
  {
    id: "levant-isw-ctp",
    theater: "levant",
    name: "ISW / CTP Iran Update maps",
    license: "ISW fair use & attribution policy: commercial use needs written permission",
    url: "https://understandingwar.org/fair-use-and-attribution-policy/",
    asOf: "2026-10-07 (terms read)",
    licenseCleared: false,
    commercialUse: "paid",
    data: null,
  },
  {
    id: "yemen-isw-ctp",
    theater: "yemen",
    name: "ISW / CTP Iran Update maps (Yemen)",
    license: "ISW fair use & attribution policy: commercial use needs written permission",
    url: "https://understandingwar.org/fair-use-and-attribution-policy/",
    asOf: "2026-10-07 (terms read)",
    licenseCleared: false,
    commercialUse: "paid",
    data: null,
  },
  {
    id: "overview-acled",
    theater: "overview",
    name: "ACLED",
    license: "ACLED EULA: commercial entities need a corporate licence; non-commercial use only",
    url: "https://acleddata.com/eula/",
    asOf: "2026-10-07 (terms read)",
    licenseCleared: false,
    commercialUse: "paid",
    data: null,
  },
];

// ---- Live-owned payloads (public/data/*.json). Missing file = layer stays empty. ----

export interface FirePoint {
  lat: number;
  lon: number;
  acq: string; // ISO acquisition time
  theater: TheaterId;
  frp?: number;
  likely_flare?: boolean; // persistent gas-flare / industrial heat source; drawn muted
}
export interface FirePayload {
  generated_at: string;
  source: string; // must name a VIIRS product
  attribution: string;
  commercial_use: CommercialUse; // must be "yes" or the layer stays empty
  points: FirePoint[];
}

export interface ShipPoint {
  lat: number;
  lon: number;
  at: string; // ISO position time, already delayed upstream
  kind: string; // "tanker", "cargo", ... never a name or identifier
  theater: TheaterId;
}
export interface ShipPayload {
  generated_at: string;
  delay_minutes: number;
  attribution: string;
  commercial_use: CommercialUse; // must be "yes" or the layer stays empty
  points: ShipPoint[];
}

export const MIN_SHIP_DELAY_MIN = 60;

export interface LayerMeta {
  label: string;
  desktop: boolean; // default on at >980px
  phone: boolean; // default on at <=980px
  cap: [number, number]; // max features drawn per theater [desktop, phone]
}

// Defaults keep the map readable: vectors + strikes on; fronts on desktop only;
// fires and ships off until someone asks for them. Caps are the phone budget.
export const LAYER_META: Record<LayerId, LayerMeta> = {
  vectors: { label: "VECTORS / WAVES (NOT RADAR)", desktop: true, phone: true, cap: [60, 25] },
  strikes: { label: "GEOLOCATED STRIKES", desktop: true, phone: true, cap: [200, 60] },
  fronts: { label: "FRONT LINES / CONTROL", desktop: true, phone: false, cap: [1, 1] },
  fires: { label: "THERMAL ANOMALY (NOT CONFIRMED STRIKE)", desktop: false, phone: false, cap: [400, 120] },
  ships: { label: "SHIPS (\u22651H DELAYED)", desktop: false, phone: false, cap: [300, 80] },
};
export const LAYER_ORDER: LayerId[] = ["vectors", "strikes", "fronts", "fires", "ships"];

function finiteCoord(lat: unknown, lon: unknown): boolean {
  return typeof lat === "number" && typeof lon === "number" && Math.abs(lat) <= 90 && Math.abs(lon) <= 180;
}

export function waveDrawable(w: Wave): boolean {
  return Boolean(w.from?.name && w.to?.name && finiteCoord(w.from.lat, w.from.lon) && finiteCoord(w.to.lat, w.to.lon));
}

export function waveLabel(w: Wave): string {
  const type = w.type.toUpperCase();
  return w.count != null && w.count > 0 ? `${w.count}\u00d7 ${type}` : type;
}

export function strikeDrawable(s: StrikePin): boolean {
  return Boolean(s.geolocator && /^https:\/\//.test(s.url) && finiteCoord(s.lat, s.lon));
}

export function frontDrawable(f: FrontSource): boolean {
  return f.licenseCleared === true && f.commercialUse === "yes" && f.data != null && Boolean(f.license && f.url);
}

/**
 * Feeds are off until Live publishes the file AND CoS approves the layer.
 * Off means no request at all, so the live site never logs a 404.
 * To turn one on, flip it here in the same commit that first ships the file.
 */
export const FEED_ENABLED: Record<"fires" | "ships", boolean> = { fires: true, ships: false };

async function getJson<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`./${path}?t=${Date.now()}`);
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export async function loadFires(): Promise<FirePayload | null> {
  if (!FEED_ENABLED.fires) return null;
  const p = await getJson<FirePayload>("data/fires.json");
  if (!p || !Array.isArray(p.points) || !/VIIRS/i.test(p.source ?? "") || p.commercial_use !== "yes") return null;
  p.points = p.points.filter((x) => finiteCoord(x.lat, x.lon) && typeof x.theater === "string");
  return p;
}

export async function loadShips(): Promise<ShipPayload | null> {
  if (!FEED_ENABLED.ships) return null;
  const p = await getJson<ShipPayload>("data/ships.json");
  if (!p || !Array.isArray(p.points) || !(p.delay_minutes >= MIN_SHIP_DELAY_MIN) || p.commercial_use !== "yes") return null;
  // Backstop only; the fetcher must enforce the delay server-side.
  const newest = Date.now() - MIN_SHIP_DELAY_MIN * 60_000;
  p.points = p.points
    .filter((x) => finiteCoord(x.lat, x.lon) && Date.parse(x.at) <= newest)
    .map((x) => ({ lat: x.lat, lon: x.lon, at: x.at, kind: String(x.kind ?? "vessel"), theater: x.theater }));
  return p;
}
