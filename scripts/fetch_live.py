#!/usr/bin/env python3
"""Pull recent GDELT strike/shelling rows into Watchfloor's live overlay.

GDELT is NLP, not radar. Every row is tagged CLAIM until a curator promotes it.
Origin arcs are inferred only from a tiny actor gazetteer (Houthi, Hezbollah, Hamas).
"""
from __future__ import annotations

import csv
import io
import json
import os
import time
import zipfile
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timedelta, timezone
from urllib.error import HTTPError
from urllib.request import urlopen

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "public", "data", "live.json")
FALLBACK = os.path.expanduser(
    "~/conflict-globe/public/data/events.json"
)
LASTUPDATE = "http://data.gdeltproject.org/gdeltv2/lastupdate.txt"
# Read the last WINDOW_HOURS of 15-minute exports (newest = the one lastupdate.txt
# names), not just the newest file, so one quiet slice can't publish an empty
# overlay. 0.25 = newest file only (the pre-window behavior). Override per run with
# env WATCHFLOOR_WINDOW_HOURS. The 3-day date filter, CLAIM tagging, presets and
# the 250 cap are unchanged.
WINDOW_HOURS_DEFAULT = 6.0
WINDOW_HOURS_MAX = 72.0
EXPORT_STEP = timedelta(minutes=15)
FETCH_WORKERS = 4
RETRY_DELAY_S = 2.0
FETCH_BUDGET_S = 120.0  # no new attempts after this; caps a GDELT hang in Actions

CODE_TYPE = {
    "191": "blockade",
    "194": "shelling",
    "195": "strike",
}
AOR = (
    "iran",
    "israel",
    "lebanon",
    "syria",
    "iraq",
    "saudi arabia",
    "yemen",
    "united arab emirates",
    "oman",
    "qatar",
    "kuwait",
    "bahrain",
    "ukraine",
    "russia",
    "sudan",
    "ethiopia",
    "pakistan",
    "afghanistan",
    "west bank",
    "palestine",
    "gaza",
)
NOISE = {
    "POLICE",
    "DISTRICT COURT",
    "COURT",
    "UN SECURITY COUNCIL",
    "AUTHORITIES",
    "ITALIAN",
    "KINGDOM",
}
# If the toponym is this place, coords must be near here or the row is junk.
PLACE_CHECK = (
    ("sheremetyevo", 55.972, 37.415, 2.5),
    ("moscow", 55.75, 37.62, 4.0),
    ("kyiv", 50.45, 30.52, 3.0),
    ("kiev", 50.45, 30.52, 3.0),
    ("riyadh", 24.71, 46.68, 2.5),
    ("tehran", 35.69, 51.39, 2.5),
)
ORIGINS = (
    (("HOUTHI", "YEMEN", "YEMENI"), "YEMEN / HOUTHI", 16.85, 43.58),
    (("HEZBOLLAH",), "S. LEBANON", 33.27, 35.21),
    (("HAMAS",), "GAZA", 31.50, 34.47),
)
BBOX = {
    "levant": (29.0, 32.0, 35.5, 37.5),
    "ukraine": (44.0, 22.0, 53.5, 42.0),
    "sudan": (8.0, 21.5, 23.0, 39.0),
    "iran": (25.5, 47.8, 39.9, 63.5),
    "energy": (12.0, 32.0, 32.0, 62.0),
    "afpak": (29.0, 60.5, 38.5, 75.5),
}


def log(msg: str) -> None:
    print(f"[{datetime.now(timezone.utc).isoformat()}] {msg}", flush=True)


def in_aor(text: str) -> bool:
    n = (text or "").lower()
    return any(token in n for token in AOR)


