# Changelog: Sitrep flashpoint kit revised to the 7 Oct 2026 rules

Revised 07 Oct 2026, ~19:40–20:15 ET. **Approved by CoS on 7 Oct 2026 at ~8:03 PM ET** with the decisions below. Published as a docs-only commit. Pre-revision copies are kept with the working drafts and are not published.

## Files
| File | What it is |
|---|---|
| `sitrep-first-24h-playbook.md` | First 24 hours after a new flashpoint opens (Sitrep side) |
| `flashpoint-source-standby.md` | Source standby list: §0 cross-theater sources plus the four flashpoint packs as §1–§4 (scs, kivu, baltic, sahel). There are no separate pack files |
| `CHANGELOG-2026-10-07.md` | This file |

## CoS decisions (7 Oct 2026, ~8:03 PM ET)
1. **MENASTREAM: kept as a reference-only lead.** It can tip us off, but nothing ships on it alone, and nothing it says moves above CLAIM unless a wire on the named-wire list or an official source confirms it. Written into the sahel pack entry and the playbook's promotion rules.
2. **Named-wire list, closed:** Reuters · AP · AFP (Agence France-Presse) · Anadolu Agency · Al Jazeera · national public broadcasters LSM (Latvia), LRT (Lithuania), ERR (Estonia). Anything not on the list is an **outlet, not a wire**. REPORTED for a carried government/coalition statement now points to this list (`per <party>, via <wire>`). In the packs, the old "T1" tier is split into **WIRE** and **OUTLET** rows, and the Baltic "via LSM/Kyiv Independent" wording now reads "via LSM" (KI is an outlet). *Drafting note:* another national public broadcaster counts only once CoS adds it to the list by name, and state-controlled media of a party to the conflict (e.g. Xinhua, TASS, BelTA, ORTM) are never wires.
3. **HRW and USNI News stay cite-only:** state the facts in our own words and link to them, with no copied text, images or maps. Written into both source entries and the licence gate's [CITE] definition.
4. **Kivu Security Tracker (kivusecurity.org): on hold until the Ebuteli move is confirmed.** The domain currently serves a placeholder page; no new URL or terms are listed until the move is confirmed.
5. CoS also approved these working readings: GNS ambiguity means same name **and** the admin area the source states or plainly implies (so Goma, North Kivu is unique); the Kremlin site is tagged commercial-use yes (CC BY 4.0) but its statements stay CLAIM; NGA WPI and ISW keep their CoS-list tags with "terms not verified".

## sitrep-first-24h-playbook.md
- **Rule 1:** licence-tag house rule, plus a new 8-step **licence gate** (find terms → fetch yourself → read 5 points → tag → one-line note → record in register/FRONTS/file header → apply gate → re-check). Build step 0 runs the gate.
- **Rule 2:** coordinates moved from Nominatim/OSM to **NGA GNS with UFI/UNI**. New 11-step **pin-placement checklist**: ambiguity drop, `geolocator: "Watchfloor (town-level placement)"`, outlet https URL, no GeoConfirmed/DeepState/ISW/ACLED/OSM coordinates, site caveat ("pin at city; airport ~33 km NE").
- **Rule 3:** arrows only for launch→target pairs the source states; count rows otherwise; no cross-product pairs.
- **Rule 4:** named-wire list added. REPORTED for a carried statement requires a listed wire (`per <party>, via <wire>`); otherwise CLAIM, shown dim.
- **Rule 5:** no approximate fronts. FRONTS catalog entries carry `commercialUse`, `licenseCleared: false`, `data: null`.
- **Rule 6:** open press and named public official channels only; no classified, FOUO, leaked or private-Telegram material.
- **Rule 7:** handoffs rewritten for `THEATER_ORDER` + module discovery. A new theater needs CoS approval. Pushes: GitHub connector, ≤4 files per call, then sha256 at the new SHA and a green Pages run.
- **FIRMS rule** (layer live since ad2e337 + 3e8cd5f; footer disclaimer link 85cf933): FIRMS points are thermal anomalies, never strike pins or confidence boosts on their own. They may only support a named report, and that pin still uses NGA GNS placement. Anyone receiving FIRMS data gets the disclaimer link https://firms.modaps.eosdis.nasa.gov/download/Readme.txt (it advises against tactical or local-scale decisions).
- Skeleton and pre-handoff self-check updated to match.

## flashpoint-source-standby.md
- **Rule 1:** every source tagged ([YES] commercial-use yes · [PAID] paid licence needed, not ingested · [CITE] cite-only · [UNCLEAR]) with a one-line terms note, terms URL, and verified / **not verified** status (terms pages fetched with curl or WebFetch on 07 Oct; nothing guessed). Each pack has a "paid licence needed; reference only" section, which also holds the unclear sources. New §0 lists the cross-theater sources.
- **Rule 2:** all OSM/Nominatim coordinates removed. Map centers and gazetteer notes use NGA GNS (UFI/UNI), with ambiguity checks: Goma ×4 in DRC, Kalehe ×3, Masisi ×2, Kati ×3, Dioura ×2, Pag-asa 25+. Rubaya and Katoyi have no GNS record, so no pin.
- **Rule 4:** WIRE/OUTLET tiers; traps reworded to `per <party>, via <listed wire>`.
- **Rule 5:** front-map catalog per pack (kivu: CTP CWSR; sahel: CTP Africa File; scs/baltic: none), all `data: null`, `licenseCleared: false`.
- **Links (curl, 07 Oct ~19:45 ET):** kivusecurity.org is a placeholder page (on hold, see decision 4). Redirects updated: primature.cd → primature.gouv.cd; Crisis Group China and Europe pages. Status changes: RFI Afrique now reachable; Rappler and the LRT article now bot-walled (LRT and LSM articles read in full via WebFetch). No 404s.

## Licence counts per pack (one row per source in the pack tables)
| Pack | [YES] | [PAID] | [CITE] | [UNCLEAR] | Total |
|---|---|---|---|---|---|
| scs | 0 | 0 | 23 | 2 (AMTI, SeaLight) | 25 |
| kivu | 0 | 2 (ACLED, CTP) | 20 | 1 (Kivu Security Tracker, on hold) | 23 |
| baltic | 1 (Kremlin site, CC BY 4.0) | 2 (ISW, ACLED) | 26 | 0 | 29 |
| sahel | 0 | 2 (ACLED, CTP) | 13 | 2 (Bellingcat, MENASTREAM: reference-only lead) | 17 |
| §0 cross-theater | 7 | 5 | 0 | 2 (Liveuamap, GeoConfirmed) | 14 |
"Why now" article links are tagged inline but not counted.
