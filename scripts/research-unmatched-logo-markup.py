"""Find logo markup missed by the first-pass <img> collector."""

from __future__ import annotations

import argparse
import difflib
import json
import re
import urllib.request
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path


def inspect(university: dict, workbook_rows: list[dict]) -> dict:
    same_rank = [row for row in workbook_rows if row["rank"] == university["rank"]]
    if not same_rank:
        return {**university, "error": "No workbook source"}
    source = max(same_rank, key=lambda row: difflib.SequenceMatcher(None, university["name"].lower(), row["name"].lower()).ratio())
    output = {**university, "website": source["website"], "workbookName": source["name"]}
    try:
        request = urllib.request.Request(source["website"], headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(request, timeout=12) as response:
            html = response.read(2_000_000).decode("utf-8", "replace")
            output["sourcePage"] = response.url
        # The strongest signal is an inline SVG used as the site's own logo.
        svg_tags = re.findall(r"<svg\b[^>]{0,700}>", html, re.I)
        output["inlineLogoSvg"] = [tag[:500] for tag in svg_tags if re.search(r"logo|logotype|brand", tag, re.I)][:3]
        # Include raw contexts so a reviewer can distinguish a university mark
        # from partner, faculty, campaign, and footer images.
        contexts = []
        for match in list(re.finditer("logo", html, re.I))[:80]:
            text = re.sub(r"\s+", " ", html[max(0, match.start() - 130):match.start() + 800])
            if any(token in text for token in ("src=", "href=", "url(")):
                contexts.append(text[:900])
        output["logoMarkup"] = contexts[:12]
    except (OSError, ValueError) as error:
        output["error"] = str(error)[:160]
    return output


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("unmatched", type=Path)
    parser.add_argument("workbook_scan", type=Path)
    parser.add_argument("output", type=Path)
    args = parser.parse_args()
    unmatched = json.loads(args.unmatched.read_text())
    workbook_rows = json.loads(args.workbook_scan.read_text())
    with ThreadPoolExecutor(max_workers=12) as executor:
        results = list(executor.map(lambda row: inspect(row, workbook_rows), unmatched))
    args.output.write_text(json.dumps(results, ensure_ascii=False, indent=2) + "\n")
    print(f"Inspected {len(results)} sites; {sum(bool(row.get('inlineLogoSvg')) for row in results)} include an inline logo SVG; {sum('error' in row for row in results)} were unavailable.")


if __name__ == "__main__":
    main()