def theater_for(lat: float, lon: float) -> str:
    # Order: precedence="first" presets, built-in BBOX (dict order), then
    # precedence="last" presets. Both preset lists are empty unless enabled.
    for tid, (south, west, north, east) in _PRESET_FIRST:
        if south <= lat <= north and west <= lon <= east:
            return tid
    for tid, (south, west, north, east) in BBOX.items():
        if south <= lat <= north and west <= lon <= east:
            return tid
    for tid, (south, west, north, east) in _PRESET_LAST:
        if south <= lat <= north and west <= lon <= east:
            return tid
    return "overview"


GENERIC = {
    "russia",
    "iran",
    "iraq",
    "yemen",
    "israel",
    "ukraine",
    "sudan",
    "syria",
    "lebanon",
    "saudi arabia",
}
CENTROIDS = {
    (60.0, 100.0),
    (32.0, 53.0),
    (33.0, 44.0),
    (15.5, 47.5),
}


def coords_match_place(location: str, lat: float, lon: float) -> bool:
    loc = (location or "").split(",")[0].strip().lower()
    if loc in GENERIC:
        return False
    if (round(lat, 1), round(lon, 1)) in CENTROIDS:
        return False
    # [LON70-FIX] Was: drop every row with lon > 70 (meant to kill junk far-east
    # geocodes such as Khabarovsk). That also silently dropped eastern Pakistan
    # (Islamabad ~73E, Lahore ~74E) inside the afpak BBOX (60.5-75.5E). Keep the
    # far-east drop, but allow lon > 70 when the point is inside a theater BBOX.
    if lon > 70 and theater_for(lat, lon) == "overview":
        return False
    for name, elat, elon, maxd in PLACE_CHECK:
        if name in loc and (abs(lat - elat) + abs(lon - elon) > maxd * 2):
            return False
    return True


def infer_origin(actor1: str, actor2: str, lat: float, lon: float) -> dict | None:
    blob = f"{actor1} {actor2}".upper()
    for keys, label, olat, olon in ORIGINS:
        if any(key in blob for key in keys):
            if abs(olat - lat) + abs(olon - lon) < 1.5:
                return None
            return {"name": label, "lat": olat, "lon": olon, "inferred": True}
    return None


