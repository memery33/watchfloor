# Watchfloor — handoff (updated 2026-09-21)

Unclassified OSINT common operating picture for following several wars at once. Not targeting. Not radar.

## Status
- **Live:** https://memery33.github.io/watchfloor/
- **Repo:** https://github.com/memery33/watchfloor (`main` clean, origin synced)
- **Version:** 0.1.0 (Vite + TypeScript + Leaflet)
- **Stack:** vanilla TypeScript, Leaflet, Esri dark basemap. No React/MapLibre migration has happened — a full rewrite was drafted in a cloud session on 2026-09-20 but never pushed and no longer exists anywhere; treat it as a clean-slate idea, not WIP.

## UI polish — DONE (2026-09-20/21, two commits: "UI polish: map primacy, mobile, strike origin labels" and "UI polish pass 2: mobile map primacy, legend, endpoint labels")
Already live and verified (npm install + npm run build pass clean, checked against the live site 2026-09-21):
- Sans-serif UI chrome, mono reserved for DTG/tags/ticker/classification, ~13.5px body
- Map-primacy layout: 170px rail, 290px right stack, collapsible stack
- Confidence filter chips (All / Confirmed / Reported / Claim) above the event stack
- Vector paint order: reconstructed tracks render above sitrep + live markers
- Mobile: theater rail collapses to a `<select>` under 980px, no horizontal overflow; legend/HUD collapsed by default on mobile
- Favicon present (inline SVG, no console 404)

Nothing further needed here unless something specific looks off to you.

## Product surface
- Theaters (keys 1–6, plus 7 AFPAK): Overview, Iran/Gulf, Levant, Ukraine, Sudan, Energy/Sea, AFPAK
- Curated sitrep stack (`src/sitrep.ts`) with source class + confidence
- Live GDELT overlay (`public/data/live.json` via `scripts/fetch_live.py`) — all tagged CLAIM
- Reconstructed missile/drone vectors (`src/tracks.ts`) when both ends named
- Airport/seaport reference dots (`src/landmarks.ts`), toggleable
- Legend: red confirmed · amber reported · yellow claim · cyan disputed · green hold

## Confidence (non-negotiable)
| Tag | Meaning |
| --- | --- |
| CONFIRMED | Named, corroborated — still not targeting quality |
| REPORTED | Open press / official, not independently verified here |
| CLAIM | State, militant, or GDELT NLP. Displayed, not trusted |
| DELTA | Two sources contradict |
| HOLD | Wait |

Rules: No coord → no marker. No origin+impact → no arc. Never auto-draw from weak NLP (e.g. "POLICE → MOSCOW").

## Stack / ops
- Local: `npm install` · `python3 scripts/fetch_live.py` · `npm run dev`
- Hourly Actions: `.github/workflows/live.yml` refreshes GDELT overlay (~:20 past hour)
- Pages: `.github/workflows/pages.yml` builds + deploys on push to `main`
- Related (separate, local): `~/conflict-globe` personal GDELT globe

## Public-by-design guardrails
OSINT only. Do not add classified, FOUO, or private Telegram dumps. If you cannot source it → yellow claim or do not plot.

## Never without Michael's yes
Push/publish, merge a PR, add new data sources that leave open OSINT, change confidence rules, contact anyone, spend money.

## Open next actions
1. Business direction is being worked in the Watchfloor Claude Project (`claude/watchfloor-business-brief.md`) — pricing model, wedge theater, editor identity, data licensing, revenue-in-30-days plan.
2. Decide whether Watchfloor stays Pages-only or needs a paid-tier surface (this is what would actually justify a React/MapLibre rebuild — no point doing it for its own sake).
3. Sitrep refresh cadence — who promotes CLAIM → REPORTED/CONFIRMED.

## Pod (Grok Bot)
- Watchfloor Sitrep — curated events, confidence, theaters
- Watchfloor Live — GDELT pipeline + Actions overlay
- Watchfloor COP — map UI, tracks, paint order
- Watchfloor Ship — Pages/CI + public-by-design checks
- Claude Code/Cowork — deep implementation
- CoS — map, briefs, approval gates
