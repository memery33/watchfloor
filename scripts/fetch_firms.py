#!/usr/bin/env python3
"""NASA FIRMS VIIRS thermal anomalies -> Watchfloor fires layer (public/data/fires.json).

Every point is a satellite THERMAL ANOMALY, not a confirmed strike. VIIRS 375 m only
(Suomi NPP "N", NOAA-20 "N20", NOAA-21 "N21"); MODIS is never read.

Source (keyless, public, no account): FIRMS Active Fire Data global CSVs, e.g.
  https://firms.modaps.eosdis.nasa.gov/data/active_fire/noaa-21-viirs-c2/csv/J2_VIIRS_C2_Global_7d.csv
(~30 MB per satellite for _7d; FIRMS says they refresh every 60 minutes). NO API key is
used or read anywhere. S-NPP data delivery ends 2026-11-02; each satellite is fetched
independently, so NOAA-20 / NOAA-21 alone still produce a file.

Output matches src/layers.ts FirePayload:
  { generated_at, source (names VIIRS), attribution ("NASA FIRMS" + citation),
    commercial_use: "yes", points: [{ lat, lon, acq, theater, frp?, likely_flare? }] }
plus extra top-level metadata (label, note, counts, ...) that the loader ignores.
lat / lon are NASA's pixel-centre values, never computed or moved.

likely_flare: FIRMS NRT rows carry no static-source flag, so a point is flagged when its
~2 km cell (FIRMS_CELL_DEG, default 0.02 deg) had nominal/high VIIRS detections on
>= FIRMS_PERSIST_DAYS (default 4) distinct UTC days in the 7-day file. Heuristic for gas
flares / industrial heat, not ground truth.

Fail-safe: if every download fails (or exceeds the time budget), the previous fires.json
is kept and the script exits 0, so the Pages build never breaks. Stdlib only.
"""
from __future__ import annotations

import csv
import io
import json
import os
import sys
import time
from collections import Counter, defaultdict
from datetime import datetime, timedelta, timezone
from urllib.request import Request, urlopen

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "public", "data", "fires.json")

LABEL = "thermal anomaly, not confirmed strike"
BASE = "https://firms.modaps.eosdis.nasa.gov/data/active_fire"
# satellite code in the CSV -> (display name, keyless dir, keyless file prefix)
SATELLITES = {
    "N21": ("NOAA-21 VIIRS", "noaa-21-viirs-c2", "J2_VIIRS_C2"),
    "N20": ("NOAA-20 VIIRS", "noaa-20-viirs-c2", "J1_VIIRS_C2"),
    # NOAA/NESDIS: S-NPP data delivery ends 2026-11-02. After that this file will 404 or
    # go stale; per-source failure tolerance + the age cut handle both.
    "N": ("Suomi NPP VIIRS", "suomi-npp-viirs-c2", "SUOMI_VIIRS_C2"),
}
REQUIRED_COLS = {"latitude", "longitude", "acq_date", "acq_time", "satellite", "confidence", "frp"}
# FIRMS VIIRS confidence is low / nominal / high (some outputs abbreviate l / n / h).
CONF_MAP = {"low": "low", "l": "low", "nominal": "nominal", "n": "nominal", "high": "high", "h": "high"}
KEEP_CONF = {"nominal", "high"}  # drop "low" (sun glint / weak anomaly per FIRMS)

# Same boxes and precedence as scripts/fetch_live.py at main 9f0a33d: presets with
# precedence "first" (ethiopia, yemen) before the built-in BBOX, then BBOX in dict order.
# (south, west, north, east). Ids are THEATER_ORDER ids in src/sitrep.ts.
PRESET_FIRST = (
    ("ethiopia", (3.4, 36.0, 12.0, 48.0)),
    ("ethiopia", (12.0, 36.0, 14.9, 42.4)),
    ("yemen", (12.0, 42.6, 17.5, 53.1)),
    ("yemen", (12.0, 53.1, 12.8, 54.6)),
)
BBOX = {
    "levant": (29.0, 32.0, 35.5, 37.5),
    "ukraine": (44.0, 22.0, 53.5, 42.0),
    "sudan": (8.0, 21.5, 23.0, 39.0),
    "iran": (25.5, 47.8, 39.9, 63.5),
    "energy": (12.0, 32.0, 32.0, 62.0),
    "afpak": (29.0, 60.5, 38.5, 75.5),
}

