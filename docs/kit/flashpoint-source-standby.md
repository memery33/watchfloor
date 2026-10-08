# Watchfloor: flashpoint source standby list

**DRAFT for Chief of Staff, then Michael. Not approved, no theater opened, nothing pushed, nobody messaged.**
Compiled 07 Oct 2026 (ET). **Revised 07 Oct 2026 ~20:00 ET to the rules adopted 7 Oct** (licence tags, GNS pins, waves, confidence, no fronts, open sources only, theater modules). Changes are listed in `CHANGELOG-2026-10-07.md` (same folder). **CoS approved on 7 Oct 2026 (~8:03 PM ET).**
Scope excludes the existing theaters (Iran/Gulf, Levant/Yemen, Ukraine, Sudan, Energy, AfPak) and the ones being built separately (Sudan, Ethiopia, Yemen).

> **Where the "packs" are:** the four flashpoint packs (scs, kivu, baltic, sahel) are §1–§4 of this file. There are no separate pack files.

## How to read this

**Licence tags (rule 1).** Every source has exactly one tag, a one-line terms note, and a terms URL where one exists.
| Tag | Meaning | What we may do |
|---|---|---|
| **[YES]** commercial-use yes | The licence or terms allow commercial use | May ingest, with the attribution the terms require |
| **[PAID]** paid licence needed (not ingested) | Commercial use needs a paid licence, written permission or prior approval, or the licence is non-commercial | Reference only. Never ingested; coordinates, polygons and text are never copied |
| **[CITE]** cite-only | News, or an official statement | Cite the fact, name the outlet or issuer, link it. Never republish text, photos, video or maps |
| **[UNCLEAR]** unclear | No terms found, or the terms don't settle commercial use | Treat as [PAID] until cleared: reference only |

