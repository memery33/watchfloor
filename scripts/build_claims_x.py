#!/usr/bin/env python3
"""Build the Overview X claims feed (public/data/claims_x.json).

  python3 scripts/build_claims_x.py posts.jsonl [more.jsonl ...]
  python3 scripts/build_claims_x.py path/to/directory

Reads JSONL exports of public posts (one JSON object per line). A directory is
walked for *.jsonl files. Handles must be in HANDLES; every permalink is pinned
to https://x.com/<handle>/status/<digits> and the status id is taken from that
URL segment. Keeps original and quote posts. Drops plain reposts, replies, and
empty excerpts. Drops duplicate status ids, then keeps the 50 newest posts per
account.

Does not call the X API, does not geocode, and does not copy full post text.
Stdlib only. Refresh is manual: rerun this script and commit the JSON.
"""
from __future__ import annotations

import html
import json
import os
import re
import sys
from datetime import datetime, timezone
from urllib.parse import urlparse

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "public", "data", "claims_x.json")

KEEP_TYPES = {"original", "quote"}
EXCERPT_MAX = 140  # UTF-16 code units, same as a JavaScript string length
POST_CAP = 50  # per account, applied after status-id dedupe
# Config list. A row whose permalink handle is not here is dropped.
HANDLES = (
    "hey_itsmyturn",
    "GeoConfirmed",
    "sentdefender",
    "Osinttechnical",
    "Faytuks",
    "NOELreports",
)
HANDLE_SET = set(HANDLES)
# X wraps outbound links as https://t.co/... . The left boundary stops "not.co" / "at.co" hits.
TCO = re.compile(r"\b(?:https?://)?t\.co/\S+", re.IGNORECASE)
STATUS_ID = re.compile(r"[0-9]+")
# twitter.com is accepted only so it can be rewritten to the x.com shape.
ALIAS_HOSTS = {"x.com", "twitter.com", "mobile.twitter.com"}


def utf16_len(text: str) -> int:
    return sum(2 if ord(ch) > 0xFFFF else 1 for ch in text)


def take_utf16(text: str, limit: int) -> str:
    used = 0
    out: list[str] = []
    for ch in text:
        width = 2 if ord(ch) > 0xFFFF else 1
        if used + width > limit:
            break
        out.append(ch)
        used += width
    return "".join(out)


def utc_z(raw: str) -> str:
    dt = datetime.fromisoformat(str(raw).replace("Z", "+00:00"))
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    dt = dt.astimezone(timezone.utc).replace(microsecond=0)
    return dt.strftime("%Y-%m-%dT%H:%M:%SZ")


def excerpt(text: str) -> str:
    cleaned = html.unescape(text or "")
    cleaned = re.sub(r"\s+", " ", TCO.sub(" ", cleaned)).strip()
    if utf16_len(cleaned) <= EXCERPT_MAX:
        return cleaned
    cut = take_utf16(cleaned, EXCERPT_MAX - 1).rstrip()
    space = cut.rfind(" ")
    if space >= 0 and utf16_len(cut[:space]) >= 90:
        cut = cut[:space].rstrip()
    if utf16_len(cut) > EXCERPT_MAX - 1:
        cut = take_utf16(cut, EXCERPT_MAX - 1).rstrip()
    if not cut:
        return ""
    return cut + "…"


def post_url(raw: object) -> tuple[str, str, str] | None:
    """Return (canonical url, handle, status id) or None. Id comes from the URL path."""
    if not isinstance(raw, str) or not raw.strip():
        return None
    try:
        parts = urlparse(raw.strip())
    except ValueError:
        return None
    if parts.scheme != "https":
        return None
    host = parts.netloc.lower().removeprefix("www.")
    if host not in ALIAS_HOSTS:
        return None
    segs = [s for s in parts.path.split("/") if s]
    if len(segs) != 3 or segs[1] != "status":
        return None
    handle = segs[0]
    status_id = segs[2]
    if handle not in HANDLE_SET or STATUS_ID.fullmatch(status_id) is None:
        return None
    url = f"https://x.com/{handle}/status/{status_id}"
    return url, handle, status_id


