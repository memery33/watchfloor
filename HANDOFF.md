# Watchfloor — handoff (updated 2026-09-24)

Unclassified OSINT common operating picture for following several wars at once. Not targeting. Not radar.

## Status
- **Live:** https://memery33.github.io/watchfloor/
- **Repo:** https://github.com/memery33/watchfloor (`main`)
- **Version:** 0.1.0 (Vite + TypeScript + Leaflet)
- **Meetup:** see `MEETUP-HANDOFF-2026-09-24.md` (Tuesday ~2026-09-30 demo path)

## Fixed 2026-09-24 — Pages lag
`live.yml` commits with `GITHUB_TOKEN` do **not** re-trigger `pages.yml` `on.push`. Overlay was advancing on `main` while Pages stayed on ~Sep 21.

Fix: hourly schedule on Pages (`cron: "25 * * * *"`) plus manual `workflow_dispatch`. Verified live.json `generated_at` same-day on Pages after dispatch + schedule commit `878e46c`.

## Ops
- Local: `npm install` · `python3 scripts/fetch_live.py` · `npm run dev`
- `live.yml` — hourly GDELT overlay (~:20)
- `pages.yml` — push to `main` **and** hourly `:25` **and** `workflow_dispatch`
- Manual: Actions → GitHub Pages → Run workflow on `main`

## Product surface
- Theaters (1–7): Overview, Iran/Gulf, Levant, Ukraine, Sudan, Energy/Sea, AFPAK
- Curated sitrep (`src/sitrep.ts`) + live GDELT overlay (`public/data/live.json`) + tracks (`src/tracks.ts`)
- Confidence chips; map-primacy UI polish live

## Confidence (non-negotiable)
CONFIRMED / REPORTED / CLAIM / DELTA / HOLD — yellow stays yellow until named corroboration. No coord → no marker. No origin+impact → no arc. Never invent coords/status. No classified/FOUO.

## Standing order (Michael 2026-09-20)
Ship vetted CLAIM+ tips to live without asking “ship?”; alert him in chat. Mac-free via GitHub.

## Pod (Grok Bot)
Sitrep · Live · COP · Ship · CoS (approval gates). Claude Code/Cowork for deep implementation.

## Never without Michael's yes
Contact people, spend money, change confidence rules, leave open OSINT for new private sources.
