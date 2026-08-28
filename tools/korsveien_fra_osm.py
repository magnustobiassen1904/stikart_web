"""Genererer routes/korsveien.gpx fra OSM-veien «Korsveien» (data/korsveien_osm.json).

Grusveien Korsveien går fra byen, tvers gjennom slalåmbakken i Funkelia og
videre opp til Korset-monumentet — dette er transportetappen, i motsetning til
stien «Gamle Korsvei» som går gjennom skogen sør for bakken.

Høyder hentes live fra Kartverkets høydedata-API (ws.geonorge.no).
Kjør på nytt hvis geometrien i snapshotten endres.
"""
import json, math, os, urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
DATA = os.path.join(HERE, "..", "data", "korsveien_osm.json")
OUT = os.path.join(HERE, "..", "routes", "korsveien.gpx")

# Veikjeden by -> Korset (OSM way-id-er i rekkefølge)
CHAIN = [34964032, 373250117, 1112733231, 373250116]
KORSET = (59.65406, 9.60564)  # monumentet — traseen klippes her

ways = {e["id"]: e["geometry"] for e in json.load(open(DATA))["elements"] if "geometry" in e}

pts = []
for wid in CHAIN:
    seg = [(p["lat"], p["lon"]) for p in ways[wid]]
    if pts and math.dist(pts[-1], seg[-1]) < math.dist(pts[-1], seg[0]):
        seg.reverse()
    pts.extend(seg if not pts else seg[1:])

# Klipp ved punktet nærmest Korset
cut = min(range(len(pts)), key=lambda i: math.dist(pts[i], KORSET))
pts = pts[: cut + 1]

# Høyder fra Kartverket, 40 punkter per kall
eles = []
for i in range(0, len(pts), 40):
    batch = pts[i : i + 40]
    q = json.dumps([[p[1], p[0]] for p in batch], separators=(",", ":"))
    url = f"https://ws.geonorge.no/hoydedata/v1/punkt?punkter={q}&koordsys=4258&geojson=false"
    res = json.load(urllib.request.urlopen(url))
    eles.extend(p["z"] for p in res["punkter"])

lines = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<gpx version="1.1" creator="stikart_web osm+kartverket" xmlns="http://www.topografix.com/GPX/1/1">',
    " <trk><name>Korsveien til Korset</name>"
    "<desc>Grusveien Korsveien fra byen, gjennom slalåmbakken, opp til Korset. "
    "Geometri: OSM. Høyder: Kartverket.</desc><trkseg>",
]
for (lat, lon), ele in zip(pts, eles):
    lines.append(f'  <trkpt lat="{lat:.6f}" lon="{lon:.6f}"><ele>{ele:.1f}</ele></trkpt>')
lines.append(" </trkseg></trk></gpx>")
open(OUT, "w").write("\n".join(lines))

dist = sum(
    math.hypot((b[0] - a[0]) * 111320, (b[1] - a[1]) * 56000) for a, b in zip(pts, pts[1:])
)
print(f"korsveien.gpx: {len(pts)} pkt, {dist/1000:.1f} km, {min(eles):.0f}-{max(eles):.0f} moh")