# ---------------------------------------------------------------------------
# REGION PRESETS. "sudan", "ethiopia" and "yemen" ship enabled (sudan refines the
# built-in sudan theater; ethiopia/yemen own their theaters). Every other preset is
# enabled=False; a disabled preset adds no tokens, boxes, checks, or noise.
#
# Turn a region on with ONE switch, either:
#   1. env var (comma list of preset ids), e.g.  WATCHFLOOR_PRESETS="yemen,sudan"
#      (must be set for BOTH .github/workflows/live.yml and pages.yml, or the
#      committed live.json and the deployed build will disagree), or
#   2. flip "enabled": False -> True on the preset below and commit.
# Either one activates the preset; the union of both is applied at import time.
#
# Fields:
#   id           switch name (used in WATCHFLOOR_PRESETS)
#   label        human label
#   enabled      default False
#   aor          lowercase substrings matched against ActionGeo_FullName. A row
#                admitted ONLY by a preset token (no built-in AOR token) must also
#                fall inside that preset's bbox, so loose tokens like ", india" or
#                "korea" cannot leak Indiana / Koreatown rows into live.json.
#   theater      theater id written to each row's "theater" field
#   bbox         tuple of (south, west, north, east) boxes for that theater
#   precedence   "first" = checked BEFORE the built-in BBOX (wins overlaps),
#                "last"  = checked AFTER it (built-in theaters win overlaps)
#   place_check  (substring, lat, lon, maxd) like PLACE_CHECK; coords are
#                OpenStreetMap/Nominatim city points cross-checked against the
#                GDELT/GNS geocode for the same name
#   generic      first-toponym strings dropped like GENERIC (country-level rows)
#   centroids    (lat, lon) rounded to 0.1 deg, dropped like CENTROIDS; values are
#                GDELT's own country-level (ActionGeo_Type=1) coordinates
#   noise        actor names dropped like NOISE
# Rows from every preset are still CLAIM; nothing here changes confidence.
# ---------------------------------------------------------------------------
PRESETS: tuple[dict, ...] = (
    # ---- PRIORITY (Chief of Staff order: Sudan, Ethiopia, Yemen) ----
    {
        "id": "sudan",
        "label": "Sudan (refines the built-in sudan theater; no new box)",
        "enabled": True,
        "aor": (),  # "sudan" is already a built-in AOR token
        "theater": "sudan",
        "bbox": (),  # built-in BBOX["sudan"] already covers it
        "precedence": "last",
        "place_check": (
            ("khartoum", 15.56, 32.53, 1.0),
            ("omdurman", 15.64, 32.48, 1.0),
            ("fasher", 13.62, 25.36, 1.0),  # catches GDELT "Fasher, Kassala" mis-geocode
            ("nyala", 12.05, 24.88, 1.0),
            ("obeid", 13.18, 30.22, 1.0),
            ("port sudan", 19.62, 37.21, 1.0),
        ),
        "generic": ("south sudan",),
        "centroids": ((16.0, 30.0), (8.0, 30.0)),  # GDELT SU, OD
        "noise": (),
    },
    {
        "id": "ethiopia",
        "label": "Ethiopia (Tigray / Amhara / Oromia)",
        "enabled": True,
        "aor": ("tigray", "amhara", "oromia"),  # "ethiopia" is already built-in
        "theater": "ethiopia",
        # Two boxes so the theater stops short of Yemen (42.6E) and stays out
        # of most of eastern Sudan (west edge 36.0E). Known overlaps: Sudan's
        # Gallabat/Hamdayet border strip (36.0-36.6E), southern Eritrea below
        # 14.9N, Djibouti, Somaliland. Western Ethiopia (Gambela, Asosa < 36E)
        # stays in the built-in sudan box.
        "bbox": (
            (3.4, 36.0, 12.0, 48.0),
            (12.0, 36.0, 14.9, 42.4),
        ),
        "precedence": "first",  # else sudan (west of 39E) / energy (>=12N) win
        "place_check": (
            ("addis ab", 9.04, 38.75, 1.0),
            ("mekel", 13.50, 39.48, 1.0),
            ("gondar", 12.61, 37.47, 1.0),
            ("bahir dar", 11.59, 37.39, 1.0),
        ),
        "generic": ("ethiopia",),
        "centroids": ((8.0, 38.0),),  # GDELT ET
        "noise": (),
    },
    {
        "id": "yemen",
        "label": "Yemen / Red Sea / Bab el-Mandeb",
        "enabled": True,
        "aor": (),  # "yemen" is already built-in
        "theater": "yemen",
        # Mainland (Sanaa, Aden, Hodeidah, Marib, Red Sea + Bab el-Mandeb coast)
        # plus Socotra. West edge 42.6E keeps Saudi Jizan (42.55E) in "energy".
        # Known overlaps: Saudi Najran/Sharurah (<17.5N), Eritrea's Assab coast
        # (42.6-43E), Djibouti's far north.
        "bbox": (
            (12.0, 42.6, 17.5, 53.1),
            (12.0, 53.1, 12.8, 54.6),
        ),
        "precedence": "first",  # every yemen-box point is inside "energy" today
        "place_check": (
            ("sanaa", 15.35, 44.21, 1.0),
            ("hodeid", 14.80, 42.95, 1.0),
            ("hudayd", 14.80, 42.95, 1.0),
            ("marib", 15.46, 45.32, 1.0),
            # No "aden": substring also hits in-AOR "Ogaden, , Ethiopia".
        ),
        "generic": (),  # "yemen" and its centroid are already built-in
        "centroids": (),
        "noise": (),
    },
    # ---- PLACEHOLDER CANDIDATES (Sitrep picks the final list) ----
    {
        "id": "taiwan",
        "label": "Taiwan Strait",
        "enabled": False,
        "aor": ("taiwan", "fujian"),
        "theater": "taiwan",
        "bbox": ((21.5, 117.5, 26.6, 122.5),),
        "precedence": "last",
        "place_check": (
            ("taipei", 25.04, 121.56, 1.0),
            ("kaohsiung", 22.62, 120.31, 1.0),
        ),
        "generic": ("taiwan",),
        "centroids": ((24.0, 121.0),),  # GDELT TW
        "noise": (),
    },
    {
        "id": "korea",
        "label": "Korean Peninsula",
        "enabled": False,
        "aor": ("north korea", "south korea"),
        "theater": "korea",
        "bbox": ((33.0, 124.0, 43.1, 131.0),),
        "precedence": "last",
        "place_check": (
            ("pyongyang", 39.02, 125.75, 1.0),
            ("seoul", 37.57, 126.98, 1.0),
        ),
        "generic": ("north korea", "south korea"),
        "centroids": ((40.0, 127.0), (37.0, 127.5)),  # GDELT KN, KS
        "noise": (),
    },
    {
        "id": "kashmir",
        "label": "India-Pakistan / Kashmir (LoC)",
        "enabled": False,
        "aor": ("jammu", "kashmir", "ladakh", ", india"),  # "pakistan" is built-in
        "theater": "kashmir",
        # Tight box so Islamabad/Rawalpindi (<73.3E) and Lahore (<32.25N) stay
        # afpak; Sialkot (32.5N 74.5E) would move to kashmir.
        "bbox": ((32.25, 73.3, 37.1, 80.5),),
        "precedence": "first",  # else afpak (to 75.5E) swallows most of the LoC
        "place_check": (
            ("srinagar", 34.07, 74.82, 1.0),
            # No "jammu" (also matches "Jammu and Kashmir" ADM1 rows) and no
            # "muzaffarabad" (GDELT also has a Muzaffarabad in Punjab, 30.1N 71.4E).
        ),
        "generic": ("india",),
        "centroids": ((20.0, 77.0),),  # GDELT IN
        "noise": (),
    },
    {
        "id": "essequibo",
        "label": "Venezuela-Guyana (Essequibo)",
        "enabled": False,
        "aor": ("venezuela", "guyana"),
        "theater": "essequibo",
        "bbox": ((0.6, -73.4, 12.2, -56.4),),
        "precedence": "last",
        "place_check": (
            ("caracas", 10.51, -66.91, 1.0),
            ("georgetown", 6.80, -58.15, 1.0),
        ),
        "generic": ("venezuela", "guyana"),
        "centroids": ((8.0, -66.0), (5.0, -59.0)),  # GDELT VE, GY
        "noise": (),
    },
    {
        "id": "kivu",
        "label": "DRC-Rwanda (eastern Congo / Goma)",
        "enabled": False,
        "aor": ("democratic republic of the congo", "rwanda"),
        "theater": "kivu",
        "bbox": ((-4.5, 27.0, 2.5, 31.0),),
        "precedence": "last",
        "place_check": (
            ("goma", -1.67, 29.23, 1.0),
            ("bukavu", -2.51, 28.86, 1.0),
            ("kigali", -1.95, 30.11, 1.0),
        ),
        "generic": ("democratic republic of the congo", "rwanda"),
        "centroids": ((0.0, 25.0), (-2.0, 30.0)),  # GDELT CG, RW
        "noise": (),
    },
    {
        "id": "kosovo",
        "label": "Serbia-Kosovo",
        "enabled": False,
        "aor": ("kosovo", "serbia"),
        "theater": "kosovo",
        "bbox": ((41.8, 18.8, 46.2, 23.1),),
        "precedence": "first",  # built-in ukraine box starts at 44N 22E
        "place_check": (
            ("pristina", 42.66, 21.16, 1.0),
            ("belgrade", 44.82, 20.45, 1.0),
        ),
        "generic": ("kosovo", "serbia"),
        "centroids": ((42.6, 21.0), (44.0, 21.0)),  # GDELT KV (42.583333,21), RI
        "noise": (),
    },
)

