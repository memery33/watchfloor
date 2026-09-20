# Watchfloor

Unclassified open-source **common operating picture** (COP) for following several wars at once.

Not a targeting product. Not live tracks. Competing claims are labeled `CLAIM`, `REPORTED`, `DELTA`, or `HOLD`.

Live GitHub Pages: `https://memery33.github.io/watchfloor/`

## What it is

A dense watch-floor board:

- Left rail: theaters (Overview, Iran/Gulf, Levant, Ukraine, Sudan, Energy/Sea)
- Center: dark basemap + named points
- Right: event stack with source class + confidence
- Bottom ticker

Snapshot data currently locked to **20 Sep 2026 ~08:00 ET** open-source sitrep. Edit `src/sitrep.ts` to refresh.

## Run locally

```bash
npm install
npm run dev
```

Build:

```bash
npm run build
npm run preview
```

## Keys

`1–6` switch theaters. `F` fullscreen.

## Public by design

This is OSINT. Do not add classified, FOUO, or personal data. If a fact is unverified, keep the confidence tag.

## Related

Personal GDELT globe (separate, local): `conflict-globe`.
