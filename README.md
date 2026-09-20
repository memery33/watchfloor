# Watchfloor

Unclassified **OSINT common operating picture** for following several wars at once.

Live demo: **https://memery33.github.io/watchfloor/**

Not a targeting product. Not radar. Competing claims stay on the board in **yellow** until a verified source promotes them. Dashed arcs are reconstructed from a named origin and a named impact — the same method OSINT desks use on Ukraine maps, not a live weapon track.

## What a client gets

A watch-floor, not a news site:

- Theaters: Overview, Iran/Gulf, Levant, Ukraine, Sudan, Energy/Sea (`1–6`)
- Dark English basemap (Esri)
- Curated sitrep stack with source class + confidence
- Live GDELT overlay: strike/shelling/blockade in the AOR only, all tagged `CLAIM`
- Reconstructed missile/drone vectors when both ends are named
- Legend: red confirmed · amber reported · yellow claim · cyan disputed

## Confidence (non-negotiable)

| Tag | Color | Meaning |
| --- | --- | --- |
| CONFIRMED | red | Named, corroborated, still not a targeting quality |
| REPORTED | amber | Open press / official, not independently verified here |
| CLAIM | yellow | State, militant, or GDELT NLP. Displayed, not trusted |
| DELTA | cyan | Two sources contradict |
| HOLD | green | Wait |

No coord, no marker. No origin+impact, no arc.

## Data

- Curated snapshot: `src/sitrep.ts` (locked DTG in the file)
- Live overlay: `public/data/live.json` via `scripts/fetch_live.py` (GDELT 2.0, AOR filter)
- Reconstructed tracks: `src/tracks.ts` (hand-curated; do not auto-draw from “POLICE → MOSCOW”)

Hourly GitHub Action refreshes the overlay. GitHub Pages rebuilds on push.

## Run locally

```bash
npm install
python3 scripts/fetch_live.py
npm run dev
```

Keys: `1–6` theaters. `F` fullscreen.

## Public by design

OSINT only. Do not add classified, FOUO, or private Telegram dumps. If you cannot source it, it is a yellow claim or it does not plot.

## Related

Personal GDELT globe (separate, local): `conflict-globe`.