_BASE_AOR = AOR
_PRESET_FIRST: list[tuple[str, tuple[float, float, float, float]]] = []
_PRESET_LAST: list[tuple[str, tuple[float, float, float, float]]] = []
_PRESET_GATES: list[tuple[tuple[str, ...], tuple[tuple[float, float, float, float], ...]]] = []
ACTIVE_PRESETS: tuple[str, ...] = ()


def _in_boxes(boxes, lat: float, lon: float) -> bool:
    return any(s <= lat <= n and w <= lon <= e for s, w, n, e in boxes)


def preset_gate(location: str, lat: float, lon: float) -> bool:
    """A row admitted only by a preset token must sit inside that preset's bbox."""
    if not _PRESET_GATES:
        return True
    n = (location or "").lower()
    if any(token in n for token in _BASE_AOR):
        return True
    return any(
        any(token in n for token in tokens) and _in_boxes(boxes, lat, lon)
        for tokens, boxes in _PRESET_GATES
    )


def _apply_presets() -> None:
    global AOR, PLACE_CHECK, ACTIVE_PRESETS
    wanted = {
        part.strip().lower()
        for part in os.environ.get("WATCHFLOOR_PRESETS", "").split(",")
        if part.strip()
    }
    known = {preset["id"] for preset in PRESETS}
    for bad in sorted(wanted - known):
        log(f"WATCHFLOOR_PRESETS: unknown preset '{bad}' ignored")
    for preset in PRESETS:
        if not (preset["enabled"] or preset["id"] in wanted):
            continue
        boxes = tuple(preset["bbox"])
        for s, w, n, e in boxes:
            assert s < n and w < e, f"bad bbox in preset {preset['id']}"
        assert preset["precedence"] in ("first", "last"), preset["id"]
        assert boxes or not preset["aor"], f"preset {preset['id']} has tokens but no bbox"
        AOR = AOR + tuple(t for t in preset["aor"] if t not in AOR)
        PLACE_CHECK = PLACE_CHECK + tuple(preset["place_check"])
        GENERIC.update(preset["generic"])
        CENTROIDS.update(preset["centroids"])
        NOISE.update(preset["noise"])
        target = _PRESET_FIRST if preset["precedence"] == "first" else _PRESET_LAST
        target.extend((preset["theater"], box) for box in boxes)
        if preset["aor"]:
            _PRESET_GATES.append((tuple(preset["aor"]), boxes))
        ACTIVE_PRESETS += (preset["id"],)
    if ACTIVE_PRESETS:
        log(f"region presets active: {', '.join(ACTIVE_PRESETS)}")


