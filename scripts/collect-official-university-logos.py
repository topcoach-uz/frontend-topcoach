"""Discover logo candidates referenced by the universities' own homepages.

This creates a review manifest, not a set of approved logos. A site's header
can contain a campaign, faculty, or anniversary mark, so candidates must be
checked before they are displayed as the university's official logo.
"""

from __future__ import annotations

import argparse
import json
import re
import urllib.error
import urllib.parse
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import date
from html.parser import HTMLParser
from pathlib import Path

import openpyxl


class ImageParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.images: list[dict[str, str]] = []
        self.stack: list[str] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        data = dict(attrs)
        if tag in {"header", "nav", "main", "footer"}:
            self.stack.append(tag)
        if tag == "img":
            self.images.append({
                "src": data.get("src") or data.get("data-src") or "",
                "alt": data.get("alt") or "",
                "class": data.get("class") or "",
                "context": "/".join(self.stack),
            })

    def handle_endtag(self, tag: str) -> None:
        if tag in {"header", "nav", "main", "footer"} and tag in self.stack:
            del self.stack[len(self.stack) - 1 - self.stack[::-1].index(tag)]


def score_image(image: dict[str, str], university_name: str) -> int:
    src = image["src"].lower()
    alt = image["alt"].lower()
    css_class = image["class"].lower()
    name = university_name.lower()
    short_name = re.sub(r"\b(university|college|institute|of|the|technology|and)\b", "", name).strip()
    score = 0
    if "logo" in src or "logo" in css_class:
        score += 4
    if "logo" in alt:
        score += 5
    if alt.strip() == name or (len(short_name) >= 4 and alt.strip() == short_name):
        score += 3
    if "header" in image["context"] or "nav" in image["context"]:
        score += 2
    if src.endswith(".svg"):
        score += 1
    if any(term in src for term in ("partner", "sponsor", "footer", "anniversary")):
        score -= 5
    if any(term in alt for term in ("partner", "sponsor", "anniversary")):
        score -= 5
    return score


def discover(row: dict[str, str]) -> dict[str, object]:
    result: dict[str, object] = {**row, "checkedAt": date.today().isoformat(), "candidates": []}
    website = row["website"]
    if not website.startswith(("http://", "https://")):
        result["error"] = "Missing official website URL"
        return result
    try:
        request = urllib.request.Request(website, headers={"User-Agent": "Mozilla/5.0 TopCoachLogoResearch/1.0"})
        with urllib.request.urlopen(request, timeout=12) as response:
            if "text/html" not in response.headers.get("Content-Type", ""):
                result["error"] = "Homepage is not HTML"
                return result
            final_url = response.url
            html = response.read(2_000_000).decode("utf-8", "replace")
        parser = ImageParser()
        parser.feed(html)
        candidates = []
        for image in parser.images:
            if not image["src"] or image["src"].startswith(("data:", "blob:")):
                continue
            candidate_url = urllib.parse.urljoin(final_url, image["src"])
            if not candidate_url.startswith("https://"):
                continue
            score = score_image(image, row["name"])
            looks_like_logo = "logo" in (image["src"] + image["alt"] + image["class"]).lower() or (image["alt"].lower().strip() == row["name"].lower() and image["src"].lower().endswith(".svg"))
            if score >= 5 and looks_like_logo:
                candidates.append({"url": candidate_url, "alt": image["alt"], "score": score, "context": image["context"]})
        result["sourcePage"] = final_url
        result["candidates"] = sorted(candidates, key=lambda item: -item["score"])[:5]
    except (urllib.error.URLError, TimeoutError, ValueError) as error:
        result["error"] = str(error)[:180]
    return result


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("workbook", type=Path)
    parser.add_argument("output", type=Path)
    parser.add_argument("--limit", type=int, default=300)
    args = parser.parse_args()
    sheet = openpyxl.load_workbook(args.workbook, read_only=True, data_only=True).active
    universities = []
    for record in sheet.iter_rows(min_row=2, max_col=6, values_only=True):
        rank, name, _country, region, city, website = record
        if isinstance(rank, int) and name:
            universities.append({"rank": rank, "name": str(name).strip(), "region": str(region or ""), "city": str(city or ""), "website": str(website or "").strip()})
        if len(universities) >= args.limit:
            break
    results = []
    with ThreadPoolExecutor(max_workers=12) as executor:
        futures = {executor.submit(discover, row): row for row in universities}
        for future in as_completed(futures):
            results.append(future.result())
    results.sort(key=lambda row: row["rank"])
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(results, ensure_ascii=False, indent=2) + "\n")
    print(f"Scanned {len(results)} university homepages; {sum(bool(row['candidates']) for row in results)} have logo candidates; {sum('error' in row for row in results)} had fetch errors.")


if __name__ == "__main__":
    main()
