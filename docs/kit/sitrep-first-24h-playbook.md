# Watchfloor: first 24 hours of a new theater (Sitrep side)

**DRAFT for Chief of Staff, then Michael. Not approved. Nothing in this file is live data. Nothing pushed, nobody messaged.**
Drafted 07 Oct 2026. **Revised 07 Oct 2026 ~20:00 ET to the rules adopted 7 Oct**, plus the FIRMS rule (live since commits ad2e337 + 3e8cd5f; footer disclaimer link 85cf933). Changes are listed in `CHANGELOG-2026-10-07.md` (same folder). **CoS approved this kit on 7 Oct 2026 (~8:03 PM ET)** with the decisions recorded there.
Checked against `memery33/watchfloor@main`: `src/sitrep.types.ts`, `src/sitrep.ts` (`THEATER_ORDER` registry + `import.meta.glob("./sitrep.*.ts")` discovery; `TheaterId = string`), `src/layers.ts` (`StrikePin.geolocator`, `FrontSource.commercialUse/licenseCleared/data`), `src/sitrep.iran.ts`, `src/main.ts`, `src/live.ts`, `scripts/fetch_live.py`.
Watchfloor is an open-source common operating picture **built to be sold**. It is **not a targeting product**.
This is the Sitrep piece of the "new theater in under an hour" kit. COP owns the data file and registry line, Live owns the GDELT preset and FIRMS payload, and Ship owns the `docs/` runbook and the source register.

---

## House rules (these override everything below)