_apply_presets()


def fetch_export_url() -> str:
    with urlopen(LASTUPDATE, timeout=30) as response:
        text = response.read().decode("utf-8", "ignore")
    for line in text.splitlines():
        line = line.strip()
        if line.endswith(".export.CSV.zip"):
            return line.split(" ")[-1]
    raise RuntimeError("no GDELT export URL")


def fetch_rows(url: str) -> list[list[str]]:
    with urlopen(url, timeout=60) as response:
        data = response.read()
    with zipfile.ZipFile(io.BytesIO(data)) as archive:
        name = archive.namelist()[0]
        with archive.open(name) as handle:
            text = handle.read().decode("utf-8", "ignore")
    return list(csv.reader(io.StringIO(text), delimiter="\t"))


def window_hours() -> float:
    raw = os.environ.get("WATCHFLOOR_WINDOW_HOURS", "").strip()
    if not raw:
        return WINDOW_HOURS_DEFAULT
    try:
        hours = float(raw)
    except ValueError:
        hours = float("nan")
    if not 0 < hours <= WINDOW_HOURS_MAX:
        log(f"WATCHFLOOR_WINDOW_HOURS={raw!r} invalid; using {WINDOW_HOURS_DEFAULT:g}")
        return WINDOW_HOURS_DEFAULT
    return hours


