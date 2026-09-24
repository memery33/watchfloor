# Watchfloor meetup handoff 2026-09-24

Live: https://memery33.github.io/watchfloor/
Repo: https://github.com/memery33/watchfloor

## Fixed 2026-09-24
- Pages lag: live.yml GITHUB_TOKEN pushes do not trigger pages.yml on.push
- Dispatched Pages + added hourly schedule cron 25 * * * * on pages.yml (commit 878e46c)
- Verified live.json generated_at 2026-09-24T13:14Z on Pages (was Sep 21)
- Sitrep SNAPSHOT clock bump to 24 Sep 09:15 ET (events still through 21 Sep)

## Demo (~3 min)
1. Open live URL fullscreen
2. Overview then Ukraine — Kapotnya/Moscow track FROM to TO
3. Confidence chips CLAIM vs REPORTED
4. Narrow viewport 15s mobile
5. Optional: show Sitrep/Live/COP/Ship pod in sidebar

Talk: OSINT COP kept current by CoS + specialists; Telegram tip to ship to Pages; dashed arcs are reconstructed not radar.

## Mon night remaining
- Tip refresh into sitrep (no invented coords)
- Dry-run click path on laptop + phone
- Confirm Pages live.json same-day generated_at Tue AM

## Ops
live.yml :20 hourly overlay. pages.yml :25 hourly + push + workflow_dispatch.
Manual: Actions, GitHub Pages, Run workflow on main.

## Guardrails
No invented coords/status. Yellow until named corroboration. No classified/FOUO. Ship vetted tips without ask; alert Michael.

## Status
Demoable now. Mon tip refresh sharpens Tuesday.