- **"terms verified 07 Oct"** means Sitrep fetched the terms page directly (curl or WebFetch) and read the clause quoted or paraphrased. **"terms not verified"** means the page could not be reached or found (bot wall, JS-only shell, maintenance page, no terms link found). Nothing in a "not verified" row is guessed. The tag still follows the source type (news/official → [CITE]) or the CoS list of 7 Oct.
- **News and official [CITE] sources:** most outlet terms limit use to "personal, non-commercial" and forbid reproduction. Cite-only use (a fact, the outlet's name, a link) never relies on a licence, so those terms don't move an outlet to [PAID]. They do mean **no scraping** and **no copied text, photos or maps**.

**URL status (checked with curl, 07 Oct ~19:45 ET; blocked pages re-tried with WebFetch).**
✓ = HTTP 200 · ⊘ = the site exists but blocks scripted fetches (401/403/418 bot wall) · ✗ = **dead** (gone, or a placeholder page) · ↪ = redirected, URL updated to the target. No listed URL returned 404 on 07 Oct. X profile pages return 200 for any handle, so they were confirmed by the profile name in the page title.

**Confidence (rule 4).** CONFIRMED / REPORTED / CLAIM / DELTA / HOLD. A government or coalition statement **carried by a wire on the named-wire list** is REPORTED and is labelled `per <party>, via <wire>`. The same statement seen only on the party's own channel is **CLAIM** (dim tone). Yellow stays yellow until a named source corroborates it.

**Named-wire list (CoS, 7 Oct 2026; closed list):** **Reuters · AP (Associated Press) · AFP (Agence France-Presse) · Anadolu Agency · Al Jazeera · national public broadcasters: LSM (Latvia), LRT (Lithuania), ERR (Estonia).** Anything not on this list is an **outlet, not a wire**, however large (e.g. SCMP, Straits Times, Kyiv Independent, Jeune Afrique, RFI, Radio Okapi, USNI News). Another national public broadcaster counts only once CoS adds it to this list by name; state-controlled media of a party to the conflict (e.g. Xinhua, TASS, BelTA, ORTM) are never wires. A party statement carried only by an outlet stays CLAIM. (Source of truth: the playbook's confidence section.)

**Tiers.** **WIRE** = on the named-wire list (can make a carried statement REPORTED). **OUTLET** = any other news outlet: its own reporting can be REPORTED, but a party statement it carries stays CLAIM. **STATE/MIL** = a party's own channel: CLAIM unless a listed wire carries it. **NEUTRAL** = institutional. Social accounts never promote anything.

**Coordinates (rule 2).** Pins use **NGA GNS** town- or site-level points with UFI/UNI recorded. The OSM/Nominatim coordinates in the previous draft have been removed (ODbL share-alike; not for pins). Raw GNS query responses are kept with the working notes (not in the repo).

**Live overlay note.** `scripts/fetch_live.py` `coords_match_place()` drops every row with `lon > 70`. `src/live.ts` on main no longer has the 20–70°E box. Any new theater also needs a `BBOX` row and an `AOR` token in `fetch_live.py`. **FIRMS:** see the FIRMS rule in the cross-theater section. FIRMS points never become pins.

| # | Flashpoint | Suggested id / name | Map view center | Zoom | East of 70°E? |
|---|---|---|---|---|---|
| 1 | South China Sea (PH–PRC) | `scs` / SOUTH CHINA SEA | 15.000, 115.000 (Watchfloor-chosen round view center; not a pin, no gazetteer) | 5 | **YES. Live rows dropped until fix** |
| 2 | Eastern DRC (Kivus) | `kivu` / EASTERN DRC / KIVUS | Goma −1.674, 29.229 (GNS UFI −2043901, UNI −2837365) | 7 | No |
| 3 | Baltic / Belarus NE flank | `baltic` / NATO NE FLANK | Vilnius 54.679, 25.287 (GNS UFI −2620663, UNI −3610216) | 6 | No |
| 4 | Mali / Central Sahel | `sahel` / MALI / SAHEL | Mopti 14.490, −4.192 (GNS UFI −1071966, UNI −1590941) | 5 | No |

Opening any of these needs **CoS approval** and goes live only once `"<id>"` is added to `THEATER_ORDER` in `src/sitrep.ts` (rule 7). See the playbook.

---

## 0. Cross-theater standby sources (all packs)

These aren't counted in the per-pack tallies.

**Commercially usable data**
| Source | Tag | Terms note (one line) | Terms URL | Verified? |
|---|---|---|---|---|
| UCDP (GED events) | **[YES]** | "All datasets are free of charge and licensed under CC BY 4.0"; cite the listed publication. Events only, not fronts | https://ucdp.uu.se/downloads/ ✓ | terms verified 07 Oct |
| GDELT 2.0 (already in app) | **[YES]** | "unlimited and unrestricted use for any academic, commercial, or governmental use"; must cite GDELT and link gdeltproject.org | https://www.gdeltproject.org/about.html ✓ | terms verified 07 Oct |
| NGA GeoNames Server (GNS): **the pin gazetteer** | **[YES]** (public domain) | "There are no licensing requirements or restrictions in place for the use of the GNS data"; NGA recommends a citation line | https://geonames.nga.mil/ ✓ (↪ /geonames/GNSHome/) | terms verified 07 Oct |
| OurAirports | **[YES]** (public domain) | "All data is released to the Public Domain" | https://ourairports.com/data/ ✓ | terms verified 07 Oct |
| NGA World Port Index (Pub 150) | **[YES]** (public domain, per CoS list 7 Oct; keeping the tag while terms are unverified is *proposed, pending CoS review*) | Not confirmed: the page is a JS-only app and returned only "You need to enable JavaScript" to curl and WebFetch | https://msi.nga.mil/Publications/WPI (JS shell) | **terms not verified** |
| NASA FIRMS (active fire) | **[YES]** (public domain / CC0, no key) | NASA Earthdata: mission data "licensed as Creative Commons Zero (CC0)" unless marked. The global 24 h VIIRS CSV downloaded without a key (HTTP 200, 07 Oct). **Redistribution: link the FIRMS disclaimer** | https://www.earthdata.nasa.gov/engage/open-data-services-software-policies/data-use-guidance ✓ · disclaimer https://firms.modaps.eosdis.nasa.gov/download/Readme.txt ✓ | terms verified 07 Oct |
| OpenStreetMap / Nominatim | **[YES]** but **ODbL share-alike: avoid for pins** | "If you alter or build upon our data, you may distribute the result only under the same license." Disambiguation lookups only; never copy coords into the repo | https://www.openstreetmap.org/copyright ✓ | terms verified 07 Oct |

**FIRMS rule (live since ad2e337 + 3e8cd5f; footer disclaimer link 85cf933).** Off by default, 300 points per theater, flare-flagged points drawn muted. FIRMS points are **thermal anomalies, not confirmed strikes**. Never turn a FIRMS point into a strike pin, and never use one on its own to raise confidence. A FIRMS point may only *support* a named press or official report, and that pin still uses NGA GNS town-level placement. If FIRMS data goes to anyone else, link https://firms.modaps.eosdis.nasa.gov/download/Readme.txt. That disclaimer says use "for tactical decision-making or informing about conditions at a local scale [is] not advised."

**Paid licence needed; reference only (cross-theater)**
| Source | Tag | Terms note (one line) | Terms URL | Verified? |
|---|---|---|---|---|
| DeepStateMap.live | **[PAID]** | "Entities operating on a commercial basis may use the API only with prior approval"; no copying of its objects. Never copy its coordinates or polygons | https://deepstatemap.live/license-en.html ✓ | terms verified 07 Oct |
| ISW (and CTP Ukraine/Iran maps) | **[PAID]** (keeping the tag while terms are unverified is *proposed, pending CoS review*) | Paraphrase only: commercial use or incorporation into datasets/mapping platforms needs prior written permission. Never copy its coordinates or polygons | https://understandingwar.org/fair-use-and-attribution-policy/ ⊘ (Cloudflare to curl and WebFetch) | **terms not verified** (paraphrased) |
| AEI Critical Threats Project (CTP) | **[PAID]** | "brief quotations or excerpts" with a link are allowed; "Permission must be obtained… for all other requests", including graphics and maps | https://www.criticalthreats.org/terms ✓ | terms verified 07 Oct |
| ACLED | **[PAID]** | EULA 1.2: "Commercial entities may not access or use the Content and/or Platforms without first obtaining a corporate license"; scraping prohibited. Never copy its coordinates | https://acleddata.com/eula/ (curl gets a JS challenge; read via WebFetch) | terms verified 07 Oct |
| Liveuamap | **[UNCLEAR]** (paid or unclear) | "You may use our data and maps… with reference to liveuamap.com", but the API is sold as an enterprise product, so commercial scope is unclear | https://liveuamap.com/about ✓ | terms verified 07 Oct (scope unclear) |
| GeoConfirmed | **[UNCLEAR]**: reference link only | OpenAPI: "freely available for research, journalism, and analytical use"; no licence or ToS field. Never copy its coordinates | https://geoconfirmed.org/openapi/v1.json ✓ | terms verified 07 Oct (no licence published) |
| Sudan War Monitor | **[PAID]** (needs permission) | May be "cited and attributed"; "All other reproduction is prohibited without written permission" | https://sudanwarmonitor.com/about ✓ | terms verified 07 Oct |

---

## 1. South China Sea (Philippines–China): `scs`

**Why now:** PCG says a China Coast Guard cutter rammed a BFAR vessel off Palawan on 18 Sep, and China blamed Manila. Since then: a J-16 vs PH C-208 near Scarborough (3 Oct), CCG obstruction near Pag-asa (4 Oct), and 20+ Chinese ships off Palawan with water cannon near Scarborough (7 Oct). *Confidence: each side's account is CLAIM unless a listed wire carries it ("per PCG, via Reuters"). Philstar and GMA are outlets, not wires.*
- Reuters, 18 Sep 2026 **[CITE]**: https://www.reuters.com/world/china/china-vessel-rams-damages-philippine-fishing-boat-coast-guard-says-2026-09-18/ ⊘ (401; confirmed via search results only). Mirrored at Al Jazeera ✓ https://www.aljazeera.com/news/2026/9/18/chinese-ship-rams-philippines-govt-vessel-in-south-china-sea-coastguard
- Philstar, 6 Oct 2026 **[CITE]**: https://www.philstar.com/headlines/2026/10/06/2561286/china-accuses-ph-aircraft-illegal-intrusion-over-bajo-de-masinloc ✓
- GMA, 7 Oct 2026 **[CITE]**: https://www.gmanetwork.com/news/topstories/nation/1005146/over-20-chinese-ships-spotted-in-palawan-waters-on-wednesday-october-7-2026-pcg/story/ ✓

**Map:** view center 15.000, 115.000, zoom 5 (Watchfloor-chosen round number; not a pin). **East of 70°E: YES.**
**GNS reference sites (rule 2; site-level, neutral labels):**
- **Scarborough Shoal**: GNS approved name "Scarborough Reef", UFI −1323038, UNI −1912148, ATOL, 15.150, 117.767. The same UFI carries variants Scarborough Shoal (UNI −1912149), Bajo de Masinloc (UNI 14408797), Panatag Shoal (UNI 14408798) and Huangyan Dao (UNI 14422475).
- **Pag-asa / Thitu**: GNS "Thitu Island", UFI −1323086, UNI −1912267 (variant "Pag-asa", UNI 14407152), ISL, 11.053, 114.285. **Don't search "Pag-asa" alone:** GNS has 25+ Philippine populated places and barangays named Pag-asa, so drop the pin unless the source clearly means Thitu.

**Sources: 25 in total. [CITE] 23 · [UNCLEAR] 2 (in the reference-only section) · [PAID] 0 · [YES] 0** (commercial data is in §0)

| Tier | Source | URL | Tag | Terms note (one line) | Terms URL / status |
|---|---|---|---|---|---|
| WIRE | Reuters Asia-Pacific | https://www.reuters.com/world/asia-pacific/ ⊘ | **[CITE]** | Wire copyright; cite and link only | https://www.reuters.com/info-pages/terms-of-use/ ⊘ (401) · **terms not verified** |
| WIRE | AP South China Sea hub | https://apnews.com/hub/south-china-sea ✓ | **[CITE]** | AP ToS bars automated access (robots, scrapers, AI) without written permission; cite and link only | https://apnews.com/termsofservice ✓ · terms verified 07 Oct |
| WIRE | AP Philippines | https://apnews.com/hub/philippines ✓ | **[CITE]** | As above | https://apnews.com/termsofservice ✓ · terms verified 07 Oct |
| WIRE | Al Jazeera Philippines | https://www.aljazeera.com/where/philippines/ ✓ | **[CITE]** | "only for your own personal, non-commercial use"; no copying or commercial exploitation | https://www.aljazeera.com/terms-and-conditions/ ✓ · terms verified 07 Oct |
| OUTLET | Straits Times SE Asia | https://www.straitstimes.com/asia/se-asia ✓ | **[CITE]** | SPH Media T&C: no reproduction "for any commercial or other purposes"; no scraping | https://www.sph.com.sg/legal/website_tnc/ ✓ (↪ /tnc/website) · terms verified 07 Oct |
| OUTLET | SCMP China | https://www.scmp.com/news/china ✓ | **[CITE]** | "for your own personal and non-commercial use only" | https://www.scmp.com/terms-conditions ✓ · terms verified 07 Oct |
| OUTLET | USNI News | https://news.usni.org/ ✓ | **[CITE]** | CC BY-NC-ND 4.0 (non-commercial). **Cite-only (CoS 7 Oct): state the facts in our own words and link; no copied text, images or maps** | https://news.usni.org/license ✓ · terms verified 07 Oct |
| STATE/MIL: PH | Philippine Coast Guard | https://coastguard.gov.ph/ ⊘ | **[CITE]** | Official statements; CLAIM unless a listed wire carries them | No terms page reachable (bot wall) · **terms not verified** |
| STATE/MIL: PH | Armed Forces of the Philippines | https://www.afp.mil.ph/ ✓ (JS shell) | **[CITE]** | Official statements; CLAIM unless a listed wire carries them | No terms page found (every path returns the app shell) · **terms not verified** |
| STATE/MIL: PH | DFA | https://dfa.gov.ph/ ⊘ | **[CITE]** | Official statements | Bot wall · **terms not verified** |
| STATE/MIL: PH | PCG WPS spox Jay Tarriela on X, **@jaytaryela** | https://x.com/jaytaryela ✓ (title "Jay Tarriela (@jaytaryela) / X") | **[CITE]** | Named public official channel. X ToS: no scraping without written permission; cite and link only | https://x.com/tos ✓ · terms verified 07 Oct (platform) |
| STATE/MIL: PRC | MFA spokesperson briefings | https://www.fmprc.gov.cn/eng/xw/fyrbt/ ✓ | **[CITE]** | Official statements; CLAIM unless a listed wire carries them | The copyright link (/eng/wzdt/bqsm/) ↪ to an MFA "系统维护" (system maintenance) page · **terms not verified** |
| STATE/MIL: PRC | China Coast Guard | https://www.ccg.gov.cn/ ✓ (was ⊘; 418 to bulk check, 200 on re-try) | **[CITE]** | Official statements | No terms page found · **terms not verified** |
| STATE/MIL: PRC | China Military Online (PLA) | http://eng.chinamil.com.cn/ ✓ (http only; https fails TLS) | **[CITE]** | State media | No terms page found · **terms not verified** |
| STATE/MIL: PRC | Xinhua | https://english.news.cn/ ✓ | **[CITE]** | State wire; not independent of MFA/GT | No terms page found (/copyright.htm 404) · **terms not verified** |
| STATE/MIL: PRC | Global Times | https://www.globaltimes.cn/ ✓ | **[CITE]** | State-run; *not independent of Xinhua/MFA* | No terms page found · **terms not verified** |
| NEUTRAL | Singapore Navy Information Fusion Centre | https://www.ifc.org.sg/ifc2web/ ✓ (↪ app page) | **[CITE]** | Official maritime-security notices | No terms page found · **terms not verified** |
| NEUTRAL | ReCAAP ISC (piracy/robbery only) | https://www.recaap.org/ ✓ | **[CITE]** | Site copyright notice; materials "may be subject to posted limitations on usage, reproduction"; cite and link | https://www.recaap.org/terms ✓ · terms verified 07 Oct |
| NEUTRAL | Crisis Group China | https://www.crisisgroup.org/asia-pacific/north-east-asia/china ✓ (↪ from /asia/north-east-asia/china) | **[CITE]** | Works "protected by copyright"; linking allowed; cite and link only | https://www.crisisgroup.org/legal/terms-use ✓ · terms verified 07 Oct |
| Local | Inquirer Global Nation | https://globalnation.inquirer.net/ ✓ | **[CITE]** | "personal, non-commercial home use only"; reproduction needs written permission | https://services.inquirer.net/user-agreement/ ✓ · terms verified 07 Oct |
| Local | Philstar | https://www.philstar.com/headlines ✓ | **[CITE]** | Outlet copyright; cite and link | No terms page found (/terms-and-conditions 404) · **terms not verified** |
| Local | GMA News | https://www.gmanetwork.com/news/ ✓ | **[CITE]** | Outlet copyright; cite and link | No terms page found · **terms not verified** |
| Local | Rappler | https://www.rappler.com/ ⊘ (**was ✓; now 403 bot wall**) | **[CITE]** | Outlet copyright; cite and link | Bot wall · **terms not verified** |

**Paid licence needed; reference only (scs).** Never ingested. Use for leads only, and confirm with a [CITE] source.
| Source | URL | Tag | Terms note | Terms URL / status |
|---|---|---|---|---|
| CSIS AMTI (imagery analysis) | https://amti.csis.org/ ✓ | **[UNCLEAR]** | Analysis and imagery; no AMTI or CSIS terms of use found (csis.org/terms-use 404) | **terms not verified** |
| SeaLight (vessel-tracking analysis; not official) | https://www.sealight.live/ ✓ | **[UNCLEAR]** | No terms page found (/terms 404) | **terms not verified** |

**Front-map catalog (rule 5):** none. A maritime theater has no control areas, and no approximate areas are drawn.

**Traps**
- **Three names per feature:** Scarborough Shoal = Bajo de Masinloc = Huangyan Dao (GNS approved: Scarborough Reef); Thitu = Pag-asa = Zhongye Dao; Second Thomas = Ayungin = Ren'ai Jiao; Subi = Zamora = Zhubi. Normalize to one neutral label and note the others.
- **Never paste a gazetteer display name** (Nominatim returned "黄岩岛, 三沙市, 海南省, 中国" for Scarborough), because it carries a sovereignty claim. Use the GNS site with a neutral label.
- **Shoals aren't towns.** Pin incidents to the GNS site (Scarborough Reef, Thitu Island), never to a vessel position. "54 nm off Palawan" is not a coordinate, so no marker.
- **"AFP" is ambiguous:** Agence France-Presse (on the named-wire list) vs Armed Forces of the Philippines (a party: CLAIM). Always spell it out.
- **Both sides publish their own video.** PCG footage and CCG/PLA statements are each a party CLAIM. Carried by a listed wire, each becomes REPORTED as "per PCG, via Reuters". *Contact* confirmed by both sides = REPORTED; *fault* = DELTA.
- PRC state outlets echo each other (MFA → Xinhua → Global Times → CCTV) and count as one source.
- **Taiwan is out of scope** (considered, see the end).

---

## 2. Eastern DRC (North & South Kivu): `kivu`

**Why now:** Radio Okapi reports AFC/M23 vs FARDC/Wazalendo fighting continuing in Masisi (7 Oct), with Wazalendo claiming recaptured villages (5 Oct, CLAIM). An AU delegation pressed M23 on a ceasefire (7 Oct). CTP tracks the front weekly ([PAID]: reference only, and its maps are never redrawn).
- Radio Okapi, 7 Oct 2026 **[CITE]**: https://www.radiookapi.net/2026/10/07/actualite/securite/poursuite-des-combats-afcm23-fardcwazalendo-masisi ✓
- News24, 7 Oct 2026 **[CITE]**: https://www.news24.com/world/africa/m23-rebels-pressed-on-ceasefire-as-au-delegation-wraps-eastern-congo-mediation-push-20261007-0893 ✓. Terms: https://www.24.com/terms-and-conditions/ ✓ ("You may not, unless with our express consent… use for commercial purposes any Content"), terms verified 07 Oct.
- CTP Congo War Security Review, 25 Sep 2026 **[PAID]**, reference only: https://www.criticalthreats.org/briefs/congo-war-security-review/september-25-2026 ✓

**Map:** Goma (GNS UFI −2043901, UNI −2837365, PPLA, North Kivu) −1.674, 29.229, zoom 7. That covers Masisi to Bukavu (GNS UFI −2041711, UNI −2834574, PPLA, South Kivu, −2.491, 28.843). **East of 70°E: No.**

**Sources: 23 in total. [CITE] 20 · [PAID] 2 · [UNCLEAR] 1 (the last three are in the reference-only section) · [YES] 0**

| Tier | Source | URL | Tag | Terms note (one line) | Terms URL / status |
|---|---|---|---|---|---|
| WIRE | Reuters Africa | https://www.reuters.com/world/africa/ ⊘ | **[CITE]** | Wire copyright; cite and link only | https://www.reuters.com/info-pages/terms-of-use/ ⊘ · **terms not verified** |
| WIRE | Al Jazeera DRC | https://www.aljazeera.com/where/democratic-republic-of-the-congo/ ✓ | **[CITE]** | "personal, non-commercial use" only | https://www.aljazeera.com/terms-and-conditions/ ✓ · terms verified 07 Oct |
| OUTLET | RFI Afrique | https://www.rfi.fr/fr/afrique/ ✓ (**was ⊘; 200 on 07 Oct**) | **[CITE]** | France Médias Monde legal notice: any reproduction or adaptation is forbidden without authorisation | https://www.francemm.com/fr/legal-notice ✓ · terms verified 07 Oct |
| OUTLET | The EastAfrican | https://www.theeastafrican.co.ke/ ✓ | **[CITE]** | "for your own personal and non-commercial benefit only" | https://www.theeastafrican.co.ke/tea/terms-conditions-of-use-4783192 ✓ · terms verified 07 Oct |
| OUTLET | Jeune Afrique | https://www.jeuneafrique.com/ ✓ | **[CITE]** | CGU: commercial exploitation of content forbidden without prior written authorisation | https://www.jeuneafrique.com/cgu-cgv/ ✓ · terms verified 07 Oct |
| STATE/MIL: DRC | Presidency | https://presidence.cd/ ✓ | **[CITE]** | Mentions légales: "Toute utilisation à des fins commerciales… est formellement interdite"; free reproduction with citation only, so cite and link | https://presidence.cd/mentions_legales ✓ · terms verified 07 Oct |
| STATE/MIL: DRC | Prime Minister's office | https://www.primature.gouv.cd/ ✓ (↪ from primature.cd; **URL updated**) | **[CITE]** | Official statements | No terms page found · **terms not verified** |
| STATE/MIL: DRC | FARDC | (no channel verified, so none listed; statements via wires or Radio Okapi only) | n/a | n/a | n/a |
| STATE/MIL: Rwanda | Ministry of Defence (RDF) | https://www.mod.gov.rw/ ✓ | **[CITE]** | Official statements | No terms page found · **terms not verified** |
| STATE/MIL: Rwanda | The New Times (government-aligned; carries spox Yolande Makolo) | https://www.newtimes.co.rw/ ✓ | **[CITE]** | "personal and non-commercial use only"; no reproduction without permission | https://www.newtimes.co.rw/terms-and-conditions ✓ · terms verified 07 Oct |
| CLAIM: AFC/M23 | Spokesperson Lawrence Kanyuka on X, **@LawrenceKanyuka** | https://x.com/LawrenceKanyuka ✓ (title "Lawrence KANYUKA (@LawrenceKanyuka) / X") | **[CITE]** | Named public party channel; always CLAIM. X ToS: no scraping | https://x.com/tos ✓ · terms verified 07 Oct (platform) |
| NEUTRAL | MONUSCO | https://monusco.unmissions.org/ ✓ (↪ /fr) | **[CITE]** | UN terms: "personal, non-commercial use, without any right to resell or redistribute" | https://www.un.org/en/about-us/terms-of-use ✓ · terms verified 07 Oct |
| NEUTRAL | OCHA DRC | https://www.unocha.org/democratic-republic-congo ✓ | **[CITE]** | UN terms (as above) | https://www.un.org/en/about-us/terms-of-use ✓ · terms verified 07 Oct |
| NEUTRAL | ReliefWeb DRC | https://reliefweb.int/country/cod ✓ | **[CITE]** | "personal, non-commercial use"; no redistribution | https://reliefweb.int/terms-conditions ✓ · terms verified 07 Oct |
| NEUTRAL | UNSC 1533 Committee / Group of Experts | https://main.un.org/securitycouncil/en/sanctions/1533 ✓ | **[CITE]** | UN terms (as above) | https://www.un.org/en/about-us/terms-of-use ✓ · terms verified 07 Oct |
| NEUTRAL | Crisis Group DRC | https://www.crisisgroup.org/africa/great-lakes/democratic-republic-congo ✓ | **[CITE]** | Copyright; linking allowed; cite and link | https://www.crisisgroup.org/legal/terms-use ✓ · terms verified 07 Oct |
| NEUTRAL | HRW DRC | https://www.hrw.org/africa/democratic-republic-congo ✓ | **[CITE]** | HRW publications are under a CC licence for "non-commercial use" only, no derivatives. **Cite-only (CoS 7 Oct): state the facts in our own words and link; no copied text, images or maps** | https://www.hrw.org/permissions ✓ · terms verified 07 Oct |
| Local | Radio Okapi (UN-backed; treat as press) | https://www.radiookapi.net/ ✓ | **[CITE]** | Outlet copyright; cite and link | No terms page found · **terms not verified** |
| Local | Actualite.cd | https://actualite.cd/ ✓ | **[CITE]** | Outlet copyright; cite and link | No terms page found · **terms not verified** |
| Local | 7sur7.cd | https://7sur7.cd/ ✓ | **[CITE]** | Outlet copyright; cite and link | No terms page found · **terms not verified** |
| Local | Kigali Today (Rwandan) | https://www.kigalitoday.com/ ✓ | **[CITE]** | Outlet copyright; cite and link | No terms page found (every path returns the home template) · **terms not verified** |

**Paid licence needed; reference only (kivu).** Never ingested; no coordinates copied.
| Source | URL | Tag | Terms note | Terms URL / status |
|---|---|---|---|---|
| ACLED | https://acleddata.com/ ✓ (JS challenge page) | **[PAID]** | Corporate licence required for commercial entities | https://acleddata.com/eula/ · terms verified 07 Oct (WebFetch) |
| CTP Africa File | https://www.criticalthreats.org/analysis/africa-file ✓ | **[PAID]** | Brief quotes with a link allowed; anything else (maps and graphics included) needs permission | https://www.criticalthreats.org/terms ✓ · terms verified 07 Oct |
| Kivu Security Tracker | https://kivusecurity.org/ **✗ DEAD**: the domain returns HTTP 200, but the page is a default WordPress "Hello world!" placeholder (post dated 1 Nov 2025) | **[UNCLEAR]** | **On hold until the Ebuteli move is confirmed.** Radio Okapi (22 Sep 2026) says KST reports now come from Ebuteli; no new URL or terms are listed until that move is confirmed | **terms not verified** |

**Front-map catalog (rule 5).** Catalog only: `data: null` until cleared. Nothing draws.
```ts
// FRONTS catalog (draft, not in repo). commercialUse/licenseCleared per rule 5.
{ id: "kivu-ctp-cwsr", theater: "kivu", name: "CTP Congo War Security Review control maps",
  license: "CTP terms: permission required beyond brief quotes", url: "https://www.criticalthreats.org/terms",
  asOf: "2026-09-25", licenseCleared: false, commercialUse: "paid", data: null },
```
UCDP GED ([YES]) covers events, not control, so it can't support control areas. No approximate M23 areas are drawn.

**GNS gazetteer (rule 2): ambiguity checks, 07 Oct** (*the name + admin-area matching reading is proposed, pending CoS review*)
- **Goma:** 4 GNS populated places named Goma in DRC; only one is in North Kivu (UFI −2043901, PPLA). Pin only when the source puts it in North Kivu (or plainly means the provincial capital). Otherwise drop. (*Proposed, pending CoS review.*)
- **Masisi:** 2 records. North Kivu town UFI −2054038, UNI −2849741, −1.398, 28.818; the other is in Maniema. Headlines usually mean the *territory*, so pin only when the town is named.
- **Kalehe:** 3 records. South Kivu UFI −2045779, UNI −2839694, −2.104, 28.919; two more in North Kivu. Usually means the territory. No pin unless the town and province are clear.
- **Rubaya:** **no GNS record in DRC** (searched `LIKE '%Rubaya%'`). No pin. (Nominatim's first hit is in Rwanda.)
- **Katoyi:** **no GNS record in DRC** (searched `LIKE 'Katoy%'`). No pin.

**Traps**
- **Echo chambers:** Kinshasa-aligned and Kigali/M23-aligned media trade "fake document" accusations. Every document needs a listed-wire or neutral pickup.
- **Wazalendo "recaptures" are self-claims.** Radio Okapi reports them as claims ("revendiquent"), so they stay CLAIM until a wire or MONUSCO confirms.
- **FARDC/M23 statements:** CLAIM on their own; REPORTED as "per FARDC, via Reuters" when a listed wire carries them.
- **Casualty figures** from FARDC, M23 and Wazalendo are always attributed and never summed.
- Live: no `BBOX` covers the Kivus today (the `sudan` box ends at 8°N), so rows fall to `overview`.

---

## 3. Baltic / Belarus NE flank: `baltic`

**Why now:** Latvia says armed masked men from Belarus threatened its soldiers while pushing ~20 migrants across, then crossed and stole border cameras (5–6 Oct). That is REPORTED as "per Latvian NAF, via LSM" (LSM is on the named-wire list; Kyiv Independent is an outlet, so its carriage alone would leave it CLAIM). Lithuania's parliament advanced lifting its constitutional nuclear-weapons ban, and the Kremlin called it a "significant escalation" (6 Oct). Lithuania says it will deploy the military to help guard the Kaliningrad border (LRT, 7 Oct).
- Kyiv Independent, 6–7 Oct 2026 **[CITE]**: https://kyivindependent.com/armed-individuals-from-belarus-threaten-latvian-soldiers-at-border-followed-by-another-breach/ ✓. KI sells content licensing ($399 per article), so cite only: https://kyivindependent.com/assets/files/Syndication_and_Content_Licensing_from_The_Kyiv_Independent.pdf ✓, verified 07 Oct.
- LSM, 7 Oct 2026 **[CITE]**: https://eng.lsm.lv/article/society/defence/07.10.2026-nbs-migrant-group-pushed-aggressively-across-latvian-border-this-week.a666481/ ⊘ to curl; **article read in full via WebFetch, 07 Oct ✓**
- LRT, 6 Oct 2026 **[CITE]**: https://www.lrt.lt/en/news-in-english/19/3074149/lithuanian-parliament-backs-removing-constitutional-ban-on-nuclear-weapons ⊘ to curl (**was ✓**); **read via WebFetch, 07 Oct ✓**

**Map:** Vilnius (GNS UFI −2620663, UNI −3610216, PPLC) 54.679, 25.287, zoom 6. That covers Daugavpils (UFI −3207863, UNI −4540982, PPLA, 55.883, 26.533), Suwałki (UFI −531306, UNI −753441, PPLA2, 54.099, 22.933) and Kaliningrad (UFI −2918852, UNI −4087618, PPLA, RU-KGD, 54.706, 20.511; a variant-name "Kaliningrad" record, UFI −2918853, sits in Moscow Oblast, so check adm1). **East of 70°E: No.**

**Sources: 29 in total. [CITE] 26 · [YES] 1 · [PAID] 2 (in the reference-only section) · [UNCLEAR] 0**

| Tier | Source | URL | Tag | Terms note (one line) | Terms URL / status |
|---|---|---|---|---|---|
| WIRE | Reuters Europe | https://www.reuters.com/world/europe/ ⊘ | **[CITE]** | Wire copyright; cite and link only | https://www.reuters.com/info-pages/terms-of-use/ ⊘ · **terms not verified** |
| WIRE | AP Latvia | https://apnews.com/hub/latvia ✓ | **[CITE]** | AP ToS: no automated access without permission | https://apnews.com/termsofservice ✓ · terms verified 07 Oct |
| WIRE | AP Lithuania | https://apnews.com/hub/lithuania ✓ | **[CITE]** | As above | https://apnews.com/termsofservice ✓ · terms verified 07 Oct |
| WIRE | LSM English | https://eng.lsm.lv/ ⊘ (front page read via WebFetch) | **[CITE]** | Public broadcaster copyright; cite and link | Bot wall; no terms page reached · **terms not verified** |
| WIRE | LRT English | https://www.lrt.lt/en/news-in-english ⊘ (read via WebFetch) | **[CITE]** | Public broadcaster copyright; cite and link | Bot wall · **terms not verified** |
| WIRE | ERR News | https://news.err.ee/ ✓ | **[CITE]** | Public broadcaster copyright; cite and link | No terms page found (/terms ↪ home) · **terms not verified** |
| OUTLET | Notes from Poland | https://notesfrompoland.com/ ✓ | **[CITE]** | "for your own personal and non-commercial use only" | https://notesfrompoland.com/terms-of-use/ ✓ · terms verified 07 Oct |
| OUTLET | Meduza (independent Russian, in exile) | https://meduza.io/en ✓ | **[CITE]** | Outlet copyright; cite and link | No terms page found · **terms not verified** |
| STATE/MIL: LV/LT/PL | Latvia State Border Guard | https://www.rs.gov.lv/en ✓ | **[CITE]** | Official statements; CLAIM unless a listed wire carries them | No terms page found · **terms not verified** |
| STATE/MIL: LV/LT/PL | Latvian National Armed Forces | https://www.mil.lv/en ✓ | **[CITE]** | Official statements | Only a cookie policy found · **terms not verified** |
| STATE/MIL: LV/LT/PL | Lithuania State Border Guard Service | https://vsat.lrv.lt/en ⊘ | **[CITE]** | Official statements | Bot wall · **terms not verified** |
| STATE/MIL: LV/LT/PL | Lithuania MoD | https://kam.lt/en/ ⊘ (live via WebFetch) | **[CITE]** | Official statements | No terms link on the page · **terms not verified** |
| STATE/MIL: LV/LT/PL | Polish Border Guard | https://www.strazgraniczna.pl/ ✓ | **[CITE]** | Official statements | No terms page found · **terms not verified** |
| STATE/MIL: LV/LT/PL | Polish Armed Forces | https://www.wojsko-polskie.pl/ ✓ (JS shell, no content to curl) | **[CITE]** | Official statements | JS shell; no terms reachable · **terms not verified** |
| STATE/MIL: BY/RU | Belarus State Border Committee | https://gpk.gov.by/ ✓ | **[CITE]** | Official statements; one state ecosystem with BelTA/MoD | No terms page found · **terms not verified** |
| STATE/MIL: BY/RU | Belarus MoD | https://www.mil.by/ ✓ (↪ /ru/) | **[CITE]** | Official statements | No terms page found · **terms not verified** |
| STATE/MIL: BY/RU | BelTA | https://eng.belta.by/ ✓ | **[CITE]** | Reproduction allowed with a hyperlink and unaltered text; commercial use not addressed, so cite only | https://eng.belta.by/copyright-en ✓ · terms verified 07 Oct |
| STATE/MIL: BY/RU | Kremlin | http://en.kremlin.ru/ ✓ (http only; https fails TLS) | **[YES]** | "All content on this site is licensed under Creative Commons Attribution 4.0" (excludes RIA/TASS photos). Still a party **CLAIM** for confidence. (*[YES] tag proposed, pending CoS review.*) | http://en.kremlin.ru/about/copyrights ✓ · terms verified 07 Oct |
| STATE/MIL: BY/RU | TASS | https://tass.com/ ✓ | **[CITE]** | "only Non-Commercial Use of the Text Materials… is allowed"; cite and link only | https://tass.com/terms-of-use ✓ · terms verified 07 Oct |
| NEUTRAL | NATO | https://www.nato.int/ ✓ (↪ /en) | **[CITE]** | Official statements | No terms page found (old copyright URL 404) · **terms not verified** |
| NEUTRAL | Frontex | https://www.frontex.europa.eu/ ✓ | **[CITE]** | "For use, reproduction or transmission for purposes other than private use, please request permission" | https://www.frontex.europa.eu/legal-disclaimer/ ✓ · terms verified 07 Oct |
| NEUTRAL | Crisis Group Europe & Central Asia | https://www.crisisgroup.org/europe ✓ (↪ from /europe-central-asia; **URL updated**) | **[CITE]** | Copyright; linking allowed | https://www.crisisgroup.org/legal/terms-use ✓ · terms verified 07 Oct |
| WIRE (local-language) | LSM (Latvian) | https://www.lsm.lv/ ⊘ | **[CITE]** | Public broadcaster copyright | Bot wall · **terms not verified** |
| Local-language | Delfi.lt | https://www.delfi.lt/ ✓ | **[CITE]** | Content for personal, non-commercial use only (LT terms) | https://www.delfi.lt/apie/taisykles/ ✓ · terms verified 07 Oct |
| Local-language | TVN24 (Polish) | https://tvn24.pl/ ✓ | **[CITE]** | Outlet copyright | The only "Regulamin" found is an account-terms PDF, which was not read · **terms not verified** |
| Local-language | Zerkalo (independent Belarusian) | https://news.zerkalo.io/ ✓ | **[CITE]** | Outlet copyright | No terms page found · **terms not verified** |
| Local-language | Nasha Niva | https://nashaniva.com/ ✓ | **[CITE]** | Outlet copyright | No terms page found · **terms not verified** |

**Paid licence needed; reference only (baltic).**
| Source | URL | Tag | Terms note | Terms URL / status |
|---|---|---|---|---|
| ISW | https://www.understandingwar.org/ ⊘ | **[PAID]** (keeping the tag while terms are unverified is *proposed, pending CoS review*) | Written permission for commercial use (paraphrase) | https://understandingwar.org/fair-use-and-attribution-policy/ ⊘ · **terms not verified** |
| ACLED | https://acleddata.com/ ✓ | **[PAID]** | Corporate licence required | https://acleddata.com/eula/ · terms verified 07 Oct |

**Front-map catalog (rule 5):** none. There are no front lines here and no approximate areas are drawn.

**Traps**
- **Hybrid incidents are the norm.** Migrant pushes, balloons, GPS jamming and drone sightings are usually one government's statement with no named culprit. REPORTED only when a listed wire carries it ("per Latvian NAF, via LSM"; LSM, LRT and ERR are on the list); otherwise CLAIM. Don't attribute to "Russia" or "Belarus" unless the source does, and then name who said it.
- **Rhetoric is not an event.** Kremlin warnings and Lithuanian votes go in `watch[]`, not as markers. LRT (6 Oct, read in full) gives the second Seimas vote as 12 Jan.
- Russian/Belarusian state media echo each other (BelTA/GPK/MoD = one; TASS/Kremlin = one). Kaliningrad "exercises" announced by the MoD stay CLAIM until NATO or a wire reports them.
- **Gazetteer:** label in English; town-level only, so no border-post or unit coordinates. Check adm1 for Kaliningrad (see Map).
- **Live BBOX overlap:** the `ukraine` box (44–53.5N, 22–42E) is first-match and will tag southern Belarus/NE Poland rows as Ukraine. A `baltic` box needs ordering care.

---

## 4. Mali / Central Sahel: `sahel`

**Why now:** Mali's army re-entered Kidal on 6 Oct after the FLA's "controlled withdrawal" under Africa Corps-backed airstrikes, which invites a JNIM/FLA response. Sources say more than 100 soldiers were killed at Dioura on 10 Sep, and Sévaré airport was attacked. The JNIM fuel blockade on Bamako is a year old, with a convoy attack on 2 Sep.
- Reuters via CNBC Africa, 6 Oct 2026 **[CITE]**: https://www.cnbcafrica.com/2026/mali-separatists-announce-withdrawal-from-strategic-northern-mali-town ✓. CNBC Africa terms: https://www.cnbcafrica.com/privacy-policy-terms-of-use/ ✓ (IP "may not be copied, downloaded or otherwise exploited without the permission of ABN"), verified 07 Oct.
- Al Jazeera, 6 Oct 2026 **[CITE]**: https://www.aljazeera.com/news/2026/10/6/tuareg-rebels-withdraw-from-strategic-town-of-kidal-in-northern-mali ✓
- Reuters, 21 Sep 2026 **[CITE]**: https://www.reuters.com/world/africa/al-qaeda-linked-militants-kill-more-than-100-malian-soldiers-attack-this-month-2026-09-21/ ⊘ (401; not verifiable)

**Map:** Mopti town (GNS UFI −1071966, UNI −1590941, PPLA) 14.490, −4.192, zoom 5. That covers Bamako (UFI −1064708, UNI −1580810, PPLC, 12.609, −7.975) to Kidal (UFI −1070022, UNI −1588341, PPLA, 18.443, 1.409). The old center was a Nominatim *region* centroid and has been replaced. **East of 70°E: No.**

**Sources: 17 in total. [CITE] 13 · [PAID] 2 · [UNCLEAR] 2 (the last four are in the reference-only section) · [YES] 0**

| Tier | Source | URL | Tag | Terms note (one line) | Terms URL / status |
|---|---|---|---|---|---|
| WIRE | Reuters Africa | https://www.reuters.com/world/africa/ ⊘ | **[CITE]** | Wire copyright; cite and link only | https://www.reuters.com/info-pages/terms-of-use/ ⊘ · **terms not verified** |
| WIRE | AP Mali | https://apnews.com/hub/mali ✓ | **[CITE]** | AP ToS: no automated access without permission | https://apnews.com/termsofservice ✓ · terms verified 07 Oct |
| WIRE | Al Jazeera Mali | https://www.aljazeera.com/where/mali/ ✓ | **[CITE]** | "personal, non-commercial use" only | https://www.aljazeera.com/terms-and-conditions/ ✓ · terms verified 07 Oct |
| OUTLET | RFI Afrique | https://www.rfi.fr/fr/afrique/ ✓ (**was ⊘**) | **[CITE]** | France Médias Monde: reproduction forbidden without authorisation | https://www.francemm.com/fr/legal-notice ✓ · terms verified 07 Oct |
| OUTLET | Jeune Afrique | https://www.jeuneafrique.com/ ✓ | **[CITE]** | Commercial exploitation forbidden without written authorisation | https://www.jeuneafrique.com/cgu-cgv/ ✓ · terms verified 07 Oct |
| STATE/MIL: Mali | FAMa (armed forces) | https://fama.ml/ ✓ | **[CITE]** | Official claims; always CLAIM unless a listed wire carries them | https://fama.ml/terms is a placeholder ("It is a long established fact…" template text) · **terms not verified** |
| STATE/MIL: Mali | Government communiqués via ORTM | https://www.ortm.ml/ ⊘ (Cloudflare to curl and WebFetch) | **[CITE]** | State broadcaster | Bot wall · **terms not verified** |
| CLAIM: armed groups | JNIM statements **only as quoted by Reuters/AP (citing SITE Intelligence)**; FLA statements via wires; Africa Corps/Russian-media claims | (no direct links) | **[CITE]** | Cite the wire that quotes them, always as CLAIM. SITE itself is a subscription service, never accessed directly; its terms are **not verified** | via the wire's terms (above) |
| NEUTRAL | OCHA Mali | https://www.unocha.org/mali ✓ | **[CITE]** | UN terms: personal, non-commercial; no redistribution | https://www.un.org/en/about-us/terms-of-use ✓ · terms verified 07 Oct |
| NEUTRAL | ReliefWeb Mali | https://reliefweb.int/country/mli ✓ | **[CITE]** | "personal, non-commercial use" | https://reliefweb.int/terms-conditions ✓ · terms verified 07 Oct |
| NEUTRAL | Crisis Group Mali | https://www.crisisgroup.org/africa/sahel/mali ✓ | **[CITE]** | Copyright; linking allowed | https://www.crisisgroup.org/legal/terms-use ✓ · terms verified 07 Oct |
| Local | Studio Tamani (independent; 5 languages) | https://www.studiotamani.org/ ✓ | **[CITE]** | Fondation Hirondelle: no reproduction or commercial exploitation "sans l'accord préalable et écrit" | https://www.studiotamani.org/mentions-legales ✓ · terms verified 07 Oct |
| Local | Maliweb (aggregator: trace items to their origin) | https://www.maliweb.net/ ✓ | **[CITE]** | Outlet copyright; never a source in its own right | No terms page found · **terms not verified** |

**Paid licence needed; reference only (sahel).**
| Source | URL | Tag | Terms note | Terms URL / status |
|---|---|---|---|---|
| ACLED | https://acleddata.com/ ✓ | **[PAID]** | Corporate licence required | https://acleddata.com/eula/ · terms verified 07 Oct |
| CTP Africa File | https://www.criticalthreats.org/analysis/africa-file ✓ | **[PAID]** | Permission needed beyond brief quotes | https://www.criticalthreats.org/terms ✓ · terms verified 07 Oct |
| Bellingcat (documented tanker losses) | https://www.bellingcat.com/ ✓ | **[UNCLEAR]** | No site-wide terms or content licence found (/terms-and-conditions, /terms-of-use 404) | **terms not verified** |
| MENASTREAM on X, **@MENASTREAM** | https://x.com/MENASTREAM ✓ (title "MENASTREAM (@MENASTREAM) / X") | **[UNCLEAR]** | A private consultancy's account (neither open press nor an official channel). **Reference-only lead (CoS 7 Oct): it can tip us off, but nothing ships on it alone, and nothing it says moves above CLAIM unless a wire on the named-wire list or an official source confirms it.** | Platform terms only: https://x.com/tos ✓ · account terms **not verified** |

**Front-map catalog (rule 5).** Catalog only: `data: null`.
```ts
{ id: "sahel-ctp-africafile", theater: "sahel", name: "CTP Africa File maps (Sahel)",
  license: "CTP terms: permission required beyond brief quotes", url: "https://www.criticalthreats.org/terms",
  asOf: "2026-10-07", licenseCleared: false, commercialUse: "paid", data: null },
```
No approximate JNIM/FLA/FAMa control areas are drawn.

**GNS gazetteer (rule 2): ambiguity checks, 07 Oct** (*the name + admin-area matching reading is proposed, pending CoS review*)
- **Kidal:** one GNS populated place (UFI −1070022, PPLA). Pin the town only. (Nominatim returned the region first.)
- **Kati:** 3 records. The garrison town in Koulikoro is UFI −1069754, UNI −1587972, PPLA2, 12.741, −8.068; the other two are in Tombouctou (ML-6). Pin only when the source means the Koulikoro town.
- **Dioura:** 2 records. Mopti-region town UFI −1066670, UNI −1583444, 14.825, −5.255 (approved name); the other is a variant-name record at 14.300, −9.850. Check adm1.
- **Sévaré:** UFI −1074033, UNI −1593907, PPL, 14.530, −4.092. **Sévaré airport:** if the event was at the airport, pin the GNS town and add a caveat to the fact text ("pin at town; airport is outside town"). The distance is **not measured here**; measure it from a [YES] source before writing "~N km".
- **Mopti** (UFI −1071966, PPLA) and **Ségou** (UFI −1073839, UNI −1593637, PPLA, 13.434, −6.263): one P record each.

**Traps**
- **Information blackout:** RFI and France 24 have been suspended inside Mali since 2022, and local media work under junta pressure. FAMa "terrorists neutralized" counts are CLAIM, and so are JNIM claims. Expect long DELTA periods.
- **Recycled video:** footage from the 2023 Kidal takeover and the April 2026 attacks recirculates. Check original upload dates.
- **Blockade incidents are on roads** ("Kayes–Bamako axis", "between Fana and Ségou"). No coordinate means no marker, unless a town is named and resolves uniquely in GNS.
- **Africa Corps airstrikes:** REPORTED only as "per <party>, via <listed wire>"; no arrows unless the source names launch and target.
- Live: `AOR` in `fetch_live.py` has no Sahel token, so a `mali` token and a `BBOX` are needed.

---

## Considered, not chosen
- **Taiwan Strait:** a Taiwan MND-reported PLA "joint combat readiness patrol" on 6 Oct (https://www.mnd.gov.tw/en/ ✓ intermittently: timed out once, 200 on re-try; **[CITE]**; **terms not verified**) is routine-pattern pressure rather than an escalation trend. It's also east of 70°E. Re-check if large named drills are announced.
- **Caribbean (US boat strikes):** SOUTHCOM strikes continue (Reuters/Al Jazeera, 5 Oct), but the pattern is steady, not escalating, and the casualty claims are single-source (SOUTHCOM: CLAIM unless a listed wire carries them).
- **Ethiopia–Eritrea:** the strongest candidate (CrisisWatch Oct 2026 Conflict Risk Alerts for both), but excluded because it is being built separately. Gazetteer note for that team: Nominatim's first hit for `Edaga Hamus` is an **Asmara square**, not the Tigray town. Resolve it in GNS and check adm1 (the OSM coordinates have been removed from this note).