def window_urls(latest_url: str, hours: float) -> list[str]:
    """Newest-first export URLs covering `hours`, stepping back 15 min from latest."""
    base, name = latest_url.rsplit("/", 1)
    try:
        stamp = datetime.strptime(name[:14], "%Y%m%d%H%M%S")
    except ValueError:
        return [latest_url]
    count = max(1, int(round(hours * 4)))
    return [
        f"{base}/{(stamp - EXPORT_STEP * i).strftime('%Y%m%d%H%M%S')}{name[14:]}"
        for i in range(count)
    ]


def fetch_rows_retry(url: str, deadline: float | None = None) -> list[list[str]] | None:
    """One export, retried once; a 404, second failure or spent budget is skipped."""
    error: Exception | None = None
    for attempt in (1, 2):
        if deadline is not None and time.monotonic() > deadline:
            error = error or TimeoutError(f"fetch budget {FETCH_BUDGET_S:g}s spent")
            break
        try:
            return fetch_rows(url)
        except HTTPError as exc:
            error = exc
            if exc.code == 404:
                break
        except Exception as exc:  # noqa: BLE001
            error = exc
        if attempt == 1:
            time.sleep(RETRY_DELAY_S)
    log(f"skip export {url}: {error}")
    return None


def fetch_window(urls: list[str]) -> list[list[list[str]]]:
    """Fetch exports (newest first, small concurrency). Raises if every one failed."""
    deadline = time.monotonic() + FETCH_BUDGET_S
    with ThreadPoolExecutor(max_workers=max(1, min(FETCH_WORKERS, len(urls)))) as pool:
        results = list(pool.map(lambda u: fetch_rows_retry(u, deadline), urls))
    exports = [rows for rows in results if rows is not None]
    if not exports:
        raise RuntimeError(f"all {len(urls)} GDELT exports failed")
    return exports


def rows_from_exports(exports: list[list[list[str]]]) -> list[list[str]]:
    """Merge exports newest-first; a GLOBALEVENTID already seen in a newer export
    is dropped, so the latest version wins. Rows within one export are untouched."""
    seen: set[str] = set()
    merged: list[list[str]] = []
    for export in exports:
        ids: set[str] = set()
        for row in export:
            key = row[0] if row else None
            if key is not None and key in seen:
                continue
            merged.append(row)
            if key is not None:
                ids.add(key)
        seen |= ids
    return merged


def from_gdelt_row(row: list[str]) -> dict | None:
    if len(row) < 61:
        return None
    event_type = CODE_TYPE.get(row[27])
    if not event_type:
        return None
    try:
        mentions = int(row[31])
    except (ValueError, IndexError):
        mentions = 0
    if mentions < 3:
        return None
    actor1 = (row[6] or "").strip()
    actor2 = (row[16] or "").strip()
    if actor1 in NOISE or actor2 in NOISE:
        return None
    try:
        lat = float(row[56])
        lon = float(row[57])
    except (ValueError, IndexError):
        return None
    if lat == 0 and lon == 0:
        return None
    location = row[52] or "Unknown"
    if not in_aor(location):
        return None
    if not coords_match_place(location, lat, lon) or not preset_gate(location, lat, lon):
        return None
    try:
        dt = datetime.strptime(row[1], "%Y%m%d").replace(tzinfo=timezone.utc)
    except (ValueError, IndexError):
        return None
    if dt < datetime.now(timezone.utc) - timedelta(days=3):
        return None
    origin = infer_origin(actor1, actor2, lat, lon)
    return {
        "id": f"gdelt-{row[0]}",
        "dtg": dt.strftime("%d %b").upper(),
        "date": dt.strftime("%Y-%m-%d"),
        "location": location.split(",")[0][:48],
        "fact": f"{event_type.upper()}  {actor1 or '?'} → {actor2 or '?'}  ({mentions} mentions)",
        "source": "GDELT",
        "confidence": "CLAIM",
        "priority": "PRI-2" if event_type == "strike" else "PRI-3",
        "lat": round(lat, 4),
        "lon": round(lon, 4),
        "event_type": event_type,
        "theater": theater_for(lat, lon),
        "origin": origin,
        "url": row[60] or None,
    }


