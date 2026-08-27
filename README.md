# Stikart Kongsberg (stikart_web)

Enkel nettside med interaktivt kart over sykkelbare stier rundt Kongsberg
(Gruveåsen / Knuteområdet). Ingen backend, ingen brukerdata — bare statiske
filer som kan hostes gratis (f.eks. GitHub Pages).

## Kjøre lokalt

```bash
cd stikart_web
python3 -m http.server 8080
```

Åpne <http://localhost:8080>. (Å åpne `index.html` direkte fra Finder virker
ikke — nettleseren nekter å lese GPX/GeoJSON-filene fra disk.)

## Legge til en ny rute

1. Last ned turen som GPX (Strava: aktiviteten → ⋯ → «Export GPX».
   Garmin Connect: aktiviteten → tannhjul → «Eksporter til GPX».
   Outdooractive/Gaia: eksporter rute som GPX.)
2. Legg fila i `routes/`
3. Registrer den i `js/routes.js` med navn, vanskelighet
   (`gronn`/`rod`/`sort`) og beskrivelse.

Lengde, stigning og høydeprofil beregnes automatisk fra GPX-fila.

## Datakilder

- **Bakgrunnskart:** Kartverket topo (standard) og OpenStreetMap — begge åpne.
- **Punkter og merkede ruter:** Kongsberg kommunes åpne karttjeneste
  «Friluftsliv i Gruveåsen» (gapahuker, bålplasser, benker, merkede
  sykkelruter). Lastet ned som snapshot til `data/`.
- **Høydedata:** Kartverkets åpne høyde-API (ws.geonorge.no/hoydedata),
  brukt av `tools/build_routes.py`.

## Verktøy

- `tools/build_routes.py` — konverterer kommunens sykkelrute-GeoJSON til
  GPX med ekte høydedata. Kun nødvendig for kommunerutene; egne GPX-spor
  legges rett i `routes/`.