SOURCE = "NASA FIRMS VIIRS 375 m NRT active fire / thermal anomalies (Suomi NPP, NOAA-20, NOAA-21)"
# "NASA FIRMS" + the citation text in FEASIBILITY.md (Ship's register).
ATTRIBUTION = (
    "NASA FIRMS. We acknowledge the use of data from the NASA LANCE Fire Information for "
    "Resource Management System (FIRMS) (https://earthdata.nasa.gov/firms), part of the NASA "
    "Earth Science Data and Information System (ESDIS). VIIRS 375 m NRT active fire products: "
    "VNP14IMGTDL_NRT (doi:10.5067/FIRMS/VIIRS/VNP14IMGT_NRT.002), VJ114IMGTDL_NRT "
    "(doi:10.5067/FIRMS/VIIRS/VJ114IMGT_NRT.002), VJ214IMGTDL_NRT "
    "(doi:10.5067/VIIRS/VJ214IMGTDL_NRT.002). Disclaimer: "
    "https://firms.modaps.eosdis.nasa.gov/download/Readme.txt . Use of NASA data does not "
    "imply NASA endorsement. Points are thermal anomalies, not confirmed strikes."
)
DISCLAIMER_URL = "https://firms.modaps.eosdis.nasa.gov/download/Readme.txt"
NOTE = (
    "Thermal anomaly, not confirmed strike. Satellite 375 m pixel centres, not exact fire "
    "locations. Includes gas flares, industrial heat and agricultural burning. Not a "
    "targeting product. FIRMS: use for tactical decision-making or local-scale conditions "
    "is not advised."
)


def env_float(name: str, default: float, lo: float, hi: float) -> float:
    raw = os.environ.get(name, "").strip()
    try:
        val = float(raw) if raw else default
    except ValueError:
        val = default
    return val if lo <= val <= hi else default


# 36 h window: a 24 h cut sits on the ~23 UTC Gulf night overpass and made counts swing
# between runs minutes apart. 36 h always spans >= 2 passes per satellite.
MAX_AGE_HOURS = env_float("FIRMS_MAX_AGE_HOURS", 36.0, 1.0, 48.0)
CAP_THEATER = int(env_float("FIRMS_CAP_THEATER", 300, 10, 5000))  # CoS 2026-10-07: 300/theater
CAP_TOTAL = int(env_float("FIRMS_CAP_TOTAL", 3000, 100, 20000))  # 8 theaters x 300 stays under this
CELL_DEG = env_float("FIRMS_CELL_DEG", 0.02, 0.005, 0.5)
PERSIST_DAYS = int(env_float("FIRMS_PERSIST_DAYS", 4, 2, 7))
FILE_WINDOW = "7d"  # 7-day files: needed for the likely_flare rule
BUDGET_S = env_float("FIRMS_BUDGET_S", 110.0, 10.0, 600.0)  # total wall time for all downloads
TIMEOUT_S = 45  # per socket operation
UA = "watchfloor-firms/1.0 (+https://memery33.github.io/watchfloor/)"


def log(msg: str) -> None:
    print(f"[{datetime.now(timezone.utc).isoformat(timespec='seconds')}] FIRMS {msg}", flush=True)


def theater_for(lat: float, lon: float) -> str | None:
    for tid, (s, w, n, e) in PRESET_FIRST:
        if s <= lat <= n and w <= lon <= e:
            return tid
    for tid, (s, w, n, e) in BBOX.items():
        if s <= lat <= n and w <= lon <= e:
            return tid
    return None  # outside every theater box -> dropped


def keyless_url(sat: str, window: str = FILE_WINDOW) -> str:
    _, folder, prefix = SATELLITES[sat]
    return f"{BASE}/{folder}/csv/{prefix}_Global_{window}.csv"


def http_get(url: str, deadline: float | None = None) -> str:
    """GET with a hard wall-clock deadline (urlopen's timeout is per socket read only)."""
    req = Request(url, headers={"User-Agent": UA})
    left = TIMEOUT_S if deadline is None else max(1.0, min(TIMEOUT_S, deadline - time.monotonic()))
    chunks: list[bytes] = []
    with urlopen(req, timeout=left) as resp:
        while True:
            if deadline is not None and time.monotonic() > deadline:
                raise TimeoutError("time budget exhausted mid-download")
            buf = resp.read(1 << 20)
            if not buf:
                break
            chunks.append(buf)
    return b"".join(chunks).decode("utf-8", "replace")


