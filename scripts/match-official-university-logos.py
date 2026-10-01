"""Match official-site logos to current catalogue IDs conservatively.

Only exact names, explicit aliases, or strong name+QS-rank agreement are used.
Ambiguous records remain unmatched for editorial review.
"""

from __future__ import annotations

import argparse
from datetime import date
import difflib
import json
import re
import unicodedata
import urllib.request
from pathlib import Path


ALIASES = {
    "ucl": "University College London",
    "epfl ecole polytechnique federale de lausanne": "Swiss Federal Institute of Technology Lausanne, EPFL",
    "the london school of economics and political science lse": "London School of Economics",
    "ludwig maximilians universitat munchen": "University of Mnchen",
    "trinity college dublin the university of dublin": "Trinity College Dublin",
    "nanyang technological university singapore ntu singapore": "Nanyang Technological University",
}

MANUAL_LOGOS = {
    "harvard university": (
        "https://www.harvard.edu/wp-content/themes/core/assets/img/theme/branding-assets/footer-logo.svg",
        "https://www.harvard.edu/",
    ),
    "peking university": (
        "https://www.pku.edu.cn/Uploads/Picture/2019/12/26/s5e04147ee4a83.png",
        "https://www.pku.edu.cn/",
    ),
    "tsinghua university": (
        "https://www.tsinghua.edu.cn/image/logo180.png",
        "https://www.tsinghua.edu.cn/",
    ),
    "universite psl": (
        "https://www.psl.eu/themes/custom/oooooo/assets/images/Header-150x61.svg",
        "https://www.psl.eu/",
    ),
    "fudan university": (
        "https://www.fudan.edu.cn/_upload/site/00/02/2/logo.png",
        "https://www.fudan.edu.cn/",
    ),
    "the hong kong university of science and technology": (
        "https://hkust.edu.hk/sites/default/files/2026-01/Standard%2035A%20Logo%20-%20FC%20%28B%29%20English.png",
        "https://hkust.edu.hk/",
    ),
    "universidad de buenos aires uba": (
        "https://www.uba.ar/imgs/logofooter.png",
        "https://www.uba.ar/",
    ),
    "lund university": (
        "https://www.lunduniversity.lu.se/sites/www.lunduniversity.lu.se/files/Lund_university_L_CMYK.svg",
        "https://www.lunduniversity.lu.se/",
    ),
    "the university of western australia": (
        "https://static.weboffice.uwa.edu.au/visualid/devcore/1/_assets/img/uwacrest-small-white.svg",
        "https://www.uwa.edu.au/home",
    ),
    "universidade de sao paulo": (
        "https://www5.usp.br/wp-content/uploads/usp-2018.png?x34176",
        "https://www5.usp.br/",
    ),
    "university of cambridge": (
        "https://www.cam.ac.uk/themes/custom/fresh/images/interface/cambridge_university2.svg",
        "https://www.cam.ac.uk/",
    ),
    "university of pennsylvania": (
        "https://www.upenn.edu/themes/custom/penn_starter/assets/img/UPenn-logo.svg",
        "https://www.upenn.edu/",
    ),
    "technical university of munich": (
        "https://www.tum.de/typo3conf/ext/in2template/Resources/Public/Images/Backend/tum-logo.svg",
        "https://www.tum.de/",
    ),
    "the university of tokyo": (
        "https://www.u-tokyo.ac.jp/content/400244322.svg",
        "https://www.u-tokyo.ac.jp/",
    ),
    "king s college london": (
        "https://www.kcl.ac.uk/SiteElements/2017/images/kcl-logo.svg",
        "https://www.kcl.ac.uk/",
    ),
    "northwestern university": (
        "https://common.northwestern.edu/v9/css/images/northwestern.svg",
        "https://www.northwestern.edu/",
    ),
    "ku leuven": (
        "https://stijl.kuleuven.be/releases/latest/img/svg/logo.svg",
        "https://www.kuleuven.be/",
    ),
    "universite paris saclay": (
        "https://www.universite-paris-saclay.fr/sites/default/files/media/2019-12/logo-ups-white_1.svg",
        "https://www.universite-paris-saclay.fr/",
    ),
    "university of glasgow": (
        "https://www.gla.ac.uk/3t4/img/ug-keyline.svg",
        "https://www.gla.ac.uk/",
    ),
    "purdue university": (
        "https://www.purdue.edu/home/wp-content/themes/purdue-home-theme-beta/imgs/PU-V.svg",
        "https://www.purdue.edu/",
    ),
    "pennsylvania state university": (
        "https://images.ctfassets.net/p7x3ai5plaz1/1wVBvFkhF0ArrdaMlzLiCi/125b0659267cacef241e88b5517a51eb/logotype.svg",
        "https://www.psu.edu/",
    ),
    "pontificia universidad catolica de chile uc": (
        "https://www.uc.cl/site/templates/dist/images/logo-uc-wh.svg",
        "https://www.uc.cl/",
    ),
    "universidad nacional autonoma de mexico unam": (
        "https://www.unam.mx/sites/all/themes/unam/logo.png",
        "https://www.unam.mx/",
    ),
    "rwth aachen university": (
        "https://www.rwth-aachen.de/global/show_picture.asp?id=aaaaaaaaaaagazb",
        "https://www.rwth-aachen.de/",
    ),
}


