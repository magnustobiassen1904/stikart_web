// Ruteregister — legg til nye ruter her.
//
// 1. Legg GPX-fila i routes/  (fra Strava, Garmin, Outdooractive, Gaia …)
// 2. Legg til en oppføring under med navn, vanskelighet og beskrivelse.
// difficulty: "gronn" | "rod" | "sort"
//
// TODO (Magnus): De fire rutene under er hentet fra kommunens kartdata og
// har ikke navn i kildedataene. Døp dem om til de faktiske navnene
// (Gulesva, Saksen 1/2/3, Telefonløypa, Afterbike, Gruvesafari, Heimaten …)
// etter hvert som de riktige GPX-sporene kommer på plass.

const ROUTES = [
  {
    file: "routes/telefonlopa.gpx",
    name: "Telefonløypa",
    difficulty: "rod",
    description:
      "Nedfart fra ca. 590 til 380 moh, 1,9 km. Ekte GPX fra Strava-løpetur " +
      "2024-08-29, matchet mot OSM-stien Telefonløypa (mtb-grad 2). " +
      "Vanskelighet foreløpig satt til rød — bekreft.",
  },
  {
    file: "routes/kommune_sykkelsti_1.gpx",
    name: "Sykkelrute på sti (kommunedata)",
    difficulty: "rod",
    description: "Merket sykkelrute på sti fra kommunens friluftskart. Skal erstattes/døpes om.",
  },
  {
    file: "routes/kommune_sykkelvei_1.gpx",
    name: "Sykkelrute på vei 1 (kommunedata)",
    difficulty: "gronn",
    description: "Merket sykkelrute på vei fra kommunens friluftskart.",
  },
  {
    file: "routes/kommune_sykkelvei_2.gpx",
    name: "Sykkelrute på vei 2 (kommunedata)",
    difficulty: "gronn",
    description: "Merket sykkelrute på vei fra kommunens friluftskart.",
  },
  {
    file: "routes/kommune_sykkelvei_3.gpx",
    name: "Sykkelrute på vei 3 (kommunedata)",
    difficulty: "gronn",
    description: "Merket sykkelrute på vei fra kommunens friluftskart.",
  },
];
