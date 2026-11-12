#!/usr/bin/env python3
"""Build the Overview X claims feed (public/data/claims_x.json).

  python3 scripts/build_claims_x.py posts.jsonl

Reads a JSONL export of public posts from @hey_itsmyturn (one JSON object per
line) and writes short excerpts only. Keeps original and quote posts. Drops
plain reposts and replies. Newest first.

Does not call the X API, does not geocode, and does not copy full post text.
Stdlib only. Refresh is manual: rerun this script and commit the JSON.
"""
from __future__ import annotations

import json
import os
import re
import sys
from datetime import datetime, timezone
from urllib.parse import urlparse

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "public", "data", "claims_x.json")

KEEP_TYPES = {"original", "quote"}
EXCERPT_MAX = 140
# X wraps outbound links as https://t.co/... . Drop those, keep the words.
TCO = re.compile(r"(?:https?://)?t\.co/\S+", re.IGNORECASE)
HOSTS = {"x.com", "twitter.com", "mobile.twitter.com"}


def utc_z(raw: str) -> str:
    dt = datetime.fromisoformat(str(raw).replace("Z", "+00:00"))
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    dt = dt.astimezone(timezone.utc).replace(microsecond=0)
    return dt.strftime("%Y-%m-%dT%H:%M:%SZ")


def excerpt(text: str) -> str:
    cleaned = re.sub(r"\s+", " ", TCO.sub(" ", text or "")).strip()
    if len(cleaned) <= EXCERPT_MAX:
        return cleaned
    cut = cleaned[: EXCERPT_MAX - 1].rstrip()
    space = cut.rfind(" ")
    if space >= 90:
        cut = cut[:space].rstrip()
    if len(cut) > EXCERPT_MAX - 1:
        cut = cut[: EXCERPT_MAX - 1].rstrip()
    return cut + "…"


def post_url(raw: object) -> tuple[str, str] | None:
    if not isinstance(raw, str) or not raw.strip():
        return None
    try:
        parts = urlparse(raw.strip())
    except ValueError:
        return None
    if parts.scheme != "https":
        return None
    host = parts.netloc.lower().removeprefix("www.")
    if host not in HOSTS:
        return None
    segs = [s for s in parts.path.split("/") if s]
    if len(segs) < 3 or segs[1] != "status" or not segs[0]:
        return None
    return f"https://{host}{parts.path}", segs[0]


def build(path: str) -> dict:
    posts = []
    dropped = {"repost": 0, "reply": 0, "other": 0, "bad": 0}
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
            if parsed is None or not row.get("id") or not row.get("created_at"):
                dropped["bad"] += 1
                continue
            url, handle = parsed
            text = excerpt(str(row.get("text") or ""))
            if len(text) > EXCERPT_MAX:
                raise SystemExit(f"excerpt longer than {EXCERPT_MAX}: {row.get('id')}")
            posts.append(
                {
                    "id": str(row["id"]),
                    "url": url,
                    "created_at": utc_z(str(row["created_at"])),
                    "handle": handle,
                    "type": kind,
                    "excerpt": text,
                    "confidence": "CLAIM",
                }
            )
    posts.sort(key=lambda p: (p["created_at"], p["id"]), reverse=True)
    now = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    return {
        "generated_at": now,
        "handle": "hey_itsmyturn",
        "note": "Unverified single-source X posts. Not corroborated, not plotted.",
        "posts": posts,
        "_dropped": dropped,
    }


def main() -> int:
    if len(sys.argv) != 2:
        print("usage: python3 scripts/build_claims_x.py posts.jsonl", file=sys.stderr)
        return 2
    payload = build(sys.argv[1])
    dropped = payload.pop("_dropped")
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, "w", encoding="utf-8") as fh:
        json.dump(payload, fh, ensure_ascii=False, indent=2)
        fh.write("\n")
    kinds: dict[str, int] = {}
    for post in payload["posts"]:
        kinds[post["type"]] = kinds.get(post["type"], 0) + 1
    newest = payload["posts"][0]["created_at"] if payload["posts"] else "none"
    print(
        f"wrote {OUT}: {len(payload['posts'])} posts {kinds}; "
        f"dropped reposts={dropped['repost']} replies={dropped['reply']} "
        f"other={dropped['other']} bad={dropped['bad']}; newest {newest}"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