def normalize(name: str) -> str:
    ascii_name = unicodedata.normalize("NFKD", name).encode("ascii", "ignore").decode().lower()
    return re.sub(r"[^a-z0-9]+", " ", ascii_name).strip()


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("manifest", type=Path)
    parser.add_argument("output", type=Path)
    parser.add_argument("--api", default="http://localhost:3000/api/university?_start=0&_end=100&_sort=rankings")
    args = parser.parse_args()
    logos = json.loads(args.manifest.read_text())
    by_name = {normalize(item["name"]): item for item in logos}
    by_rank: dict[int, list[dict]] = {}
    for item in logos:
        by_rank.setdefault(item["rank"], []).append(item)
    with urllib.request.urlopen(args.api, timeout=15) as response:
        universities = json.load(response)["data"]
    matched = []
    unmatched = []
    for university in universities:
        name = university["name"].strip()
        normalized = normalize(name)
        rank = next((item.get("rank") for item in university.get("rankings", []) if item.get("type") == "QS"), None)
        manual = MANUAL_LOGOS.get(normalized)
        if manual:
            try:
                with urllib.request.urlopen(urllib.request.Request(manual[0], headers={"User-Agent": "Mozilla/5.0"}), timeout=12) as response:
                    if not response.headers.get("Content-Type", "").lower().startswith("image/"):
                        raise ValueError("Logo URL is not an image")
                    response.read(128)
                matched.append({"id": university["id"], "name": name, "logoUrl": manual[0], "sourcePage": manual[1], "checkedAt": date.today().isoformat(), "darkBackground": any(word in manual[0].lower() for word in ("white", "-wh.", "-white", "blanc")), "matchedBy": "official homepage review"})
            except (OSError, ValueError):
                unmatched.append({"id": university["id"], "name": name, "rank": rank})
            continue
        chosen = by_name.get(normalized) or by_name.get(normalize(ALIASES.get(normalized, "")))
        match_type = "name"
        if not chosen and rank in by_rank:
            candidate = max(by_rank[rank], key=lambda item: difflib.SequenceMatcher(None, normalized, normalize(item["name"])).ratio())
            if difflib.SequenceMatcher(None, normalized, normalize(candidate["name"])).ratio() >= 0.75:
                chosen = candidate
                match_type = "name and QS rank"
        if chosen:
            matched.append({"id": university["id"], "name": name, **{key: chosen[key] for key in ("logoUrl", "sourcePage", "checkedAt", "darkBackground")}, "matchedBy": match_type})
        else:
            unmatched.append({"id": university["id"], "name": name, "rank": rank})
    inline_file = Path(__file__).resolve().parents[1] / "research/inline-university-logos.json"
    if inline_file.exists():
        inline = json.loads(inline_file.read_text())
        existing_ids = {row["id"] for row in matched}
        matched.extend(row for row in inline if row["id"] not in existing_ids)
        matched_ids = {row["id"] for row in matched}
        unmatched = [row for row in unmatched if row["id"] not in matched_ids]
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(matched, ensure_ascii=False, indent=2) + "\n")
    args.output.with_name("university-logo-unmatched.json").write_text(json.dumps(unmatched, ensure_ascii=False, indent=2) + "\n")
    print(f"Matched {len(matched)} of {len(universities)} catalogue IDs; {len(unmatched)} require logo research or identity review.")


if __name__ == "__main__":
    main()