def parse_csv(text: str) -> list[dict]:
    reader = csv.DictReader(io.StringIO(text))
    cols = {c.strip().lower() for c in (reader.fieldnames or [])}
    missing = REQUIRED_COLS - cols
    if missing:
        raise ValueError(f"CSV missing columns {sorted(missing)}")
    return [{(k or "").strip().lower(): (v or "").strip() for k, v in row.items()} for row in reader]


def acq_datetime(row: dict) -> datetime | None:
    try:
        hhmm = row["acq_time"].zfill(4)
        return datetime.strptime(f"{row['acq_date']} {hhmm}", "%Y-%m-%d %H%M").replace(tzinfo=timezone.utc)
    except (KeyError, ValueError):
        return None


def normalize(row: dict, now: datetime, max_age_h: float = MAX_AGE_HOURS, keep_old: bool = False) -> dict | None:
    """Clean internal point or None. keep_old=True keeps rows past the age cut (for likely_flare)."""
    sat = row.get("satellite", "").upper()
    if sat not in SATELLITES:  # VIIRS only: MODIS "Terra"/"Aqua"/"T"/"A" and anything else dropped
        return None
    conf = CONF_MAP.get(row.get("confidence", "").lower())
    if conf not in KEEP_CONF:
        return None
    try:
        lat = float(row["latitude"])
        lon = float(row["longitude"])
    except (KeyError, ValueError):
        return None  # no coordinates -> no marker
    if not (-90 <= lat <= 90 and -180 <= lon <= 180) or (lat == 0 and lon == 0) or lat != lat or lon != lon:
        return None
    theater = theater_for(lat, lon)
    if theater is None:
        return None
    dt = acq_datetime(row)
    if dt is None or dt > now + timedelta(minutes=30):
        return None
    if not keep_old and now - dt > timedelta(hours=max_age_h):
        return None
    try:
        frp = float(row.get("frp") or "nan")
    except ValueError:
        frp = float("nan")
    p = {
        "lat": lat,  # NASA pixel centre as published
        "lon": lon,
        "acq": dt.strftime("%Y-%m-%dT%H:%MZ"),
        "theater": theater,
    }
    if frp == frp and frp >= 0:
        p["frp"] = round(frp, 1)
    p["_sat"] = sat
    return p


