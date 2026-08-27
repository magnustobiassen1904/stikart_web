"""Konverterer utvalgte Trailguide-spor (data/trailguide_kongsberg.json) til GPX i routes/.

Datakilde: trailguide.net sitt åpne kart-API (samme data som vises gratis på
trailguide.net). Snapshot lagret lokalt — ingen live-avhengighet.
Kjør på nytt hvis utvalget under endres.
"""
import json, os

HERE = os.path.dirname(os.path.abspath(__file__))
DATA = os.path.join(HERE, "..", "data", "trailguide_kongsberg.json")
ROUTES = os.path.join(HERE, "..", "routes")

# sequence -> filnavn
SELECTED = {
    4535: "gule_sva.gpx",
    4794: "sachsen_2.gpx",
    848: "sachsen_3.gpx",
    1213: "jernbordet.gpx",
    2051: "gruvesafari.gpx",
    4532: "storaasen_afterbike.gpx",
    6201: "telefonlopa_helt_ned.gpx",
}

trails = json.load(open(DATA))
for t in trails:
    seq = t.get("sequence")
    if seq not in SELECTED:
        continue
    name = t["name"]["def"].strip()
    pts = t["latlng"]["points"]
    alt = t.get("altitude", {})
    desc = (
        f"Fra Trailguide (trailguide.net), gradering: {t.get('color')}. "
        f"{t.get('meters', '?')} m, {alt.get('descent', '?')} m nedfart."
    )
    lines = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<gpx version="1.1" creator="stikart_web trailguide-snapshot" xmlns="http://www.topografix.com/GPX/1/1">',
        f" <trk><name>{name}</name><desc>{desc}</desc><trkseg>",
    ]
    for p in pts:
        ele = f'<ele>{p["alt"]:.1f}</ele>' if p.get("alt") is not None else ""
        lines.append(f'  <trkpt lat="{p["lat"]:.6f}" lon="{p["lng"]:.6f}">{ele}</trkpt>')
    lines.append(" </trkseg></trk></gpx>")
    out = os.path.join(ROUTES, SELECTED[seq])
    open(out, "w").write("\n".join(lines))
    print(f"{SELECTED[seq]}: {name} ({len(pts)} pkt, {t.get('color')})")
