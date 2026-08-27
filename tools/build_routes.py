#!/usr/bin/env python3
"""Konverterer kommunens sykkelrute-GeoJSON til GPX-filer med ekte høydedata.

Bruk:  python3 tools/build_routes.py
Leser  data/sykkelrute_sti.geojson og data/sykkelrute_vei.geojson
Skriver routes/*.gpx (én fil per rute)

Høydedata hentes fra Kartverkets åpne API (ws.geonorge.no/hoydedata).
Kjøres på nytt hvis kildedataene oppdateres. Egne GPX-spor (fra Strava,
Garmin, Outdooractive osv.) legges bare rett i routes/ og registreres
i js/routes.js — de trenger ikke dette verktøyet.
"""
import json
import time
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
HOYDE_API = "https://ws.geonorge.no/hoydedata/v1/punkt"
BATCH = 50


def elevations(coords):
    """Slår opp høyde (moh.) for en liste [lon, lat]-punkter, i bolker."""
    out = []
    for i in range(0, len(coords), BATCH):
        chunk = coords[i:i + BATCH]
        punkter = json.dumps([[round(c[0], 6), round(c[1], 6)] for c in chunk])
        url = f"{HOYDE_API}?koordsys=4258&geojson=false&punkter={urllib.parse.quote(punkter)}"
        with urllib.request.urlopen(url, timeout=30) as resp:
            data = json.load(resp)
        out.extend(p.get("z") or 0 for p in data["punkter"])
        time.sleep(0.2)  # høflig mot gratis-API-et
    return out


def write_gpx(name, coords, elevs, outfile):
    pts = "\n".join(
        f'      <trkpt lat="{lat:.6f}" lon="{lon:.6f}"><ele>{ele:.1f}</ele></trkpt>'
        for (lon, lat), ele in zip(coords, elevs)
    )
    gpx = f'''<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="stikart_web" xmlns="http://www.topografix.com/GPX/1/1">
  <trk>
    <name>{name}</name>
    <trkseg>
{pts}
    </trkseg>
  </trk>
</gpx>
'''
    outfile.write_text(gpx, encoding="utf-8")
    print(f"  {outfile.relative_to(ROOT)}  ({len(coords)} punkter)")


def load_lines(path):
    feats = json.loads(path.read_text())["features"]
    lines = []
    for ft in feats:
        g = ft["geometry"]
        if g["type"] == "LineString":
            lines.append((ft["properties"], g["coordinates"]))
        elif g["type"] == "MultiLineString":
            for part in g["coordinates"]:
                lines.append((ft["properties"], part))
    return lines


def main():
    routes_dir = ROOT / "routes"
    routes_dir.mkdir(exist_ok=True)

    sti = load_lines(ROOT / "data" / "sykkelrute_sti.geojson")
    vei = load_lines(ROOT / "data" / "sykkelrute_vei.geojson")
    vei = [l for l in vei if len(l[1]) >= 20]
    vei.sort(key=lambda x: len(x[1]), reverse=True)

    jobs = [("kommune_sykkelsti_1", "Sykkelrute på sti (kommunedata)", sti[0][1])]
    for n, (props, coords) in enumerate(vei[:3], start=1):
        jobs.append((f"kommune_sykkelvei_{n}",
                     f"Sykkelrute på vei {n} (kommunedata)", coords))

    for slug, name, coords in jobs:
        print(f"Henter høydedata: {name} ...")
        elevs = elevations(coords)
        write_gpx(name, coords, elevs, routes_dir / f"{slug}.gpx")


if __name__ == "__main__":
    main()