def cell(lat: float, lon: float, deg: float = CELL_DEG) -> tuple[int, int]:
    return (int((lat + 90) // deg), int((lon + 180) // deg))


def persistent_cells(points: list[dict], min_days: int = PERSIST_DAYS, deg: float = CELL_DEG) -> set:
    days: dict[tuple[int, int], set] = defaultdict(set)
    for p in points:
        days[cell(p["lat"], p["lon"], deg)].add(p["acq"][:10])
    return {c for c, d in days.items() if len(d) >= min_days}


def select(points: list[dict], cap_theater: int = CAP_THEATER, cap_total: int = CAP_TOTAL) -> list[dict]:
    """Same order as the map (src/main.ts): non-flare first, then newest. Per-theater cap,
    then a round-robin global cap so one busy theater cannot crowd out the rest."""
    ordered = sorted(points, key=lambda p: p["acq"], reverse=True)
    ordered = sorted(ordered, key=lambda p: bool(p.get("likely_flare")))
    per: Counter = Counter()
    out: list[dict] = []
    for p in ordered:
        if per[p["theater"]] >= cap_theater:
            continue
        per[p["theater"]] += 1
        out.append(p)
    if len(out) > cap_total:
        by_t: dict[str, list[dict]] = defaultdict(list)
        for p in out:
            by_t[p["theater"]].append(p)
        trimmed: list[dict] = []
        while len(trimmed) < cap_total and any(by_t.values()):
            for t in list(by_t):
                if by_t[t] and len(trimmed) < cap_total:
                    trimmed.append(by_t[t].pop(0))
        out = trimmed
    return out


def fetch_all(now: datetime, getter=None, deadline: float | None = None) -> tuple[list[dict], list[str]]:
    """Returns (points incl. older ones for the flare rule, ok satellite codes). Raises if nothing worked."""
    getter = getter or (lambda url: http_get(url, deadline))
    rows_by_sat: dict[str, list[dict]] = {}
    for sat in SATELLITES:
        url = keyless_url(sat)
        if deadline is not None and time.monotonic() > deadline:
            log(f"{sat}: skipped (time budget exhausted)")
            continue
        try:
            rows_by_sat[sat] = parse_csv(getter(url))
            log(f"{sat}: {len(rows_by_sat[sat])} rows from {url}")
        except Exception as exc:  # noqa: BLE001
            log(f"{sat}: fetch failed ({type(exc).__name__}: {exc})")
    if not rows_by_sat:
        raise RuntimeError("all FIRMS VIIRS files failed")
    if sum(len(v) for v in rows_by_sat.values()) == 0:
        raise RuntimeError("FIRMS returned only empty files; treating as outage")
    points = [p for rows in rows_by_sat.values() for r in rows if (p := normalize(r, now, keep_old=True))]
    return points, [s for s in SATELLITES if s in rows_by_sat]


def build_payload(all_points: list[dict], ok: list[str], now: datetime) -> dict:
    persist = persistent_cells(all_points)
    recent = []
    for p in all_points:
        dt = datetime.strptime(p["acq"], "%Y-%m-%dT%H:%MZ").replace(tzinfo=timezone.utc)
        if now - dt <= timedelta(hours=MAX_AGE_HOURS):
            q = {k: v for k, v in p.items() if not k.startswith("_")}
            if cell(p["lat"], p["lon"]) in persist:
                q["likely_flare"] = True
            recent.append(q)
    chosen = select(recent)
    counts = Counter(p["theater"] for p in chosen)
    return {
        "generated_at": now.strftime("%Y-%m-%dT%H:%M:%SZ"),
        "source": SOURCE,
        "attribution": ATTRIBUTION,
        "commercial_use": "yes",
        "label": LABEL,
        "note": NOTE,
        "license": "NASA ESDIS open data (CC0 unless marked); citation requested; no NASA endorsement implied",
        "disclaimer_url": DISCLAIMER_URL,
        "satellites_ok": [SATELLITES[s][0] for s in ok],
        "window_hours": MAX_AGE_HOURS,
        "likely_flare_rule": f"~2 km cell ({CELL_DEG} deg) with VIIRS detections on >= {PERSIST_DAYS} of last 7 UTC days",
        "caps": {"per_theater": CAP_THEATER, "total": CAP_TOTAL},
        "counts": {
            "eligible_before_cap": len(recent),
            "published": len(chosen),
            "likely_flare": sum(1 for p in chosen if p.get("likely_flare")),
            "by_theater": dict(sorted(counts.items())),
        },
        "points": chosen,
    }


def write_atomic(payload: dict, path: str = OUT) -> None:
    os.makedirs(os.path.dirname(path), exist_ok=True)
    tmp = path + ".tmp"
    with open(tmp, "w", encoding="utf-8") as fh:
        json.dump(payload, fh, separators=(",", ":"))
        fh.write("\n")
    os.replace(tmp, path)


def main(out: str = OUT, getter=None, now: datetime | None = None) -> int:
    t0 = time.monotonic()
    now = now or datetime.now(timezone.utc)
    try:
        points, ok = fetch_all(now, getter, deadline=t0 + BUDGET_S)
        payload = build_payload(points, ok, now)
    except Exception as exc:  # noqa: BLE001
        log(f"failed: {exc}")
        if os.path.exists(out):
            log(f"keeping previous {out} ({time.monotonic() - t0:.1f}s)")
        else:
            log("no previous fires.json; nothing written")
        return 0  # fail safe: never break the Pages build over an optional layer
    write_atomic(payload, out)
    c = payload["counts"]
    log(f"wrote {c['published']} points, likely_flare {c['likely_flare']}, by_theater {c['by_theater']}, "
        f"satellites {payload['satellites_ok']} to {out} in {time.monotonic() - t0:.1f}s")
    return 0


if __name__ == "__main__":
    sys.exit(main(out=os.environ.get("FIRMS_OUT", OUT)))
