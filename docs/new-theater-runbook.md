# Runbook: adding a new theater

Use this when a new conflict needs its own map slot. You should be able to go from nothing to live in under an hour without making anything up. Every step that publishes something needs a yes from Michael or Chief of Staff.

## 0. Before you start
- Use public sources only: no classified material, nothing marked FOUO (For Official Use Only), and no private Telegram dumps.
- Confidence tags follow the existing rules. A claim stays yellow until a named source corroborates it.
- A place without coordinates gets no marker.

## 1. Stage the theater (Sitrep and COP)
1. Copy `src/theater.template.ts` to `src/sitrep.<id>.ts`, for example `sitrep.ethiopia.ts`, and rename the exported const and its `id`.
2. Fill in the events, markers, and KPIs from named sources. Set the theater's SNAPSHOT DTG (date-time group), which is the time the snapshot was taken.
3. Leave the id out of `THEATER_ORDER` for now. A file that isn't listed there stays hidden, so it can sit on main safely.

## 2. Turn on the live layer for the region (Live, optional)
1. The region preset in `scripts/fetch_live.py` is off by default. One environment variable turns it on.
2. Before you flip it, do a dry run on real GDELT data with the old and new settings. Confirm the only new rows fall inside the new region, then send the diff to Chief of Staff.

## 3. Check it locally
- `npm ci && npm run build` must pass.
- `npm run preview`: the new theater shows up in the rail with the right number key, the legend still shows every tag, and no marker is missing its coordinates.

## 4. Go live (after a yes from Michael or Chief of Staff)
1. Add the id to `THEATER_ORDER` in `src/sitrep.ts`. If you need a live-layer switch, put it in the same change.
2. Land it as one commit on main. A push to main triggers the `GitHub Pages` workflow (`.github/workflows/pages.yml`). That workflow fetches the live overlay fresh before it builds.

## 5. Verify
- The `GitHub Pages` run for that commit shows **success** under the repo's Actions tab.
- Load https://memery33.github.io/watchfloor/?v=<timestamp> and confirm all of these:
  - The new theater is in the rail.
  - Its number key works.
  - The legend stamp reads `GDELT claims: N · refreshed <time>`.
  - The page has no console errors.
- Retake the README screenshot (`docs/watchfloor.png`) only if the rail or legend changed noticeably.

## 6. Roll back
- To hide the theater, remove its id from `THEATER_ORDER` and push. The data file can stay.
- If the build breaks, revert the commit. The revert push rebuilds Pages from the last good code, and until it does, the site keeps serving the previous deploy.

## Known limits
- GitHub's scheduled runs are best-effort. The hourly live Action and the scheduled Pages rebuild can be skipped for hours. When a refresh actually changes `live.json`, the live workflow asks Pages to rebuild, and any push to main also rebuilds the site.
- The site is public, and so is the repo. Treat every commit as published.
