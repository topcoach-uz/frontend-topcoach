"""Build a conservative, source-backed subset from the logo review manifest."""

from __future__ import annotations

import argparse
import json
import urllib.error
import urllib.parse
import urllib.request
import http.client
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path


EXCLUDED_NAMES = {
    # The workbook still calls this Tokyo Institute of Technology while its
    # site now identifies as Institute of Science Tokyo.
    "Tokyo Institute of Technology",
    # This is the admissions office lockup rather than the institutional mark.
    "University of Technology, Malaysia",
    # Anniversary lockup, not the university's primary mark.
    "University of Buenos Aires",
}


def check_asset(item: dict) -> dict | None:
    if not item["candidates"]:
        return None
    candidate = item["candidates"][0]
    url = urllib.parse.quote(candidate["url"], safe=":/?&=%#@,+")
    if "logo" not in url.lower():
        return None
    if not any(part in candidate["context"] for part in ("header", "nav")):
        return None
    if item["name"] in EXCLUDED_NAMES:
        return None
    try:
        request = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(request, timeout=12) as response:
            content_type = response.headers.get("Content-Type", "").lower()
            if not (content_type.startswith("image/") or ("svg" in url.lower() and "xml" in content_type)):
                return None
            response.read(128)
        return {
            "rank": item["rank"],
            "name": item["name"],
            "logoUrl": url,
            "sourcePage": item["sourcePage"],
            "checkedAt": item["checkedAt"],
            "darkBackground": any(word in url.lower() for word in ("white", "reversed", "negative", "inverse", "-ko.", "-light", "-blanc")),
        }
    except (OSError, TimeoutError, ValueError, http.client.HTTPException):
        return None


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("input", type=Path)
    parser.add_argument("output", type=Path)
    args = parser.parse_args()
    rows = json.loads(args.input.read_text())
    with ThreadPoolExecutor(max_workers=12) as executor:
        logos = [item for item in executor.map(check_asset, rows) if item]
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(logos, ensure_ascii=False, indent=2) + "\n")
    print(f"{len(logos)} official-site header logos passed image and source checks; {len(rows) - len(logos)} need review.")


if __name__ == "__main__":
    main()
