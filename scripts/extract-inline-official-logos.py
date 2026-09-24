"""Preserve institutional SVGs embedded in official university headers."""

from __future__ import annotations

import json
import re
import urllib.request
from datetime import date
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
RESEARCH = json.loads((ROOT / "research/university-logo-markup-review.json").read_text())
CATALOGUE = json.loads((ROOT / "research/university-logo-unmatched.json").read_text())
SITES = {row["name"]: row for row in RESEARCH}
IDS = {row["name"]: row["id"] for row in CATALOGUE}
TARGETS = {
    "Imperial College London": ("imperial-college-london", "header__logo"),
    "ETH Zurich": ("eth-zurich", "main-eth-logo"),
    "University of Illinois at Urbana-Champaign": ("illinois-urbana-champaign", "logoTitle"),
    "University of Leeds": ("university-of-leeds", "uol-logo--inline"),
    "Freie Universität Berlin": ("freie-universitat-berlin", "fu-logo"),
    "Carnegie Mellon University": ("carnegie-mellon", "Header__logo"),
    "University of Copenhagen": ("university-of-copenhagen", "logo-link"),
    "Brown University": ("brown-university", "icon_logo"),
}


def main() -> None:
    output_dir = ROOT / "public/official-university-logos"
    output_dir.mkdir(parents=True, exist_ok=True)
    records = []
    for name, (slug, marker) in TARGETS.items():
        source_page = SITES[name].get("sourcePage")
        if not source_page:
            continue
        try:
            request = urllib.request.Request(source_page, headers={"User-Agent": "Mozilla/5.0"})
            with urllib.request.urlopen(request, timeout=12) as response:
                html = response.read(2_000_000).decode("utf-8", "replace")
            matches = re.finditer(r"<svg\b[^>]*>.*?</svg>", html, re.I | re.S)
            chosen = None
            for match in matches:
                svg = match.group()
                opener = svg[:svg.find(">") + 1]
                context = html[max(0, match.start() - 300):match.start()]
                if marker not in opener and marker not in context:
                    continue
                if "<path" not in svg.lower() or re.search(r"<script|<foreignobject|(?:href|src)=[\"']https?://", svg, re.I):
                    continue
                chosen = svg
                break
            if not chosen:
                print(f"Skipped {name}: no standalone SVG with paths")
                continue
            if "xmlns=" not in chosen[:chosen.find(">")]:
                chosen = chosen.replace("<svg", '<svg xmlns="http://www.w3.org/2000/svg"', 1)
            if "xlink:" in chosen and "xmlns:xlink=" not in chosen[:chosen.find(">")]:
                chosen = chosen.replace("<svg", '<svg xmlns:xlink="http://www.w3.org/1999/xlink"', 1)
            (output_dir / f"{slug}.svg").write_text(chosen + "\n")
            records.append({"id": IDS[name], "name": name, "logoUrl": f"/official-university-logos/{slug}.svg", "sourcePage": source_page, "checkedAt": date.today().isoformat(), "matchedBy": "official homepage inline SVG"})
        except (OSError, ValueError) as error:
            print(f"Skipped {name}: {error}")
    (ROOT / "research/inline-university-logos.json").write_text(json.dumps(records, ensure_ascii=False, indent=2) + "\n")
    print(f"Extracted {len(records)} official-site SVGs")


if __name__ == "__main__":
    main()