def from_globe_event(raw: dict) -> dict | None:
    event_type = raw.get("event_type")
    if event_type not in {"strike", "shelling", "blockade"}:
        return None
    location = raw.get("location_name") or "Unknown"
    if not in_aor(location):
        return None
    try:
        lat = float(raw["lat"])
        lon = float(raw["lon"])
        dt = datetime.strptime(str(raw.get("date")), "%Y-%m-%d").replace(
            tzinfo=timezone.utc
        )
    except (KeyError, TypeError, ValueError):
        return None
    if dt < datetime.now(timezone.utc) - timedelta(days=3):
        return None
    actor1 = raw.get("actor1") or ""
    actor2 = raw.get("actor2") or ""
    if actor1 in NOISE or actor2 in NOISE:
        return None
    if not coords_match_place(location, lat, lon) or not preset_gate(location, lat, lon):
        return None
    origin = infer_origin(actor1, actor2, lat, lon)
    return {
        "id": raw.get("id") or f"globe-{lat}-{lon}",
        "dtg": dt.strftime("%d %b").upper(),
        "date": dt.strftime("%Y-%m-%d"),
        "location": location.split(",")[0][:48],
        "fact": f"{event_type.upper()}  {actor1 or '?'} → {actor2 or '?'}",
        "source": "GDELT",
        "confidence": "CLAIM",
        "priority": "PRI-2" if event_type == "strike" else "PRI-3",
        "lat": round(lat, 4),
        "lon": round(lon, 4),
        "event_type": event_type,
        "theater": theater_for(lat, lon),
        "origin": origin,
        "url": raw.get("source_url"),
    }


def dedupe(events: list[dict]) -> list[dict]:
    seen: set[tuple] = set()
    uniq: list[dict] = []
    for event in events:
        key = (
            event["date"],
            event["event_type"],
            round(event["lat"], 2),
            round(event["lon"], 2),
        )
        if key in seen:
            continue
        seen.add(key)
        uniq.append(event)
    uniq.sort(key=lambda item: item["date"], reverse=True)
    return uniq[:250]


def write_payload(events: list[dict]) -> None:
    payload = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "note": "GDELT NLP overlay. All rows CLAIM. Not radar. Not a targeting product.",
        "events": events,
    }
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    tmp = OUT + ".tmp"
    with open(tmp, "w", encoding="utf-8") as handle:
        json.dump(payload, handle, indent=2)
    os.replace(tmp, OUT)
    log(f"wrote {len(events)} live events to {OUT}")


def main() -> int:
    events: list[dict] = []
    try:
        url = fetch_export_url()
        log(f"export {url}")
        hours = window_hours()
        urls = window_urls(url, hours)
        exports = fetch_window(urls)
        rows = rows_from_exports(exports)
        log(f"window {hours:g}h: {len(exports)}/{len(urls)} exports")
        log(f"raw rows {len(rows)}")
        events = [item for row in rows if (item := from_gdelt_row(row))]
    except Exception as exc:  # noqa: BLE001
        log(f"live GDELT fetch failed: {exc}")
        if os.path.exists(FALLBACK):
            log(f"falling back to {FALLBACK}")
            with open(FALLBACK, encoding="utf-8") as handle:
                globe = json.load(handle)
            events = [
                item
                for raw in globe.get("events", [])
                if (item := from_globe_event(raw))
            ]
        elif os.path.exists(OUT):
            log("keeping previous live.json")
            return 0
        else:
            return 1

    write_payload(dedupe(events))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
