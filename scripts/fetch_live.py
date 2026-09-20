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
import zipfile
from datetime import datetime, timedelta, timezone
from urllib.request import urlopen

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "public", "data", "live.json")
FALLBACK = os.path.expanduser(
    "~/conflict-globe/public/data/events.json"
)
LASTUPDATE = "http://data.gdeltproject.org/gdeltv2/lastupdate.txt"

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
    "west bank",
    "palestine",
    "gaza",
)
NOISE = {"POLICE", "DISTRICT COURT", "COURT", "UN SECURITY COUNCIL"}
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
}


def log(msg: str) -> None:
    print(f"[{datetime.now(timezone.utc).isoformat()}] {msg}", flush=True)


def in_aor(text: str) -> bool:
    n = (text or "").lower()
    return any(token in n for token in AOR)


def theater_for(lat: float, lon: float) -> str:
    for tid, (south, west, north, east) in BBOX.items():
        if south <= lat <= north and west <= lon <= east:
            return tid
    return "overview"


def infer_origin(actor1: str, actor2: str, lat: float, lon: float) -> dict | None:
    blob = f"{actor1} {actor2}".upper()
    for keys, label, olat, olon in ORIGINS:
        if any(key in blob for key in keys):
            if abs(olat - lat) + abs(olon - lon) < 1.5:
                return None
            return {"name": label, "lat": olat, "lon": olon, "inferred": True}
    return None


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
    if actor1 in NOISE and not in_aor(actor2):
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
        rows = fetch_rows(url)
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