| Rule | What it means on the board |
|---|---|
| **Licence tag (rule 1)** | Every source carries one tag: **[YES]** commercial-use yes · **[PAID]** paid licence needed (not ingested) · **[CITE]** cite-only (news or official statements we cite and link but never republish) · **[UNCLEAR]** unclear. It also carries a one-line terms note, the terms URL, and "terms verified <date>" or **"terms not verified"**. Never guess terms. The **licence gate** (below) runs before any new source is used. [PAID] and [UNCLEAR] sources are reference only. |
| Source in text | Every `fact` names its source inline, e.g. `Reuters:`, `UKMTO 158-26:`, `per PCG, via Reuters:`. A fact with no named source does not ship. |
| **CONFIRMED** | Multiple *independent* named sources, or neutral or both-sides official confirmation. |
| **Named wires (rule 4)** | **Named-wire list (CoS, 7 Oct 2026; closed list):** **Reuters · AP (Associated Press) · AFP (Agence France-Presse) · Anadolu Agency · Al Jazeera · national public broadcasters: LSM (Latvia), LRT (Lithuania), ERR (Estonia).** Anything not on this list is an **outlet, not a wire**, however large (e.g. SCMP, Straits Times, Kyiv Independent, Jeune Afrique, RFI, Radio Okapi, USNI News). Another national public broadcaster counts only once CoS adds it to this list by name; state-controlled media of a party to the conflict (e.g. Xinhua, TASS, BelTA, ORTM) are never wires. |
| **REPORTED (rule 4)** | A **wire on the named-wire list** (or a major outlet) reporting *in its own voice*, **or** a government/coalition statement **carried by a wire on the named-wire list**, labelled **`per <party>, via <wire>`**. A party statement carried only by an outlet that is not on the list stays **CLAIM**. |
| **CLAIM (rule 4)** | Anything else: a party's statement seen only on its own channel (site, X account, public Telegram) or carried only by an outlet not on the named-wire list, a militant group, or another unverified source. **CLAIM-only markers use `"dim"`.** Yellow stays yellow until a named source corroborates it. |
| **DELTA** | Named sources conflict. Show both sides (template below). |
| **HOLD** | Not plotted. It goes in the HOLD log and stays out of `events[]` (see note ⚠1). |
| Independence | Same-government outlets don't count as separate sources (e.g. IRNA + Fars + Tasnim, Xinhua + Global Times + CCTV, BelTA + Belarus MoD). Aggregators and anonymous accounts never promote anything. |
| **Coordinates and pins (rule 2)** | No coord means no marker. Pins are **town- or site-level points from NGA GNS**, with the **UFI and UNI recorded** in a comment, `geolocator: "Watchfloor (town-level placement)"` and the outlet's **https** URL. **Never copy GeoConfirmed, DeepStateMap, ISW or ACLED coordinates.** OSM/Nominatim is ODbL share-alike: **avoid it for pins** (disambiguation lookups only; never copy its coords into the repo). Ambiguous name (several matching GNS records) → **drop the pin**. Pin on a city but event at a site away from it → caveat in the fact, e.g. "pin at city; airport ~33 km NE". Full checklist below. |
| **Waves and tracks (rule 3)** | Draw an arrow only for a launch→target pair **the source states outright**. Otherwise use **count rows**: place names, no coordinates, no arrow. **Never build cross-product pairings** (3 launch areas × 4 targets ≠ 12 arrows). No named origin *and* named impact means no new track in `src/tracks.ts`. |
| **Fronts (rule 5)** | **No approximate control or front areas** until a commercially cleared source (such as UCDP) supports them. Front-map sources go into the `FRONTS` catalog with `commercialUse` and `licenseCleared` set and **`data: null`** until cleared. |
| **FIRMS (live)** | FIRMS points are **thermal anomalies, not confirmed strikes**. Never turn one into a strike pin, and never use one on its own to raise confidence. A FIRMS point can only *support* a named press or official report, and that pin still uses NGA GNS town-level placement. If FIRMS data goes to anyone else, link the disclaimer https://firms.modaps.eosdis.nasa.gov/download/Readme.txt, which advises against "tactical decision-making or informing about conditions at a local scale". On the map: layer off by default, 300 points per theater, flare-flagged points drawn muted, footer "NASA FIRMS (disclaimer)" link (85cf933). |
| Marker tone | CLAIM-only place → `"dim"`. `"warn"`/`"hot"` only for REPORTED-or-better activity, because amber reads as REPORTED in the legend. |
| Omit unknowns | Leave out cause, attribution and casualties when the source doesn't state them. Write "no attribution in the notice" rather than guessing. |
| **Open sources only (rule 6)** | Open press and **named public official channels** only. **No classified or FOUO material, no leaked material, no private Telegram** (or any private channel or group), even if a public account reposts it. Not a targeting product: no unit positions finer than town-level press reporting. |
| **Theater module (rule 7)** | Each theater is its own module, `src/sitrep.<id>.ts`. It goes live **only** after `"<id>"` is added to `THEATER_ORDER` in `src/sitrep.ts`. A new theater needs **CoS approval**. Pushes go through the **GitHub connector, at most 4 files per call**, then **check sha256 of each file at the new SHA** and confirm the **Pages run is green**. Sitrep itself does not push. |
| D+ clock | Counts from a named, sourced start date written in the file header. D+0 is the start date (Iran: 28 FEB → D+221 on 07 OCT). Recompute it at every ship; never guess it. |
| SNAPSHOT | Set `dtgLocal`/`dtgZulu`/`sourceAge` (ET) in `src/sitrep.ts` to the real ship time. |

> ⚠1 **Code finding (from the original draft, not re-checked in this revision):** `src/main.ts` (lines ~592–598) draws *every* `events[]` item, including `confidence: "HOLD"`, whenever the filter is ALL. Two current events (`af-4` in `sitrep.afpak.ts`, `sd-1` in `sitrep.sudan.ts`) are HOLD with coords, so they do get drawn. Until COP filters HOLD out of the render, keep HOLD items in a `// HOLD LOG` comment (and optionally one `watch[]` line), not in `events[]`.

---

## Licence gate (runs before ANY new source is used)

No source, whether a wire, an official channel, a dataset or a map, goes into a fact, pin, wave, KPI or catalog until it passes these steps. Record the result in the source register, never from memory.

