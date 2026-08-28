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
    718: "gruvaasen_st_anger.gpx",
    4527: "bakerommen.gpx",
    4524: "bergmannsstien.gpx",
    6203: "knuteveien.gpx",
    # Gruveåsen/Funkelia/Saggrenda-utvidelsen (godkjent 2026-08-28)
    4526: "knoffemyrstien.gpx",
    5888: "knoffemyr_flyt.gpx",
    7393: "knoffemyr_enduro.gpx",
    4891: "helvetesdalen.gpx",
    4846: "justitsen.gpx",
    6202: "tommerrenna.gpx",
    6611: "saggrenda_spesial.gpx",
    4918: "malmkleiva.gpx",
    4917: "henchensetra.gpx",
    1214: "sachsen_granatdammen.gpx",
    4525: "speiderroa_1.gpx",
    4528: "speiderroa_2.gpx",
    4529: "speiderroa_3.gpx",
    4533: "speiderroa_opp.gpx",
    4531: "hogda.gpx",
    1211: "rundtjern_storaasen.gpx",
    4530: "tangentjern_rundtjern.gpx",
    4916: "perslokka_rundvann.gpx",
    1242: "briskemyrrunden.gpx",
    # Østsiden: Madsebakken/Langevann/Sulusåsen (godkjent 2026-08-28)
    4892: "lailastien.gpx",
    850: "langevannstoppen.gpx",
    4536: "langevannstoppen_opp.gpx",
    5292: "langevann_enduro.gpx",
    5317: "langevannskleiva.gpx",
    4896: "kampestad.gpx",
    4895: "kampestad_travers.gpx",
    4893: "fugleplassen.gpx",
    4897: "fugleplassen_ovre.gpx",
    4894: "sulusaasen.gpx",
    5523: "afc.gpx",
}

trails = json.load(open(DATA))


def write_gpx(filename, name, desc, pts):
    lines = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<gpx version="1.1" creator="stikart_web trailguide-snapshot" xmlns="http://www.topografix.com/GPX/1/1">',
        f" <trk><name>{name}</name><desc>{desc}</desc><trkseg>",
    ]
    for p in pts:
        ele = f'<ele>{p["alt"]:.1f}</ele>' if p.get("alt") is not None else ""
        lines.append(f'  <trkpt lat="{p["lat"]:.6f}" lon="{p["lng"]:.6f}">{ele}</trkpt>')
    lines.append(" </trkseg></trk></gpx>")
    open(os.path.join(ROUTES, filename), "w").write("\n".join(lines))
    print(f"{filename}: {name} ({len(pts)} pkt)")


for t in trails:
    seq = t.get("sequence")
    if seq not in SELECTED:
        continue
    name = t["name"]["def"].strip()
    alt = t.get("altitude", {})
    desc = (
        f"Fra Trailguide (trailguide.net), gradering: {t.get('color')}. "
        f"{t.get('meters', '?')} m, {alt.get('descent', '?')} m nedfart."
    )
    write_gpx(SELECTED[seq], name, desc, t["latlng"]["points"])

# korsveien.gpx lages IKKE her — grusveien gjennom slalåmbakken kommer fra OSM,
# se tools/korsveien_fra_osm.py. (Trailguides «Korsvei»-spor følger andre traséer.)