def collect_paths(args: list[str]) -> list[str]:
    found: list[str] = []
    for arg in args:
        if os.path.isdir(arg):
            for dirpath, _dirnames, filenames in os.walk(arg):
                for name in sorted(filenames):
                    if name.endswith(".jsonl"):
                        found.append(os.path.join(dirpath, name))
        elif os.path.isfile(arg):
            found.append(arg)
        else:
            raise SystemExit(f"not a file or directory: {arg}")
    return found


def build(paths: list[str]) -> dict:
    # (handle, status id) -> post. First write wins until a newer created_at replaces it.
    best: dict[tuple[str, str], dict] = {}
    dropped = {"repost": 0, "reply": 0, "other": 0, "bad": 0, "empty": 0}
    for path in paths:
        with open(path, encoding="utf-8") as fh:
            for line in fh:
                line = line.strip()
                if not line:
                    continue
                row = json.loads(line)
                kind = row.get("type")
                if kind not in KEEP_TYPES:
                    key = kind if kind in ("repost", "reply") else "other"
                    dropped[key] += 1
                    continue
                parsed = post_url(row.get("url"))
                raw_created = row.get("created_at")
                if parsed is None or not isinstance(raw_created, str) or not raw_created.strip():
                    dropped["bad"] += 1
                    continue
                url, handle, status_id = parsed
                try:
                    created_at = utc_z(raw_created)
                except ValueError:
                    dropped["bad"] += 1
                    continue
                text = excerpt(str(row.get("text") or ""))
                if not text:
                    dropped["empty"] += 1
                    continue
                if utf16_len(text) > EXCERPT_MAX:
                    raise SystemExit(f"excerpt longer than {EXCERPT_MAX} UTF-16 units: {status_id}")
                post = {
                    "id": status_id,
                    "url": url,
                    "created_at": created_at,
                    "handle": handle,
                    "type": kind,
                    "excerpt": text,
                    "confidence": "CLAIM",
                }
                slot = (handle, status_id)
                prev = best.get(slot)
                if prev is None or created_at > prev["created_at"]:
                    best[slot] = post
    posts: list[dict] = []
    for handle in HANDLES:
        rows = [post for (h, _sid), post in best.items() if h == handle]
        rows.sort(key=lambda p: (p["created_at"], p["id"]), reverse=True)
        posts.extend(rows[:POST_CAP])
    posts.sort(key=lambda p: (p["created_at"], p["id"]), reverse=True)
    now = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    return {
        "generated_at": now,
        "handles": list(HANDLES),
        "note": "Unverified single-source X posts. Not corroborated, not plotted.",
        "posts": posts,
        "_dropped": dropped,
    }


def main() -> int:
    if len(sys.argv) < 2:
        print(
            "usage: python3 scripts/build_claims_x.py posts.jsonl [more.jsonl ...]",
            file=sys.stderr,
        )
        print("       python3 scripts/build_claims_x.py path/to/directory", file=sys.stderr)
        return 2
    paths = collect_paths(sys.argv[1:])
    if not paths:
        print("no jsonl files found", file=sys.stderr)
        return 2
    payload = build(paths)
    dropped = payload.pop("_dropped")
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, "w", encoding="utf-8") as fh:
        json.dump(payload, fh, ensure_ascii=False, indent=2)
        fh.write("\n")
    kinds: dict[str, int] = {}
    per_handle: dict[str, int] = {}
    for post in payload["posts"]:
        kinds[post["type"]] = kinds.get(post["type"], 0) + 1
        per_handle[post["handle"]] = per_handle.get(post["handle"], 0) + 1
    newest = payload["posts"][0]["created_at"] if payload["posts"] else "none"
    counts = ", ".join(f"{handle}={per_handle.get(handle, 0)}" for handle in HANDLES)
    print(
        f"wrote {OUT}: {len(payload['posts'])} posts {kinds}; per account {counts}; "
        f"dropped reposts={dropped['repost']} replies={dropped['reply']} "
        f"other={dropped['other']} empty={dropped['empty']} bad={dropped['bad']}; newest {newest}"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