1. [ ] **Find the terms.** Open the source's footer and look for Terms / Legal / Copyright / Licence / Mentions légales / Regulamin / Naudojimosi taisyklės. Note the exact terms URL. For datasets, also check the download or API page and any EULA.
2. [ ] **Fetch it yourself.** `curl -sL -A "<browser UA>" <terms URL>`; if that is blocked, use WebFetch. Keep a saved copy with the working notes (not in the repo). If you can't reach it (bot wall, JS-only shell, maintenance page, 404, no terms link anywhere), write **"terms not verified"** and stop guessing. Don't fill the gap from memory, a search snippet or another site's terms (a search-snippet paraphrase must be labelled "paraphrased, not verified").
3. [ ] **Read for five things:** commercial use; reproduction or redistribution; API/data licence (and whether it is sold); attribution wording; automated access or scraping.
4. [ ] **Tag the source** with exactly one tag:
   - **[YES]**: the terms or licence allow commercial use (e.g. public domain, CC0, CC BY, ODbL, GDELT's terms). Note any attribution or share-alike duty.
   - **[PAID]**: commercial use needs a paid or corporate licence, written permission or prior approval, or the licence is non-commercial (e.g. CC BY-NC) and we'd need the content itself.
   - **[CITE]**: news outlets and official statements, plus non-commercially licensed publishers we only cite (CoS 7 Oct: **HRW** and **USNI News**). **State the facts in our own words and link to the source: no copied text, images or maps** (and no video), whatever the source's terms say about personal or non-commercial use.
   - **[UNCLEAR]**: no terms found, or the terms don't settle commercial use. Treat as [PAID].
5. [ ] **Write the one-line note:** `<tag> · <one-line clause or paraphrase> · <terms URL> · terms verified <DD Mon YYYY> | terms not verified`.
6. [ ] **Record it in the catalog:**
   - Ship's source register (`docs/sources.md`): one row with source, use, licence + URL, commercial yes/no/paid, attribution text, verified date.
   - Front/control-map sources also get a `FRONTS` entry in `src/layers.ts` (`commercialUse: "yes" | "no" | "paid"`, `licenseCleared: false`, `data: null`) until Ship clears them.
   - The theater file header: `// SOURCES: <name> [TAG] (terms <verified DD Mon | not verified>)`.
7. [ ] **Apply the gate:** [PAID]/[UNCLEAR] → reference only: never ingested, no coordinates, polygons or text copied, kept in the pack's "paid licence needed; reference only" section. [CITE] → facts in our own words + attribution + link; no copied text, images or maps. [YES] → may be ingested with the required attribution.
8. [ ] **Re-check** terms at each new theater opening and whenever a source changes owner, paywall or API terms.

---

## Pin-placement checklist (rule 2)

For every strike pin or event marker:
1. [ ] **Named source first.** A named outlet or named public official channel places the event in a named town or site. No named place → no pin (HOLD or count row).
2. [ ] **Look it up in NGA GNS** (`geonames.nga.mil` GIS_OUTPUT query: `full_nm_nd='<Name>' AND fc='P' AND cc_ft='<ISO3>'`; for sea features use the feature class, e.g. ATOL/ISL). Polite single lookups only.
3. [ ] **Count the matches.** Filter by the admin area (adm1) the source states or plainly implies (*this admin-area reading is proposed, pending CoS review*). **More than one GNS record still matching → drop the pin** (no "looks right" picks; e.g. 4 GNS "Goma" in DRC, but only one in North Kivu; "Pag-asa" has 25+ Philippine records). No GNS record at all → no pin.
4. [ ] **Record UFI and UNI** in a comment next to `lat`/`lon`: `// <Name>: NGA GNS UFI <ufi>, UNI <uni> (<desig_cd>)`. Round to 3 dp.
5. [ ] **Set `geolocator: "Watchfloor (town-level placement)"`** and `url:` to the **outlet's https article URL** (not a geolocator, not an aggregator).
6. [ ] **Never copy coordinates** from GeoConfirmed, DeepStateMap, ISW or ACLED (or Liveuamap, Sudan War Monitor or any [PAID]/[UNCLEAR] source). A GeoConfirmed placemark may appear as a reference link only.
7. [ ] **Never use OSM/Nominatim coordinates** for a pin.
8. [ ] **Site caveat.** If the pin sits on a city but the event was at a site away from it (airport, base, refinery, port), add the caveat to the fact text: `"pin at city; airport ~33 km NE"`. Take the distance and bearing from a [YES] source (e.g. GNS or OurAirports coordinates); if you can't measure them, write "pin at city; site is outside the city" with no number.
9. [ ] **Confidence and tone:** REPORTED only if a wire on the named-wire list reports it or carries the official statement (`per <party>, via <wire>`); otherwise CLAIM and `tone: "dim"`.
10. [ ] **FIRMS never places or upgrades a pin.** A FIRMS hotspot near the town can be mentioned as support ("FIRMS thermal anomaly nearby; not a confirmed strike") only alongside the named report.
11. [ ] **No unit positions** finer than town-level press reporting; no vessel positions (use the GNS sea feature).

---

## Hour 0–1: open the theater

**Trigger: open only if ≥1 of these is met *and* CoS approves (rule 7: a new theater needs CoS approval).**
- [ ] REPORTED-or-better kinetic or state-on-state event outside the existing theaters (Iran/Gulf, Levant/Yemen, Ukraine, Sudan, Energy, AfPak), *or*
- [ ] Crisis Group CrisisWatch "Conflict Risk Alert", a UN/OCHA flash update, or a maritime authority advisory (UKMTO/MARAD/JMIC or the regional equivalent) naming the area, *or*
- [ ] Sustained wire coverage (≥2 independent wires, ≥2 days) of an escalation that the Overview can no longer carry in one line.
- An aggregator spike, a viral video or a FIRMS cluster alone does **not** trigger opening a theater.

**Build checklist (~45 min)**
0. [ ] **Licence gate** on every source you'll use (above). Pull the pre-tagged list from `kit/flashpoint-source-standby.md` where the theater has a pack.
1. [ ] **Start date.** Pick the event that starts the clock and name its source, following the house pattern (Iran: D+0 = 28 FEB 2026, "US–Israel air war opens", event `ir-6`): `// CONFLICT CLOCK: D+0 = <YYYY-MM-DD> | <SOURCE>: <what happened>`. If no clean start exists, leave the clock out; don't backdate it.
   Recompute at ship (ET): `python3 -c "from datetime import date; print((date.today()-date(2026,2,28)).days)"   # Iran → 221 on 07 Oct 2026`
2. [ ] **Map center/zoom.** Use a GNS town/city point (record UFI/UNI), or a Watchfloor-chosen round view center for sea theaters (not a pin). Round to 3 dp. Zoom: 5–6 for a country or region, 7–8 for a province or front. Don't use Nominatim coordinates.
3. [ ] **3–6 seed events**, each one of: a listed wire or major outlet reporting in its own voice (REPORTED); a government/coalition statement carried by a wire on the named-wire list (REPORTED, `per <party>, via <wire>`); a party statement seen only on its own channel (CLAIM); or a neutral body (UN/OCHA/maritime authority). Most first-hour items are REPORTED or CLAIM, *not* CONFIRMED.
4. [ ] **Status line** (≤6 words, caps) restating what sources say, e.g. `TANKER WAR SURGE / DIPLO STALL` (Iran). No forecasts ("WAR IMMINENT") and no adjectives the sources didn't use.
5. [ ] **KPIs (3–4).** `CONFLICT CLOCK` (only with a sourced D+0), then sourced counts or states (`TIES: SEVERED` only if the foreign ministry said so) or `—`. Use `"hot"`/`"warn"` only when backed by REPORTED+. Unsourced numbers become `—`, not estimates. FIRMS counts are not a KPI of strikes.
6. [ ] **Watch list (4–6).** Open questions with the source to check, e.g. `Troop presence: witnesses (wire) vs official denial`.
7. [ ] **Markers and pins.** Run the pin-placement checklist. REPORTED+ → `warn`/`hot`; CLAIM → `dim`. Use the same coord as the event (the popup matches within 0.02°).
8. [ ] **Waves.** Arrows only for source-stated launch→target pairs; everything else is count rows (names, no coords). No cross-product pairs.
9. [ ] **Fronts.** None drawn. Catalog any front-map source with `commercialUse`, `licenseCleared: false`, `data: null`.
10. [ ] **SNAPSHOT.** Update `src/sitrep.ts` to the real ship time, e.g. `dtgLocal: "2026-10-07 1824L"`, `dtgZulu: "2026-10-07 2224Z"`, `sourceAge: "SNAPSHOT 07 OCT 2026 ~18:24 ET"`. Z = ET+4 until **01 Nov 2026**, then ET+5.
11. [ ] Hand off to COP (below). Don't push.

---

## Hours 1–6 and 6–24: keep it honest

**Re-check cadence**
| Window | Cadence | Check |
|---|---|---|
| H1–H6 | every 60 min | Tier-1 wires, each party's official channel, neutral bodies; every CLAIM and DELTA on the board |
| H6–H24 | every 3 h (sooner on an alert) | Same list, plus the day's OCHA/UN/maritime notices; re-run the D+ calc at each ship |
| Every ship | — | SNAPSHOT updated; event `dtg` = event date (not ship date); no fact older than 72 h still marked as the lead without a reason; every new source has been through the licence gate |

**Promotion / demotion**
- **Lead-only sources (e.g. MENASTREAM):** can tip us off, but nothing ships on them alone, and nothing they say moves above CLAIM unless a wire on the named-wire list or an official source confirms it.
- **CLAIM → REPORTED:** a wire on the named-wire list or a major outlet reports it *in its own voice* (not "X said on Telegram"), or a wire on the named-wire list **carries** the government/coalition statement. Relabel the fact `per <party>, via <wire>:`. An outlet that is not on the list carrying the statement does not promote it.
- **REPORTED → CONFIRMED:** ≥2 independent named sources (different owners and governments), or neutral or both-sides official confirmation (e.g. Oman MoD + India MEA on the *same* ship).
- **Never promotes:** aggregators, anonymous accounts, reposts of the same original claim, a second outlet of the same government, **a FIRMS hotspot**, or a [PAID]/[UNCLEAR] source's map or dataset.
- **Demote** to CLAIM or HOLD, or **pull it**, when the original source retracts, a neutral body contradicts it, or the footage turns out to be old or elsewhere. Say what changed in the fact (`Updated: Reuters 1400Z retracts…`), and keep the event id.
- **Marker tone follows the event:** demoting to CLAIM takes the marker to `dim`.

**DELTA template (sources split)**
```
fact: "<Source A>: <claim A>. <Source B>: <claim B>. No independent confirmation of either. <Area/town> pin only."
confidence: "DELTA", source: "OPEN COMP"
```
For example: PCG says a CCG vessel rammed a BFAR boat, and CCG spox says the Philippine side "bears full responsibility". The *contact* can be REPORTED (both sides confirm a collision, or "per PCG, via Reuters"), while the *fault* stays DELTA in the text.

**HOLD log (in the file, as a comment, never plotted)**
```
// HOLD LOG  (not plotted, re-check each cycle)
// <DTG> | <place> | <what> | <only source> | <why held: no coord / ambiguous GNS name / single anon source / unverified footage / FIRMS only> | <next check>
```

**When to add markers:** once a town has REPORTED+ activity (`warn`/`hot`), or a CLAIM worth showing (`dim`). Don't add a marker for a region name with no town ("North Kivu"), for a sea feature as if it were a town, for a FIRMS hotspot, or "for context".

---

## What never goes on the board

- **Recycled old stories:** footage from a previous round (e.g. 2023 Kidal, 2024 Second Thomas Shoal) recirculated as new. Check the date on the original upload or wire.
- **Aggregator-only items:** "BREAKING" accounts with no named origin. Trace them to a named source or HOLD them.
- **One side's casualty figures shown bare:** always attribute (`FARDC claims…`, `M23 spox says…`). Never total two sides' figures. Never fill in a number the source didn't give.
- **Inferred attribution:** "drone strike by X" when the notice names no attacker.
- **Precise positions:** vessel positions as exact points (use the GNS sea feature), unit locations finer than town-level press reporting, or "geolocated" sites from social video.
- **Borrowed or unsourced coords:** coordinates from GeoConfirmed, DeepStateMap, ISW, ACLED or any [PAID]/[UNCLEAR] source; OSM/Nominatim coordinates; coords from a news map graphic; a guessed centroid; or one of several GNS matches chosen because it "looks right".
- **FIRMS as a strike:** a thermal anomaly drawn or worded as a confirmed strike, or used alone to raise confidence.
- **Approximate control or front areas,** or any polygon redrawn from DeepStateMap/ISW/CTP/Liveuamap.
- **Invented arrows:** cross-product wave pairings, or arrows the source doesn't state.
- **Restricted material:** classified, FOUO, leaked, private-Telegram or private-channel content, even if a public account has posted it.
- **Jihadist or militant media linked directly:** cite it through SITE as quoted by Reuters or another reputable intermediary, as CLAIM.
- **Republished text, photos, video or maps** from any [CITE] outlet.
- **Forecasts as status:** opinion pieces, "escalation scores" or think-tank forecasts restated as facts.

---

## Handoffs (all pushes follow rule 7 and CoS approval; Sitrep does not push)

| To | What Sitrep hands over | Notes |
|---|---|---|
| **COP** (map/registry) | `src/sitrep.<id>.ts` (self-contained module, discovered by `import.meta.glob("./sitrep.*.ts")`) + the one-line `THEATER_ORDER` addition in `src/sitrep.ts`, **applied only after CoS approval**. `TheaterId` is `string` on main, so no type change is needed. Ask COP to filter `HOLD` out of the render (⚠1). Any `tracks.ts` entry needs a named origin and impact. Any FRONTS entry: `data: null`, `licenseCleared: false`. | A file not listed in `THEATER_ORDER` is staged but hidden. `npm run build` = `tsc --noEmit && vite build`, so the skeleton's TODOs fail the build on purpose until they're filled. |
| **Live** | Theater id, center, suggested AOR keywords. Live's GDELT preset stays **disabled** until CoS says yes. FIRMS: confirm the theater's bbox, the 300-point cap, and that flare-flagged points stay muted. | `scripts/fetch_live.py` also needs a `BBOX` row and `AOR` token. `coords_match_place()` drops any row with `lon > 70`, so theaters east of 70°E get no live rows until the fix lands. `BBOX` is first-match: the `ukraine` box (44–53.5N, 22–42E) will grab southern Belarus/NE Poland rows. |
| **Ship** | The file passes `npm run build` locally; SNAPSHOT time; D+ start source; **licence-gate results** (one register row per new source). | Ship deploys per the `docs/` runbook, only on approval: **GitHub connector, ≤4 files per call**, then **sha256 of each pushed file at the new commit SHA** matches the local file, and the **GitHub Pages run is green**. |

---

## Fill-in skeleton: `src/sitrep.<id>.ts`

Matches `Theater` in `src/sitrep.types.ts`. Valid values: `SourceClass` = `"STATE" | "PRESS" | "MIL CLAIM" | "UN FFM" | "OPEN COMP"`; `Priority` = `"PRI-1" | "PRI-2" | "PRI-3"`; tones = `"hot" | "warn" | "ok" | "dim"`.

```ts
import type { Theater } from "./sitrep.types";

// ============================================================================
// TEMPLATE. NOTHING IN THIS FILE IS REAL DATA. DO NOT SHIP AS-IS.
// TODO_LAT / TODO_LON / TODO_ZOOM are deliberately UNDECLARED, so
// `npm run build` (tsc --noEmit) fails until each one is replaced with an
// NGA GNS town/site coord (3 dp, UFI/UNI in a comment) or the item is deleted.
// Goes live ONLY after CoS approval AND "<id>" is added to THEATER_ORDER in src/sitrep.ts.
// ----------------------------------------------------------------------------
// CONFLICT CLOCK: D+0 = <YYYY-MM-DD> | <SOURCE>: <what happened that day>
//   recompute at ship (ET): python3 -c "from datetime import date; print((date.today()-date(YYYY,M,D)).days)"
// MAP CENTER: NGA GNS <Name>, UFI <ufi>, UNI <uni> (<desig_cd>, adm1 <adm1>)  | or: Watchfloor round view center (sea; not a pin)
// SOURCES (licence gate): <wire> [CITE] (terms verified DD Mon) · <party A official> [CITE] (terms not verified) · <dataset> [YES] (...)
// REFERENCE ONLY (never ingested): <source> [PAID|UNCLEAR]
// HOLD LOG (not plotted):
//   <DTG> | <place> | <what> | <only source> | <why held> | <next check>
// ============================================================================

export const THEATER_<ID>: Theater = {
  id: "<id>",
  name: "<THEATER NAME>",
  short: "<SHORT>",
  status: "<WHAT SOURCES SAY, <=6 WORDS>",
  pip: "dim", // "warn"/"hot" only once REPORTED-or-better activity is on the board
  map: { lat: TODO_LAT, lon: TODO_LON, zoom: TODO_ZOOM },
  kpis: [
    { label: "CONFLICT CLOCK", value: "D+<N from sourced D+0>", tone: "dim" },
    { label: "<KPI>", value: "<SOURCE>: <value> or \u2014", tone: "dim" },
    { label: "<KPI>", value: "<SOURCE>: <value> or \u2014", tone: "dim" },
  ],
  watch: [
    "<open question> \u2014 <source to check>",
    "<CLAIM awaiting corroboration> \u2014 <who could confirm>",
  ],
  events: [
    {
      id: "<id>-<slug>",
      dtg: "<DD MON>",
      location: "<TOWN or GNS SITE>",
      fact: "per <PARTY>, via <WIRE ON NAMED-WIRE LIST>: <fact, no unstated cause/attribution/casualties>. Town pin only.",
      source: "PRESS",
      confidence: "REPORTED",
      priority: "PRI-1",
      lat: TODO_LAT, // <Town>: NGA GNS UFI <ufi>, UNI <uni>
      lon: TODO_LON,
    },
    {
      id: "<id>-<slug>",
      dtg: "<DD MON>",
      location: "<TOWN>",
      fact: "<PARTY OFFICIAL / CHANNEL>: <claim>. Single-source; not carried by a listed wire; no independent corroboration. Town pin only.",
      source: "MIL CLAIM",
      confidence: "CLAIM",
      priority: "PRI-2",
      lat: TODO_LAT, // <Town>: NGA GNS UFI <ufi>, UNI <uni>
      lon: TODO_LON,
    },
    {
      id: "<id>-<slug>",
      dtg: "<DD MON>",
      location: "<TOWN or GNS SITE>",
      fact: "<SOURCE A>: <version A>. <SOURCE B>: <version B>. Pin at city; <site> ~<N> km <bearing> (if applicable).",
      source: "OPEN COMP",
      confidence: "DELTA",
      priority: "PRI-2",
      lat: TODO_LAT, // <Town>: NGA GNS UFI <ufi>, UNI <uni>
      lon: TODO_LON,
    },
  ],
  markers: [
    // tone: "dim" if the only event here is CLAIM; "warn"/"hot" only for REPORTED+. Never a FIRMS point.
    { id: "<slug>", name: "<TOWN>", lat: TODO_LAT, lon: TODO_LON, note: "<SOURCE>: <short note>", tone: "dim" },
  ],
};
```

**Pre-handoff self-check:** every source passed the licence gate and is tagged · no [PAID]/[UNCLEAR] data ingested · every `fact` names a source (`per <party>, via <wire>` where carried by a listed wire) · no `TODO_` left · every coord is NGA GNS at 3 dp with UFI/UNI · no ambiguous GNS names pinned · no GeoConfirmed/DeepState/ISW/ACLED/OSM coords · site caveats written · no arrows without a source-stated pair · no front areas (`data: null`) · no FIRMS-only items · no HOLD items in `events[]` · D+ recomputed · CLAIM markers are `dim` · `npm run build` passes · SNAPSHOT shows the real ET time · `THEATER_ORDER` edit waits for CoS approval.
