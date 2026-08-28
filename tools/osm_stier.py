"""Genererer GPX for stier hentet fra OSM (snapshot i data/osm_stier.json).

Brukes for stier som ikke finnes på Trailguide (f.eks. Eriksløypa).
Way-id-ene i CHAINS kjedes sammen i rekkefølge (retning snus automatisk),
og høyder hentes live fra Kartverkets høydedata-API.
"""
import json, math, os, urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
DATA = os.path.join(HERE, "..", "data", "osm_stier.json")
ROUTES = os.path.join(HERE, "..", "routes")

# filnavn -> (navn, [way-id-er i rekkefølge])
CHAINS = {
    "eriksloypa.gpx": ("Eriksløypa", [452833212, 452833216, 399465039, 172805789]),
}

ways = {e["id"]: e["geometry"] for e in json.load(open(DATA))["elements"] if "geometry" in e}


def heights(pts):
    eles = []
    for i in range(0, len(pts), 40):
        batch = pts[i : i + 40]
        q = json.dumps([[p[1], p[0]] for p in batch], separators=(",", ":"))
        url = f"https://ws.geonorge.no/hoydedata/v1/punkt?punkter={q}&koordsys=4258&geojson=false"
        res = json.load(urllib.request.urlopen(url))
        eles.extend(p["z"] for p in res["punkter"])
    return eles


def write_gpx(filename, name, pts, eles):
    lines = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<gpx version="1.1" creator="stikart_web osm+kartverket" xmlns="http://www.topografix.com/GPX/1/1">',
        f" <trk><name>{name}</name><desc>Geometri: OSM. Høyder: Kartverket.</desc><trkseg>",
    ]
    for (lat, lon), ele in zip(pts, eles):
        lines.append(f'  <trkpt lat="{lat:.6f}" lon="{lon:.6f}"><ele>{ele:.1f}</ele></trkpt>')
    lines.append(" </trkseg></trk></gpx>")
    open(os.path.join(ROUTES, filename), "w").write("\n".join(lines))
    dist = sum(
        math.hypot((b[0] - a[0]) * 111320, (b[1] - a[1]) * 56000) for a, b in zip(pts, pts[1:])
    )
    print(f"{filename}: {name}, {len(pts)} pkt, {dist/1000:.1f} km, {min(eles):.0f}-{max(eles):.0f} moh")


# Ruter definert som ferdige punktlister (fra graf-søk over OSM-nettet),
# se data/osm_stier_ruter.json. Heimaten er en UBEKREFTET kandidat etter
# Magnus' beskrivelse — bekreftes av kompisen.
for filename, (name, pts) in json.load(
    open(os.path.join(HERE, "..", "data", "osm_stier_ruter.json"))
).items():
    pts = [tuple(p) for p in pts]
    write_gpx(filename, name, pts, heights(pts))

for filename, (name, chain) in CHAINS.items():
    pts = []
    for wid in chain:
        seg = [(p["lat"], p["lon"]) for p in ways[wid]]
        if pts and math.dist(pts[-1], seg[-1]) < math.dist(pts[-1], seg[0]):
            seg.reverse()
        elif not pts and len(chain) > 1:
            # snu første segment så det peker mot neste
            nxt = [(p["lat"], p["lon"]) for p in ways[chain[1]]]
            if min(math.dist(seg[0], q) for q in (nxt[0], nxt[-1])) < min(
                math.dist(seg[-1], q) for q in (nxt[0], nxt[-1])
            ):
                seg.reverse()
        pts.extend(seg if not pts else seg[1:])
    eles = heights(pts)
    lines = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<gpx version="1.1" creator="stikart_web osm+kartverket" xmlns="http://www.topografix.com/GPX/1/1">',
        f" <trk><name>{name}</name><desc>Geometri: OSM. Høyder: Kartverket.</desc><trkseg>",
    ]
    for (lat, lon), ele in zip(pts, eles):
        lines.append(f'  <trkpt lat="{lat:.6f}" lon="{lon:.6f}"><ele>{ele:.1f}</ele></trkpt>')
    lines.append(" </trkseg></trk></gpx>")
    open(os.path.join(ROUTES, filename), "w").write("\n".join(lines))
    dist = sum(
        math.hypot((b[0] - a[0]) * 111320, (b[1] - a[1]) * 56000) for a, b in zip(pts, pts[1:])
    )
    print(f"{filename}: {name}, {len(pts)} pkt, {dist/1000:.1f} km, {min(eles):.0f}-{max(eles):.0f} moh")
